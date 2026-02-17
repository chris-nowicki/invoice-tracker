import { useState } from "react";
import type { WebhookEvent } from "../../types/types";

const eventConfig: Record<string, { icon: string; color: string; bg: string }> =
  {
    "email.sent": {
      icon: "\u2191",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    "email.delivered": {
      icon: "\u2713",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    "email.opened": {
      icon: "\uD83D\uDC41",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    "email.bounced": {
      icon: "\u2715",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    "email.delivery_delayed": {
      icon: "\u231B",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    "invoice.marked_paid": {
      icon: "$",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    "invoice.marked_unpaid": {
      icon: "$",
      color: "text-stone-400",
      bg: "bg-stone-500/10",
    },
  };

function EventIcon({ type }: { type: string }) {
  const config = eventConfig[type] ?? {
    icon: "\u2022",
    color: "text-stone-400",
    bg: "bg-stone-500/10",
  };
  return (
    <div
      className={`mt-0.5 w-6 h-6 rounded-full ${config.bg} flex items-center justify-center shrink-0`}
    >
      <span className={`${config.color} text-xs`}>{config.icon}</span>
    </div>
  );
}

interface WebhookTimelineProps {
  events: WebhookEvent[];
  scheduledReminderId?: string;
  status?: string;
  invoiceId: string;
}

export default function WebhookTimeline({
  events,
  scheduledReminderId,
  status,
  invoiceId,
}: WebhookTimelineProps) {
  const [cancelling, setCancelling] = useState(false);

  async function handleCancelReminder() {
    setCancelling(true);
    try {
      const res = await fetch("/api/invoices/cancel-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Cancel reminder failed:", data.error);
      }
    } catch (err) {
      console.error("Cancel reminder error:", err);
    } finally {
      setCancelling(false);
    }
  }
  return (
    <div className="border-t border-stone-800/50 px-5 py-4 bg-stone-900/30">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
        Event Timeline
      </p>
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event._id} className="flex items-start gap-3">
            <EventIcon type={event.eventType} />
            <div>
              <p className="text-sm text-stone-300">{event.eventType}</p>
              <p className="text-xs text-stone-600">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-stone-800/50">
        {status === "bounced" ? (
          <p className="text-xs text-stone-600">
            <span className="text-red-400/80">Reminder Cancelled</span>
            {" "}&mdash; email bounced
          </p>
        ) : scheduledReminderId ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-stone-600">
              <span className="text-stone-400">Scheduled Reminder:</span>{" "}
              {scheduledReminderId} &mdash; 3 days before due
            </p>
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelReminder}
              className="text-xs font-medium text-red-400/50 hover:text-red-400 px-2 py-0.5 rounded border border-stone-700/50 hover:border-red-400/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? "Cancelling..." : "Cancel Reminder"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
