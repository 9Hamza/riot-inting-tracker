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

  async function fetchLeagueList(rankInput) {
    let rankString;
    
    switch (rankInput) {
        case rank.master:
            rankString = 'masterleagues';
            break;
        case rank.grandmaster:
            rankString = 'grandmasterleagues';
            break;
        case rank.challenger:
            rankString = 'challengerleagues';
            break;
        default:
            throw new Error('Invalid rank');
    }
    
    const link = `https://me1.api.riotgames.com/lol/league/v4/${rankString}/by-queue/RANKED_SOLO_5x5?api_key=${riotApiKey}`;
    
    try {
        const response = await fetch(link);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        const leagueList = new LeagueListDTO(data);
        
        leagueListArray = [leagueList];
        leagueList.entries.forEach(element => {
            console.log(element);
            leagueListArray.push(element);
        });

        return leagueListArray;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Get a summoner by summoner ID. Returns: SummonerDTO 
// https://me1.api.riotgames.com/lol/summoner/v4/summoners/HhaLwqxygQumCshTvkK-_MzXYFzUNWxaq6FFIB5KDiUoN_wTOPIvoyVnvg?api_key=RGAPI-46f7cde7-5a38-44f3-b5e0-b7728d193af2
function get_puuid(summonerId) {
    endpoint = `/lol/summoner/v4/summoners/${summonerId}`;
    var link = getApiLink();
    console.log(link);

    return fetch(link)
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log(data)
        return data.puuid;
    })
}
// SOMETHING TO NOTE HERE IS THAT THE MATCH HISTORIES OF USERS ARE STORED IN THE EUROPE REGION FOR SOME REASON AHAHAHA
// https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/LMjebwoI02k0sP7H08pB7uiydcg_FQ9p7RRbVIohHIQSJ0rasGbhjNjIaMNqtgxWv53Dku5xEZLHmw/ids?type=ranked&start=0&count=100&api_key=RGAPI-46f7cde7-5a38-44f3-b5e0-b7728d193af2
async function getMatchHistoryRanked(puuid, startTime = '', endTime = '') {
    var startTimeArg = `${startTime == '' ? '' : `startTime=${startTime}&`}`;
    var endTimeArg = `${endTime == '' ? '' : `endTime=${endTime}&`}`;
    var link = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${startTimeArg}${endTimeArg}type=ranked&start=0&count=20&api_key=${riotApiKey}`;
    
    console.log(link);

    try {
        const response = await fetch(link);   // Await fetch here
        const data = await response.json();   // Await response.json here
        console.log(data);
        return data;                          // Return the data after it's resolved
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;                          // Optionally rethrow the error
    }
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

async function main() {
    console.log("API KEY: " + riotApiKey);
    return;
    await fetchLeagueList(rank.challenger);

    // get puuid for every summonerId in list of players
    for (const entry of leagueListArray) {
        if (entry.summonerId) {
            try {
                const puuid = await get_puuid(entry.summonerId);
                if (puuid) {
                    playersPuuids.push(puuid);
                }
            } catch (error) {
                console.error(`Error processing entry: ${error}`);
            }
        }
    }

    console.log('Collected PUUIDs:', playersPuuids);

    const puuidDeathsMap = new Map();

    // get match history for every puuid
    for (const puuid of playersPuuids) {
        const todayEpoch = getTodayEpoch().toString();
        const yesterdayEpoch = getYesterdayEpoch().toString();
        const matchHistoryList = await getMatchHistoryRanked(puuid);
        const maxDeath = await getHighestDeathFromMatchHistoryList(puuid, matchHistoryList);
        puuidDeathsMap.set(puuid, maxDeath);
    }

    // GET PLAYER WITH MAX DEATHS
    let maxDeaths = -Infinity;
    let maxPuuid = '';

    // Iterate through the Map to find the puuid with the highest deaths
    for (const [puuid, deaths] of puuidDeathsMap) {
        if (deaths > maxDeaths) {
            maxDeaths = deaths;
            maxPuuid = puuid;
        }
    }

    // var playerName = await getUsername(maxPuuid);
    var playerName = await fetchRiotAccount(maxPuuid);
    console.log(`Inter of the day is: ${playerName} with ${maxDeaths}`);
    return { puuid: maxPuuid, deaths: maxDeaths, playerName: playerName };
}

// main();
console.log('The RIOT Api Key is: '+riotApiKey);


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

async function getUsername(puuid) {
    const link = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${riotApiKey}`;
    try {
        const response = await fetch(link);
        const data = await response.json();
        console.log(data);
        return `${data.gameName}#${data.tagLine}`;
    } catch (error) {
        console.error('Error fetching username:', error);
        throw error;
    }
}

async function getHighestDeathFromMatchHistoryList(puuid, matchHistoryList) {
    const deaths = [];

    for (const entry of matchHistoryList) {
        // Construct the match info link
        var matchInfoLink = `https://europe.api.riotgames.com/lol/match/v5/matches/${entry}?api_key=${riotApiKey}`;
        
        try {
            // Await the fetch and response
            const response = await fetch(matchInfoLink);
            const data = await response.json();

            // Find the participant with the matching puuid
            const participantDto = data.info.participants.find(p => p.puuid === puuid);
            if (participantDto) {
                console.log(`${participantDto.deaths} deaths in ${entry} for user ${puuid}`);
                deaths.push(participantDto.deaths);
            }
        } catch (error) {
            console.error(`Error fetching match data for entry ${entry}:`, error);
        }
    }

    // Return the highest death count
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