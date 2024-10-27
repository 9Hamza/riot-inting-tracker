//#region classes
class LeagueListDTO {
    constructor({ leagueId, entries, tier, name, queue }) {
      this.leagueId = leagueId;
      this.entries = entries.map(entry => new LeagueItemDTO(entry));
      this.tier = tier;
      this.name = name;
      this.queue = queue;
    }
}

class LeagueItemDTO {
    constructor({ freshBlood, wins, miniSeries, inactive, veteran, hotStreak, rank, leaguePoints, losses, summonerId}) {
        this.freshBlood = freshBlood;
        this.wins = wins;
        this.miniSeries = miniSeries ? new MiniSeriesDTO(miniSeries) : null;
        this.inactive = inactive;
        this.veteran = veteran;
        this.hotStreak = hotStreak;
        this.rank = rank;
        this.leaguePoints = leaguePoints;
        this.losses = losses;
        this.summonerId = summonerId;
    }
}

class MiniSeriesDTO {
    constructor({ losses, progress, target, wins}) {
        this.losses = losses;
        this.progress = progress;
        this.target = target;
        this.wins = wins;
    }
}

class LeagueEntryDTO {
    constructor({ leagueId, summonerId, queueType, tier, rank, leaguePoints, wins, losses, hotStreak, veteran, freshBlood, inactive, miniSeries}) {
        this.leagueId = leagueId;
        this.summonerId = summonerId;
        this.queueType = queueType;
        this.tier = tier;
        this.rank = rank;
        this.leaguePoints = leaguePoints;
        this.wins = wins;
        this.losses = losses;
        this.hotStreak = hotStreak;
        this.veteran = veteran;
        this.freshBlood = freshBlood;
        this.inactive = inactive;
        this.miniSeries = miniSeries ? new MiniSeriesDTO(miniSeries) : null;
    }
}

//#endregion

const riotApiKey = import.meta.env.VITE_RIOT_API_KEY;
// Rate Limiting Configuration
const REQUEST_LIMIT_1_SEC = 20;
const REQUEST_LIMIT_2_MIN = 100;
let requestsIn1Sec = 0;
let requestsIn2Min = 0;

var region = 'me1';
const rootlink = `https://${region}.api.riotgames.com`;
var endpoint = '';
var apiLink = `${rootlink}${endpoint}?api key=${riotApiKey}`;


var leagueListArray = [];
var playersPuuids = [];

const rank = Object.freeze({ 
    master: 0,
    grandmaster: 1,
    challenger: 2
  });

  async function rateLimitedFetch(url, options = {}) {
    while (requestsIn1Sec >= REQUEST_LIMIT_1_SEC - 1 || requestsIn2Min >= REQUEST_LIMIT_2_MIN - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const response = await fetch(url, options);
    requestsIn1Sec++;
    requestsIn2Min++;

    setTimeout(() => requestsIn1Sec--, 1000); // Decrement 1-second count after 1 second
    setTimeout(() => requestsIn2Min--, 120000); // Decrement 2-minute count after 2 minutes

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response;
}

  // Fetch league list for a specified rank
async function fetchLeagueList(rankInput) {
    const rankStringMap = {
        [rank.master]: 'masterleagues',
        [rank.grandmaster]: 'grandmasterleagues',
        [rank.challenger]: 'challengerleagues'
    };

    const rankString = rankStringMap[rankInput];
    if (!rankString) throw new Error('Invalid rank');

    const link = `https://me1.api.riotgames.com/lol/league/v4/${rankString}/by-queue/RANKED_SOLO_5x5?api_key=${riotApiKey}`;
    const response = await rateLimitedFetch(link);
    const data = await response.json();

    const leagueList = new LeagueListDTO(data);
    leagueListArray = [leagueList, ...leagueList.entries];
    return leagueListArray;
}

// Get a summoner by summoner ID. Returns: SummonerDTO 
// https://me1.api.riotgames.com/lol/summoner/v4/summoners/HhaLwqxygQumCshTvkK-_MzXYFzUNWxaq6FFIB5KDiUoN_wTOPIvoyVnvg?api_key=RGAPI-46f7cde7-5a38-44f3-b5e0-b7728d193af2
// Get a player's PUUID using summoner ID
async function getPuuid(summonerId) {
    const link = `${rootlink}/lol/summoner/v4/summoners/${summonerId}?api_key=${riotApiKey}`;
    const response = await rateLimitedFetch(link);
    const data = await response.json();
    return data.puuid;
}

// SOMETHING TO NOTE HERE IS THAT THE MATCH HISTORIES OF USERS ARE STORED IN THE EUROPE REGION FOR SOME REASON AHAHAHA
// https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/LMjebwoI02k0sP7H08pB7uiydcg_FQ9p7RRbVIohHIQSJ0rasGbhjNjIaMNqtgxWv53Dku5xEZLHmw/ids?type=ranked&start=0&count=100&api_key=RGAPI-46f7cde7-5a38-44f3-b5e0-b7728d193af2
// Get match history for a player's PUUID
async function getMatchHistoryRanked(puuid, startTime = '', endTime = '') {
    const startTimeArg = startTime ? `startTime=${startTime}&` : '';
    const endTimeArg = endTime ? `endTime=${endTime}&` : '';
    const link = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${startTimeArg}${endTimeArg}type=ranked&start=0&count=20&api_key=${riotApiKey}`;
    
    const response = await rateLimitedFetch(link);
    const data = await response.json();
    return data;
}

export async function findMostRecentInter() {
    let result;
    try {
        result = await main();
    } catch (error) {
        console.error("Error in findMostRecentInter:", error);
        throw error;
    }
    return result;
}

function printApiKey() {
    console.log(riotApiKey);
}

// Main function to find the player with the highest deaths
async function main() {
    await fetchLeagueList(rank.challenger);

    for (const entry of leagueListArray) {
        if (entry.summonerId) {
            try {
                const puuid = await getPuuid(entry.summonerId);
                playersPuuids.push(puuid);
            } catch (error) {
                console.error(`Error processing entry: ${error}`);
            }
        }
    }

    const puuidDeathsMap = new Map();

    for (const puuid of playersPuuids) {
        const matchHistoryList = await getMatchHistoryRanked(puuid);
        const maxDeath = await getHighestDeathFromMatchHistoryList(puuid, matchHistoryList);
        puuidDeathsMap.set(puuid, maxDeath);
    }

    let maxDeaths = -Infinity;
    let maxPuuid = '';
    for (const [puuid, deaths] of puuidDeathsMap) {
        if (deaths > maxDeaths) {
            maxDeaths = deaths;
            maxPuuid = puuid;
        }
    }

    const playerName = await fetchRiotAccount(maxPuuid);
    console.log(`Inter of the day is: ${playerName.gameName} with ${maxDeaths} deaths`);
    let playerGameName = playerName.gameName;
    return { puuid: maxPuuid, deaths: maxDeaths, playerGameName };
}

// Uncomment to run the main function
// main();


function getApiLink() {
    return `${rootlink}${endpoint}?api_key=${riotApiKey}`;
  }

function getTodayEpoch() {
    return new Date().getTime();
}

// Will get todays epoch and subtract 24 hours from it
function getYesterdayEpoch() {
    return getTodayEpoch() - (24 * 60 * 60 * 1000);
}

// Get username for a given PUUID
async function getUsername(puuid) {
    const link = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${riotApiKey}`;
    const response = await rateLimitedFetch(link);
    const data = await response.json();
    return `${data.gameName}#${data.tagLine}`;
}

// Get the highest death count from a player's match history
async function getHighestDeathFromMatchHistoryList(puuid, matchHistoryList) {
    const deaths = [];

    for (const matchId of matchHistoryList) {
        const matchInfoLink = `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotApiKey}`;
        const response = await rateLimitedFetch(matchInfoLink);
        const data = await response.json();
        const participantDto = data.info.participants.find(p => p.puuid === puuid);
        if (participantDto) {
            console.log(`${participantDto.deaths} deaths in ${matchId} for user ${puuid}`);
            deaths.push(participantDto.deaths);
        }
    }

    return Math.max(...deaths);
}

export async function fetchRiotAccount(puuid) {
    try {
      const response = await fetch(`http://localhost:3000/riot-api/${puuid}`);
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Riot account:', error);
    }
}