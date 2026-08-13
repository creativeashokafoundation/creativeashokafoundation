import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Phone, MapPin, Linkedin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import logo from "@/assets/logo.png";


export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-[color:var(--cream)]">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-10 w-10" width={40} height={40} />
            <div className="leading-tight">
              <div className="font-display font-bold text-primary">Creative Ashoka</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Foundation</div>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Serving humanity, creating hope — empowering underprivileged communities
            through education, healthcare and sustainable development.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a aria-label="Instagram" href="https://www.instagram.com/creativeashoka/" className="rounded-full border border-border p-2 text-foreground/70 hover:text-accent"><Instagram className="h-4 w-4" /></a>
            <a aria-label="Facebook" href="https://www.facebook.com/CreativeAshoka/" className="rounded-full border border-border p-2 text-foreground/70 hover:text-accent"><Facebook className="h-4 w-4" /></a>
            <a aria-label="LinkedIn" href="https://www.linkedin.com/company/creative-ashoka-foundation/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="rounded-full border border-border p-2 text-foreground/70 hover:text-accent"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["/about", "About Us"],
              ["/work", "Our Work"],
              ["/projects", "Projects"],
              ["/donate", "Donate"],
              ["/volunteer", "Volunteer"],
              
              ["/contact", "Contact"],
            ].map(([to, label]) => (
              <li key={to}><Link to={to} className="text-foreground/75 hover:text-accent">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">Reach Us</h4>
          <ul className="mt-4 space-y-3 text-sm text-foreground/80">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-accent" /> Rukmani Apartment, 6 Chandra Lok Colony, Aliganj, Lucknow-226024</li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-accent" /> <a href="tel:+919250915092" className="hover:text-accent">+91 92509 15092</a></li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 text-accent" /> <a href="mailto:info@creativeashoka.org" className="hover:text-accent">info@creativeashoka.org</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">About This Website</h4>
          <p className="mt-4 text-sm text-muted-foreground">
            This digital platform was created to support the mission, transparency, community
            engagement, volunteer participation, and social impact initiatives of Creative Ashoka
            Foundation.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <button className="mt-3 text-sm font-medium text-accent underline-offset-4 hover:underline">
                About This Website
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-primary">Website Credits</DialogTitle>
                <DialogDescription>
                  This website was designed and developed to strengthen the digital presence,
                  transparency, and outreach efforts of Creative Ashoka Foundation.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Developers</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                    <span className="font-medium text-foreground">Rishi Patel</span>
                    <a
                      href="https://www.linkedin.com/in/prishix"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Rishi Patel on LinkedIn"
                      className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="text-xs">LinkedIn</span>
                    </a>
                  </li>
                  <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                    <span className="font-medium text-foreground">Anshika Tiwari</span>
                    <a
                      href="https://www.linkedin.com/in/anshika-tiwari-452425329/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Anshika Tiwari on LinkedIn"
                      className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="text-xs">LinkedIn</span>
                    </a>
                  </li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Creative Ashoka Foundation. All Rights Reserved.</p>
          <p>Registered Indian Non-Profit · 80G & 12A Certified</p>
        </div>
      </div>
    </footer>
  );
}
