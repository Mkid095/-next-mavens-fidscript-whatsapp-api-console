export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#11110a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="FIDScript" className="h-8 animate-pulse" />
        <p className="text-[#85826f] text-sm">Loading FIDScript...</p>
      </div>
    </div>
  );
}
