// Renders the order confirmation (receipt) email — transactional, built
// from the order itself, same table/inline-style conventions as
// orderShippedEmail.js and, like it, no marketing unsubscribe footer.
import { T } from '../theme';

const MAX_WIDTH = 600;
const FALLBACK_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const INK = T.ink;
const SOFT = '#8A7F76';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export function renderOrderConfirmationEmail({ orderId, items = [], amount, shipping, shippingProtection = 0, settings = {} }) {
  const font = `'${settings.emailFont || 'Inter'}', ${FALLBACK_FONT}`;
  const logoRow = settings.logoUrl
    ? `<tr><td style="padding:24px;text-align:center;"><img src="${escapeHtml(settings.logoUrl)}" alt="" style="max-height:48px;display:inline-block;border:0;" /></td></tr>`
    : '';
  const itemRows = items.map((i) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:${INK};">${escapeHtml(i.name)} &times; ${Number(i.quantity) || 1}</td>
      <td style="padding:8px 0;font-size:14px;color:${INK};text-align:right;">${i.price != null ? money(Number(i.price) * (Number(i.quantity) || 1)) : ''}</td>
    </tr>`).join('');
  const protectionRow = shippingProtection > 0
    ? `<tr><td style="padding:8px 0;font-size:14px;color:${SOFT};">Shipping protection</td><td style="padding:8px 0;font-size:14px;color:${SOFT};text-align:right;">${money(shippingProtection)}</td></tr>`
    : '';
  const address = shipping
    ? [shipping.name, [shipping.address, shipping.apt].filter(Boolean).join(', '), `${shipping.city || ''}${shipping.state ? `, ${shipping.state}` : ''} ${shipping.zip || ''}`.trim()]
        .filter(Boolean).map(escapeHtml).join('<br />')
    : '';
  const footer = [settings.companyName, settings.physicalAddress].filter(Boolean).map(escapeHtml).join(' · ');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;"><tr><td align="center">
<table role="presentation" width="${MAX_WIDTH}" cellpadding="0" cellspacing="0" style="max-width:${MAX_WIDTH}px;width:100%;font-family:${font};color:${INK};">
${logoRow}
<tr><td style="padding:8px 24px 0;">
  <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${SOFT};">Order confirmed</p>
  <p style="margin:0 0 16px;font-size:22px;line-height:1.35;">Thank you for your order.</p>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">We've received it and we're getting it ready. We'll email you again as soon as it ships.</p>
  ${orderId ? `<p style="margin:0 0 20px;font-size:13px;color:${SOFT};">Order ${escapeHtml(orderId)}</p>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e1dc;border-bottom:1px solid #e6e1dc;">
    ${itemRows}
    ${protectionRow}
    <tr><td style="padding:12px 0;font-size:15px;font-weight:700;">Total</td><td style="padding:12px 0;font-size:15px;font-weight:700;text-align:right;">${money(amount)}</td></tr>
  </table>
  ${address ? `<p style="margin:20px 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${SOFT};">Shipping to</p><p style="margin:0 0 20px;font-size:14px;line-height:1.6;">${address}</p>` : ''}
</td></tr>
${footer ? `<tr><td style="padding:24px;font-size:11px;color:${SOFT};text-align:center;">${footer}</td></tr>` : ''}
</table></td></tr></table></body></html>`;
}
