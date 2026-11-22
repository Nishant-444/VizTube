import type { Metadata } from "next";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Upload video" };

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Upload a video</h1>
      <UploadForm />
    </div>
  );
}
