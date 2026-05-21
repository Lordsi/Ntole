"use client";

import { useEffect, useState } from "react";

import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils/cn";

type Tone = "icon" | "glass" | "rail";

export interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  body?: string;
  /** ISO timestamp; rendered with a short relative label ("3m ago"). */
  timestamp?: string;
  href?: string;
}

interface NotificationsButtonProps {
  /** Pre-loaded items (e.g. last few rides) so the panel never feels empty. */
  items?: NotificationItem[];
  /** Visual treatment for the button. */
  tone?: Tone;
  /** Force the unread dot on regardless of `items`. */
  hasUnread?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Bell button + slide-in panel. Clicking opens a right-aligned glass sheet
 * with a notifications list (or an empty state). Closes on backdrop click,
 * ESC, or follow-link navigation.
 *
 * The button intentionally has no `disabled` state — even with an empty
 * feed the sheet opens and explains what'll show up here. That's far
 * better UX than a dead button.
 */
export function NotificationsButton({
  items = [],
  tone = "icon",
  hasUnread,
  className,
  ariaLabel = "Notifications",
}: NotificationsButtonProps) {
  const [open, setOpen] = useState(false);
  const unread = hasUnread ?? items.length > 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const buttonCls = (() => {
    if (tone === "glass") {
      return "glass-panel p-sm rounded-lg hover:bg-white/10";
    }
    if (tone === "rail") {
      return "flex w-full items-center gap-md rounded-xl px-md py-sm text-on-surface-variant hover:bg-white/[0.04] hover:text-on-surface transition-colors";
    }
    return "relative grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-white/5 hover:text-on-surface";
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "relative transition-colors active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2",
          buttonCls,
          className,
        )}
      >
        {tone === "rail" ? (
          <>
            <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04]">
              <MaterialIcon name="notifications" className="text-[20px]" />
              {unread && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary-container" />
              )}
            </span>
            <span className="font-label-md text-label-md">Notifications</span>
          </>
        ) : (
          <>
            <MaterialIcon
              name="notifications"
              className={tone === "glass" ? "text-primary-container" : undefined}
            />
            {unread && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary-container rounded-full neon-glow-primary" />
            )}
          </>
        )}
      </button>

      {open && (
        <NotificationsSheet
          items={items}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function NotificationsSheet({
  items,
  onClose,
}: {
  items: NotificationItem[];
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className="fixed inset-0 z-[100] flex justify-end animate-fade-in"
    >
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />
      <div className="relative h-full w-full max-w-[420px] bg-surface-container-low border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col">
        <header className="flex items-center justify-between px-lg py-md border-b border-white/[0.06]">
          <div className="flex items-center gap-sm">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-container/10 text-primary-container">
              <MaterialIcon name="notifications" filled />
            </span>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md text-on-surface leading-none">
                Notifications
              </h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {items.length === 0
                  ? "You're all caught up"
                  : `${items.length} update${items.length === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-white/10 hover:text-on-surface transition-colors active:scale-95"
          >
            <MaterialIcon name="close" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-lg py-md">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="flex flex-col gap-sm">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationRow item={n} onNavigate={onClose} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  item,
  onNavigate,
}: {
  item: NotificationItem;
  onNavigate: () => void;
}) {
  const inner = (
    <span className="flex items-start gap-md w-full">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-container/10 text-primary-container">
        <MaterialIcon name={item.icon} />
      </span>
      <span className="flex flex-col gap-xs flex-1 min-w-0">
        <span className="font-body-md text-body-md font-semibold text-on-surface line-clamp-1">
          {item.title}
        </span>
        {item.body && (
          <span className="font-label-sm text-label-sm text-on-surface-variant line-clamp-2">
            {item.body}
          </span>
        )}
        {item.timestamp && (
          <span className="font-label-sm text-label-sm text-on-surface-variant/70">
            {relativeTime(item.timestamp)}
          </span>
        )}
      </span>
    </span>
  );

  const cls =
    "glass-panel rounded-md p-md flex items-center text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2";

  if (item.href) {
    return (
      <a href={item.href} onClick={onNavigate} className={cls}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-md py-xl">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-container/10 text-primary-container">
        <MaterialIcon name="notifications_off" className="text-[28px]" />
      </span>
      <div className="flex flex-col gap-xs">
        <p className="font-headline-md text-headline-md text-on-surface">
          No notifications yet
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[26ch]">
          Ride updates, driver matches, and platform announcements will show
          up here.
        </p>
      </div>
    </div>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
