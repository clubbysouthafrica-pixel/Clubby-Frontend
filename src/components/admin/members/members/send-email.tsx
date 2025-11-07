import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useEmailerProcessMutation } from "@/mutations/admin/useEmailerMutation";
import { Input } from "../../../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import { MessagesSquare } from "lucide-react";

interface ImageProps {
  clubId: string;
  contacts: { email: string; name: string }[];
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string }[]>
  >;
  setDeregisterMembers: React.Dispatch<
    React.SetStateAction<{ user_id: string; name: string }[]>
  >;
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SendEmailDialog({
  contacts,
  clubId,
  setlistActionItems,
  setDeregisterMembers,
  setAllMembersSelected,
}: ImageProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    mutate,
    isPending,
    isSuccess: mutationSuccess,
  } = useEmailerProcessMutation();

  useEffect(() => {
    setIsSuccess(mutationSuccess);
  }, [mutationSuccess]);

  const send = () => {
    const plain = body.replace(/<[^>]*>/g, "").trim();
    if (!subject || !plain || !contacts.length) {
      toast.error(
        "Please provide a subject, message content and at least one contact."
      );
      return;
    }

    mutate({
      subject,
      email_body: body,
      emails: contacts.map((item) => item.email),
      club_account_id: clubId,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open && isSuccess) {
      setSubject("");
      setBody("");
      setIsSuccess(false);
      setlistActionItems([]);
      setDeregisterMembers([]);
      setAllMembersSelected(false);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant={"outline"} disabled={!contacts.length}>
              <SendIcon />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send email to selected contacts</p>
        </TooltipContent>
      </Tooltip>
  <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Mailing list ({contacts.length}):
          </DialogDescription>
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div className="p-2">
              <Input
                placeholder="Search for member"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className={`max-h-[80px] overflow-y-auto divide-y divide-gray-100 pr-2 scrollable-list`}>
              {contacts
                .filter((contact) =>
                  `${contact.name} ${contact.email}`.toLowerCase().includes(contactQuery.toLowerCase())
                )
                .map((contact) => {
                const initials = contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={contact.email}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-sm">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {contact.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {contact.email}
                      </span>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        Selected
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 w-full">
          <div className="grid gap-3">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid gap-3 border:none">
            <ReactQuill
              className="border"
              theme="snow"
              value={body}
              onChange={(val: string) => setBody(val)}
              placeholder="Enter content"
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
          <style jsx global>{`
            .ql-container {
              border: none;
              position: relative !important;
              z-index: 0 !important;
              width: 100% !important;
            }
            .ql-toolbar {
              position: relative !important;
              z-index: 1;
              border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            }
            .ql-editor {
              position: relative !important;
              z-index: 1;
              height: 300px;
              max-height: 300px;
              overflow-y: auto;
            }
            /* custom scrollbar for mailing/deregister lists */
            .scrollable-list::-webkit-scrollbar { width: 8px; }
            .scrollable-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 9999px; }
            .scrollable-list { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.08) transparent; }
          `}</style>
        </div>
        {isSuccess && (
          <Alert>
            <CheckCircle2Icon color="green" />
            <AlertTitle className="text-green-800">
              Successfully sent!
            </AlertTitle>
            <AlertDescription>
              <span>
                Your email broadcast is being queued. Messages will be sent
                shortly. You can view any failed emails{" "}
                <span className="underline cursor-pointer">here</span>.
              </span>
            </AlertDescription>
          </Alert>
        )}
        <DialogFooter className="relative z-20 bg-background">
          <Button
            className="w-full relative z-30"
            type="button"
            disabled={
              isPending ||
              isSuccess ||
              !subject ||
              body === "<p><br></p>" ||
              !contacts.length
            }
            onClick={(e) => {
              e.stopPropagation();
              send();
            }}
          >
            {isPending ? "Sending..." : "Send"}
            <MessagesSquare className="w-4 h-4 mr-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
