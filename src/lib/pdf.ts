import { jsPDF } from "jspdf";
import { formatCurrency } from "./formatCurrency";

interface InvoicePdfData {
  invoiceId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  description: string;
  dueDate: string;
}

export function generateInvoicePdf(data: InvoicePdfData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, y);
  y += 12;

  // Invoice ID and Due Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Invoice ID: ${data.invoiceId}`, margin, y);
  y += 6;
  doc.text(`Due Date: ${data.dueDate}`, margin, y);
  y += 16;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Bill To
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("BILL TO", margin, y);
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(data.clientName, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(data.clientEmail, margin, y);
  y += 16;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Description
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("DESCRIPTION", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(0);
  const descriptionLines = doc.splitTextToSize(
    data.description,
    pageWidth - margin * 2,
  );
  doc.text(descriptionLines, margin, y);
  y += descriptionLines.length * 6 + 16;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Amount
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("AMOUNT DUE", margin, y);
  y += 10;
  doc.setFontSize(24);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  const formattedAmount = formatCurrency(data.amount);
  const amountWidth = doc.getTextWidth(formattedAmount);
  doc.text(formattedAmount, pageWidth - margin - amountWidth, y);

  return Buffer.from(doc.output("arraybuffer"));
}
