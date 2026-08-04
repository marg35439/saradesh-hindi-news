export interface Comment {
  id: string;
  name: string;
  text: string;
  date: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  category: string;
  subcategory?: string;
  state?: string;
  image: string;
  author: string;
  date: string;
  readTime: number;
  views: number;
  likes: number;
  comments: Comment[];
  tags: string[];
  metaDescription?: string;
  slug?: string;
  mainCategory?: string;
  isBreaking: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  createdAt?: string;
}

export type CategoryKey = 'all' | 'national' | 'international' | 'state' | 'crime' | 'sports' | 'entertainment' | 'business' | 'tech' | 'lifestyle' | 'job' | 'education' | 'religion' | 'astrology' | 'schemes' | 'auto';

export interface CategoryInfo {
  key: CategoryKey;
  hindiName: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'all', hindiName: 'होम' },
  { key: 'national', hindiName: 'देश' },
  { key: 'state', hindiName: 'राज्य' },
  { key: 'crime', hindiName: 'क्राइम / अपराध' },
  { key: 'sports', hindiName: 'खेल' },
  { key: 'entertainment', hindiName: 'मनोरंजन' },
  { key: 'business', hindiName: 'बिजनेस' },
  { key: 'tech', hindiName: 'टेक' },
  { key: 'auto', hindiName: 'ऑटो' },
  { key: 'lifestyle', hindiName: 'लाइफस्टाइल' },
  { key: 'international', hindiName: 'विदेश' },
  { key: 'job', hindiName: 'नौकरी / करियर' },
  { key: 'astrology', hindiName: 'ज्योतिष / राशिफल' },
  { key: 'schemes', hindiName: 'सरकारी योजनाएं' },
  { key: 'education', hindiName: 'शिक्षा' },
  { key: 'religion', hindiName: 'धर्म' },
];

export interface SubCategoryInfo {
  key: string;
  hindiName: string;
  categoryKey?: CategoryKey;
  icon?: string;
}

export const SUBCATEGORIES: SubCategoryInfo[] = [
  { key: 'cricket', hindiName: 'क्रिकेट', categoryKey: 'sports', icon: '🏏' },
  { key: 'mobile', hindiName: 'मोबाइल', categoryKey: 'tech', icon: '📱' },
  { key: 'ev', hindiName: 'ईवी (इलेक्ट्रिक वाहन)', categoryKey: 'auto', icon: '⚡' },
  { key: 'rajneeti', hindiName: 'राजनीति', categoryKey: 'national', icon: '🏛️' },
  { key: 'auto_news', hindiName: 'ऑटो न्यूज़', categoryKey: 'auto', icon: '🚗' },
  { key: 'bollywood', hindiName: 'बॉलीवुड', categoryKey: 'entertainment', icon: '🎬' },
  { key: 'stockmarket', hindiName: 'शेयर बाजार', categoryKey: 'business', icon: '📈' },
  { key: 'jobalert', hindiName: 'जॉब अलर्ट', categoryKey: 'job', icon: '💼' },
  { key: 'rashifal', hindiName: 'राशिफल', categoryKey: 'astrology', icon: '🔮' },
];

export const PRESET_DESKS = [
  'नेशनल डेस्क',
  'खेल डेस्क',
  'मनोरंजन डेस्क',
  'बिजनेस डेस्क',
  'टेक डेस्क',
  'ऑटो डेस्क',
  'राजनीति डेस्क',
  'राज्य डेस्क',
  'क्राइम डेस्क',
  'लाइफस्टाइल डेस्क',
  'विदेश डेस्क',
  'धर्म-आध्यात्म डेस्क',
  'विशेष संवाददाता',
  'सम्पादकीय टीम',
];

export const STATES = [
  'सभी राज्य',
  'उत्तर प्रदेश',
  'बिहार',
  'राजस्थान',
  'मध्य प्रदेश',
  'दिल्ली',
  'उत्तराखंड',
  'झारखण्ड',
  'हरियाणा',
  'छत्तीसगढ़',
  'पंजाब',
  'गुजरात',
  'महाराष्ट्र',
  'हिमाचल प्रदेश',
  'पश्चिम बंगाल',
  'जम्मू-कश्मीर'
];

export interface PublisherInfoSettings {
  publisherName?: string;
  cinNumber?: string;
  chiefEditor?: string;
  address?: string;
  ownershipDetails?: string;
}

export interface ContactUsSettings {
  editorialEmail?: string;
  supportEmail?: string;
  phone?: string;
  address?: string;
}

export interface AuthorProfileData {
  id?: string;
  name: string;
  role?: string;
  bio?: string;
  experience?: string;
  avatar?: string;
  badge?: string;
  email?: string;
}

export interface SiteSettings {
  publisherInfo?: PublisherInfoSettings;
  contactUs?: ContactUsSettings;
}

