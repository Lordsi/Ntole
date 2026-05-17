"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Message } from "@/lib/supabase/types";

interface RideChatProps {
  rideId: string;
  selfId: string;
  className?: string;
}

export function RideChat({ rideId, selfId, className }: RideChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const supabaseRef = useRef(createBrowserSupabaseClient());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = supabaseRef.current;
    void supabase
      .from("messages")
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data ?? []) as Message[]));

    const channel = supabase
      .channel(`messages:${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const supabase = supabaseRef.current;
      await supabase.from("messages").insert({
        ride_id: rideId,
        sender_id: selfId,
        body,
      });
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted">
            Say hi to your {selfId ? "ride partner" : ""}.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === selfId;
          return (
            <div
              key={m.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                mine
                  ? "ml-auto bg-accent text-background"
                  : "mr-auto bg-surface-2 text-white",
              )}
            >
              {m.body}
            </div>
          );
        })}
      </div>
      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-white/5 bg-background p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message"
          className="h-11 flex-1 rounded-pill bg-surface px-4 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <Button type="submit" disabled={sending || draft.trim().length === 0}>
          Send
        </Button>
      </form>
    </div>
  );
}
