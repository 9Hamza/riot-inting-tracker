/*

IMPORTANT INFORMATION TO KNOW WHEN RUNNING THIS FILE:

- WHEN RUNNING THIS FROM TERMINAL, MY PWD NEEDS TO BE IN THE ROOT DIRECTORY. AFTER THAT, I CAN DO 
- `node src/server.js`. ALSO MAKE SURE THAT .ENV FILE IS PLACED IN THE ROOT DIRECTORY.

*/

import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import cors from 'cors'; // Import CORS

dotenv.config();

const riotApiKey = process.env.VITE_RIOT_API_KEY;
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173', // Allow only your frontend's origin
  methods: ['GET'], // Allow only specific methods if necessary
}));

app.get('/riot/account/v1/accounts/by-puuid/:puuid', async (req, res) => {
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
app.get('/riot/account/v1/accounts/by-riot-id/:gameName/:tagLine', async (req, res) => {
  const { gameName, tagLine } = req.params;
  try {
    const apiUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}/?api_key=${riotApiKey}`;
    console.log(apiUrl);
    const response = await axios.get(apiUrl);
    
    if (!response.data) {
      return res.status(404).send('Player not found');
    }

    const data = response.data;
    const puuid = data.puuid;
    res.json({ puuid, accountData: data });
  } catch (error) {
    res.status(error.response?.status || 500).send(error.message);
  }
});


app.get('/lol/summoner/v4/summoners/by-puuid/:puuid', async (req, res) => {
  const { puuid } = req.params;
  
  try {
    var summonerInfoApiUrl = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${riotApiKey}`;
    console.log('/riot-api/summoner-info/:puuid | '+summonerInfoApiUrl);
    const response = await axios.get(summonerInfoApiUrl);
    
    if (!response.data) {
      return res.status(404).send('Error!');
    }

    const data = response.data;
    res.json({ data });
  } catch (error) {
    res.status(error.response?.status || 500).send("summoner-info error: "+error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Server: the API key being fetched from env variables is: ${riotApiKey}`);
});