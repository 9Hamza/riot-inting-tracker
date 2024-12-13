/*

IMPORTANT INFORMATION TO KNOW WHEN RUNNING THIS FILE:

- WHEN RUNNING THIS FROM TERMINAL, MY PWD NEEDS TO BE IN THE ROOT DIRECTORY. AFTER THAT, I CAN DO 
- `node src/index.js`. ALSO MAKE SURE THAT .ENV FILE IS PLACED IN THE ROOT DIRECTORY.

- I BELIEVE FILE NEED TO BE NAMED INDEX.JS TO BE CALLED BY VERCEL

*/

import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors"; // Import CORS

import {
  initializeFirebase,
  saveInterOfTheDay,
  saveMatchHistoryInDb,
} from "./firebase.js";
import {
  addPlayerToDatabase,
  fetchExistingPlayers,
  fetchMatchHistoryRanked,
} from "./firebase.js";

dotenv.config();

const riotApiKey = process.env.VITE_RIOT_API_KEY;
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(
  cors({
    origin: "http://localhost:5173", // Allow only your frontend's origin
    methods: ["GET"], // Allow only specific methods if necessary
  })
);

// get riot account by puuid
// gameName
// tagLine
app.get("/riot/account/v1/accounts/by-puuid/:puuid", async (req, res) => {
  const { puuid } = req.params;
  try {
    const response = await axios.get(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${riotApiKey}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).send(error.message);
  }
});

// New route to search by Riot ID
app.get(
  "/riot/account/v1/accounts/by-riot-id/:gameName/:tagLine",
  async (req, res) => {
    const { gameName, tagLine } = req.params;
    try {
      const apiUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}/?api_key=${riotApiKey}`;
      console.log(apiUrl);
      const response = await axios.get(apiUrl);

      if (!response.data) {
        return res.status(404).send("Player not found");
      }

      const data = response.data;
      const puuid = data.puuid;
      res.json({ puuid, accountData: data });
    } catch (error) {
      res.status(error.response?.status || 500).send(error.message);
    }
  }
);

app.get("/lol/match/v5/matches/:matchId", async (req, res) => {
  const { matchId } = req.params;
  try {
    const response = await axios.get(
      `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotApiKey}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).send(error.message);
  }
});

app.get("/lol/summoner/v4/summoners/by-puuid/:puuid", async (req, res) => {
  const { puuid } = req.params;

  try {
    var summonerInfoApiUrl = `https://me1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${riotApiKey}`;
    console.log("/riot-api/summoner-info/:puuid | " + summonerInfoApiUrl);
    const response = await axios.get(summonerInfoApiUrl);

    if (!response.data) {
      return res.status(404).send("Error!");
    }

    const data = response.data;
    res.json({ data });
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .send("summoner-info error: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(
    `Server: the API key being fetched from env variables is: ${riotApiKey}`
  );
});

// Get the highest death count from a player's match history
async function getHighestDeathFromMatch(puuid, matchHistoryList) {
  const deaths = [];
  let deathsLogString = "";
  for (const match of matchHistoryList) {
    const participantDto = match.info.participants.find(
      (p) => p.puuid === puuid
    );
    if (participantDto) {
      deathsLogString += participantDto.deaths + ", ";
      // console.log(`${participantDto.deaths} deaths for user ${puuid}`);
      deaths.push(participantDto.deaths);
    }
  }
  // remove the trailing comma and space
  deathsLogString = deathsLogString.slice(0, -2);
  const maxNumberOfDeaths = Math.max(...deaths);
  console.log("Deaths: " + deathsLogString + " Max: " + maxNumberOfDeaths);
  return Math.max(...deaths);
}

async function loopTest() {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Waits for 1 second
    console.log("Testing loop...");
  }
}

//#region classes
class LeagueListDTO {
  constructor({ leagueId, entries, tier, name, queue }) {
    this.leagueId = leagueId;
    this.entries = entries.map((entry) => new LeagueItemDTO(entry));
    this.tier = tier;
    this.name = name;
    this.queue = queue;
  }
}

class LeagueItemDTO {
  constructor({
    freshBlood,
    wins,
    miniSeries,
    inactive,
    veteran,
    hotStreak,
    rank,
    leaguePoints,
    losses,
    summonerId,
  }) {
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
  constructor({ losses, progress, target, wins }) {
    this.losses = losses;
    this.progress = progress;
    this.target = target;
    this.wins = wins;
  }
}

class LeagueEntryDTO {
  constructor({
    leagueId,
    summonerId,
    queueType,
    tier,
    rank,
    leaguePoints,
    wins,
    losses,
    hotStreak,
    veteran,
    freshBlood,
    inactive,
    miniSeries,
  }) {
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

// const riotApiKey = import.meta.env.VITE_RIOT_API_KEY;
// Rate Limiting Configuration
const REQUEST_LIMIT_1_SEC = 20;
const REQUEST_LIMIT_2_MIN = 100;
let requestsIn1Sec = 0;
let requestsIn2Min = 0;

var region = "me1";
const rootlink = `https://${region}.api.riotgames.com`;
var endpoint = "";
var apiLink = `${rootlink}${endpoint}?api key=${riotApiKey}`;

var leagueListArray = [];
var playersPuuids = {};

const rank = Object.freeze({
  master: 0,
  grandmaster: 1,
  challenger: 2,
});

const matchHistoryCondition = Object.freeze({
  LAST_24_HOURS: "last_24_hours",
  LAST_20_GAMES: "last_20_games",
  LAST_7_DAYS: "last_7_days",
  LAST_30_DAYS: "last_30_days",
});

async function rateLimitedFetch(url, options = {}) {
  while (
    requestsIn1Sec >= REQUEST_LIMIT_1_SEC - 1 ||
    requestsIn2Min >= REQUEST_LIMIT_2_MIN - 1
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
    [rank.master]: "masterleagues",
    [rank.grandmaster]: "grandmasterleagues",
    [rank.challenger]: "challengerleagues"
  };

  const tierStringMap = {
    [rank.master]: "Master",
    [rank.grandmaster]: "Grandmaster",
    [rank.challenger]: "Challenger"
  };

  const rankString = rankStringMap[rankInput];
  if (!rankString) throw new Error("Invalid rank");

  const link = `https://me1.api.riotgames.com/lol/league/v4/${rankString}/by-queue/RANKED_SOLO_5x5?api_key=${riotApiKey}`;
  const response = await rateLimitedFetch(link);
  const data = await response.json();

  const leagueList = new LeagueListDTO(data);

  // Add 'tier' variable to each entry
  const tier = tierStringMap[rankInput];
  console.log("tierString: "+tier);
  var entries = leagueList.entries;
  entries.forEach(entry => {
    entry.tier = tier;
  });
  leagueListArray = [leagueList, ...entries
  ];
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
async function getMatchHistoryRanked(puuid, startTime = "", endTime = "") {
  const startTimeArg = startTime ? `startTime=${startTime}&` : "";
  const endTimeArg = endTime ? `endTime=${endTime}&` : "";
  const link = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${startTimeArg}${endTimeArg}type=ranked&start=0&count=20&api_key=${riotApiKey}`;

  const response = await rateLimitedFetch(link);
  const data = await response.json();
  return data;
}

async function getMatchHistoryRankedFirebaseDb(puuid) {
  let matchHistory = await fetchMatchHistoryRanked(puuid);
  return matchHistory;
}

function printApiKey() {
  console.log(riotApiKey);
}

// Main function to find the player with the highest deaths
export async function findMostRecentInter() {
  console.log("findMostRecentInter()");
  try {
    
    await fetchLeagueList(rank.challenger);
    await fetchLeagueList(rank.grandmaster);
    // await fetchLeagueList(rank.master);

    await updatePlayers();

    const puuidDeathsMap = new Map();

    for (const puuid of Object.keys(playersPuuids)) {
      const matchHistoryListFromRiotApi = await getMatchHistoryRanked(puuid);
      const matchHistoryListFromFirebaseDb = await getMatchHistoryRankedFirebaseDb(puuid);

      let matchHistoryData = {};

      // if player doesn't have any match histories saved
      let updates = {};
      if (matchHistoryListFromFirebaseDb == null) {
        console.log("Match history not found in Firebase DB for player -- " + puuid + " --");

        if (matchHistoryListFromRiotApi != null) {
          for (const matchId of matchHistoryListFromRiotApi) {
            const matchPath = `players/${puuid}/matches/${matchId}`;
            const matchData = await expGetMatchData(matchId, puuid);
            // matchHistoryData.push(matchData);
            matchHistoryData[matchId] = matchData;
            updates[matchPath] = matchData;
          }
        }
      } else {
        // need to check if all 20 == 20 or not. temp else
        // if player has match histories saved
        const firebaseMatchIds = Object.keys(matchHistoryListFromFirebaseDb);
        // check if every item in list1 is present in list2
        const hasSameKeys = matchHistoryListFromRiotApi.every((key) =>
          firebaseMatchIds.includes(key)
        );

        if (hasSameKeys) {
          console.log("User matchHistory is synced!");
          // matchHistoryData = Object.values(matchHistoryListFromFirebaseDb);
          Object.entries(matchHistoryListFromFirebaseDb).forEach(([key, value]) => {
            matchHistoryData[key] = value; // Directly assign the object
          });
        } else {
          // TODO: modify logic here to get only last 20 games (or like based on selected condition)
          console.log("User matchHistory is NOT synced! Syncing now...");
          // matchHistoryData = Object.values(matchHistoryListFromFirebaseDb);
          Object.entries(matchHistoryListFromFirebaseDb).forEach(([key, value]) => {
            matchHistoryData[key] = value; // Directly assign the object
          });
          const missingMatchIds = matchHistoryListFromRiotApi.filter(
            (key) => !firebaseMatchIds.includes(key)
          );
          for (const matchId of missingMatchIds) {
            const matchPath = `players/${puuid}/matches/${matchId}`;
            const matchData = await expGetMatchData(matchId, puuid);
            // matchHistoryData.push(matchData);
            matchHistoryData[matchId] = matchData;
            updates[matchPath] = matchData;
          }
        }
      }
      if (Object.keys(updates).length !== 0) {
        saveMatchHistoryInDb(puuid, updates);
      } // No need to wait for saving :)

      const maxDeath = await getHighestDeathFromMatchHistoryList(
        puuid,
        matchHistoryData
      );

      // find matchId with maxDeath
      let targetMatchId = null; // Default if no match is found

      var entries = Object.entries(matchHistoryData);
      console.log(entries);
      for (const [matchId, matchData] of Object.entries(matchHistoryData)) {
        if (maxDeath === matchData.deaths) {
          console.log("Found targetMatchId: " + matchId + " && " + matchData.deaths);
          targetMatchId = matchId;
        }
      }
      console.log("Exited loop with deaths: " + maxDeath);


      puuidDeathsMap.set(puuid, {maxDeath, targetMatchId});
    }

    let maxDeaths = -Infinity;
    let maxPuuid = "";
    let maxMatchId = null;
    console.log("puuids & deaths: " + puuidDeathsMap.size);
    for (const [puuidKey, data] of puuidDeathsMap) {
      console.log("puuidKey: " + puuidKey + " | " + data.maxDeath);
      console.log(data);
      if (data.maxDeath > maxDeaths) {
        maxDeaths = data.maxDeath;
        maxPuuid = puuidKey;
        maxMatchId = data.targetMatchId;
      }
    }

    console.log("maxPuuid is: " + maxPuuid);
    if (maxPuuid || maxPuuid.trim() !== "") {
      console.log("maxPuuid before fetchingRiotAccount: " + maxPuuid);
      const playerName = await fetchRiotAccount(maxPuuid);
      console.log("PlayerName is: " + playerName);
      if (playerName != null) {
        console.log(
          `Inter of the day is: ${playerName.gameName} with ${maxDeaths} deaths`
        );
        let playerGameName = playerName.gameName;
        let tagLine = playerName.tagLine;
  
        if (maxPuuid in playersPuuids) {
          console.log(`Key ${maxPuuid} exists. Value:`, playersPuuids[maxPuuid]);
  
          const playerEntry = playersPuuids[maxPuuid];
          
          var summonerInfo = await expGetSummonerInfoByPuuid(maxPuuid);
  
          console.log("maxMatchId: " + maxMatchId + " --- maxPuuid: " + maxPuuid);
          var matchInfo = await expGetAllMatchData(maxMatchId);
          console.log(matchInfo);
          var championName = getChampionName(matchInfo, maxPuuid);
          var win = getWinResult(matchInfo, maxPuuid);
          var gameDuration = getGameDurationFormatted(matchInfo);
          var gameStartDateAndTime = getGameStartDateAndTime(matchInfo); 
          var kills = getPlayerKills(matchInfo, maxPuuid);
          var assists = getPlayerAssists(matchInfo, maxPuuid);
          console.log("gameDuration: " + gameDuration + " | " + "gameStartDateAndTime: " + gameStartDateAndTime);
  
          // save data of inter in firebase.
          await saveInterOfTheDay({
            puuid: maxPuuid,
            deaths: maxDeaths,
            playerGameName,
            tagLine,
            tier: playerEntry.tier,
            leaguePoints: playerEntry.leaguePoints,
            profileIconId: summonerInfo.data.profileIconId,
            matchId: maxMatchId,
            championName,
            win,
            gameDuration,
            gameStartDateAndTime,
            kills,
            assists
          });
          // Do something with value
        }
  
        
        // return { puuid: maxPuuid, deaths: maxDeaths, playerGameName };
      } else {
        console.log("There was something wrong in getting playerName");
      }
    }
  } catch (error) {
    console.error("Error in findMostRecentInter:", error);
    throw error;
  }
}

function getChampionName(matchInfo, puuid) {
  const participantDto = matchInfo.info.participants.find(
    (p) => p.puuid === puuid
  );
  return participantDto.championName;
}

function getWinResult(matchInfo, puuid) {
  const participantDto = matchInfo.info.participants.find(
    (p) => p.puuid === puuid
  );
  return participantDto.win;
}

function getGameDurationFormatted(matchInfo) {
  var gameDuration = matchInfo.info.gameDuration;
  const minutes = Math.floor(gameDuration / 60); // Get the total minutes
  const seconds = gameDuration % 60; // Get the remaining seconds

  // Format the time as mm:ss
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getGameStartDateAndTime(matchInfo){
  var gameStartTimestamp = matchInfo.info.gameStartTimestamp;
  
  const date = new Date(gameStartTimestamp); // Create a Date object from the timestamp

  // Extract parts
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  // Format as yyyy-mm-dd hh:mm
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getPlayerKills(matchInfo, puuid) {
  const participantDto = matchInfo.info.participants.find(
    (p) => p.puuid === puuid
  );
  var kills = participantDto.kills;
  return kills;
}

function getPlayerDeaths(matchInfo, puuid) {
  const participantDto = matchInfo.info.participants.find(
    (p) => p.puuid === puuid
  );
  var deaths = participantDto.deaths;
  return deaths;
}

function getPlayerAssists(matchInfo, puuid) {
  const participantDto = matchInfo.info.participants.find(
    (p) => p.puuid === puuid
  );
  var assists = participantDto.assists;
  return assists;
}

async function updatePlayers() {
  const existingPlayers = await fetchExistingPlayers();
  for (const entry of leagueListArray) {
    // console.log(entry);
    if (entry.summonerId) {
      try {
        const puuid = await getPuuid(entry.summonerId);
        if (!existingPlayers.has(puuid)) {
          // Add the player if they don't already exist
          addPlayerToDatabase(puuid, entry);
        } else {
          console.log(
            "Player -- " + puuid + " -- already exists in database."
          );
        }
        playersPuuids[puuid] = entry;
      } catch (error) {
        console.error(`Error processing entry: ${error}`);
      }
    }
  }
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
  return getTodayEpoch() - 24 * 60 * 60 * 1000;
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
  console.log(matchHistoryList);
  let deathsLogString = "";
  for (const match of Object.values(matchHistoryList)) {
    // if the match happened within the last 24 hours, then consider it
    // console.log(match);
    if (isWithinLast24Hours(match.gameEndTimestamp)) {
      deathsLogString += match.deaths + ", ";
      deaths.push(match.deaths);
    }
  }
  // remove the trailing comma and space
  deathsLogString = deathsLogString.slice(0, -2);
  const maxNumberOfDeaths = Math.max(...deaths);
  console.log("Deaths: " + deathsLogString + " Max: " + maxNumberOfDeaths);
  return Math.max(...deaths);
}

function getNumOfDeathInMatch(puuid, matchData) {
  const participantDto = matchData.info.participants.find(
    (p) => p.puuid === puuid
  );
  return participantDto.deaths;
}

export async function fetchRiotAccount(puuid) {
  try {
    const response = await rateLimitedFetch(
      `http://localhost:3000/riot/account/v1/accounts/by-puuid/${puuid}`
    );

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("fetchRiotAccount: " + data);
    return data;
  } catch (error) {
    console.error("Error fetching Riot account:", error);
  }
}

var gameName = "";
var tagLine = "";

export async function onSearchPlayerClicked() {
  gameName = document.getElementById("input_game_name").value;
  tagLine = document.getElementById("input_tag_line").value;
  console.log(`Searching for ${gameName}#${tagLine}`);
  var accountInfo = await expSearchByRiotId();
  await expGetSummonerInfoByPuuid(accountInfo.puuid);
}

async function searchByRiotId() {
  var apiUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}/?api_key=${riotApiKey}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  var puuid = data.puuid;
  await fetchRiotAccount(puuid);
}

export async function expSearchByRiotId() {
  gameName = document.getElementById("input_game_name").value;
  tagLine = document.getElementById("input_tag_line").value;
  try {
    var apiUrl = `http://localhost:3000/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
    const response = await fetch(apiUrl);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("expSearchByRiotId: " + apiUrl);
    console.log("expSearchByRiotId: " + data.puuid);

    return data;
  } catch (error) {
    console.error("Error fetching Riot account:", error);
  }
}

export async function expGetSummonerInfoByPuuid(puuid) {
  var apiUrl = `http://localhost:3000/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  console.log("expGetAccountInfoByPuuid: " + apiUrl);
  const response = await rateLimitedFetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(data);
  return data;
}

async function expGetMatchData(matchId, puuid) {
  const matchInfoLink = `http://localhost:3000/lol/match/v5/matches/${matchId}`;
  const response = await rateLimitedFetch(matchInfoLink);
  const data = await response.json();
  const numOfDeathInMatch = getNumOfDeathInMatch(puuid, data);
  const gameEndTimestamp = data.info.gameEndTimestamp;
  const resultObj = {
    deaths: numOfDeathInMatch,
    gameEndTimestamp: gameEndTimestamp,
  };
  return resultObj;
}

async function expGetAllMatchData(matchId) {
  const matchInfoLink = `http://localhost:3000/lol/match/v5/matches/${matchId}`;
  const response = await rateLimitedFetch(matchInfoLink);
  const data = await response.json();
  return data;
}

function isWithinLast24Hours(unixTimestampInMs) {
  const now = Date.now(); // Current time in milliseconds
  const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  // Check if the timestamp is within the last 24 hours
  const withinLast24Hours =
    now - unixTimestampInMs <= oneDayInMs && now >= unixTimestampInMs;
  // console.log("Match is within last 24 hours: " + withinLast24Hours);
  return withinLast24Hours;
}

var isLooping = true;

async function main() {
  initializeFirebase();

  while (isLooping) {
    await findMostRecentInter();
    console.log("Waiting for timeout before loop...");
    await new Promise((resolve) => setTimeout(resolve, 100000)); // Waits for 100 seconds
  }
}

await main();