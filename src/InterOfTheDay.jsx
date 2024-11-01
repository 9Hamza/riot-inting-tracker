import { useState } from 'react';
import { expGetAccountInfoByPuuid, expSearchByRiotId, findMostRecentInter } from './riotApis';
import { onSearchPlayerClicked } from './riotApis';
import './InterOfTheDay.css';

function InterOfTheDay() {
    const [inter, setInter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [iconUrl, setIconUrl] = useState('');
    const [summonerLevel, setSummonerLevel] = useState(0);

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

    return (
        <div className="container">
            <div className="inter-of-the-day">
                <h2 className="title">Inter of the Day</h2>
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