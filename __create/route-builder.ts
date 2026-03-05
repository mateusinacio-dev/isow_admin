import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Import all route.js files via import.meta.glob (Vite-native, works in SSR)
const routeModules = import.meta.glob('../src/app/api/**/route.js', {
  eager: true,
});

// Helper: convert glob path to Hono route path
// e.g. "../src/app/api/admin/organizations/route.js" → "/admin/organizations"
function globPathToHonoPath(globPath: string): string {
  return globPath
    .replace('../src/app/api', '')
    .replace('/route.js', '')
    .replace(/\[\.\.\.([^\]]+)\]/g, '*')           // [...slug] → *
    .replace(/\[([^\]]+)\]/g, ':$1')               // [id] → :id
    || '/';
}

// Register all routes
function registerRoutes() {
  // Clear existing routes
  api.routes = [];

  for (const [path, module] of Object.entries(routeModules)) {
    const honoPath = globPathToHonoPath(path);
    const mod = module as Record<string, unknown>;

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
    for (const method of methods) {
      if (typeof mod[method] === 'function') {
        const handler: Handler = async (c) => {
          const params = c.req.param();
          return await (mod[method] as Function)(c.req.raw, { params });
        };

        switch (method) {
          case 'GET': api.get(honoPath, handler); break;
          case 'POST': api.post(honoPath, handler); break;
          case 'PUT': api.put(honoPath, handler); break;
          case 'DELETE': api.delete(honoPath, handler); break;
          case 'PATCH': api.patch(honoPath, handler); break;
        }
      }
    }
  }
}

registerRoutes();

// HMR support in dev
if (import.meta.hot) {
  import.meta.hot.accept((newSelf) => {
    registerRoutes();
  });
}

export { api, API_BASENAME };
