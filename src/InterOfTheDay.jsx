import { useState, useRef } from 'react';
import { expGetAccountInfoByPuuid, expSearchByRiotId, findMostRecentInter } from './riotApis';
import { onSearchPlayerClicked } from './riotApis';
import './InterOfTheDay.css';
import { addPlayerToDatabase } from './firebase';

function InterOfTheDay() {
    const [inter, setInter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [iconUrl, setIconUrl] = useState('');
    const [summonerLevel, setSummonerLevel] = useState(0);
    const [timer, setTimer] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalId = useRef(null);

    const handleFindInter = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await findMostRecentInter();
            setInter(result);
        } catch (err) {
            setError('An error occurred while finding the Inter of the Day');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFindSummonerPanel = async () => {
        setError(null);
        setIconUrl('');
        try {
            // need to get puuid first, then plug it in method
            const dataByRiotId = await expSearchByRiotId();
            const result = await expGetAccountInfoByPuuid(dataByRiotId.puuid);
            var profileIconId = result.data.profileIconId;
            var summonerLevel = result.data.summonerLevel;
            setupIconUrl(profileIconId);
            setSummonerLevel(summonerLevel);
        } catch (err) {
            setError('An error occurred while finding the Inter of the Day');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const setupIconUrl = (iconNumber) => {
        setIconUrl(`https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/${iconNumber}.png`);
        console.log(iconUrl);
    }

    const startTimer = () => {
        // green to grey
        const currentStartTime = Date.now();
        setStartTime(currentStartTime);
        intervalId.current = setInterval(() => {
            let timeDiff = Date.now() - currentStartTime
            timeDiff = (timeDiff / 1000).toFixed(1);
            setTimer(timeDiff);
        }, 10);
    }

    const resetTimer = () => {
        // grey to green
        setIsActive(true);
        clearInterval(intervalId.current);
        startTimer();
        setTimeout(() => {
            setIsActive(false);
        }, 200);
        // start timer
    }

    

    return (
        <div className="container">
            
            <div className="inter-of-the-day">
                <h2 className="title">Inter of the Day</h2>
                <div className='horizontal-panel'>
                    <p>Last Int Check</p>
                    <div className={`last-api-check-timer ${isActive ? "active" : ""}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-timer size-4"><line x1="10" x2="14" y1="2" y2="2"></line><line x1="12" x2="15" y1="14" y2="11"></line><circle cx="12" cy="14" r="8"></circle></svg>
                        <span>{timer}s</span>
                    </div>
                </div>
                
                <div className='testing-buttons'>
                    <button onClick={startTimer}>Start</button>
                    <button onClick={resetTimer}>Reset</button>
                    <button onClick={() => addPlayerToDatabase(12345,null)}>AddPlayerTest</button>
                </div>
                <button 
                    className="lol-button" 
                    onClick={handleFindInter} 
                    disabled={loading}
                >
                    {loading ? 'Finding Inter...' : 'Find Inter of the Day'}
                </button>
                {loading && <div className="loading-spinner"></div>}
                {error && <p className="error-message">{error}</p>}
                {inter && (
                    <div className="inter-info">
                        <p className="inter-name">Inter of the day is: {inter.playerGameName}</p>
                        <p className="inter-stats">with {inter.deaths} deaths</p>
                    </div>
                )}
            </div>
            <div className="search-section">
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
            </div>
            <div className='summoner-container'>
                <img className='summoner-icon' src={iconUrl} alt="Summoner Icon"> 
                
                </img>
                <div className='summoner-level-panel'>
                    <p>{summonerLevel}</p>
                </div>
            </div>
        </div>
    );
}
export default InterOfTheDay;