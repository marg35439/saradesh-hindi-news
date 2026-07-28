import React from "react";
import { X, Bookmark, Trash2, ArrowRight, Newspaper } from "lucide-react";
import { Article } from "../types";

interface SavedArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedArticles: Article[];
  onArticleClick: (article: Article) => void;
  onRemoveBookmark: (articleId: string) => void;
  onClearAll: () => void;
}

export default function SavedArticlesModal({
  isOpen,
  onClose,
  savedArticles,
  onArticleClick,
  onRemoveBookmark,
  onClearAll
}: SavedArticlesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-slide-left">
        
        {/* Modal Header */}
        <div className="bg-neutral-900 text-white p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff6f00] flex items-center justify-center text-white shadow-sm">
              <Bookmark className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">सहेजे गए समाचार (Saved News)</h3>
              <p className="text-[10px] text-neutral-400 font-sans">ऑफलाइन या बाद में पढ़ने के लिए सहेजे गए आलेख</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedArticles.length === 0 ? (
            <div className="py-24 text-center space-y-3 text-neutral-400 font-sans">
              <Newspaper className="w-12 h-12 text-neutral-200 mx-auto" />
              <p className="text-xs font-bold text-neutral-600">कोई सहेजी गई खबर नहीं है</p>
              <p className="text-[10px] text-neutral-400 max-w-xs mx-auto">
                खबर कार्ड पर बने बुकमार्क (🔖) आइकॉन पर क्लिक करके खबरों को बाद में पढ़ने के लिए सहेजें।
              </p>
            </div>
          ) : (
            savedArticles.map((art) => (
              <div
                key={art.id}
                className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-orange-300 rounded-xl p-3 flex gap-3 transition-all group shadow-2xs"
              >
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-20 h-20 rounded-lg object-cover bg-neutral-200 shrink-0"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-[#ff6f00] uppercase bg-orange-50 px-1.5 py-0.5 rounded">
                      {art.category}
                    </span>
                    <h4
                      onClick={() => {
                        onArticleClick(art);
                        onClose();
                      }}
                      className="text-xs font-bold text-neutral-900 line-clamp-2 mt-1 cursor-pointer group-hover:text-[#ff6f00] transition-colors"
                    >
                      {art.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-1 mt-1 text-[10px] text-neutral-400">
                    <span>{art.date}</span>
                    <button
                      onClick={() => onRemoveBookmark(art.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 font-sans font-bold flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>हटाएं</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        {savedArticles.length > 0 && (
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-600">कुल: {savedArticles.length} आलेख</span>
            <button
              onClick={onClearAll}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
            >
              सभी साफ करें (Clear All)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
