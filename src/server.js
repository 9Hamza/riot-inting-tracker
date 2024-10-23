import express from 'express';
import axios from 'axios';

const app = express();
const port = 3000;
const riotApiKey = import.meta.env.VITE_RIOT_API_KEY;

app.get('/riot-api/:puuid', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
