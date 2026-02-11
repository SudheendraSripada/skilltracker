"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Skill Tracker</p>
            <h1 className="text-3xl font-semibold">Your learning command center</h1>
          </div>
          <Link
            href="/app"
            className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200 hover:border-emerald-400"
          >
            Open app
          </Link>
        </header>

        <main className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <h2 className="text-4xl font-semibold leading-tight">
              Plan, practice, and prove mastery with structured tracks.
            </h2>
            <p className="text-lg text-slate-300">
              Create a topic, break it into milestones, complete subtopics, and take a
              single-attempt test whenever you finish a section. Everything is tracked per
              user in Supabase.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app"
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900"
              >
                Launch Skill Tracker
              </Link>
              <a
                href="#how-it-works"
                className="rounded-xl border border-slate-700 px-6 py-3 text-sm text-slate-200"
              >
                See how it works
              </a>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Highlights</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                Structured subtopics with curated resources.
              </li>
              <li className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                Completion prompts a test (optional, single attempt).
              </li>
              <li className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                OTP login via Supabase, per-user progress tracking.
              </li>
            </ul>
          </section>
        </main>

        <section id="how-it-works" className="mt-16 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "1. Plan",
              text: "Type a topic. The workspace sets up a learning path and resources.",
            },
            {
              title: "2. Track",
              text: "Mark subtopics complete as you learn.",
            },
            {
              title: "3. Test",
              text: "Get a single-attempt quiz tied to your progress.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.text}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 flex items-center justify-between text-xs text-slate-500">
          <p>Built with Next.js and Supabase.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-slate-300 hover:text-emerald-300">
              Terms
            </Link>
            <Link href="/privacy" className="text-slate-300 hover:text-emerald-300">
              Privacy
            </Link>
            <Link href="/support" className="text-slate-300 hover:text-emerald-300">
              Support
            </Link>
            <Link href="/app" className="text-emerald-300">
              Enter app
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
