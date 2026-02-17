import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Invoice } from "../../types/types";
import InvoiceRow from "./InvoiceRow";
import InvoiceForm from "./InvoiceForm";

type FormMode = null | "create" | { editing: Invoice };

const FILTER_OPTIONS = [
  "all",
  "paid",
  "pending",
  "sent",
  "delivered",
  "opened",
  "bounced",
  "delayed",
] as const;

type Filter = (typeof FILTER_OPTIONS)[number];

export default function InvoiceDashboard() {
  const invoices = useQuery(api.invoices.list);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const filteredInvoices = invoices?.filter((invoice) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "paid") return invoice.paidAt != null;
    return invoice.status === activeFilter;
  });

  const total = invoices?.length ?? 0;
  const filtered = filteredInvoices?.length ?? 0;
  const countText =
    total === 0 ? "" :
    activeFilter === "all" ? `${total} invoice${total !== 1 ? "s" : ""}` :
    `${filtered} of ${total} invoice${total !== 1 ? "s" : ""}`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-8 mb-6">
        <p className="text-xs text-stone-600 tracking-wide">{countText}</p>
        <button
          onClick={() => setFormMode("create")}
          className="bg-stone-200 text-stone-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
        >
          New Invoice
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer capitalize ${
              activeFilter === filter
                ? "bg-stone-800 text-stone-200"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {formMode !== null && (
        <InvoiceForm
          onClose={() => setFormMode(null)}
          invoice={
            typeof formMode === "object" ? formMode.editing : undefined
          }
        />
      )}

      {invoices === undefined ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-4 w-4 border-2 border-stone-800 border-t-stone-500 rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-stone-600 text-sm">No invoices yet</p>
          <p className="text-stone-700 text-xs mt-1">
            Create your first invoice to get started
          </p>
        </div>
      ) : filteredInvoices && filteredInvoices.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-stone-600 text-sm">
            No {activeFilter} invoices
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInvoices?.map((invoice) => (
            <InvoiceRow
              key={invoice._id}
              invoice={invoice}
              onEdit={() => setFormMode({ editing: invoice })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
