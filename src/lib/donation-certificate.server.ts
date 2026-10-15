// Section 80G / Form 10BE-style donation certificate details.
// Placeholders: replace with the foundation's official registration details.
export const FOUNDATION_CERTIFICATE_DETAILS = {
  name: "Creative Ashoka Foundation",
  senderEmail: "donations@creativeashoka.org",
  address: "Rukmani Apartment, 6 Chandra Lok Colony, Aliganj, Lucknow-226024",
  pan: "[FOUNDATION PAN]",
  registrationNumber: "[80G / SECTION 354(4) REGISTRATION NUMBER]",
  registrationDate: "[REGISTRATION DATE]",
  signatory: "[AUTHORISED SIGNATORY]",
};

type AdminClient = typeof import("@/integrations/supabase/client.server")["supabaseAdmin"];

/**
 * Issues a certificate number for a completed donation and queues the
 * certificate email. Never throws: a failure here must not undo a donation.
 */
export async function issueDonationCertificate(supabaseAdmin: AdminClient, donationId: string) {
  try {
    const { data: donation } = await supabaseAdmin
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .maybeSingle();
    const row = donation as (Record<string, unknown> & { certificate_number?: string | null; is_anonymous?: boolean }) | null;
    if (!row || row.certificate_number) return;

    const { data: certificateNumber } = await (supabaseAdmin.rpc as unknown as (
      fn: string,
    ) => Promise<{ data: string | null }>)("next_donation_certificate_number");
    if (!certificateNumber) return;

    // Email delivery activates once the donations@creativeashoka.org sender domain is verified.
    const receiptStatus = row.is_anonymous ? "skipped_anonymous" : "pending_email_setup";
    await supabaseAdmin
      .from("donations")
      .update({
        certificate_number: certificateNumber,
        certificate_issued_at: new Date().toISOString(),
        receipt_email_status: receiptStatus,
      } as never)
      .eq("id", donationId);
  } catch (error) {
    console.error("Certificate issuance failed", error);
  }
}
