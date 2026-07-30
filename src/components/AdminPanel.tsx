import React, { useState, useEffect } from "react";
import { Sparkles, Send, Trash2, Edit2, Plus, BookOpen, AlertCircle, RefreshCw, BarChart2, Eye, Heart, MessageSquare, Lock, Unlock, LogOut, Upload, Clipboard, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { Article, CATEGORIES, STATES } from "../types";
import { fetchNewsList, saveArticleClient, deleteArticleClient } from "../lib/newsClient";

// Helper function to compress images before storing to keep database and UI light & fast
const compressImageFile = (file: File, maxWidth = 1000, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve((reader.result as string) || "");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve((reader.result as string) || "");
      img.src = (e.target?.result as string) || "";
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

// Extract inline markdown images for admin preview gallery
const extractInlineImages = (text: string) => {
  const images: { url: string; caption: string; rawMatch: string }[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes("![") && trimmed.includes("](") && trimmed.includes(")")) {
      const altStart = trimmed.indexOf("![") + 2;
      const altEnd = trimmed.indexOf("](", altStart);
      if (altEnd > altStart) {
        const caption = trimmed.substring(altStart, altEnd).trim();
        const urlStart = altEnd + 2;
        const urlEnd = trimmed.lastIndexOf(")");
        if (urlEnd > urlStart) {
          const url = trimmed.substring(urlStart, urlEnd).trim();
          if (url) {
            images.push({ url, caption, rawMatch: line });
          }
        }
      }
    }
  }
  return images;
};

// Smart Parser for Bulk Pasted News Articles
const parseBatchNewsText = (text: string) => {
  if (!text.trim()) return [];

  // Split text into blocks by looking for number prefixes like 1. or 1: or [1] or खबर 1 or --- or decorative lines
  const rawBlocks = text
    .split(/\n\s*(?:(?:[0-9]+|[\u0966-\u096F]+)[\.\:\)]|\[[0-9]+\]|खबर\s*[0-9]+|न्यूज\s*[0-9]+|News\s*[0-9]+|Article\s*[0-9]+|---|\={3,}|_{3,}|\*{3,})\s*/i)
    .map(b => b.trim())
    .filter(Boolean);

  let blocksToProcess = rawBlocks;
  if (blocksToProcess.length <= 1) {
    // Fallback: split by 3 or more newlines
    blocksToProcess = text.split(/\n\s*\n\s*\n/).map(b => b.trim()).filter(Boolean);
  }
  if (blocksToProcess.length <= 1) {
    // Fallback: split by 2 newlines
    blocksToProcess = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  }

  return blocksToProcess.map((block, idx) => {
    // Filter out decorative divider lines (e.g., lines made only of dashes, equals, underscores, asterisks)
    const lines = block
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0 && !/^[\-\=\_\*\~\#\s]{3,}$/.test(l));

    let title = "";
    let subtitle = "";
    let content = "";
    let tags: string[] = [];
    let metaDescription = "";

    let currentField: 'title' | 'subtitle' | 'content' | 'tags' | 'metaDescription' | null = null;
    let explicitLabelsFound = false;

    for (const line of lines) {
      // Key label matchers
      const titleMatch = line.match(/^(?:title|heading|शीर्षक|हेडिंग|मुख्य\s*शीर्षक)[\.\:\=]\s*(.*)$/i);
      const subtitleMatch = line.match(/^(?:sub\s*title|subtitle|sub-title|sub\s*heading|subheading|उपशीर्षक|सबटाइटल|सब\s*टाइटल|सब\s*हेडिंग)[\.\:\=]\s*(.*)$/i);
      const detailMatch = line.match(/^(?:detail\s*news|detail|description|content|विवरण|खबर|समाचार|विस्तार|विस्तृत\s*खबर|मुख्य\s*समाचार)[\.\:\=]\s*(.*)$/i);
      const tagsMatch = line.match(/^(?:tags|tag|keywords|keyword|टैग्स|टैग|कीवर्ड्स|कीवर्ड)[\.\:\=]\s*(.*)$/i);
      const metaMatch = line.match(/^(?:meta\s*description|meta|मेटा\s*डिस्क्रिप्शन|मेटा\s*विवरण|मेटा)[\.\:\=]\s*(.*)$/i);

      if (titleMatch) {
        explicitLabelsFound = true;
        currentField = 'title';
        title = titleMatch[1].trim();
      } else if (subtitleMatch) {
        explicitLabelsFound = true;
        currentField = 'subtitle';
        subtitle = subtitleMatch[1].trim();
      } else if (detailMatch) {
        explicitLabelsFound = true;
        currentField = 'content';
        const val = detailMatch[1].trim();
        if (val) content = val;
      } else if (tagsMatch) {
        explicitLabelsFound = true;
        currentField = 'tags';
        const rawTags = tagsMatch[1].trim();
        if (rawTags) {
          tags = rawTags.split(/[\,\s\#]+/).map(t => t.trim()).filter(Boolean);
        }
      } else if (metaMatch) {
        explicitLabelsFound = true;
        currentField = 'metaDescription';
        metaDescription = metaMatch[1].trim();
      } else {
        if (explicitLabelsFound && currentField) {
          if (currentField === 'title') {
            title += (title ? " " : "") + line;
          } else if (currentField === 'subtitle') {
            subtitle += (subtitle ? " " : "") + line;
          } else if (currentField === 'content') {
            content += (content ? "\n\n" : "") + line;
          } else if (currentField === 'metaDescription') {
            metaDescription += (metaDescription ? " " : "") + line;
          } else if (currentField === 'tags') {
            const extra = line.split(/[\,\s\#]+/).map(t => t.trim()).filter(Boolean);
            tags.push(...extra);
          }
        }
      }
    }

    // Fallback if no explicit labels were used in the block:
    if (!explicitLabelsFound) {
      title = lines[0] || `समाचार #${idx + 1}`;
      title = title.replace(/^(?:[0-9]+|[\u0966-\u096F]+)[\.\:\)]\s*/, '').replace(/^(?:शीर्षक|Heading|Title|खबर|न्यूज)[\.\:\)]?\s*/i, '');

      let contentStartIdx = 1;
      if (lines.length > 1) {
        if (
          lines[1].toLowerCase().startsWith("सबटाइटल") || 
          lines[1].toLowerCase().startsWith("उप-शीर्षक") || 
          lines[1].toLowerCase().startsWith("sub") || 
          (lines[1].length < 120 && lines.length > 2)
        ) {
          subtitle = lines[1].replace(/^(?:सबटाइटल|उप-शीर्षक|Subtitle|Sub)[\.\:\)]?\s*/i, '');
          contentStartIdx = 2;
        }
      }

      const contentLines = lines.slice(contentStartIdx);
      content = contentLines.join("\n\n");
      if (!content) content = title;

      // Extract tags if present at end
      const tagMatch = content.match(/(?:टैग|टैग्स|Tags)\s*[\:\=]\s*(.+)$/im);
      if (tagMatch) {
        tags = tagMatch[1].split(/[\,\s\#]+/).map(t => t.trim()).filter(Boolean);
        content = content.replace(/(?:टैग|टैग्स|Tags)\s*[\:\=]\s*.+$/im, '').trim();
      } else {
        const hashTags = content.match(/#[^\s#]+/g);
        if (hashTags) {
          tags = hashTags.map(t => t.replace('#', ''));
        }
      }

      // Extract meta description if present
      const metaMatch = content.match(/(?:मेटा\s*विवरण|मेटा\s*डिस्क्रिप्शन|मेटा|Meta\s*description|Meta)\s*[\:\=]\s*(.+)$/im);
      if (metaMatch) {
        metaDescription = metaMatch[1].trim();
        content = content.replace(/(?:मेटा\s*विवरण|मेटा\s*डिस्क्रिप्शन|मेटा|Meta\s*description|Meta)\s*[\:\=]\s*.+$/im, '').trim();
      }
    }

    // Clean any remaining decorative separator lines inside content or metaDescription
    content = content.replace(/^[\-\=\_\*\~\#\s]{3,}$/gm, '').trim();
    metaDescription = metaDescription.replace(/^[\-\=\_\*\~\#\s]{3,}$/gm, '').trim();

    // Auto detect category from text
    let category = "national";
    const lowerFull = (title + " " + content).toLowerCase();
    if (lowerFull.includes("नौकरी") || lowerFull.includes("सर्कल") || lowerFull.includes("भर्ती") || lowerFull.includes("sarkari result") || lowerFull.includes("ssc") || lowerFull.includes("job") || lowerFull.includes("vacancy")) {
      category = "jobs";
    } else if (lowerFull.includes("राशिफल") || lowerFull.includes("ज्योतिष") || lowerFull.includes("ग्रह") || lowerFull.includes("मेष") || lowerFull.includes("सिंह") || lowerFull.includes("astro")) {
      category = "astrology";
    } else if (lowerFull.includes("योजना") || lowerFull.includes("किसान") || lowerFull.includes("पेंशन") || lowerFull.includes("सब्सिडी") || lowerFull.includes("गवर्नमेंट स्कीम") || lowerFull.includes("स्कीम")) {
      category = "schemes";
    } else if (lowerFull.includes("मैच") || lowerFull.includes("क्रिकेट") || lowerFull.includes("खेल") || lowerFull.includes("ओलंपिक") || lowerFull.includes("ipl") || lowerFull.includes("sports")) {
      category = "sports";
    } else if (lowerFull.includes("फिल्म") || lowerFull.includes("बॉलीवुड") || lowerFull.includes("सिनेमा") || lowerFull.includes("अभिनेता") || lowerFull.includes("अभिनेत्री") || lowerFull.includes("actor")) {
      category = "entertainment";
    } else if (lowerFull.includes("शेयर") || lowerFull.includes("स्टॉक") || lowerFull.includes("मार्केट") || lowerFull.includes("सोना") || lowerFull.includes("बैंक") || lowerFull.includes("जीएसटी")) {
      category = "business";
    } else if (lowerFull.includes("मोबाइल") || lowerFull.includes("स्मार्टफोन") || lowerFull.includes("टेक्नोलॉजी") || lowerFull.includes("आईफोन") || lowerFull.includes("ऐप")) {
      category = "tech";
    }

    if (!subtitle) {
      subtitle = content.length > 100 ? content.substring(0, 100) + "..." : content;
    }

    return {
      id: `batch-art-${Date.now()}-${idx}`,
      title,
      subtitle,
      content,
      category,
      state: "",
      author: "सारादेश.in विशेष टीम",
      tags: tags.length > 0 ? tags : ["मुख्य समाचार", "सारादेश"],
      metaDescription: metaDescription || undefined,
      checked: true,
      assignedImageIndex: idx
    };
  });
};

export default function AdminPanel() {
  // Authentication states
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("bhaskar_admin_auth") === "true";
  });
  const [authError, setAuthError] = useState("");

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "create" | "insights" | "login" | "compiler" | "urlScraper" | "screenshot" | "batch">("list");
  
  // Bulk Batch Importer & Photo Matcher States
  const [batchNewsText, setBatchNewsText] = useState("");
  const [batchImages, setBatchImages] = useState<{ id: string; url: string; fileName: string; fileNumber: number }[]>([]);
  const [batchArticles, setBatchArticles] = useState<any[]>([]);
  const [publishingBatch, setPublishingBatch] = useState(false);
  const [batchError, setBatchError] = useState("");
  
  // AI Screenshot news generator States
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [processingScreenshot, setProcessingScreenshot] = useState(false);
  const [screenshotArticles, setScreenshotArticles] = useState<any[]>([]);
  const [screenshotError, setScreenshotError] = useState("");
  const [publishingScreenshot, setPublishingScreenshot] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // URL AI Scraper States
  const [urlInput, setUrlInput] = useState("");
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [scrapedUrlArticles, setScrapedUrlArticles] = useState<any[]>([]);
  const [urlScrapedError, setUrlScrapedError] = useState("");
  const [publishingUrlArticles, setPublishingUrlArticles] = useState(false);

  // Raw material compiler states
  const [rawText, setRawText] = useState("");
  const [compilingRaw, setCompilingRaw] = useState(false);
  const [compiledArticles, setCompiledArticles] = useState<any[]>([]);
  const [compilerError, setCompilerError] = useState("");
  const [publishingCompiled, setPublishingCompiled] = useState(false);
  
  // Form States
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("national");
  const [stateName, setStateName] = useState("");
  const [image, setImage] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  
  // Inline image insertion inside article content
  const [inlineImgUrl, setInlineImgUrl] = useState("");
  const [inlineImgCaption, setInlineImgCaption] = useState("");

  // Editing article reference
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // AI assistant prompt state
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiStatusText, setAiStatusText] = useState("");
  const [aiError, setAiError] = useState("");

  // Today Top-10 mass publisher states
  const [publishing10, setPublishing10] = useState(false);
  const [publish10Status, setPublish10Status] = useState("");

  // Reassuring messages array while Gemini is writing
  const reassuringMessages = [
    "सारादेश.in शैली में समाचार की रूपरेखा तैयार की जा रही है...",
    "रोमांचक शीर्षक और सारांश का लेखन चालू है...",
    "सटीक हिंदी शब्दों और वरिष्ठ संपादक के लहजे का समायोजन जारी है...",
    "खबर से संबंधित उपयुक्त stock फोटो खोज संकेत (Image prompts) जोड़े जा रहे हैं...",
    "बस कुछ ही पल... आपका प्रीमियम लेख लगभग तैयार है!"
  ];

  useEffect(() => {
    if (isAuthenticated) {
      loadArticles();
    }
  }, [isAuthenticated]);

  const loadArticles = () => {
    setLoading(true);
    fetchNewsList()
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) return;
    setScrapingUrl(true);
    setUrlScrapedError("");
    setScrapedUrlArticles([]);
    try {
      const response = await fetch("/api/gemini/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "यूआरएल से खबरें स्क्रैप करने में विफलता।");
      
      const mapped = (data.articles || []).map((art: any, i: number) => ({
        ...art,
        id: `scraped-url-${Date.now()}-${i}`,
        selected: true
      }));
      setScrapedUrlArticles(mapped);
    } catch (err: any) {
      console.error(err);
      setUrlScrapedError(err.message || "यूआरएल स्क्रैपर से रिस्पॉन्स प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setScrapingUrl(false);
    }
  };

  const handlePublishUrlArticles = async () => {
    const selectedArticles = scrapedUrlArticles.filter(art => art.selected);
    if (selectedArticles.length === 0) {
      alert("कृपया पब्लिश करने के लिए कम से कम एक समाचार का चयन करें।");
      return;
    }
    setPublishingUrlArticles(true);
    try {
      let successCount = 0;
      for (const art of selectedArticles) {
        const res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: art.title,
            subtitle: art.subtitle,
            content: art.content,
            category: art.category,
            state: art.state || undefined,
            image: art.image,
            author: art.author,
            tags: art.tags,
            isBreaking: false,
            isFeatured: false,
            isTrending: true
          })
        });
        if (res.ok) {
          successCount++;
        }
      }
      alert(`सफलतापूर्वक ${successCount} नई खबरें वेबसाइट पर सही केटेगरी के अंतर्गत लाइव पब्लिश कर दी गई हैं!`);
      setScrapedUrlArticles([]);
      setUrlInput("");
      loadArticles();
      setActiveTab("list");
    } catch (err: any) {
      console.error(err);
      alert("खबरें प्रकाशित करते समय समस्या आई: " + err.message);
    } finally {
      setPublishingUrlArticles(false);
    }
  };

  const toggleUrlArticleSelect = (id: string) => {
    setScrapedUrlArticles(prev => prev.map(art => art.id === id ? { ...art, selected: !art.selected } : art));
  };

  const toggleAllUrlArticles = (select: boolean) => {
    setScrapedUrlArticles(prev => prev.map(art => ({ ...art, selected: select })));
  };

  // AI Screenshot Upload & Parsing Handlers
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessScreenshot = async () => {
    if (!screenshotPreview) return;
    setProcessingScreenshot(true);
    setScreenshotError("");
    setScreenshotArticles([]);
    try {
      const response = await fetch("/api/gemini/compile-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: screenshotPreview })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "स्क्रीनशॉट विश्लेषण विफल रहा।");
      
      const articles = (data.articles || []).map((art: any, index: number) => ({
        ...art,
        id: `screenshot-art-${index}`,
        checked: true
      }));
      setScreenshotArticles(articles);
    } catch (err: any) {
      console.error(err);
      setScreenshotError(err.message || "स्क्रीनशॉट से खबरें तैयार करने में त्रुटि आई।");
    } finally {
      setProcessingScreenshot(false);
    }
  };

  const toggleScreenshotArticleSelect = (id: string) => {
    setScreenshotArticles(prev =>
      prev.map(art => (art.id === id ? { ...art, checked: !art.checked } : art))
    );
  };

  const toggleAllScreenshotArticles = (select: boolean) => {
    setScreenshotArticles(prev =>
      prev.map(art => ({ ...art, checked: select }))
    );
  };

  const handleScreenshotArticleFieldChange = (id: string, field: string, value: any) => {
    setScreenshotArticles(prev =>
      prev.map(art => (art.id === id ? { ...art, [field]: value } : art))
    );
  };

  const handlePublishScreenshotArticles = async () => {
    const selectedArticles = screenshotArticles.filter(art => art.checked);
    if (selectedArticles.length === 0) {
      alert("कृपया पब्लिश करने के लिए कम से कम एक खबर का चयन करें।");
      return;
    }

    setPublishingScreenshot(true);
    try {
      let successCount = 0;
      for (const art of selectedArticles) {
        const res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: art.title,
            subtitle: art.subtitle,
            content: art.content,
            category: art.category,
            state: art.state || undefined,
            image: art.image,
            author: art.author,
            tags: art.tags,
            isBreaking: false,
            isFeatured: false,
            isTrending: true
          })
        });
        if (res.ok) {
          successCount++;
        }
      }
      alert(`सफलतापूर्वक ${successCount} नई खबरें साइट पर सही तरीके से कैटोगरी वाइज पब्लिश कर दी गई हैं!`);
      setScreenshotArticles([]);
      setScreenshotFile(null);
      setScreenshotPreview(null);
      
      // Reload normal list as well
      loadArticles();
      setActiveTab("list");
    } catch (err: any) {
      console.error(err);
      alert("खबरें प्रकाशित करते समय कुछ समस्या आई: " + err.message);
    } finally {
      setPublishingScreenshot(false);
    }
  };

  const handleCompileRaw = async () => {
    if (!rawText.trim()) return;
    setCompilingRaw(true);
    setCompilerError("");
    setCompiledArticles([]);
    try {
      const response = await fetch("/api/gemini/compile-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawMaterial: rawText })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "कंपाइलेशन विफल रहा।");
      setCompiledArticles(data.articles || []);
    } catch (err: any) {
      console.error(err);
      setCompilerError(err.message || "एआई कम्पाईलर कनेक्ट करने में कोई समस्या हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setCompilingRaw(false);
    }
  };

  const handlePublishCompiled = async () => {
    if (compiledArticles.length === 0) return;
    setPublishingCompiled(true);
    try {
      let successCount = 0;
      for (const art of compiledArticles) {
        const res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: art.title,
            subtitle: art.subtitle,
            content: art.content,
            category: art.category,
            state: art.state || undefined,
            image: art.image,
            author: art.author,
            tags: art.tags,
            isBreaking: false,
            isFeatured: false,
            isTrending: true
          })
        });
        if (res.ok) {
          successCount++;
        }
      }
      alert(`सफलतापूर्वक ${successCount} नई खबरें साइट पर पब्लिश कर दी गई हैं!`);
      setCompiledArticles([]);
      setRawText("");
      loadArticles();
      setActiveTab("list");
    } catch (err: any) {
      console.error(err);
      alert("प्रकाशन के दौरान कुछ समस्या आई: " + err.message);
    } finally {
      setPublishingCompiled(false);
    }
  };

  // Bulk Batch Importer & Photo Matcher Handlers
  const handleBatchImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: { id: string; url: string; fileName: string; fileNumber: number }[] = [];
    const existingCount = batchImages.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const compressedUrl = await compressImageFile(file, 1000, 0.75);
      newImages.push({
        id: `batch-img-${Date.now()}-${i}`,
        url: compressedUrl,
        fileName: file.name,
        fileNumber: existingCount + i + 1
      });
    }

    setBatchImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveBatchImage = (id: string) => {
    setBatchImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      return filtered.map((img, idx) => ({ ...img, fileNumber: idx + 1 }));
    });
  };

  const handleMixBatch = () => {
    setBatchError("");
    if (!batchNewsText.trim()) {
      setBatchError("कृपया पहले खबरें (टेक्स्ट) पेस्ट करें।");
      return;
    }

    const parsed = parseBatchNewsText(batchNewsText);
    if (parsed.length === 0) {
      setBatchError("खबरों के टेक्स्ट से कोई समाचार विच्छेदित नहीं हो पाया। कृपया अलग-अलग नंबर लगाकर फिर से पेस्ट करें।");
      return;
    }

    // Pair photos sequentially or default
    const articlesWithImages = parsed.map((art, idx) => {
      let selectedImgUrl = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
      if (batchImages.length > 0) {
        const imgIndex = idx % batchImages.length;
        selectedImgUrl = batchImages[imgIndex].url;
      }
      return {
        ...art,
        assignedImageIndex: batchImages.length > 0 ? (idx % batchImages.length) : -1,
        image: selectedImgUrl
      };
    });

    setBatchArticles(articlesWithImages);
  };

  const handleBatchArticleFieldChange = (id: string, field: string, value: any) => {
    setBatchArticles(prev =>
      prev.map(art => {
        if (art.id !== id) return art;
        const updated = { ...art, [field]: value };
        if (field === "assignedImageIndex") {
          const imgIdx = Number(value);
          if (imgIdx >= 0 && imgIdx < batchImages.length) {
            updated.image = batchImages[imgIdx].url;
          }
        }
        return updated;
      })
    );
  };

  const handleShiftBatchArticleImage = (id: string, direction: "up" | "down") => {
    setBatchArticles(prev =>
      prev.map(art => {
        if (art.id !== id) return art;
        let currentIndex = art.assignedImageIndex >= 0 ? art.assignedImageIndex : 0;
        let newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0) newIndex = batchImages.length - 1;
        if (newIndex >= batchImages.length) newIndex = 0;

        return {
          ...art,
          assignedImageIndex: newIndex,
          image: batchImages[newIndex] ? batchImages[newIndex].url : art.image
        };
      })
    );
  };

  const toggleBatchArticleSelect = (id: string) => {
    setBatchArticles(prev =>
      prev.map(art => (art.id === id ? { ...art, checked: !art.checked } : art))
    );
  };

  const toggleAllBatchArticles = (select: boolean) => {
    setBatchArticles(prev => prev.map(art => ({ ...art, checked: select })));
  };

  const handlePublishBatchArticles = async () => {
    const selectedArticles = batchArticles.filter(art => art.checked);
    if (selectedArticles.length === 0) {
      alert("कृपया पब्लिश करने के लिए कम से कम एक समाचार का चयन करें।");
      return;
    }

    setPublishingBatch(true);
    try {
      let successCount = 0;
      for (const art of selectedArticles) {
        const tagList = Array.isArray(art.tags) 
          ? art.tags 
          : (typeof art.tags === "string" ? art.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : ["मुख्य समाचार"]);

        const res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: art.title,
            subtitle: art.subtitle,
            content: art.content,
            category: art.category,
            state: art.state || undefined,
            image: art.image,
            author: art.author,
            tags: tagList,
            metaDescription: art.metaDescription || undefined,
            isBreaking: false,
            isFeatured: false,
            isTrending: true
          })
        });
        if (res.ok) {
          successCount++;
        }
      }
      alert(`सफलतापूर्वक ${successCount} नई खबरें सही-सही फोटो एवं श्रेणी के साथ लाइव पब्लिश कर दी गई हैं!`);
      setBatchArticles([]);
      setBatchNewsText("");
      setBatchImages([]);
      loadArticles();
      setActiveTab("list");
    } catch (err: any) {
      console.error(err);
      alert("खबरें प्रकाशित करते समय कुछ समस्या आई: " + err.message);
    } finally {
      setPublishingBatch(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passwordInput.trim();
    if (cleanPass === "admin" || cleanPass === "bhaskar123") {
      localStorage.setItem("bhaskar_admin_auth", "true");
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("गलत पासवर्ड! कृपया सही एडमिन क्रैडेंशियल दर्ज करें।");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bhaskar_admin_auth");
    setIsAuthenticated(false);
    setPasswordInput("");
    setAuthError("");
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAI(true);
    setAiError("");
    setAiStatusText(reassuringMessages[0]);

    // Fast interval updating status text
    let statusIndex = 1;
    const interval = setInterval(() => {
      setAiStatusText(reassuringMessages[statusIndex]);
      statusIndex = (statusIndex + 1) % reassuringMessages.length;
    }, 4500);

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, category, state: stateName })
      });
      const data = await res.json();
      
      clearInterval(interval);
      
      if (!res.ok) {
        throw new Error(data.error || "AI generation failed");
      }

      // Populate form fields with the generated draft
      setTitle(data.title || "");
      setSubtitle(data.subtitle || "");
      setContent(data.content || "");
      setCategory(data.category || category);
      setStateName(stateName || "");
      setAuthor(data.author || "सारादेश.in एआई रिपोर्टर");
      setTags(data.tags ? data.tags.join(", ") : "");
      
      // Select beautiful Unsplash image corresponding to keyword to make it premium
      const query = encodeURIComponent(data.imageKeyword || "breaking news");
      setImage(`https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80`);

      setAiPrompt("");
      setGeneratingAI(false);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setAiError(err.message || "एआई समाचार संकलन विफल रहा।");
      setGeneratingAI(false);
    }
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      title,
      subtitle,
      content,
      category,
      state: stateName || undefined,
      image: image || undefined,
      author,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      metaDescription: metaDescription.trim() || undefined,
      isBreaking,
      isFeatured,
      isTrending
    };

    saveArticleClient(payload)
      .then(() => {
        resetForm();
        loadArticles();
        setActiveTab("list");
      })
      .catch((err) => console.error("Save error:", err));
  };

  const handleEdit = (art: Article) => {
    setEditingId(art.id);
    setTitle(art.title);
    setSubtitle(art.subtitle);
    setContent(art.content);
    setCategory(art.category);
    setStateName(art.state || "");
    setImage(art.image);
    setAuthor(art.author);
    setTags(art.tags ? art.tags.join(", ") : "");
    setMetaDescription(art.metaDescription || "");
    setIsBreaking(!!art.isBreaking);
    setIsFeatured(!!art.isFeatured);
    setIsTrending(!!art.isTrending);
    
    setActiveTab("create");
  };

  const handleDelete = (id: string) => {
    deleteArticleClient(id)
      .then(() => {
        loadArticles();
        setDeleteConfirmId(null);
      })
      .catch((err) => console.error(err));
  };

  const handleInsertInlineImage = (urlToUse?: string, captionToUse?: string) => {
    const targetUrl = urlToUse || inlineImgUrl;
    const targetCaption = captionToUse !== undefined ? captionToUse : inlineImgCaption;

    if (!targetUrl.trim()) {
      alert("कृपया फ़ोटो का यूआरएल दर्ज करें या फ़ाइल अपलोड करें।");
      return;
    }

    const tag = `\n\n![${targetCaption.trim() || "समाचार चित्र"}](${targetUrl.trim()})\n\n`;
    setContent((prev) => prev + tag);
    setInlineImgUrl("");
    setInlineImgCaption("");
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setContent("");
    setCategory("national");
    setStateName("");
    setImage("");
    setAuthor("");
    setTags("");
    setMetaDescription("");
    setIsBreaking(false);
    setIsFeatured(false);
    setIsTrending(false);
    setInlineImgUrl("");
    setInlineImgCaption("");
  };

  const totalViews = articles.reduce((sum, current) => sum + (current.views || 0), 0);
  const totalLikes = articles.reduce((sum, current) => sum + (current.likes || 0), 0);
  const totalComments = articles.reduce((sum, current) => sum + (current.comments?.length || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-md"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#ff6f00]/10 text-[#ff6f00] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#ff6f00]/20">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">एडमिन सुरक्षा प्रमाणीकरण</h2>
            <p className="text-xs text-neutral-500 mt-2 font-sans">
              यह विभाग केवल अधिकृत संपादकों और एडमिन के लिए है। आगे बढ़ने के लिए कृपया एडमिन पासवर्ड दर्ज करें।
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 font-sans">एडमिन पासवर्ड (Security Code):</label>
              <input
                type="password"
                required
                placeholder="पासवर्ड दर्ज करें..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-sm p-3 rounded-xl bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none tracking-widest text-center font-mono"
              />
            </div>

            {authError && (
              <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2 font-sans animate-bounce">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#ff6f00] hover:bg-amber-600 text-white font-extrabold rounded-xl transition-colors cursor-pointer text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/15 font-sans"
            >
              <Unlock className="w-4 h-4" />
              <span>कंट्रोल पैनल खोलें (Unlock Panel)</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
            <div className="inline-block px-3 py-1.5 rounded-lg bg-neutral-50 border text-[10px] text-neutral-400 font-sans font-medium">
              🔒 सुरक्षित कूटलेखन एन्क्रिप्शन सक्रिय है • सारादेश समाचार कंट्रोल विभाग
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5 mb-6'>
        <div>
          <div className='flex items-center gap-1.5 text-neutral-900 font-black text-lg md:text-xl'>
            <span className='w-3 h-5 bg-[#ff6f00] rounded-xs inline-block'></span>
            <span>अखबार एडमिन कंट्रोल विज़ार्ड</span>
          </div>
          <p className='text-xs text-neutral-400 mt-1 font-sans'>
            आज दिनांक 21 मई 2026: समाचारों का सम्पादन, एआई सामग्री संकलन एवं विश्लेषिकी पैनल
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={handleLogout}
            className='flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-600 border border-neutral-200 cursor-pointer transition-colors'
            title='वर्तमान सत्र समाप्त करें'
          >
            <LogOut className='w-4 h-4' />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center border-b border-neutral-200 mb-6 gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "list"
              ? "border-[#ff6f00] text-[#ff6f00]"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          📰 समाचार सूची ({articles.length})
        </button>
        <button
          onClick={() => {
            resetForm();
            setActiveTab("create");
          }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "create"
              ? "border-[#ff6f00] text-[#ff6f00]"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          ➕ नया समाचार (मैनुअल/एआई लेखक)
        </button>
        <button
          onClick={() => setActiveTab("batch")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "batch"
              ? "border-[#ff6f00] text-[#ff6f00]"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          🔀 बल्क न्यूज़ + फोटो मिक्सर
        </button>
        <button
          onClick={() => setActiveTab("compiler")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "compiler"
              ? "border-[#ff6f00] text-[#ff6f00]"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          ✍️ रॉ मटेरियल एआई कम्पाईलर
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "insights"
              ? "border-[#ff6f00] text-[#ff6f00]"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          📊 पोर्टल डेटा एवं इनसाइट्स
        </button>
        <button
          onClick={() => setActiveTab("urlScraper")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "urlScraper"
              ? "border-[#ff6f00] text-[#ff6f00]"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          🔗 एआई यूआरएल स्क्रैपर 
        </button>
        <button
          onClick={() => setActiveTab("screenshot")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "screenshot"
              ? "border-[#ff6f00] text-[#ff6f00]"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          📸 स्क्रीनशॉट से समाचार एआई
        </button>
      </div>

      {/* TAB CONTENT: NEWS LIST */}
      {activeTab === "list" && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-400 font-sans animate-pulse">
              समाचार डेटाबेस लाइव लोड हो रहा है... कृपया प्रतीक्षा करें
            </div>
          ) : articles.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-600">कोई समाचार उपलब्ध नहीं है!</p>
              <p className="text-xs text-neutral-400 mt-1">पहला लेख बनाने के लिए ऊपर 'नया समाचार' बटन दबाएं।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-200 uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-xs font-black">आलेख / शीर्षक</th>
                    <th className="py-3.5 px-4 text-xs font-black">श्रेणी</th>
                    <th className="py-3.5 px-4 text-xs font-black">लेखक/दिनांक</th>
                    <th className="py-3.5 px-4 text-xs font-black text-center">देखा गया (विशलेषण)</th>
                    <th className="py-3.5 px-4 text-xs font-black text-center">लाइक्स</th>
                    <th className="py-3.5 px-4 text-xs font-black text-center">क्रियाएं</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {articles.map((art) => (
                    <tr key={art.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 px-4 max-w-sm md:max-w-md">
                        <div className="flex items-center gap-3">
                          <img 
                            src={art.image} 
                            alt="" 
                            className="w-11 h-11 object-cover rounded-md border shrink-0 bg-neutral-100" 
                          />
                          <div>
                            <div className="font-bold text-neutral-900 line-clamp-1">{art.title}</div>
                            <div className="flex gap-2 items-center mt-1 text-[10px]">
                              {art.isBreaking && <span className="bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide">ब्रेकिंग</span>}
                              {art.isFeatured && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide">फीचर्ड</span>}
                              {art.isTrending && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide">ट्रेंडिंग</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-neutral-800 text-xs px-2.5 py-1 bg-neutral-100 border rounded-md">
                          {art.category === "national" ? "देश" : 
                           art.category === "state" ? `राज्य (${art.state || ""})` : 
                           art.category === "sports" ? "खेल" : 
                           art.category === "entertainment" ? "मनोरंजन" : 
                           art.category === "business" ? "बिजनेस" : 
                           art.category === "tech" ? "टेक" : 
                           art.category === "lifestyle" ? "लाइफस्टाइल" : "विदेश"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs">
                        <div className="font-semibold text-neutral-800">{art.author}</div>
                        <div className="text-neutral-400 mt-0.5">{art.date}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-gray-700">
                        {art.views || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-gray-700">
                        {art.likes || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(art)}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-amber-600 transition-colors cursor-pointer"
                            title="एडिट करें"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {deleteConfirmId === art.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200">
                              <span className="text-[9px] text-red-600 font-extrabold animate-pulse">हटाएं?</span>
                              <button
                                onClick={() => handleDelete(art.id)}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-black transition-colors"
                              >
                                हाँ
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded text-[9px] font-black transition-colors"
                              >
                                नहीं
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(art.id)}
                              className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-red-600 transition-colors cursor-pointer"
                              title="हटाएं"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      )}

      {/* TAB CONTENT: RAW MATERIAL AI COMPILER */}
      {activeTab === "compiler" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl p-5 md:p-6 shadow-md">
            <h3 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>रॉ मटेरियल एआई कम्पाईलर (Raw Material AI Compiler)</span>
            </h3>
            <p className="text-xs text-orange-50/90 leading-relaxed mt-2 font-sans">
              यहाँ आप किसी भी न्यूज पोर्टल, व्हाट्सएप संदेश या कच्ची सामग्री (तथ्य, इमेज लिंक, शीर्षक) का पूरा रॉ मटेरियल पेस्ट कर सकते हैं। हमारा आर्टिफ़िशियल इंटेलिजेंस (AI) इसे विच्छेदित कर के तुरंत कई सारी अलग-अलग प्रामाणिक खबरों में बदल देगा, जिन्हें एक सिंगल क्लिक में आप सीधे वेबसाइट पर लाइव पब्लिश कर सकते हैं।
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Box Column */}
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <span className="font-black text-xs text-neutral-800 uppercase tracking-wider">इनपुट: समाचारों का रॉ मटेरियल पेस्ट करें</span>
                  <button
                    onClick={() => setRawText("")}
                    className="text-[10px] text-red-600 hover:underline font-bold"
                  >
                    साफ़ करें (Clear)
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="यहाँ खबरों का रॉ मटेरियल हेडिंग, कच्चा टेक्स्ट या इमेज लिंक्स के साथ पेस्ट करें..."
                  rows={14}
                  className="w-full text-xs p-4 rounded-xl bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none font-sans leading-relaxed resize-none text-neutral-800"
                ></textarea>
                
                <button
                  onClick={handleCompileRaw}
                  disabled={compilingRaw || !rawText.trim()}
                  className="w-full mt-4 py-3 bg-[#ff6f00] hover:bg-amber-600 text-white font-extrabold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/15 select-none disabled:opacity-50"
                >
                  {compilingRaw ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>एआई खबरों का विश्लेषण कर रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                      <span>कम्पाइल करें (Compile with AI) ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compiled Preview Column */}
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col h-[525px] justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <span className="font-black text-xs text-neutral-800 uppercase tracking-wider">आउटपुट: एआई द्वारा तैयार सुव्यवस्थित खबरें</span>
                    {compiledArticles.length > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {compiledArticles.length} खबर तैयार
                      </span>
                    )}
                  </div>

                  <div className="overflow-y-auto max-h-[380px] pr-1 space-y-4 scrollbar-thin">
                    {compilerError && (
                      <div className="text-xs p-3.5 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{compilerError}</span>
                      </div>
                    )}

                    {compilingRaw && (
                      <div className="py-20 text-center animate-pulse space-y-3">
                        <div className="w-9 h-9 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs font-bold text-neutral-600">गूगल जेमिनी एआई कच्ची जानकारियों से अलग-अलग खबरें तराश रहा है...</p>
                        <p className="text-[10px] text-neutral-400">कृपया कुछ पल प्रतीक्षा करें (5-10 सेकंड)...</p>
                      </div>
                    )}

                    {!compilingRaw && compiledArticles.length === 0 && (
                      <div className="py-24 text-center text-neutral-400 font-sans space-y-2">
                        <BookOpen className="w-10 h-10 text-neutral-200 mx-auto" />
                        <p className="text-xs font-bold text-neutral-500">अभी कोई क्युरेटेड खबर तैयार नहीं है।</p>
                        <p className="text-[10px] text-neutral-400">बायें बॉक्स में रॉ मटेरियल पेस्ट करके "कम्पाइल करें" दबाएं।</p>
                      </div>
                    )}

                    {!compilingRaw && compiledArticles.map((art, idx) => (
                      <div key={idx} className="p-3.5 border border-neutral-100 rounded-lg bg-neutral-50/50 hover:bg-neutral-50 transition-colors space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-2 py-0.5 bg-[#ff6f00]/10 text-[#ff6f00] text-[9px] font-extrabold rounded uppercase">
                            {art.category === "national" ? "देश" : 
                             art.category === "state" ? `राज्य (${art.state || "सामान्य"})` : 
                             art.category === "sports" ? "खेल" : 
                             art.category === "entertainment" ? "मनोरंजन" : 
                             art.category === "business" ? "बिजनेस" : 
                             art.category === "tech" ? "टेक" : 
                             art.category === "lifestyle" ? "लाइफस्टाइल" : "विदेश"}
                          </span>
                          <span className="text-[9px] font-medium text-neutral-400 font-mono">खबर क्रम #{idx + 1}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          {art.image && (
                            <img src={art.image} referrerPolicy="no-referrer" alt="" className="w-12 h-12 object-cover rounded border bg-white shrink-0" />
                          )}
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-neutral-900 leading-tight">{art.title}</h4>
                            <p className="text-[10px] text-neutral-500 italic font-medium leading-snug line-clamp-1">{art.subtitle}</p>
                          </div>
                        </div>

                        <p className="text-[10px] text-neutral-600 leading-relaxed font-sans whitespace-pre-line bg-white p-2 rounded border border-neutral-100">
                          {art.content}
                        </p>

                        <div className="flex items-center justify-between text-[9px] text-neutral-400 border-t pt-1.5 mt-2">
                          <span className="font-semibold text-neutral-500">✍️ {art.author}</span>
                          <span className="font-mono text-neutral-400">टैग्स: {art.tags?.join(", ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compile box bottom publisher */}
                <div className="border-t pt-3 mt-3">
                  <button
                    onClick={handlePublishCompiled}
                    disabled={publishingCompiled || compiledArticles.length === 0}
                    className="w-full py-3.5 bg-black hover:bg-neutral-950 text-white font-extrabold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 select-none disabled:opacity-50 shadow-md shadow-neutral-900/10"
                    id="compiled-publish-btn"
                  >
                    {publishingCompiled ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        <span>सभी खबरों को प्रसारित (Publishing) किया जा रहा है...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-emerald-400" />
                        <span>पब्लिश (Publish All Articles to Site) 🚀</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[9px] text-neutral-400 mt-2 font-sans">
                    *प्रकाशित करने से ये सभी खबरें तुरंत संबंधित श्रेणियों में लाइव पोस्ट हो जाएंगी।
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}
      {activeTab === "insights" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Eye className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400">कुल पाठक आगमन (पठित)</div>
              <div className="text-2xl font-black text-gray-800 font-mono mt-1">{totalViews}</div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400">कुल सकारात्मक प्रतिक्रियाएं (लाइक्स)</div>
              <div className="text-2xl font-black text-gray-800 font-mono mt-1">{totalLikes}</div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400">कुल पाठक टिप्पणियां</div>
              <div className="text-2xl font-black text-gray-800 font-mono mt-1">{totalComments}</div>
            </div>
          </div>

          {/* Quick instructions panel */}
          <div className="bg-amber-50 border border-amber-200/40 rounded-xl p-5 md:col-span-3 text-xs text-amber-800 leading-relaxed font-sans">
            <h4 className="font-extrabold text-neutral-800 mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>प्रशासक ध्यान दें:</span>
            </h4>
            <span>
              वेबसाइट वर्तमान में संपूर्ण विशेषताओं के साथ पूरी तरह गतिशील है। यदि आप एआई जनरेशन सुविधा का उपयोग कर समाचार लिखते हैं, तो सिस्टम स्वचालित रूप से संपूर्ण शीर्षक, उप-शीर्षक और सुसंगठित खबर तैयार कर फॉर्म में भर देता है। बस उस खबर को रिव्यू कर "प्रसारित करें" बटन पर क्लिक करने से साइट पर खबर तुरंत लाइव प्रदर्शित हो जाती है।
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WRITE / CREATE DRAFT FORM & GEMINI INTEGRATION */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: GEMINI AI WRITER CORNER */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-radial from-[#1e1338] to-[#0d071d] text-white rounded-xl p-5 border border-purple-500/25 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <h3 className="text-sm font-black tracking-wide uppercase text-purple-300">सारादेश.in एआई सहायक</h3>
                </div>
                
                <p className="text-xs text-purple-200/80 leading-relaxed font-sans mb-4">
                  लेखन विषय या छोटी सी हेडलाइन लिखें। यह आपकी कल्पना को सीधे सारादेश.in की वरिष्ठ शैली की विस्तृत खबर में बदल देगा!
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black tracking-wider uppercase text-purple-300 mb-1">समाचार का मुख्य विषय / संकेत:</label>
                    <textarea
                      placeholder="उदा: 'बिहार में भारी बारिश की चेतावनी' या 'भारत की जीडीपी 8% पार'..."
                      rows={4}
                      disabled={generatingAI}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg bg-neutral-900 border border-purple-500/20 text-indigo-50 outline-none focus:border-purple-500 placeholder:text-gray-600 resize-none font-sans"
                    ></textarea>
                  </div>
                  
                  {aiError && (
                    <div className="text-[11px] font-semibold text-rose-300 bg-rose-900/30 border border-rose-900/40 p-2.5 rounded-md leading-normal font-sans">
                      त्रुटि: {aiError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={generatingAI || !aiPrompt.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 disabled:opacity-50 text-white cursor-pointer transition-opacity shadow-md shadow-pink-900/20"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{generatingAI ? "एआई लेखन कार्य चालू है..." : "एआई द्वारा जनरेट करें"}</span>
                  </button>
                </div>
              </div>

              {/* AI Loading state */}
              {generatingAI && (
                <div className="mt-5 border-t border-purple-500/20 pt-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                    <span className="text-xs font-black text-pink-400 uppercase tracking-widest">जेमिनी एआई सक्रिय है</span>
                  </div>
                  <p className="text-[11px] text-purple-200/90 italic font-sans leading-relaxed">
                    "{aiStatusText}"
                  </p>
                </div>
              )}
            </div>
            
            {/* Template Ideas card */}
            <div className="bg-white border text-xs text-neutral-600 p-4 rounded-xl shadow-xs">
              <h4 className="font-bold text-neutral-800 mb-2">💡 एआई लेखक विचार :</h4>
              <ul className="space-y-2 font-sans pl-2 list-disc list-inside">
                <li><span className="font-semibold text-[#ff6f00]">आईपीएल मैच:</span> "चेन्नई सुपर किंग्स की ऐतिहासिक जीत"</li>
                <li><span className="font-semibold text-[#ff6f00]">व्यापार:</span> "सोने की कीमतों में भारी उछाल"</li>
                <li><span className="font-semibold text-[#ff6f00]">तकनीक:</span> "एआई चिप्स और रोबोटिक क्रांति"</li>
                <li><span className="font-semibold text-[#ff6f00]">अंतरराष्ट्रीय:</span> "यूरोप में नया आर्थिक समझौता"</li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: MANUAL ENTRY / OR REVIEW DRAFT FORM */}
          <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xl p-5 md:p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-neutral-900 mb-4 flex items-center gap-1.5 border-b pb-3 border-neutral-100">
              <BookOpen className="w-4 h-4 text-[#ff6f00]" />
              <span>{editingId ? "चयनित लेख विवरण का संपादन करें" : "समाचार संलेखन एवं ड्राफ्ट रिव्यू"}</span>
            </h3>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* News Title */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">समाचार का मुख्य शीर्षक (Headline) * :</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा: चंद्रयान-4 की सटीक लॉन्च डेट का एलान..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none"
                  />
                </div>

                {/* News Subtitle */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">लघु सारांश / उप-शीर्षक (Snippet) :</label>
                  <input
                    type="text"
                    placeholder="उदा: इसरो प्रमुख ने बताया कि इस बार मिशन दो अलग-अलग हिस्सों में लॉन्च होगा..."
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">समाचार श्रेणी * :</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none"
                  >
                    {CATEGORIES.filter(c => c.key !== 'all').map((cat) => (
                      <option key={cat.key} value={cat.key}>{cat.hindiName}</option>
                    ))}
                  </select>
                </div>

                {/* State specific filter */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">संबंधित प्रांतीय राज्य (वैकल्पिक) :</label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none"
                  >
                    <option value="">कोई राज्य लॉक नहीं (सामान्य)</option>
                    {STATES.filter((st) => st !== "सभी राज्य").map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">संवाददाता / लेखक का नाम :</label>
                  <input
                    type="text"
                    placeholder="उदा: विशेष संवाददाता, भोपाल"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none"
                  />
                </div>

                {/* News cover Image Options */}
                <div className="md:col-span-2 border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-extrabold text-[#ff6f00] text-xs">📸 समाचार मुख्य कवर फोटो (Cover Photo Setup)</span>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="text-[10px] text-red-600 hover:underline font-bold"
                      >
                        फोटो हटाएं (Remove)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Preview box if image exists */}
                    <div className="md:col-span-3 flex flex-col items-center justify-center bg-white border rounded-xl p-2 h-28 relative">
                      {image ? (
                        <>
                          <img
                            src={image}
                            alt="Cover preview"
                            className="w-full h-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] text-white font-mono uppercase">
                            प्रीव्यू
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-neutral-400">
                          <ImageIcon className="w-8 h-8 mx-auto text-neutral-300 animate-pulse" />
                          <span className="text-[10px] font-medium block mt-1 font-sans">कोई फोटो नहीं</span>
                        </div>
                      )}
                    </div>

                    {/* Image URL, File Upload, clipboard paste column */}
                    <div className="md:col-span-9 space-y-3">
                      {/* Paste Box / Direct input wrapper */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* URL Paste & Direct Text Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 mb-1">पहला विकल्प: इमेज यूआरएल (Image URL) :</label>
                          <input
                            type="text"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            onPaste={(e) => {
                              const text = e.clipboardData.getData("text");
                              if (text && (text.startsWith("http") || text.startsWith("data:"))) {
                                setImage(text);
                              }
                            }}
                            className="w-full text-xs p-2.5 rounded-lg bg-white border focus:border-[#ff6f00] outline-none"
                          />
                        </div>

                        {/* Direct File Selector */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 mb-1">दूसरा विकल्प: फ़ाइल अपलोड (Upload File) :</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const compressed = await compressImageFile(file);
                                  if (compressed) setImage(compressed);
                                }
                              }}
                              className="hidden"
                              id="manual-image-uploader"
                            />
                            <label
                              htmlFor="manual-image-uploader"
                              className="w-full text-xs p-2.5 rounded-lg bg-white border hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 cursor-pointer text-neutral-600 font-extrabold border-dashed border-neutral-300"
                            >
                              <Upload className="w-4 h-4 text-neutral-400" />
                              <span>डिवाइस से फोटो चुनें</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Clipboard paste active box */}
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">तीसरा विकल्प: कॉपी की हुई इमेज को यहाँ पेस्ट करें (Paste Clipboard Image) :</label>
                        <div
                          onPaste={async (e) => {
                            const items = e.clipboardData?.items;
                            if (items) {
                              for (let i = 0; i < items.length; i++) {
                                const item = items[i];
                                if (item.type.indexOf("image") !== -1) {
                                  const file = item.getAsFile();
                                  if (file) {
                                    const compressed = await compressImageFile(file);
                                    if (compressed) setImage(compressed);
                                    e.preventDefault();
                                    return;
                                  }
                                }
                              }
                            }
                            // Fallback to text url string
                            const text = e.clipboardData?.getData("text");
                            if (text && (text.startsWith("http") || text.startsWith("data:"))) {
                              setImage(text);
                            }
                          }}
                          className="w-full p-2.5 py-3 rounded-lg bg-neutral-900/5 hover:bg-neutral-900/10 border-2 border-dashed border-neutral-300 text-center transition-all cursor-pointer group"
                          title="इस बॉक्स पर क्लिक करें और फिर Ctrl+V दबाकर अपनी कॉपी की हुई फ़ोटो सीधे पेस्ट करें!"
                        >
                          <div className="flex items-center justify-center gap-2 text-neutral-500 text-[11px] font-semibold font-sans">
                            <Clipboard className="w-4 h-4 text-neutral-400 group-hover:scale-110 transition-transform" />
                            <span>क्लिक करके <b>Ctrl + V</b> दबाएं या स्क्रीनशॉट/इमेज डायरेक्ट पेस्ट करें!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content text & Inline Image Insertion Tool */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="block text-[11px] font-bold text-neutral-700">
                      समाचार विवरण (पूर्ण समाचार लेख) * :
                    </label>
                    <span className="text-[10px] text-amber-600 font-bold font-sans">
                      💡 टिप: अब आप खबर के बीच में भी अलग-अलग तस्वीरें लगा सकते हैं!
                    </span>
                  </div>

                  {/* Inline Image Insertion Tool Box */}
                  <div className="p-3 bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border border-amber-300/80 rounded-xl space-y-2.5 font-sans shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                        <ImageIcon className="w-4 h-4 text-[#ff6f00]" />
                        <span>खबर के बीच में फोटो/इमेज जोड़ें (Insert Inline Image in Article)</span>
                      </div>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-bold">
                        मल्टी-इमेज सपोर्ट
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          placeholder="इमेज यूआरएल (https://...) या बगल से फ़ाइल चुनें..."
                          value={inlineImgUrl}
                          onChange={(e) => setInlineImgUrl(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg bg-white border border-amber-300 outline-none focus:border-[#ff6f00]"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="कैप्शन (उदा: प्रेस कॉन्फ्रेंस का दृश्य)"
                          value={inlineImgCaption}
                          onChange={(e) => setInlineImgCaption(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg bg-white border border-amber-300 outline-none focus:border-[#ff6f00]"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInsertInlineImage()}
                          className="w-full py-2 px-2.5 bg-[#ff6f00] hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs cursor-pointer transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>बीच में जोड़ें</span>
                        </button>

                        <div className="relative shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const compressed = await compressImageFile(file);
                                if (compressed) {
                                  handleInsertInlineImage(compressed, inlineImgCaption);
                                }
                              }
                            }}
                            className="hidden"
                            id="inline-image-uploader"
                          />
                          <label
                            htmlFor="inline-image-uploader"
                            className="p-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg cursor-pointer flex items-center justify-center transition-colors shadow-2xs"
                            title="अपनी डिवाइस से फ़ोटो चुनकर सीधे लेख के बीच में लगाएं"
                          >
                            <Upload className="w-4 h-4 text-amber-700" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <textarea
                    required
                    placeholder="विस्तृत समाचार सामग्री यहाँ डालें... (ऊपर 'बीच में जोड़ें' बटन का उपयोग करके आप खबर के बीच में कितनी भी तस्वीरें जोड़ सकते हैं)"
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none resize-y font-sans leading-relaxed shadow-2xs"
                  ></textarea>

                  {/* Gallery preview of inline images attached inside content */}
                  {extractInlineImages(content).length > 0 && (
                    <div className="p-3 bg-neutral-900 text-white rounded-xl space-y-2 font-sans border border-neutral-800">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span>🖼️ खबर के अंदर जुड़ी तस्वीरें ({extractInlineImages(content).length}) :</span>
                        <span className="text-[10px] text-neutral-400">हटाने के लिए 🗑️ बटन दबाएं</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                        {extractInlineImages(content).map((img, idx) => (
                          <div key={idx} className="relative group bg-neutral-800 rounded-lg p-1 border border-neutral-700 space-y-1">
                            <div className="aspect-video w-full overflow-hidden rounded bg-black flex items-center justify-center">
                              <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[10px] text-neutral-300 truncate font-semibold px-0.5">
                              {img.caption || `तस्वीर ${idx + 1}`}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setContent((prev) => prev.replace(img.rawMatch, "").replace(/\n\n\n+/g, "\n\n"));
                              }}
                              className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-all cursor-pointer"
                              title="इस तस्वीर को खबर से हटाएं"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">कीवर्ड टैग्स (अल्पविराम ',' से अलग करें):</label>
                  <input
                    type="text"
                    placeholder="उदा: इसरो, स्पेसक्राफ्ट, चंद्रयान, राष्ट्रीय विकास"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none"
                  />
                </div>

                {/* Meta Description (Optional) */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                    मेटा विवरण (Meta Description - Optional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="सर्च इंजन (SEO) और सोशल शेयरिंग के लिए संक्षिप्त मेटा विवरण दर्ज करें (वैकल्पिक)..."
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none font-sans resize-y"
                  ></textarea>
                  <p className="text-[10px] text-neutral-400 mt-1 font-sans">
                    💡 यदि खाली छोड़ा जाता है तो स्वचालित रूप से सब-टाइटल या सामग्री का प्रारंभिक भाग मेटा विवरण के रूप में प्रयोग होगा।
                  </p>
                </div>

                {/* Special Ribbon promotions */}
                <div className="md:col-span-2 grid grid-cols-3 gap-2.5 pt-2">
                  <label className="flex items-center gap-2 border rounded-lg p-2.5 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={isBreaking}
                      onChange={(e) => setIsBreaking(e.target.checked)}
                      className="accent-[#ff6f00] shrink-0"
                    />
                    <div>
                      <div className="font-bold text-neutral-800 text-[10px]">ब्रेकिंग न्यूज रिबन</div>
                      <div className="text-[9px] text-gray-400">लगातार स्क्रॉल पट्टी</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 border rounded-lg p-2.5 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="accent-[#ff6f00] shrink-0"
                    />
                    <div>
                      <div className="font-bold text-neutral-800 text-[10px]">फीचर्ड लेख</div>
                      <div className="text-[9px] text-gray-400">टॉप बैनर प्राइड स्थान</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 border rounded-lg p-2.5 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="accent-[#ff6f00] shrink-0"
                    />
                    <div>
                      <div className="font-bold text-neutral-800 text-[10px]">ट्रेंडिंग न्यूज़</div>
                      <div className="text-[9px] text-gray-400">साइडबार सूची प्रदर्शन</div>
                    </div>
                  </label>
                </div>

              </div>

              {/* Submission panel controls */}
              <div className="flex items-center justify-end border-t border-neutral-100 pt-5 gap-3">
                <button
                  type="button"
                  onClick={() => { resetForm(); setActiveTab("list"); }}
                  className="px-5 py-2.5 border rounded-lg font-bold text-neutral-500 hover:text-neutral-800 cursor-pointer transition-colors"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#ff6f00] hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-orange-600/15"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>{editingId ? "संशोधित जानकारी सहेजें (अपडेट करें)" : "प्रकाशित करें (लाइव करें)"}</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* TAB CONTENT: URL CRAWLER/SCRAPER */}
      {activeTab === "urlScraper" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#0d1b2a] via-[#1b263b] to-[#1d3557] text-white rounded-xl p-6 md:p-8 border border-sky-500/20 shadow-md">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-sky-500 text-xs text-white font-extrabold uppercase px-2.5 py-1 rounded font-sans tracking-wider animate-pulse">
                  लाइव वेबपेज यूआरएल एआई संकलन
                </span>
                <span className="text-xs text-sky-200 font-sans font-medium">जेमिनी 3.5 रियल-टाइम यूआरएल रिसर्च तकनीक</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">🔗 एआई वेब यूआरएल समाचार संकलन (टॉप 10 संस्करण)</h3>
              <p className="text-xs md:text-sm text-sky-200/80 leading-relaxed font-sans mt-2">
                शीघ्र समाचार संकलन प्रणाली: बस किसी भी समाचार पोर्टल या वेबपेज का लिंक (URL) नीचे बॉक्स में डालें। जेमिनी एआई उस पेज से आज के दिन की सबसे बड़ी <b>टॉप 10 खबरों</b> को अपनी हिंदी पत्रकारिता शैली में समृद्ध और संपूर्ण समाचार लेखों के रूप में क्रमबद्ध तरीके से संकलित करेगा। आप मनपसंद खबरों को टिक करके एक क्लिक में सही श्रेणियों (Categories) में वेबसाइट पर लाइव पब्लिश कर सकते हैं।
              </p>
              
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    placeholder="उदा: https://aajtak.in  या  https://ndtv.in/india-news"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-neutral-950 border border-sky-500/30 text-white rounded-lg text-xs font-sans focus:outline-none focus:border-sky-400 placeholder-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={handleScrapeUrl}
                    disabled={scrapingUrl || !urlInput.trim()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6f00] hover:bg-amber-600 disabled:bg-neutral-800 disabled:opacity-45 text-white font-extrabold rounded-lg text-xs tracking-wider transition-all shadow-lg cursor-pointer shrink-0"
                  >
                    {scrapingUrl ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span>एआई पेज स्कैन कर रहा है...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>टॉप 10 खबरें संकलित करें ⚡</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {urlScrapedError && (
            <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-2 font-sans">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{urlScrapedError}</span>
            </div>
          )}

          {scrapingUrl && (
            <div className="text-center py-20 bg-white border border-neutral-200 rounded-xl shadow-xs animate-pulse flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#ff6f00] border-t-transparent animate-spin mb-4"></div>
              <p className="text-sm font-black text-neutral-800">लिंक विश्लेषक और रोबोटिक एआई वेबपेज को क्रॉल कर रहा है...</p>
              <p className="text-xs text-neutral-400 font-sans mt-2">पेज की सामग्री को पढ़कर टॉप 10 विस्तृत हिंदी लेख तैयार किये जा रहे हैं। इसमें 10-20 सेकेंड लग सकते हैं।</p>
            </div>
          )}

          {!scrapingUrl && scrapedUrlArticles.length === 0 && (
            <div className="text-center py-24 bg-white border border-neutral-200 rounded-xl shadow-xs">
              <Sparkles className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-600">कोई विश्लेषण डेटा लोड नहीं है।</p>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">ऊपर बॉक्स में किसी समाचार पोर्टल का वैध लिंक भरकर संकलन शुरू करें।</p>
            </div>
          )}

          {!scrapingUrl && scrapedUrlArticles.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-50 p-4 border rounded-xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-neutral-800 font-sans">
                    संकलित परिणाम: {scrapedUrlArticles.length} ख़बरें मिलीं
                  </span>
                  <span className="text-[10px] font-bold text-[#ff6f00] bg-orange-50 px-2 py-0.5 rounded">
                    चयनित: {scrapedUrlArticles.filter(a => a.selected).length}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAllUrlArticles(true)}
                    className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[10px] font-black rounded-md transition-all cursor-pointer"
                  >
                    सभी का चयन करें ☑️
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllUrlArticles(false)}
                    className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[10px] font-black rounded-md transition-all cursor-pointer"
                  >
                    सभी हटाएँ 🗑️
                  </button>
                </div>
              </div>

              {/* LIST OF CHOSEN TOP 10 ARTICLES WITH CHECKBOXES */}
              <div className="space-y-4">
                {scrapedUrlArticles.map((item, index) => (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-xl p-5 transition-all shadow-xs relative flex flex-col md:flex-row gap-5 ${
                      item.selected ? "border-sky-500/50 bg-sky-50/5" : "border-neutral-200 opacity-75"
                    }`}
                  >
                    {/* Tick box area */}
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={!!item.selected}
                        onChange={() => toggleUrlArticleSelect(item.id)}
                        className="w-5 h-5 rounded accent-sky-600 border-neutral-300 cursor-pointer mt-1"
                        id={`cb-${item.id}`}
                      />
                    </div>

                    {/* Meta and content details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-neutral-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase bg-neutral-100 px-2.5 py-1 rounded text-neutral-700">
                            स्थान: {index + 1}
                          </span>
                          <span className="text-[11px] font-black uppercase text-white bg-sky-600 px-2.5 py-1 rounded font-sans">
                            {item.category === "national" ? "देश" : 
                             item.category === "state" ? "राज्य" : 
                             item.category === "sports" ? "खेल" : 
                             item.category === "entertainment" ? "मनोरंजन" : 
                             item.category === "business" ? "बिजनेस" : 
                             item.category === "tech" ? "टेक" : 
                             item.category === "lifestyle" ? "लाइफस्टाइल" : "विदेश"}
                          </span>
                          {item.state && (
                            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded font-sans">
                              📍 {item.state}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-sans font-medium">लेखक: {item.author}</span>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        {item.image && (
                          <div className="w-full md:w-32 h-20 shrink-0 rounded-lg overflow-hidden border">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <h4 className="text-base font-black text-neutral-900 leading-snug">{item.title}</h4>
                          <p className="text-xs font-bold text-neutral-500">{item.subtitle}</p>
                        </div>
                      </div>

                      <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-100">
                        <p className="text-xs text-neutral-600 font-sans leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tags?.map((tag: string) => (
                          <span key={tag} className="text-[10px] font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-sans">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PUBLISH CTA BAR */}
              <div className="flex items-center justify-between gap-4 p-5 bg-gradient-to-r from-neutral-900 to-indigo-950 text-white rounded-xl shadow-lg border border-purple-500/20">
                <div>
                  <h4 className="text-sm font-bold">एक क्लिक में साइट पर समाचार प्रकाशित करें</h4>
                  <p className="text-xs text-neutral-400 mt-1 font-sans">
                    आपके द्वारा चुने गए {scrapedUrlArticles.filter(a => a.selected).length} समाचारों को उनकी सही कैटोगरी में वेबसाइट पर लाइव पोस्ट किया जाएगा।
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handlePublishUrlArticles}
                  disabled={publishingUrlArticles || scrapedUrlArticles.filter(a => a.selected).length === 0}
                  className="flex items-center gap-2 px-6 py-4 bg-[#ff6f00] hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold rounded-lg text-xs tracking-wider transition-colors shadow-lg cursor-pointer shrink-0"
                >
                  {publishingUrlArticles ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>समाचारों को पब्लिश किया जा रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0" />
                      <span>चयनित समाचार पब्लिश करें (लाइव करें) 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SCREENSHOT CRAWLER/ANALYZER */}
      {activeTab === "screenshot" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-orange-950 text-white rounded-xl p-6 md:p-8 border border-orange-500/20 shadow-md">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#ff6f00] text-xs text-white font-extrabold uppercase px-2.5 py-1 rounded font-sans tracking-wider animate-pulse">
                  एआई मीडिया स्क्रीनशॉट विच्छेदन
                </span>
                <span className="text-xs text-orange-200 font-sans font-medium">गूगल जेमिनी 3.5 विजन एवं ऑटो-लेखक तकनीक</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">📸 स्क्रीनशॉट से नई खबरें बनाएं (AI Screenshot to News)</h3>
              <p className="text-xs md:text-sm text-neutral-300 leading-relaxed font-sans mt-2">
                त्वरित न्यूज़ डिसेक्टर: किसी भी न्यूज़ चैनल, समाचार वेबसाइट, अखबार की क्लिपिंग या सोशल मीडिया पोस्ट का स्क्रीनशॉट लें और यहाँ अपलोड करें। जेमिनी एआई स्क्रीनशॉट में लिखी हेडलाइन या समाचार को विस्तार से पढ़कर उसकी शुद्ध, पूर्ण और स्वतंत्र नई विस्तृत खबरें लिख देगा। आप चयनित खबरों को टिक करके वेबसाइट पर श्रेणीवार तुरंत लाइव कर सकते हैं।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            {/* Left Column: Image Area */}
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <span className="font-black text-xs text-neutral-800 uppercase tracking-wider">स्क्रीनशॉट अपलोड करें</span>
                  {screenshotPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                        setScreenshotArticles([]);
                        setScreenshotError("");
                      }}
                      className="text-[10px] text-red-600 hover:underline font-bold"
                    >
                      हटाएं (Remove)
                    </button>
                  )}
                </div>

                {/* Drag and drop panel */}
                {!screenshotPreview ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleScreenshotDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-[#ff6f00] bg-orange-50/50"
                        : "border-neutral-300 hover:border-neutral-400 bg-neutral-50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                      id="screenshot-input"
                    />
                    <label htmlFor="screenshot-input" className="cursor-pointer space-y-3 block">
                      <div className="w-12 h-12 rounded-full bg-orange-50 text-[#ff6f00] flex items-center justify-center mx-auto border border-orange-100 shadow-sm">
                        <Upload className="w-5 h-5 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-neutral-800">यहाँ फाइल ड्रैग करें या कंप्यूटर से चुनें</p>
                        <p className="text-[10px] text-neutral-400 font-sans">PNG, JPG, WEBP स्क्रीनशॉट समर्थित हैं</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-full max-h-80 rounded-xl overflow-y-auto border border-neutral-100 bg-neutral-50 p-2.5 flex items-center justify-center animate-fade-in">
                      <img
                        src={screenshotPreview}
                        alt="Uploaded Screenshot"
                        className="max-h-72 object-contain rounded-lg shadow-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleProcessScreenshot}
                      disabled={processingScreenshot}
                      className="w-full py-3.5 bg-[#ff6f00] hover:bg-amber-600 disabled:bg-neutral-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer select-none"
                    >
                      {processingScreenshot ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                          <span>जेमिनी एआई स्क्रीनशॉट को स्कैन और री-राइट कर रहा है...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
                          <span>स्क्रीनशॉट का विश्लेषण करें (Analyze with AI) ⚡</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {screenshotError && (
                <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-2 font-sans">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
                  <span>{screenshotError}</span>
                </div>
              )}

              {processingScreenshot && (
                <div className="text-center py-10 bg-white border border-neutral-200 rounded-xl shadow-xs space-y-3 p-5">
                  <div className="w-10 h-10 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin mx-auto animate-pulse"></div>
                  <h4 className="text-xs font-black text-neutral-800">विजन इंटेलिजेंस काम कर रहा है...</h4>
                  <ul className="text-[10px] text-neutral-500 font-sans space-y-1 text-left max-w-xs mx-auto list-disc pl-4">
                    <li>स्क्रीनशॉट से हेडलाइंस पहचानी जा रही हैं।</li>
                    <li>खबरों के पीछे के तथ्यों को प्रोसेस किया जा रहा है।</li>
                    <li>Devanagari लिपि में उत्कृष्ट स्वतंत्र समाचार ड्राफ्ट किये जा रहे हैं।</li>
                    <li>कैटेगरी और प्रासंगिक टैग ऑटो-साझेदारी किए जा रहे हैं।</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column: Output Area */}
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col min-h-[400px] justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <span className="font-black text-xs text-neutral-800 uppercase tracking-wider">तैयार एआई विस्तृत खबरें</span>
                    {screenshotArticles.length > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                        {screenshotArticles.length} खबर तैयार
                      </span>
                    )}
                  </div>

                  {screenshotArticles.length === 0 && !processingScreenshot && (
                    <div className="py-24 text-center text-neutral-400 font-sans space-y-2 animate-fade-in">
                      <ImageIcon className="w-10 h-10 text-neutral-200 mx-auto" />
                      <p className="text-xs font-bold text-neutral-500">कोई खबर तैयार नहीं है।</p>
                      <p className="text-[10px] text-neutral-400">बायें बॉक्स में स्क्रीनशॉट अपलोड कर विश्लेषण शुरू करें।</p>
                    </div>
                  )}

                  {screenshotArticles.length > 0 && (
                    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                      {/* Selection Utility Toggles */}
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <span className="text-[10px] font-bold text-neutral-500">चयनित खबरें एडिट और रिव्यु करें:</span>
                        <div className="flex gap-1.5 font-sans">
                          <button
                            type="button"
                            onClick={() => toggleAllScreenshotArticles(true)}
                            className="bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded text-[9px] font-bold transition-all"
                          >
                            सब चुनें ✅
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAllScreenshotArticles(false)}
                            className="bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded text-[9px] font-bold transition-all"
                          >
                            सब हटाएँ 🗑️
                          </button>
                        </div>
                      </div>

                      {screenshotArticles.map((art) => (
                        <div key={art.id} className={`p-4 rounded-xl border transition-all ${
                          art.checked ? "border-amber-500/40 bg-amber-50/5" : "border-neutral-200 opacity-60"
                        }`}>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={!!art.checked}
                              onChange={() => toggleScreenshotArticleSelect(art.id)}
                              className="w-4 h-4 rounded mt-1 accent-[#ff6f00]"
                              id={`check-${art.id}`}
                            />
                            
                            <div className="flex-1 space-y-3">
                              {/* Title Editable Input */}
                              <div>
                                <label className="block text-[9px] font-bold text-neutral-400 mb-0.5 uppercase">शीर्षक (Title):</label>
                                <input
                                  type="text"
                                  value={art.title || ""}
                                  onChange={(e) => handleScreenshotArticleFieldChange(art.id, "title", e.target.value)}
                                  className="w-full text-xs font-bold p-1.5 border border-neutral-200 focus:border-[#ff6f00] outline-none rounded bg-white text-neutral-800"
                                />
                              </div>

                              {/* Subtitle Editable Input */}
                              <div>
                                <label className="block text-[9px] font-bold text-neutral-400 mb-0.5 uppercase">लीड/सबटाइटल (Subtitle):</label>
                                <input
                                  type="text"
                                  value={art.subtitle || ""}
                                  onChange={(e) => handleScreenshotArticleFieldChange(art.id, "subtitle", e.target.value)}
                                  className="w-full text-[11px] p-1.5 border border-neutral-200 focus:border-[#ff6f00] outline-none rounded bg-white text-neutral-600 font-sans"
                                />
                              </div>

                              {/* Dropdowns for Categories & State */}
                              <div className="grid grid-cols-2 gap-2 font-sans text-neutral-800">
                                <div>
                                  <label className="block text-[9px] font-bold text-neutral-400 mb-0.5 uppercase">श्रेणी (Category):</label>
                                  <select
                                    value={art.category}
                                    onChange={(e) => handleScreenshotArticleFieldChange(art.id, "category", e.target.value)}
                                    className="w-full text-[10px] p-1.5 border border-neutral-200 rounded focus:border-[#ff6f00] outline-none bg-white font-bold text-neutral-800"
                                  >
                                    {CATEGORIES.filter(c => c.key !== "all").map(cat => (
                                      <option key={cat.key} value={cat.key}>{cat.hindiName}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-neutral-400 mb-0.5 uppercase">राज्य (State):</label>
                                  <select
                                    value={art.state || ""}
                                    onChange={(e) => handleScreenshotArticleFieldChange(art.id, "state", e.target.value || null)}
                                    className="w-full text-[10px] p-1.5 border border-neutral-200 rounded focus:border-[#ff6f00] outline-none bg-white text-neutral-850"
                                  >
                                    <option value="">कोई राज्य नहीं (All India)</option>
                                    {STATES.filter(s => s !== "सभी राज्य").map(st => (
                                      <option key={st} value={st}>{st}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Content Detailed Editor */}
                              <div>
                                <label className="block text-[9px] font-bold text-neutral-400 mb-0.5 uppercase">लेख विवरण (Article Content):</label>
                                <textarea
                                  value={art.content}
                                  onChange={(e) => handleScreenshotArticleFieldChange(art.id, "content", e.target.value)}
                                  className="w-full text-[10px] p-2 border border-neutral-200 rounded focus:border-[#ff6f00] outline-none bg-white font-sans text-neutral-700 leading-relaxed resize-y"
                                  rows={5}
                                ></textarea>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-neutral-800">
                                <div>
                                  <label className="block text-[9px] font-bold text-neutral-400 mb-0.5 uppercase">लेखक (Author):</label>
                                  <input
                                    type="text"
                                    value={art.author}
                                    onChange={(e) => handleScreenshotArticleFieldChange(art.id, "author", e.target.value)}
                                    className="w-full text-[10px] p-1.5 border border-neutral-200 rounded focus:border-[#ff6f00] outline-none bg-white font-bold text-neutral-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-neutral-400 mb-0.5 uppercase">कवर फोटो (Keywords/URL):</label>
                                  <input
                                    type="text"
                                    value={art.image}
                                    onChange={(e) => handleScreenshotArticleFieldChange(art.id, "image", e.target.value)}
                                    className="w-full text-[10px] p-1.5 border border-neutral-200 rounded focus:border-[#ff6f00] outline-none bg-white text-neutral-500 font-mono truncate"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {screenshotArticles.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePublishScreenshotArticles}
                    disabled={publishingScreenshot || screenshotArticles.filter(art => art.checked).length === 0}
                    className="w-full mt-4 py-3 bg-[#ff6f00] hover:bg-neutral-900 disabled:opacity-45 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 tracking-wide cursor-pointer select-none shadow-md transition-colors"
                  >
                    {publishingScreenshot ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span>चयनित खबरें वेबसाइट पर पब्लिश हो रही हैं...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 shrink-0" />
                        <span>चयनित खबरें श्रेणीवार पब्लिश करें 🚀</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BULK BATCH NEWS & PHOTO MATCHER */}
      {activeTab === "batch" && (
        <div className="space-y-6 pb-20">
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white rounded-xl p-6 md:p-8 shadow-md">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white text-[#ff6f00] text-[11px] font-black uppercase px-3 py-1 rounded font-sans tracking-wider">
                  सिस्टमैटिक बल्क एग्रीगेटर
                </span>
                <span className="text-xs text-orange-100 font-sans">100% कंटेंट सुरक्षित • मल्टी फोटो मैचिंग</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight">🔀 मल्टीपल समाचार एवं फ़ोटो मिक्सर (Bulk News & Photo Matcher)</h3>
              <p className="text-xs md:text-sm text-orange-50 leading-relaxed font-sans mt-2">
                ऊपर बॉक्स में एक साथ कई समाचार (नंबर 1, 2, 3... शीर्षक, उप-शीर्षक, विस्तृत समाचार व टैग्स) पेस्ट करें। नीचे दूसरे बॉक्स में अपनी कई फ़ोटो एक साथ अपलोड करें (फ़ोटो #1, #2, #3...)। 
                इसके बाद <strong>"मिश्रण करें (Mix)"</strong> बटन दबाते ही हर खबर अपनी-अपनी फोटो के साथ लाइन से तैयार हो जाएगी। आप किसी भी खबर की फोटो को ड्रॉपडाउन या ऊपर/नीचे बटन दबाकर बदलकर सेट कर सकते हैं और एक क्लिक में सभी खबरों को लाइव पब्लिश कर सकते हैं!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Multiple News Input Textarea */}
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <span className="font-black text-xs text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#ff6f00] rounded-full"></span>
                    <span>1. कई समाचार पेस्ट करें (Paste News Text)</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBatchNewsText(
                          `1. शीर्षक: भारत ने क्रिकेट सीरीज में दर्ज की ऐतिहासिक जीत\nउप-शीर्षक: फाइनल मुकाबले में इंग्लैंड को 6 विकेट से हराया\nविस्तृत खबर: नई दिल्ली के अरुण जेटली स्टेडियम में खेले गए अंतिम एकदिवसीय मैच में भारतीय टीम ने शानदार प्रदर्शन करते हुए जीत हासिल की। बल्लेबाजों के दमदार प्रदर्शन और गेंदबाजों की धारदार गेंदबाजी के सामने मेहमान टीम टिक नहीं पाई।\nटैग्स: क्रिकेट, टीम इंडिया, खेल जगत\n\n2. शीर्षक: सरकारी नौकरियों में बंपर भर्ती का नोटिफिकेशन जारी\nउप-शीर्षक: एसएससी ने 12,000 पदों के लिए मांगे ऑनलाइन आवेदन\nविस्तृत खबर: कर्मचारी चयन आयोग (SSC) ने विभिन्न मंत्रालयों और विभागों में खाली पड़े पदों को भरने के लिए अधिसूचना जारी कर दी है। योग्य अभ्यर्थी आधिकारिक वेबसाइट पर जाकर आवेदन कर सकते हैं। आयु सीमा और योग्यता मानदंड जारी कर दिए गए हैं।\nटैग्स: सरकारी नौकरी, भर्ती 2026, एसएससी\n\n3. शीर्षक: आज का राशिफल: जानें किन राशियों का चमकेगा भाग्य\nउप-शीर्षक: मेष, सिंह और धनु राशि वालों के लिए विशेष लाभ के योग\nविस्तृत खबर: आज का दिन कई राशि के जातकों के लिए आर्थिक दृष्टि से फलदायी रहने वाला है। व्यापार में निवेश करने से पहले वरिष्ठों की सलाह अवश्य लें। परिवार में मांगलिक कार्यों की रूपरेखा बनेगी।\nटैग्स: राशिफल, ज्योतिष, दैनिक भविष्यफल`
                        );
                      }}
                      className="text-[10px] text-[#ff6f00] hover:underline font-bold bg-orange-50 px-2 py-0.5 rounded cursor-pointer"
                    >
                      नमूना (Sample Text) भरें
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchNewsText("")}
                      className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                    >
                      साफ़ करें
                    </button>
                  </div>
                </div>

                <textarea
                  value={batchNewsText}
                  onChange={(e) => setBatchNewsText(e.target.value)}
                  placeholder="यहाँ नंबर लगाकर कई सारे समाचार शीर्षक, सब-टाइटल और विस्तृत विवरण के साथ पेस्ट करें (जैसे 1. शीर्षक ... 2. शीर्षक ...)"
                  rows={14}
                  className="w-full text-xs p-4 rounded-xl bg-neutral-50 border focus:bg-white focus:border-[#ff6f00] outline-none font-sans leading-relaxed resize-y text-neutral-800"
                ></textarea>
                <p className="text-[10px] text-neutral-400 mt-1 font-sans">
                  💡 नोट: किसी भी समाचार का कोई भी कंटेंट कटेगा-छंटेगा नहीं, पूरा मैटर वैसा ही रहेगा।
                </p>
              </div>
            </div>

            {/* Box 2: Multi-Image Upload Box */}
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[460px]">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <span className="font-black text-xs text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                      <span>2. कई फ़ोटो एक साथ अपलोड करें (Upload Multiple Photos)</span>
                    </span>
                    {batchImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBatchImages([])}
                        className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                      >
                        सभी फ़ोटो हटाएं
                      </button>
                    )}
                  </div>

                  {/* Upload button area */}
                  <div className="mb-4">
                    <label htmlFor="batch-images-input" className="block w-full cursor-pointer">
                      <div className="border-2 border-dashed border-neutral-300 hover:border-[#ff6f00] bg-neutral-50 hover:bg-orange-50/30 rounded-xl p-5 text-center transition-all">
                        <Upload className="w-6 h-6 text-[#ff6f00] mx-auto mb-1 animate-bounce" />
                        <span className="text-xs font-bold text-neutral-800 block">
                          यहाँ क्लिक करके कई फ़ोटो एक साथ चुनें (Select Multiple Images)
                        </span>
                        <span className="text-[10px] text-neutral-400 font-sans block mt-0.5">
                          जितनी भी फ़ोटो आप चुनेंगे वे नंबर 1, 2, 3... के साथ सेट हो जाएँगी
                        </span>
                      </div>
                      <input
                        type="file"
                        id="batch-images-input"
                        multiple
                        accept="image/*"
                        onChange={handleBatchImagesUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Image Grid with Numbers */}
                  {batchImages.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider font-sans">
                        अपलोड की गई कुल फ़ोटो: ({batchImages.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                        {batchImages.map((img) => (
                          <div key={img.id} className="relative group border rounded-lg overflow-hidden bg-neutral-100 h-24">
                            <img src={img.url} alt={img.fileName} className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                              फ़ोटो #{img.fileNumber}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchImage(img.id)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                              title="हटाएं"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate font-sans">
                              {img.fileName}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {batchImages.length === 0 && (
                    <div className="py-12 text-center text-neutral-400 font-sans space-y-1">
                      <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p className="text-xs font-bold text-neutral-500">अभी कोई फ़ोटो अपलोड नहीं है।</p>
                      <p className="text-[10px] text-neutral-400">आप बिना फ़ोटो के भी आगे बढ़कर डिफ़ॉल्ट इमेज रख सकते हैं।</p>
                    </div>
                  )}
                </div>

                {/* MIX BUTTON */}
                <div className="mt-4 pt-3 border-t">
                  <button
                    type="button"
                    onClick={handleMixBatch}
                    className="w-full py-4 bg-gradient-to-r from-[#ff6f00] to-amber-600 hover:from-amber-600 hover:to-[#ff6f00] text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 select-none"
                  >
                    <Sparkles className="w-5 h-5 text-amber-200 animate-spin" />
                    <span>मिश्रण करें एवं व्यवस्थित देखें (Mix & Systemic Align) 🔀</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {batchError && (
            <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-2 font-sans">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{batchError}</span>
            </div>
          )}

          {/* SYSTEMIC MIXED RESULT CARDS */}
          {batchArticles.length > 0 && (
            <div className="space-y-6 pt-6 border-t-2 border-neutral-200">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900 text-white p-5 rounded-xl shadow-md">
                <div>
                  <h4 className="text-base font-black flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#ff6f00] rounded-full inline-block"></span>
                    <span>सिस्टमैटिक लाइन में तैयार खबरें ({batchArticles.length})</span>
                  </h4>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    यहाँ हर खबर के सामने उसकी अपलोड की गई फ़ोटो लग चुकी है। आप ड्रॉपडाउन या ऊपर/नीचे बटन दबाकर किसी भी खबर की फ़ोटो आसानी से चेंज कर सकते हैं।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAllBatchArticles(true)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-md transition-all cursor-pointer"
                  >
                    सब चुनें ☑️
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllBatchArticles(false)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-md transition-all cursor-pointer"
                  >
                    सब हटाएं 🗑️
                  </button>
                </div>
              </div>

              {/* LIST OF PARSED ARTICLES */}
              <div className="space-y-6">
                {batchArticles.map((art, index) => (
                  <div
                    key={art.id}
                    className={`bg-white border-2 rounded-2xl p-5 md:p-6 shadow-sm transition-all space-y-4 ${
                      art.checked ? "border-[#ff6f00]/60 bg-orange-50/5" : "border-neutral-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!art.checked}
                          onChange={() => toggleBatchArticleSelect(art.id)}
                          className="w-5 h-5 rounded accent-[#ff6f00] cursor-pointer"
                        />
                        <span className="text-xs font-black text-white bg-neutral-900 px-3 py-1 rounded-full font-mono">
                          खबर #{index + 1}
                        </span>
                        {art.assignedImageIndex >= 0 && batchImages[art.assignedImageIndex] && (
                          <span className="text-xs font-extrabold text-[#ff6f00] bg-orange-100 px-2.5 py-0.5 rounded font-sans">
                            मैच फ़ोटो #{batchImages[art.assignedImageIndex].fileNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-neutral-400 font-sans">
                        सामग्री आकार: {art.content.length} अक्षर (पूरा सुरक्षित)
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left 2 Cols: Form Fields */}
                      <div className="lg:col-span-2 space-y-3">
                        <div>
                          <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">
                            शीर्षक (Title):
                          </label>
                          <input
                            type="text"
                            value={art.title}
                            onChange={(e) => handleBatchArticleFieldChange(art.id, "title", e.target.value)}
                            className="w-full text-sm font-bold p-2.5 border border-neutral-300 rounded-lg focus:border-[#ff6f00] outline-none text-neutral-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">
                            उप-शीर्षक (Subtitle):
                          </label>
                          <input
                            type="text"
                            value={art.subtitle}
                            onChange={(e) => handleBatchArticleFieldChange(art.id, "subtitle", e.target.value)}
                            className="w-full text-xs font-medium p-2 border border-neutral-300 rounded-lg focus:border-[#ff6f00] outline-none text-neutral-700 bg-white font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 font-sans">
                          <div>
                            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">
                              श्रेणी (Category):
                            </label>
                            <select
                              value={art.category}
                              onChange={(e) => handleBatchArticleFieldChange(art.id, "category", e.target.value)}
                              className="w-full text-xs font-bold p-2 border border-neutral-300 rounded-lg focus:border-[#ff6f00] outline-none bg-white text-neutral-900"
                            >
                              {CATEGORIES.filter(c => c.key !== "all").map(cat => (
                                <option key={cat.key} value={cat.key}>{cat.hindiName}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">
                              राज्य (State):
                            </label>
                            <select
                              value={art.state || ""}
                              onChange={(e) => handleBatchArticleFieldChange(art.id, "state", e.target.value)}
                              className="w-full text-xs p-2 border border-neutral-300 rounded-lg focus:border-[#ff6f00] outline-none bg-white text-neutral-800"
                            >
                              <option value="">कोई राज्य नहीं (All India)</option>
                              {STATES.filter(s => s !== "सभी राज्य").map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">
                            पूरा विस्तृत समाचार (Content - No Truncation):
                          </label>
                          <textarea
                            value={art.content}
                            onChange={(e) => handleBatchArticleFieldChange(art.id, "content", e.target.value)}
                            rows={6}
                            className="w-full text-xs p-3 border border-neutral-300 rounded-lg focus:border-[#ff6f00] outline-none font-sans leading-relaxed text-neutral-800 bg-white resize-y"
                          ></textarea>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">
                            टैग्स (Tags comma separated):
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(art.tags) ? art.tags.join(", ") : art.tags}
                            onChange={(e) => handleBatchArticleFieldChange(art.id, "tags", e.target.value)}
                            className="w-full text-xs p-2 border border-neutral-300 rounded-lg focus:border-[#ff6f00] outline-none text-neutral-700 bg-white font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">
                            मेटा विवरण (Meta Description):
                          </label>
                          <textarea
                            rows={2}
                            value={art.metaDescription || ""}
                            onChange={(e) => handleBatchArticleFieldChange(art.id, "metaDescription", e.target.value)}
                            placeholder="सर्च इंजन व सोशल शेयरिंग के लिए मेटा विवरण (वैकल्पिक)..."
                            className="w-full text-xs p-2 border border-neutral-300 rounded-lg focus:border-[#ff6f00] outline-none text-neutral-700 bg-white font-sans resize-y"
                          ></textarea>
                        </div>
                      </div>

                      {/* Right 1 Col: Photo Assignment & Controls */}
                      <div className="bg-neutral-50 p-4 border rounded-xl space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="block text-[10px] font-black text-neutral-700 uppercase tracking-wider mb-2">
                            🖼️ खबर की फोटो सेट करें (Image Selection):
                          </span>

                          <div className="relative h-44 rounded-lg overflow-hidden border bg-neutral-200 mb-3 shadow-inner">
                            <img src={art.image} alt="" className="w-full h-full object-cover" />
                            {art.assignedImageIndex >= 0 && batchImages[art.assignedImageIndex] && (
                              <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-black px-2 py-0.5 rounded backdrop-blur-md">
                                फ़ोटो #{batchImages[art.assignedImageIndex].fileNumber}
                              </div>
                            )}
                          </div>

                          {/* Image Switcher Controls */}
                          {batchImages.length > 0 ? (
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-neutral-500 font-sans">
                                अपलोड की गई फोटो चुनें:
                              </label>
                              <select
                                value={art.assignedImageIndex >= 0 ? art.assignedImageIndex : ""}
                                onChange={(e) => handleBatchArticleFieldChange(art.id, "assignedImageIndex", e.target.value)}
                                className="w-full text-xs font-bold p-2 border border-neutral-300 rounded-lg bg-white focus:border-[#ff6f00] outline-none text-neutral-800"
                              >
                                {batchImages.map((img, i) => (
                                  <option key={img.id} value={i}>
                                    फ़ोटो #{img.fileNumber}: {img.fileName}
                                  </option>
                                ))}
                              </select>

                              {/* Shift Up/Down Buttons */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleShiftBatchArticleImage(art.id, "up")}
                                  className="flex-1 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-extrabold rounded-lg text-[11px] transition-colors cursor-pointer"
                                >
                                  ⬆️ पिछली फ़ोटो
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShiftBatchArticleImage(art.id, "down")}
                                  className="flex-1 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-extrabold rounded-lg text-[11px] transition-colors cursor-pointer"
                                >
                                  ⬇️ अगली फ़ोटो
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-neutral-400 font-sans italic">
                              फ़ोटो का सीधा URL दर्ज करें:
                            </div>
                          )}

                          <div className="mt-2">
                            <input
                              type="text"
                              value={art.image}
                              onChange={(e) => handleBatchArticleFieldChange(art.id, "image", e.target.value)}
                              placeholder="Image URL..."
                              className="w-full text-[10px] p-1.5 border border-neutral-300 rounded bg-white text-neutral-600 font-mono truncate"
                            />
                          </div>
                        </div>

                        <div className="pt-2 text-[10px] text-neutral-400 font-sans text-center border-t border-neutral-200">
                          लेखक: {art.author}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PUBLISH ALL BATCH ARTICLES BUTTON */}
              <div className="p-6 bg-gradient-to-r from-neutral-900 to-neutral-950 text-white rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-orange-500/30">
                <div>
                  <h4 className="text-base font-black text-white">सभी तैयार खबरों को श्रेणीवार प्रकाशित करें</h4>
                  <p className="text-xs text-neutral-400 font-sans mt-1">
                    चयनित {batchArticles.filter(a => a.checked).length} समाचारों को अपनी-अपनी सही फोटो और श्रेणी के साथ लाइव किया जाएगा।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublishBatchArticles}
                  disabled={publishingBatch || batchArticles.filter(a => a.checked).length === 0}
                  className="px-8 py-4 bg-[#ff6f00] hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-xl text-xs tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 select-none"
                >
                  {publishingBatch ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>सभी समाचार पब्लिश हो रहे हैं...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>सबमिट करें - सभी खबरें लाइव पब्लिश करें 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
