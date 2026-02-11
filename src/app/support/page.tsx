export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Skill Tracker</p>
          <h1 className="mt-3 text-3xl font-semibold">Support</h1>
          <p className="mt-2 text-sm text-slate-400">
            We are here to help. Please include screenshots and steps to reproduce any issue.
          </p>

          <div className="mt-8 space-y-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-slate-400">Support Email</p>
              <p className="mt-1 text-white">purpose04023@gmail.com</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-slate-400">Response Time</p>
              <p className="mt-1 text-white">Within 2 business days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
