export function LogStream({
  job,
}: {
  job: {
    error: string | null;
  };
}) {
  if (!job.error) return null;

  return (
    <div className="mx-6 mb-4 p-3 bg-red-400/5 border border-red-400/10 rounded-xl">
      <p className="text-xs text-red-400 font-semibold mb-1">Error</p>
      <p className="text-xs text-red-300/70">{job.error}</p>
    </div>
  );
}
