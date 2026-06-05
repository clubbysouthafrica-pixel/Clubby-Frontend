import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2Icon, Code, MessagesSquare, Type, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, useRef } from "react"
import { useEmailerProcessMutation } from "@/mutations/admin/useEmailerMutation"
import { toast } from "sonner"
import ReactQuill, { Quill } from "react-quill-new"
import ImageResize from "@mgreminger/quill-image-resize-module"
import "react-quill-new/dist/quill.snow.css"

if (typeof window !== "undefined" && !Quill.imports["modules/imageResize"]) {
  Quill.register("modules/imageResize", ImageResize)
}

const readClipboardImage = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()

  reader.onload = () => {
    if (typeof reader.result === "string") {
      resolve(reader.result)
      return
    }

    reject(new Error("Could not read pasted image"))
  }

  reader.onerror = () => reject(reader.error ?? new Error("Could not read pasted image"))
  reader.readAsDataURL(file)
})

interface ReusableSendEmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  contactsList: { email: string; name: string; email_opt_in?: boolean }[]
  clubId: string
  onSuccessClose?: () => void
}

export default function ReusableSendEmailDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  contactsList,
  clubId,
  onSuccessClose,
}: ReusableSendEmailDialogProps) {
  const [contactQuery, setContactQuery] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [displaySuccess, setDisplaySuccess] = useState(false)
  const quillRef = useRef<ReactQuill | null>(null)

  const { mutate, isPending, isSuccess: mutationSuccess } = useEmailerProcessMutation()

  useEffect(() => {
    setDisplaySuccess(mutationSuccess)
  }, [mutationSuccess])

  useEffect(() => {
    if (!isOpen) {
      // Reset all state when dialog closes
      setContactQuery("")
      setSubject("")
      setBody("")
      setDisplaySuccess(false)
    }
  }, [isOpen])

  useEffect(() => {
    const editor = quillRef.current?.getEditor()
    if (!editor) {
      return
    }

    const editorRoot = editor.root
    const syncEditorHeight = () => {
      editorRoot.style.height = "auto"
      editorRoot.style.minHeight = "420px"
      editorRoot.style.height = `${Math.max(editorRoot.scrollHeight, 420)}px`
    }

    const handlePaste = async (event: ClipboardEvent) => {
      const clipboardItems = Array.from(event.clipboardData?.items ?? [])
      const imageItems = clipboardItems.filter((item) => item.type.startsWith("image/"))

      if (!imageItems.length) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      let insertAt = editor.getSelection(true)?.index ?? editor.getLength()
      let selectedImageIndex: number | null = null

      for (const imageItem of imageItems) {
        const file = imageItem.getAsFile()
        if (!file) {
          continue
        }

        try {
          const imageSource = await readClipboardImage(file)

          selectedImageIndex = insertAt
          editor.insertEmbed(insertAt, "image", imageSource, "user")
          insertAt += 1
          editor.insertText(insertAt, "\n", "user")
          insertAt += 1
        } catch {
          toast.error("Unable to paste image")
        }
      }

      if (selectedImageIndex !== null) {
        editor.setSelection(selectedImageIndex, 1, "user")
      } else {
        editor.setSelection(insertAt, 0, "silent")
      }
      syncEditorHeight()
    }

    const handleTextChange = () => {
      syncEditorHeight()
    }

    syncEditorHeight()
    editorRoot.addEventListener("paste", handlePaste, true)
    editor.on("text-change", handleTextChange)

    return () => {
      editorRoot.removeEventListener("paste", handlePaste, true)
      editor.off("text-change", handleTextChange)
    }
  }, [isOpen])

  const editorModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
    imageResize: {
      modules: ["Resize", "DisplaySize", "AltText"],
      minWidth: 40,
      overlayStyles: {
        backgroundColor: "transparent",
        border: "2px solid #2563eb",
        boxSizing: "border-box",
        position: "absolute",
        zIndex: "12",
      },
      handleStyles: {
        backgroundColor: "#ffffff",
        border: "2px solid #2563eb",
        borderRadius: "9999px",
        boxSizing: "border-box",
        height: "14px",
        opacity: "1",
        position: "absolute",
        width: "14px",
        zIndex: "13",
      },
      displayStyles: {
        backgroundColor: "#0f172a",
        border: "none",
        boxSizing: "border-box",
        color: "#ffffff",
        cursor: "default",
        font: "12px sans-serif",
        opacity: "0.9",
        padding: "4px 8px",
        position: "absolute",
        textAlign: "center",
        zIndex: "13",
      },
    },
  }

  const send = () => {
    const plain = isHtmlMode ? body.trim() : body.replace(/<[^>]*>/g, "").trim()
    if (!subject || !plain || !contactsList.length) {
      toast.error("Please provide a subject, message content and at least one contact.")
      return
    }

    mutate(
      {
        subject,
        email_body: body,
        emails: contactsList.map((item) => item.email),
        club_account_id: clubId,
        is_html: isHtmlMode,
      },
      {
        onSuccess: () => {
          toast.success("Email broadcast queued successfully")
          setDisplaySuccess(true)
          setTimeout(() => {
            onOpenChange(false)
            onSuccessClose?.()
          }, 500)
        },
        onError: () => toast.error("Something went wrong"),
      }
    )
  }

  const optedOutCount = contactsList.filter((c) => c.email_opt_in !== true).length

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.9),_rgba(248,250,252,0.98)_42%,_rgba(255,255,255,1)_100%)]">
      <div className="min-h-full">
        <div className="border-b border-slate-200/80 bg-white/85 px-4 py-2 backdrop-blur lg:px-8 lg:py-3">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 lg:gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Email page</p>
                <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900 lg:text-2xl">{title}</h2>
                <p className="truncate text-sm text-slate-500 lg:text-base">{description} ({contactsList.length})</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-4 py-3 lg:px-8 lg:py-4">
          <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="flex flex-col rounded-[24px] border border-slate-200 bg-white/92 p-3 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur lg:p-5">
              <div className="grid gap-3 lg:gap-4">
                <div className="grid gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm">
                  <Label htmlFor="subject" className="text-xs font-medium text-slate-700">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-9 rounded-lg border-slate-200 bg-white px-3 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-slate-300"
                  />
                </div>

                <div className="grid gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="text-sm font-medium text-slate-700">Email body</Label>
                    <div className="flex items-center gap-1 self-start rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:self-auto">
                      <button
                        type="button"
                        onClick={() => { setIsHtmlMode(false); setBody("") }}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!isHtmlMode ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        <Type className="h-3.5 w-3.5" />
                        Rich text
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsHtmlMode(true); setBody("") }}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isHtmlMode ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        <Code className="h-3.5 w-3.5" />
                        HTML
                      </button>
                    </div>
                  </div>
                  {isHtmlMode ? (
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Paste or write your HTML here…"
                      className="min-h-[420px] rounded-xl border-slate-200 bg-white font-mono text-sm leading-relaxed shadow-none focus-visible:ring-1 focus-visible:ring-slate-300 lg:min-h-[620px]"
                    />
                  ) : (
                    <ReactQuill
                      ref={quillRef}
                      className="mobile-email-editor rounded-2xl border border-slate-200 bg-white"
                      theme="snow"
                      value={body}
                      onChange={(val: string) => setBody(val)}
                      placeholder="Write your message"
                      modules={editorModules}
                    />
                  )}
                  {!isHtmlMode && (
                    <p className="text-xs text-slate-500">
                      Paste images directly into the message, then click an image to drag its resize handles.
                    </p>
                  )}
                </div>

                {displaySuccess && (
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                    <CheckCircle2Icon color="green" />
                    <AlertTitle className="text-green-800">Successfully sent!</AlertTitle>
                    <AlertDescription>
                      <span>Your email broadcast is being queued. Messages will be sent shortly.</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </section>

            <aside className="flex flex-col rounded-[24px] border border-slate-200 bg-white/92 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur lg:sticky lg:top-4 lg:self-start lg:p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Recipients</p>
                  <h3 className="text-lg font-semibold text-slate-900">Mailing list</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {contactsList.length} selected
                </span>
              </div>
              {optedOutCount > 0 && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-800">
                    {optedOutCount} recipient{optedOutCount === 1 ? "" : "s"} will not receive this email
                  </p>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    {optedOutCount === contactsList.length
                      ? "None of the selected members have opted in to emails."
                      : "These members have not opted in to club emails."}
                  </p>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/80 p-2.5">
                  <Input
                    placeholder="Search for contact"
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    className="h-8 rounded-lg border-slate-200 bg-white text-xs shadow-none focus-visible:ring-1 focus-visible:ring-slate-300"
                  />
                </div>
                <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-100 pr-1 scrollable-list">
                  {contactsList
                    .filter((contact) =>
                      `${contact.name} ${contact.email}`.toLowerCase().includes(contactQuery.toLowerCase())
                    )
                    .map((contact) => {
                      const initials = contact.name
                        .split(" ")
                        .map((namePart) => namePart[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()

                      const canReceive = contact.email_opt_in === true

                      return (
                        <div
                          key={contact.email}
                          className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${canReceive ? "hover:bg-slate-50" : "bg-slate-50/60 opacity-60"}`}
                        >
                          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] text-white shadow-sm ${canReceive ? "bg-slate-900" : "bg-slate-400"}`}>
                            {initials}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium text-sm text-slate-900">{contact.name}</span>
                            <span className="truncate text-xs text-slate-500 sm:text-sm">{contact.email}</span>
                          </div>
                          <div className="ml-auto flex-shrink-0">
                            {canReceive ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 sm:text-xs">
                                Selected
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 sm:text-xs">
                                Opted out
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
                <Button
                  className="h-9 w-full rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800"
                  type="button"
                  disabled={
                    isPending ||
                    displaySuccess ||
                    !subject ||
                    (!isHtmlMode && body === "<p><br></p>") ||
                    (isHtmlMode && !body.trim()) ||
                    !contactsList.length
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    send()
                  }}
                >
                  {isPending ? "Sending..." : "Send email"}
                  <MessagesSquare className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full rounded-lg border-slate-200 text-sm text-slate-700"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </aside>
          </div>

          <style>{`
            .ql-container {
              border: none;
              background: #fff;
              height: auto !important;
              overflow: visible;
              position: relative !important;
              z-index: 0 !important;
              width: 100% !important;
            }
            .mobile-email-editor {
              display: block;
              overflow: visible;
            }
            .ql-toolbar {
              background: linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.92) 100%);
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              padding: 12px;
              position: relative !important;
              z-index: 1;
              border: none;
              border-bottom: 1px solid rgba(148, 163, 184, 0.22);
            }
            .ql-editor {
              background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
              font-size: 15px;
              line-height: 1.75;
              height: auto !important;
              min-height: 420px;
              overflow-y: hidden;
              padding: 18px 20px 24px;
              position: relative !important;
              z-index: 1;
            }
            @media (min-width: 1024px) {
              .ql-editor {
                min-height: 620px;
                font-size: 16px;
                padding: 22px 24px 28px;
              }
            }
            .ql-editor img {
              cursor: pointer;
              height: auto;
              max-width: 100%;
            }
            @media (max-width: 639px) {
              .mobile-email-editor .ql-toolbar {
                padding: 6px;
              }
              .mobile-email-editor .ql-editor {
                min-height: 260px;
                font-size: 12px;
              }
            }
            .scrollable-list::-webkit-scrollbar { width: 8px; }
            .scrollable-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 9999px; }
            .scrollable-list { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.08) transparent; }
          `}</style>
        </div>
      </div>
    </div>
  )
}
