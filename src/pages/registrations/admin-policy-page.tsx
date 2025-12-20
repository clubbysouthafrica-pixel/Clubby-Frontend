import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, UploadCloud } from "lucide-react";
// import ReactQuill from "react-quill"; // Uncomment if using react-quill
// import "react-quill/dist/quill.snow.css";

export default function AdminPolicyPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [policyText, setPolicyText] = useState<string>("");

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfPreview(URL.createObjectURL(file));
    } else {
      setPdfFile(null);
      setPdfPreview(null);
    }
  };

  const handleSave = () => {
    // TODO: Implement save logic (upload PDF or save text to backend)
    alert("Policy saved!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-6 px-4">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center justify-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Club Policy Management
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          Here you can upload your club’s official policy as a PDF, or enter it
          as text. This policy will be visible to your members during
          registration and in their account area.
        </p>
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-2xl bg-white/70 backdrop-blur-md shadow-2xl rounded-2xl border-none">
        <CardContent className="">
          <form
            className="space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div>
              <Label
                htmlFor="policy-pdf"
                className="flex items-center gap-2 text-base font-medium"
              >
                <UploadCloud className="w-5 h-5 text-blue-500" />
                Upload Policy PDF
              </Label>
              <Input
                id="policy-pdf"
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="mt-2 h-10 pt-1.5 file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
              />
              {pdfPreview && (
                <div className="mt-4 rounded-lg overflow-hidden border border-blue-100 shadow-inner bg-white/80">
                  <iframe
                    src={pdfPreview}
                    title="PDF Preview"
                    className="w-full h-64"
                  />
                </div>
              )}
            </div>
            <div>
              <Label
                htmlFor="policy-text"
                className="flex items-center gap-2 text-base font-medium"
              >
                <FileText className="w-5 h-5 text-indigo-500" />
                Or enter policy text
              </Label>
              {/* <ReactQuill
                value={policyText}
                onChange={handlePolicyTextChange}
                className="bg-white mt-2 rounded-lg"
              /> */}
              <textarea
                id="policy-text"
                className="w-full h-32 border border-indigo-100 rounded-lg p-3 mt-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                placeholder="Type or paste your policy here..."
              />
            </div>
            <Button
              type="submit"
              className="w-full py-3 rounded-lg text-base font-semibold bg-gradient-to-r bg-indigo-400 hover:bg-indigo-600 transition"
            >
              Save Policy
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
