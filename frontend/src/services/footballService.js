/**
 * Football Score Service
 * Uses Football-Data.org API for live football scores
 */

import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Team name translations to Bengali
const teamNameToBengali = {
  'Manchester United': 'ম্যানচেস্টার ইউনাইটেড',
  'Manchester City': 'ম্যানচেস্টার সিটি',
  'Liverpool': 'লিভারপুল',
  'Chelsea': 'চেলসি',
  'Arsenal': 'আর্সেনাল',
  'Tottenham': 'টটেনহ্যাম',
  'Newcastle': 'নিউক্যাসল',
  'Real Madrid': 'রিয়াল মাদ্রিদ',
  'Barcelona': 'বার্সেলোনা',
  'Atletico Madrid': 'আতলেতিকো মাদ্রিদ',
  'Bayern Munich': 'বায়ার্ন মিউনিখ',
  'Borussia Dortmund': 'ডর্টমুন্ড',
  'Paris Saint-Germain': 'পিএসজি',
  'Juventus': 'জুভেন্টাস',
  'AC Milan': 'এসি মিলান',
  'Inter Milan': 'ইন্টার মিলান',
};

/**
 * Get Bengali team name if available
 */
const getBengaliTeamName = (englishName) => {
  // Check for partial matches
  for (const [eng, bn] of Object.entries(teamNameToBengali)) {
    if (englishName.includes(eng) || eng.includes(englishName)) {
      return bn;
    }
  }
  return englishName;
};

/**
 * Fetch live football scores from backend API
 * @returns {Promise<Array>} Array of football matches
 */
export const fetchFootballScores = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/football/live`, {
      timeout: 15000
    });
    
    const data = response.data;
    
    if (!data.matches || data.matches.length === 0) {
      return [{
        id: 'no-matches',
        teams: 'কোনো ম্যাচ পাওয়া যায়নি',
        teamsEn: 'No matches found',
        homeScore: 0,
        awayScore: 0,
        status: 'অপেক্ষমাণ',
        statusEn: 'Waiting',
        league: 'ফুটবল',
        leagueEn: 'Football',
        isLive: false
      }];
    }
    
    return data.matches.map(match => {
      const teams = match.teams.split(' vs ');
      const homeTeam = teams[0] || 'Home';
      const awayTeam = teams[1] || 'Away';
      
      return {
        id: match.id,
        teams: `${getBengaliTeamName(homeTeam)} vs ${getBengaliTeamName(awayTeam)}`,
        teamsEn: match.teamsEn || match.teams,
        homeScore: match.homeScore || 0,
        awayScore: match.awayScore || 0,
        status: match.status,
        statusEn: match.statusEn,
        league: match.league,
        leagueEn: match.leagueEn,
        minute: match.minute,
        isLive: match.isLive,
        utcDate: match.utcDate
      };
    });
    
  } catch (error) {
    console.error('Football API Error:', error);
    // Return error state
    return [{
      id: 'error',
      teams: 'ম্যাচ লোড করতে সমস্যা',
      teamsEn: 'Error loading matches',
      homeScore: 0,
      awayScore: 0,
      status: 'ত্রুটি',
      statusEn: 'Error',
      league: 'ফুটবল',
      leagueEn: 'Football',
      isLive: false
    }];
  }
};

/**
 * Get match status color class
 */
export const getMatchStatusColor = (isLive) => {
  return isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500';
};

export default { fetchFootballScores, getMatchStatusColor };
