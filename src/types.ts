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
  state?: string;
  image: string;
  author: string;
  date: string;
  readTime: number;
  views: number;
  likes: number;
  comments: Comment[];
  tags: string[];
  isBreaking: boolean;
  isFeatured: boolean;
  isTrending: boolean;
}

export type CategoryKey = 'all' | 'national' | 'international' | 'state' | 'sports' | 'entertainment' | 'business' | 'tech' | 'lifestyle' | 'job' | 'education' | 'religion' | 'astrology' | 'schemes';

export interface CategoryInfo {
  key: CategoryKey;
  hindiName: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'all', hindiName: 'होम' },
  { key: 'national', hindiName: 'देश' },
  { key: 'state', hindiName: 'राज्य' },
  { key: 'sports', hindiName: 'खेल' },
  { key: 'entertainment', hindiName: 'मनोरंजन' },
  { key: 'business', hindiName: 'बिजनेस' },
  { key: 'tech', hindiName: 'टेक' },
  { key: 'lifestyle', hindiName: 'लाइफस्टाइल' },
  { key: 'international', hindiName: 'विदेश' },
  { key: 'job', hindiName: 'नौकरी / करियर' },
  { key: 'astrology', hindiName: 'ज्योतिष / राशिफल' },
  { key: 'schemes', hindiName: 'सरकारी योजनाएं' },
  { key: 'education', hindiName: 'शिक्षा' },
  { key: 'religion', hindiName: 'धर्म' },
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
