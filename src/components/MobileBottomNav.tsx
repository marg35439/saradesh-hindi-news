import React from "react";
import { Home, Radio, Bookmark } from "lucide-react";

interface MobileBottomNavProps {
  onHomeClick: () => void;
  onAudioClick: () => void;
  onBookmarkClick: () => void;
  savedCount: number;
}

export default function MobileBottomNav({
  onHomeClick,
  onAudioClick,
  onBookmarkClick,
  savedCount
}: MobileBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 text-white px-3 py-2 shadow-2xl">
      <div className="flex items-center justify-around text-[10px] font-sans font-bold">
        <button
          onClick={onHomeClick}
          className="flex flex-col items-center gap-1 text-neutral-300 hover:text-[#ff6f00] transition-colors py-1 cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span>होम</span>
        </button>

        <button
          onClick={onAudioClick}
          className="flex flex-col items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors py-1 cursor-pointer"
        >
          <div className="relative">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          </div>
          <span>वॉइस बुलेटिन</span>
        </button>

        <button
          onClick={onBookmarkClick}
          className="flex flex-col items-center gap-1 text-neutral-300 hover:text-[#ff6f00] transition-colors py-1 cursor-pointer relative"
        >
          <Bookmark className="w-5 h-5" />
          <span>सहेजी गई</span>
          {savedCount > 0 && (
            <span className="absolute -top-1 right-2 bg-[#ff6f00] text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full font-extrabold shadow-sm">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
