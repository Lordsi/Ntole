/**
 * Shown instantly while an admin sub-page server-fetches its data. Without
 * this the entire route stays unresponsive until the server payload arrives;
 * with it the chrome (sidebar + header) renders immediately and the body
 * shows a low-fi version of the page that's about to land.
 */
export default function AdminLoading() {
  return (
    <div className="animate-fade-in" aria-busy="true" aria-live="polite">
      <div className="mb-xl">
        <div className="h-9 w-56 rounded-md bg-surface-container-high/60 mb-sm" />
        <div className="h-4 w-72 rounded-md bg-surface-container-high/40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-lg p-lg flex flex-col gap-md"
          >
            <div className="h-9 w-9 rounded-md bg-surface-container-high/60" />
            <div className="h-3 w-20 rounded-sm bg-surface-container-high/40" />
            <div className="h-8 w-24 rounded-md bg-surface-container-high/60" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="glass-panel rounded-lg min-h-[500px] lg:col-span-2 grid place-items-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-[0.16em] animate-pulse-soft">
            Loading…
          </span>
        </div>
        <div className="glass-panel rounded-lg min-h-[300px]" />
      </div>
    </div>
  );
}
