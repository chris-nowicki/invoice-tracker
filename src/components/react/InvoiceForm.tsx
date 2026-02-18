import { useState } from "react";
import { useMutation } from "convex/react";
import { actions, isInputError } from "astro:actions";
import { api } from "../../../convex/_generated/api";
import type { Invoice } from "../../types/types";

interface InvoiceFormProps {
  onClose: () => void;
  invoice?: Invoice;
}

export default function InvoiceForm({ onClose, invoice }: InvoiceFormProps) {
  const updateInvoice = useMutation(api.invoices.update);
  const isEditing = !!invoice;

  const [clientName, setClientName] = useState(invoice?.clientName ?? "");
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail ?? "");
  const [amount, setAmount] = useState(
    invoice ? String(invoice.amount) : "",
  );
  const [description, setDescription] = useState(invoice?.description ?? "");
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const fields = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        amount: Number(amount),
        description: description.trim(),
        dueDate,
      };

      if (isEditing) {
        await updateInvoice({ id: invoice._id, ...fields });
      } else {
        const { error } = await actions.invoices.createAndSend(fields);

        if (error) {
          if (isInputError(error)) {
            setErrors(
              Object.fromEntries(
                Object.entries(error.fields)
                  .filter(([, msgs]) => msgs?.length)
                  .map(([field, msgs]) => [field, msgs![0]]),
              ),
            );
          } else {
            setErrors({ dueDate: error.message });
          }
          return;
        }

        setClientName("");
        setClientEmail("");
        setAmount("");
        setDescription("");
        setDueDate("");
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-stone-800/50 border border-stone-700/40 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-transparent transition-colors";

  return (
    <div className="bg-stone-900/80 border border-stone-800/50 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-stone-300">
          {isEditing ? "Edit Invoice" : "New Invoice"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-600 hover:text-stone-300 text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-stone-500 mb-1.5">
            Client Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className={inputClass}
            placeholder="John Smith"
          />
          {errors.clientName && (
            <p className="text-xs text-red-400/80 mt-1">{errors.clientName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-stone-500 mb-1.5">
            Client Email
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className={inputClass}
            placeholder="john@example.com"
          />
          {errors.clientEmail && (
            <p className="text-xs text-red-400/80 mt-1">{errors.clientEmail}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            {errors.amount && (
              <p className="text-xs text-red-400/80 mt-1">{errors.amount}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
            {errors.dueDate && (
              <p className="text-xs text-red-400/80 mt-1">{errors.dueDate}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-stone-500 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Invoice description..."
          />
          {errors.description && (
            <p className="text-xs text-red-400/80 mt-1">
              {errors.description}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-stone-200 text-stone-900 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Creating & Sending..."
            : isEditing
              ? "Save Changes"
              : "Create & Send Invoice"}
        </button>
      </form>
    </div>
  );
}
