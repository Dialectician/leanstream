import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-4 items-center font-semibold flex-wrap">
              <Link href={"/protected"}>Dashboard</Link>
              <Link href={"/protected/clients"}>Clients</Link>
              <Link href={"/protected/orders"}>Orders</Link>
              <Link href={"/protected/divisions"}>Divisions</Link>
              <Link href={"/protected/employees"}>Employees</Link>
              <Link href={"/protected/time-entry"}>Time Entry</Link>
              <Link href={"/protected/time-entry/edit"}>Edit Time Cards</Link>
              {/* Add the new link here */}
              <Link href={"/protected/item-builder"}>Item Builder</Link>
            </div>
            
            <div className="flex items-center gap-4">
               {hasEnvVars ? <AuthButton /> : null}
            </div>

          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-6xl p-5 w-full">
          {children}
        </div>

        <footer className="w-full flex items-center justify-between mx-auto text-center text-xs gap-8 py-8 max-w-6xl px-5">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} LeanStream. All rights reserved.
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}