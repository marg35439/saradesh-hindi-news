import React from "react";

interface AdBannerProps {
  slotType?: "leaderboard" | "in-article" | "sidebar" | "mobile-banner";
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ slotType = "leaderboard", className = "" }) => {
  return (
    <div className={`my-4 overflow-hidden rounded-xl bg-neutral-100 border border-neutral-200/80 p-2 text-center ${className}`}>
      <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1 flex items-center justify-center gap-1">
        <span>—</span>
        <span>विज्ञापन (Advertisement)</span>
        <span>—</span>
      </div>
      <div className="min-h-[90px] flex items-center justify-center text-xs text-neutral-400 font-medium bg-neutral-50/80 rounded border border-dashed border-neutral-300">
        {slotType === "leaderboard" && "गूगल एडेंसेंस लीडरबोर्ड स्पेस (728x90 / Responsive)"}
        {slotType === "in-article" && "इन-आर्टिकल एडसेंस विज्ञापन क्षेत्र (In-Article Ads)"}
        {slotType === "sidebar" && "साइडबार एडसेंस रेक्टेंगल विज्ञापन (300x250)"}
        {slotType === "mobile-banner" && "मोबाइल एडसेंस बैनर (320x100)"}
      </div>
    </div>
  );
};
