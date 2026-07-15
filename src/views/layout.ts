export interface LayoutOptions {
  title: string;
  activeNav?: "home" | "admin";
  username?: string;
  bodyHtml: string;
  extraHead?: string;
}

// Shared HTML shell: top nav on desktop, bottom nav on mobile.
export function layout(opts: LayoutOptions): string {
  const { title, activeNav, username, bodyHtml, extraHead } = opts;

  const nav = username
    ? `
    <nav class="hidden md:flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white sticky top-0 z-20">
      <a href="/" class="text-lg font-semibold tracking-tight text-gray-900">Surikata</a>
      <div class="flex items-center gap-4 text-sm">
        <a href="/" class="${activeNav === "home" ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900"}">Feed</a>
        <a href="/admin" class="${activeNav === "admin" ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900"}">Manage Sources</a>
        <span class="text-gray-400">${username}</span>
        <form method="post" action="/logout"><button class="text-gray-500 hover:text-gray-900">Logout</button></form>
      </div>
    </nav>
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex items-stretch justify-around" style="padding-bottom: env(safe-area-inset-bottom)">
      <a href="/" class="flex-1 flex flex-col items-center justify-center py-2.5 text-xs ${activeNav === "home" ? "text-gray-900" : "text-gray-400"}">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>
        <span class="mt-0.5">Feed</span>
      </a>
      <a href="/admin" class="flex-1 flex flex-col items-center justify-center py-2.5 text-xs ${activeNav === "admin" ? "text-gray-900" : "text-gray-400"}">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>
        <span class="mt-0.5">Sources</span>
      </a>
      <form method="post" action="/logout" class="flex-1">
        <button type="submit" class="w-full h-full flex flex-col items-center justify-center py-2.5 text-xs text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span class="mt-0.5">Logout</span>
        </button>
      </form>
    </nav>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${title} · Surikata</title>
  <link rel="stylesheet" href="/styles.css" />
  ${extraHead || ""}
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen ${username ? "pb-16 md:pb-0" : ""}">
  ${nav}
  <main class="max-w-2xl mx-auto w-full">
    ${bodyHtml}
  </main>
  <script src="/app.js"></script>
</body>
</html>`;
}
