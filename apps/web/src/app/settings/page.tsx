import type { Metadata } from "next";
import { Settings } from "./settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Settings />
    </div>
  );
}
