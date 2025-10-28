import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"

interface Props {
    template: string
    clubName: string
    supportEmail: string
    useTemplate: boolean
    setUseTemplate: React.Dispatch<React.SetStateAction<boolean>>
    setTemplate: React.Dispatch<React.SetStateAction<string>>
}

export default function EditableEmailTemplate({
    template,
    clubName,
    supportEmail,
    useTemplate,
    setUseTemplate,
    setTemplate,
}: Props) {
    const [internalTemplate, setInternalTemplate] = useState(template)

    useEffect(() => {
        setInternalTemplate(
            template
                .replace(/{{clubName}}/g, clubName)
                .replace(/{{clubEmail}}/g, supportEmail)
        )
    }, [template, clubName, supportEmail])

    const handleChange = (val: string) => {
        setInternalTemplate(val)
        setTemplate(val)
    }

    return (
        <div className="space-y-4 w-full">
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
