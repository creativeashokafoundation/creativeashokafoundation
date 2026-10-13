import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDonationOrder, verifyDonationPayment } from "@/lib/razorpay.functions";
import { toast } from "sonner";
import { Building2, QrCode, Copy, Heart, LockKeyhole } from "lucide-react";
const qrAsset = { url: "/images/caf-upi-qr.jpeg" };

type CheckoutSuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type CheckoutFailure = { error?: { description?: string } };

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: CheckoutSuccess) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: "payment.failed", callback: (response: CheckoutFailure) => void) => void;
    };
  }
}

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate — Creative Ashoka Foundation" },
      { name: "description", content: "Donate securely through Razorpay, UPI QR code, or bank transfer. Support Creative Ashoka Foundation's on-ground programs." },
      { property: "og:title", content: "Donate to Creative Ashoka Foundation" },
      { property: "og:description", content: "Your contribution funds meals, scholarships and lifesaving care. 80G certified." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Donate,
});

function Donate() {
  const createOrder = useServerFn(createDonationOrder);
  const verifyPayment = useServerFn(verifyDonationPayment);
  const [amount, setAmount] = useState("500");
  const [donorName, setDonorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pan, setPan] = useState("");
  const [cause, setCause] = useState("General donation");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  const loadCheckout = async () => {
    if (window.Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load secure payment checkout."));
      document.body.appendChild(script);
    });
  };

  const handleDonate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 1) {
      toast.error("Enter a valid donation amount in rupees.");
      return;
    }

    setIsPaying(true);
    try {
      await loadCheckout();
      const order = await createOrder({ data: {
        donorName,
        email,
        phone,
        amount: parsedAmount,
        cause,
        pan,
      } });
      if (!window.Razorpay) throw new Error("Secure payment checkout is unavailable. Please try again.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Creative Ashoka Foundation",
        description: "Charitable donation",
        order_id: order.orderId,
        prefill: { name: order.donorName, email: order.email, contact: order.phone },
        theme: { color: "#1F4E79" },
        modal: { ondismiss: () => setIsPaying(false) },
        handler: async (response) => {
          try {
            await verifyPayment({ data: {
              donationId: order.donationId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            } });
            setPaymentComplete(true);
            toast.success("Thank you — your donation was confirmed.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment verification failed. Please contact us.");
          } finally {
            setIsPaying(false);
          }
        },
      });
      checkout.on("payment.failed", (response) => {
        setIsPaying(false);
        toast.error(response.error?.description || "Payment was not completed. Please try again.");
      });
      checkout.open();
    } catch (error) {
      setIsPaying(false);
      toast.error(error instanceof Error ? error.message : "Could not start payment. Please try again.");
    }
  };

  return (
    <>
      <PageHero eyebrow="Donate" title="Fund real change — transparently." subtitle="Every contribution is acknowledged with an 80G tax-exemption receipt. Funds are deployed within 30 days and reported publicly." />

      <section className="section-y">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
            <div className="flex items-center gap-2 text-accent">
              <Heart className="h-5 w-5" />
              <h3 className="font-display font-semibold text-primary">Donate securely</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Choose an amount and make your contribution through Razorpay.</p>
            {paymentComplete ? (
              <div className="mt-6 border-l-2 border-accent py-2 pl-4" role="status">
                <p className="font-semibold text-primary">Thank you for your generosity.</p>
                <p className="mt-1 text-sm text-muted-foreground">Your payment is confirmed. Your contribution supports our on-ground programs.</p>
              </div>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={handleDonate}>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Choose an amount</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2500].map((value) => (
                      <Button key={value} type="button" variant={amount === String(value) ? "default" : "outline"} className="px-2" onClick={() => setAmount(String(value))}>
                        ₹{value.toLocaleString("en-IN")}
                      </Button>
                    ))}
                    <Button type="button" variant={!["500", "1000", "2500"].includes(amount) ? "default" : "outline"} className="px-2" onClick={() => setAmount("")}>Other</Button>
                  </div>
                </fieldset>
                <div className="space-y-2">
                  <Label htmlFor="donation-amount">Amount (₹)</Label>
                  <Input id="donation-amount" type="number" min="1" max="1000000" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter an amount" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="donor-name">Full name</Label>
                    <Input id="donor-name" autoComplete="name" required maxLength={200} value={donorName} onChange={(event) => setDonorName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donor-email">Email address</Label>
                    <Input id="donor-email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="donor-phone">Phone number</Label>
                    <Input id="donor-phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donor-pan">PAN (optional)</Label>
                    <Input id="donor-pan" autoCapitalize="characters" maxLength={20} value={pan} onChange={(event) => setPan(event.target.value.toUpperCase())} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donation-cause">Support a program</Label>
                  <select id="donation-cause" value={cause} onChange={(event) => setCause(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option>General donation</option>
                    <option>UDAAN</option>
                    <option>SWABHIMAAN</option>
                    <option>ANN SE ASHIRWAD</option>
                    <option>HAR JEEVAN ANMOL</option>
                    <option>VASUNDHARA</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isPaying}>
                  <LockKeyhole className="h-4 w-4" />
                  {isPaying ? "Preparing secure payment…" : `Donate ₹${(Number(amount) || 0).toLocaleString("en-IN")}`}
                </Button>
                <p className="text-center text-xs text-muted-foreground">Your payment is processed securely by Razorpay.</p>
              </form>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
            <div className="flex items-center gap-2 text-accent">
              <Building2 className="h-5 w-5" />
              <h3 className="font-display font-semibold text-primary">Bank Transfer</h3>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Account Name", "Creative Ashoka Foundation"],
                ["Bank Name", "Axis Bank"],
                ["Account Number", "925020022668565"],
                ["IFSC Code", "UTIB0005205"],
                ["Branch", "Purani Bazar Basti"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-md bg-secondary/60 px-3 py-2">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-foreground">{v}</dd>
                  </div>
                  <button onClick={() => copy(v)} className="rounded-md p-2 text-muted-foreground hover:text-accent" aria-label={`Copy ${k}`}>
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft md:p-8">
            <div className="flex items-center justify-center gap-2 text-accent">
              <QrCode className="h-5 w-5" />
              <h3 className="font-display font-semibold text-primary">Scan QR</h3>
            </div>
            <div className="mx-auto mt-4 h-48 w-48 overflow-hidden rounded-md border border-border bg-white p-2">
              <img src={qrAsset.url} alt="Creative Ashoka Foundation UPI QR code" className="h-full w-full object-contain" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Scan this code with any UPI app to donate instantly.</p>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--cream)] section-y">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Donation Transparency</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary">Where your rupee goes</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { p: "72%", t: "Direct Programs", d: "Meals, scholarships, medical aid and relief delivered to beneficiaries." },
              { p: "18%", t: "On-ground Operations", d: "Field staff, logistics and partner coordination across cities." },
              { p: "10%", t: "Admin & Compliance", d: "Audits, statutory filings and donor reporting." },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="font-display text-3xl font-bold text-accent">{s.p}</div>
                <h3 className="mt-1 font-display font-semibold text-primary">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
