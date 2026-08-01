import React, { useState, useEffect } from "react";
import { Article, AuthorProfileData } from "../types";
import ArticleCard from "./ArticleCard";
import { ShieldCheck, User, Award, Mail, BookOpen, ArrowLeft, CheckCircle } from "lucide-react";
import { fetchAuthorProfilesClient } from "../lib/newsClient";

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
  const [authorProfile, setAuthorProfile] = useState<AuthorProfileData | null>(null);

  useEffect(() => {
    fetchAuthorProfilesClient().then((profiles) => {
      const match = profiles.find(
        (p) => p.name.trim().toLowerCase() === authorName.trim().toLowerCase()
      );
      if (match) {
        setAuthorProfile(match);
      }
    });
  }, [authorName]);

  const authorArticles = articles.filter(
    (a) => a.author?.trim().toLowerCase() === authorName.trim().toLowerCase()
  );

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
          {authorProfile?.avatar ? (
            <img
              src={authorProfile.avatar}
              alt={authorName}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-amber-500 shadow-md"
            />
          ) : (
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-amber-100 text-amber-800 font-black text-3xl md:text-4xl flex items-center justify-center border-4 border-amber-500 shadow-md">
              {authorName.substring(0, 1)}
            </div>
          )}

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">{authorName}</h1>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                {authorProfile?.badge || "संपादकीय दल (Verified Reporter)"}
              </span>
            </div>

            {authorProfile?.role && (
              <p className="text-amber-700 font-bold text-sm mb-2">{authorProfile.role}</p>
            )}

            {authorProfile?.bio ? (
              <p className="text-neutral-700 text-sm md:text-base leading-relaxed mb-4 max-w-3xl">{authorProfile.bio}</p>
            ) : (
              <p className="text-neutral-500 text-xs md:text-sm italic mb-4 max-w-3xl">
                सारादेश.in रिपोर्टिंग डेस्क से अधिकृत संवाददाता।
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-3 border-t border-neutral-100 text-xs text-neutral-600 font-medium">
              {authorProfile?.experience && (
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>अनुभव: <strong>{authorProfile.experience}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>प्रकाशित लेख: <strong>{authorArticles.length}</strong></span>
              </div>
              {authorProfile?.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-600" />
                  <span>संपर्क: <strong>{authorProfile.email}</strong></span>
                </div>
              )}
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
          {authorName} द्वारा प्रकाशित समाचार व लेख
        </h2>

        {authorArticles.length === 0 ? (
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-8 text-center text-neutral-600">
            इस संवाददाता का कोई समाचार अभी लोड नहीं हुआ है।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorArticles.map((art) => (
              <ArticleCard
                key={art.id}
                article={art}
                onClick={() => onArticleClick(art)}
                onToggleBookmark={() => onBookmarkToggle(art.id)}
                isBookmarked={savedArticleIds.includes(art.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

