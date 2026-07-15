import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import type { Env } from "../types";
import { layout } from "../views/layout";
import {
  hashPassword,
  verifyPassword,
  signSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "../auth";

export const authRoutes = new Hono<{ Bindings: Env }>();

// The session cookie must only be marked Secure when actually served over
// HTTPS. Some local/dev clients (and non-Chromium embedded webviews) do not
// treat http://localhost as a secure context, silently dropping Secure
// cookies and breaking the post-login redirect.
function isHttps(c: any): boolean {
  return c.req.url.startsWith("https://");
}

function loginPage(error?: string, mode: "login" | "register" = "login"): string {
  return layout({
    title: "Log in",
    bodyHtml: `
      <div class="min-h-screen flex items-center justify-center px-4">
        <div class="w-full max-w-sm">
          <h1 class="text-2xl font-semibold text-center mb-1 tracking-tight">Surikata</h1>
          <p class="text-center text-gray-500 text-sm mb-6">Your minimalist RSS reader</p>

          ${error ? `<div class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">${error}</div>` : ""}

          <div class="flex mb-6 rounded-lg bg-gray-100 p-1 text-sm font-medium">
            <button type="button" data-tab="login" class="tab-btn flex-1 py-2 rounded-md ${mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"}">Log in</button>
            <button type="button" data-tab="register" class="tab-btn flex-1 py-2 rounded-md ${mode === "register" ? "bg-white shadow text-gray-900" : "text-gray-500"}">Register</button>
          </div>

          <form id="login-form" method="post" action="/login" class="space-y-3 ${mode === "register" ? "hidden" : ""}">
            <input name="username" placeholder="Username" required autocomplete="username"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
            <div class="relative">
              <input name="password" type="password" placeholder="Password" required autocomplete="current-password"
                class="password-input w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
              <button type="button" class="toggle-password absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-400" aria-label="Show password">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Log in</button>
          </form>

          <form id="register-form" method="post" action="/register" class="space-y-3 ${mode === "login" ? "hidden" : ""}">
            <input name="username" placeholder="Username" required autocomplete="username"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
            <div class="relative">
              <input id="register-password" name="password" type="password" placeholder="Password (min 8 chars)" required minlength="8" autocomplete="new-password"
                class="password-input w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
              <button type="button" class="toggle-password absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-400" aria-label="Show password">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <div class="relative">
              <input id="register-confirm-password" name="confirm_password" type="password" placeholder="Confirm password" required minlength="8" autocomplete="new-password"
                class="password-input w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
              <button type="button" class="toggle-password absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-400" aria-label="Show password">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <p id="register-password-error" class="text-sm text-red-600 hidden">Passwords do not match.</p>
            <button type="submit" class="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Create account</button>
          </form>
        </div>
      </div>
      <script>
        document.querySelectorAll('.tab-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
            document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
            document.querySelectorAll('.tab-btn').forEach((b) => {
              b.classList.toggle('bg-white', b === btn);
              b.classList.toggle('shadow', b === btn);
              b.classList.toggle('text-gray-900', b === btn);
              b.classList.toggle('text-gray-500', b !== btn);
            });
          });
        });

        document.querySelectorAll('.toggle-password').forEach((btn) => {
          btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            btn.classList.toggle('text-gray-900', !showing);
            btn.classList.toggle('text-gray-400', showing);
          });
        });

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
          const pw = document.getElementById('register-password');
          const confirmPw = document.getElementById('register-confirm-password');
          const errorEl = document.getElementById('register-password-error');
          registerForm.addEventListener('submit', (e) => {
            if (pw.value !== confirmPw.value) {
              e.preventDefault();
              errorEl.classList.remove('hidden');
              confirmPw.focus();
            } else {
              errorEl.classList.add('hidden');
            }
          });
          confirmPw.addEventListener('input', () => {
            errorEl.classList.toggle('hidden', pw.value === confirmPw.value);
          });
        }
      </script>
    `,
  });
}

authRoutes.get("/login", (c) => {
  const user = c.get("user");
  if (user) return c.redirect("/");
  return c.html(loginPage());
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return c.html(loginPage("Username and password are required."), 400);
  }

  const row = await c.env.DB.prepare(
    "SELECT id, username, password_hash, password_salt FROM users WHERE username = ?"
  )
    .bind(username)
    .first<{ id: number; username: string; password_hash: string; password_salt: string }>();

  if (!row) {
    return c.html(loginPage("Invalid username or password."), 401);
  }

  const valid = await verifyPassword(password, row.password_hash, row.password_salt);
  if (!valid) {
    return c.html(loginPage("Invalid username or password."), 401);
  }

  const token = await signSession(
    { uid: row.id, username: row.username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    c.env.JWT_SECRET
  );

  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return c.redirect("/");
});

authRoutes.post("/register", async (c) => {
  const body = await c.req.parseBody();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  const confirmPassword = String(body.confirm_password || "");

  if (!username || password.length < 8) {
    return c.html(loginPage("Username required; password must be at least 8 characters.", "register"), 400);
  }

  if (password !== confirmPassword) {
    return c.html(loginPage("Passwords do not match.", "register"), 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?")
    .bind(username)
    .first();
  if (existing) {
    return c.html(loginPage("That username is already taken.", "register"), 409);
  }

  const { hash, salt } = await hashPassword(password);
  const result = await c.env.DB.prepare(
    "INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)"
  )
    .bind(username, hash, salt)
    .run();

  const userId = result.meta.last_row_id as number;

  const token = await signSession(
    { uid: userId, username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    c.env.JWT_SECRET
  );

  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return c.redirect("/");
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.redirect("/login");
});
