'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import './header.css';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@workspace/ui/components/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@workspace/ui/components/sheet';
import { Separator } from '@workspace/ui/components/separator';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { beginLogout, logout } from '@workspace/state';
import { useAuth } from '@/hooks/use-auth';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'About', href: '#about' },
  { name: 'Contact', href: '#contact' },
];

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export default function Header() {
  const mounted = useMounted();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const { isAuthed, user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Measure header and expose its height as a CSS var (to space content below)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty(
        '--header-h',
        `${el.getBoundingClientRect().height}px`
      );
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleLogout = async () => {
    beginLogout();
    await dispatch(logout());
    router.refresh();
  };

  return (
    <motion.header
      ref={ref}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-x-0 top-0 z-50 pointer-events-none"
    >
      {/* floating shell */}
      <div className="pointer-events-auto mx-auto max-w-7xl px-3 sm:px-6">
        <div
          className={[
            'mt-4 sm:mt-5 flex h-16 min-h-16 items-center justify-between rounded-2xl px-2 sm:px-3',
            'glass glass-pop', // Vista glass helper
            scrolled ? 'glass-strong' : '',
          ].join(' ')}
        >
          {/* aura glow behind the shell (no layout impact) */}
          <div
            aria-hidden
            className="absolute -z-10 inset-0 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.25)]
              before:content-[''] before:absolute before:inset-[-20%] before:rounded-[28px]
              before:bg-[radial-gradient(50%_40%_at_50%_0%,rgba(255,255,255,0.45),transparent_60%)] before:opacity-60
              after:content-[''] after:absolute after:inset-[-25%] after:rounded-[32px]
              after:bg-[radial-gradient(60%_60%_at_50%_120%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%)] after:opacity-60"
          />

          {/* Left: Logo (slightly larger, fixed box to avoid shift) */}
          <Link href="/" className="flex items-center gap-2 pl-1 sm:pl-2">
            <span className="relative block h-16 w-16 md:h-20 md:w-20">
              {/* Light mode logo */}
              <Image
                src="/knwdle-light.svg"
                alt="Knwdle"
                fill
                priority
                className="object-contain dark:hidden"
              />
              {/* Dark mode logo */}
              <Image
                src="/knwdle-dark.svg"
                alt="Knwdle"
                fill
                className="object-contain hidden dark:block"
              />
            </span>
          </Link>

          {/* Center: Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm">
            {navLinks.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className="group relative font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                {l.name}
                <span className="pointer-events-none absolute left-0 -bottom-1 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right: desktop actions + mobile hamburger (no role switcher) */}
          <div className="flex items-center gap-1 pr-1 sm:pr-2">
            {/* Desktop (auth-aware) */}
            {!mounted ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/auth">Login</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Link href="#get-started">Get&nbsp;Started</Link>
                </Button>
              </>
            ) : isAuthed ? (
              <>
                {/* Dashboard icon button */}
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="hidden md:inline-flex"
                >
                  <Link href="/dashboard" aria-label="Dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                  </Link>
                </Button>

                {/* Avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-full p-0"
                      aria-label="Account menu"
                    >
                      <Avatar className="h-8 w-8">
                        {user?.image && (
                          <AvatarImage
                            src={user?.image || ''}
                            alt={user?.name || user?.email || 'User'}
                          />
                        )}
                        <AvatarFallback className="text-[11px]">
                          {(user?.name || user?.email || 'U')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user?.image || ''}
                            alt={user?.name || user?.email || 'User'}
                          />
                          <AvatarFallback className="text-[11px]">
                            {(user?.name || user?.email || 'U')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {user?.name || 'User'}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/auth">Login</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Link href="#get-started">Get&nbsp;Started</Link>
                </Button>
              </>
            )}

            {/* Mobile: Sheet hamburger menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-lg hover:bg-muted"
                  aria-label="Open menu"
                >
                  {/* hamburger icon */}
                  <span className="relative block h-4 w-5">
                    <span className="absolute inset-x-0 top-0 h-0.5 bg-current" />
                    <span className="absolute inset-x-0 top-2 h-0.5 bg-current" />
                    <span className="absolute inset-x-0 top-4 h-0.5 bg-current" />
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm p-0">
                <SheetHeader className="border-b px-5">
                  <SheetTitle className="flex items-center gap-3">
                    <span className="relative h-8 w-full flex justify-start">
                      {/* Light mode logo */}
                      <Image
                        src="/knwdle-light.svg"
                        alt="Knwdle"
                        fill
                        className="object-contain object-left dark:hidden"
                      />
                      {/* Dark mode logo */}
                      <Image
                        src="/knwdle-dark.svg"
                        alt="Knwdle"
                        fill
                        className="object-contain object-left hidden dark:block"
                      />
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col gap-4 p-5">
                  <nav className="space-y-2">
                    {navLinks.map((l) => (
                      <SheetClose asChild key={l.name}>
                        <Link
                          href={l.href}
                          className="block rounded-lg px-4 py-3 text-[15px] text-foreground/80 hover:bg-muted"
                        >
                          {l.name}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <Separator />
                  <div className="mt-auto space-y-3">
                    {!isAuthed ? (
                      <div className="grid grid-cols-2 gap-3">
                        <SheetClose asChild>
                          <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="w-full"
                          >
                            <Link href="/auth">Login</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            asChild
                            size="lg"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <Link href="#get-started">Get Started</Link>
                          </Button>
                        </SheetClose>
                      </div>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="w-full justify-start"
                          >
                            <Link href="/dashboard">
                              <LayoutDashboard className="mr-3 h-5 w-5" />{' '}
                              Dashboard
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            asChild
                            variant="ghost"
                            size="lg"
                            className="w-full justify-start"
                          >
                            <Link href="/settings">
                              <Settings className="mr-3 h-5 w-5" /> Settings
                            </Link>
                          </Button>
                        </SheetClose>
                        <Button
                          variant="ghost"
                          size="lg"
                          className="w-full justify-start text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-3 h-5 w-5" /> Sign Out
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Spacer uses --header-h elsewhere if needed */}
    </motion.header>
  );
}
