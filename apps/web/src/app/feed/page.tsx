import type { Metadata } from "next";
import { Feed } from "./feed";

export const metadata: Metadata = { title: "Subscriptions" };

export default function FeedPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Subscriptions</h1>
      <Feed />
    </>
  );
}
