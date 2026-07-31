import React from "react";
import { AlertCircle, Flame } from "lucide-react";
import { Article } from "../types";

interface BreakingNewsProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

export default function BreakingNews({ articles, onArticleClick }: BreakingNewsProps) {
  // Pass all articles so all news headings roll through the ticker!
  const tickerList = articles.length > 0 ? articles : [];

  if (tickerList.length === 0) return null;

  // Duplicate the list of articles to ensure a smooth, seamless looping marquee
  const items = [...tickerList, ...tickerList, ...tickerList];

  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat) {
      case "national": return "bg-red-600 text-white font-black";
      case "state": return "bg-amber-500 text-slate-950 font-black";
      case "sports": return "bg-emerald-600 text-white font-black";
      case "entertainment": return "bg-purple-600 text-white font-black";
      case "business": return "bg-blue-600 text-white font-black";
      case "tech": return "bg-cyan-500 text-slate-950 font-black";
      case "lifestyle": return "bg-pink-600 text-white font-black";
      case "international": return "bg-violet-600 text-white font-black";
      default: return "bg-orange-600 text-white font-black";
    }
  };

  const getCategoryHindiName = (cat: string) => {
    switch (cat) {
      case "national": return "नेशनल";
      case "state": return "राज्य";
      case "sports": return "खेल";
      case "entertainment": return "मनोरंजन";
      case "business": return "बिजनेस";
      case "tech": return "टेक";
      case "lifestyle": return "लाइफस्टाइल";
      case "international": return "विदेश";
      default: return "ताज़ा";
    }
  };

  return (
    <div className="bg-gradient-to-r from-neutral-950 via-slate-900 to-amber-950 text-white border-y border-amber-500/30 shadow-md overflow-hidden relative z-40 group">
      <div className="max-w-7xl mx-auto flex items-center h-11 text-xs md:text-sm">
        {/* Sticky Flashing Tag */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 h-full px-3.5 md:px-5 flex items-center justify-center font-black text-white gap-2 shrink-0 select-none tracking-wider uppercase z-20 shadow-md border-r border-red-500">
          <AlertCircle className="w-4 h-4 text-yellow-300 animate-bounce" />
          <span className="animate-pulse text-[11px] md:text-xs">लाइव टिकर</span>
        </div>

        {/* Continuous Text-Only Marquee Ticker with colorful category badges */}
        <div className="flex-1 overflow-hidden relative flex items-center h-full">
          <div className="animate-marquee group-hover:[animation-play-state:paused] whitespace-nowrap flex items-center h-full gap-5 pl-4">
            {items.map((art, i) => (
              <div
                key={`${art.id}-${i}`}
                onClick={() => onArticleClick(art)}
                className="inline-flex items-center gap-2 cursor-pointer text-white font-black text-xs md:text-sm hover:text-amber-300 transition-all bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/15 shadow-xs shrink-0"
                title="खबर पढ़ने के लिए क्लिक करें"
              >
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded shadow-xs shrink-0 ${getCategoryBadgeStyle(art.category)}`}>
                  {getCategoryHindiName(art.category)}
                </span>

                <span className="whitespace-nowrap font-sans tracking-wide">{art.title}</span>
                <span className="text-amber-400 font-bold ml-1">★</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

