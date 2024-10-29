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
        <>
        <div className="inter-of-the-day">
            <h2>Inter of the Day</h2>
            <button onClick={handleFindInter} disabled={loading}>
                {loading ? 'Finding Inter...' : 'Find Inter of the Day'}
            </button>
            {loading && <div className="loading-spinner"></div>}
            {error && <p className="error-message">{error}</p>}
            {inter && (
                <div className="inter-info">
                    <p>Inter of the day is: {inter.playerGameName}</p>
                    <p>with {inter.deaths} deaths</p>
                </div>
            )}
        </div>
        <div>
            <input type='text' id='input_game_name'></input>
            #<input type='text' id='input_tag_line'></input>
            <input type='button' id='search_button' value='Search by riot id' onClick={onSearchPlayerClicked}></input>
        </div>
        </>
    );
}

export default InterOfTheDay;