import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Upload video" };

export default function UploadPage() {
  return (
    <RequireAuth title="Sign in to upload" description="Sign in to upload videos to your channel.">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Upload a video" description="Viewers will be able to ask AI questions once it's transcribed." />
        <UploadForm />
      </div>
    </RequireAuth>
  );
}
