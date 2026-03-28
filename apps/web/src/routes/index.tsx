import { Link, createFileRoute } from "@tanstack/react-router"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-svh bg-background font-body text-foreground">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Hero section */}
      <section className="relative z-[2] flex min-h-svh flex-col items-center justify-center px-6">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/3 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        {/* Top nav bar */}
        <nav className="absolute top-0 right-0 left-0 flex items-center justify-between px-8 py-6">
          <span className="font-display text-sm tracking-[0.3em] text-primary/40 uppercase">
            Est. 2024
          </span>
          <div className="flex items-center gap-8">
            <a
              href="#philosophy"
              className="text-xs tracking-[0.2em] text-muted-foreground/60 uppercase transition-colors hover:text-foreground/60"
            >
              Philosophy
            </a>
            <a
              href="#services"
              className="text-xs tracking-[0.2em] text-muted-foreground/60 uppercase transition-colors hover:text-foreground/60"
            >
              Services
            </a>
            <a
              href="#contact"
              className="text-xs tracking-[0.2em] text-muted-foreground/60 uppercase transition-colors hover:text-foreground/60"
            >
              Contact
            </a>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground/60"
            >
              {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
            <span className="text-[10px] tracking-[0.5em] text-primary/50 uppercase">
              Exclusive Access
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
          </div>

          <h1 className="cursor-default font-display text-[clamp(4rem,12vw,10rem)] leading-[0.85] font-light tracking-tight text-foreground select-none">
            Priv<span className="text-primary italic">e</span>
          </h1>

          <p className="mx-auto mt-8 max-w-md font-body text-base leading-relaxed text-muted-foreground">
            Where discretion meets distinction. A private platform for those who understand that
            true luxury is invisible.
          </p>

          <div className="mt-12 flex items-center justify-center gap-6">
            <a
              href="#philosophy"
              className="group relative inline-flex items-center gap-2 border border-border px-8 py-3 text-xs tracking-[0.2em] text-muted-foreground uppercase transition-all hover:border-primary/30 hover:text-primary"
            >
              <span>Discover</span>
              <svg
                className="size-3 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[9px] tracking-[0.4em] text-muted-foreground/40 uppercase">
              Scroll
            </span>
            <div className="h-8 w-px bg-gradient-to-b from-muted-foreground/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* Philosophy section */}
      <section id="philosophy" className="relative z-[2] px-6 py-32">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-16 md:grid-cols-2 md:gap-24">
            <div>
              <span className="text-[10px] tracking-[0.5em] text-primary/40 uppercase">
                01 &mdash; Philosophy
              </span>
              <h2 className="mt-4 font-display text-4xl font-light tracking-tight text-foreground/90">
                Built for the
                <br />
                <span className="text-primary italic">discerning</span> few
              </h2>
            </div>
            <div className="flex flex-col justify-end">
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                Not everything needs to be public. Some platforms are built for visibility; ours is
                built for control. Every feature, every interaction is designed with intentional
                restraint &mdash; because power doesn&rsquo;t need to announce itself.
              </p>
              <div className="mt-8 h-px w-full bg-gradient-to-r from-border via-primary/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Services section */}
      <section id="services" className="relative z-[2] px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-20 text-center">
            <span className="text-[10px] tracking-[0.5em] text-primary/40 uppercase">
              02 &mdash; Services
            </span>
            <h2 className="mt-4 font-display text-4xl font-light tracking-tight text-foreground/90">
              Curated <span className="text-primary italic">capabilities</span>
            </h2>
          </div>

          <div className="grid gap-px bg-border/30 md:grid-cols-3">
            {[
              {
                number: "I",
                title: "Secure Vault",
                description:
                  "End-to-end encrypted file management with granular access controls and audit trails.",
              },
              {
                number: "II",
                title: "Identity",
                description:
                  "Multi-layered authentication with biometric support and session intelligence.",
              },
              {
                number: "III",
                title: "Analytics",
                description:
                  "Real-time insights with privacy-first data processing. No external tracking.",
              },
            ].map((service) => (
              <div
                key={service.number}
                className="group relative bg-background p-10 transition-colors hover:bg-accent"
              >
                <span className="font-display text-5xl font-light text-primary/10 transition-colors group-hover:text-primary/20">
                  {service.number}
                </span>
                <h3 className="mt-6 font-display text-lg font-light tracking-tight text-foreground/80">
                  {service.title}
                </h3>
                <p className="mt-3 font-body text-xs leading-relaxed text-muted-foreground/60">
                  {service.description}
                </p>
                <div className="mt-8 h-px w-8 bg-primary/20 transition-all group-hover:w-16 group-hover:bg-primary/40" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section id="contact" className="relative z-[2] px-6 py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[10px] tracking-[0.5em] text-primary/40 uppercase">
            03 &mdash; Contact
          </span>
          <h2 className="mt-4 font-display text-4xl font-light tracking-tight text-foreground/90">
            By invitation <span className="text-primary italic">only</span>
          </h2>
          <p className="mt-6 font-body text-sm leading-relaxed text-muted-foreground/60">
            Access is granted on a referral basis. If you&rsquo;ve been given credentials, you
            already know how to proceed.
          </p>
          <div className="mt-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-3 border border-border bg-accent/30 px-10 py-4 text-xs tracking-[0.25em] text-muted-foreground uppercase transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
            >
              Member Access
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-[2] border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-display text-xs tracking-[0.2em] text-muted-foreground/30">
            Priv<span className="italic">e</span> &copy; 2024
          </span>
          <span className="text-[9px] tracking-[0.3em] text-muted-foreground/20 uppercase">
            All rights reserved
          </span>
        </div>
      </footer>
    </div>
  )
}
