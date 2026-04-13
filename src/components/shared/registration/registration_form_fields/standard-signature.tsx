import { useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import RequiredLabel from "./required-label";

interface Field {
    field_id: string
    field_name: string
    field_type: string
    input_type: string
    signature_type: string
    placeholder?: string
    required?: boolean
    value?: string | number
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
    const [name, setName] = useState(
        field?.signature_type === "name" && typeof field?.value === "string" ? field.value : ""
    )
    const isMobile = useIsMobile()

    const sigPadRef = useRef<SignaturePad | null>(null);

    const clearSignature = () => {
        sigPadRef.current?.clear();
        setName("")
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
        <div className="w-full" key={field.field_id}>
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-0 items-stretch'}`}>
                <div className={`${isMobile ? 'w-full text-left' : 'pr-5 flex-shrink-0 flex items-center'}`}>
                    <RequiredLabel required={field.required} className={`${isMobile ? 'text-base text-left font-medium text-gray-900' : 'text-base font-medium text-gray-900'} mb-0`}>
                        {field.field_name}:
                    </RequiredLabel>
                </div>

                <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row gap-4 items-start'} flex-1`}>
                    {drawSignature ? (
                        <div className={`border-b-2 border-gray-300 ${isMobile ? 'w-full max-w-full h-[100px]' : 'w-[300px] h-[70px]'} overflow-hidden`}>
                            {typeof field.value === "string" && field.value.startsWith("data:image/png;base64,") ? (
                                <img
                                    src={field.value}
                                    alt="Saved Signature"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <SignaturePad
                                    ref={sigPadRef}
                                    onEnd={save}
                                    canvasProps={{
                                        width: 300,
                                        height: isMobile ? 100 : 70,
                                        className: "w-full h-full max-w-full",
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <div className={`${isMobile ? 'w-full' : ''}`}>
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
                                onInvalid={(e) => (e as any).preventDefault()}
                                className={`${isMobile ? 'w-full max-w-full' : 'w-[300px]'} border-b-2 border-gray-300 focus:border-blue-400 focus:outline-none`}
                                style={{
                                    fontFamily: "cursive",
                                    fontSize: isMobile ? "1.1rem" : "1.2rem",
                                    height: isMobile ? "60px" : "70px",
                                    paddingBottom: "8px"
                                }}
                            />
                        </div>
                    )}

                    <div className={`flex ${isMobile ? 'flex-row justify-center gap-4' : 'flex-col justify-end h-full items-start space-y-2'}`}>
                        {drawSignature && (
                            <button
                                type="button"
                                onClick={clearSignature}
                                className={`${isMobile ? 'text-base px-4 py-2 bg-gray-200 rounded' : 'text-sm px-3 py-1 bg-gray-100 rounded'} font-medium text-gray-700 hover:bg-gray-300 focus:outline-none cursor-pointer`}
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
                            className={`${isMobile ? 'text-base px-4 py-2 bg-gray-200 rounded' : 'text-sm px-3 py-1 bg-gray-100 rounded'} font-medium text-gray-700 hover:bg-gray-300 focus:outline-none cursor-pointer`}
                        >
                            {drawSignature ? "Type signature" : "Draw signature"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
