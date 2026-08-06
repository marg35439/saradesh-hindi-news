import React, { useState, useEffect } from "react";
import { Sun, CloudRain, CloudSun, Cloud, Newspaper, UserCheck, Sunrise, MapPin, Sparkles, Calendar } from "lucide-react";

interface WeatherInfo {
  temp: number;
  text: string;
  icon: string;
}

interface HeaderProps {
  onAdminClick: () => void;
  isAdminMode: boolean;
  onHomeClick: () => void;
}

export default function Header({ onAdminClick, isAdminMode, onHomeClick }: HeaderProps) {
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});
  const [selectedCity, setSelectedCity] = useState<string>("दिल्ली");
  const [currentDateString, setCurrentDateString] = useState<string>("");
  const [panchangString, setPanchangString] = useState<string>("");

  useEffect(() => {
    // Live date string in Hindi
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDateString(new Date().toLocaleDateString('hi-IN', options));

    // Dynamic Hindi Panchang String
    const getHindiPanchang = () => {
      const months = ["चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद", "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन"];
      const tithis = ["प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "पूर्णिमा"];
      const now = new Date();
      const monthIdx = (now.getMonth() + 4) % 12; // Shravan month around July
      const day = now.getDate();
      const tithiName = tithis[(day - 1) % 15];
      const paksha = day <= 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
      const samvat = now.getFullYear() + 57; // Vikram Samvat
      return `पंचांग: ${months[monthIdx]} ${paksha} ${tithiName}, विक्रम संवत ${samvat}`;
    };

    setPanchangString(getHindiPanchang());

    // Live update function for weather
    const updateWeather = () => {
      fetch("/api/weather")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Weather fetch failed");
        })
        .then((data) => setWeatherData(data))
        .catch((err) => console.log("Weather error:", err));
    };

    updateWeather();
    // Poll weather when page is visible (every 3 minutes)
    const weatherInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        updateWeather();
      }
    }, 180000);

    return () => clearInterval(weatherInterval);
  }, []);

  const getWeatherIcon = (name: string) => {
    switch (name) {
      case "Sun":
        return <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />;
      case "CloudRain":
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case "CloudSun":
        return <CloudSun className="w-5 h-5 text-amber-400" />;
      case "Cloud":
        return <Cloud className="w-5 h-5 text-gray-400" />;
      default:
        return <Sun className="w-5 h-5 text-amber-500" />;
    }
  };

  const currWeather = weatherData[selectedCity] || WEATHER_DATA_FALLBACK[selectedCity] || { temp: 40, text: "तेज धूप", icon: "Sun" };

  return (
    <header className="bg-white border-b-4 border-[#ff6f00] shadow-md sticky top-0 z-50 transition-all duration-300">
      {/* Tricolor India Flag Top Accent Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-300 to-emerald-600"></div>

      {/* Upper Bar: Info & Weather & Admin Toggle */}
      <div className="bg-neutral-900 text-neutral-300 text-xs py-1.5 px-4 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          {/* Date & Panchang */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span>{currentDateString}</span>
            </div>
            <span className="text-neutral-600 font-bold">|</span>
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded border border-amber-500/40 text-[11px] shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{panchangString}</span>
            </div>
          </div>

          {/* Weather Widget */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-neutral-800 text-white py-0.5 px-2 rounded-md border border-neutral-700">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer border-none py-0 px-1 text-xs"
              >
                {Object.keys(WEATHER_DATA_FALLBACK).map((city) => (
                  <option key={city} value={city} className="bg-neutral-800 text-white">
                    {city}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 ml-2 border-l border-neutral-600 pl-2">
                {getWeatherIcon(currWeather.icon)}
                <span className="font-bold">{currWeather.temp}°C</span>
                <span className="text-[10px] text-neutral-400 hidden lg:inline">({currWeather.text})</span>
              </div>
            </div>

            {/* Admin Toggle button - Only visible when already in Admin Mode to allow exit */}
            {isAdminMode && (
              <button
                onClick={onAdminClick}
                className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all duration-200 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>यूजर पोर्टल</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Logo and Branding Area */}
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 md:py-3.5 flex items-center justify-center">
        {/* Brand Logo styled exactly like Dainik Bhaskar yellow sun emblem */}
        <div 
          onClick={onHomeClick} 
          className="flex flex-col items-center cursor-pointer select-none group text-center"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Golden sunburst insignia */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-[#ff3d00] via-[#ff9100] to-[#ffea00] rounded-full flex items-center justify-center shadow-md shadow-amber-500/30 transform group-hover:scale-105 transition-transform duration-300 shrink-0">
              {/* Sun rays effect inside using custom border styling */}
              <div className="absolute inset-1 rounded-full border-2 border-dashed border-white/60 animate-spin-slow"></div>
              <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 text-white z-10" />
            </div>
            
            <div className="flex flex-col text-left">
              <h1 className="text-2xl sm:text-3.5xl md:text-4xl font-black tracking-tight text-neutral-900 font-sans leading-none flex items-baseline">
                <span className="text-[#ff6f00]">सारादेश</span>
                <span className="text-neutral-900 ml-0.5">.in</span>
              </h1>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider font-sans mt-0.5">
                <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-blue-600 bg-clip-text text-transparent">
                  सच की सुबह, हौसले की धूप • भारत का नंबर 1 न्यूज़ पोर्टल
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Fallback constant for compiler safety & startup
const WEATHER_DATA_FALLBACK: Record<string, { temp: number; text: string; icon: string }> = {
  "दिल्ली": { temp: 32, text: "साफ व धूप वाला मौसम", icon: "Sun" },
  "मुंबई": { temp: 30, text: "उमस भरा मौसम", icon: "Cloud" },
  "जयपुर": { temp: 33, text: "तेज धूप", icon: "Sun" },
  "भोपाल": { temp: 29, text: "आंशिक रूप से बादल", icon: "CloudSun" },
  "लखनऊ": { temp: 31, text: "हल्की धूप", icon: "Sun" },
  "पटना": { temp: 31, text: "सामान्य मौसम", icon: "CloudSun" },
  "रांची": { temp: 27, text: "मौसम सुहावना", icon: "Cloud" }
};
