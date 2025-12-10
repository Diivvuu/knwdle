'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

import CTA from '../_sections/cta';
import Features from '../_sections/features';
import Hero from '../_sections/hero';

export default function HomePage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      syncTouch: true,
      gestureOrientation: 'vertical',
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let rafId = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className='container mx-auto'>
      <Hero />
      <Features />
      {/* <Screenshots /> */}
      {/* <Testimonials /> */}
      <CTA />
    </div>
  );
}
