import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"

interface ClubVariable {
    name: string
    key: string
    visible: boolean
}

interface Props {
    template: string
    subject?: string
    clubName: string
    supportEmail: string
    useTemplate: boolean
    setUseTemplate: (value: boolean) => void
    setTemplate: (value: string) => void
    setSubject?: (value: string) => void
    clubVariables?: ClubVariable[]
}

export default function EditableEmailTemplate({
    template,
    subject,
    clubName,
    supportEmail,
    useTemplate,
    setUseTemplate,
    setTemplate,
    setSubject,
    clubVariables = [],
}: Props) {
    const [internalTemplate, setInternalTemplate] = useState(template)
    const [internalSubject, setInternalSubject] = useState(subject || "")

    const quillRef = useRef<any>(null)

    useEffect(() => {
        setInternalTemplate(
            template
                .replace(/{{club_name}}/g, clubName)
                .replace(/{{club_email}}/g, supportEmail)
        )
    }, [template, clubName, supportEmail])

    const handleChange = (val: string) => {
        setInternalTemplate(val)
        setTemplate(val)
    }

    const handleSubjectChange = (val: string) => {
        setInternalSubject(val)
        if (setSubject) {
            setSubject(val)
        }
    }

    const insertVariable = (variableKey: string) => {
        const placeholder = `{{${variableKey}}}`
        const quill = quillRef.current?.getEditor?.()
        if (quill) {
            // Focus the editor to ensure we get the correct cursor position
            quill.focus()
            const selection = quill.getSelection()
            const cursorPosition = selection?.index ?? quill.getLength()
            quill.insertText(cursorPosition, placeholder)
            quill.setSelection(cursorPosition + placeholder.length)
            // Get the updated HTML content from the editor
            const updatedContent = quill.root.innerHTML
            handleChange(updatedContent)
        }
    }

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, variableKey: string) => {
        e.dataTransfer.effectAllowed = "copy"
        e.dataTransfer.setData("variableKey", variableKey)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
    }

    const handleDropOnEditor = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const variableKey = e.dataTransfer.getData("variableKey")
        if (variableKey) {
            const quill = quillRef.current?.getEditor?.()
            if (quill) {
                // Get the drop coordinates
                const dropX = e.clientX
                const dropY = e.clientY
                
                // Find the element at the drop position
                const element = document.elementFromPoint(dropX, dropY)
                
                // If we're in the editor, find the nearest text node and get its index
                const editorElement = quill.root
                if (editorElement && editorElement.contains(element)) {
                    // Create a range at the drop position
                    const range = document.caretRangeFromPoint(dropX, dropY)
                    if (range) {
                        // Get the text node and offset
                        const preCaretRange = range.cloneRange()
                        preCaretRange.selectNodeContents(editorElement)
                        preCaretRange.setEnd(range.endContainer, range.endOffset)
                        const offset = preCaretRange.toString().length
                        const cursorPosition = Math.max(0, offset)
                        
                        const placeholder = `{{${variableKey}}}`
                        quill.insertText(cursorPosition, placeholder)
                        quill.setSelection(cursorPosition + placeholder.length)
                        const updatedContent = quill.root.innerHTML
                        handleChange(updatedContent)
                    }
                } else {
                    // Fallback: just insert at current selection
                    insertVariable(variableKey)
                }
            }
        }
    }

    return (
        <div className="space-y-4 w-full">
            {/* Subject Input */}
            {setSubject && (
                <div className="space-y-2">
                    <Label htmlFor="email-subject" className="text-sm font-medium">
                        Email Subject
                    </Label>
                    <Input
                        id="email-subject"
                        type="text"
                        value={internalSubject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        placeholder="Enter email subject line"
                        className="rounded-lg"
                    />
                </div>
            )}

            {/* Email Body */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Email Body</Label>
                <div
                    onDragOver={handleDragOver}
                    onDrop={handleDropOnEditor}
                    className="space-y-2"
                >
                    <ReactQuill
                        ref={quillRef}
                        className="border rounded-lg"
                        theme="snow"
                        value={internalTemplate}
                        onChange={handleChange}
                        placeholder="Enter content or drag variables below"
                        modules={{
                            toolbar: [
                                [{ header: [1, 2, 3, false] }],
                                ["bold", "italic", "underline", "strike"],
                                [{ list: "ordered" }, { list: "bullet" }],
                                ["link", "clean"],
                            ],
                        }}
                    />
                </div>
            </div>

            {/* Email Variables Section */}
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Email Variables (Drag into email)
                    </Label>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        Drag any variable below into the email body to insert placeholders. These will be filled with actual values when members register.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        draggable
                        onDragStart={(e) => handleDragStart(e, "member_name")}
                        className="px-3 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-sm font-medium rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-move transition-colors shadow-sm"
                        title="Drag to insert {{member_name}}"
                    >
                        Member Name
                    </button>
                    {clubVariables && clubVariables.map((variable) => (
                        <button
                            key={variable.key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, variable.key)}
                            className="px-3 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-sm font-medium rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-move transition-colors shadow-sm"
                            title={`Drag to insert {{${variable.key}}}`}
                        >
                            {variable.name}
                        </button>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                .ql-container {
                    border-radius: 0.5rem;
                }

                .ql-editor {
                    max-height: 300px;
                    overflow-y: auto;
                }
            `}</style>

            <div className="flex items-center gap-2 pt-2">
                <Checkbox
                    id="use-template"
                    checked={useTemplate}
                    onCheckedChange={(checked) => setUseTemplate(!!checked)}
                />
                <label htmlFor="use-template" className="text-sm text-gray-700">
                    Use this email template (⚠️ Using this template results in email charges)
                </label>
            </div>
        </div>
    )
}
