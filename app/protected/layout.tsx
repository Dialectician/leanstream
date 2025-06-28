import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Package,
  Building2,
  UserCheck,
  Clock,
  Edit3,
  Wrench,
  BarChart3,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col">
        {/* Enhanced Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-2">
              <Link href="/protected" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    LS
                  </span>
                </div>
                <span className="font-bold text-xl">LeanStream</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/protected"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/protected/clients"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Clients</span>
              </Link>
              <Link
                href="/protected/orders"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Package className="h-4 w-4" />
                <span>Orders</span>
              </Link>
              <Link
                href="/protected/divisions"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Building2 className="h-4 w-4" />
                <span>Divisions</span>
              </Link>
              <Link
                href="/protected/employees"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                <span>Employees</span>
              </Link>

              {/* Time Entry Dropdown Group */}
              <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-muted/50">
                <Link
                  href="/protected/time-entry"
                  className="flex items-center space-x-2 px-2 py-1 rounded-sm text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  <span>Time Entry</span>
                </Link>
                <Link
                  href="/protected/time-entry/edit"
                  className="flex items-center space-x-2 px-2 py-1 rounded-sm text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
              </div>

              <Link
                href="/protected/item-builder"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Wrench className="h-4 w-4" />
                <span>Item Builder</span>
              </Link>
              <Link
                href="/protected/reports"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <nav className="flex flex-col space-y-4 mt-4">
                    <Link
                      href="/protected"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/protected/clients"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span>Clients</span>
                    </Link>
                    <Link
                      href="/protected/orders"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Package className="h-4 w-4" />
                      <span>Orders</span>
                    </Link>
                    <Link
                      href="/protected/divisions"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Divisions</span>
                    </Link>
                    <Link
                      href="/protected/employees"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Employees</span>
                    </Link>

                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                        TIME TRACKING
                      </p>
                      <Link
                        href="/protected/time-entry"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Time Entry</span>
                      </Link>
                      <Link
                        href="/protected/time-entry/edit"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Time Cards</span>
                      </Link>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                        TOOLS
                      </p>
                      <Link
                        href="/protected/item-builder"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Wrench className="h-4 w-4" />
                        <span>Item Builder</span>
                      </Link>
                      <Link
                        href="/protected/reports"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Reports</span>
                      </Link>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Right side actions */}
            <div className="hidden md:flex items-center space-x-2">
              <ThemeSwitcher />
              {hasEnvVars ? <AuthButton /> : null}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 container py-6">{children}</div>

        {/* Footer */}
        <footer className="border-t bg-muted/50">
          <div className="container flex items-center justify-between py-4 text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} LeanStream. All rights reserved.
            </p>
            <p>Manufacturing Operations Management</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
