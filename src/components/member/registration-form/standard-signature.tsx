import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";

interface Field {
    field_id: string
    field_name: string
    field_type: string
    input_type: string
    signature_type: string
    placeholder?: string
    required?: boolean
    value?: string
}

interface StandardFieldInputProps {
    field: Field
    currentPageIndex: number
    pages: any[]
    setFieldValue: (
        pageIndex: number,
        fieldId: string,
        updater: (f: any) => any
    ) => void
}

export default function StandardSignature({
    field,
    currentPageIndex,
    pages,
    setFieldValue,
}: StandardFieldInputProps) {
    const [drawSignature, setDrawSignature] = useState(field?.signature_type === "name" ? false : true)
    const [name, setName] = useState(field?.signature_type === "name" && field?.value ? field.value : "")

    const sigPadRef = useRef<SignaturePad | null>(null);

    const clearSignature = () => {
        sigPadRef.current?.clear();
        setFieldValue(
            pages[currentPageIndex].page_index,
            field.field_id,
            (f) => ({
                ...f,
                value: "",
                signature_type: "signature",
            })
        )
    };

    const save = async () => {
        if (!sigPadRef.current) return;

        const isEmpty = sigPadRef.current.isEmpty();

        if (isEmpty) {
            alert("Please provide a signature first.");
            return;
        }

        const dataUrl = sigPadRef.current.toDataURL("image/png");

        setFieldValue(
            pages[currentPageIndex].page_index,
            field.field_id,
            (f) => ({
                ...f,
                value: dataUrl,
                signature_type: "signature",
            })
        )
    };

    return (
        <div className="grid gap-2" key={field.field_id}>
            <div className="flex flex-row text-center gap-2 mt-2">
                <Label onClick={save} className="text-l">
                    {field.required ? <span className="text-red-500">*</span> : null} Signature:
                </Label>
                {
                    drawSignature ?
                        (
                            <div>
                                {field.value?.startsWith("data:image/png;base64,") ? (
                                    <img
                                        src={field.value}
                                        alt="Saved Signature"
                                        className="border-b-2"
                                        style={{ width: "w-full", height: "70px", objectFit: "contain" }}
                                    />
                                ) : (
                                    <SignaturePad
                                        ref={sigPadRef}
                                        onEnd={save}
                                        canvasProps={{ width: "w-full", height: 70, className: "border-b-2" }}
                                    />
                                )}
                            </div>
                        )
                        :
                        <div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    const newName = e.target.value;
                                    setName(newName);
                                    setFieldValue(
                                        pages[currentPageIndex].page_index,
                                        field.field_id,
                                        (f) => ({
                                            ...f,
                                            value: newName,
                                            signature_type: "name",
                                        })
                                    );
                                }}
                                placeholder="Type your name as signature"
                                className="w-full rounded-none border-0 border-b-2 border-muted-foreground focus:border-black focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:none"
                                style={{ fontFamily: "cursive", fontSize: "1.2rem", height: "70px" }}
                            />
                        </div>
                }
                <div className="flex flex-col justify-between h-full items-start pt-10">
                    {drawSignature && (
                        <button
                            type="button"
                            onClick={clearSignature}
                            className="text-[10px] cursor-pointer text-red-800 hover:underline text-left"
                        >
                            Clear
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setDrawSignature(!drawSignature);
                            clearSignature();
                        }}
                        className="text-[10px] cursor-pointer text-green-800 hover:underline text-left"
                    >
                        {drawSignature ? "Type signature" : "Draw signature"}
                    </button>
                </div>
            </div>
        </div>
    )
}
