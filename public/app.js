// Surikata frontend interactivity — no build step, plain fetch-based AJAX.

// --- Admin page: preset toggles, feed discovery, add/remove custom feeds ---
(function () {
  const presetToggles = document.querySelectorAll(".preset-toggle");
  if (presetToggles.length === 0 && !document.getElementById("discover-btn")) return; // not on admin page

  const selectAllToggle = document.getElementById("select-all-sources");

  function updateSelectAllState() {
    if (!selectAllToggle) return;
    const checkedCount = Array.from(presetToggles).filter((t) => t.checked).length;
    selectAllToggle.checked = checkedCount === presetToggles.length;
    selectAllToggle.indeterminate = checkedCount > 0 && checkedCount < presetToggles.length;
  }

  async function togglePreset(toggle) {
    await fetch("/admin/feeds/toggle-preset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: toggle.dataset.url,
        name: toggle.dataset.name,
        subscribe: toggle.checked,
      }),
    });
  }

  presetToggles.forEach((toggle) => {
    toggle.addEventListener("change", async () => {
      await togglePreset(toggle);
      updateSelectAllState();
    });
  });

  if (selectAllToggle) {
    updateSelectAllState();
    selectAllToggle.addEventListener("change", async () => {
      const shouldCheck = selectAllToggle.checked;
      await Promise.all(
        Array.from(presetToggles).map(async (toggle) => {
          if (toggle.checked === shouldCheck) return;
          toggle.checked = shouldCheck;
          await togglePreset(toggle);
        })
      );
      updateSelectAllState();
    });
  }

  const refreshNowBtn = document.getElementById("refresh-now-btn");
  if (refreshNowBtn) {
    refreshNowBtn.addEventListener("click", async () => {
      refreshNowBtn.disabled = true;
      refreshNowBtn.textContent = "Refreshing…";
      try {
        const res = await fetch("/admin/feeds/refresh", { method: "POST" });
        const data = await res.json();
        alert(`Refetched ${data.feedsAttempted} feeds, upserted ${data.articlesUpserted} articles, scraped ${data.imagesScraped} fallback images.`);
        location.reload();
      } finally {
        refreshNowBtn.disabled = false;
        refreshNowBtn.textContent = "Refresh Now";
      }
    });
  }

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

  const validViews = ["new", "readlater", "favorites", "read"];
  const initialView = new URLSearchParams(location.search).get("view");
  const state = {
    source: new URLSearchParams(location.search).get("source") || "all",
    view: validViews.includes(initialView) ? initialView : "new",
  };

  function currentParams() {
    const p = new URLSearchParams();
    p.set("source", state.source);
    if (state.view !== "new") p.set("view", state.view);
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

  // --- Mutually-exclusive tab switcher: New Articles / For Later / Favourites / Already Read ---
  const tabBtns = Array.from(document.querySelectorAll(".tab-btn"));

  function setViewButtons() {
    tabBtns.forEach((btn) => {
      const active = btn.dataset.view === state.view;
      btn.classList.toggle("text-gray-900", active);
      btn.classList.toggle("font-semibold", active);
      btn.classList.toggle("text-gray-500", !active);
    });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.view === btn.dataset.view) return;
      state.view = btn.dataset.view;
      setViewButtons();
      reloadFeed();
    });
  });

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
          // "New Articles" and "For Later" both drop the article once it's read.
          if (state.view === "new" || state.view === "readlater") reloadFeed();
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
          favoriteToggle.classList.toggle("bg-rose-500", data.active);
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
