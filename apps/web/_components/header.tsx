'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import './header.css';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'About', href: '#about' },
  { name: 'Contact', href: '#contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
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
            'mt-4 sm:mt-5 flex items-center justify-between rounded-2xl',
            'glass glass-pop', // <— Vista glass helper
            scrolled ? 'glass-strong' : '',
          ].join(' ')}
        >
          {/* add a very soft aura glow behind the shell */}
          <div
            aria-hidden
            className="absolute -z-10 inset-0 rounded-2xl
      shadow-[0_0_0_1px_rgba(255,255,255,0.25)]
      before:content-[''] before:absolute before:inset-[-20%] before:rounded-[28px]
      before:bg-[radial-gradient(50%_40%_at_50%_0%,rgba(255,255,255,0.45),transparent_60%)]
      before:opacity-60
      after:content-[''] after:absolute after:inset-[-25%] after:rounded-[32px]
      after:bg-[radial-gradient(60%_60%_at_50%_120%,rgba(16,185,129,0.14),transparent_70%)]
      after:opacity-60
    "
          />
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 pl-3 sm:pl-4 py-2.5"
          >
            <span className="relative block h-9 w-9 sm:h-10 sm:w-10">
              <Image src="/knwdle.svg" alt="Knwdle" fill priority />
            </span>
          </Link>

          {/* Center: Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm">
            {navLinks.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className="group relative font-medium text-foreground/70 hover:text-foreground transition"
              >
                {l.name}
                <span className="pointer-events-none absolute left-0 -bottom-1 h-[1px] w-0 bg-[hsla(149,97%,14%,1)] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right: CTAs / Burger */}
          <div className="flex items-center gap-2 pr-2 sm:pr-3">
            <Link
              href="https://login.knwdle.com"
              className="hidden sm:inline-block text-sm font-medium text-foreground/70 hover:text-foreground transition"
            >
              Login
            </Link>
            <Link
              href="#get-started"
              className="hidden md:inline-block px-3 py-1.5 rounded-md bg-[hsla(149,97%,14%,0.92)] text-white text-sm font-medium hover:bg-[hsla(149,97%,14%,1)] transition"
            >
              Get&nbsp;Started
            </Link>

            {/* Mobile burger */}
            <button
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              {/* simple burger/cross */}
              <div className="relative h-4 w-5">
                <span
                  className={`absolute inset-x-0 top-0 h-0.5 bg-current transition-transform ${
                    open ? 'translate-y-2 rotate-45' : ''
                  }`}
                />
                <span
                  className={`absolute inset-x-0 top-2 h-0.5 bg-current transition-opacity ${
                    open ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute inset-x-0 top-4 h-0.5 bg-current transition-transform ${
                    open ? '-translate-y-2 -rotate-45' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        className="md:hidden overflow-hidden"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="mt-2 rounded-2xl sheet-glass shadow-lg">
            <nav className="flex flex-col p-2">
              {navLinks.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-[15px] text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {l.name}
                </Link>
              ))}
              <div className="h-px mx-2 my-1 bg-black/5 dark:bg-white/10" />
              <Link
                href="https://login.knwdle.com"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-[15px] text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="#get-started"
                onClick={() => setOpen(false)}
                className="mx-2 mt-2 mb-1 px-3 py-2 rounded-md bg-[hsla(149,97%,14%,0.95)] text-white text-[15px] font-medium text-center"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
