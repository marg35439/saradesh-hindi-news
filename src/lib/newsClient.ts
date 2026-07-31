import { Article, CategoryKey, Comment } from "../types";
import { FALLBACK_NEWS, getLocalArticles, saveLocalArticles } from "../data/fallbackNews";

export async function fetchNewsList(
  category: CategoryKey = "all",
  state?: string,
  searchQuery?: string
): Promise<Article[]> {
  let url = `/api/news?category=${category}&_t=${Date.now()}`;
  if (category === "state" && state) {
    url += `&state=${encodeURIComponent(state)}`;
  }
  if (searchQuery && searchQuery.trim()) {
    url += `&search=${encodeURIComponent(searchQuery.trim())}`;
  }

  try {
    const res = await fetch(url, {
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Keep local storage in sync when fetching news
        if (!searchQuery) {
          if (category === "all" && (!state || state === "सभी राज्य")) {
            saveLocalArticles(data);
          } else {
            // Merge with existing local articles
            const current = getLocalArticles();
            const map = new Map<string, Article>();
            current.forEach(item => map.set(item.id, item));
            data.forEach((item: Article) => map.set(item.id, item));
            saveLocalArticles(Array.from(map.values()));
          }
        }
        return data;
      }
    }
  } catch (err) {
    console.warn("API news fetch failed, using client-side fallback:", err);
  }

  // Fallback to local storage or fallback dataset
  let items = getLocalArticles();

  // Category filter
  if (category && category !== "all") {
    if (category === "state") {
      if (state && state !== "सभी राज्य") {
        items = items.filter(
          (a) =>
            a.category === "state" ||
            a.content.includes(state) ||
            a.title.includes(state) ||
            a.subtitle?.includes(state)
        );
      } else {
        items = items.filter((a) => a.category === "state");
      }
    } else {
      items = items.filter((a) => a.category === category);
    }
  }

  // Search filter
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle?.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  return items;
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  try {
    const res = await fetch(`/api/news/${id}?_t=${Date.now()}`, {
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("API article fetch failed, using client-side fallback:", err);
  }

  const items = getLocalArticles();
  const found = items.find((a) => a.id === id);
  return found || null;
}

export async function likeArticleClient(id: string): Promise<{ likes: number }> {
  try {
    const res = await fetch(`/api/news/${id}/like`, { method: "POST" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("API like failed, updating local storage:", err);
  }

  const items = getLocalArticles();
  const index = items.findIndex((a) => a.id === id);
  let newLikes = 1;
  if (index !== -1) {
    items[index].likes = (items[index].likes || 0) + 1;
    newLikes = items[index].likes;
    saveLocalArticles(items);
  }
  return { likes: newLikes };
}

export async function addCommentClient(
  id: string,
  name: string,
  text: string
): Promise<{ comments: Comment[] }> {
  try {
    const res = await fetch(`/api/news/${id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, text })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("API comment failed, updating local storage:", err);
  }

  const items = getLocalArticles();
  const index = items.findIndex((a) => a.id === id);
  const newComment: Comment = {
    id: "comment-" + Date.now(),
    name: name || "पाठक",
    text,
    date: "अभी"
  };

  let updatedComments: Comment[] = [newComment];
  if (index !== -1) {
    updatedComments = [newComment, ...(items[index].comments || [])];
    items[index].comments = updatedComments;
    saveLocalArticles(items);
  }
  return { comments: updatedComments };
}

export async function saveArticleClient(articleData: Partial<Article>): Promise<Article> {
  const isEdit = !!articleData.id;
  const url = isEdit ? `/api/news/${articleData.id}` : "/api/news";
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData)
    });
    if (res.ok) {
      const data = await res.json();
      const saved: Article = data.article || data;
      
      const items = getLocalArticles();
      const idx = items.findIndex((a) => a.id === saved.id);
      if (idx !== -1) {
        items[idx] = saved;
      } else {
        items.unshift(saved);
      }
      saveLocalArticles(items);
      return saved;
    }
  } catch (err) {
    console.warn("API save article failed, updating local storage:", err);
  }

  // Fallback to local storage if server request fails
  const items = getLocalArticles();
  let articleToReturn: Article;

  if (articleData.id) {
    // Edit existing
    const idx = items.findIndex((a) => a.id === articleData.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...articleData };
      articleToReturn = items[idx];
    } else {
      articleToReturn = articleData as Article;
      items.unshift(articleToReturn);
    }
  } else {
    // Create new
    articleToReturn = {
      id: "news-" + Date.now(),
      title: articleData.title || "बिना शीर्षक",
      subtitle: articleData.subtitle || "",
      content: articleData.content || "",
      category: articleData.category || "national",
      image: articleData.image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800",
      author: articleData.author || "विशेष संपादक",
      date: articleData.date || new Date().toLocaleDateString("hi-IN", { year: 'numeric', month: 'long', day: 'numeric' }),
      readTime: articleData.readTime || 3,
      views: 1,
      likes: 0,
      comments: [],
      tags: articleData.tags || ["समाचार"],
      isBreaking: !!articleData.isBreaking,
      isFeatured: !!articleData.isFeatured,
      isTrending: !!articleData.isTrending
    };
    items.unshift(articleToReturn);
  }

  saveLocalArticles(items);
  return articleToReturn;
}

export async function deleteArticleClient(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
    if (res.ok) {
      const items = getLocalArticles();
      const filtered = items.filter((a) => a.id !== id);
      saveLocalArticles(filtered);
      return true;
    }
  } catch (err) {
    console.warn("API delete article failed, updating local storage:", err);
  }

  const items = getLocalArticles();
  const filtered = items.filter((a) => a.id !== id);
  saveLocalArticles(filtered);
  return true;
}
