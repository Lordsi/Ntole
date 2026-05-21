import { MaterialIcon } from "@/components/ui/material-icon";

export default function Loading() {
  return (
    <div className="animate-fade-in" aria-busy="true" aria-live="polite">
      <div className="mb-lg flex items-center gap-md">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary-container/10 text-primary-container">
          <MaterialIcon name="paid" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Pricing
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Loading tiers…
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-lg p-md flex flex-col gap-md animate-pulse-soft min-h-[280px]"
          >
            <div className="h-5 w-1/3 rounded-sm bg-surface-container-high/60" />
            <div className="h-10 w-full rounded-md bg-surface-container-high/40" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, k) => (
                <div
                  key={k}
                  className="h-12 rounded-md bg-surface-container-high/40"
                />
              ))}
            </div>
            <div className="h-10 w-full rounded-full bg-surface-container-high/40 mt-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
