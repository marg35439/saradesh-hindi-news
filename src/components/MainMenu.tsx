import React from "react";
import { Search, MapPin, Grid, RefreshCw } from "lucide-react";
import { CATEGORIES, STATES, CategoryKey } from "../types";

interface MainMenuProps {
  selectedCategory: CategoryKey;
  onSelectCategory: (key: CategoryKey) => void;
  selectedState: string;
  onSelectState: (state: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function MainMenu({
  selectedCategory,
  onSelectCategory,
  selectedState,
  onSelectState,
  searchQuery,
  onSearchChange,
}: MainMenuProps) {

  return (
    <div className="bg-[#f8f9fa] border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Navigation row + Search Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-2 md:py-3 select-none">
          
          {/* Scrollable categories menu layout */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap pb-1.5 lg:pb-0 font-sans">
            <span className="text-gray-400 mr-2 lg:flex items-center gap-1 hidden">
              <Grid className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-neutral-500">श्रेणियां:</span>
            </span>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              
              const getCategoryGradient = (key: string) => {
                switch (key) {
                  case "all": return "bg-gradient-to-r from-orange-600 via-amber-500 to-amber-600 text-white shadow-md shadow-orange-500/20";
                  case "national": return "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20";
                  case "state": return "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20";
                  case "sports": return "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20";
                  case "entertainment": return "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20";
                  case "business": return "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20";
                  case "tech": return "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20";
                  case "lifestyle": return "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20";
                  case "international": return "bg-gradient-to-r from-violet-600 to-purple-800 text-white shadow-md shadow-violet-500/20";
                  case "job": return "bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white shadow-md shadow-blue-500/20";
                  case "astrology": return "bg-gradient-to-r from-purple-800 via-fuchsia-800 to-pink-700 text-white shadow-md shadow-purple-500/20";
                  case "schemes": return "bg-gradient-to-r from-emerald-700 via-teal-700 to-green-600 text-white shadow-md shadow-emerald-500/20";
                  default: return "bg-neutral-900 text-white shadow-md";
                }
              };

              const getCategoryBorder = (key: string) => {
                switch (key) {
                  case "national": return "border-l-4 border-l-red-600 text-red-950 hover:bg-red-50";
                  case "state": return "border-l-4 border-l-amber-500 text-amber-950 hover:bg-amber-50";
                  case "sports": return "border-l-4 border-l-emerald-600 text-emerald-950 hover:bg-emerald-50";
                  case "entertainment": return "border-l-4 border-l-purple-600 text-purple-950 hover:bg-purple-50";
                  case "business": return "border-l-4 border-l-blue-600 text-blue-950 hover:bg-blue-50";
                  case "tech": return "border-l-4 border-l-cyan-600 text-cyan-950 hover:bg-cyan-50";
                  case "lifestyle": return "border-l-4 border-l-pink-500 text-pink-950 hover:bg-pink-50";
                  case "international": return "border-l-4 border-l-violet-600 text-violet-950 hover:bg-violet-50";
                  case "job": return "border-l-4 border-l-blue-600 text-blue-950 hover:bg-blue-50";
                  case "astrology": return "border-l-4 border-l-purple-600 text-purple-950 hover:bg-purple-50";
                  case "schemes": return "border-l-4 border-l-emerald-600 text-emerald-950 hover:bg-emerald-50";
                  default: return "border-l-4 border-l-orange-500 text-orange-950 hover:bg-orange-50";
                }
              };

              return (
                <button
                  key={cat.key}
                  onClick={() => onSelectCategory(cat.key)}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tracking-wide transition-all duration-200 cursor-pointer ${
                    active
                      ? `${getCategoryGradient(cat.key)} scale-102 ring-2 ring-white/50`
                      : `bg-white border border-neutral-200/90 ${getCategoryBorder(cat.key)} shadow-2xs`
                  }`}
                >
                  {cat.hindiName}
                </button>
              );
            })}
          </div>

          {/* Search bar layout */}
          <div className="relative flex items-center shrink-0 w-full lg:w-72">
            <input
              type="text"
              placeholder="खबरें खोजें (उदा: इसरो, बजट)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-sm font-sans pl-9 pr-8 py-1.5 outline-none bg-white rounded-lg border border-neutral-300 focus:border-[#ff6f00] focus:ring-1 focus:ring-[#ff6f00] transition-all placeholder:text-gray-400"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 p-1 text-xs text-gray-400 hover:text-gray-600 font-bold focus:outline-none"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* State-specific sub-news sub-ribbon (Toggles only when selectedCategory is "state" OR state news displays are active) */}
        {selectedCategory === "state" && (
          <div className="border-t border-dashed border-neutral-200 py-2.5 animate-fadeIn">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-neutral-500 font-bold mr-2 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#ff6f00]" />
                <span>आपका राज्य चुनें:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {STATES.map((st) => {
                  const active = selectedState === st;
                  return (
                    <button
                      key={st}
                      onClick={() => onSelectState(st)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                        active
                          ? "bg-amber-100 border-[#ff6f00]/40 text-[#ff6f00] font-bold"
                          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
