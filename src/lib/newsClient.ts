import { Article, CategoryKey, Comment } from "../types";
import { FALLBACK_NEWS } from "../data/fallbackNews";
import { db, auth } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  increment
} from "firebase/firestore";

export async function fetchNewsList(
  category: CategoryKey = "all",
  state?: string,
  searchQuery?: string
): Promise<Article[]> {
  let firestoreArticles: Article[] = [];
  let deletedIds: string[] = [];

  try {
    // 1. Fetch deleted articles index
    const deletedSnap = await getDoc(doc(db, "deleted_articles", "index"));
    if (deletedSnap.exists()) {
      deletedIds = deletedSnap.data()?.ids || [];
    }

    // 2. Fetch all articles from Firestore
    const querySnapshot = await getDocs(collection(db, "articles"));
    querySnapshot.forEach((docSnap) => {
      if (docSnap.exists() && docSnap.id !== "index") {
        const data = docSnap.data() as Article;
        if (data && data.id) {
          firestoreArticles.push(data);
        }
      }
    });
  } catch (err) {
    console.warn("Firestore list fetch warning (using local fallback if needed):", err);
  }

  // Combine Firestore articles with FALLBACK_NEWS
  const articleMap = new Map<string, Article>();

  // Initialize with fallback news
  for (const item of FALLBACK_NEWS) {
    if (!deletedIds.includes(item.id)) {
      articleMap.set(item.id, item);
    }
  }

  // Override or insert Firestore articles
  for (const item of firestoreArticles) {
    if (!deletedIds.includes(item.id)) {
      articleMap.set(item.id, item);
    }
  }

  let items = Array.from(articleMap.values());

  // Sort by createdAt / date descending
  items.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Category & State filtering
  if (category && category !== "all") {
    if (category === "state") {
      items = items.filter((a) => a.category === "state" || !!a.state);
      if (state && state !== "सभी राज्य") {
        const cleanState = state.trim();
        items = items.filter(
          (a) =>
            a.state === cleanState ||
            a.title.includes(cleanState) ||
            (a.subtitle && a.subtitle.includes(cleanState)) ||
            (a.content && a.content.includes(cleanState)) ||
            (a.tags && a.tags.some((t) => t.includes(cleanState)))
        );
      }
    } else {
      items = items.filter((a) => a.category === category);
      if (state && state !== "सभी राज्य") {
        const cleanState = state.trim();
        items = items.filter(
          (a) =>
            a.state === cleanState ||
            a.title.includes(cleanState) ||
            (a.subtitle && a.subtitle.includes(cleanState)) ||
            (a.content && a.content.includes(cleanState)) ||
            (a.tags && a.tags.some((t) => t.includes(cleanState)))
        );
      }
    }
  } else if (state && state !== "सभी राज्य") {
    const cleanState = state.trim();
    items = items.filter(
      (a) =>
        a.state === cleanState ||
        a.title.includes(cleanState) ||
        (a.subtitle && a.subtitle.includes(cleanState)) ||
        (a.content && a.content.includes(cleanState)) ||
        (a.tags && a.tags.some((t) => t.includes(cleanState)))
    );
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
    // Check deleted articles index
    const deletedSnap = await getDoc(doc(db, "deleted_articles", "index"));
    if (deletedSnap.exists()) {
      const deletedIds: string[] = deletedSnap.data()?.ids || [];
      if (deletedIds.includes(id)) {
        return null;
      }
    }

    const docSnap = await getDoc(doc(db, "articles", id));
    if (docSnap.exists()) {
      return docSnap.data() as Article;
    }
  } catch (err) {
    console.warn("Firestore article fetch warning:", err);
  }

  const found = FALLBACK_NEWS.find((a) => a.id === id);
  return found || null;
}

export async function likeArticleClient(id: string): Promise<{ likes: number }> {
  try {
    const articleRef = doc(db, "articles", id);
    const docSnap = await getDoc(articleRef);

    if (docSnap.exists()) {
      await updateDoc(articleRef, { likes: increment(1) });
      const currentLikes = docSnap.data().likes || 0;
      return { likes: currentLikes + 1 };
    } else {
      // If from fallback, seed it to Firestore with incremented likes
      const fallback = FALLBACK_NEWS.find((a) => a.id === id);
      const newLikes = (fallback?.likes || 0) + 1;
      if (fallback) {
        await setDoc(articleRef, { ...fallback, likes: newLikes }, { merge: true });
      }
      return { likes: newLikes };
    }
  } catch (err: any) {
    console.error("Firestore like error:", err);
    throw new Error(err?.message || "पसंद (Like) सहेजने में विफलता।");
  }
}

export async function addCommentClient(
  id: string,
  name: string,
  text: string
): Promise<{ comments: Comment[] }> {
  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    name: name.trim() || "पाठक",
    text: text.trim(),
    date: new Date().toLocaleDateString("hi-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  };

  try {
    const articleRef = doc(db, "articles", id);
    const docSnap = await getDoc(articleRef);

    if (docSnap.exists()) {
      await updateDoc(articleRef, {
        comments: arrayUnion(newComment)
      });
      const existingComments = docSnap.data().comments || [];
      return { comments: [...existingComments, newComment] };
    } else {
      const fallback = FALLBACK_NEWS.find((a) => a.id === id);
      const comments = [...(fallback?.comments || []), newComment];
      if (fallback) {
        await setDoc(articleRef, { ...fallback, comments }, { merge: true });
      }
      return { comments };
    }
  } catch (err: any) {
    console.error("Firestore comment error:", err);
    throw new Error(err?.message || "टिप्पणी जोड़ने में विफलता।");
  }
}

export async function saveArticleClient(articleData: Partial<Article>): Promise<Article> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("केवल प्रमाणित एडमिन ही समाचार सहेज या प्रकाशित कर सकते हैं। (Firebase authentication required)");
  }

  const id = articleData.id || `art-${Date.now()}`;
  const nowStr = new Date().toISOString();
  const dateDisplay = articleData.date || new Date().toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const fullArticle: Article = {
    id,
    title: articleData.title || "बिना शीर्षक",
    subtitle: articleData.subtitle || "",
    content: articleData.content || "",
    category: articleData.category || "national",
    state: articleData.state || "",
    image: articleData.image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200",
    author: articleData.author || "दैनिक विशेष डेस्क",
    date: dateDisplay,
    readTime: articleData.readTime || 3,
    views: articleData.views || 100,
    likes: articleData.likes || 0,
    comments: articleData.comments || [],
    tags: articleData.tags || [],
    isBreaking: !!articleData.isBreaking,
    isFeatured: !!articleData.isFeatured,
    isTrending: !!articleData.isTrending,
    createdAt: articleData.createdAt || nowStr,
    metaDescription: articleData.metaDescription || ""
  };

  try {
    await setDoc(doc(db, "articles", id), fullArticle, { merge: true });
    return fullArticle;
  } catch (err: any) {
    console.error("Firestore save article error:", err);
    throw new Error("Firestore में खबर प्रकाशित करने में विफलता: " + (err?.message || err));
  }
}

export async function deleteArticleClient(id: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("केवल प्रमाणित एडमिन ही समाचार हटा सकते हैं। (Firebase authentication required)");
  }

  try {
    // 1. Record ID in deleted_articles index so fallback items stay deleted
    await setDoc(doc(db, "deleted_articles", "index"), { ids: arrayUnion(id) }, { merge: true });

    // 2. Delete article document
    await deleteDoc(doc(db, "articles", id));
    return true;
  } catch (err: any) {
    console.error("Firestore delete article error:", err);
    throw new Error("Firestore से खबर हटाने में विफलता: " + (err?.message || err));
  }
}
