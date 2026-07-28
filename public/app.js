// Surikata frontend interactivity — no build step, plain fetch-based AJAX.

// --- Header: profile dropdown toggle ---
(function () {
  const menuBtn = document.getElementById("profile-menu-btn");
  const dropdown = document.getElementById("profile-menu-dropdown");
  const menu = document.getElementById("profile-menu");
  if (!menuBtn || !dropdown || !menu) return;

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) dropdown.classList.add("hidden");
  });
})();

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

  const discoverBtn = document.getElementById("discover-btn");
  const customUrlInput = document.getElementById("custom-url");
  const resultsEl = document.getElementById("discover-results");

  // Fallback guess (publisher name from domain) used only when the feed's
  // own <channel>/<feed> title couldn't be extracted server-side.
  function guessPublisherName(inputUrl) {
    try {
      let host = new URL(/^https?:\/\//i.test(inputUrl) ? inputUrl : "https://" + inputUrl).hostname;
      host = host.replace(/^www\./, "");
      const mainPart = host.split(".").slice(0, -1).join(".") || host;
      return mainPart
        .split(/[.\-_]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    } catch {
      return "";
    }
  }

  if (discoverBtn && customUrlInput && resultsEl) {
    discoverBtn.addEventListener("click", async () => {
      const url = customUrlInput.value.trim();
      if (!url) return;
      discoverBtn.disabled = true;
      discoverBtn.textContent = "Načítavam…";
      resultsEl.innerHTML = "";
      try {
        const res = await fetch("/admin/feeds/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!data.ok) {
          resultsEl.innerHTML = `<div class="text-sm text-red-500">Na tejto adrese sa nepodarilo nájsť platný RSS/Atom zdroj.</div>`;
          return;
        }

        const row = document.createElement("div");
        row.className = "flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2";
        const guessedName = data.name || guessPublisherName(data.url);
        row.innerHTML = `
          <input type="text" class="discovered-name flex-1 min-w-0 text-sm text-gray-700 bg-white border border-gray-300 rounded-md px-2 py-1" value="${guessedName.replace(/"/g, "&quot;")}" />
          <button type="button" class="add-discovered flex-shrink-0 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-1">Pridať</button>
        `;
        row.querySelector(".add-discovered").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          const nameInput = row.querySelector(".discovered-name");
          const name = nameInput.value.trim() || data.url;
          const addRes = await fetch("/admin/feeds/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: data.url, name }),
          });
          const addData = await addRes.json();
          if (addData.fetchFailed) {
            alert("Zdroj bol pridaný — články sa zobrazia, hneď ako bude dostupný.");
          }
          location.reload();
        });
        resultsEl.appendChild(row);
      } finally {
        discoverBtn.disabled = false;
        discoverBtn.textContent = "Načítať zdroj";
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
