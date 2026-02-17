import type { InvoiceStatus } from "../../types/types";

const statusConfig: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "text-stone-400",
    bg: "bg-stone-400/10",
    dot: "bg-stone-400",
  },
  sent: {
    label: "Sent",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    dot: "bg-blue-400",
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  opened: {
    label: "Opened",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    dot: "bg-purple-400",
  },
  bounced: {
    label: "Bounced",
    color: "text-red-400",
    bg: "bg-red-400/10",
    dot: "bg-red-400",
  },
  delayed: {
    label: "Delayed",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    dot: "bg-yellow-400",
  },
};

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color} ${config.bg} rounded-full px-2.5 py-1`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
