import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type DonationReceiptData = {
  donationId: string;
  amount: number;
  cause: string;
  donorName: string;
  address: string | null;
  pan: string | null;
  isAnonymous: boolean;
  paymentId: string;
  paidAt: string;
  acknowledgementNumber: string;
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const navy = rgb(31 / 255, 78 / 255, 121 / 255);
const orange = rgb(1, 122 / 255, 0);
const ink = rgb(31 / 255, 41 / 255, 55 / 255);
const muted = rgb(97 / 255, 108 / 255, 122 / 255);
const pale = rgb(0.96, 0.97, 0.98);

function supportedText(value: string): string {
  return value
    .replaceAll("₹", "INR ")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
}

function wrapText(text: string, maxWidth: number, font: Awaited<ReturnType<typeof PDFDocument.create>> extends never ? never : any, size: number) {
  const words = supportedText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function downloadDonationReceipt(data: DonationReceiptData): Promise<void> {
  const document = await PDFDocument.create();
  const page = document.addPage([pageWidth, pageHeight]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const margin = 52;
  const contentWidth = pageWidth - margin * 2;

  page.drawRectangle({ x: 0, y: pageHeight - 166, width: pageWidth, height: 166, color: navy });
  page.drawRectangle({ x: margin, y: pageHeight - 166, width: 52, height: 4, color: orange });
  page.drawText("CREATIVE ASHOKA FOUNDATION", {
    x: margin,
    y: pageHeight - 66,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Rukmani Apartment, 6 Chandra Lok Colony, Aliganj, Lucknow-226024", {
    x: margin,
    y: pageHeight - 88,
    size: 9,
    font: regular,
    color: rgb(0.91, 0.94, 0.97),
  });
  page.drawText("DONATION PAYMENT ACKNOWLEDGEMENT", {
    x: margin,
    y: pageHeight - 132,
    size: 15,
    font: bold,
    color: rgb(1, 1, 1),
  });

  let y = pageHeight - 207;
  page.drawText("Thank you for supporting our work.", {
    x: margin,
    y,
    size: 12,
    font: bold,
    color: ink,
  });
  y -= 22;
  page.drawText("This document acknowledges a payment verified through Razorpay.", {
    x: margin,
    y,
    size: 9,
    font: regular,
    color: muted,
  });

  y -= 42;
  page.drawRectangle({ x: margin, y: y - 43, width: contentWidth, height: 58, color: pale });
  page.drawText("ACKNOWLEDGEMENT NUMBER", {
    x: margin + 14,
    y: y - 7,
    size: 8,
    font: bold,
    color: muted,
  });
  page.drawText(supportedText(data.acknowledgementNumber), {
    x: margin + 14,
    y: y - 27,
    size: 12,
    font: bold,
    color: navy,
  });
  const paidDate = new Date(data.paidAt);
  const dateLabel = Number.isNaN(paidDate.getTime())
    ? "Payment verified"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(paidDate);
  page.drawText("PAYMENT DATE", {
    x: pageWidth / 2 + 8,
    y: y - 7,
    size: 8,
    font: bold,
    color: muted,
  });
  page.drawText(dateLabel, {
    x: pageWidth / 2 + 8,
    y: y - 27,
    size: 11,
    font: bold,
    color: navy,
  });

  y -= 83;
  const drawSectionTitle = (title: string) => {
    page.drawText(title, { x: margin, y, size: 10, font: bold, color: navy });
    y -= 20;
  };
  const drawField = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), { x: margin, y, size: 7.5, font: bold, color: muted });
    const lines = wrapText(value || "Not provided", contentWidth - 2, regular, 10);
    y -= 15;
    for (const line of lines) {
      page.drawText(line, { x: margin, y, size: 10, font: regular, color: ink });
      y -= 14;
    }
    y -= 7;
  };

  drawSectionTitle("DONOR DETAILS");
  drawField("Donor", data.isAnonymous ? "Anonymous" : data.donorName);
  if (!data.isAnonymous && data.address) drawField("Address", data.address);
  if (!data.isAnonymous && data.pan) drawField("PAN", data.pan);

  y -= 5;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.8, color: rgb(0.87, 0.89, 0.92) });
  y -= 26;
  drawSectionTitle("PAYMENT DETAILS");
  drawField("Amount received", `INR ${data.amount.toLocaleString("en-IN")}`);
  drawField("Program supported", data.cause || "General donation");
  drawField("Payment method", "Razorpay");
  drawField("Payment reference", data.paymentId);

  const disclaimerY = Math.max(62, y - 2);
  page.drawLine({ start: { x: margin, y: disclaimerY + 14 }, end: { x: pageWidth - margin, y: disclaimerY + 14 }, thickness: 0.8, color: rgb(0.87, 0.89, 0.92) });
  const disclaimer = "This is a payment acknowledgement, not a tax-exemption certificate. The official Section 354(4) certificate, if applicable, will be issued separately after the foundation's registration details are finalized.";
  const disclaimerLines = wrapText(disclaimer, contentWidth, regular, 8);
  let disclaimerTextY = disclaimerY;
  for (const line of disclaimerLines) {
    page.drawText(line, { x: margin, y: disclaimerTextY, size: 8, font: regular, color: muted });
    disclaimerTextY -= 12;
  }

  const bytes = await document.save();
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `creative-ashoka-payment-receipt-${supportedText(data.acknowledgementNumber).replace(/[^a-zA-Z0-9-]/g, "-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}