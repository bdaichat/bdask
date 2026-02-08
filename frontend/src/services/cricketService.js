/**
 * Cricket Score Service
 * Uses CricketData.org API for live cricket scores
 */

import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Demo data for fallback when API is unavailable
const DEMO_CRICKET_SCORES = [
  {
    id: 'demo-1',
    name: 'বাংলাদেশ vs ভারত',
    teams: ['Bangladesh', 'India'],
    status: 'লাইভ ম্যাচ নেই',
    matchType: 'ODI',
    score: [],
    matchStarted: false,
    matchEnded: false,
    isLive: false
  }
];

/**
 * Convert English team names to Bengali
 */
const teamNameToBengali = {
  'Bangladesh': 'বাংলাদেশ',
  'India': 'ভারত',
  'Pakistan': 'পাকিস্তান',
  'Australia': 'অস্ট্রেলিয়া',
  'England': 'ইংল্যান্ড',
  'South Africa': 'দক্ষিণ আফ্রিকা',
  'New Zealand': 'নিউজিল্যান্ড',
  'Sri Lanka': 'শ্রীলঙ্কা',
  'West Indies': 'ওয়েস্ট ইন্ডিজ',
  'Afghanistan': 'আফগানিস্তান',
  'Zimbabwe': 'জিম্বাবুয়ে',
  'Ireland': 'আয়ারল্যান্ড',
  'Netherlands': 'নেদারল্যান্ডস',
  'Scotland': 'স্কটল্যান্ড',
  'Nepal': 'নেপাল',
  'UAE': 'সংযুক্ত আরব আমিরাত',
  // BPL Teams
  'Comilla Victorians': 'কুমিল্লা ভিক্টরিয়ান্স',
  'Dhaka Dominators': 'ঢাকা ডমিনেটরস',
  'Fortune Barishal': 'ফরচুন বরিশাল',
  'Khulna Tigers': 'খুলনা টাইগার্স',
  'Rangpur Riders': 'রংপুর রাইডার্স',
  'Sylhet Strikers': 'সিলেট স্ট্রাইকার্স',
  'Chattogram Challengers': 'চট্টগ্রাম চ্যালেঞ্জার্স'
};

/**
 * Get Bengali team name
 */
const getBengaliTeamName = (englishName) => {
  return teamNameToBengali[englishName] || englishName;
};

/**
 * Format score for display
 */
const formatScore = (scoreArray) => {
  if (!scoreArray || scoreArray.length === 0) return 'স্কোর পাওয়া যায়নি';
  
  return scoreArray.map(s => {
    const runs = s.r || 0;
    const wickets = s.w || 0;
    const overs = s.o || 0;
    const inning = s.inning || '';
    return `${inning}: ${runs}/${wickets} (${overs})`;
  }).join(' | ');
};

/**
 * Fetch live cricket scores from backend API
 * @returns {Promise<Array>} Array of cricket matches
 */
export const fetchCricketScores = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/cricket/live`, {
      timeout: 15000
    });
    
    const data = response.data;
    
    if (!data.matches || data.matches.length === 0) {
      return [{
        id: 'no-matches',
        teams: 'কোনো লাইভ ম্যাচ নেই',
        teamsEn: 'No live matches',
        score: 'পরে আবার চেক করুন',
        status: 'অপেক্ষমাণ',
        statusEn: 'Waiting',
        league: 'ক্রিকেট',
        leagueEn: 'Cricket',
        isLive: false
      }];
    }
    
    return data.matches.map(match => {
      const teams = match.teams || [];
      const team1 = teams[0] || 'Team 1';
      const team2 = teams[1] || 'Team 2';
      
      const isLive = match.matchStarted && !match.matchEnded;
      
      return {
        id: match.id,
        teams: `${getBengaliTeamName(team1)} vs ${getBengaliTeamName(team2)}`,
        teamsEn: match.name || `${team1} vs ${team2}`,
        score: formatScore(match.score),
        status: isLive ? 'লাইভ' : (match.matchEnded ? 'সম্পন্ন' : match.status || 'আসন্ন'),
        statusEn: match.status || 'Upcoming',
        league: match.matchType || 'Cricket',
        leagueEn: match.matchType || 'Cricket',
        venue: match.venue || '',
        date: match.date || '',
        isLive: isLive
      };
    });
    
  } catch (error) {
    console.error('Cricket API Error:', error);
    // Return demo data on error
    return DEMO_CRICKET_SCORES.map(match => ({
      id: match.id,
      teams: match.name,
      teamsEn: match.name,
      score: 'API সমস্যা - পরে চেষ্টা করুন',
      status: 'ত্রুটি',
      statusEn: 'Error',
      league: match.matchType,
      leagueEn: match.matchType,
      isLive: false
    }));
  }
};

/**
 * Get match status color class
 */
export const getMatchStatusColor = (isLive) => {
  return isLive ? 'bg-red-500' : 'bg-green-500';
};

export default { fetchCricketScores, getMatchStatusColor };
