import { sentimentMeta, type Sentiment } from "@/lib/mock-data";

export function SentimentTag({ sentiment }: { sentiment: Sentiment }) {
  const meta = sentimentMeta[sentiment];
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono ${meta.bg} ${meta.border} ${meta.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
