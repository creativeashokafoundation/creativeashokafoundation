import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const donationInput = z.object({
  donorName: z.string().trim().max(200).optional().default(""),
  email: z.string().trim().max(320).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  amount: z.number().int().min(1).max(1_000_000),
  cause: z.string().trim().max(120).optional().default("General donation"),
  pan: z.string().trim().max(20).optional().default(""),
  isAnonymous: z.boolean().default(false),
}).superRefine((input, context) => {
  if (input.isAnonymous) return;
  if (!input.donorName.trim()) context.addIssue({ code: "custom", path: ["donorName"], message: "Name is required." });
  if (!z.string().email().safeParse(input.email).success) {
    context.addIssue({ code: "custom", path: ["email"], message: "A valid email is required." });
  }
});

const paymentInput = z.object({
  donationId: z.string().uuid(),
  orderId: z.string().min(1).max(100),
  paymentId: z.string().min(1).max(100),
  signature: z.string().regex(/^[a-f\d]{64}$/i),
});

function razorpayAuth(keyId: string, keySecret: string) {
  return `Basic ${btoa(`${keyId}:${keySecret}`)}`;
}

export const createDonationOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => donationInput.parse(input))
  .handler(async ({ data }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured yet.");
    const donationId = crypto.randomUUID();
    let orderResponse: Response;

    try {
      orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: razorpayAuth(keyId, keySecret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: data.amount * 100,
          currency: "INR",
          receipt: donationId,
          notes: { donation_id: donationId },
        }),
      });
    } catch {
      throw new Error("Could not start payment. Please try again.");
    }

    if (!orderResponse.ok) throw new Error("Could not start payment. Please try again.");
    const order = (await orderResponse.json()) as { id?: string; amount?: number; currency?: string };
    if (!order.id || order.amount !== data.amount * 100 || order.currency !== "INR") {
      throw new Error("Could not start payment. Please try again.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("donations").insert({
      id: donationId,
      email: data.isAnonymous ? `anonymous+${donationId}@donations.invalid` : data.email,
      phone: data.isAnonymous ? null : data.phone || null,
      amount: data.amount,
      cause: data.cause || "General donation",
      pan: data.isAnonymous ? null : data.pan || null,
      payment_method: "razorpay",
      status: "pending",
      reference_id: order.id,
      is_anonymous: data.isAnonymous,
      donor_name: data.isAnonymous ? "Anonymous" : data.donorName,
    });

    if (error) throw new Error("Could not save your donation. Please try again.");

    return {
      donationId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      donorName: data.isAnonymous ? "" : data.donorName,
      email: data.isAnonymous ? "" : data.email,
      phone: data.isAnonymous ? "" : data.phone,
    };
  });

export const verifyDonationPayment = createServerFn({ method: "POST" })
  .inputValidator((input) => paymentInput.parse(input))
  .handler(async ({ data }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured yet.");
    const encoder = new TextEncoder();
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(keySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const digest = new Uint8Array(
      await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(`${data.orderId}|${data.paymentId}`)),
    );
    const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
    let mismatch = expected.length ^ data.signature.length;
    for (let index = 0; index < expected.length; index += 1) {
      mismatch |= expected.charCodeAt(index) ^ (data.signature.charCodeAt(index) || 0);
    }
    if (mismatch !== 0) throw new Error("Payment could not be verified. Please contact us for help.");

    let paymentResponse: Response;
    try {
      paymentResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(data.paymentId)}`,
        { headers: { Authorization: razorpayAuth(keyId, keySecret) } },
      );
    } catch {
      throw new Error("Payment verification is taking longer than expected. Please contact us for help.");
    }
    if (!paymentResponse.ok) {
      throw new Error("Payment verification is taking longer than expected. Please contact us for help.");
    }
    const payment = (await paymentResponse.json()) as {
      order_id?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };
    if (payment.order_id !== data.orderId || payment.status !== "captured" || payment.currency !== "INR") {
      throw new Error("Payment is not confirmed yet. Please contact us with your payment reference.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: donation, error } = await supabaseAdmin
      .from("donations")
      .select("id, amount, status, reference_id")
      .eq("id", data.donationId)
      .maybeSingle();

    if (error || !donation || payment.amount == null || donation.amount !== payment.amount / 100) {
      throw new Error("Payment could not be matched to your donation. Please contact us for help.");
    }
    if (donation.status === "completed" && donation.reference_id === data.paymentId) {
      return { verified: true };
    }
    if (donation.status !== "pending" || donation.reference_id !== data.orderId) {
      throw new Error("Payment could not be matched to your donation. Please contact us for help.");
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("donations")
      .update({ status: "completed", reference_id: data.paymentId })
      .eq("id", data.donationId)
      .eq("reference_id", data.orderId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError || !updated) throw new Error("Payment could not be recorded. Please contact us for help.");
    return { verified: true };
  });