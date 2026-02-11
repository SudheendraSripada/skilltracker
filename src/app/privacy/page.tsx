export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Skill Tracker</p>
          <h1 className="mt-3 text-3xl font-semibold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-400">Effective date: February 11, 2026</p>

          <div className="mt-8 space-y-6 text-sm text-slate-200">
            <section>
              <h2 className="text-base font-semibold text-white">1. Overview</h2>
              <p className="mt-2 text-slate-300">
                We respect your privacy. This application stores your learning data in your account
                so you can access it across devices.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">2. Data We Store</h2>
              <p className="mt-2 text-slate-300">
                We store your topics, subtopics, progress, and test results. This is used only to
                provide the service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">3. Authentication</h2>
              <p className="mt-2 text-slate-300">
                Authentication is handled through a secure email login flow. We do not store your
                password.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">4. Third-Party Services</h2>
              <p className="mt-2 text-slate-300">
                We use Supabase for authentication and data storage. AI-generated content is produced
                using Mistral. Refer to their respective policies for details.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">5. Contact</h2>
              <p className="mt-2 text-slate-300">
                For privacy questions, contact support.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
