type PdfQuote = {
  quoteNumber: string;
  validUntil: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  subtotal: number | string | null;
  tax: number | string | null;
  total: number | string | null;
  items: Array<{
    description: string;
    quantity: number | string;
    unit_price: number | string;
    line_total: number | string;
  }>;
};

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function money(value: number | string | null) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value ?? 0));
}

export function buildQuotePdfBytes(quote: PdfQuote) {
  const lines = [
    "MoonGift AI Quote",
    `Quote: ${quote.quoteNumber}`,
    `Valid until: ${quote.validUntil}`,
    `Customer: ${quote.companyName}`,
    `Contact: ${quote.contactName} <${quote.email}> ${quote.phone}`,
    "",
    "Items:",
    ...quote.items.map((item) => `${item.description} | Qty ${item.quantity} | Unit ${money(item.unit_price)} | Line ${money(item.line_total)}`),
    "",
    `Subtotal: ${money(quote.subtotal)}`,
    `Tax: ${money(quote.tax)}`,
    `Total: ${money(quote.total)}`
  ];

  const text = lines.map(escapePdfText).map((line, index) => `BT /F1 11 Tf 50 ${760 - index * 18} Td (${line}) Tj ET`).join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(text)} >> stream\n${text}\nendstream endobj`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n");
  pdf += `\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
}
