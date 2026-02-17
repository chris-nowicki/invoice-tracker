import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Invoice } from "../../types/types";
import StatusBadge from "./StatusBadge";
import WebhookTimeline from "./WebhookTimeline";

function formatDueDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface InvoiceRowProps {
  invoice: Invoice;
  onEdit: () => void;
}

export default function InvoiceRow({ invoice, onEdit }: InvoiceRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [togglingPaid, setTogglingPaid] = useState(false);
  const events = useQuery(api.webhookEvents.listByInvoice, {
    invoiceId: invoice._id,
  });
  const removeInvoice = useMutation(api.invoices.remove);

  async function handleTogglePaid() {
    setTogglingPaid(true);
    try {
      const res = await fetch("/api/invoices/toggle-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice._id }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Toggle paid failed:", data.error);
      }
    } catch (err) {
      console.error("Toggle paid error:", err);
    } finally {
      setTogglingPaid(false);
    }
  }

  useEffect(() => {
    if (!isOpen) setConfirmDelete(false);
  }, [isOpen]);

  return (
    <div className="bg-stone-900/70 border border-stone-800/40 rounded-xl overflow-hidden hover:border-stone-700/40 transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full text-left px-5 py-4 hover:bg-stone-800/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-stone-100">
            {invoice.clientName}
          </span>
          <div className="flex items-center gap-2">
            {invoice.paidAt && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                Paid
              </span>
            )}
            <StatusBadge status={invoice.status} />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-stone-600 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        <div className="mt-1.5 text-sm text-stone-500 flex items-center gap-2">
          <span>{invoice.clientEmail}</span>
          <span className="text-stone-700/60">&middot;</span>
          <span>
            $
            {invoice.amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-stone-700/60">&middot;</span>
          <span>Due {formatDueDate(invoice.dueDate)}</span>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <WebhookTimeline
            events={events ?? []}
            scheduledReminderId={invoice.scheduledReminderId}
            status={invoice.status}
            invoiceId={invoice._id}
          />

          <div className="px-5 pb-4 pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-xs font-medium text-stone-400 hover:text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700/50 hover:border-stone-600/50 transition-colors cursor-pointer"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={togglingPaid}
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePaid();
              }}
              className="text-xs font-medium text-stone-400 hover:text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700/50 hover:border-stone-600/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {togglingPaid
                ? "Updating..."
                : invoice.paidAt
                  ? "Mark as Unpaid"
                  : "Mark as Paid"}
            </button>
            <div className="ml-auto">
              {confirmDelete ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500">Confirm?</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeInvoice({ id: invoice._id });
                    }}
                    className="font-medium text-red-400 hover:text-red-300 px-2 py-1 rounded cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(false);
                    }}
                    className="font-medium text-stone-500 hover:text-stone-300 px-2 py-1 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  className="text-xs font-medium text-red-400/40 hover:text-red-400 px-3 py-1.5 rounded-lg border border-stone-700/50 hover:border-red-400/20 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
