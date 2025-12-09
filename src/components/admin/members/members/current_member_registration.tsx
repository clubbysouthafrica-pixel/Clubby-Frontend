import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useFetchMemberRegisteration } from "@/queries/admin/registration-form";
import { Loader2, Edit, Trash2, Copy, PencilIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import {
  updateAdminNotes,
  removeAdminNotes,
} from "@/services/admin/registration-form";
import { EditRegistrationFieldDialog } from "./edit-registration-field-dialog";
import { toast } from "sonner";
import { useEffect } from "react";

function formatEpoch(epoch: number) {
  const date = new Date(epoch);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export function CurrentMemberRegistration({
  userId,
  clubAccountId,
  currency,
  clubName,
}: {
  userId: string;
  clubAccountId: string;
  currency: string;
  clubName: string;
}) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState<
    Array<{ id: string; title: string; content: string }>
  >([]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editingFieldDbId, setEditingFieldDbId] = useState<string | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);

  const { data, isLoading } = useFetchMemberRegisteration(
    clubAccountId,
    userId,
    currency
  );

  const updateNotesMutation = useMutation({
    mutationFn: (
      notes: Array<{ id: string; title: string; content: string }>
    ) => updateAdminNotes(data.registration_id, data.member_id, notes),
    onSuccess: (_, newNotes) => {
      setAdminNotes(newNotes);
      setNoteTitle("");
      setNoteContent("");
      toast.success("Admin notes updated successfully");
    },
    onError: () => {
      toast.error("Failed to update admin notes");
    },
  });

  const removeNotesMutation = useMutation({
    mutationFn: (noteIds: string[]) =>
      removeAdminNotes(data.member_id, data.registration_id, noteIds),
    onSuccess: (_, noteIds) => {
      setAdminNotes(adminNotes.filter((note) => !noteIds.includes(note.id)));
      toast.success("Admin note removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove admin note");
    },
  });

  useEffect(() => {
    if (data?.admin_notes && Array.isArray(data.admin_notes)) {
      setAdminNotes(data.admin_notes);
    }
  }, [data?.admin_notes]);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center p-5 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 flex-1 min-h-0 flex flex-col">
      {/* Transaction ID */}
      {data?.transaction_id && (
        <div className="flex items-center gap-2 text-sm bg-transparent p-2">
          <span className="text-muted-foreground text-xs">Transaction ID:</span>
          <strong className="text-xs font-mono">{data.transaction_id}</strong>
          <button
            onClick={() => {
              navigator.clipboard.writeText(data.transaction_id);
            }}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Copy transaction ID"
          >
            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
          </button>
        </div>
      )}

      {/* Registration Timeline Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/30 p-2 rounded-lg border">
        {data?.registration_submitted_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">Submitted:</span>
            <strong className="text-xs">
              {formatEpoch(data.registration_submitted_on)}
            </strong>
          </div>
        )}

        {data?.registration_submitted_on && data?.registered_on && (
          <span className="text-gray-300">|</span>
        )}

        {data?.registered_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">Registered:</span>
            <strong className="text-green-600 text-xs">
              {formatEpoch(data.registered_on)}
            </strong>
          </div>
        )}

        {(data?.registered_on && data?.deregistered_on) ||
        (data?.registration_submitted_on && data?.deregistered_on) ? (
          <span className="text-gray-300">|</span>
        ) : null}

        {data?.deregistered_on && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">Deregistered:</span>
            <strong className="text-red-600 text-xs">
              {formatEpoch(data.deregistered_on)}
            </strong>
          </div>
        )}
      </div>

      <Card className="w-full border shadow-sm pt-0 flex-1 min-h-0 flex flex-col gap-1">
        <CardHeader className="border-b bg-muted/30 py-1 pb-1 flex flex-row items-center justify-center relative">
          <div className="text-center">
            <CardTitle className="text-l pt-2">{clubName}</CardTitle>
            <CardDescription className="text-xs pt-2">
              Member Registration Form
            </CardDescription>
          </div>
          <div className="absolute right-4">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Admin Notes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Admin Notes</DialogTitle>
                  <DialogDescription>
                    Add additional information or notes to this member's
                    registration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Note Title</Label>
                    <Input
                      id="note-title"
                      placeholder="e.g., Special Request, Health Information"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-content">Note Content</Label>
                    <Textarea
                      id="note-content"
                      placeholder="Enter your additional information here..."
                      className="min-h-[200px]"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (noteTitle.trim() && noteContent.trim()) {
                        const id = `note-${Date.now()}-${Math.random()
                          .toString(36)
                          .substr(2, 9)}`;
                        const newNotes = [
                          ...adminNotes,
                          { id, title: noteTitle, content: noteContent },
                        ];
                        updateNotesMutation.mutate(newNotes);
                      }
                    }}
                    disabled={updateNotesMutation.isPending}
                    className="w-full"
                  >
                    {updateNotesMutation.isPending ? "Saving..." : "Add Note"}
                  </Button>
                  <Button
                    onClick={() => setIsEditDialogOpen(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="py-2 px-4 flex-1 min-h-0 flex flex-col">
          {adminNotes.length > 0 && (
            <div className="mb-3 border rounded-lg">
              <button
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors"
              >
                <span className="font-semibold text-sm text-blue-900">
                  Admin Notes ({adminNotes.length})
                </span>
                <span className="text-lg">{isNotesOpen ? "▼" : "▶"}</span>
              </button>
              {isNotesOpen && (
                <div className="bg-blue-50 border-t border-blue-200 p-3 space-y-3">
                  {adminNotes.map((note) => (
                    <div
                      key={note.id}
                      className="pb-3 border-b last:border-b-0 last:pb-0 flex items-start justify-between gap-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          {note.title}
                        </p>
                        <p className="text-xs text-blue-800 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() =>
                                removeNotesMutation.mutate([note.id])
                              }
                              disabled={removeNotesMutation.isPending}
                              className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Delete this note
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div
            key={data.pages[currentPageIndex].page_index}
            className="flex-1 min-h-0 flex flex-col"
          >
            <h3 className="text-base font-semibold text-center border-b pb-2">
              {data.pages[currentPageIndex].page_header}
            </h3>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-1 px-2 py-2">
              {data.pages[currentPageIndex].fields.map(
                (field: {
                  type: string;
                  label: string;
                  value: string;
                  field_id?: string;
                  signature_type?: string;
                  quantity?: number;
                  discount?: number;
                }) => {
                  if (field.type === "STANDARD_SIGNATURE") {
                    if (field.signature_type === "signature") {
                      return (
                        <div
                          key={field.label}
                          className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg"
                        >
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {field.label}
                          </Label>
                          <img
                            src={field.value}
                            alt="User Signature"
                            className="border-b-2 border-gray-400 max-w-xs"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={field.label}
                          className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg"
                        >
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {field.label}
                          </Label>
                          <Label className="text-xs font-[cursive] border-b-2 border-gray-400 pb-1">
                            {field.value}
                          </Label>
                        </div>
                      );
                    }
                  }

                  if (field.type === "STANDARD_OTHER") {
                    return (
                      <div
                        key={field.label}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex-1 flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {field.label}
                          </Label>
                          <Label className="text-xs border-b-2 border-gray-300 pb-1">
                            {field.value}
                          </Label>
                        </div>
                        {!data?.deregistered_on && field.field_id && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingFieldId(field.label);
                              setEditValue(field.value);
                              setEditingFieldDbId(field.field_id || null);
                              setIsFieldDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 ml-2 opacity-30 group-hover:opacity-100 transition-opacity"
                            title="Update this field"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  }

                  if (field.type === "BILLING") {
                    return (
                      <div
                        key={field.label}
                        className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg border"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {field.label}{" "}
                            {field.quantity ? `(x${field.quantity})` : null}
                          </Label>
                          {field.discount && (
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                              {field.discount}% off
                            </span>
                          )}
                        </div>
                        <Label className="text-sm font-medium border-b-2 border-gray-300 pb-1">
                          {field.value}
                        </Label>
                      </div>
                    );
                  }

                  if (field.type === "TEXT") {
                    const cleaned = field.label
                      .replace(
                        /<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g,
                        "<ul>$1</ul>"
                      )
                      .replace(/<span class="ql-ui"[^>]*><\/span>/g, "");

                    return (
                      <div
                        key={field.label}
                        className="prose prose-sm max-w-none text-gray-700 p-3 bg-muted/10 rounded-lg text-xs [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5"
                        dangerouslySetInnerHTML={{ __html: cleaned }}
                      />
                    );
                  }

                  if (field.type === "DNE") {
                    return (
                      <div
                        key={field.label}
                        className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-lg border border-dashed"
                      >
                        <Label className="text-xs font-semibold text-muted-foreground">
                          {field.label}
                        </Label>
                        <Label className="text-xs italic text-gray-500">
                          Not filled in by member.
                        </Label>
                      </div>
                    );
                  }
                }
              )}
            </div>

            {/* Update Field Dialog */}
            <EditRegistrationFieldDialog
              isOpen={isFieldDialogOpen}
              onOpenChange={(open) => {
                setIsFieldDialogOpen(open);
                if (!open) setEditingFieldId(null);
              }}
              fieldLabel={editingFieldId}
              fieldValue={editValue}
              fieldDbId={editingFieldDbId}
              clubAccountId={clubAccountId}
              onSave={(fieldId, newValue) => {
                console.log("Field updated:", { fieldId, newValue });
              }}
            />

            {/* Pagination Controls */}
            {data.pages.length > 1 && (
              <div className="flex justify-between items-center pt-3 border-t mt-2">
                {currentPageIndex > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-[90px]"
                    onClick={() => setCurrentPageIndex((i) => i - 1)}
                  >
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                <div className="text-xs text-muted-foreground">
                  Page {currentPageIndex + 1} of {data.pages.length}
                </div>

                {currentPageIndex < data.pages.length - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-[90px]"
                    onClick={() => setCurrentPageIndex((i) => i + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
