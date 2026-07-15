// Surikata frontend interactivity — no build step, plain fetch-based AJAX.

// --- Admin page: preset toggles, feed discovery, add/remove custom feeds ---
(function () {
  const presetToggles = document.querySelectorAll(".preset-toggle");
  if (presetToggles.length === 0 && !document.getElementById("discover-btn")) return; // not on admin page

  presetToggles.forEach((toggle) => {
    toggle.addEventListener("change", async () => {
      await fetch("/admin/feeds/toggle-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: toggle.dataset.url,
          name: toggle.dataset.name,
          subscribe: toggle.checked,
        }),
      });
    });
  });

  document.querySelectorAll(".remove-feed").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await fetch("/admin/feeds/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: btn.dataset.url }),
      });
      btn.closest("div.flex")?.remove();
    });
  });

  const discoverBtn = document.getElementById("discover-btn");
  const customUrlInput = document.getElementById("custom-url");
  const resultsEl = document.getElementById("discover-results");

  if (discoverBtn && customUrlInput && resultsEl) {
    discoverBtn.addEventListener("click", async () => {
      const url = customUrlInput.value.trim();
      if (!url) return;
      discoverBtn.disabled = true;
      discoverBtn.textContent = "Searching…";
      resultsEl.innerHTML = "";
      try {
        const res = await fetch("/admin/feeds/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        const feeds = data.feeds || [];
        if (feeds.length === 0) {
          resultsEl.innerHTML = `<div class="text-sm text-gray-400">No feed found at that address.</div>`;
        } else {
          feeds.forEach((feed) => {
            const row = document.createElement("div");
            row.className = "flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2";
            row.innerHTML = `
              <div class="text-sm text-gray-700 truncate pr-2">${feed.title || feed.url}</div>
              <button type="button" class="add-discovered flex-shrink-0 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-1">Add</button>
            `;
            row.querySelector(".add-discovered").addEventListener("click", async () => {
              await fetch("/admin/feeds/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: feed.url, name: feed.title || feed.url }),
              });
              location.reload();
            });
            resultsEl.appendChild(row);
          });
        }
      } finally {
        discoverBtn.disabled = false;
        discoverBtn.textContent = "Find Feed";
      }
    });
  }
})();

(function () {
  const feedList = document.getElementById("feed-list");
  if (!feedList) return; // not on the home page

  const state = {
    source: new URLSearchParams(location.search).get("source") || "all",
    hideRead: new URLSearchParams(location.search).get("hideRead") === "1",
    view: new URLSearchParams(location.search).get("view") || "feed",
  };

  function currentParams() {
    const p = new URLSearchParams();
    p.set("source", state.source);
    if (state.hideRead) p.set("hideRead", "1");
    if (state.view !== "feed") p.set("view", state.view);
    return p;
  }

  async function reloadFeed() {
    const params = currentParams();
    const res = await fetch("/partials/feed?" + params.toString());
    feedList.innerHTML = await res.text();
    history.replaceState(null, "", "/?" + params.toString());
    bindCardEvents();
  }

  // --- Filter chips ---
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.source = chip.dataset.source;
      document.querySelectorAll(".chip").forEach((c) => {
        const active = c === chip;
        c.classList.toggle("bg-gray-900", active);
        c.classList.toggle("text-white", active);
        c.classList.toggle("bg-gray-100", !active);
        c.classList.toggle("text-gray-600", !active);
      });
      reloadFeed();
    });
  });

  // --- Hide Read toggle ---
  const hideReadBtn = document.getElementById("toggle-hideread");
  if (hideReadBtn) {
    hideReadBtn.addEventListener("click", () => {
      state.hideRead = !state.hideRead;
      hideReadBtn.classList.toggle("bg-gray-900", state.hideRead);
      hideReadBtn.classList.toggle("text-white", state.hideRead);
      hideReadBtn.classList.toggle("bg-gray-100", !state.hideRead);
      hideReadBtn.classList.toggle("text-gray-600", !state.hideRead);
      reloadFeed();
    });
  }

  // --- Read Later / Favorites view toggles (mutually exclusive tabs) ---
  const readLaterBtn = document.getElementById("toggle-readlater");
  const favoritesBtn = document.getElementById("toggle-favorites");

  function setViewButtons() {
    [readLaterBtn, favoritesBtn].forEach((btn) => {
      if (!btn) return;
      const active = btn.dataset.view === state.view;
      btn.classList.toggle("bg-gray-900", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("bg-gray-100", !active);
      btn.classList.toggle("text-gray-600", !active);
    });
  }

  if (readLaterBtn) {
    readLaterBtn.addEventListener("click", () => {
      state.view = state.view === "readlater" ? "feed" : "readlater";
      setViewButtons();
      reloadFeed();
    });
  }
  if (favoritesBtn) {
    favoritesBtn.addEventListener("click", () => {
      state.view = state.view === "favorites" ? "feed" : "favorites";
      setViewButtons();
      reloadFeed();
    });
  }

  // --- Mark all as read ---
  const markAllBtn = document.getElementById("mark-all-read");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
      await fetch("/articles/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: state.source, view: state.view }),
      });
      reloadFeed();
    });
  }

  // --- Per-card interactions (read-later, favorite, mark-as-read-on-click) ---
  function bindCardEvents() {
    feedList.querySelectorAll(".article-card").forEach((card) => {
      const link = card.dataset.link;
      const title = card.querySelector(".article-link")?.textContent.trim() || "";
      const source = card.querySelector(".text-gray-500")?.textContent.trim() || "";
      const perexEl = card.querySelector("p");
      const perex = perexEl ? perexEl.textContent.trim() : null;
      const imgEl = card.querySelector("img");
      const imageUrl = imgEl ? imgEl.getAttribute("src") : null;

      const meta = { link, title, source, perex, imageUrl };

      const articleLink = card.querySelector(".article-link");
      if (articleLink) {
        articleLink.addEventListener("click", async () => {
          card.classList.add("opacity-50");
          await fetch("/articles/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ link }),
          });
        });
      }

      const readLaterToggle = card.querySelector(".btn-readlater");
      if (readLaterToggle) {
        readLaterToggle.addEventListener("click", async () => {
          const res = await fetch("/articles/toggle-readlater", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meta),
          });
          const data = await res.json();
          readLaterToggle.classList.toggle("bg-gray-900", data.active);
          readLaterToggle.classList.toggle("text-white", data.active);
          readLaterToggle.classList.toggle("bg-gray-100", !data.active);
          readLaterToggle.classList.toggle("text-gray-500", !data.active);
          const svgPath = readLaterToggle.querySelector("svg");
          if (svgPath) svgPath.setAttribute("fill", data.active ? "currentColor" : "none");
          if (!data.active && state.view === "readlater") reloadFeed();
        });
      }

      const favoriteToggle = card.querySelector(".btn-favorite");
      if (favoriteToggle) {
        favoriteToggle.addEventListener("click", async () => {
          const res = await fetch("/articles/toggle-favorite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meta),
          });
          const data = await res.json();
          favoriteToggle.classList.toggle("bg-amber-500", data.active);
          favoriteToggle.classList.toggle("text-white", data.active);
          favoriteToggle.classList.toggle("bg-gray-100", !data.active);
          favoriteToggle.classList.toggle("text-gray-500", !data.active);
          const svgPath = favoriteToggle.querySelector("svg");
          if (svgPath) svgPath.setAttribute("fill", data.active ? "currentColor" : "none");
          if (!data.active && state.view === "favorites") reloadFeed();
        });
      }
    });
  }

  setViewButtons();
  bindCardEvents();
})();
