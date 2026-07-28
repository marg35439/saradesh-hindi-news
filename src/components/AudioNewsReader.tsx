import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Square, Radio, AlertCircle } from "lucide-react";
import { Article } from "../types";

interface AudioNewsReaderProps {
  article?: Article | null;
  allArticles?: Article[];
  onArticleClick?: (article: Article) => void;
}

export default function AudioNewsReader({ article, allArticles, onArticleClick }: AudioNewsReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [currentText, setCurrentText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [supported, setSupported] = useState(true);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      // Pre-warm voices
      const loadVoices = () => {
        if (synthRef.current) {
          synthRef.current.getVoices();
        }
      };
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    } else {
      setSupported(false);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Stop audio when target article changes
  useEffect(() => {
    stopSpeech();
  }, [article?.id]);

  const getHindiVoice = (): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    return (
      voices.find((v) => v.lang.includes("hi") || v.lang.includes("HI") || v.name.toLowerCase().includes("hindi")) ||
      voices.find((v) => v.lang.startsWith("hi")) ||
      null
    );
  };

  const speakText = (text: string, onEndCallback?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("आपके ब्राउज़र में स्पीच की सुविधा उपलब्ध नहीं है।");
      return;
    }

    const synth = window.speechSynthesis;
    synthRef.current = synth;

    // Immediately update UI states for instant zero-latency visual response
    setIsPlaying(true);
    setIsPaused(false);
    setStatusMessage("खबर पढ़ी जा रही है...");

    // Remove markdown tags, images, URLs and clean text for crystal clear Hindi speech
    const cleanText = text
      .replace(/##\s*/g, "। ")
      .replace(/###\s*/g, "। ")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[IMAGE:.*?\]/g, "")
      .replace(/\[IMG:.*?\]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\n+/g, "। ")
      .trim();

    // Synchronously reset speech queue without setTimeout (fixes browser user-gesture block)
    synth.cancel();
    if (synth.paused) {
      synth.resume();
    }

    // Break text into short sentence chunks (~120-150 chars).
    // Short chunks begin synthesizing instantly (<20ms) instead of waiting for 5000-character buffer
    const rawSentences = cleanText
      .split(/([।!?\n]+)/)
      .filter((s) => s.trim().length > 0);

    const chunks: string[] = [];
    let currentChunk = "";

    for (let i = 0; i < rawSentences.length; i++) {
      const sentence = rawSentences[i];
      if ((currentChunk + sentence).length < 150) {
        currentChunk += sentence;
      } else {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    if (chunks.length === 0) chunks.push(cleanText || "कोई समाचार सामग्री उपलब्ध नहीं है।");

    const hindiVoice = getHindiVoice();

    // Enqueue all chunks synchronously for continuous, immediate playback
    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = "hi-IN";
      utterance.rate = rate;
      utterance.pitch = 1.0;

      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      if (index === 0) {
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
          setStatusMessage("खबर पढ़ी जा रही है...");
        };
      }

      if (index === chunks.length - 1) {
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setStatusMessage("");
          if (onEndCallback) onEndCallback();
        };
      }

      utterance.onerror = (err) => {
        console.warn("Speech synthesis chunk error:", err);
        if (index === chunks.length - 1) {
          setIsPlaying(false);
          setIsPaused(false);
          setStatusMessage("");
        }
      };

      synth.speak(utterance);
    });

    if (synth.paused) {
      synth.resume();
    }
  };

  const handlePlayArticle = () => {
    if (!article) return;
    const fullText = `${article.title}। ${article.subtitle}। ${article.content}`;
    setCurrentText(article.title);
    speakText(fullText);
  };

  const handlePlayBulletins = () => {
    if (!allArticles || allArticles.length === 0) return;
    
    const playNext = (i: number) => {
      if (i >= allArticles.length) {
        setIsPlaying(false);
        setStatusMessage("सभी मुख्य समाचार पूरे हुए।");
        return;
      }
      const target = allArticles[i];
      setCurrentText(target.title);
      if (onArticleClick) onArticleClick(target);

      const textToRead = `मुख्य समाचार: ${target.title}। ${target.subtitle}`;
      speakText(textToRead, () => {
        setTimeout(() => playNext(i + 1), 600);
      });
    };

    playNext(0);
  };

  const pauseSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      synthRef.current = synth;
      synth.pause();
      setIsPaused(true);
      setIsPlaying(false);
      setStatusMessage("ऑडियो रोक दिया गया है।");
    }
  };

  const resumeSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      synthRef.current = synth;

      // Update state for fast UI feedback
      setIsPaused(false);
      setIsPlaying(true);
      setStatusMessage("खबर पढ़ी जा रही है...");

      if (synth.paused) {
        synth.resume();

        // Browser compatibility fallback: Chromium speech engine bug fix
        setTimeout(() => {
          if (synth.paused || !synth.speaking) {
            // If browser resume failed, restart playback smoothly
            if (article) {
              handlePlayArticle();
            } else {
              handlePlayBulletins();
            }
          }
        }, 120);
      } else {
        // Queue was cleared or lost during pause
        if (article) {
          handlePlayArticle();
        } else {
          handlePlayBulletins();
        }
      }
    }
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentText("");
      setStatusMessage("");
    }
  };

  const toggleRate = () => {
    const nextRate = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1;
    setRate(nextRate);
    if (isPlaying && article) {
      const fullText = `${article.title}। ${article.subtitle}। ${article.content}`;
      speakText(fullText);
    }
  };

  if (!supported) return null;

  return (
    <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-orange-950 text-white rounded-2xl p-4 shadow-lg border border-orange-500/30 my-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        <div className="relative w-11 h-11 bg-[#ff6f00] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
          <Radio className="w-6 h-6 text-white animate-pulse" />
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-neutral-900 animate-ping"></span>
          )}
        </div>

        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-orange-500/20 text-orange-300 font-extrabold uppercase px-2 py-0.5 rounded border border-orange-500/30 tracking-wider">
              एआई समाचार वॉइस रेडियो (Audio Reader)
            </span>
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-[#ff6f00] h-full animate-bounce"></span>
                <span className="w-1 bg-amber-400 h-2/3 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 bg-orange-300 h-1/2 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
          </div>

          <h4 className="text-xs md:text-sm font-bold text-neutral-100 truncate">
            {currentText ? `सुन रहे हैं: ${currentText}` : article ? article.title : "दैनिक मुख्य समाचार एआई आवाज़ में सुनें"}
          </h4>

          {statusMessage && (
            <p className="text-[11px] text-amber-300/90 font-mono font-medium animate-pulse">
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* Audio Playback Controls */}
      <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 border-neutral-800 pt-3 md:pt-0">
        <button
          type="button"
          onClick={toggleRate}
          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-mono font-bold border border-neutral-700 transition-colors"
          title="आवाज की गति बदलें"
        >
          {rate}x Speed
        </button>

        {!isPlaying && !isPaused ? (
          <button
            type="button"
            onClick={article ? handlePlayArticle : handlePlayBulletins}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6f00] hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{article ? "यह खबर सुनें" : "टॉप बुलेटिन सुनें"}</span>
          </button>
        ) : isPaused ? (
          <button
            type="button"
            onClick={resumeSpeech}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>फिर से शुरू करें</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={pauseSpeech}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Pause className="w-4 h-4 fill-white" />
            <span>रुकें (Pause)</span>
          </button>
        )}

        {(isPlaying || isPaused) && (
          <button
            type="button"
            onClick={stopSpeech}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-red-950 hover:text-red-400 text-neutral-400 transition-colors border border-neutral-700 cursor-pointer"
            title="बंद करें"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
}
