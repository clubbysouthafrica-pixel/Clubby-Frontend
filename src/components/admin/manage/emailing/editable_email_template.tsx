import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"

interface Props {
    template: string
    subject?: string
    clubName: string
    supportEmail: string
    useTemplate: boolean
    setUseTemplate: React.Dispatch<React.SetStateAction<boolean>>
    setTemplate: React.Dispatch<React.SetStateAction<string>>
    setSubject?: React.Dispatch<React.SetStateAction<string>>
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
}: Props) {
    const [internalTemplate, setInternalTemplate] = useState(template)
    const [internalSubject, setInternalSubject] = useState(subject || "")

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
                <ReactQuill
                    className="border rounded-lg"
                    theme="snow"
                    value={internalTemplate}
                    onChange={handleChange}
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
