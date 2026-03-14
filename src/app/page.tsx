"use client";

import Link from "next/link";
import TestDemo from "@/components/TestDemo"; // <-- 1. Import the component here
import { motion, type Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-12">
        <motion.header 
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Skill Tracker</p>
            <h1 className="text-3xl font-semibold">Your learning command center</h1>
          </div>
          <Link
            href="/app"
            className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200 hover:border-emerald-400 transition"
          >
            Open app
          </Link>
        </motion.header>

        <main className="mt-20 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <motion.section 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.h2 variants={fadeUp} className="text-5xl lg:text-6xl font-semibold leading-tight tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
              Plan, practice, and prove mastery with structured tracks.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-slate-400 leading-relaxed font-light max-w-2xl">
              Create a topic, break it into milestones, complete subtopics, and take a
              single-attempt test whenever you finish a section. Everything is tracked per
              user in Supabase.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/app"
                className="group relative rounded-full bg-emerald-400 px-8 py-4 text-sm font-semibold text-slate-900 overflow-hidden shadow-[0_0_40px_rgba(52,211,153,0.3)] transition-transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative">Launch Skill Tracker</span>
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-slate-700 px-8 py-4 text-sm text-slate-200 transition-colors hover:bg-slate-800"
              >
                See how it works
              </a>
            </motion.div>
          </motion.section>

          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.3em] text-emerald-400 font-semibold">Highlights</motion.p>
            <motion.ul variants={staggerContainer} className="mt-6 space-y-4 text-sm text-slate-200">
              <motion.li variants={fadeUp} className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500/50 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                Structured subtopics with curated resources.
              </motion.li>
              <motion.li variants={fadeUp} className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500/50 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                Completion prompts a test (optional, single attempt).
              </motion.li>
              <motion.li variants={fadeUp} className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500/50 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                Username/password login via Supabase, per-user progress tracker.
              </motion.li>
            </motion.ul>
          </motion.section>
          
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="col-span-full mt-12 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/5 to-transparent blur-3xl -z-10" />
            <TestDemo />
          </motion.section>

        </main>

        <motion.section 
          id="how-it-works" 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="mt-32 grid gap-6 lg:grid-cols-3 relative"
        >
          <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] -z-10 rounded-full" />
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
            <motion.div variants={fadeUp} key={item.title} className="rounded-3xl border border-slate-800/60 bg-slate-900/40 p-8 backdrop-blur-sm hover:bg-slate-800/40 transition-colors">
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </motion.section>

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
