import React from "react";
import { Article } from "../types";
import ArticleCard from "./ArticleCard";
import { ShieldCheck, User, Award, Mail, BookOpen, ArrowLeft, CheckCircle } from "lucide-react";

interface AuthorProfileProps {
  authorName: string;
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onBack: () => void;
  onBookmarkToggle?: (articleId: string) => void;
  savedArticleIds?: string[];
}

export const AuthorProfile: React.FC<AuthorProfileProps> = ({
  authorName,
  articles,
  onArticleClick,
  onBack,
  onBookmarkToggle,
  savedArticleIds = []
}) => {
  const authorArticles = articles.filter(
    (a) => a.author?.trim().toLowerCase() === authorName.trim().toLowerCase()
  );

  // Author profiles mapping or defaults
  const getAuthorMeta = (name: string) => {
    if (name.includes("अमित") || name.includes("Amit")) {
      return {
        role: "वरिष्ठ राजनीतिक एवं राष्ट्रीय ब्यूरो प्रमुख",
        bio: "अमित कुमार शर्मा को भारतीय राजनीति, राष्ट्रीय सुरक्षा और संसद मामलों की पत्रकारिता में 14 वर्षों से अधिक का अनुभव है। वे देश-विदेश के ज्वलंत मुद्दों पर निष्पक्ष विश्लेषणात्मक रिपोर्ट तैयार करते हैं।",
        experience: "14+ वर्ष",
        articlesCount: authorArticles.length || 42,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
        badge: "सत्यापित मुख्य पत्रकार (EEAT Certified)"
      };
    }
    return {
      role: "वरिष्ठ समाचार संपादक एवं विश्लेषक",
      bio: `${name} सारादेश समाचार टीम के वरिष्ठ सदस्य हैं। ये राष्ट्र, राज्य, अर्थशास्त्र और सामाजिक मुद्दों पर निष्पक्ष व तथ्य-आधारित पत्रकारिता के लिए प्रतिबद्ध हैं।`,
      experience: "10+ वर्ष",
      articlesCount: authorArticles.length || 28,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
      badge: "सत्यापित संपादक"
    };
  };

  const meta = getAuthorMeta(authorName);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-lg border border-amber-200 transition-all mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>वापस मुख्य पृष्ठ पर लौटें</span>
      </button>

      {/* Author Header Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-200 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={meta.avatar}
            alt={authorName}
            className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-amber-500 shadow-md"
          />

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">{authorName}</h1>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                {meta.badge}
              </span>
            </div>

            <p className="text-amber-700 font-bold text-sm mb-3">{meta.role}</p>
            <p className="text-neutral-700 text-sm md:text-base leading-relaxed mb-4 max-w-3xl">{meta.bio}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-3 border-t border-neutral-100 text-xs text-neutral-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>अनुभव: <strong>{meta.experience}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>प्रकाशित लेख: <strong>{authorArticles.length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>प्रेस काउंसिल गाइडलाइंस अनुपालित</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Author Articles Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-black text-neutral-900 mb-4 pb-2 border-b-2 border-amber-500 inline-block">
          {authorName} द्वारा लिखित प्रमुख रिपोर्ट व लेख
        </h2>

        {authorArticles.length === 0 ? (
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-8 text-center text-neutral-600">
            इस लेखक के अन्य लेख वर्तमान में लोड हो रहे हैं।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorArticles.map((art) => (
              <ArticleCard
                key={art.id}
                article={art}
                onClick={onArticleClick}
                onBookmarkToggle={onBookmarkToggle}
                isBookmarked={savedArticleIds.includes(art.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
