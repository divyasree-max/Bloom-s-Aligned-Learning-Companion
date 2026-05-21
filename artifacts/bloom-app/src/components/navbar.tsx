import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, LayoutDashboard, UploadCloud } from "lucide-react";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        setLocation("/");
      },
      onError: () => {
        // Fallback local logout
        logout();
        setLocation("/");
      }
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
          <BookOpen className="h-6 w-6" />
          <span className="font-serif text-xl font-bold tracking-tight">Bloom</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          {token && user ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/upload" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent">
                <UploadCloud className="h-4 w-4" />
                Upload PDF
              </Link>
              
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border">
                <span className="text-muted-foreground hidden sm:inline-block">
                  {user.name}
                </span>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Log out</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent">
                Log in
              </Link>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
