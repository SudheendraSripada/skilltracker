export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Skill Tracker</p>
          <h1 className="mt-3 text-3xl font-semibold">Terms and Conditions</h1>
          <p className="mt-2 text-sm text-slate-400">Effective date: February 11, 2026</p>

          <div className="mt-8 space-y-6 text-sm text-slate-200">
            <section>
              <h2 className="text-base font-semibold text-white">1. Acceptance</h2>
              <p className="mt-2 text-slate-300">
                By accessing or using Skill Tracker, you agree to these Terms and Conditions. If you do
                not agree, do not use the application.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">2. Accounts & Access</h2>
              <p className="mt-2 text-slate-300">
                Authentication uses username and password with secure Supabase sessions. You are responsible for
                maintaining the security of your account access.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">3. No Warranties</h2>
              <p className="mt-2 text-slate-300">
                The application is provided “as is” without warranties of any kind, express or implied,
                including fitness for a particular purpose, accuracy, or availability.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">4. Limitation of Liability</h2>
              <p className="mt-2 text-slate-300">
                To the maximum extent permitted by law, we are not liable for any indirect, incidental,
                special, or consequential damages, or for any loss of data, profits, or business
                arising from your use of the application.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">5. Your Responsibility</h2>
              <p className="mt-2 text-slate-300">
                You are responsible for validating learning outcomes and maintaining backups of any
                critical information.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">6. Changes to Terms</h2>
              <p className="mt-2 text-slate-300">
                We may update these terms from time to time. Continued use of the application after
                changes means you accept the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">7. Contact</h2>
              <p className="mt-2 text-slate-300">
                If you have questions about these terms, contact support.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
