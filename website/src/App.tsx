import React, { useEffect, useRef, useState } from 'react'
import './index.css'

// ─── Fade-in hook ───────────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

// ─── Nav ────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-glass' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="font-bold text-flint-text tracking-tight text-lg">Flint</span>
        </div>
        <a
          href="https://chromewebstore.google.com/detail/flint"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary bg-flint-purple hover:bg-flint-purple-hover text-white text-sm font-semibold px-5 py-2 rounded-lg"
        >
          Add to Chrome
        </a>
      </div>
    </nav>
  )
}

// ─── Mock Score Card ─────────────────────────────────────────────────────────
function MockScoreCard() {
  const [stage, setStage] = useState(0) // 0: bad prompt, 1: analyzing, 2: scored, 3: improved

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1200),
      setTimeout(() => setStage(2), 2400),
      setTimeout(() => setStage(3), 4000),
      setTimeout(() => setStage(0), 7000),
    ]
    const loop = setInterval(() => {
      setStage(0)
      setTimeout(() => setStage(1), 1200)
      setTimeout(() => setStage(2), 2400)
      setTimeout(() => setStage(3), 4000)
    }, 8000)
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(loop)
    }
  }, [])

  return (
    <div className="relative animate-float">
      {/* Claude-like input area */}
      <div className="bg-[#1a1a2e] border border-flint-border rounded-2xl p-4 w-72 glow-border">
        {/* Fake textarea */}
        <div className="bg-flint-bg rounded-lg px-3 py-2 mb-3 min-h-[56px] border border-flint-border">
          <p className="text-flint-muted text-xs leading-relaxed">
            {stage < 3
              ? 'fix the bug in my code'
              : 'Fix the TypeError in my React useEffect hook — the dependency array is missing "userId" which causes stale closure. Current stack: React 18, TypeScript.'}
          </p>
          {stage < 3 && (
            <span className="inline-block w-0.5 h-3 bg-flint-purple mt-0.5 animate-pulse" />
          )}
        </div>

        {/* Score widget */}
        <div className="flex flex-col gap-2">
          {stage === 0 && (
            <button className="self-end bg-flint-card border border-flint-border rounded-full px-3 py-1 text-flint-purple text-xs font-semibold flex items-center gap-1.5">
              <span>⚡</span> Score my prompt
            </button>
          )}

          {stage === 1 && (
            <div className="self-end bg-flint-card border border-flint-border rounded-full px-3 py-1 text-flint-muted text-xs font-semibold">
              Scoring...
            </div>
          )}

          {(stage === 2 || stage === 3) && (
            <div className="bg-flint-card border border-flint-border rounded-xl p-3 score-badge-animate">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-red-500 text-white text-xs font-bold rounded-md px-2 py-0.5">
                  {stage === 2 ? '2/10' : '9/10'}
                </span>
                <span className="text-flint-muted text-xs">Prompt score</span>
              </div>
              {stage === 2 && (
                <>
                  <p className="text-flint-text text-xs leading-relaxed mb-2">
                    Too vague — add the error type, language, and what you've tried.
                  </p>
                  <button className="w-full bg-flint-purple text-white text-xs font-semibold rounded-lg py-1.5">
                    ✦ Improve it
                  </button>
                </>
              )}
              {stage === 3 && (
                <p className="text-flint-success text-xs font-medium">
                  ✓ Prompt rewritten — Claude will nail this.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating label */}
      <div className="absolute -top-3 -right-3 bg-flint-purple text-white text-[10px] font-bold px-2 py-1 rounded-full">
        LIVE
      </div>
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero-gradient min-h-screen flex items-center pt-20 pb-24 px-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-flint-purple/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-flint-amber/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-flint-card border border-flint-border rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-flint-success rounded-full animate-pulse" />
              <span className="text-flint-muted text-xs font-medium">Free Chrome Extension</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6 text-flint-text">
              Your prompts{' '}
              <span className="gradient-text">are weak.</span>
              <br />
              Flint fixes that.
            </h1>

            <p className="text-lg text-flint-muted leading-relaxed mb-10 max-w-md">
              Score and rewrite your Claude.ai prompts in real time. Get a 1–10 rating and one-click rewrites — no prompt engineering required.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://chromewebstore.google.com/detail/flint"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary bg-flint-purple hover:bg-flint-purple-hover text-white font-bold px-7 py-3.5 rounded-xl text-base flex items-center gap-2"
              >
                <span>🔥</span> Add to Chrome — Free
              </a>
              <a
                href="#how-it-works"
                className="border border-flint-border text-flint-muted hover:text-flint-text hover:border-flint-purple/50 font-semibold px-7 py-3.5 rounded-xl text-base transition-colors"
              >
                See how it works ↓
              </a>
            </div>

            {/* Social proof chips */}
            <div className="flex flex-wrap gap-3 mt-8">
              {['Works on Claude.ai', 'No account needed', 'Free forever'].map((label) => (
                <span
                  key={label}
                  className="text-xs text-flint-muted bg-flint-card border border-flint-border rounded-full px-3 py-1"
                >
                  ✓ {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: mock UI */}
          <div className="flex justify-center lg:justify-end">
            <MockScoreCard />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Type a prompt in Claude',
    desc: 'Flint watches Claude.ai and activates automatically. No extra tabs, no setup required.',
    emoji: '💬',
  },
  {
    num: '02',
    title: 'Get your score instantly',
    desc: 'See a 1–10 rating with one plain-English tip on exactly what to fix.',
    emoji: '⚡',
  },
  {
    num: '03',
    title: 'Hit "Improve it"',
    desc: 'Flint rewrites your prompt for you. No prompt engineering knowledge needed.',
    emoji: '✍️',
  },
  {
    num: '04',
    title: 'Watch Claude nail it',
    desc: 'Aim for 8+ and Claude actually understands what you want. Better outputs, every time.',
    emoji: '🎯',
  },
]

function HowItWorks() {
  const ref = useFadeIn() as React.RefObject<HTMLElement>
  return (
    <section
      id="how-it-works"
      ref={ref as React.RefObject<HTMLElement>}
      className="fade-in-section py-28 px-6 relative"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-flint-purple text-sm font-semibold tracking-widest uppercase mb-3">How it works</p>
          <h2 className="text-4xl lg:text-5xl font-black text-flint-text tracking-tight">
            From meh to 🔥 in one click
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="bg-flint-card border border-flint-border rounded-2xl p-6 relative feature-card"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{step.emoji}</span>
                <span className="text-flint-border font-black text-3xl leading-none">{step.num}</span>
              </div>
              <h3 className="font-bold text-flint-text text-base mb-2">{step.title}</h3>
              <p className="text-flint-muted text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-time scoring',
    desc: 'See your prompt score before you hit send. Know it\'s good before Claude reads it.',
  },
  {
    icon: '✍️',
    title: 'One-click rewrites',
    desc: 'Bad prompt? Flint rewrites it instantly. No editing, no guessing — just click.',
  },
  {
    icon: '📊',
    title: 'Usage dashboard',
    desc: 'Track daily prompts, sessions, and your efficiency score over time in the side panel.',
  },
  {
    icon: '💡',
    title: 'Daily tips',
    desc: 'A new prompt-writing tip every day. Small habits that make you 10x better at AI.',
  },
  {
    icon: '🔒',
    title: 'Privacy first',
    desc: 'Prompts are analyzed and immediately discarded. Never stored, never sold. Ever.',
  },
  {
    icon: '🎯',
    title: 'Zero setup',
    desc: 'No account. No API key. No config. Install and it just works on Claude.ai.',
  },
]

function Features() {
  const ref = useFadeIn() as React.RefObject<HTMLElement>
  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      className="fade-in-section py-28 px-6 bg-flint-surface/30"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-flint-amber text-sm font-semibold tracking-widest uppercase mb-3">Features</p>
          <h2 className="text-4xl lg:text-5xl font-black text-flint-text tracking-tight">
            Built different.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="bg-flint-card border border-flint-border rounded-2xl p-6 feature-card"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="font-bold text-flint-text text-base mb-2">{f.title}</h3>
              <p className="text-flint-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Midpage Quote ───────────────────────────────────────────────────────────
function Quote() {
  const ref = useFadeIn() as React.RefObject<HTMLElement>
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="fade-in-section py-28 px-6 relative overflow-hidden"
    >
      {/* Purple glow blob */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-flint-purple/8 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <p className="text-5xl lg:text-6xl font-black text-flint-text leading-tight mb-6 tracking-tight">
          "Stop guessing.
          <br />
          <span className="gradient-text">Start prompting."</span>
        </p>
        <p className="text-xl text-flint-muted max-w-xl mx-auto">
          Flint turns vague prompts into ones that actually work — without you needing to think about it.
        </p>
      </div>
    </section>
  )
}

// ─── Final CTA ───────────────────────────────────────────────────────────────
function FinalCTA() {
  const ref = useFadeIn() as React.RefObject<HTMLElement>
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="fade-in-section py-28 px-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-flint-card border border-flint-border rounded-3xl p-12 glow-purple">
          <span className="text-5xl block mb-6">🔥</span>
          <h2 className="text-4xl lg:text-5xl font-black text-flint-text tracking-tight mb-4">
            Ready for better Claude responses?
          </h2>
          <p className="text-flint-muted mb-10 text-lg">
            Join builders using Flint to get more out of every prompt.
          </p>
          <a
            href="https://chromewebstore.google.com/detail/flint"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 bg-flint-purple hover:bg-flint-purple-hover text-white font-bold px-8 py-4 rounded-xl text-lg"
          >
            <span>🔥</span> Add to Chrome — It's Free
          </a>
          <p className="text-flint-muted text-sm mt-5">
            Works on Claude.ai · No account needed · Free forever
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-flint-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>🔥</span>
          <span className="font-bold text-flint-text text-sm">Flint</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-flint-muted">
          <a
            href="https://soohumkaushik.github.io/Flint/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-flint-text transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="https://github.com/SoohumKaushik/Flint/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-flint-text transition-colors"
          >
            Support
          </a>
          <a
            href="https://github.com/SoohumKaushik/Flint"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-flint-text transition-colors"
          >
            GitHub
          </a>
        </div>

        <p className="text-flint-muted text-sm">
          Built by{' '}
          <a
            href="https://github.com/SoohumKaushik"
            target="_blank"
            rel="noopener noreferrer"
            className="text-flint-purple hover:text-flint-purple-hover transition-colors"
          >
            Soohum Kaushik
          </a>
        </p>
      </div>
    </footer>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen bg-flint-bg text-flint-text">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <Quote />
      <FinalCTA />
      <Footer />
    </div>
  )
}
