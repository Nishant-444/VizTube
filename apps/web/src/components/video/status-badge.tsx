import { Badge } from "@/components/ui/misc";
import type { ProcessingStatus } from "@/lib/api/types";
import { Spinner } from "@/components/ui/misc";

export function StatusBadge({ status, hasTranscript }: { status: ProcessingStatus; hasTranscript?: boolean }) {
  if (status === "PROCESSING")
    return (
      <Badge tone="warning">
        <Spinner className="size-3" /> AI processing
      </Badge>
    );
  if (status === "FAILED") return <Badge tone="danger">AI failed</Badge>;
  if (hasTranscript === false) return <Badge>No speech found</Badge>;
  return <Badge tone="success">AI ready</Badge>;
}
