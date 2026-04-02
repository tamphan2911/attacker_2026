export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 animate-pulse rounded-full bg-white/10" />
      <div className="h-48 animate-pulse rounded-[2rem] border theme-border theme-panel" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-64 animate-pulse rounded-[2rem] border theme-border theme-panel" />
        <div className="h-48 animate-pulse rounded-[2rem] border theme-border theme-panel" />
      </div>
    </div>
  );
}
