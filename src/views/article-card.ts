export interface ArticleCardData {
  link: string;
  title: string;
  perex: string | null;
  imageUrl: string | null;
  sourceName: string;
  isRead: boolean;
  isReadLater: boolean;
  isFavorite: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, "&#39;");
}

export function renderArticleCard(a: ArticleCardData): string {
  const opacityClass = a.isRead ? "opacity-50" : "";
  return `
    <article class="article-card border border-gray-200 rounded-xl p-4 bg-white ${opacityClass}" data-link="${escapeAttr(a.link)}">
      <div class="flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium text-gray-500 mb-1">${escapeHtml(a.sourceName)}</div>
          <a href="${escapeAttr(a.link)}" target="_blank" rel="noopener" class="article-link block text-base font-semibold text-gray-900 leading-snug mb-1 hover:underline">
            ${escapeHtml(a.title)}
          </a>
          ${a.perex ? `<p class="text-sm text-gray-600 leading-snug">${escapeHtml(a.perex)}</p>` : ""}
        </div>
        ${a.imageUrl ? `<img src="${escapeAttr(a.imageUrl)}" alt="" class="w-20 h-20 object-cover rounded-lg flex-shrink-0" loading="lazy" onerror="this.remove()" />` : ""}
      </div>
      <div class="flex items-center gap-2 mt-3">
        <button type="button" class="btn-readlater flex items-center justify-center w-10 h-10 rounded-lg ${a.isReadLater ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}" aria-label="Read later">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${a.isReadLater ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button type="button" class="btn-favorite flex items-center justify-center w-10 h-10 rounded-lg ${a.isFavorite ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"}" aria-label="Favorite">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${a.isFavorite ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></polygon></svg>
        </button>
      </div>
    </article>`;
}

export function renderArticleList(articles: ArticleCardData[]): string {
  if (articles.length === 0) {
    return `<div class="text-center text-gray-400 text-sm py-16">No articles here yet.</div>`;
  }
  return `<div class="space-y-3">${articles.map(renderArticleCard).join("")}</div>`;
}
