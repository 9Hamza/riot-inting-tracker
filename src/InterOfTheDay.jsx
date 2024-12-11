import { useState, useRef, useEffect } from 'react';
import { expGetAccountInfoByPuuid, expSearchByRiotId, findMostRecentInter } from './riotApis';
import { onSearchPlayerClicked } from './riotApis';
import './InterOfTheDay.css';
import { addPlayerToDatabase, deleteAllPlayers, getInterOfTheDay } from './firebase';
import { Shield, Award, ChevronUp, ChevronDown, Skull, Clock, Users, Swords, Github, Twitter} from 'lucide-react';
import PropTypes from "prop-types";
import { BsTwitterX } from "react-icons/bs";
import { FiGithub } from "react-icons/fi";

function InterOfTheDay() {
    const [inter, setInter] = useState("Loading...");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [playerIconUrl, setPlayerIconUrl] = useState('');
    const [summonerLevel, setSummonerLevel] = useState(0);
    const [timer, setTimer] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalId = useRef(null);
    const [player, setPlayer] = useState({
        name: "", // "7mzah #MENA"
        team: "",
        level: 0,
        rank: "",
        leaguePoints: 0,
        winRate: 0,
        deaths24h: 0,
        deathTrend: '',
        iconUrl: ""
    });
    const [matchPanel, setMatchPanel] = useState({
        id: "", // "NA1_4235678901"
        date: "", // "2023-06-15 18:30"
        duration: "", // "38:45"
        mode: "Ranked Solo",
        result: '', // 'defeat'
        kills: 0,
        deaths: 0,
        assists: 0,
        championName: "", // "Yasuo"
        championIconUrl: ""
  });
    
    useEffect(() => {
      const interval = setInterval(getInterOfTheDayFromFirebase, 2000);
      
      return () => clearInterval(interval); // Cleanup the interval on component unmount
    }, []); // Empty dependency array ensures this runs once when the component mounts

    const getInterOfTheDayFromFirebase = async () => {
      const interData = await getInterOfTheDay();
      if(interData != null) {
        // console.log("Interdata: " + interData.playerGameName);
        setInter(interData);
          // Update player's name
        setPlayer((prevPlayer) => ({
            ...prevPlayer,
            name: `${interData.playerGameName}`, // Assuming `playerGameName` contains the new name
            tagLine: `#${interData.tagLine}`,
            rank: `${interData.tier}`,
            leaguePoints: `${interData.leaguePoints}`,
            iconUrl: getProfileIconUrl(interData.profileIconId)
        }));
        setMatchPanel((prevMatchPanel) => ({
          ...prevMatchPanel,
          championName: interData.championName,
          championIconUrl: getChampionIconUrl(interData.championName),
          id: interData.matchId,
          result: interData.win ? "Victory" : "Defeat",
          duration: interData.gameDuration,
          date: interData.gameStartDateAndTime,
          kills: interData.kills,
          deaths: interData.deaths,
          assists: interData.assists
        }));
        resetTimer();
        startTimer();
      }
    }

    const handleFindInter = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await findMostRecentInter();
            setInter(result);

             // Update player's name
            setPlayer((prevPlayer) => ({
                ...prevPlayer,
                name: result.playerGameName, // Assuming `playerGameName` contains the new name
        }));
        } catch (err) {
            setError('An error occurred while finding the Inter of the Day');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFindSummonerPanel = async () => {
        setError(null);
        setPlayerIconUrl('');
        try {
            // need to get puuid first, then plug it in method
            const dataByRiotId = await expSearchByRiotId();
            const result = await expGetAccountInfoByPuuid(dataByRiotId.puuid);
            var profileIconId = result.data.profileIconId;
            var summonerLevel = result.data.summonerLevel;
            setPlayerIconUrl(getProfileIconUrl(profileIconId));
            setSummonerLevel(summonerLevel);
        } catch (err) {
            setError('An error occurred while finding the Inter of the Day');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getProfileIconUrl = (profileIconId) => {
      return `https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/${profileIconId}.png`;
  }

    const getChampionIconUrl = (championName) => {
      return `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/champion/${championName}.png`
    }

    const startTimer = () => {
      const currentStartTime = Date.now();
      clearInterval(intervalId.current); // Clear any existing interval
      intervalId.current = setInterval(() => {
          const timeDiff = ((Date.now() - currentStartTime) / 1000).toFixed(1);
          setTimer(parseFloat(timeDiff)); // Update the timer
      }, 100); // Use a reasonable interval (100ms instead of 10ms)
  };

  const resetTimer = () => {
      setIsActive(true);
      clearInterval(intervalId.current); // Ensure no overlapping intervals
      setTimer(0); // Reset the timer state
      startTimer(); // Start the timer
      setTimeout(() => {
          setIsActive(false);
      }, 200);
  };

    return (
        <div className="container ">
            <div className="inter-of-the-day">
                <h2 className="title ">Inter of the Day</h2>
                <div className='horizontal-panel '>
                    <p>Last Int Check</p>
                    <div className={`last-api-check-timer ${isActive ? "active" : ""}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-timer size-4"><line x1="10" x2="14" y1="2" y2="2"></line><line x1="12" x2="15" y1="14" y2="11"></line><circle cx="12" cy="14" r="8"></circle></svg>
                        <span>{timer}s</span>
                    </div>
                </div>
                
                {/* <div className='testing-buttons'>
                    <button onClick={startTimer}>Start</button>
                    <button onClick={resetTimer}>Reset</button>
                    <button onClick={() => addPlayerToDatabase(12345,null)}>AddPlayerTest</button>
                    <button onClick={deleteAllPlayers}>Delete All Players</button>
                </div> */}
                {/* <button 
                    className="lol-button" 
                    onClick={handleFindInter} 
                    disabled={loading}
                >
                    {loading ? 'Finding Inter...' : 'Find Inter of the Day'}
                </button> */}
                {loading && <div className="loading-spinner"></div>}
                {error && <p className="error-message">{error}</p>}
                {inter && (
                    // <div className="inter-info">
                    //     <p className="inter-name">Inter of the day is: {inter.playerGameName}</p>
                    //     <p className="inter-stats">with {inter.deaths} deaths</p>
                    // </div>
                    <div className="bg-gray-900 text-white flex flex-col">
                        <main className=" py-4">
                        {/* <h1 className="text-4xl font-bold text-center mb-12">Inting Tracker</h1> */}
                          <div className="space-y-4 mx-auto">
                            {/* <h2 className="text-2xl font-bold text-center text-yellow-400 mb-4">Inter of the day is:</h2> */}
                            <PlayerPanel player={player}/>
                            <MatchPanel match={matchPanel} />
                          </div>
                        </main>
                        <Footer className=""/>
                    </div>
                )}
            </div>
            {/* <div className="search-section">
                <input 
                    type='text' 
                    id='input_game_name' 
                    className="lol-input" 
                    placeholder="Game Name"
                />
                <span className="hashtag">#</span>
                <input 
                    type='text' 
                    id='input_tag_line' 
                    className="lol-input" 
                    placeholder="Tag Line"
                />
                <button 
                    className="lol-button search-button" 
                    // onClick={onSearchPlayerClicked}
                    onClick={handleFindSummonerPanel}
                >
                    Search by Riot ID
                </button>
            </div> */}
            {/* <div className='summoner-container'>
                <img className='summoner-icon' src={iconUrl} alt="Summoner Icon"> 
                
                </img>
                <div className='summoner-level-panel'>
                    <p>{summonerLevel}</p>
                </div>
            </div> */}
        </div>
    );
}

function PlayerPanel({ player }) {
    return (
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 rounded-lg shadow-lg w-6/12 mx-auto mb-4">
        <div className="flex items-center space-x-4 ">
          <img
            src={player.iconUrl}
            alt={'Icon'}
            className="rounded-full border-2 border-yellow-400"
            width={60}
            height={60}
          />
          <div className=' flex flex-col items-center justify-center flex-grow'>
            <div className='flex flex-row'>
              <h2 className="text-xl font-bold text-white">{player.name}</h2>
              <h2 className="text-xl font-bold text-white ml-1">{player.tagLine}</h2>
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <Shield className="text-yellow-400" size={16} />
              <p className="text-sm font-semibold text-white">{player.rank}</p>
              <Award className="text-yellow-400 ml-2" size={16} />
              <p className="text-sm font-semibold text-white">{player.leaguePoints} LP</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  PlayerPanel.propTypes = {
    player: PropTypes.shape({
      iconUrl: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      tagLine: PropTypes.string.isRequired,
      level: PropTypes.number.isRequired,
      team: PropTypes.string.isRequired,
      rank: PropTypes.string.isRequired,
      leaguePoints: PropTypes.number.isRequired,
      winRate: PropTypes.number.isRequired,
      deaths24h: PropTypes.number.isRequired,
      deathTrend: PropTypes.oneOf(["up", "down"]).isRequired, // Either "up" or "down"
    }).isRequired,
  };
  
  function MatchPanel({ match }) {
    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-lg shadow-lg max-w-sm mx-auto mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Match with Most Deaths</h3>
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={match.championIconUrl}
            alt={'Icon'}
            className="rounded-full border-2 border-yellow-400"
            width={60}
            height={60}
          />
          <div>
            <p className="text-lg font-bold text-white">{match.championName}</p>
            <p
              className={`text-left text-sm font-semibold ${
                match.result === "Victory" ? "text-green-400" : "text-red-400"
              }`}
            >
              {match.result.charAt(0).toUpperCase() + match.result.slice(1)}
            </p>
          </div>
        </div>
  
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="text-blue-400" size={20} />
            <div>
              <p className="text-xs text-gray-400">Duration</p>
              <p className="text-sm font-semibold text-white">{match.duration}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="text-purple-400" size={20} />
            <div>
              <p className="text-xs text-gray-400">Game Mode</p>
              <p className="text-sm font-semibold text-white">{match.mode}</p>
            </div>
          </div>
        </div>
  
        <div className="mt-4 bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Swords className="text-yellow-400" size={20} />
              <p className="text-sm font-semibold text-gray-300">KDA</p>
            </div>
            <p className="text-sm font-bold text-white">
              {match.kills}/{match.deaths}/{match.assists}
            </p>
          </div>
        </div>
  
        {/* <div className="mt-4 bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="text-yellow-400" size={20} />
              <p className="text-sm font-semibold text-gray-300">Rank</p>
            </div>
            <p className="text-lg font-bold text-white">{match.rank}</p>
          </div>
        </div> */}
  
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">Match ID: {match.id}</p>
          <p className="text-xs text-gray-400">{match.date}</p>
        </div>
      </div>
    );
  }
  
  MatchPanel.propTypes = {
    match: PropTypes.shape({
      championIconUrl: PropTypes.string.isRequired,
      championName: PropTypes.string.isRequired,
      result: PropTypes.oneOf(["victory", "defeat"]).isRequired,
      duration: PropTypes.string.isRequired,
      mode: PropTypes.string.isRequired,
      kills: PropTypes.number.isRequired,
      deaths: PropTypes.number.isRequired,
      assists: PropTypes.number.isRequired,
      rank: PropTypes.string.isRequired, // Added rank field
      id: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
    }).isRequired,
  };

  function Footer() {
    return (
      <footer className="py-6 text-center ">
        <div className="flex justify-center space-x-4">
          <a href="https://github.com/9hamza" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
            <FiGithub size={24} />
            <span className="sr-only">GitHub</span>
          </a>
          <a href="https://x.com/hamboozy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
            <BsTwitterX size={24} />
            <span className="sr-only">Twitter</span>
          </a>
        </div>
        <p className="mt-2 text-sm text-gray-400">© 2024 Inting Tracker. Inting Tracker is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.</p>
      </footer>
    )
  }

export default InterOfTheDay;