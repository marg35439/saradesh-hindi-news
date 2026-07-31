import { Article, CategoryKey, Comment } from "../types";
import { FALLBACK_NEWS } from "../data/fallbackNews";

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
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.error("API news fetch failed:", err);
  }

  // Static fallback dataset for initial page load if backend unreachable
  let items = [...FALLBACK_NEWS];

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
    console.error("API article fetch failed:", err);
  }

  const found = FALLBACK_NEWS.find((a) => a.id === id);
  return found || null;
}

export async function likeArticleClient(id: string): Promise<{ likes: number }> {
  const res = await fetch(`/api/news/${id}/like`, { method: "POST" });
  if (res.ok) {
    return await res.json();
  }
  throw new Error("पसंद (Like) अपडेट करने में विफलता।");
}

export async function addCommentClient(
  id: string,
  name: string,
  text: string
): Promise<{ comments: Comment[] }> {
  const res = await fetch(`/api/news/${id}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, text })
  });
  if (res.ok) {
    return await res.json();
  }
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "टिप्पणी जोड़ने में विफलता।");
}

export async function saveArticleClient(articleData: Partial<Article>): Promise<Article> {
  const isEdit = !!articleData.id;
  const url = isEdit ? `/api/news/${articleData.id}` : "/api/news";
  const method = isEdit ? "PUT" : "POST";

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData)
    });
  } catch (netErr: any) {
    throw new Error("सर्वर से संपर्क नहीं हो सका। कृपया अपना इंटरनेट कनेक्शन जांचें: " + (netErr?.message || "नेटवर्क त्रुटि"));
  }

  if (res.ok) {
    const data = await res.json();
    return data.article || data;
  } else {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "सर्वर/डेटाबेस (Firestore) पर खबर सहेजने में विफल।");
  }
}

export async function deleteArticleClient(id: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(`/api/news/${id}`, { method: "DELETE" });
  } catch (netErr: any) {
    throw new Error("सर्वर से संपर्क नहीं हो सका: " + (netErr?.message || "नेटवर्क त्रुटि"));
  }

  if (res.ok) {
    return true;
  } else {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "सर्वर/डेटाबेस (Firestore) से खबर हटाने में विफल।");
  }
}
