import Header from "./Header.jsx"
import Body from "./Body.jsx";
import { initializeFirebase } from './firebase';
import { useEffect } from "react";

function App() {

  useEffect(() => {
    initializeFirebase(); // Initializes Firebase once at startup
  }, []); // Empty dependency array ensures this runs only once

  return(
      <>
      <div className="body-background-image">
        {/* <Header/> */}
        <Body/>
      </div>
      
      </>
    );
}

export default App
