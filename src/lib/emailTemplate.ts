import { formatCurrency } from "./formatCurrency";

interface EmailData {
  clientName: string;
  invoiceId: string;
  amount: number;
  description: string;
  dueDate: string;
}

export function invoiceEmailHtml(data: EmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #18181b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 12px; border: 1px solid #3f3f46;">
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #fafafa; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Invoice</h1>
              <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 32px 0;">Invoice ID: ${data.invoiceId}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #1c1c1e; border-radius: 8px;">
                    <p style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Bill To</p>
                    <p style="color: #fafafa; font-size: 14px; font-weight: 600; margin: 0;">${data.clientName}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding: 16px; background-color: #1c1c1e; border-radius: 8px 0 0 8px;">
                    <p style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Amount Due</p>
                    <p style="color: #fafafa; font-size: 20px; font-weight: 700; margin: 0;">${formatCurrency(data.amount)}</p>
                  </td>
                  <td width="50%" style="padding: 16px; background-color: #1c1c1e; border-radius: 0 8px 8px 0;">
                    <p style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Due Date</p>
                    <p style="color: #fafafa; font-size: 20px; font-weight: 700; margin: 0;">${data.dueDate}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px; background-color: #1c1c1e; border-radius: 8px;">
                    <p style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Description</p>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5; margin: 0;">${data.description}</p>
                  </td>
                </tr>
              </table>

              <p style="color: #a1a1aa; font-size: 13px; margin: 0; text-align: center;">A PDF copy of this invoice is attached to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function reminderEmailHtml(data: EmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #18181b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 12px; border: 1px solid #3f3f46;">
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #fafafa; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Payment Reminder</h1>
              <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 32px 0;">Invoice ID: ${data.invoiceId}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; background-color: #1c1c1e; border-radius: 8px; text-align: center;">
                    <p style="color: #fbbf24; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Payment due in 3 days</p>
                    <p style="color: #71717a; font-size: 13px; margin: 0;">Due date: ${data.dueDate}</p>
                  </td>
                </tr>
              </table>

              <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${data.clientName}, this is a friendly reminder that your invoice for <strong style="color: #fafafa;">${formatCurrency(data.amount)}</strong> is due on <strong style="color: #fafafa;">${data.dueDate}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px; background-color: #1c1c1e; border-radius: 8px;">
                    <p style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Description</p>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5; margin: 0;">${data.description}</p>
                  </td>
                </tr>
              </table>

              <p style="color: #71717a; font-size: 12px; margin: 0; text-align: center;">Please disregard this reminder if payment has already been made.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
