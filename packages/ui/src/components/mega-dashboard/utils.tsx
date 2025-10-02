'use client';

import React from 'react';

export function chip(text: string) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-muted text-muted-foreground border">
      {text}
    </span>
  );
}
