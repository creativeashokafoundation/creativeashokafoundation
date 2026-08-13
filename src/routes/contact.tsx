import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Layout";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Linkedin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Creative Ashoka Foundation" },
      { name: "description", content: "Get in touch with our team for partnerships, media, donations or volunteering enquiries." },
      { property: "og:title", content: "Contact Creative Ashoka Foundation" },
      { property: "og:description", content: "Reach our office in Lucknow or message us online." },
    ],
  }),
  component: Contact,
});

const cls = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

function Contact() {
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || null,
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
    });
    setLoading(false);
    if (error) { toast.error("Could not send message. Please try again."); return; }
    toast.success("Message sent! We'll reply within 2 working days.");
    form.reset();
  };

  return (
    <>
      <PageHero eyebrow="Contact" title="We'd love to hear from you." subtitle="Partnerships, media, donor support, beneficiary requests — write to us, and a real human will reply." />
      <section className="section-y">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-display text-lg font-semibold text-primary">Head Office</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-accent" /> Rukmani Apartment, 6 Chandra Lok Colony, Aliganj, Lucknow-226024</li>
                <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-accent" /> <a href="tel:+919250915092" className="hover:text-accent">+91 92509 15092</a></li>
                <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 text-accent" /> <a href="mailto:info@creativeashoka.org" className="hover:text-accent">info@creativeashoka.org</a></li>
                <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 text-accent" /> Mon – Sat · 10:00 AM – 6:00 PM</li>
              </ul>
              <div className="mt-5 flex items-center gap-3">
              {[
                { I: Instagram, href: "https://www.instagram.com/creativeashoka/", label: "Instagram" },
                { I: Facebook, href: "https://www.facebook.com/CreativeAshoka/", label: "Facebook" },
                { I: Linkedin, href: "https://www.linkedin.com/company/creative-ashoka-foundation/posts/?feedView=all", label: "LinkedIn" },
              ].map(({ I, href, label }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border p-2 text-foreground/70 hover:text-accent"><I className="h-4 w-4" /></a>
              ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
              <iframe
                title="Office location"
                src="https://www.google.com/maps?q=26.8869814,80.946687&output=embed"
                className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8 self-start">
            <h3 className="font-display text-2xl font-bold text-primary">Send a message</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name *"><input required name="name" maxLength={120} className={cls} /></Field>
              <Field label="Email *"><input required name="email" type="email" maxLength={160} className={cls} /></Field>
              <Field label="Phone"><input name="phone" type="tel" maxLength={15} className={cls} /></Field>
              <Field label="Subject">
                <select name="subject" className={cls} defaultValue="general">
                  <option value="general">General Enquiry</option>
                  <option value="donor">Donor Support</option>
                  <option value="partner">Partnerships</option>
                  <option value="media">Media</option>
                </select>
              </Field>
            </div>
            <Field label="Message *">
              <textarea required name="message" rows={5} maxLength={1500} className={`${cls} min-h-[140px]`} />
            </Field>
            <button disabled={loading} className="mt-2 inline-flex items-center justify-center gap-2 rounded-md gradient-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-soft hover:opacity-95 disabled:opacity-60">
              {loading ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground/70">{label}</span>
      {children}
    </label>
  );
}
