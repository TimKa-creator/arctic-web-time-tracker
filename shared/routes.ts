import { z } from 'zod';
import { insertProjectSchema, insertTimeEntrySchema, projects, timeEntries } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects' as const,
      responses: {
        200: z.array(z.custom<typeof projects.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects' as const,
      input: insertProjectSchema,
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id' as const,
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/projects/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  timeEntries: {
    list: {
      method: 'GET' as const,
      path: '/api/time-entries' as const,
      responses: {
        200: z.array(z.custom<typeof timeEntries.$inferSelect & { project: typeof projects.$inferSelect | null }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/time-entries' as const,
      input: insertTimeEntrySchema,
      responses: {
        201: z.custom<typeof timeEntries.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/time-entries/:id' as const,
      input: insertTimeEntrySchema.partial(),
      responses: {
        200: z.custom<typeof timeEntries.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/time-entries/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    export: {
      method: 'GET' as const,
      path: '/api/time-entries/export' as const,
      responses: {
        200: z.any(), // Returns CSV string
      },
    }
  },
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type ProjectInput = z.infer<typeof api.projects.create.input>;
export type TimeEntryInput = z.infer<typeof api.timeEntries.create.input>;
export type TimeEntryUpdateInput = z.infer<typeof api.timeEntries.update.input>;
