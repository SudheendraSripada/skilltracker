import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HeaderProps = {
    profileName?: string;
    greeting?: string;
    onSignOut?: () => void;
};

export function Header({ profileName, greeting, onSignOut }: HeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-md">
            <div className="flex flex-1 items-center gap-4">
                <div className="relative hidden max-w-md flex-1 sm:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search learning topics, resources..."
                        className="w-full bg-muted/50 pl-9 border-transparent focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/50"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <div className="flex items-center gap-3 border-l pl-4">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-medium leading-none">{profileName || "Guest User"}</span>
                        <span className="text-xs text-muted-foreground mt-1">{greeting || "Welcome"}</span>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                        <User className="h-4 w-4" />
                    </div>
                    <Button variant="outline" size="sm" onClick={onSignOut} className="ml-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                        Sign out
                    </Button>
                </div>
            </div>
        </header>
    );
}
