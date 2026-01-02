import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Car,
  Star,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Mail,
} from "lucide-react";

const packages = [
  {
    name: "Studio Refresh",
    price: "$195",
    description: "A clean, crisp reset for daily drivers and weekend cruisers.",
    features: [
      "Hand wash + decon",
      "Light polish for gloss",
      "Interior reset + steam wipe",
      "Trim + tire dressing",
      "Glass clarity treatment",
    ],
  },
  {
    name: "Gloss & Guard",
    price: "$620",
    description: "Paint correction with a 2-year ceramic shield.",
    features: [
      "Single-stage correction",
      "Ceramic coating (2-year)",
      "Wheel face protection",
      "Hydrophobic glass seal",
      "Maintenance wash kit",
    ],
    featured: true,
  },
  {
    name: "Collector's Finish",
    price: "$1,140",
    description: "Multi-stage correction for concours-ready depth.",
    features: [
      "Multi-stage correction",
      "5-year ceramic protection",
      "Engine bay detail",
      "Leather conditioning",
      "Pickup + delivery",
    ],
  },
];

const testimonials = [
  {
    name: "Jordan Miles",
    role: "Porsche 911 Owner",
    quote:
      "The paint correction was honest and transparent. They sent progress photos and the finish is unreal.",
  },
  {
    name: "Elena Rossi",
    role: "BMW M4 Owner",
    quote:
      "Every detail felt considered. The ceramic coating still sheets water months later.",
  },
  {
    name: "Marcus Hill",
    role: "Range Rover Sport",
    quote:
      "Interior restoration was the best I've seen. No residue, no gloss—just clean, soft leather.",
  },
];

const reviews = [
  {
    label: "Local collectors",
    score: "5.0",
    count: "280+ reviews",
  },
  {
    label: "Community rating",
    score: "4.9",
    count: "Trusted studio",
  },
  {
    label: "Client retention",
    score: "92%",
    count: "returning clients",
  },
];

const gallery = [
  "Ceramic-coated coupe under studio LEDs",
  "Luxury SUV interior, leather revived",
  "Classic muscle car paint correction",
  "Matte wrap protection detail",
];

const Index = () => {
  const [selectedPackage, setSelectedPackage] = useState("Gloss & Guard");
  const desiredPackageRef = useRef<HTMLInputElement | null>(null);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReserve = (pkgName: string) => {
    setSelectedPackage(pkgName);
    scrollToSection("contact");
    setTimeout(() => desiredPackageRef.current?.focus(), 300);
  };

  const mailtoLink = `mailto:hello@keylinestudios.com?subject=${encodeURIComponent(
    "Keyline Studios booking request"
  )}&body=${encodeURIComponent(
    `Hi Keyline Studios,%0D%0A%0D%0AI'd like to book the ${selectedPackage} package.%0D%0AVehicle: %0D%0APreferred date: %0D%0AAdditional notes: `
  )}`;
  return (
    <div className="min-h-screen bg-[#f7f5f2] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-[#f7f5f2]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">Keyline Studios</p>
              <p className="text-xs text-muted-foreground">Independent auto detailing studio</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="transition hover:text-foreground" href="#packages">
              Packages
            </a>
            <a className="transition hover:text-foreground" href="#results">
              Results
            </a>
            <a className="transition hover:text-foreground" href="#testimonials">
              Testimonials
            </a>
            <a className="transition hover:text-foreground" href="#contact">
              Contact
            </a>
          </nav>
          <button
            className="hidden items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition hover:brightness-110 md:flex"
            onClick={() => scrollToSection("contact")}
            type="button"
          >
            Book a visit
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-4 py-1 text-xs font-medium text-muted-foreground">
                Est. 2016 · By appointment only
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Studio-level detailing for collectors, commuters, and everyone in between.
              </h1>
              <p className="text-lg text-muted-foreground">
                We focus on thoughtful, high-touch work: paint correction, ceramic coatings, and
                interior restoration done in a calm, controlled studio. No shortcuts, no rush.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                  onClick={() => scrollToSection("packages")}
                  type="button"
                >
                  Plan your detail
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  className="flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-primary"
                  onClick={() => scrollToSection("results")}
                  type="button"
                >
                  Browse recent work
                </button>
              </div>
              <div className="grid gap-4 pt-4 sm:grid-cols-3">
                {reviews.map((review) => (
                  <div
                    key={review.label}
                    className="rounded-2xl border border-border/60 bg-white/80 px-4 py-3"
                  >
                    <p className="text-xs text-muted-foreground">{review.label}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-lg font-semibold">{review.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{review.count}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-border/60 bg-white/80 p-6 shadow-2xl backdrop-blur">
              <div className="space-y-6">
                <div className="rounded-3xl bg-muted/20 p-6">
                  <p className="text-sm text-muted-foreground">In the studio</p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    A calm, controlled space built for precision.
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We work under diffused lighting, document every stage, and finish with coatings
                    tailored to your paint and climate.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: Shield,
                      title: "Protection",
                      text: "Ceramic coatings and sealants matched to your lifestyle.",
                    },
                    {
                      icon: Sparkles,
                      title: "Finish",
                      text: "Depth and clarity with honest, measured correction.",
                    },
                    {
                      icon: Car,
                      title: "Interior",
                      text: "Leather, suede, and trim restored without shine.",
                    },
                    {
                      icon: Check,
                      title: "Quality",
                      text: "Two-person inspection before we hand back the keys.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-border/60 bg-white/70 p-4"
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      <p className="mt-3 font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="packages" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Packages</p>
              <h2 className="mt-2 text-3xl font-semibold">Packages that feel personal</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Each package is a starting point. We review paint condition, interior materials,
                and your schedule before finalizing the scope.
              </p>
            </div>
            <a
              className="flex items-center gap-2 rounded-full border border-border bg-white/80 px-5 py-2 text-sm font-medium text-foreground transition hover:border-primary/60 hover:text-primary"
              href="#contact"
            >
              Service menu (placeholder)
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative flex h-full flex-col justify-between rounded-3xl border px-6 py-8 shadow-lg transition hover:-translate-y-1 ${
                  pkg.featured
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 bg-white/80"
                }`}
              >
                {pkg.featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{pkg.name}</h3>
                    <span className="text-2xl font-semibold text-primary">{pkg.price}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{pkg.description}</p>
                  <ul className="mt-6 space-y-3 text-sm">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  className="mt-8 flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:brightness-110"
                  onClick={() => handleReserve(pkg.name)}
                  type="button"
                >
                  Reserve a slot
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section id="results" className="bg-white/70 py-16">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 md:grid-cols-[1fr_1fr] md:items-center">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Results</p>
              <h2 className="text-3xl font-semibold">Studio-grade results you can feel</h2>
              <p className="text-muted-foreground">
                From matte wraps to metallic paint, our controlled studio environment keeps every
                stage consistent. We log process notes and make them available after delivery.
              </p>
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                {gallery.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border/60 bg-white/80 p-4 text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-border/60 bg-white/80 p-6">
              <div className="grid gap-5">
                {[
                  {
                    title: "Paint correction",
                    detail: "Measured correction based on paint thickness readings.",
                  },
                  {
                    title: "Interior rejuvenation",
                    detail: "Steam extraction, trim restoration, and odor neutralization.",
                  },
                  {
                    title: "Protection",
                    detail: "Ceramic, graphene, and sealant options by use case.",
                  },
                  {
                    title: "Maintenance",
                    detail: "Monthly or seasonal care plans to protect the finish.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start justify-between gap-6 rounded-2xl border border-border/60 bg-white/80 p-4"
                  >
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                ))}
              </div>
              <a
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white/90 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-primary"
                href="https://instagram.com/keylinestudios"
                rel="noreferrer"
                target="_blank"
              >
                View results on Instagram
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section id="testimonials" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Testimonials</p>
              <h2 className="mt-2 text-3xl font-semibold">Trusted by owners who care</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full border border-border/60 bg-white/80 px-4 py-2 text-sm text-muted-foreground">
                140+ vehicles detailed this year
              </div>
              <div className="rounded-full border border-border/60 bg-white/80 px-4 py-2 text-sm text-muted-foreground">
                92% repeat clients
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="flex h-full flex-col justify-between rounded-3xl border border-border/60 bg-white/80 p-6"
              >
                <div>
                  <div className="flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">“{testimonial.quote}”</p>
                </div>
                <div className="mt-6">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="border-t border-border/60 bg-white/70">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Visit</p>
              <h2 className="text-3xl font-semibold">Book a Keyline studio visit</h2>
              <p className="text-muted-foreground">
                We take a limited number of vehicles each week to keep quality high. Share your
                goals and we’ll build a plan that fits your calendar.
              </p>
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
                This is also where we can add a live calendar so appointments never overlap or get
                double-booked.
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-white/80 p-4">
                  <p className="text-sm font-semibold">Studio hours</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    Mon - Sat · 8:00am - 7:00pm
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-white/80 p-4">
                  <p className="text-sm font-semibold">Location</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    2149 Aurora Lane, Los Angeles, CA 90015
                  </p>
                </div>
              </div>
              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-white/80 p-4 text-sm">
                  <p className="font-semibold">Contact</p>
                  <a
                    className="mt-2 flex items-center gap-2 text-muted-foreground hover:text-primary"
                    href="mailto:hello@keylinestudios.com"
                  >
                    <Mail className="h-4 w-4" />
                    hello@keylinestudios.com
                  </a>
                  <a
                    className="mt-2 flex items-center gap-2 text-muted-foreground hover:text-primary"
                    href="tel:+13235550192"
                  >
                    <Phone className="h-4 w-4" />
                    (323) 555-0192
                  </a>
                </div>
                <div className="rounded-2xl border border-border/60 bg-white/80 p-4 text-sm">
                  <p className="font-semibold">Social</p>
                  <a
                    className="mt-2 flex items-center gap-2 text-muted-foreground hover:text-primary"
                    href="https://instagram.com/keylinestudios"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Instagram className="h-4 w-4" />
                    @keylinestudios
                  </a>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-border/60 bg-white/90 p-6">
              <h3 className="text-xl font-semibold">Request a booking</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us a bit about your vehicle and we’ll respond within one business day.
              </p>
              <form className="mt-6 space-y-3 text-sm">
                <input
                  className="w-full rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-foreground placeholder:text-muted-foreground"
                  placeholder="Full name"
                  type="text"
                />
                <input
                  className="w-full rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-foreground placeholder:text-muted-foreground"
                  placeholder="Vehicle year, make, model"
                  type="text"
                />
                <input
                  ref={desiredPackageRef}
                  className="w-full rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-foreground placeholder:text-muted-foreground"
                  onChange={(event) => setSelectedPackage(event.target.value)}
                  placeholder="Desired package"
                  type="text"
                  value={selectedPackage}
                />
                <input
                  className="w-full rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-foreground placeholder:text-muted-foreground"
                  placeholder="Preferred date"
                  type="text"
                />
                <textarea
                  className="min-h-[110px] w-full rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-foreground placeholder:text-muted-foreground"
                  placeholder="Notes (paint condition, interior focus, timeline)"
                />
                <a
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                  href={mailtoLink}
                >
                  Submit inquiry
                  <Mail className="h-4 w-4" />
                </a>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-[#f7f5f2]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2024 Keyline Studios. Independent auto detailing studio.</p>
          <div className="flex items-center gap-6">
            <span>Instagram · @keylinestudios</span>
            <span>hello@keylinestudios.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
