import React, { useState, useEffect } from "react";
import { Newspaper, Flame, Heart, MessageSquare, Eye, ArrowRight, CornerDownRight, RefreshCw, Layers, Check, ThumbsUp, MapPin, Sun, Award, HelpCircle, Cloud, CloudRain, CloudSun, Grid, ListFilter, Bookmark, Radio, Briefcase, GraduationCap, Sparkles, Landmark, Compass, ChevronRight, Shield, TrendingUp, TrendingDown, BarChart3, FileText, Scale, CheckSquare, Building, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import BreakingNews from "./components/BreakingNews";
import MainMenu from "./components/MainMenu";
import ArticleCard from "./components/ArticleCard";
import ArticleDetail from "./components/ArticleDetail";
import AdminPanel from "./components/AdminPanel";
import AudioNewsReader from "./components/AudioNewsReader";
import SavedArticlesModal from "./components/SavedArticlesModal";
import MobileBottomNav from "./components/MobileBottomNav";
import { SEOHead } from "./components/SEOHead";
import { AuthorProfile } from "./components/AuthorProfile";
import { PolicyPages } from "./components/PolicyPages";
import { AdBanner } from "./components/AdBanner";
import { initGA, logPageView } from "./lib/analytics";
import { Article, CategoryKey, CATEGORIES, STATES, SUBCATEGORIES } from "./types";
import { fetchNewsList } from "./lib/newsClient";
import { getArticleUrl, parseArticleUrlPath } from "./lib/slug";

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedPolicyPage, setSelectedPolicyPage] = useState<"editorial-policy" | "corrections-policy" | "fact-check-policy" | "publisher-info" | "about-us" | "contact-us" | "privacy-policy" | "terms-and-conditions" | "disclaimer" | "editorial-team" | null>(null);
  
  // Dense compact view toggle
  const [isCompactView, setIsCompactView] = useState(false);

  // Saved / Bookmarked articles state
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sara_saved_news");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  const toggleBookmark = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setSavedArticleIds((prev) => {
      const exists = prev.includes(article.id);
      const updated = exists ? prev.filter((id) => id !== article.id) : [...prev, article.id];
      try {
        localStorage.setItem("sara_saved_news", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeBookmark = (articleId: string) => {
    setSavedArticleIds((prev) => {
      const updated = prev.filter((id) => id !== articleId);
      try {
        localStorage.setItem("sara_saved_news", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllBookmarks = () => {
    setSavedArticleIds([]);
    try {
      localStorage.removeItem("sara_saved_news");
    } catch {}
  };

  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>("सभी राज्य");
  const [searchQuery, setSearchQuery] = useState<string>("");


  // Local opinion poll states
  const [hasVoted, setHasVoted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sara_poll_voted") === "true";
    } catch {
      return false;
    }
  });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("sara_poll_votes");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { A: 1482, B: 615, C: 198 }; 
  });

  const handleVoteSubmit = (option: string) => {
    const newVotes = {
      ...pollVotes,
      [option]: (pollVotes[option] || 0) + 1
    };
    setPollVotes(newVotes);
    setHasVoted(true);
    try {
      localStorage.setItem("sara_poll_voted", "true");
      localStorage.setItem("sara_poll_votes", JSON.stringify(newVotes));
    } catch {}
  };

  // Sidebar weather data
  const [sidebarWeather, setSidebarWeather] = useState<Record<string, { temp: number; text: string; icon: string }>>({});

  // Real-time Stock Market data
  const [marketData, setMarketData] = useState<{
    sensex?: { price: number; change: number; changePct: number; isUp: boolean };
    nifty?: { price: number; change: number; changePct: number; isUp: boolean };
    banknifty?: { price: number; change: number; changePct: number; isUp: boolean };
    gold?: { price: number; change: number; changePct: number; isUp: boolean };
    silver?: { price: number; change: number; changePct: number; isUp: boolean };
    lastUpdated?: string;
  } | null>(null);

  useEffect(() => {
    const getSidebarWeather = () => {
      fetch(`/api/weather?_t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => setSidebarWeather(data))
        .catch(() => {
          // Fallback of cities
          setSidebarWeather({
            "दिल्ली": { temp: 32, text: "साफ मौसम", icon: "Sun" },
            "मुंबई": { temp: 30, text: "उमस भरा मौसम", icon: "Cloud" },
            "जयपुर": { temp: 33, text: "तेज धूप", icon: "Sun" },
            "भोपाल": { temp: 29, text: "आंशिक रूप से बादल", icon: "CloudSun" },
            "लखनऊ": { temp: 31, text: "हल्की धूप", icon: "Sun" },
            "पटना": { temp: 31, text: "सामान्य मौसम", icon: "CloudSun" },
            "रांची": { temp: 27, text: "मौसम सुहावना", icon: "Cloud" }
          });
        });
    };

    const getMarketData = () => {
      fetch(`/api/market?_t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => setMarketData(data))
        .catch(() => {});
    };

    getSidebarWeather();
    getMarketData();

    // Poll every 15 seconds for live real-time market and weather updates
    const weatherInterval = setInterval(getSidebarWeather, 20000);
    const marketInterval = setInterval(getMarketData, 15000);

    // Refresh data when browser tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        getMarketData();
        getSidebarWeather();
        loadNews();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(weatherInterval);
      clearInterval(marketInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const getCityForState = (state: string): string => {
    const mapping: Record<string, string> = {
      "सभी राज्य": "दिल्ली",
      "मध्य प्रदेश": "भोपाल",
      "राजस्थान": "जयपुर",
      "बिहार": "पटना",
      "उत्तर प्रदेश": "लखनऊ",
      "दिल्ली": "दिल्ली",
      "गुजरात": "मुंबई",
      "झारखंड": "रांची"
    };
    return mapping[state] || "दिल्ली";
  };

  useEffect(() => {
    initGA();
    logPageView(window.location.pathname + window.location.search);

    // 1. Check URL parameters and path for routing
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      setIsAdminMode(true);
    }

    // Check path-based article URL first
    const pathParsed = parseArticleUrlPath(window.location.pathname);
    const initialArticleId = pathParsed?.articleId || params.get("article") || params.get("id");
    if (initialArticleId) {
      setSelectedArticleId(initialArticleId);
    }
    const initialCat = pathParsed?.category || params.get("category");
    if (initialCat) {
      setSelectedCategory(initialCat as CategoryKey);
    }
    const initialSubcat = params.get("subcategory");
    if (initialSubcat) {
      setSelectedSubcategory(initialSubcat);
    }
    const initialState = params.get("state");
    if (initialState) {
      setSelectedState(initialState);
    }
    const initialAuthor = params.get("author");
    if (initialAuthor) {
      setSelectedAuthor(initialAuthor);
    }
    const pathPolicyMap: Record<string, any> = {
      "/privacy-policy": "privacy-policy",
      "/terms-and-conditions": "terms-and-conditions",
      "/disclaimer": "disclaimer",
      "/editorial-team": "editorial-team",
      "/about-us": "about-us",
      "/editorial-policy": "editorial-policy",
      "/corrections-policy": "corrections-policy",
      "/fact-check-policy": "fact-check-policy",
      "/publisher-info": "publisher-info",
      "/contact-us": "contact-us"
    };
    const initialPage = params.get("page") || pathPolicyMap[window.location.pathname];
    if (initialPage) {
      setSelectedPolicyPage(initialPage as any);
    }

    // 2. Popstate listener for browser back/forward buttons
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      const pp = parseArticleUrlPath(window.location.pathname);
      const articleId = pp?.articleId || p.get("article") || p.get("id");
      setSelectedArticleId(articleId || null);

      const cat = pp?.category || p.get("category");
      if (cat) {
        setSelectedCategory(cat as CategoryKey);
      }

      setSelectedSubcategory(p.get("subcategory") || null);

      const st = p.get("state");
      if (st) {
        setSelectedState(st);
      }

      setSelectedAuthor(p.get("author") || null);
      setSelectedPolicyPage((p.get("page") as any) || pathPolicyMap[window.location.pathname] || null);

      setIsAdminMode(p.get("admin") === "true");
      logPageView(window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handlePopState);

    // 3. Keyboard shortcut: Alt + Shift + A to toggle admin mode secretly
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setIsAdminMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    loadNews();
  }, [selectedCategory, selectedSubcategory, selectedState, searchQuery, isAdminMode]);

  const loadNews = () => {
    setLoading(true);
    fetchNewsList(selectedCategory, selectedState, searchQuery, selectedSubcategory || undefined)
      .then((data: Article[]) => {
        setArticles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Load news error:", err);
        setLoading(false);
      });
  };

  const handleArticleClick = (art: Article) => {
    setIsAdminMode(false); // return to normal reading
    setSelectedArticleId(art.id);
    try {
      window.history.pushState({}, "", getArticleUrl(art));
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (key: CategoryKey) => {
    setSelectedCategory(key);
    setSelectedArticleId(null); // return to lists
    try {
      window.history.pushState({}, "", key === "all" ? "/" : "?category=" + encodeURIComponent(key));
    } catch {}
  };

  const handleStateSelect = (state: string) => {
    setSelectedCategory("state");
    setSelectedState(state);
    setSelectedArticleId(null);
  };

  // Find featured story (isFeatured: true), fallback to first regular story
  const featuredArticle = articles.find((a) => a.isFeatured) || articles[0];
  const trendingArticles = articles.filter((a) => a.isTrending).slice(0, 12);
  const regularArticles = articles.filter((a) => a.id !== (featuredArticle?.id || ""));

  // SARA DESH.IN homepage dense categorization logic:
  // 1. Trending list on the main feed: we select up to 20 items.
  const homeTrendingNews: Article[] = [];
  const homeTrendingSet = new Set<string>();

  // Add featured first
  if (featuredArticle) {
    homeTrendingNews.push(featuredArticle);
    homeTrendingSet.add(featuredArticle.id);
  }

  // Add trending articles
  articles.forEach(a => {
    if (a.isTrending && !homeTrendingSet.has(a.id) && homeTrendingNews.length < 20) {
      homeTrendingNews.push(a);
      homeTrendingSet.add(a.id);
    }
  });

  // If we still don't have 20 items, add remaining articles until we reach 20
  articles.forEach(a => {
    if (!homeTrendingSet.has(a.id) && homeTrendingNews.length < 20) {
      homeTrendingNews.push(a);
      homeTrendingSet.add(a.id);
    }
  });

  // 2. Category wise news: exactly 2 per category, strictly matching category key
  const categorySections = [
    { key: "national", hindiName: "देश (National)" },
    { key: "state", hindiName: "राज्य समाचार (State)" },
    { key: "crime", hindiName: "क्राइम वर्ल्ड / अपराध (Crime World)" },
    { key: "sports", hindiName: "खेल जगत (Sports)" },
    { key: "entertainment", hindiName: "मनोरंजन (Entertainment)" },
    { key: "business", hindiName: "बिजनेस (Business)" },
    { key: "tech", hindiName: "टेक जगत (Technology)" },
    { key: "lifestyle", hindiName: "लाइफस्टाइल (Lifestyle)" },
    { key: "international", hindiName: "विदेश (International)" },
  ].map(cat => {
    // Strictly filter articles by category key
    const catArts = articles.filter(a => a.category === cat.key);
    return {
      key: cat.key,
      hindiName: cat.hindiName,
      articles: catArts.slice(0, 2)
    };
  }).filter(cat => cat.articles.length > 0);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col text-neutral-800 selection:bg-[#ff6f00]/20 selection:text-neutral-900">
      
      {/* 1. Header with weather & date & admin trigger */}
      <Header 
        isAdminMode={isAdminMode} 
        onAdminClick={() => {
          setIsAdminMode(!isAdminMode);
          setSelectedArticleId(null); // Clear specific article view
        }} 
        onHomeClick={() => {
          setIsAdminMode(false);
          setSelectedArticleId(null);
          setSelectedCategory("all");
          setSearchQuery("");
        }}
      />

      {/* 2. Breaking News ribbons */}
      {!isAdminMode && (
        <BreakingNews 
          articles={articles} 
          onArticleClick={handleArticleClick} 
        />
      )}

      {/* 3. Topics Bar / State Selectors & Search Input */}
      {!isAdminMode && (
        <MainMenu
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedSubcategory(null);
            handleCategorySelect(cat);
          }}
          selectedState={selectedState}
          onSelectState={handleStateSelect}
          selectedSubcategory={selectedSubcategory}
          onSelectSubcategory={(subKey) => {
            setSelectedSubcategory(subKey);
            setSelectedArticleId(null);
            try {
              if (subKey) {
                window.history.pushState({}, "", "?subcategory=" + encodeURIComponent(subKey));
              } else {
                window.history.pushState({}, "", selectedCategory === "all" ? "/" : "?category=" + encodeURIComponent(selectedCategory));
              }
            } catch {}
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setSelectedArticleId(null);
          }}
        />
      )}

      {/* 3.5 Stock Market Live Ticker Bar (Main Page Only) */}
      {!isAdminMode && !selectedArticleId && selectedCategory === "all" && !searchQuery && (
        <div className="bg-slate-950 text-white border-y border-emerald-500/30 py-2 px-4 shadow-sm overflow-hidden font-sans">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs">
              <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              <span>शेयर बाज़ार (LIVE)</span>
            </div>
            
            {/* Ticker marquee / scrollable items */}
            <div className="overflow-x-auto no-scrollbar flex items-center gap-3 text-xs py-0.5">
              {/* BSE SENSEX */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 transition-colors">
                <span className="font-bold text-neutral-300">BSE SENSEX:</span>
                <span className="font-extrabold text-white font-mono">
                  {marketData?.sensex ? marketData.sensex.price.toLocaleString('en-IN') : '77,928.15'}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                  (marketData?.sensex?.isUp ?? true) ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
                }`}>
                  {(marketData?.sensex?.isUp ?? true) ? '▲' : '▼'} {marketData?.sensex ? `${marketData.sensex.change > 0 ? '+' : ''}${marketData.sensex.change} (${marketData.sensex.changePct > 0 ? '+' : ''}${marketData.sensex.changePct}%)` : '+273.55 (+0.35%)'}
                </span>
              </div>

              {/* NSE NIFTY 50 */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 transition-colors">
                <span className="font-bold text-neutral-300">NSE NIFTY 50:</span>
                <span className="font-extrabold text-white font-mono">
                  {marketData?.nifty ? marketData.nifty.price.toLocaleString('en-IN') : '24,317.15'}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                  (marketData?.nifty?.isUp ?? true) ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
                }`}>
                  {(marketData?.nifty?.isUp ?? true) ? '▲' : '▼'} {marketData?.nifty ? `${marketData.nifty.change > 0 ? '+' : ''}${marketData.nifty.change} (${marketData.nifty.changePct > 0 ? '+' : ''}${marketData.nifty.changePct}%)` : '+66.95 (+0.28%)'}
                </span>
              </div>

              {/* BANK NIFTY */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 transition-colors">
                <span className="font-bold text-neutral-300">BANK NIFTY:</span>
                <span className="font-extrabold text-white font-mono">
                  {marketData?.banknifty ? marketData.banknifty.price.toLocaleString('en-IN') : '57,147.50'}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                  (marketData?.banknifty?.isUp ?? false) ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
                }`}>
                  {(marketData?.banknifty?.isUp ?? false) ? '▲' : '▼'} {marketData?.banknifty ? `${marketData.banknifty.change > 0 ? '+' : ''}${marketData.banknifty.change} (${marketData.banknifty.changePct > 0 ? '+' : ''}${marketData.banknifty.changePct}%)` : '-58.40 (-0.10%)'}
                </span>
              </div>

              {/* GOLD */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 transition-colors">
                <span className="font-bold text-amber-300">GOLD (24K/10g):</span>
                <span className="font-extrabold text-white font-mono">
                  ₹{marketData?.gold ? marketData.gold.price.toLocaleString('en-IN') : '74,850'}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                  (marketData?.gold?.isUp ?? true) ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
                }`}>
                  {(marketData?.gold?.isUp ?? true) ? '▲' : '▼'} {marketData?.gold ? `${marketData.gold.change > 0 ? '+' : ''}${marketData.gold.change}` : '+250'}
                </span>
              </div>

              {/* SILVER */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 transition-colors">
                <span className="font-bold text-neutral-300">SILVER (1kg):</span>
                <span className="font-extrabold text-white font-mono">
                  ₹{marketData?.silver ? marketData.silver.price.toLocaleString('en-IN') : '89,200'}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                  (marketData?.silver?.isUp ?? true) ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
                }`}>
                  {(marketData?.silver?.isUp ?? true) ? '▲' : '▼'} {marketData?.silver ? `${marketData.silver.change > 0 ? '+' : ''}${marketData.silver.change}` : '+450'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN LAYOUT AND VIEW SWITCHING */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:py-8">
        <AnimatePresence mode="wait">
          
          {/* USER ADMIN MODE */}
          {isAdminMode ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <AdminPanel />
            </motion.div>
          ) 
          
          // SINGLE ARTICLE DETAIL MODE
          : selectedArticleId ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArticleDetail 
                articleId={selectedArticleId} 
                onBack={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    setSelectedArticleId(null);
                    try {
                      window.history.pushState({}, "", window.location.pathname);
                    } catch {}
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                isBookmarked={savedArticleIds.includes(selectedArticleId)}
                onToggleBookmark={(e, art) => toggleBookmark(e, art)}
                allArticles={articles}
                onArticleSelect={(art) => handleArticleClick(art)}
                onAuthorClick={(authorName) => {
                  setSelectedArticleId(null);
                  setSelectedPolicyPage(null);
                  setSelectedAuthor(authorName);
                  try {
                    window.history.pushState({}, "", "?author=" + encodeURIComponent(authorName));
                  } catch {}
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </motion.div>
          )

          // AUTHOR PROFILE MODE
          : selectedAuthor ? (
            <motion.div
              key="author"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SEOHead authorName={selectedAuthor} />
              <AuthorProfile
                authorName={selectedAuthor}
                articles={articles}
                onArticleClick={(art) => handleArticleClick(art)}
                onBack={() => {
                  setSelectedAuthor(null);
                  try {
                    window.history.pushState({}, "", "/");
                  } catch {}
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onBookmarkToggle={(artId) => {
                  const art = articles.find(a => a.id === artId);
                  if (art) toggleBookmark(new MouseEvent("click") as any, art);
                }}
                savedArticleIds={savedArticleIds}
              />
            </motion.div>
          )

          // POLICY & ABOUT PAGES MODE
          : selectedPolicyPage ? (
            <motion.div
              key="policy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {(() => {
                const seoTitles: Record<string, { title: string; desc: string }> = {
                  "privacy-policy": {
                    title: "गोपनीयता नीति (Privacy Policy)",
                    desc: "सारादेश (https://www.saradesh.in) की आधिकारिक गोपनीयता नीति। जानें हम आपकी व्यक्तिगत जानकारी, कुकीज़, एनालिटिक्स, गूगल एडसेंस और डेटा सुरक्षा को कैसे सुरक्षित रखते हैं।"
                  },
                  "terms-and-conditions": {
                    title: "नियम एवं शर्तें (Terms & Conditions)",
                    desc: "सारादेश (https://www.saradesh.in) का उपयोग करने के लिए नियम एवं शर्तें। कॉपीराइट, बौद्धिक संपदा, उपयोगकर्ता जिम्मेदारियां, दायित्व सीमा और भारतीय कानून संबंधी नियम।"
                  },
                  "disclaimer": {
                    title: "अस्वीकरण (Disclaimer)",
                    desc: "सारादेश (https://www.saradesh.in) का आधिकारिक अस्वीकरण। खबरों की सटीकता, वित्तीय, मेडिकल, कानूनी सलाह से संबंधित जानकारी और प्रायोजित सामग्री डिस्क्लोजर।"
                  },
                  "editorial-team": {
                    title: "हमारी संपादकीय टीम (Editorial Team)",
                    desc: "सारादेश (https://www.saradesh.in) की अनुभवी और निष्पक्ष संपादकीय टीम से मिलें। प्रधान संपादक, फैक्ट-चेक डेस्क, राजनीति, खेल, टेक व मनोरंजन संपादकों की जानकारी।"
                  },
                  "about-us": {
                    title: "हमारे बारे में (About Us)",
                    desc: "सारादेश (https://www.saradesh.in) - भारत का विश्वसनीय हिंदी डिजिटल समाचार पोर्टल।"
                  },
                  "editorial-policy": {
                    title: "संपादकीय नीति (Editorial Policy)",
                    desc: "सारादेश की निष्पक्ष और पारदर्शी संपादकीय नीतियां एवं पत्रकारिता के सिद्धांत।"
                  },
                  "corrections-policy": {
                    title: "सुधार नीति (Corrections Policy)",
                    desc: "तथ्य सुधार एवं संशोधन संबंधी सारादेश की नीति।"
                  },
                  "fact-check-policy": {
                    title: "फैक्ट चेक नीति (Fact-Check Policy)",
                    desc: "भ्रामक खबरों व अफ़वाहों के खिलाफ सारादेश की सत्यापन प्रक्रिया।"
                  },
                  "publisher-info": {
                    title: "प्रकाशक एवं स्वामित्व जानकारी (Publisher Info)",
                    desc: "कंपनी पंजीकरण, स्वामित्व व पारदर्शी विवरण।"
                  },
                  "contact-us": {
                    title: "संपर्क करें (Contact Us)",
                    desc: "सारादेश संपादकीय टीम एवं आधिकारिक कार्यालय से संपर्क करें।"
                  }
                };
                const info = seoTitles[selectedPolicyPage] || {
                  title: selectedPolicyPage.replace("-", " ").toUpperCase(),
                  desc: "सारादेश नीतिगत जानकारी पृष्ठ"
                };
                return (
                  <SEOHead
                    title={`${info.title} - सारादेश`}
                    description={info.desc}
                    url={`https://www.saradesh.in/${selectedPolicyPage}`}
                  />
                );
              })()}
              <PolicyPages
                pageType={selectedPolicyPage}
                onBack={() => {
                  setSelectedPolicyPage(null);
                  try {
                    window.history.pushState({}, "", "/");
                  } catch {}
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </motion.div>
          )
          
          // STANDARD HOME PORTAL / LIST NEWS GRID
          : (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              <SEOHead
                categoryName={selectedCategory !== "all" ? (CATEGORIES.find(c => c.key === selectedCategory)?.hindiName || selectedCategory) : undefined}
              />
              
              {/* PRIMARY CONTENT BLOCK: Center & Left feed */}
              <div className="lg:col-span-8 space-y-6">
                
                {loading ? (
                  <div className="py-24 text-center">
                    <RefreshCw className="w-8 h-8 text-[#ff6f00] animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-neutral-500 font-sans">
                      ताज़ा समाचार लोड हो रहे हैं... कृपया जुड़े रहें
                    </p>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-16 text-center shadow-xs">
                    <Newspaper className="w-14 h-14 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-neutral-800">कोई समाचार आलेख नहीं मिला!</h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1.5 font-sans leading-relaxed">
                      आपके द्वारा चुने गए श्रेणी या खोज शब्द "{searchQuery}" के लिए वर्तमान में कोई सक्रीय खबर मौजूद नहीं है। आप एडमिन पैनल में जाकर नई खबरें लाइव कर सकते हैं।
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Top Hero News (Featured Core Article) - Rendered only when not searching and on main Home page */}
                    {featuredArticle && !searchQuery && selectedCategory === "all" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group p-3.5 md:p-4.5 relative"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Image column */}
                          <div className="md:col-span-7 relative aspect-video md:aspect-auto overflow-hidden bg-neutral-900 min-h-[220px] md:min-h-[280px] rounded-xl shadow-xs">
                            <img
                              src={featuredArticle.image}
                              alt={featuredArticle.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg shadow-lg z-10 font-sans tracking-wide flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                              <span>प्रमुख मुख्य समाचार</span>
                            </div>
                          </div>
                          
                          {/* Info column */}
                          <div className="md:col-span-5 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-bold mb-2 font-sans">
                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">
                                  {featuredArticle.author}
                                </span>
                                <span>•</span>
                                <span>{featuredArticle.date}</span>
                              </div>

                              <h2 
                                onClick={() => handleArticleClick(featuredArticle)}
                                className="text-xl md:text-3xl font-black text-red-700 hover:text-red-900 tracking-tight leading-snug transition-colors cursor-pointer mb-2.5 line-clamp-3"
                              >
                                {featuredArticle.title}
                              </h2>

                              <p className="text-base sm:text-lg md:text-xl font-normal text-neutral-800 leading-relaxed font-sans line-clamp-3 md:line-clamp-4 mb-4">
                                {featuredArticle.subtitle}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-neutral-100 pt-3 mt-auto">
                              <button
                                onClick={() => handleArticleClick(featuredArticle)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:from-orange-700 hover:to-amber-700 transition-all cursor-pointer"
                              >
                                <span>पूरी खबर पढ़ें</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Section title */}
                    <div className="flex items-center justify-between border-b pb-3 border-neutral-200 pt-2">
                      <h3 className="text-base sm:text-xl font-black uppercase tracking-wide flex items-center gap-2 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white px-4 py-2 rounded-xl shadow-md border border-orange-400/40">
                        <Layers className="w-5 h-5 text-yellow-300 animate-pulse" />
                        <span>
                          {selectedSubcategory
                            ? `विशेष कवरेज : ${SUBCATEGORIES.find(s => s.key === selectedSubcategory)?.hindiName || selectedSubcategory}`
                            : selectedCategory === "all" 
                              ? (searchQuery ? `खोज परिणाम: ${searchQuery}` : "🔥 ट्रेंडिंग और मुख्य समाचार (TOP 20 TRENDING NEWS)") 
                              : `ताज़ा बुलेटिन : ${CATEGORIES.find(c => c.key === selectedCategory)?.hindiName || selectedCategory}`}
                        </span>
                      </h3>
                    </div>

                    {/* Simple Grid display for regular items */}
                    <div className={isCompactView ? "space-y-2 animate-fade-in" : "grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in"}>
                      {selectedCategory !== "all" || searchQuery ? (
                        // If searching or in specific category tab, show normal list
                        articles.length > 0 ? (
                          articles.map((article) => (
                            <ArticleCard 
                              key={article.id} 
                              article={article} 
                              isCompact={isCompactView}
                              isBookmarked={savedArticleIds.includes(article.id)}
                              onToggleBookmark={toggleBookmark}
                              onClick={() => handleArticleClick(article)} 
                            />
                          ))
                        ) : (
                          <div className="col-span-1 sm:col-span-2 text-center py-16 px-4 bg-white border border-neutral-200 rounded-2xl flex flex-col items-center justify-center">
                            <span className="text-3xl mb-1">📰</span>
                            <h4 className="text-sm font-bold text-neutral-800 mt-2">इस श्रेणी/राज्य में अभी कोई खबर उपलब्ध नहीं है</h4>
                            <p className="text-xs text-neutral-400 mt-1 font-sans">कृपया बाद में पुनः प्रयास करें या अन्य श्रेणियां देखें।</p>
                          </div>
                        )
                      ) : (
                        // If Home page, show the 20 trending news list
                        homeTrendingNews.length > 0 ? (
                          homeTrendingNews.map((article) => (
                            <ArticleCard 
                              key={article.id} 
                              article={article} 
                              isCompact={isCompactView}
                              isBookmarked={savedArticleIds.includes(article.id)}
                              onToggleBookmark={toggleBookmark}
                              onClick={() => handleArticleClick(article)} 
                            />
                          ))
                        ) : (
                          <div className="col-span-1 sm:col-span-2 text-center py-16 px-4 bg-white border border-neutral-200 rounded-2xl flex flex-col items-center justify-center">
                            <span className="text-3xl mb-1">📰</span>
                            <h4 className="text-sm font-bold text-neutral-800 mt-2">कोई खबर उपलब्ध नहीं है</h4>
                            <p className="text-xs text-neutral-400 mt-1 font-sans">कृपया एडमिन पैनल में जाकर खबरें लोड करें।</p>
                          </div>
                        )
                      )}
                    </div>

                    {/* Google AdSense Responsive Display Banner (Between feed blocks) */}
                    {selectedCategory === "all" && !searchQuery && (
                      <div className="border border-dashed border-amber-500/30 rounded-2xl p-3.5 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-3 select-none my-6 hover:bg-amber-500/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-500/15 p-2 rounded-xl text-amber-600 shrink-0">
                            <Layers className="w-5 h-5 text-amber-600 animate-pulse" />
                          </div>
                          <div>
                            <div className="font-extrabold text-[11px] sm:text-xs text-amber-700 tracking-wider font-sans uppercase flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                              GOOGLE ADSENSE SPONSORED AD (विज्ञापन स्थान)
                            </div>
                            <p className="text-[10px] text-neutral-500 font-medium font-sans mt-0.5">
                              गूगल एडसेंस ऑटो-रिस्पॉन्सिव विज्ञापन
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-md border border-amber-500/30 text-amber-700 font-bold text-[10px] tracking-widest uppercase font-sans shrink-0 bg-white shadow-2xs">
                          SPONSORED AD
                        </div>
                      </div>
                    )}

                    {/* CATEGORIES SECTION (2 NEWS EACH) - Rendered only on main Home tab and when not searching */}
                    {selectedCategory === "all" && !searchQuery && categorySections.map((catSection, sectionIdx) => {
                      const getCategoryAccent = (key: string) => {
                        switch (key) {
                          case "national": return { border: "border-red-600", text: "text-red-700", badge: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs" };
                          case "state": return { border: "border-amber-500", text: "text-amber-700", badge: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs" };
                          case "sports": return { border: "border-emerald-600", text: "text-emerald-700", badge: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs" };
                          case "entertainment": return { border: "border-purple-600", text: "text-purple-700", badge: "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs" };
                          case "business": return { border: "border-blue-600", text: "text-blue-700", badge: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs" };
                          case "tech": return { border: "border-cyan-600", text: "text-cyan-700", badge: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs" };
                          case "lifestyle": return { border: "border-pink-500", text: "text-pink-700", badge: "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs" };
                          case "international": return { border: "border-violet-600", text: "text-violet-700", badge: "bg-gradient-to-r from-violet-600 to-purple-800 text-white shadow-xs" };
                          default: return { border: "border-orange-500", text: "text-orange-700", badge: "bg-orange-600 text-white shadow-xs" };
                        }
                      };

                      const accent = getCategoryAccent(catSection.key);

                      return (
                        <div key={catSection.key} className="space-y-4 pt-4 border-t border-neutral-200/80 last:border-0 last:pt-0">
                          {/* Category Heading bar with vibrant badge */}
                          <div className={`flex items-center justify-between border-b-2 pb-2 ${accent.border}`}>
                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${accent.badge}`}>
                                {catSection.hindiName}
                              </span>
                            </h4>
                            <span 
                              className={`text-xs font-bold font-sans ${accent.text} hover:underline cursor-pointer flex items-center gap-1`}
                              onClick={() => handleCategorySelect(catSection.key as any)}
                            >
                              <span>सभी ख़बरें देखें</span>
                              <span>»</span>
                            </span>
                          </div>

                          {/* Grid of Category articles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {catSection.articles.map((article) => (
                              <ArticleCard 
                                key={article.id} 
                                article={article} 
                                onClick={() => handleArticleClick(article)} 
                              />
                            ))}
                          </div>

                          {/* Dynamic mini banner place after every 2-3 categories */}
                          {sectionIdx !== 0 && sectionIdx % 2 === 0 && (
                            <div className="border border-dashed border-neutral-300 rounded-xl p-3 bg-neutral-50/80 text-center select-none py-3 my-2 flex items-center justify-center gap-2">
                              <span className="text-[11px] font-bold text-neutral-500 font-sans tracking-wide">
                                📢 प्रायोजित विज्ञापन (Google AdSense Responsive Unit)
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* SECONDARY SIDEBAR BLOCK: Weather ticker, Stock Market, Special blocks & Poll on right (MAIN PAGE ONLY) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* All secondary sidebar blocks render ONLY on main Home tab */}
                {selectedCategory === "all" && (
                  <>
                    {/* 1. Live Sensex & Nifty Stock Market Tracker Card */}
                    <div className="bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 text-white rounded-2xl p-4 shadow-xl border border-emerald-500/30 space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 border border-emerald-500/30">
                            <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black uppercase text-emerald-400 tracking-wider font-sans">
                              📈 शेयर बाज़ार लाइव अपडेट (MARKET)
                            </h3>
                            <p className="text-[10px] text-neutral-400 font-sans">
                              बीएससी सेंसेक्स एवं एनएसई निफ्टी 50 • अपडेट: {marketData?.lastUpdated || "LIVE"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full font-sans uppercase animate-pulse tracking-wider">
                          LIVE BAZAR
                        </span>
                      </div>

                      {/* Stock Cards Grid */}
                      <div className="grid grid-cols-2 gap-2.5 font-sans pt-1">
                        {/* Sensex */}
                        <div className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 transition-colors">
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">BSE SENSEX</div>
                          <div className="text-sm font-black text-white font-mono mt-0.5">
                            {marketData?.sensex ? marketData.sensex.price.toLocaleString('en-IN') : '77,928.15'}
                          </div>
                          <div className={`text-[10px] font-black flex items-center gap-0.5 mt-0.5 ${
                            (marketData?.sensex?.isUp ?? true) ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(marketData?.sensex?.isUp ?? true) ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{marketData?.sensex ? `${marketData.sensex.change > 0 ? '+' : ''}${marketData.sensex.change} (${marketData.sensex.changePct > 0 ? '+' : ''}${marketData.sensex.changePct}%)` : '+273.55 (+0.35%)'}</span>
                          </div>
                        </div>

                        {/* Nifty 50 */}
                        <div className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 transition-colors">
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">NSE NIFTY 50</div>
                          <div className="text-sm font-black text-white font-mono mt-0.5">
                            {marketData?.nifty ? marketData.nifty.price.toLocaleString('en-IN') : '24,317.15'}
                          </div>
                          <div className={`text-[10px] font-black flex items-center gap-0.5 mt-0.5 ${
                            (marketData?.nifty?.isUp ?? true) ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(marketData?.nifty?.isUp ?? true) ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{marketData?.nifty ? `${marketData.nifty.change > 0 ? '+' : ''}${marketData.nifty.change} (${marketData.nifty.changePct > 0 ? '+' : ''}${marketData.nifty.changePct}%)` : '+66.95 (+0.28%)'}</span>
                          </div>
                        </div>

                        {/* Bank Nifty */}
                        <div className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 transition-colors">
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">NIFTY BANK</div>
                          <div className="text-sm font-black text-white font-mono mt-0.5">
                            {marketData?.banknifty ? marketData.banknifty.price.toLocaleString('en-IN') : '57,147.50'}
                          </div>
                          <div className={`text-[10px] font-black flex items-center gap-0.5 mt-0.5 ${
                            (marketData?.banknifty?.isUp ?? false) ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(marketData?.banknifty?.isUp ?? false) ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{marketData?.banknifty ? `${marketData.banknifty.change > 0 ? '+' : ''}${marketData.banknifty.change} (${marketData.banknifty.changePct > 0 ? '+' : ''}${marketData.banknifty.changePct}%)` : '-58.40 (-0.10%)'}</span>
                          </div>
                        </div>

                        {/* Gold */}
                        <div className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 transition-colors">
                          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">सोना 24K (10g)</div>
                          <div className="text-sm font-black text-white font-mono mt-0.5">
                            ₹{marketData?.gold ? marketData.gold.price.toLocaleString('en-IN') : '74,850'}
                          </div>
                          <div className={`text-[10px] font-black flex items-center gap-0.5 mt-0.5 ${
                            (marketData?.gold?.isUp ?? true) ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(marketData?.gold?.isUp ?? true) ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{marketData?.gold ? `${marketData.gold.change > 0 ? '+' : ''}${marketData.gold.change} (${marketData.gold.changePct > 0 ? '+' : ''}${marketData.gold.changePct}%)` : '+250 (+0.33%)'}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleCategorySelect('business')}
                        className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-black uppercase font-sans tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>बिज़नेस और शेयर बाजार की खबरें देखें</span>
                        <span>➔</span>
                      </button>
                    </div>

                    {/* 2. Live State Weather Marquee Ticker Card */}
                    <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-neutral-900 text-white rounded-2xl p-3.5 shadow-lg border border-amber-500/30 relative overflow-hidden group">
                      <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/10 px-0.5">
                        <div className="flex items-center gap-2">
                          <div className="relative w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                          </div>
                          <span className="text-xs font-black uppercase text-amber-400 tracking-wide font-sans">
                            राज्यवार लाइव मौसम बुलेटिन
                          </span>
                        </div>
                        <span className="text-[9px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full font-sans uppercase animate-pulse tracking-wider">
                          LIVE TICKER
                        </span>
                      </div>

                      {/* Infinite Marquee Ticker */}
                      <div className="overflow-hidden relative w-full bg-black/40 rounded-xl py-2.5 border border-white/10">
                        <div className="animate-marquee flex items-center gap-3">
                          {(() => {
                            const weatherList = Object.keys(sidebarWeather).length > 0 
                              ? Object.entries(sidebarWeather).map(([city, info]) => {
                                  const w = info as { temp: number; text: string; icon: string };
                                  return { city, temp: w.temp, text: w.text, icon: w.icon };
                                })
                              : [
                                  { city: "दिल्ली", temp: 32, text: "साफ मौसम", icon: "Sun" },
                                  { city: "मुंबई", temp: 30, text: "उमस भरा", icon: "Cloud" },
                                  { city: "जयपुर", temp: 33, text: "तेज धूप", icon: "Sun" },
                                  { city: "लखनऊ", temp: 31, text: "हल्की धूप", icon: "Sun" },
                                  { city: "पटना", temp: 31, text: "सामान्य मौसम", icon: "CloudSun" },
                                  { city: "भोपाल", temp: 29, text: "बादल छाए", icon: "CloudSun" },
                                  { city: "रांची", temp: 27, text: "सुहावना", icon: "Cloud" }
                                ];
                            
                            // Repeat list for seamless ticker loop
                            const doubledList = [...weatherList, ...weatherList, ...weatherList];

                            return doubledList.map((item, idx) => (
                              <div 
                                key={`${item.city}-${idx}`}
                                onClick={() => handleStateSelect(item.city)}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-white/15 shrink-0 cursor-pointer transition-colors shadow-xs"
                              >
                                <span className="text-xs font-black text-amber-300">{item.city}:</span>
                                <span className="text-xs font-black text-white font-sans">{item.temp}°C</span>
                                <span className="text-[10px] text-neutral-300 font-sans font-medium bg-black/40 px-1.5 py-0.2 rounded border border-white/5">
                                  {item.text}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 3. THREE VIBRANT & COLORFUL VERTICAL CATEGORIES: Sarkari Naukri, Jyotish/Rashifal, Sarkari Yojna */}
                    
                    {/* CATEGORY 1: सरकारी नौकरी एवं करियर */}
                    <div className="bg-gradient-to-b from-blue-50/50 via-indigo-50/30 to-white border-2 border-blue-200/90 rounded-2xl overflow-hidden shadow-md">
                      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white p-3.5 flex items-center justify-between shadow-sm">
                        <h3 
                          onClick={() => handleCategorySelect('job')}
                          className="text-sm sm:text-base font-black flex items-center gap-2 tracking-wide cursor-pointer hover:text-cyan-200 transition-colors"
                        >
                          <Briefcase className="w-5 h-5 text-cyan-300" />
                          <span>💼 सरकारी नौकरी (SARKARI NAUKRI)</span>
                        </h3>
                        <button
                          onClick={() => handleCategorySelect('job')}
                          className="text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg border border-white/30 transition-all cursor-pointer font-sans"
                        >
                          सभी देखें ➔
                        </button>
                      </div>

                      <div className="p-3 space-y-2.5">
                        {(() => {
                          const jobArts = articles.filter(a => a.category === "job" || a.category === "jobs");
                          if (jobArts.length === 0) {
                            return (
                              <div className="p-4 text-center text-xs text-neutral-500 font-medium font-sans">
                                इस श्रेणी में फिलहाल कोई समाचार उपलब्ध नहीं है।
                              </div>
                            );
                          }
                          return jobArts.slice(0, 4).map((art) => (
                            <div 
                              key={art.id}
                              onClick={() => handleArticleClick(art)}
                              className="bg-white border border-blue-150 hover:border-blue-400 rounded-xl p-3 cursor-pointer group hover:bg-blue-50/60 shadow-2xs transition-all duration-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs bg-blue-600 text-white font-sans">
                                  {art.tags?.[0] || 'सरकारी नौकरी'}
                                </span>
                                <span className="text-[9px] font-extrabold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded font-sans">
                                  📅 {art.date}
                                </span>
                              </div>
                              <h4 className="text-sm font-black leading-snug text-blue-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                                {art.title}
                              </h4>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* CATEGORY 2: दैनिक राशिफल एवं ज्योतिष */}
                    <div className="bg-gradient-to-b from-purple-50/50 via-fuchsia-50/30 to-white border-2 border-purple-200/90 rounded-2xl overflow-hidden shadow-md">
                      <div className="bg-gradient-to-r from-purple-800 via-fuchsia-800 to-pink-700 text-white p-3.5 flex items-center justify-between shadow-sm">
                        <h3 
                          onClick={() => handleCategorySelect('astrology')}
                          className="text-sm sm:text-base font-black flex items-center gap-2 tracking-wide cursor-pointer hover:text-pink-200 transition-colors"
                        >
                          <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
                          <span>🔮 दैनिक राशिफल व ज्योतिष (ASTROLOGY)</span>
                        </h3>
                        <button
                          onClick={() => handleCategorySelect('astrology')}
                          className="text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg border border-white/30 transition-all cursor-pointer font-sans"
                        >
                          सभी देखें ➔
                        </button>
                      </div>

                      <div className="p-3 space-y-2.5">
                        {(() => {
                          const astroArts = articles.filter(a => a.category === "astrology" || a.category === "astro");
                          if (astroArts.length === 0) {
                            return (
                              <div className="p-4 text-center text-xs text-neutral-500 font-medium font-sans">
                                इस श्रेणी में फिलहाल कोई समाचार उपलब्ध नहीं है।
                              </div>
                            );
                          }
                          return astroArts.slice(0, 4).map((art) => (
                            <div 
                              key={art.id}
                              onClick={() => handleArticleClick(art)}
                              className="bg-white border border-purple-150 hover:border-purple-400 rounded-xl p-3 cursor-pointer group hover:bg-purple-50/60 shadow-2xs transition-all duration-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs bg-purple-600 text-white font-sans">
                                  {art.tags?.[0] || 'ज्योतिष'}
                                </span>
                                <span className="text-[9px] font-extrabold text-purple-700 bg-purple-100/80 px-1.5 py-0.2 rounded font-sans">
                                  ✨ {art.date}
                                </span>
                              </div>
                              <h4 className="text-sm font-black leading-snug text-purple-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                                {art.title}
                              </h4>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* CATEGORY 3: सरकारी योजनाएँ एवं जन कल्याण */}
                    <div className="bg-gradient-to-b from-emerald-50/50 via-teal-50/30 to-white border-2 border-emerald-200/90 rounded-2xl overflow-hidden shadow-md">
                      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-600 text-white p-3.5 flex items-center justify-between shadow-sm">
                        <h3 
                          onClick={() => handleCategorySelect('schemes')}
                          className="text-sm sm:text-base font-black flex items-center gap-2 tracking-wide cursor-pointer hover:text-yellow-200 transition-colors"
                        >
                          <Landmark className="w-5 h-5 text-yellow-300" />
                          <span>📜 सरकारी योजनाएँ (GOVT SCHEMES)</span>
                        </h3>
                        <button
                          onClick={() => handleCategorySelect('schemes')}
                          className="text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg border border-white/30 transition-all cursor-pointer font-sans"
                        >
                          सभी देखें ➔
                        </button>
                      </div>

                      <div className="p-3 space-y-2.5">
                        {(() => {
                          const schemeArts = articles.filter(a => a.category === "schemes" || a.category === "scheme" || a.category === "yojna");
                          if (schemeArts.length === 0) {
                            return (
                              <div className="p-4 text-center text-xs text-neutral-500 font-medium font-sans">
                                इस श्रेणी में फिलहाल कोई समाचार उपलब्ध नहीं है।
                              </div>
                            );
                          }
                          return schemeArts.slice(0, 4).map((art) => (
                            <div 
                              key={art.id}
                              onClick={() => handleArticleClick(art)}
                              className="bg-white border border-emerald-150 hover:border-emerald-400 rounded-xl p-3 cursor-pointer group hover:bg-emerald-50/60 shadow-2xs transition-all duration-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs bg-emerald-600 text-white font-sans">
                                  {art.tags?.[0] || 'सरकारी योजना'}
                                </span>
                                <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded font-sans">
                                  📜 {art.date}
                                </span>
                              </div>
                              <h4 className="text-sm font-black leading-snug text-emerald-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                                {art.title}
                              </h4>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* 4. Interactive OPINION POLL CARD (Vibrant Rang-Biranga Design) */}
                    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-5 shadow-xl text-white border border-purple-500/30 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      
                      <div className="flex items-center gap-2 border-b pb-3 border-purple-500/30">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-2 rounded-xl text-slate-950 font-black shadow-md animate-bounce">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300">
                            📊 जनमत सर्वेक्षण (OPINION POLL-2026)
                          </h3>
                          <p className="text-[10px] text-purple-200 font-sans">अपनी राय ज़रूर व्यक्त करें</p>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-white leading-relaxed font-sans mt-1 bg-white/10 p-3 rounded-xl border border-white/15 shadow-inner">
                        प्रश्न: क्या आपको लगता है कि वंदे भारत स्लीपर और अन्य नई एक्सप्रेस ट्रेनों से आम जनता का भारतीय रेलवे में सफर सुगम और बेहतर बनेगा?
                      </p>

                      {!hasVoted ? (
                        <div className="space-y-2 pt-1 font-sans">
                          {[
                            { key: "A", text: "हाँ, यह स्वदेशी रेलवे विकास का बेहतरीन उदाहरण है", color: "from-emerald-500 to-teal-600" },
                            { key: "B", text: "नहीं, किराए और साधारण/स्लीपर डिब्बों की संख्या सुधारनी होगी", color: "from-rose-500 to-red-600" },
                            { key: "C", text: "कह नहीं सकते / समीक्षा आवश्यक है", color: "from-amber-500 to-orange-600" }
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setSelectedOption(opt.key)}
                              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2.5 ${
                                selectedOption === opt.key
                                  ? "border-amber-400 bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-200 shadow-md scale-101 ring-1 ring-amber-400"
                                  : "border-purple-400/30 bg-white/5 hover:bg-white/15 text-purple-100"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-lg font-black flex items-center justify-center text-[10px] shrink-0 text-white bg-gradient-to-br ${opt.color} shadow-xs`}>
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                            </button>
                          ))}

                          <button
                            disabled={!selectedOption}
                            onClick={() => selectedOption && handleVoteSubmit(selectedOption)}
                            className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg select-none mt-2 cursor-pointer ${
                              selectedOption
                                ? "bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 hover:brightness-110 shadow-amber-500/20"
                                : "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed"
                            }`}
                          >
                            अपना वोट दर्ज करें (Cast Vote)
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1 font-sans animate-fade-in">
                          {[
                            { key: "A", text: "हाँ, यह विकास का मील का पत्थर है", basePct: 62, barColor: "from-emerald-400 to-teal-500" },
                            { key: "B", text: "नहीं, किराए और डिब्बों पर ध्यान देना होगा", basePct: 29, barColor: "from-rose-400 to-red-500" },
                            { key: "C", text: "कह नहीं सकते / अन्य विचार", basePct: 9, barColor: "from-amber-400 to-orange-500" }
                          ].map((opt) => {
                            const total = (Object.values(pollVotes) as number[]).reduce((a, b) => a + b, 0);
                            const votes = (pollVotes[opt.key] as number) || 0;
                            const pct = Math.round((votes / (total || 1)) * 100);
                            const isUserChoice = selectedOption === opt.key;

                            return (
                              <div key={opt.key} className="space-y-1 bg-white/5 p-2 rounded-lg border border-white/10">
                                <div className="flex justify-between items-center text-xs">
                                  <span className={`font-semibold ${isUserChoice ? "text-amber-300 font-black" : "text-purple-100"}`}>
                                    {opt.text} {isUserChoice && <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black ml-1">आपका जवाब</span>}
                                  </span>
                                  <span className="font-extrabold text-amber-300 font-mono">{pct}%</span>
                                </div>
                                <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden relative border border-white/10">
                                  <div
                                    style={{ width: `${pct}%` }}
                                    className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${opt.barColor}`}
                                  ></div>
                                </div>
                                <div className="text-[9px] text-purple-300 flex justify-between">
                                  <span>कुल वोट: {votes.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })}

                          <div className="bg-emerald-500/20 rounded-xl p-2.5 border border-emerald-400/40 flex items-center gap-1.5 text-xs text-emerald-300 font-bold justify-center">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>वोटिंग के लिए धन्यवाद! सर्वे लाइव है।</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. Sidebar Google AdSense Block Placeholders */}
                    <div className="border border-dashed border-amber-500/30 rounded-2xl p-4 bg-amber-500/[0.02] text-center select-none space-y-2">
                      <div className="text-[10px] font-extrabold text-amber-600 tracking-wider">
                        ⚡ GOOGLE ADSENSE SIDEBAR BANNER (300x250)
                      </div>
                      <div className="bg-neutral-50 border border-neutral-150 h-40 rounded flex items-center justify-center text-neutral-400 text-xs font-sans">
                        विज्ञापन यहाँ प्रसारित होगा
                      </div>
                      <p className="text-[9px] text-neutral-400 font-sans leading-relaxed">
                        Theme is optimized for maximum ad revenue CTR
                      </p>
                    </div>
                  </>
                )}

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 5. Elegant footer layout */}
      <footer className="bg-neutral-900 text-neutral-400 border-t-4 border-neutral-950 py-10 mt-12 font-sans">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          <div>
            <div className="flex items-center gap-1.5 text-white font-extrabold text-sm mb-3">
              <span className="w-2.5 h-4.5 bg-[#ff6f00] rounded-xs inline-block"></span>
              <span>सारादेश.in समाचार समूह</span>
            </div>
            <p className="leading-relaxed text-neutral-400 mb-4">
              भारत का प्रसिद्ध डिजिटल समाचार प्रदाता। हम बिना किसी पक्षपात के सच्ची, निष्पक्ष और जन-सरोकारीय खबरें आप तक पहुँचाने के लिए प्रतिबद्ध हैं।
            </p>

            <div className="text-white font-bold text-xs mb-2.5 uppercase tracking-wider">मुख्य विषय श्रेणियां (Categories)</div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {[
                { id: "all", label: "सभी समाचार" },
                { id: "national", label: "देश" },
                { id: "state", label: "राज्य" },
                { id: "crime", label: "क्राइम / अपराध" },
                { id: "entertainment", label: "मनोरंजन" },
                { id: "sports", label: "खेल" },
                { id: "business", label: "बिजनेस" },
                { id: "tech", label: "टेक" },
                { id: "lifestyle", label: "लाइफस्टाइल" },
                { id: "international", label: "विदेश" },
                { id: "astrology", label: "ज्योतिष" },
                { id: "jobs", label: "सरकारी नौकरी" },
                { id: "schemes", label: "सरकारी योजनाएँ" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedSubcategory(null);
                    setSelectedCategory(cat.id as CategoryKey);
                    setSelectedArticleId(null);
                    setSearchQuery("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`px-2 py-1 rounded transition-all cursor-pointer text-[10px] font-medium ${
                    selectedCategory === cat.id && !selectedSubcategory
                      ? "bg-[#ff6f00] text-white font-bold"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-amber-400 font-bold text-xs mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>विशेष सब-कैटेगरी (Special Sub-Categories)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={() => {
                  setSelectedSubcategory(null);
                  setSelectedArticleId(null);
                  setSearchQuery("");
                  try {
                    window.history.pushState({}, "", selectedCategory === "all" ? "/" : "?category=" + encodeURIComponent(selectedCategory));
                  } catch {}
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 rounded transition-all cursor-pointer text-[10px] font-medium ${
                  !selectedSubcategory
                    ? "bg-[#ff6f00] text-white font-bold"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                }`}
              >
                सभी सब-कैटेगरी
              </button>
              {SUBCATEGORIES.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => {
                    setSelectedSubcategory(sub.key);
                    setSelectedArticleId(null);
                    setSearchQuery("");
                    try {
                      window.history.pushState({}, "", "?subcategory=" + encodeURIComponent(sub.key));
                    } catch {}
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`px-2 py-1 rounded transition-all cursor-pointer text-[10px] font-medium ${
                    selectedSubcategory === sub.key
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-xs"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  }`}
                >
                  {sub.hindiName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white font-bold text-xs mb-3 uppercase tracking-wider">सभी 15 राज्य समाचार (State News)</div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {STATES.filter((st) => st !== "सभी राज्य").map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setSelectedCategory("state");
                    setSelectedState(st);
                    setSelectedArticleId(null);
                    setSearchQuery("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`px-2 py-1 rounded transition-all cursor-pointer text-[10px] font-medium ${
                    selectedCategory === "state" && selectedState === st
                      ? "bg-[#ff6f00] text-white font-bold"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white font-bold text-xs mb-3 uppercase tracking-wider">संपादकीय एवं नीतिगत जानकारी (Policies & About)</div>
            <div className="flex flex-wrap gap-2 text-xs mb-4">
              {[
                { id: "about-us", label: "हमारे बारे में" },
                { id: "editorial-team", label: "संपादकीय टीम" },
                { id: "editorial-policy", label: "संपादकीय नीति" },
                { id: "fact-check-policy", label: "फैक्ट चेक नीति" },
                { id: "corrections-policy", label: "सुधार नीति" },
                { id: "privacy-policy", label: "गोपनीयता नीति" },
                { id: "terms-and-conditions", label: "नियम एवं शर्तें" },
                { id: "disclaimer", label: "अस्वीकरण" },
                { id: "publisher-info", label: "प्रकाशक जानकारी" },
                { id: "contact-us", label: "संपर्क करें" }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedArticleId(null);
                    setSelectedAuthor(null);
                    setSelectedPolicyPage(p.id as any);
                    try {
                      window.history.pushState({}, "", "?page=" + p.id);
                    } catch {}
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700/80 text-[11px] font-medium transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] text-neutral-400 mb-4 pt-2 border-t border-neutral-800">
              <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 underline">📡 RSS 2.0 Feed</a>
              <span>•</span>
              <a href="/news-sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 underline">📰 Google News Sitemap</a>
              <span>•</span>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 underline">🗺️ XML Sitemap</a>
              <span>•</span>
              <a href="/ads.txt" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 underline">📄 Ads.txt</a>
            </div>

            <div className="text-white font-bold text-xs mb-2 uppercase tracking-wider">अस्वीकरण एवं प्रशासनिक एक्सेस</div>
            <p className="leading-relaxed text-neutral-400 text-xs">
              © 2026 सारादेश.in समाचार प्रा. लि. सर्वाधिकार सुरक्षित। प्रेस काउंसिल ऑफ इंडिया (PCI) गाइडलाइंस अनुपालित।
            </p>
            <button 
              onClick={() => {
                setIsAdminMode((prev) => !prev);
                setSelectedArticleId(null);
                setSelectedAuthor(null);
                setSelectedPolicyPage(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title="एडमिन पैनल खोलने के लिए क्लिक करें"
              className="mt-3 px-3.5 py-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-white border border-amber-500/50 hover:border-amber-400 rounded-xl text-xs font-black inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Shield className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{isAdminMode ? "यूजर पोर्टल पर लौटें" : "🔐 एडमिन पैनल (Admin Login)"}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Saved Articles Drawer Modal */}
      <SavedArticlesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedArticles={articles.filter(a => savedArticleIds.includes(a.id))}
        onArticleClick={(art) => {
          setSelectedArticleId(art.id);
          setIsSavedModalOpen(false);
          setIsAdminMode(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onRemoveBookmark={removeBookmark}
        onClearAll={clearAllBookmarks}
      />

      {/* Mobile Floating Bottom Bar */}
      <MobileBottomNav
        savedCount={savedArticleIds.length}
        onHomeClick={() => {
          setIsAdminMode(false);
          setSelectedArticleId(null);
          setSelectedCategory("all");
          setSearchQuery("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onAudioClick={() => {
          setSelectedCategory("all");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onBookmarkClick={() => setIsSavedModalOpen(true)}
      />

    </div>
  );
}
