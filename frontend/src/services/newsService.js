/**
 * News Service
 * Uses NewsData.io API for Bangladesh news
 */

import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// News categories
export const NEWS_CATEGORIES = [
  { id: 'all', name: 'সব', nameEn: 'All' },
  { id: 'national', name: 'জাতীয়', nameEn: 'National' },
  { id: 'international', name: 'আন্তর্জাতিক', nameEn: 'International' },
  { id: 'economy', name: 'অর্থনীতি', nameEn: 'Economy' },
  { id: 'sports', name: 'খেলা', nameEn: 'Sports' },
  { id: 'technology', name: 'প্রযুক্তি', nameEn: 'Technology' },
  { id: 'entertainment', name: 'বিনোদন', nameEn: 'Entertainment' }
];

// Category mapping for display
const categoryToBengali = {
  'politics': 'রাজনীতি',
  'business': 'অর্থনীতি',
  'sports': 'খেলা',
  'technology': 'প্রযুক্তি',
  'entertainment': 'বিনোদন',
  'world': 'আন্তর্জাতিক',
  'science': 'বিজ্ঞান',
  'health': 'স্বাস্থ্য',
  'lifestyle': 'জীবনধারা',
  'education': 'শিক্ষা',
  'environment': 'পরিবেশ',
  'top': 'শীর্ষ',
  'general': 'সাধারণ'
};

/**
 * Get Bengali category name
 */
const getBengaliCategory = (category) => {
  if (!category) return 'সাধারণ';
  return categoryToBengali[category.toLowerCase()] || category;
};

/**
 * Format time to Bengali relative time
 */
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'সম্প্রতি';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${diffMins} মিনিট আগে`;
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    if (diffDays < 7) return `${diffDays} দিন আগে`;
    return date.toLocaleDateString('bn-BD');
  } catch {
    return 'সম্প্রতি';
  }
};

/**
 * Fetch news articles from backend API
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Array of news articles
 */
export const fetchNews = async (category = 'all') => {
  try {
    const url = category === 'all' 
      ? `${BACKEND_URL}/api/news`
      : `${BACKEND_URL}/api/news?category=${category}`;
      
    const response = await axios.get(url, {
      timeout: 15000
    });
    
    const data = response.data;
    
    if (!data.articles || data.articles.length === 0) {
      return [{
        id: 'no-news',
        title: 'কোনো খবর পাওয়া যায়নি',
        titleEn: 'No news found',
        source: 'BdAsk',
        time: 'এখন',
        category: 'সাধারণ',
        categoryEn: 'General',
        image: null,
        link: null
      }];
    }
    
    return data.articles.map(article => ({
      id: article.id || Math.random().toString(),
      title: article.title || 'শিরোনাম নেই',
      titleEn: article.title || 'No title',
      description: article.description || '',
      source: article.source || 'Unknown',
      time: formatRelativeTime(article.pubDate),
      category: getBengaliCategory(article.category),
      categoryEn: article.category || 'general',
      image: article.image,
      link: article.link
    }));
    
  } catch (error) {
    console.error('News API Error:', error);
    // Return error state
    return [{
      id: 'error',
      title: 'খবর লোড করতে সমস্যা হয়েছে',
      titleEn: 'Error loading news',
      source: 'System',
      time: 'এখন',
      category: 'ত্রুটি',
      categoryEn: 'Error',
      image: null,
      link: null
    }];
  }
};

/**
 * Get category color
 */
export const getCategoryColor = (category) => {
  const colors = {
    'অর্থনীতি': 'bg-emerald-500',
    'জাতীয়': 'bg-blue-500',
    'রাজনীতি': 'bg-blue-500',
    'আন্তর্জাতিক': 'bg-purple-500',
    'প্রযুক্তি': 'bg-cyan-500',
    'খেলা': 'bg-orange-500',
    'বিনোদন': 'bg-pink-500',
    'স্বাস্থ্য': 'bg-red-500',
    'শিক্ষা': 'bg-indigo-500',
    'বিজ্ঞান': 'bg-teal-500',
    'সাধারণ': 'bg-gray-500',
    'শীর্ষ': 'bg-amber-500',
    'ত্রুটি': 'bg-red-600'
  };
  return colors[category] || 'bg-gray-500';
};

export default { fetchNews, NEWS_CATEGORIES, getCategoryColor };
