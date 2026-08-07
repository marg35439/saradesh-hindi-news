import React from "react";
import { Eye, Heart, MessageSquare, Clock, ArrowUpRight, Bookmark, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { Article } from "../types";

interface ArticleCardProps {
  key?: string;
  article: Article;
  onClick: () => void;
  isCompact?: boolean;
  isCompactView?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (e: React.MouseEvent, article: Article) => void;
}

export default function ArticleCard({
  article,
  onClick,
  isCompact = false,
  isCompactView = false,
  isBookmarked = false,
  onToggleBookmark
}: ArticleCardProps) {
  const compact = isCompact || isCompactView;

  // Get dynamic vibrant gradient badge styles for categories
  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat) {
      case "national":
        return "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs";
      case "state":
        return "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs";
      case "sports":
        return "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs";
      case "entertainment":
        return "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs";
      case "business":
        return "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs";
      case "tech":
        return "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs";
      case "lifestyle":
        return "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs";
      case "international":
        return "bg-gradient-to-r from-violet-600 to-purple-800 text-white shadow-xs";
      default:
        return "bg-gradient-to-r from-neutral-700 to-neutral-900 text-white shadow-xs";
    }
  };

  const getCategoryTitleColor = (cat: string) => {
    switch (cat) {
      case "national": return "text-red-700 group-hover:text-red-900";
      case "state": return "text-amber-800 group-hover:text-amber-950";
      case "sports": return "text-emerald-800 group-hover:text-emerald-950";
      case "entertainment": return "text-purple-800 group-hover:text-purple-950";
      case "business": return "text-blue-800 group-hover:text-blue-950";
      case "tech": return "text-cyan-800 group-hover:text-cyan-950";
      case "lifestyle": return "text-pink-800 group-hover:text-pink-950";
      case "international": return "text-violet-800 group-hover:text-violet-950";
      default: return "text-orange-800 group-hover:text-orange-950";
    }
  };

  const getCategoryHindiName = (cat: string) => {
    switch (cat) {
      case "national": return "देश";
      case "state": return "राज्य";
      case "sports": return "खेल";
      case "entertainment": return "मनोरंजन";
      case "business": return "बिजनेस";
      case "tech": return "टेक";
      case "lifestyle": return "लाइफस्टाइल";
      case "international": return "विदेश";
      default: return "खबर";
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = encodeURIComponent(`📰 *${article.title}*\n\n${article.subtitle}\n\nपूरी खबर सारादेश.in पर पढ़ें: ${window.location.origin}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // SUPER COMPACT DENSE ROW VIEW MODE
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onClick}
        className="bg-white rounded-xl p-2.5 border border-neutral-200/80 hover:border-amber-400 flex items-center justify-between gap-3 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Small Screenshot Thumbnail */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/80 relative">
            <img
              src={article.image.includes("images.unsplash.com") ? `${article.image.split("?")[0]}?auto=format&fit=crop&w=120&q=75` : article.image}
              alt={article.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
              width="48"
              height="48"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${getCategoryBadgeStyle(article.category)}`}>
                {getCategoryHindiName(article.category)}
              </span>
              <span className="text-[9px] text-neutral-400 font-sans">{article.date}</span>
            </div>
            <h4 className={`text-sm sm:text-base font-black truncate transition-colors ${getCategoryTitleColor(article.category)}`}>
              {article.title}
            </h4>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
            title="व्हाट्सएप पर शेयर करें"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => onToggleBookmark(e, article)}
              className={`p-1.5 rounded-lg transition-colors ${
                isBookmarked ? "bg-amber-100 text-amber-700" : "bg-neutral-50 hover:bg-neutral-100 text-neutral-400"
              }`}
              title="सहेजें"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-600" : ""}`} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // STANDARD RICH CARD VIEW MODE
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-neutral-200/80 hover:border-amber-400 flex flex-row p-3 md:p-3.5 gap-3.5 md:gap-4 shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
    >
      {/* Article Cover Image (Left side) */}
      <div className="relative w-28 h-28 sm:w-36 sm:h-28 md:w-40 md:h-28 rounded-xl overflow-hidden bg-neutral-100 shrink-0 self-center shadow-2xs">
        <img
          src={article.image.includes("images.unsplash.com") ? `${article.image.split("?")[0]}?auto=format&fit=crop&w=360&q=75` : article.image}
          alt={article.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          decoding="async"
          width="160"
          height="112"
        />
        {/* Category Tag Overlay */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className={`text-[9px] font-black uppercase py-0.5 px-2 rounded-md shadow-xs ${getCategoryBadgeStyle(article.category)}`}>
            {getCategoryHindiName(article.category)}
          </span>
        </div>
      </div>

      {/* Article Text Content (Right side) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Author Name, Date and Actions */}
          <div className="flex items-center justify-between gap-2 text-[10px] font-sans font-medium mb-1.5">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-slate-700 truncate max-w-[90px] sm:max-w-[130px]">{article.author}</span>
              <span className="text-neutral-300">•</span>
              <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-150 shadow-2xs">{article.date}</span>
              {article.state && (
                <>
                  <span className="text-neutral-300">•</span>
                  <span className="text-amber-800 bg-amber-100/90 font-black px-1.5 py-0.5 rounded text-[9px]">
                    📍 {article.state}
                  </span>
                </>
              )}
            </div>

            {/* Quick Bookmark and WhatsApp Share */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                title="व्हाट्सएप पर शेयर करें"
              >
                <Share2 className="w-3 h-3" />
              </button>
              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={(e) => onToggleBookmark(e, article)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isBookmarked ? "bg-amber-100 text-amber-700" : "hover:bg-neutral-100 text-neutral-400"
                  }`}
                  title="सहेजें"
                >
                  <Bookmark className={`w-3 h-3 ${isBookmarked ? "fill-amber-600" : ""}`} />
                </button>
              )}
            </div>
          </div>

          <h3 
            className={`text-base sm:text-lg md:text-[19px] font-black tracking-tight leading-snug transition-colors line-clamp-2 mb-1 flex items-start gap-1 ${getCategoryTitleColor(article.category)}`}
          >
            <span>{article.title}</span>
            <ArrowUpRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 text-red-600 hidden sm:inline" />
          </h3>

          <p className="text-[11px] text-neutral-500 line-clamp-1 hidden sm:block leading-normal font-sans mb-1.5">
            {article.subtitle}
          </p>
        </div>

        {/* Dynamic Interactive Stats */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-[9px] md:text-[10px] text-neutral-500 font-sans mt-auto">
          <div className="flex items-center gap-1 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60 text-amber-900 font-black" title="पढ़ने का समय">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{article.readTime} मिनट में पढ़ें</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-md text-rose-700 font-bold" title="पसंद">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{article.likes || 0}</span>
            </div>
            
            <div className="flex items-center gap-1 bg-sky-50 px-1.5 py-0.5 rounded-md text-sky-700 font-bold" title="कमेंट">
              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
              <span>{(article.comments || []).length}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

