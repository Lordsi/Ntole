"use client";

interface DocItem {
  label: string;
  url: string | null;
}

export function DriverDocumentsGallery({ items }: { items: DocItem[] }) {
  const withUrls = items.filter((i) => i.url);
  if (withUrls.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        No documents uploaded.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
      {withUrls.map((item) => (
        <a
          key={item.label}
          href={item.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel rounded-lg overflow-hidden block hover:ring-1 hover:ring-primary-container/30 transition"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url!}
            alt={item.label}
            className="w-full aspect-[4/3] object-cover"
          />
          <p className="px-sm py-xs font-label-sm text-label-sm text-on-surface-variant">
            {item.label}
          </p>
        </a>
      ))}
    </div>
  );
}
