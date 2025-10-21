// src/lib/openapi/extend.ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// IMPORTANT: call once, and on the same z instance everyone imports.
extendZodWithOpenApi(z);

export {}; // no exports; importing this file just ensures the patch is run
