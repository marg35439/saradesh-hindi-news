import { Article } from "../types";

// Comprehensive Hindi/Devanagari Keyword to English News Dictionary
const HINDI_TO_ENGLISH_MAP: Record<string, string> = {
  // Topics & Entities
  "नीट": "neet",
  "यूजी": "ug",
  "पेपर": "paper",
  "लीक": "leak",
  "विवाद": "controversy",
  "आरबीआई": "rbi",
  "रेपो": "repo",
  "रेट": "rate",
  "बदलाव": "changes",
  "ब्याज": "interest",
  "बैंक": "bank",
  "गवर्नर": "governor",
  "भारत": "india",
  "ऑस्ट्रेलिया": "australia",
  "पाकिस्तान": "pakistan",
  "चीन": "china",
  "अमेरिका": "usa",
  "गुजरात": "gujarat",
  "चेन्नई": "chennai",
  "आईपीएल": "ipl",
  "क्रिकेट": "cricket",
  "मैच": "match",
  "जीत": "wins",
  "जीत दर्ज": "victory",
  "हार": "defeat",
  "प्लेऑफ": "playoffs",
  "फाइनल": "final",
  "कप्तान": "captain",
  "शुभमन": "shubman",
  "गिल": "gill",
  "धोनी": "dhoni",
  "विराट": "virat",
  "कोहली": "kohli",
  "रोहित": "rohit",
  "शर्मा": "sharma",
  "सोना": "gold",
  "चांदी": "silver",
  "भाव": "price",
  "गिरावट": "drop",
  "उछाल": "surge",
  "गिरा": "drops",
  "बढ़ा": "rises",
  "बजट": "budget",
  "चुनाव": "election",
  "परिणाम": "results",
  "नतीजे": "results",
  "वोट": "vote",
  "मतदान": "polling",
  "रैली": "rally",
  "पीएम": "pm",
  "मोदी": "modi",
  "अमित": "amit",
  "शाह": "shah",
  "राहुल": "rahul",
  "गांधी": "gandhi",
  "सीएम": "cm",
  "योगी": "yogi",
  "सुप्रीम": "supreme",
  "कोर्ट": "court",
  "हाईकोर्ट": "high-court",
  "फैसला": "verdict",
  "आदेश": "order",
  "याचिका": "petition",
  "गिरफ्तार": "arrested",
  "गिरफ्तारी": "arrest",
  "पुलिस": "police",
  "अपराध": "crime",
  "हत्या": "murder",
  "हादसा": "accident",
  "मौत": "death",
  "शव": "body",
  "धावा": "raid",
  "सीबीआई": "cbi",
  "ईडी": "ed",
  "मौसम": "weather",
  "बारिश": "rain",
  "अलर्ट": "alert",
  "भूकंप": "earthquake",
  "तूफान": "storm",
  "गर्मी": "heatwave",
  "ठंड": "cold",
  "शेयर": "stock",
  "बाजार": "market",
  "सेंसेक्स": "sensex",
  "निफ्टी": "nifty",
  "रुपया": "rupee",
  "डॉलर": "dollar",
  "ऑटो": "auto",
  "कार": "car",
  "बाइक": "bike",
  "लॉन्च": "launched",
  "कीमत": "price",
  "फीचर्स": "features",
  "इलेक्ट्रिक": "electric",
  "ईवी": "ev",
  "स्मार्टफोन": "smartphone",
  "मोबाइल": "mobile",
  "आईफोन": "iphone",
  "सैमसंग": "samsung",
  "ऐप्पल": "apple",
  "गूगल": "google",
  "एआई": "ai",
  "फिल्म": "movie",
  "बॉलीवुड": "bollywood",
  "ट्रेलर": "trailer",
  "रिलीज": "release",
  "एक्टर": "actor",
  "एक्ट्रेस": "actress",
  "राशिफल": "horoscope",
  "ज्योतिष": "astrology",
  "ग्रह": "planet",
  "नक्षत्र": "stars",
  "योजना": "scheme",
  "सरकारी": "sarkari",
  "नौकरी": "job",
  "भर्ती": "recruitment",
  "परीक्षा": "exam",
  "रिजल्ट": "result",
  "एडमिट": "admit",
  "कार्ड": "card",
  "छात्र": "students",
  "एनटीए": "nta",
  "स्कैम": "scam",
  "धांधली": "fraud",
  "बयान": "statement",
  "संसदीय": "parliamentary",
  "समिति": "committee",
  "रिपोर्ट": "report",
  "धमाकेदार": "spectacular",
  "मुकाबला": "clash",
  "समीकरण": "equations",
  "घातक": "deadly",
  "गेंदबाजी": "bowling",
  "बल्लेबाजी": "batting",
  "रन": "runs",
  "विकेट": "wickets",
  "अंक": "points",
  "तालिका": "table",
  "उत्तर": "uttar",
  "प्रदेश": "pradesh",
  "बिहार": "bihar",
  "राजस्थान": "rajasthan",
  "मध्य": "madhya",
  "दिल्ली": "delhi",
  "उत्तराखंड": "uttarakhand",
  "झारखंड": "jharkhand",
  "हरियाणा": "haryana",
  "पंजाब": "punjab",
  "महाराष्ट्र": "maharashtra"
};

// Hindi Devanagari character transliteration map for fallback character-by-character conversion
const DEVANAGARI_TRANSLIT: Record<string, string> = {
  'अ':'a', 'आ':'aa', 'इ':'i', 'ई':'ee', 'उ':'u', 'ऊ':'oo', 'ऋ':'ri', 'ए':'e', 'ऐ':'ai', 'ओ':'o', 'औ':'au',
  'क':'k', 'ख':'kh', 'ग':'g', 'घ':'gh', 'ङ':'n',
  'च':'ch', 'छ':'chh', 'ज':'j', 'झ':'jh', 'ञ':'n',
  'ट':'t', 'ठ':'th', 'ड':'d', 'ढ':'dh', 'ण':'n',
  'त':'t', 'थ':'th', 'द':'d', 'ध':'dh', 'न':'n',
  'प':'p', 'फ':'f', 'ब':'b', 'भ':'bh', 'म':'m',
  'य':'y', 'र':'r', 'ल':'l', 'व':'v', 'श':'sh', 'ष':'sh', 'स':'s', 'ह':'h',
  'ा':'a', 'ि':'i', 'ी':'ee', 'ु':'u', 'ू':'oo', 'ृ':'ri', 'े':'e', 'ै':'ai', 'ो':'o', 'ौ':'au', 'ं':'n', 'ः':'h', 'ँ':'n', '्':'',
  '०':'0', '१':'1', '२':'2', '३':'3', '४':'4', '५':'5', '६':'6', '७':'7', '८':'8', '९':'9'
};

// Stop words to remove for concise, high-value SEO keyword slugs
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by", "from", "up", "about", "into", "over", "after", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "but", "if", "than", "so",
  "hai", "hein", "ka", "ki", "ke", "ko", "par", "se", "ne", "me", "mein", "bhi", "aur", "ya", "toh", "tak", "kya", "kab", "kahan", "kaise", "kyun", "huye", "ho", "raha", "rahi", "rahe", "gaya", "gayi", "gaye", "karta", "karti", "karte"
]);

/**
 * Transliterates Devanagari Hindi text to clean English Latin string
 */
function transliterateHindi(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (DEVANAGARI_TRANSLIT[char] !== undefined) {
      result += DEVANAGARI_TRANSLIT[char];
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Generates a clean, professional English SEO slug from a title (Hindi or English).
 * Filters stop words and extracts high-value keywords to keep slugs concise (max ~6-8 words / 50-60 chars).
 */
export function generateSeoSlug(title: string): string {
  if (!title || typeof title !== "string") return "news";

  let workingTitle = title.trim();

  // 1. First check if any multi-word Hindi dictionary matches exist and substitute them
  // Sort dictionary keys by length descending to match longer phrases first
  const dictKeys = Object.keys(HINDI_TO_ENGLISH_MAP).sort((a, b) => b.length - a.length);
  for (const key of dictKeys) {
    if (workingTitle.includes(key)) {
      const reg = new RegExp(key, "gi");
      workingTitle = workingTitle.replace(reg, ` ${HINDI_TO_ENGLISH_MAP[key]} `);
    }
  }

  // 2. Transliterate remaining Devanagari characters
  workingTitle = transliterateHindi(workingTitle);

  // 3. Lowercase & strip non-alphanumeric chars except spaces and hyphens
  workingTitle = workingTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .replace(/[\s\-]+/g, " ")
    .trim();

  // 4. Split into tokens and remove stop words & single character gibberish
  const tokens = workingTitle
    .split(" ")
    .filter(token => token.length > 0 && !STOP_WORDS.has(token) && (token.length > 1 || !isNaN(Number(token))));

  // 5. Select top keywords up to max 7 words or 55 characters
  const selectedTokens: string[] = [];
  let currentLength = 0;

  for (const token of tokens) {
    if (selectedTokens.length >= 7) break;
    if (currentLength + token.length > 55 && selectedTokens.length >= 2) break;
    selectedTokens.push(token);
    currentLength += token.length + 1;
  }

  const slug = selectedTokens.join("-");
  return slug || "news-update";
}

/**
 * Normalizes category keys to enterprise SEO main category paths:
 * national, world, politics, business, sports, technology, crime, health, education, entertainment, auto, lifestyle, religion, astrology, etc.
 */
export function getMainCategorySlug(category?: string, mainCategory?: string): string {
  if (mainCategory && typeof mainCategory === "string" && mainCategory.trim()) {
    const cleanMain = mainCategory.toLowerCase().trim().replace(/[^a-z0-9\-]/g, "");
    if (cleanMain) return cleanMain;
  }

  const cat = (category || "").toLowerCase().trim();

  switch (cat) {
    case "national":
    case "desh":
    case "rajneeti":
    case "politics":
    case "schemes":
    case "state":
    case "states":
      return "national";
    case "international":
    case "world":
    case "videsh":
      return "world";
    case "business":
    case "bazaar":
    case "economy":
    case "stockmarket":
      return "business";
    case "sports":
    case "khel":
    case "cricket":
      return "sports";
    case "tech":
    case "technology":
    case "mobile":
      return "technology";
    case "crime":
    case "apradh":
      return "crime";
    case "entertainment":
    case "manoranjan":
    case "bollywood":
    case "cinema":
      return "entertainment";
    case "auto":
    case "automobile":
    case "ev":
      return "auto";
    case "lifestyle":
    case "health":
      return "lifestyle";
    case "education":
    case "job":
    case "jobs":
    case "career":
      return "education";
    case "astrology":
    case "rashifal":
    case "jyotish":
      return "astrology";
    case "religion":
    case "dharm":
      return "religion";
    default:
      return cat ? cat.replace(/[^a-z0-9\-]/g, "") : "national";
  }
}

/**
 * Returns canonical relative URL path for an article:
 * Format: `/{mainCategory}/{seoSlug}-{articleId}`
 * Example: `/business/rbi-keeps-repo-rate-unchanged-1785740142283`
 */
export function getArticleUrl(
  article?: {
    id?: string;
    title?: string;
    category?: string;
    slug?: string;
    mainCategory?: string;
  } | null,
  domainPrefix?: string
): string {
  if (!article || !article.id) {
    return domainPrefix ? `${domainPrefix.replace(/\/+$/, "")}/` : "/";
  }
  const cat = getMainCategorySlug(article.category, article.mainCategory);
  const title = article.title || "news";
  const slug = (article.slug && article.slug.trim()) ? article.slug.trim().toLowerCase() : generateSeoSlug(title);
  
  // Clean slug of any trailing article IDs or slashes
  const cleanSlug = slug.replace(/\-[a-z0-9]{10,}$/i, "").replace(/^\/+|\/+$/g, "");

  // If article.id is already formatted like 'art-123', ensure clean dash joining
  const cleanId = String(article.id).trim();

  // If cleanSlug already ends with or equals cleanId, don't append cleanId twice
  let path = `/${cat}/${cleanSlug}-${cleanId}`;
  if (cleanSlug === cleanId || cleanSlug.endsWith(`-${cleanId}`)) {
    path = `/${cat}/${cleanSlug}`;
  }

  if (domainPrefix) {
    const cleanDomain = domainPrefix.replace(/\/+$/, "");
    return `${cleanDomain}${path}`;
  }
  return path;
}

/**
 * Extracts article ID and category/slug from request pathname or query string.
 * Supports:
 * - Path: `/{category}/{slug}-{articleId}`
 * - Path: `/article/{articleId}`
 * - Query: `/?article={articleId}`
 */
export function parseArticleUrlPath(
  pathname?: string | null,
  searchParams?: URLSearchParams | null
): { category?: string; slug?: string; id?: string; articleId?: string } | null {
  if (!pathname && !searchParams) return null;
  if (searchParams && searchParams.get("article")) {
    const id = searchParams.get("article")!;
    return { id, articleId: id };
  }

  const cleanPath = (pathname || "").trim().split("?")[0].replace(/\/+$/, "");
  if (!cleanPath || cleanPath === "/") return null;

  // Path like /article/123 or /article/art-123
  if (cleanPath.startsWith("/article/")) {
    const id = cleanPath.replace("/article/", "").trim();
    return id ? { id, articleId: id } : null;
  }

  // Path like /business/rbi-keeps-repo-rate-unchanged-1785740142283
  const segments = cleanPath.split("/").filter(Boolean);
  if (segments.length === 2) {
    const category = segments[0];
    const slugAndId = segments[1];

    if (!slugAndId) return null;

    // Try to extract ID from end of slugAndId
    // Pattern matches: -art-123, -fresh-news-123, -1785740142283, -news-123, etc.
    const lastHyphenIdx = slugAndId.lastIndexOf("-");
    if (lastHyphenIdx > 0) {
      const artMatch = slugAndId.match(/(art-[a-z0-9\-]+|fresh-news-[a-z0-9\-]+|batch-art-[a-z0-9\-]+|news-[0-9]+|[0-9]{10,})$/i);
      if (artMatch) {
        const extractedId = artMatch[1];
        const extractedSlug = slugAndId.substring(0, slugAndId.length - extractedId.length - 1);
        return {
          category,
          slug: extractedSlug,
          id: extractedId,
          articleId: extractedId
        };
      }

      const possibleId = slugAndId.substring(lastHyphenIdx + 1);
      const slug = slugAndId.substring(0, lastHyphenIdx);
      return {
        category,
        slug,
        id: possibleId,
        articleId: possibleId
      };
    }
  }

  return null;
}
