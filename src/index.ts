import { Hono } from "hono";
import type { Env } from "./types";
import { loadSession, requireAuthSmart } from "./middleware/session";
import { authRoutes } from "./routes/auth";
import { feedRoutes } from "./routes/feeds";
import { adminRoutes } from "./routes/admin";
import { handleScheduled } from "./scheduled";

const app = new Hono<{ Bindings: Env }>();

app.use("*", loadSession);

// Public auth routes (login/register/logout) — must be registered before
// the auth gate below so they short-circuit without requiring a session.
app.route("/", authRoutes);

// Everything registered from this point on requires authentication.
// Page routes get a redirect to /login; /articles/* and /admin/feeds/*
// (JSON endpoints) get a 401 instead — see requireAuthSmart.
app.use("*", requireAuthSmart);

app.route("/", feedRoutes);
app.route("/", adminRoutes);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await handleScheduled(env);
  },
};
