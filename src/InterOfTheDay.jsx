import React, { useState } from 'react';
import { findMostRecentInter } from './riotApis';
import { onSearchPlayerClicked } from './riotApis';
import './InterOfTheDay.css'; // We'll create this CSS file

function InterOfTheDay() {
    const [inter, setInter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                    onClick={onSearchPlayerClicked}
                >
                    Search by Riot ID
                </button>
            </div>
        </div>
    );
}
export default InterOfTheDay;