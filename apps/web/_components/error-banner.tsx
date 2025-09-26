export default function ErrorBanner({
  message,
  rid,
}: {
  message?: string | null;
  rid?: string;
}) {
  if (!message && !rid) return null;
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
      <div className="font-medium">Something went wrong</div>
      {message && <div className="opacity-90">{message}</div>}
      {rid && (
        <button
          className="mt-1 text-xs underline underline-offset-2"
          onClick={() => navigator.clipboard.writeText(rid)}
        >
          Copy request id
        </button>
      )}
    </div>
  );
}
