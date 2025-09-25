'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'About', href: '#about' },
  { name: 'Contact', href: '#contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className={`fixed top-0 left-0 w-full z-50
        transition-colors duration-300
        ${
          scrolled
            ? 'backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border-b border-black/5 dark:border-white/10'
            : 'backdrop-blur-md bg-white/30 dark:bg-neutral-900/30'
        }`}
    >
      {/* Use a 3-column grid to hard-center the nav */}
      <div className="mx-auto max-w-7xl grid grid-cols-3 items-center px-6 py-2.5">
        {/* Left: Logo (smaller) */}
        <div className="justify-self-start">
          <Link href="/" className="flex items-center relative w-20 h-20">
            <Image
              src="/knwdle.svg"
              alt="Knwdle"
              fill
              //   width={54}
              //   height={54}
              priority
            />
          </Link>
        </div>

        {/* Center: Nav (perfectly centered) */}
        <nav className="hidden md:flex justify-center gap-7 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group relative font-medium text-foreground/70 hover:text-foreground transition"
            >
              {link.name}
              <span className="pointer-events-none absolute left-0 -bottom-1 h-[1px] w-0 bg-[hsla(149,97%,14%,1)] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Right: CTAs (smaller, subtle) */}
        <div className="justify-self-end flex items-center gap-3">
          <Link
            href="https://login.yourdomain.com"
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition"
          >
            Login
          </Link>
          <Link
            href="#get-started"
            className="px-3 py-1.5 rounded-md bg-[hsla(149,97%,14%,0.92)] text-white text-sm font-medium hover:bg-[hsla(149,97%,14%,1)] transition"
          >
            Get&nbsp;Started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
