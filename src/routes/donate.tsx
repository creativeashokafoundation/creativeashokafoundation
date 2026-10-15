import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDonationOrder, verifyDonationPayment } from "@/lib/razorpay.functions";
import { toast } from "sonner";
import { CheckCircle2, Heart, LockKeyhole, RotateCcw } from "lucide-react";

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
      { name: "description", content: "Donate securely through Razorpay. Support Creative Ashoka Foundation's on-ground programs." },
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
  const [address, setAddress] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [cause, setCause] = useState("General donation");
  const [isPaying, setIsPaying] = useState(false);
  const [confirmedDonation, setConfirmedDonation] = useState<{
    amount: number;
    cause: string;
    isAnonymous: boolean;
    email: string;
  } | null>(null);

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
        address,
        isAnonymous,
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
            setConfirmedDonation({ amount: parsedAmount, cause, isAnonymous, email });
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
      <PageHero
        eyebrow={confirmedDonation ? "Donation successful" : "Donate"}
        title={confirmedDonation ? "Your donation is confirmed." : "Fund real change — transparently."}
        subtitle={confirmedDonation ? "Thank you for helping Creative Ashoka Foundation support its on-ground programs." : "Every contribution is acknowledged with an 80G tax-exemption receipt. Funds are deployed within 30 days and reported publicly."}
      />

      <section className="section-y">
        <div className="container-page max-w-2xl">
          {confirmedDonation ? (
            <div className="mx-auto max-w-xl text-center" role="status" aria-live="polite">
              <CheckCircle2 className="mx-auto h-14 w-14 text-accent" aria-hidden="true" />
              <h2 className="mt-5 font-display text-2xl font-bold text-primary">Thank you for your generosity.</h2>
              <p className="mt-2 text-muted-foreground">Your payment has been verified securely by Razorpay.</p>

              <dl className="mx-auto mt-8 grid max-w-md gap-4 border-y border-border py-5 text-left sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Donation amount</dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-primary">₹{confirmedDonation.amount.toLocaleString("en-IN")}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Supporting</dt>
                  <dd className="mt-1 font-medium text-primary">{confirmedDonation.cause}</dd>
                </div>
                {!confirmedDonation.isAnonymous && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">Certificate email</dt>
                    <dd className="mt-1 break-all font-medium text-primary">{confirmedDonation.email}</dd>
                  </div>
                )}
              </dl>

              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {confirmedDonation.isAnonymous
                  ? "Because this donation is anonymous, we don’t have an email address to send a Section 354(4) certificate to."
                  : "Your Section 354(4) donation certificate will be emailed once its official details are finalized."}
              </p>

              <Button type="button" variant="outline" className="mt-8" onClick={() => setConfirmedDonation(null)}>
                <RotateCcw className="h-4 w-4" />
                Make another donation
              </Button>
            </div>
          ) : (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
            <div className="flex items-center gap-2 text-accent">
              <Heart className="h-5 w-5" />
              <h3 className="font-display font-semibold text-primary">Donate securely</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Choose an amount and make your contribution through Razorpay.</p>
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
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="donation-anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => {
                      const anonymous = checked === true;
                      setIsAnonymous(anonymous);
                      if (anonymous) {
                        setDonorName("");
                        setEmail("");
                        setPhone("");
                        setPan("");
                        setAddress("");
                      }
                    }}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="donation-anonymous" className="cursor-pointer">Make this an anonymous donation</Label>
                    <p className="text-xs text-muted-foreground">Your name and contact details won’t be saved with this donation.</p>
                  </div>
                </div>
                {!isAnonymous && (
                  <>
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
                      <Label htmlFor="donor-address">Address (for tax certificate, optional)</Label>
                      <Input id="donor-address" autoComplete="street-address" maxLength={500} value={address} onChange={(event) => setAddress(event.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground">Add your PAN and address to receive a donation certificate under the Income Tax Act, emailed from donations@creativeashoka.org.</p>
                  </>
                )}
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
          </div>
          )}

        </div>
      </section>

      {!confirmedDonation && <section className="bg-[color:var(--cream)] section-y">
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
      </section>}
    </>
  );
}
