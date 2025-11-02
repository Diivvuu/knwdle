'use client';

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useSidebar } from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';

export function SidebarToggleButton() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const isOpen = isMobile ? undefined : state === 'expanded';

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className={cn(
        'relative rounded-xl transition-all duration-200 hover:bg-primary/10',
        'text-muted-foreground hover:text-primary focus-visible:ring-2 ring-primary'
      )}
      aria-label="Toggle sidebar"
    >
      <motion.div
        key={isOpen ? 'open' : 'closed'}
        initial={{ rotate: isOpen ? 0 : -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-primary" />
        ) : (
          <Menu className="h-5 w-5 text-primary" />
        )}
      </motion.div>
    </Button>
  );
}