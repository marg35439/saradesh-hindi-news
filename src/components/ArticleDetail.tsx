import React, { useState, useEffect } from "react";
import { ArrowLeft, Home, Heart, MessageSquare, Clock, Send, Share2, Eye, Calendar, ThumbsUp, Check, Bookmark, Newspaper, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Article, Comment, CATEGORIES } from "../types";
import { fetchArticleById, likeArticleClient, addCommentClient, fetchNewsList } from "../lib/newsClient";
import AudioNewsReader from "./AudioNewsReader";

interface ArticleDetailProps {
  articleId: string;
  onBack: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (e: React.MouseEvent, article: Article) => void;
  allArticles?: Article[];
  onArticleSelect?: (article: Article) => void;
}

export default function ArticleDetail({ 
  articleId, 
  onBack, 
  isBookmarked = false, 
  onToggleBookmark,
  allArticles,
  onArticleSelect
}: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    fetchArticleById(articleId)
      .then((data: Article | null) => {
        if (data) {
          setArticle(data);
          setLikeCount(data.likes || 0);
          setComments(data.comments || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [articleId]);

  useEffect(() => {
    if (!article) return;

    const prepareRelated = (sourceArticles: Article[]) => {
      const pool = sourceArticles.filter((a) => a.id !== article.id);
      
      const sameCategory = pool.filter((a) => {
        if (a.category === article.category) return true;
        if ((article.category === 'job' || article.category === 'jobs') && (a.category === 'job' || a.category === 'jobs')) return true;
        if ((article.category === 'astrology' || article.category === 'astro') && (a.category === 'astrology' || a.category === 'astro')) return true;
        if ((article.category === 'schemes' || article.category === 'scheme' || article.category === 'yojna') && (a.category === 'schemes' || a.category === 'scheme' || a.category === 'yojna')) return true;
        return false;
      });

      const otherArticles = pool.filter((a) => !sameCategory.includes(a));
      const finalRelated = [...sameCategory, ...otherArticles].slice(0, 6);
      setRelatedArticles(finalRelated);
    };

    // ALWAYS fetch all site articles to build a rich related news list, even if opened from a single category
    fetchNewsList("all")
      .then((items) => {
        if (items && items.length > 0) {
          const combinedMap = new Map<string, Article>();
          (allArticles || []).forEach(a => combinedMap.set(a.id, a));
          items.forEach(a => combinedMap.set(a.id, a));
          prepareRelated(Array.from(combinedMap.values()));
        } else if (allArticles && allArticles.length > 0) {
          prepareRelated(allArticles);
        }
      })
      .catch((err) => {
        console.error("Error fetching related news:", err);
        if (allArticles && allArticles.length > 0) {
          prepareRelated(allArticles);
        }
      });
  }, [article, articleId]);

  const handleLike = () => {
    if (hasLiked) return;
    likeArticleClient(articleId)
      .then((data) => {
        setLikeCount(data.likes);
        setHasLiked(true);
      })
      .catch((err) => console.error("Like error:", err));
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;

    addCommentClient(articleId, commentName, commentText)
      .then((data) => {
        setComments(data.comments);
        setCommentName("");
        setCommentText("");
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);
      })
      .catch((err) => console.error("Comment submit error:", err));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleWhatsAppShare = () => {
    if (!article) return;
    const text = encodeURIComponent(`📰 *${article.title}*\n\n${article.subtitle}\n\nपूरी खबर सारादेश.in पर पढ़ें: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-6 w-1/4 bg-gray-200 rounded mx-auto mb-4"></div>
        <div className="h-10 w-3/4 bg-gray-200 rounded mx-auto mb-6"></div>
        <div className="h-96 w-full bg-gray-100 rounded mb-4"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded mx-auto mb-2.5"></div>
        <div className="h-4 w-4/5 bg-gray-200 rounded mx-auto"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-neutral-800">आलेख लोड करने में त्रुटि हुई!</h2>
        <p className="text-gray-500 mt-2">यह सामग्री वर्तमान में अनुपलब्ध है।</p>
        <button 
          onClick={onBack}
          className="mt-6 px-4 py-2 bg-[#ff6f00] text-white rounded-lg font-bold"
        >
          मुख्य प्रष्ठ पर लौटें
        </button>
      </div>
    );
  }

  const getContentFontSizeClass = () => {
    return "text-[17px] md:text-[19px]";
  };

  const renderFormattedContent = (rawContent: string, catKey: string) => {
    if (!rawContent) return null;

    // Helper to check if a single trimmed line is a section heading
    const isHeadingLine = (line: string): boolean => {
      const t = line.trim();
      if (!t) return false;
      if (/^[━\-\=\_\*\~\#\s]{3,}$/.test(t)) return false;

      // Markdown / Bold headers
      if (/^(?:#{1,4}|\*\*)\s*/.test(t)) return true;

      // Explicit label prefixes
      if (/^(?:हेडिंग|सब\-?हेडिंग|उप\-?शीर्षक|शीर्षक|Heading|Subtitle|Section)[\:\=]?\s*/i.test(t)) return true;

      // Ends with question mark or colon
      if (t.endsWith("?") || t.endsWith(":") || t.endsWith("؟")) return true;

      // Short line (<= 75 chars) without Hindi full stop (।) or English full stop (.) or !
      if (t.length <= 75 && !t.includes("।") && !t.includes(".") && !t.includes("!")) {
        return true;
      }

      return false;
    };

    // Parse raw content into structured blocks
    const lines = rawContent.split(/\r?\n/);
    interface ContentBlock {
      type: "heading" | "paragraph" | "list" | "image";
      text: string;
      imgUrl?: string;
      imgCaption?: string;
    }

    const blocks: ContentBlock[] = [];
    let paraBuffer: string[] = [];

    const flushPara = () => {
      if (paraBuffer.length > 0) {
        const fullText = paraBuffer.join("\n").trim();
        if (fullText) {
          blocks.push({ type: "paragraph", text: fullText });
        }
        paraBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty or horizontal decorative dividers
      if (!line || /^[━\-\=\_\*\~\#\s]{3,}$/.test(line)) {
        flushPara();
        continue;
      }

      // Inline Image Check
      if (
        (line.includes("![") && line.includes("](") && line.includes(")")) ||
        line.startsWith("[IMAGE:") || line.startsWith("[IMG:") ||
        line.startsWith("<img") ||
        ((line.startsWith("http://") || line.startsWith("https://")) && !line.includes(" ") && (line.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || line.includes("unsplash.com") || line.includes("images")))
      ) {
        flushPara();
        let parsedImgUrl = "";
        let parsedImgCaption = "";

        if (line.includes("![") && line.includes("](") && line.includes(")")) {
          const altStart = line.indexOf("![") + 2;
          const altEnd = line.indexOf("](", altStart);
          if (altEnd > altStart) {
            parsedImgCaption = line.substring(altStart, altEnd).trim();
            const urlStart = altEnd + 2;
            const urlEnd = line.lastIndexOf(")");
            if (urlEnd > urlStart) {
              parsedImgUrl = line.substring(urlStart, urlEnd).trim();
            }
          }
        } else if (line.startsWith("[IMAGE:") || line.startsWith("[IMG:")) {
          const cleanTag = line.replace(/^\[(IMAGE|IMG):\s*/, "").replace(/\]$/, "").trim();
          const parts = cleanTag.split("|");
          parsedImgUrl = parts[0]?.trim() || "";
          parsedImgCaption = parts[1]?.trim() || "";
        } else if (line.startsWith("<img")) {
          const srcMatch = line.match(/src=["'](.*?)["']/);
          parsedImgUrl = srcMatch ? srcMatch[1] : "";
          const altMatch = line.match(/alt=["'](.*?)["']/);
          parsedImgCaption = altMatch ? altMatch[1] : "";
        } else {
          parsedImgUrl = line;
        }

        if (parsedImgUrl) {
          blocks.push({
            type: "image",
            text: line,
            imgUrl: parsedImgUrl,
            imgCaption: parsedImgCaption
          });
        }
        continue;
      }

      // List Check
      if (line.startsWith("- ") || line.startsWith("* ") || /^\d+[\.\)]\s+/.test(line)) {
        flushPara();
        const listLines = [line];
        while (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith("- ") || nextLine.startsWith("* ") || /^\d+[\.\)]\s+/.test(nextLine)) {
            listLines.push(nextLine);
            i++;
          } else {
            break;
          }
        }
        blocks.push({ type: "list", text: listLines.join("\n") });
        continue;
      }

      // Heading Check
      if (isHeadingLine(line)) {
        flushPara();
        const cleanHeading = line
          .replace(/^#{1,4}\s+/, "")
          .replace(/^(?:हेडिंग|सब\-?हेडिंग|उप\-?शीर्षक|शीर्षक|Heading|Subtitle|Section)[\:\=]?\s*/i, "")
          .replace(/^\*\*/, "")
          .replace(/\*\*$/, "")
          .trim();

        if (cleanHeading) {
          blocks.push({ type: "heading", text: cleanHeading });
        }
        continue;
      }

      // Paragraph Line
      paraBuffer.push(line);
    }
    flushPara();

    // Render parsed blocks
    return blocks.map((block, idx) => {
      if (block.type === "heading") {
        return (
          <div key={idx} className="my-8 sm:my-10 text-center">
            <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border shadow-2xs bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-orange-200/90 max-w-full">
              <span className="text-orange-600 font-bold text-sm shrink-0">🔸</span>
              <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-[#d95300] leading-snug">
                {block.text}
              </h2>
            </div>
          </div>
        );
      }

      if (block.type === "image" && block.imgUrl) {
        return (
          <div key={idx} className="my-6 space-y-2 font-sans">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-md bg-neutral-900/5 max-w-3xl mx-auto">
              <img
                src={block.imgUrl}
                alt={block.imgCaption || "समाचार चित्र"}
                className="w-full h-auto max-h-[550px] object-cover hover:scale-101 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
            {block.imgCaption && (
              <p className="text-center text-xs font-semibold text-slate-500 italic">
                📷 {block.imgCaption}
              </p>
            )}
          </div>
        );
      }

      if (block.type === "list") {
        const items = block.text.split("\n").filter((l) => l.trim().length > 0);
        return (
          <div key={idx} className="my-6 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2.5">
            {items.map((item, itemIdx) => {
              const cleanItem = item.replace(/^[-*•]|\d+[\.\)]\s*/, "").trim();
              const parts = cleanItem.split(/(\*\*.*?\*\*)/g);
              return (
                <div key={itemIdx} className="flex items-start gap-2.5 text-slate-900 text-base sm:text-lg leading-relaxed font-sans">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black shrink-0 mt-1 text-white shadow-2xs ${
                    catKey === "job" ? "bg-blue-600" :
                    catKey === "astrology" ? "bg-purple-600" :
                    catKey === "schemes" ? "bg-emerald-600" :
                    "bg-orange-600"
                  }`}>
                    ✓
                  </span>
                  <div>
                    {parts.map((p, pIdx) => {
                      if (p.startsWith("**") && p.endsWith("**")) {
                        return <strong key={pIdx} className="font-black text-slate-950 bg-amber-200/80 px-1.5 py-0.5 rounded shadow-2xs">{p.slice(2, -2)}</strong>;
                      }
                      return p;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      // Paragraph block with normal black color
      const paragraphParts = block.text.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="text-black font-normal text-[17px] sm:text-[18px] md:text-[19px] leading-[1.8] sm:leading-[1.85] font-sans my-5 tracking-normal">
          {paragraphParts.map((p, pIdx) => {
            if (p.startsWith("**") && p.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-black text-black bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200/70 shadow-2xs">
                  {p.slice(2, -2)}
                </strong>
              );
            }
            return p;
          })}
        </p>
      );
    });
  };

  return (
    <motion.article 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-20"
    >
      {/* Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          {/* 1. Go Back One Page Button */}
          <button
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                onBack();
              }
            }}
            className="group flex items-center gap-1.5 bg-white hover:bg-neutral-100 text-slate-800 hover:text-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>पीछे जाएँ</span>
          </button>

          {/* 2. Go to Home Page Button */}
          <button
            onClick={onBack}
            className="group flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all shadow-xs hover:shadow-md"
          >
            <Home className="w-4 h-4 text-white" />
            <span>मुख्य पृष्ठ पर जाएँ</span>
          </button>
        </div>
      </div>

      {/* Main News Category and stats bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3.5 text-xs">
        <span className={`font-extrabold uppercase px-3 py-1 rounded-lg shadow-2xs border ${
          article.category === "job" ? "bg-blue-600 text-white border-blue-700" :
          article.category === "astrology" ? "bg-purple-700 text-white border-purple-800" :
          article.category === "schemes" ? "bg-emerald-600 text-white border-emerald-700" :
          "bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-700"
        }`}>
          {article.category === "national" ? "🇮🇳 देश" : 
           article.category === "state" ? `📍 राज्य | ${article.state || ""}` : 
           article.category === "sports" ? "🏆 खेल" : 
           article.category === "entertainment" ? "🎬 मनोरंजन" : 
           article.category === "business" ? "📈 बिजनेस" : 
           article.category === "tech" ? "📱 टेक" : 
           article.category === "lifestyle" ? "✨ लाइफस्टाइल" :
           article.category === "job" ? "💼 नौकरी / करियर" :
           article.category === "astrology" ? "🔮 ज्योतिष / राशिफल" :
           article.category === "schemes" ? "📜 सरकारी योजनाएं" : "🌍 विदेश"}
        </span>
        <span className="text-neutral-300 font-bold">•</span>
        <span className="font-bold text-slate-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{article.readTime} मिनट पठन समय</span>
        </span>
        <span className="text-neutral-300 font-bold">•</span>
        <span className="font-bold text-slate-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>{article.views || 0} बार देखा गया</span>
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-4">
        {article.title}
      </h1>

      {/* Subtitle / summary */}
      <p className="text-md md:text-lg text-neutral-600 font-sans italic leading-relaxed border-l-4 border-[#ff6f00] pl-4 mb-6">
        {article.subtitle}
      </p>

      {/* Embedded AI Voice Audio Reader */}
      <AudioNewsReader article={article} />

      {/* Author & Share Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-y border-neutral-150 py-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-[#ff6f00] flex items-center justify-center text-white font-extrabold shadow-sm font-sans shrink-0">
            {article.author.substring(0, 1)}
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900">रिपोर्टर: {article.author}</div>
            <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>प्रकाशित: {article.date}</span>
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2">
          {onToggleBookmark && (
            <button
              onClick={(e) => onToggleBookmark(e, article)}
              className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isBookmarked ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-600" : ""}`} />
              <span>{isBookmarked ? "सहेजी गई" : "सहेजें"}</span>
            </button>
          )}

          <button
            onClick={handleWhatsAppShare}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs flex items-center gap-1.5 font-bold shadow-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>व्हाट्सएप</span>
          </button>

          <button 
            onClick={handleCopyLink}
            className={`p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors text-xs flex items-center gap-1 font-bold ${copiedLink ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "text-neutral-600 bg-white"}`}
          >
            {copiedLink ? <Check className="w-4 h-4" /> : null}
            <span>{copiedLink ? "कॉपी हुआ" : "कॉपी लिंक"}</span>
          </button>
        </div>
      </div>

      {/* Content Cover Image */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-md mb-8">
        <img
          src={article.image}
          alt={article.title}
          referrerPolicy="no-referrer"
          className="w-full h-auto object-cover max-h-[460px] mx-auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div>

      {/* Article content body with rich subheadings and formatted callouts */}
      <div className={`max-w-none text-neutral-800 leading-relaxed font-sans mb-10 pb-6 border-b border-neutral-200 ${getContentFontSizeClass()}`}>
        {renderFormattedContent(article.content, article.category)}
      </div>

      {/* Likes / Reaction feedback panel */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 shadow-xs">
        <div>
          <h4 className="font-bold text-neutral-800 text-sm">क्या आपको यह समाचार उपयोगी लगा?</h4>
          <p className="text-xs text-neutral-400 mt-1">अपने विचार साझा करने के लिए लेख को लाइक करें या नीचे टिप्पणी दें।</p>
        </div>
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-bold cursor-pointer transition-all ${
            hasLiked 
              ? "bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/10 cursor-default" 
              : "bg-white text-neutral-700 border-neutral-300 hover:border-rose-400 hover:bg-rose-50/50"
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${hasLiked ? "fill-white" : ""}`} />
          <span>{hasLiked ? "लाइक किया गया" : "लाइक करें"}</span>
          <span className="bg-neutral-100 text-neutral-700 font-mono text-xs px-1.5 py-0.5 rounded ml-1.5 shrink-0">
            {likeCount}
          </span>
        </button>
      </div>

      {/* Interactive Comments system */}
      <div>
        <h3 className="text-lg font-extrabold text-neutral-950 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#ff6f00]" />
          <span>पाठक टिप्पणियां ({comments.length})</span>
        </h3>

        {/* Existing comments listing */}
        {comments.length === 0 ? (
          <div className="bg-neutral-55/60 p-6 rounded-xl text-center border border-dashed border-neutral-200 text-neutral-400 text-xs mb-8">
            कोई टिप्पणी नहीं मिली। इस समाचार पर पहली टिप्पणी लिखें!
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {comments.map((cm) => (
              <div key={cm.id} className="bg-white rounded-lg border border-neutral-200 p-4 shadow-3xs">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-neutral-800 text-sm">{cm.name}</span>
                  <span className="text-[10px] text-neutral-400">{cm.date}</span>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed font-sans">{cm.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Create comment form */}
        <form onSubmit={handleCommentSubmit} className="bg-[#fcf8f5] rounded-xl border border-[#ff6f00]/15 p-5">
          <h4 className="font-bold text-neutral-800 text-sm mb-3">लेख पर अपनी प्रतिक्रिया दें</h4>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">आपका नाम :</label>
              <input
                type="text"
                required
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="यहाँ अपना नाम लिखें..."
                className="w-full text-xs p-2 rounded-md outline-none bg-white border border-neutral-200 focus:border-[#ff6f00]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">टिप्पणी :</label>
              <textarea
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="समाचार के बारे में अपनी राय यहाँ व्यक्त करें..."
                className="w-full text-xs p-2 rounded-md outline-none bg-white border border-neutral-200 focus:border-[#ff6f00] resize-y"
              ></textarea>
            </div>
            
            {commentSuccess && (
              <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 p-2 rounded animate-fadeIn">
                सफलता: आपकी टिप्पणी सफलतापूर्वक प्रकाशित की गई है!
              </div>
            )}

            <button
              type="submit"
              className="mt-1 flex items-center justify-center gap-1.5 md:self-end bg-[#ff6f00] hover:bg-amber-600 text-white font-bold text-xs py-2 px-5 rounded-lg cursor-pointer transition-colors shadow-md shadow-orange-600/10"
            >
              <Send className="w-3.5 h-3.5" />
              <span>टिप्पणी भेजें</span>
            </button>
          </div>
        </form>
      </div>

      {/* RELATED NEWS SECTION */}
      {relatedArticles.length > 0 && (
        <div className="mt-12 pt-8 border-t-2 border-neutral-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#ff6f00] rounded-full inline-block"></span>
              <span>संबंधित समाचार एवं अन्य प्रमुख ख़बरें</span>
            </h3>
            <span className="text-xs text-neutral-500 font-bold font-sans bg-neutral-100 px-2.5 py-1 rounded-md">
              {CATEGORIES.find(c => c.key === article.category)?.hindiName || "खबरें"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedArticles.map((relArt) => (
              <div
                key={relArt.id}
                onClick={() => {
                  if (onArticleSelect) {
                    onArticleSelect(relArt);
                  }
                }}
                className="bg-white border border-neutral-200 hover:border-[#ff6f00] rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 overflow-hidden bg-neutral-100">
                    <img
                      src={relArt.image}
                      alt={relArt.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {CATEGORIES.find(c => c.key === relArt.category)?.hindiName || relArt.category}
                    </div>
                  </div>
                  <div className="p-3.5">
                    <h4 className="text-sm font-extrabold text-neutral-900 group-hover:text-[#ff6f00] transition-colors line-clamp-2 leading-snug mb-2 font-sans">
                      {relArt.title}
                    </h4>
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed font-sans mb-3">
                      {relArt.subtitle || relArt.content.substring(0, 80) + "..."}
                    </p>
                  </div>
                </div>
                
                <div className="px-3.5 pb-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-sans bg-neutral-50/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#ff6f00]" />
                    {relArt.date}
                  </span>
                  <span className="text-[#ff6f00] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    पढ़ें <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  );
}
