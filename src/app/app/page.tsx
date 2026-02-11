import { Suspense } from "react";
import AppClient from "./AppClient";

export const dynamic = "force-dynamic";

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Loading</p>
        </div>
      }
    >
      <AppClient />
    </Suspense>
  );
}
