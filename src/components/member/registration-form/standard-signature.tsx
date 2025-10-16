import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";

interface Field {
    field_id: string
    field_name: string
    field_type: string
    input_type: string
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
    const [drawSignature, setDrawSignature] = useState(true)
    const [signature, setSignature] = useState("");
    const [name, setName] = useState("")

    const sigPadRef = useRef<SignaturePad | null>(null);

    const clearSignature = () => {
        sigPadRef.current?.clear();
        setSignature("");
        onChange("");
    };

    const save = async () => {
        if (!sigPadRef.current) return;

        const isEmpty = sigPadRef.current.isEmpty();

        if (isEmpty) {
            alert("Please provide a signature first.");
            return;
        }

        const dataUrl = sigPadRef.current.toDataURL("image/png");
        setSignature(dataUrl)
    };

    const onChange = (val: string) => {
        setFieldValue(
            pages[currentPageIndex].page_index,
            field.field_id,
            (f) => ({
                ...f,
                value: drawSignature ? signature : name,
                signature_type: drawSignature ? "signature" : "name",
            })
        )
    }

    return (
        <div className="grid gap-2" key={field.field_id}>
            <div className="flex flex-row text-center gap-2">
                <Label onClick={save} className="text-l">
                    {field.required ? <span className="text-red-500">*</span> : null} Signature:
                </Label>
                {
                    drawSignature ?
                        <div>
                            <SignaturePad
                                ref={sigPadRef}
                                onEnd={save}
                                canvasProps={{ width: 400, height: 70, className: "border-b-2" }}
                            />
                        </div>
                        :
                        <div>
                            <Input
                                type="text"
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Type your name as signature"
                                style={{ fontFamily: "cursive", fontSize: "1.2rem", width: "400px", height: "50px", bottomBorder: "1px" }}
                            />
                        </div>
                }
                <div className="flex flex-col justify-center h-full items-start">
                    {
                        drawSignature &&
                        <button
                            type="button"
                            onClick={clearSignature}
                            className="text-sm cursor-pointer text-red-800 hover:underline ml-2"
                        >
                            Clear
                        </button>
                    }
                    <button
                        type="button"
                        onClick={() => setDrawSignature(!drawSignature)}
                        className="text-sm cursor-pointer text-green-800 hover:underline ml-2"
                    >
                        {drawSignature ? "Type name as signature" : "Draw signature"}
                    </button>
                </div>
            </div>
        </div>
    )
}
