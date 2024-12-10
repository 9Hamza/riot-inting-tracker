import './Body.css';
import './index.css'
import InterOfTheDay from './InterOfTheDay.jsx';

function Body() {
    return(
        <div className='min-h-screen fixed top-0 left-0 w-full z-10 bg-gray-900'>
            <h1 className="body"></h1>
            <InterOfTheDay/>
        </div>
    );
}

export default Body