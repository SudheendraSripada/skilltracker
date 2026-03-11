import Link from "next/link";
import { BookOpen, Layers, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
    return (
        <div className={cn("flex h-screen w-64 flex-col border-r bg-card px-4 py-8", className)}>
            <div className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold tracking-tight">Skill Tracker</span>
            </div>

            <nav className="mt-8 flex flex-col gap-2">
                <Link
                    href="/app"
                    className="flex items-center gap-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </Link>
                <Link
                    href="#tracks"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                    <Layers className="h-4 w-4" />
                    Learning Tracks
                </Link>
                <Link
                    href="#settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
            </nav>

            <div className="mt-auto">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <h4 className="font-semibold text-emerald-400">Pro Features</h4>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Unlock Advanced AI tracking and unlimited verified proofs.
                    </p>
                    <button className="mt-3 w-full rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-emerald-950 transition-colors hover:bg-emerald-500">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    );
}
