/**
 * Translation Service
 * Multi-language translation using LibreTranslate or Google Translate API
 */

import axios from 'axios';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'bn', name: 'বাংলা', nameEn: 'Bengali' },
  { code: 'en', name: 'ইংরেজি', nameEn: 'English' },
  { code: 'hi', name: 'হিন্দি', nameEn: 'Hindi' },
  { code: 'ur', name: 'উর্দু', nameEn: 'Urdu' },
  { code: 'ar', name: 'আরবি', nameEn: 'Arabic' },
  { code: 'es', name: 'স্প্যানিশ', nameEn: 'Spanish' },
  { code: 'fr', name: 'ফরাসি', nameEn: 'French' },
  { code: 'de', name: 'জার্মান', nameEn: 'German' },
  { code: 'zh', name: 'চীনা', nameEn: 'Chinese' },
  { code: 'ja', name: 'জাপানি', nameEn: 'Japanese' },
  { code: 'ko', name: 'কোরিয়ান', nameEn: 'Korean' }
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Translate text using backend API
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} Translated text
 */
export const translateText = async (text, sourceLang, targetLang) => {
  if (!text.trim()) {
    return '';
  }

  try {
    const response = await axios.post(`${BACKEND_URL}/api/translate`, {
      text,
      source: sourceLang,
      target: targetLang
    });
    
    return response.data.translated_text;
  } catch (error) {
    console.error('Translation API Error:', error);
    // Fallback: Return a message indicating translation is unavailable
    throw new Error('অনুবাদে ত্রুটি হয়েছে। পরে আবার চেষ্টা করুন।');
  }
};

/**
 * Get language name by code
 */
export const getLanguageName = (code, inBengali = true) => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  if (!lang) return code;
  return inBengali ? lang.name : lang.nameEn;
};

export default { translateText, SUPPORTED_LANGUAGES, getLanguageName };
