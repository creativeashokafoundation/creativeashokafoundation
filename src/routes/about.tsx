import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Layout";
import { Heart, Eye, Compass, Users, Shield, HandHeart, Sparkles } from "lucide-react";
const dibyanshAsset = { url: "/images/leadership/dibyansh-rao.jpg" };
const saurabhAsset = { url: "/images/leadership/saurabh-singh.jpg" };
const animeshAsset = { url: "/images/leadership/animesh-mishra.png" };
const prashantAsset = { url: "/images/leadership/prashant-pandey.jpg" };


export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Creative Ashoka Foundation" },
      { name: "description", content: "Our story, mission, vision and leadership team driving social change across India." },
      { property: "og:title", content: "About Creative Ashoka Foundation" },
      { property: "og:description", content: "Compassion, transparency and service — the principles behind every initiative we run." },
    ],
  }),
  component: About,
});

const values = [
  { icon: Heart, t: "Compassion", d: "We listen first, judge never, and act with empathy." },
  { icon: Shield, t: "Transparency", d: "Every rupee, every report — fully open to our donors." },
  { icon: Users, t: "Equality", d: "Caste, creed and gender never decide who we serve." },
  { icon: HandHeart, t: "Service", d: "We measure success in lives lifted, not awards won." },
  { icon: Sparkles, t: "Integrity", d: "Doing the right thing — even when no one is watching." },
];

const leaders = [
  { name: "Dibyansh Rao", role: "Founder", bio: "Leads the vision and strategic direction of Creative Ashoka Foundation, driving initiatives that create meaningful and sustainable social impact in communities.", img: dibyanshAsset.url },
  { name: "Saurabh Singh", role: "Co-Founder", bio: "Supports organizational growth and development while helping strengthen community outreach, partnerships, and foundation initiatives.", img: saurabhAsset.url },
  { name: "Animesh Mishra", role: "Secretary", bio: "Oversees coordination, administration, and operational activities to ensure the smooth execution of programs and organizational objectives.", img: animeshAsset.url },
  { name: "Prashant Pandey", role: "PROJECT COORDINATOR", bio: "Leads the project and support programs,works closely with volunteers and beneficiaries to expand educational opportunities for children and youth.", img: prashantAsset.url },
];


function About() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="A movement of ordinary Indians doing extraordinary things."
        subtitle="Creative Ashoka Foundation began with a simple belief — that no child should sleep hungry, no parent should choose between medicine and meals, and no woman should be invisible."
      />

      <section className="section-y">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">OUR STORY</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary">From a vision of service to a growing movement of hope.</h2>
            <p className="mt-4 text-foreground/80">
              Creative Ashoka Foundation began in Lucknow with a simple belief—that collective compassion can transform lives. What started as a small initiative has grown into a mission-driven organization powered by 100+ passionate volunteers, working together to create meaningful social impact.
            </p>
            <p className="mt-3 text-foreground/80">
              Today, our work reaches 3+ cities through education, food support, women empowerment, animal welfare, and environmental conservation. Every initiative reflects our commitment to building stronger communities and creating lasting change—one life, one family, and one community at a time.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <Compass className="h-7 w-7 text-accent" />
              <h3 className="mt-3 font-display text-lg font-semibold text-primary">Mission</h3>
              <p className="mt-2 text-sm text-muted-foreground">To uplift underprivileged individuals and communities through education, healthcare, social welfare and sustainable development initiatives.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <Eye className="h-7 w-7 text-accent" />
              <h3 className="mt-3 font-display text-lg font-semibold text-primary">Vision</h3>
              <p className="mt-2 text-sm text-muted-foreground">An India where every person — regardless of birth or background — has the dignity, opportunity and care to live their fullest life.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--cream)] section-y">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Core Values</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary">The principles we never bend.</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {values.map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full gradient-accent text-accent-foreground"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-3 font-display font-semibold text-primary">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Leadership</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary">Meet the people behind the work.</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leaders.map((l) => (
              <div key={l.name} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                <img src={l.img} alt={l.name} loading="lazy" className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-accent/30" />
                <h3 className="mt-4 font-display font-semibold text-primary">{l.name}</h3>
                <p className="text-xs uppercase tracking-wider text-accent">{l.role}</p>
                <p className="mt-3 text-sm text-muted-foreground">{l.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
