import React, { useState, useEffect } from "react";
import { Newspaper, Flame, Heart, MessageSquare, Eye, ArrowRight, CornerDownRight, RefreshCw, Layers, Check, ThumbsUp, MapPin, Sun, Award, HelpCircle, Cloud, CloudRain, CloudSun, Grid, ListFilter, Bookmark, Radio, Briefcase, GraduationCap, Sparkles, Landmark, Compass, ChevronRight, Shield } from "lucide-react";
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
import { Article, CategoryKey, CATEGORIES, STATES } from "./types";

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  
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
      localStorage.setItem("sara_saved_news", JSON.stringify(updated));
      return updated;
    });
  };

  const removeBookmark = (articleId: string) => {
    setSavedArticleIds((prev) => {
      const updated = prev.filter((id) => id !== articleId);
      localStorage.setItem("sara_saved_news", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllBookmarks = () => {
    setSavedArticleIds([]);
    localStorage.removeItem("sara_saved_news");
  };

  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [selectedState, setSelectedState] = useState<string>("सभी राज्य");
  const [searchQuery, setSearchQuery] = useState<string>("");


  // Local opinion poll states
  const [hasVoted, setHasVoted] = useState<boolean>(() => {
    return localStorage.getItem("sara_poll_voted") === "true";
  });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("sara_poll_votes");
    if (saved) return JSON.parse(saved);
    return { A: 1482, B: 615, C: 198 }; 
  });

  const handleVoteSubmit = (option: string) => {
    const newVotes = {
      ...pollVotes,
      [option]: (pollVotes[option] || 0) + 1
    };
    setPollVotes(newVotes);
    setHasVoted(true);
    localStorage.setItem("sara_poll_voted", "true");
    localStorage.setItem("sara_poll_votes", JSON.stringify(newVotes));
  };

  // Sidebar weather data
  const [sidebarWeather, setSidebarWeather] = useState<Record<string, { temp: number; text: string; icon: string }>>({});

  useEffect(() => {
    const getSidebarWeather = () => {
      fetch("/api/weather")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => setSidebarWeather(data))
        .catch(() => {
          // Fallback of cities
          setSidebarWeather({
            "दिल्ली": { temp: 42, text: "भीषण गर्मी (लू)", icon: "Sun" },
            "मुंबई": { temp: 33, text: "उमस भरा मौसम", icon: "Cloud" },
            "जयपुर": { temp: 44, text: "सूरज तप रहा है", icon: "Sun" },
            "भोपाल": { temp: 39, text: "आंशिक रूप से बादल", icon: "CloudSun" },
            "लखनऊ": { temp: 41, text: "गर्म हवाएं", icon: "Sun" },
            "पटना": { temp: 40, text: "तेज धूप", icon: "Sun" },
            "रांची": { temp: 36, text: "मौसम सुहावना", icon: "Cloud" }
          });
        });
    };
    getSidebarWeather();
    // Poll every 20 seconds for dynamic weather changes on homepage as requested
    const interval = setInterval(getSidebarWeather, 20000);
    return () => clearInterval(interval);
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
    // 1. Check URL parameters for ?admin=true
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      setIsAdminMode(true);
    }

    // 2. Keyboard shortcut: Alt + Shift + A to toggle admin mode secretly
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setIsAdminMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    loadNews();
  }, [selectedCategory, selectedState, searchQuery, isAdminMode]);

  const loadNews = () => {
    setLoading(true);
    let url = `/api/news?category=${selectedCategory}`;
    if (selectedCategory === "state" && selectedState) {
      url += `&state=${encodeURIComponent(selectedState)}`;
    }
    if (searchQuery.trim()) {
      url += `&search=${encodeURIComponent(searchQuery.trim())}`;
    }

    fetch(url)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Unable to retrieve news articles");
      })
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (key: CategoryKey) => {
    setSelectedCategory(key);
    setSelectedArticleId(null); // return to lists
  };

  const handleStateSelect = (state: string) => {
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
          onSelectCategory={handleCategorySelect}
          selectedState={selectedState}
          onSelectState={handleStateSelect}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setSelectedArticleId(null);
          }}
        />
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
                onBack={() => setSelectedArticleId(null)}
                isBookmarked={savedArticleIds.includes(selectedArticleId)}
                onToggleBookmark={(e, art) => toggleBookmark(e, art)}
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

                              <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 font-sans">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>{featuredArticle.views || 0}</span>
                                </span>
                              </div>
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
                          {selectedCategory === "all" 
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

              {/* SECONDARY SIDEBAR BLOCK: Weather ticker and Trending list on right */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 1. Live State Weather Marquee Ticker Card */}
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
                              { city: "दिल्ली", temp: 42, text: "भीषण गर्मी (लू)", icon: "Sun" },
                              { city: "मुंबई", temp: 33, text: "उमस भरा", icon: "Cloud" },
                              { city: "जयपुर", temp: 44, text: "सूरज तप रहा", icon: "Sun" },
                              { city: "लखनऊ", temp: 41, text: "गर्म हवाएं", icon: "Sun" },
                              { city: "पटना", temp: 40, text: "तेज धूप", icon: "Sun" },
                              { city: "भोपाल", temp: 39, text: "बादल छाए", icon: "CloudSun" },
                              { city: "रांची", temp: 36, text: "सुहावना", icon: "Cloud" }
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

                {/* 2. THREE VIBRANT & COLORFUL VERTICAL CATEGORIES: Sarkari Naukri, Jyotish/Rashifal, Sarkari Yojna */}
                
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
                    {[
                      {
                        id: "news-job-1",
                        tag: "SSC CGL 2026",
                        title: "SSC CGL 2026: 15,000+ पदों पर बंपर भर्ती जारी, नोटिफिकेशन व ऑनलाइन फॉर्म जमा करें",
                        date: "28 जुलाई",
                        color: "bg-blue-600 text-white",
                        titleColor: "text-blue-900 hover:text-blue-700",
                        detail: `कर्मचारी चयन आयोग (SSC) ने देश भर के विभिन्न केंद्रीय मंत्रालयों, विभागों और संगठनों में ग्रुप B और C के पदों पर 15,000 से अधिक रिक्तियों के लिए नोटिफिकेशन जारी कर दिया है। सरकारी नौकरी की तैयारी कर रहे लाखों अभ्यर्थियों के लिए यह वर्ष की सबसे बड़ी भर्ती है।

## शैक्षणिक योग्यता एवं आयु सीमा:
- **शैक्षणिक योग्यता:** मान्यता प्राप्त विश्वविद्यालय से किसी भी विषय में स्नातक (Bachelor's Degree) होना अनिवार्य है।
- **आयु सीमा:** न्यूनतम 18 वर्ष से अधिकतम 30 वर्ष (आरक्षित श्रेणियों को नियमानुसार छूट)।

### चयन प्रक्रिया के 3 मुख्य चरण:
1. **टियर-1 परीक्षा:** कंप्यूटर आधारित (CBT) वस्तुनिष्ठ परीक्षा (स्क्रीनिंग टेस्ट)।
2. **टियर-2 परीक्षा:** गणित, रीजनिंग, अंग्रेजी और सामान्य जागरूकता का गहन परीक्षण।
3. **दस्तावेज़ सत्यापन एवं मेडिकल:** अंतिम चयन सूची टियर-2 के प्राप्तांकों के आधार पर तैयार होगी।

## आवेदन कैसे करें?
1. आधिकारिक वेबसाइट ssc.gov.in पर जाएं।
2. "New Registration" विकल्प पर क्लिक करके वन-टाइम रजिस्ट्रेशन (OTR) पूरा करें।
3. SSC CGL 2026 आवेदन लिंक पर जाकर अपनी शैक्षणिक जानकारी व फोटो-हस्ताक्षर अपलोड करें।
4. आवेदन शुल्क ₹100 जमा करें (महिला / SC / ST के लिए नि:शुल्क)।

### महत्वपूर्ण तिथियां:
- **आवेदन प्रारंभ:** 28 जुलाई 2026
- **अंतिम तिथि:** 30 अगस्त 2026
- **टियर-1 परीक्षा संभावित माह:** अक्टूबर/नवंबर 2026`
                      },
                      {
                        id: "news-job-2",
                        tag: "रेलवे NTPC",
                        title: "रेलवे RRB 2026: आरपीएफ एवं स्टेशन मास्टर के 22,000 पदों पर नई भर्ती प्रक्रिया शुरू",
                        date: "27 जुलाई",
                        color: "bg-cyan-600 text-white",
                        titleColor: "text-indigo-900 hover:text-indigo-700",
                        detail: `रेलवे भर्ती बोर्ड (RRB) ने भारतीय रेलवे के विभिन्न जोनों में गैर-तकनीकी लोकप्रिय श्रेणियों (NTPC), स्टेशन मास्टर, गार्ड एवं RPF आरक्षकों के लिए 22,000 पदों की भर्ती हेतु ऑनलाइन आवेदन आमंत्रित किए हैं।

## मुख्य पात्रता एवं मानदंड:
- **शैक्षणिक योग्यता:** 12वीं पास / स्नातक (विभिन्न पदों के अनुसार अलग-अलग)।
- **आयु सीमा:** 18 से 33 वर्ष (ओबीसी को 3 वर्ष तथा एससी/एसटी को 5 वर्ष की छूट)।

### परीक्षा पैटर्न व विषय:
- **प्रथम चरण (CBT-1):** गणित (30 अंक), सामान्य बुद्धिमत्ता व तर्कशास्त्र (30 अंक), सामान्य ज्ञान (40 अंक)।
- **द्वितीय चरण (CBT-2):** कुल 120 प्रश्न, समय 90 मिनट।
- **शारीरिक दक्षता परीक्षण (RPF हेतु):** दौड़ एवं लंबी कूद।

## महत्वपूर्ण दिशा-निर्देश:
अभ्यर्थी केवल एक ही रेलवे ज़ोन से आवेदन कर सकते हैं। अधिकारिक नोटिफिकेशन देखने एवं फॉर्म भरने के लिए rrbcdg.gov.in पर लॉगिन करें।`
                      },
                      {
                        id: "news-job-3",
                        tag: "यूपी पुलिस",
                        title: "यूपी पुलिस कांस्टेबल एवं SI भर्ती 2026: परीक्षा तिथियां घोषित, एडमिट कार्ड डाउनलोड करें",
                        date: "26 जुलाई",
                        color: "bg-indigo-600 text-white",
                        titleColor: "text-blue-900 hover:text-blue-700",
                        detail: `उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB) ने कांस्टेबल और सब-इंस्पेक्टर भर्ती परीक्षा 2026 की तिथियों का आधिकारिक ऐलान कर दिया है।

## परीक्षा कार्यक्रम एवं केंद्र:
- **परीक्षा तिथियां:** 15 और 16 अगस्त 2026 (दो पालियों में)।
- **परीक्षा केंद्र:** प्रदेश के सभी 75 जिलों में कुल 1,200 परीक्षा केंद्र बनाए गए हैं।

### परीक्षा हॉल हेतु महत्वपूर्ण नियम:
1. ई-एडमिट कार्ड और मूल फोटो पहचान पत्र (आधार कार्ड/ड्राइविंग लाइसेंस) अनिवार्य है।
2. बायोमेट्रिक और फेस रिकग्निशन सत्यापन के बाद ही केंद्र में प्रवेश मिलेगा।
3. नकारात्मक अंकन (Negative Marking): प्रत्येक गलत उत्तर पर 0.50 अंक काटे जाएंगे।

## प्रवेश पत्र कैसे डाउनलोड करें?
uppbpb.gov.in पर जाकर अपना रजिस्ट्रेशन नंबर और जन्म तिथि डालकर एडमिट कार्ड तुरंत प्रिंट कर लें।`
                      },
                      {
                        id: "news-job-4",
                        tag: "शिक्षक भर्ती",
                        title: "CTET 2026 & राज्य प्राथमिक शिक्षक भर्ती: 40,000 पदों पर काउंसलिंग शेड्यूल जारी",
                        date: "25 जुलाई",
                        color: "bg-teal-600 text-white",
                        titleColor: "text-teal-900 hover:text-teal-700",
                        detail: `केंद्रीय माध्यमिक शिक्षा बोर्ड (CBSE) तथा राज्य शिक्षा विभागों द्वारा संयुक्त रूप से आयोजित शिक्षक पात्रता परीक्षा (CTET) उत्तीर्ण अभ्यर्थियों के लिए 40,000 प्राथमिक व उच्च प्राथमिक शिक्षक पदों पर ऑनलाइन काउंसलिंग प्रक्रिया शुरू हो गई है।

## आवश्यक अर्हता एवं दस्तावेज:
- **शैक्षणिक अर्हता:** B.Ed / D.El.Ed / D.Ed एवं CTET पेपर-1 अथवा पेपर-2 उत्तीर्ण अंक पत्र।
- **काउंसलिंग हेतु आवश्यक प्रमाण पत्र:** 10वीं, 12वीं, स्नातक, बीएड अंकपत्र, निवास प्रमाण पत्र, जाति प्रमाण पत्र व चरित्र प्रमाण पत्र।

### कट-ऑफ अंक श्रेणीवार:
- **सामान्य वर्ग:** 60% अंक (90/150)
- **ओबीसी / एससी / एसटी:** 55% अंक (82/150)

चयनित अभ्यर्थियों को प्रथम चरण में जिला आवंटन 10 अगस्त तक कर दिया जाएगा।`
                      }
                    ].map((job, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          const sampleArt: Article = {
                            id: job.id,
                            title: job.title,
                            subtitle: `${job.title} - भर्ती विज्ञापन, पात्रता, आवेदन शुल्क और चयन प्रक्रिया की विस्तृत रिपोर्ट।`,
                            content: job.detail,
                            category: "job",
                            author: "सारादेश करियर डेस्क",
                            date: job.date,
                            readTime: 3,
                            image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
                            views: 1820 + idx * 300,
                            likes: 120 + idx * 25,
                            comments: [],
                            tags: ["Govt Jobs", "SSC", "Sarkari Result", "Recruitment"],
                            isBreaking: idx === 0,
                            isFeatured: true,
                            isTrending: true
                          };
                          handleArticleClick(sampleArt);
                        }}
                        className="bg-white border border-blue-150 hover:border-blue-400 rounded-xl p-3 cursor-pointer group hover:bg-blue-50/60 shadow-2xs transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs ${job.color}`}>
                            {job.tag}
                          </span>
                          <span className="text-[9px] font-extrabold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded font-sans">
                            📅 {job.date}
                          </span>
                        </div>
                        <h4 className={`text-sm font-black leading-snug transition-colors line-clamp-2 ${job.titleColor}`}>
                          {job.title}
                        </h4>
                      </div>
                    ))}
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
                    {[
                      {
                        id: "news-astro-1",
                        tag: "आज का राशिफल",
                        title: "दैनिक राशिफल (28 जुलाई 2026): मेष, सिंह और धनु राशि को अचानक धन लाभ व करियर में तरक्की",
                        date: "28 जुलाई",
                        color: "bg-purple-600 text-white",
                        titleColor: "text-purple-900 hover:text-purple-700",
                        detail: `आज 28 जुलाई 2026, श्रावण शुक्ल पक्ष की शुभ तिथि है। चंद्र देव धनु राशि में गोचर करेंगे। सूर्य और बुध का बुधादित्य राजयोग बनने से कई राशि के जातकों को विशेष आर्थिक लाभ प्राप्त होगा।

## मुख्य 4 भाग्यशाली राशियाँ:
- **मेष राशि:** व्यापार में अटका हुआ धन वापस मिलेगा। व्यावसायिक यात्राएं सफल रहेंगी। पारिवारिक वातावरण सुखद रहेगा।
- **सिंह राशि:** समाज और कार्यस्थल पर पद-प्रतिष्ठा में वृद्धि होगी। अधिकारियों का पूर्ण सहयोग प्राप्त होगा।
- **तुला राशि:** अचानक धन लाभ या नया व्यापार शुरू करने का सुनहरा अवसर मिलेगा। स्वास्थ्य में सुधार होगा।
- **धनु राशि:** आपके आत्मविश्वास और पराक्रम में वृद्धि होगी। नई जिम्मेदारियां मिल सकती हैं।

### आज के शुभ अंक एवं रंग:
- **शुभ रंग:** केसरिया, पीला और सुनहरा।
- **शुभ अंक:** 3, 7 और 9।

## विशेष ज्योतिष सलाह:
आज प्रात:काल भगवान सूर्य देव को तांबे के लोटे से अर्घ्य दें और माता लक्ष्मी की आरती करें। व्यापार में प्रगति होगी।`
                      },
                      {
                        id: "news-astro-2",
                        tag: "सावन विशेष",
                        title: "सावन सोमवार विशेष: भगवान शिव की पूजा का शुभ मुहूर्त, जलाभिषेक विधि और राशि अनुसार उपाय",
                        date: "27 जुलाई",
                        color: "bg-fuchsia-600 text-white",
                        titleColor: "text-fuchsia-900 hover:text-fuchsia-700",
                        detail: `सावन मास के पवित्र सोमवार पर शिव मंदिरों में श्रद्धालुओं का जनसैलाब उमड़ पड़ा है। ज्योतिषाचार्यों के अनुसार सावन सोमवार पर भगवान भोलेनाथ की पूजा से सभी मनोकामनाएं पूर्ण होती हैं।

## पूजन विधि व शुभ मुहूर्त:
- **अभिजीत मुहूर्त:** दोपहर 11:55 बजे से 12:48 बजे तक।
- **प्रदोष काल मुहूर्त:** सायं 06:45 बजे से 08:30 बजे तक।

### शिवलिंग पर अर्पण करने योग्य सामग्रियां:
1. **कच्चा दूध व गंगाजल:** मानसिक शांति व कष्टों से मुक्ति के लिए।
2. **बेलपत्र व धतूरा:** धन-धान्य में वृद्धि व रोग निवारण हेतु।
3. **शहद व भस्म:** ग्रह दोषों के निवारण हेतु।

## राशि अनुसार अचूक उपाय:
- **वृषभ व तुला राशि:** दूध में मिश्री मिलाकर जलाभिषेक करें।
- **मकर व कुंभ राशि:** जल में काले तिल मिलाकर अर्पित करें।`
                      },
                      {
                        id: "news-astro-3",
                        tag: "बुधादित्य योग",
                        title: "सूर्य व बुध का महागोचर: बुधादित्य राजयोग से 4 राशि वालों की चमकेगी किस्मत, धन-वैभव में वृद्धि",
                        date: "26 जुलाई",
                        color: "bg-pink-600 text-white",
                        titleColor: "text-pink-900 hover:text-pink-700",
                        detail: `ज्योतिष शास्त्र में ग्रहों के राजा सूर्य और बुद्धि के कारक बुध देव की युति को 'बुधादित्य राजयोग' कहा जाता है। इस शक्तिशाली योग का प्रभाव सभी 12 राशियों के करियर, व्यापार और वित्तीय जीवन पर पड़ता है।

## राजयोग से लाभान्वित राशियाँ:
- **मिथुन राशि:** बौद्धिक क्षमता में सुधार, शेयर बाजार व नए निवेश से बड़ा फायदा।
- **कन्या राशि:** कार्यस्थल पर पदोन्नति व वेतन वृद्धि के प्रबल योग।
- **वृश्चिक राशि:** संपत्ति की खरीद-बिक्री में अभूतपूर्व सफलता।
- **मीन राशि:** विदेश यात्रा तथा उच्च शिक्षा के रास्ते प्रशस्त होंगे।`
                      },
                      {
                        id: "news-astro-4",
                        tag: "वास्तु शास्त्र",
                        title: "वास्तु टिप्स: घर के मुख्य द्वार पर रखें ये 3 पवित्र चीजें, दूर होगी नकारात्मक ऊर्जा और आर्थिक तंगी",
                        date: "25 जुलाई",
                        color: "bg-violet-600 text-white",
                        titleColor: "text-violet-900 hover:text-violet-700",
                        detail: `वास्तु शास्त्र के अनुसार घर का मुख्य द्वार लक्ष्मी जी के आगमन का द्वार माना जाता है। यदि मुख्य द्वार पर वास्तु दोष हो तो घर में अशांति और आर्थिक तंगी बनी रहती है।

## मुख्य द्वार के 3 चमत्कारी वास्तु उपाय:
1. **तुलसी का पौधा व मनी प्लांट:** मुख्य द्वार के दाईं ओर तुलसी का पौधा रखें।
2. **स्वास्तिक एवं ॐ चिन्ह:** सिंदूर से मुख्य द्वार पर स्वास्तिक बनाएं।
3. **तांबे का लोटा या उरली:** तांबे के पात्र में ताजा जल और गेंदे के फूल तैरते हुए रखें। इससे घर में सकारात्मक ऊर्जा का प्रवाह होता है।`
                      }
                    ].map((astro, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          const sampleArt: Article = {
                            id: astro.id,
                            title: astro.title,
                            subtitle: `${astro.title} - वरिष्ठ ज्योतिषाचार्यों द्वारा ग्रहों के गोचर और पंचांग के आधार पर विशेष विश्लेषण।`,
                            content: astro.detail,
                            category: "astrology",
                            author: "ज्योतिष ज्ञान पीठ",
                            date: astro.date,
                            readTime: 3,
                            image: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=800&q=80",
                            views: 2300 + idx * 400,
                            likes: 210 + idx * 30,
                            comments: [],
                            tags: ["Astrology", "Rashifal", "Horoscope", "Panchang"],
                            isBreaking: false,
                            isFeatured: true,
                            isTrending: true
                          };
                          handleArticleClick(sampleArt);
                        }}
                        className="bg-white border border-purple-150 hover:border-purple-400 rounded-xl p-3 cursor-pointer group hover:bg-purple-50/60 shadow-2xs transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs ${astro.color}`}>
                            {astro.tag}
                          </span>
                          <span className="text-[9px] font-extrabold text-purple-700 bg-purple-100/80 px-1.5 py-0.2 rounded font-sans">
                            ✨ {astro.date}
                          </span>
                        </div>
                        <h4 className={`text-sm font-black leading-snug transition-colors line-clamp-2 ${astro.titleColor}`}>
                          {astro.title}
                        </h4>
                      </div>
                    ))}
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
                    {[
                      {
                        id: "news-scheme-1",
                        tag: "PM किसान",
                        title: "PM किसान सम्मान निधि: 19वीं किश्त के ₹2,000 सीधे किसानों के बैंक खातों में ट्रांसफर, लिस्ट देखें",
                        date: "28 जुलाई",
                        color: "bg-emerald-600 text-white",
                        titleColor: "text-emerald-900 hover:text-emerald-700",
                        detail: `केंद्र सरकार द्वारा संचालित प्रधानमंत्री किसान सम्मान निधि योजना (PM-KISAN) की 19वीं किस्त का इंतजार कर रहे करोड़ों किसानों के लिए बड़ी खुशखबरी है। आज प्रत्यक्ष लाभ अंतरण (DBT) के माध्यम से देश भर के 10 करोड़ से अधिक पात्र किसान परिवारों के बैंक खातों में ₹2,000 की राशि सीधे भेजी जा चुकी है।

## योजना की प्रमुख विशेषताएं:
- **वार्षिक वित्तीय सहायता:** ₹6,000 (3 समान किस्तों में ₹2,000-₹2,000)।
- **पारदर्शिता:** राशि सीधे आधार लिंक बैंक खाते में जमा होती है।

### अपनी किस्त का स्टेटस कैसे चेक करें?
1. योजना की आधिकारिक वेबसाइट **pmkisan.gov.in** पर जाएं।
2. **'Know Your Status'** या **'Beneficiary List'** ऑप्शन पर क्लिक करें।
3. अपना पंजीकरण संख्या (Registration No.) और कैप्चा दर्ज करें।
4. स्क्रीन पर आपकी 19वीं किस्त का स्टेटस दिखाई दे जाएगा।

## ई-केवाईसी (e-KYC) क्यों अनिवार्य है?
जिन किसानों की किस्त रुक गई है, उनका मुख्य कारण आधार और बैंक पासबुक में नाम का अंतर अथवा ई-केवाईसी अधूरा होना है। किसान अपने नजदीकी सीएससी (CSC) केंद्र पर जाकर बायोमेट्रिक ई-केवाईसी अवश्य करा लें।

### सहायता हेल्पलाइन:
- **टोल-फ्री नंबर:** 1800-115-526
- **ईमेल:** pmkisan-ict@gov.in`
                      },
                      {
                        id: "news-scheme-2",
                        tag: "PM आवास",
                        title: "PM आवास योजना 2.0: 3 लाख नए ग्रामीण व शहरी परिवारों को पक्का मकान, ऑनलाइन सूची जारी",
                        date: "27 जुलाई",
                        color: "bg-teal-600 text-white",
                        titleColor: "text-teal-900 hover:text-teal-700",
                        detail: `प्रधानमंत्री आवास योजना (PMAY 2.0) के तहत केंद्र सरकार ने देश भर के बेघर और कच्चे मकानों में रहने वाले 3 लाख नए निर्धन परिवारों को पक्का मकान बनाने हेतु आर्थिक अनुदान स्वीकृत कर दिया है।

## मिलने वाली आर्थिक सहायता:
- **मैदानी क्षेत्र (Plain Areas):** ₹1,20,000 की आर्थिक मदद।
- **पहाड़ी एवं दुर्गम क्षेत्र:** ₹1,30,000 अनुदान + मनरेगा मजदूरी ₹25,000।
- **शौचालय निर्माण हेतु:** ₹12,000 अतिरिक्त राशि।

### आवेदन हेतु आवश्यक दस्तावेज:
- आधार कार्ड, बैंक पासबुक, आय प्रमाण पत्र, जॉब कार्ड तथा भूमि का खसरा-खतौनी।

ऑनलाइन आवेदन के लिए pmaymis.gov.in पर विजिट करें अथवा अपने ग्राम पंचायत सचिव से संपर्क करें।`
                      },
                      {
                        id: "news-scheme-3",
                        tag: "आयुष्मान कार्ड",
                        title: "आयुष्मान भारत योजना: 70 वर्ष से अधिक बुजुर्गों के लिए ₹5 लाख का मुफ्त इलाज कार्ड बनना शुरू",
                        date: "26 जुलाई",
                        color: "bg-green-700 text-white",
                        titleColor: "text-green-900 hover:text-green-700",
                        detail: `स्वास्थ्य एवं परिवार कल्याण मंत्रालय ने आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (AB-PMJAY) के दायरे में बड़ा विस्तार करते हुए देश के सभी 70 वर्ष या उससे अधिक आयु के वरिष्ठ नागरिकों के लिए ₹5 लाख का स्वास्थ्य बीमा सुरक्षा कवर प्रदान करने का निर्णय लिया है।

## योजना के मुख्य लाभ:
- **आय सीमा का कोई बंधन नहीं:** सभी वरिष्ठ नागरिकों को चाहे उनकी आय कुछ भी हो, कार्ड मिलेगा।
- **अस्पतालों की सूची:** देश भर के 29,000 से अधिक सूचीबद्ध सरकारी एवं निजी अस्पतालों में कैशलेस इलाज।

### आयुष्मान कार्ड कैसे बनवाएं?
1. **Ayushman App** अपने स्मार्टफोन में डाउनलोड करें।
2. अपना आधार नंबर दर्ज करके OTP से लॉगिन करें।
3. परिवार के बुजुर्गों का ई-केवाईसी पूरा करके डिजिटल कार्ड डाउनलोड कर लें।`
                      },
                      {
                        id: "news-scheme-4",
                        tag: "लाडली बहना",
                        title: "लाडली बहना / महतारी वंदन योजना: महिलाओं के खाते में ₹1,500 की नई किस्त इस दिन होगी जमा",
                        date: "25 जुलाई",
                        color: "bg-rose-600 text-white",
                        titleColor: "text-rose-900 hover:text-rose-700",
                        detail: `राज्य सरकार द्वारा महिलाओं के आर्थिक सशक्तीकरण हेतु चलाई जा रही लाडली बहना एवं महतारी वंदन योजना की अगली मासिक किस्त की तिथि घोषित कर दी गई है।

## योजना के मुख्य बिंदु:
- **मासिक सहायता राशि:** ₹1,250 से बढ़ाकर ₹1,500 प्रति माह की गई।
- **भुगतान माध्यम:** बैंक खाते में डीबीटी (Direct Benefit Transfer)।

### भुगतान न होने पर क्या करें?
यदि किसी महिला के खाते में किस्त की राशि प्राप्त नहीं हुई है, तो वे तुरंत अपने बैंक शाखा में जाकर डीबीटी (DBT) तथा आधार एनपीसीआई (NPCI) मैपिंग सक्रिय करवा लें।`
                      }
                    ].map((scheme, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          const sampleArt: Article = {
                            id: scheme.id,
                            title: scheme.title,
                            subtitle: `${scheme.title} - केंद्र एवं राज्य सरकार की कल्याणकारी योजनाओं के ऑनलाइन पंजीकरण और पात्रता की संपूर्ण गाइड।`,
                            content: scheme.detail,
                            category: "schemes",
                            author: "सरकारी योजना विशेष डेस्क",
                            date: scheme.date,
                            readTime: 3,
                            image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
                            views: 2190 + idx * 350,
                            likes: 190 + idx * 20,
                            comments: [],
                            tags: ["Govt Schemes", "Yojna", "Benefits", "Sarkari Yojna"],
                            isBreaking: idx === 0,
                            isFeatured: true,
                            isTrending: true
                          };
                          handleArticleClick(sampleArt);
                        }}
                        className="bg-white border border-emerald-150 hover:border-emerald-400 rounded-xl p-3 cursor-pointer group hover:bg-emerald-50/60 shadow-2xs transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs ${scheme.color}`}>
                            {scheme.tag}
                          </span>
                          <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded font-sans">
                            📜 {scheme.date}
                          </span>
                        </div>
                        <h4 className={`text-sm font-black leading-snug transition-colors line-clamp-2 ${scheme.titleColor}`}>
                          {scheme.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Interactive OPINION POLL CARD (Vibrant Rang-Biranga Design) */}
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

                {/* 4. Sidebar Google AdSense Block Placeholders */}
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

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 5. Elegant footer layout */}
      <footer className="bg-neutral-900 text-neutral-400 border-t-4 border-neutral-950 py-10 mt-12 font-sans">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
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
                    setSelectedCategory(cat.id);
                    setSelectedArticleId(null);
                    setSearchQuery("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`px-2 py-1 rounded transition-all cursor-pointer text-[10px] font-medium ${
                    selectedCategory === cat.id
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
            <div className="text-white font-bold text-xs mb-3 uppercase tracking-wider">अस्वीकरण एवं प्रशासनिक एक्सेस</div>
            <p className="leading-relaxed text-neutral-400">
              © 2026 सारादेश.in समाचार प्रा. लि. सर्वाधिकार सुरक्षित। वेबसाइट पर प्रदर्शित सभी समाचार और सामग्री प्रामाणिक स्रोतों पर आधारित है।
            </p>
            <button 
              onClick={() => {
                setIsAdminMode((prev) => !prev);
                setSelectedArticleId(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title="एडमिन पैनल खोलने के लिए क्लिक करें"
              className="mt-4 px-3.5 py-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-white border border-amber-500/50 hover:border-amber-400 rounded-xl text-xs font-black inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
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
