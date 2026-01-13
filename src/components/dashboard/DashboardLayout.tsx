import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Music, 
  LogOut, 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  Settings,
  ClipboardList,
  Gamepad2
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  role: "admin" | "teacher" | "student";
}

const DashboardLayout = ({ children, title, role }: DashboardLayoutProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getNavItems = () => {
    const baseItems = [
      { href: "/dashboard", icon: Home, label: "Dashboard" },
    ];

    if (role === "admin") {
      return [
        ...baseItems,
        { href: "/dashboard/users", icon: Users, label: "Manage Users" },
        { href: "/dashboard/lessons", icon: Calendar, label: "All Lessons" },
        { href: "/dashboard/slots", icon: ClipboardList, label: "Time Slots" },        
        { href: "/dashboard/foundation", icon: Gamepad2, label: "Foundation Modules" },
        { href: "/dashboard/gamified-maps", icon: Gamepad2, label: "Gamified Maps" },
        { href: "/dashboard/districts", icon: Settings, label: "Districts" },      ];
    }

    if (role === "teacher") {
      return [
        ...baseItems,
        { href: "/dashboard/my-students", icon: Users, label: "My Students" },
        { href: "/dashboard/lesson-plans", icon: BookOpen, label: "Lesson Plans" },
        { href: "/dashboard/schedule", icon: Calendar, label: "Schedule" },
        { href: "/dashboard/slots", icon: ClipboardList, label: "My Slots" },
        { href: "/dashboard/foundation", icon: Gamepad2, label: "Foundation Modules" },
      ];
    }

    return [
      ...baseItems,
      { href: "/dashboard/my-lessons", icon: Calendar, label: "My Lessons" },
      { href: "/dashboard/foundation", icon: Gamepad2, label: "Foundation Fundamentals" },
      { href: "/dashboard/book", icon: ClipboardList, label: "Book Lesson" },
      { href: "/dashboard/resources", icon: BookOpen, label: "Resources" },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (hidden on small screens) */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Music className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Miraimusic</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border px-4 py-4 md:px-8 md:py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-2xl font-bold">{title}</h1>
            <div className="flex items-center gap-2 md:hidden">
              {/* Mobile nav: horizontal compact links */}
              <nav className="flex gap-2 overflow-x-auto">
                {navItems.map((item) => (
                  <Link key={item.href} to={item.href} className="px-3 py-2 rounded-md text-sm bg-secondary text-muted-foreground">
                    <item.icon className="inline w-4 h-4 mr-2" />
                    <span className="align-middle">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
