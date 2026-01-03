'use client';

import {
  ShieldCheck,
  Bot,
  Settings,
  Menu,
  History,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Chatbot } from '../chatbot';

const navItems = [
  { href: '/analyzer', label: 'Analyzer', icon: Bot },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/about', label: 'About', icon: Info },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
        <nav className="flex items-center gap-6">
          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                 <Link href="/" className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <span>Suraksha AI</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {navItems.map(item => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop Menu */}
          <Link
            href="/"
            className="hidden items-center gap-2 text-lg font-semibold md:flex"
          >
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl">Suraksha AI</span>
          </Link>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`hidden text-sm font-medium transition-colors hover:text-primary md:block ${
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
      <Chatbot />
    </div>
  );
}
