import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME, verifySession } from "../auth";
import type { AuthedUser, Env } from "../types";

declare module "hono" {
  interface ContextVariableMap {
    user: AuthedUser;
  }
}

// Attaches `user` to context if a valid session cookie is present.
// Does not block the request — use `requireAuth` for that.
export async function loadSession(c: Context<{ Bindings: Env }>, next: Next) {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (token) {
    const payload = await verifySession(token, c.env.JWT_SECRET);
    if (payload) {
      c.set("user", { id: payload.uid, username: payload.username });
    }
  }
  await next();
}

// Redirects to /login if no authenticated user is present.
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get("user");
  if (!user) {
    return c.redirect("/login");
  }
  await next();
}

// For API routes: returns 401 JSON instead of redirecting.
export async function requireAuthApi(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
}

// Single gate for all protected routes: JSON 401 for API-style paths,
// redirect-to-login for page paths.
export async function requireAuthSmart(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get("user");
  if (user) return next();

  const path = c.req.path;
  const isApi = path.startsWith("/articles/") || path.startsWith("/admin/feeds/");
  if (isApi) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return c.redirect("/login");
}
