// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase, ref, set, get, update, remove } from "firebase/database"; // Import getDatabase, ref, and set
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkrA20JOHpa6IKFGBCZzirtkZL6O_2XGQ",
  authDomain: "inting-tracker.firebaseapp.com",
  databaseURL:
    "https://inting-tracker-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "inting-tracker",
  storageBucket: "inting-tracker.firebasestorage.app",
  messagingSenderId: "1077214680586",
  appId: "1:1077214680586:web:ea19512c00f6006a90b1f3",
  measurementId: "G-MW5FQR98QX",
};

export function initializeFirebase() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Conditionally initialize Analytics (This warning means that Firebase Analytics requires cookies, which aren’t always
  // available in certain environments (e.g., server-side rendering, incognito mode, or environments where cookies are restricted).
  // To address this, you can check if Firebase Analytics is supported in the current environment before initializing it.)
  let analytics;
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized successfully");
      } else {
        console.log("Firebase Analytics is not supported in this environment.");
      }
    })
    .catch((error) => {
      console.error("Error checking Analytics support:", error);
    });

  console.log("Firebase initialized: " + app.name);
}

export function addPlayerToDatabase(puuid, data) {
  console.log("Adding player -- " + puuid + " -- to database");
  const db = getDatabase();
  set(ref(db, "players/" + puuid), { leagueItemDTO: data })
    .then(() => {
      console.log("Data written successfully");
    })
    .catch((error) => {
      console.error("Error writing data:", error);
    });
}

export async function fetchExistingPlayers() {
  const db = getDatabase();
  const playersRef = ref(db, "players");

  try {
    const snapshot = await get(playersRef);
    if (snapshot.exists()) {
      const playersData = snapshot.val();
      // Convert the player keys (PUUIDs) to a Set for efficient lookup
      return new Set(Object.keys(playersData));
    } else {
      return new Set(); // No players in the database
    }
  } catch (error) {
    console.error("Error fetching existing players:", error);
    return new Set(); // Return an empty set on error to prevent issues
  }
}

export async function fetchMatchHistoryRanked(puuid) {
  const db = getDatabase();
  const matchesRef = ref(db, `players/${puuid}/matches`);

  try {
    const snapshot = await get(matchesRef);
    if (snapshot.exists()) {
      const matchesData = snapshot.val();
      console.log("Fetched Matches From Firebase:", matchesData);
      return matchesData; // Returns all match data under /players/puuid/matches
    } else {
      console.log("No matches found for this player.");
      return null; // Return null if no matches exist
    }
  } catch (error) {
    console.error("Error fetching matches:", error);
    return null;
  }
}

// This is not async because we don't really need to wait for it
export /*async*/ function saveMatchHistoryInDb(puuid, updates) {
  console.log(
    "Adding match history for player -- " + puuid + " -- to database"
  );
  const db = getDatabase();
  try {
    // Perform a single update operation with all match data
    /*await*/ update(ref(db), updates);
    console.log(
      `Successfully stored ${
        Object.keys(updates).length
      } matches for player ${puuid}`
    );
  } catch (error) {
    console.error("Error storing multiple matches:", error);
  }
}

export async function deleteAllPlayers() {
  const db = getDatabase();
  const playersRef = ref(db, "/players");

  try {
    await remove(playersRef); // Deletes all data under /players
    console.log("All data under /players has been deleted.");
  } catch (error) {
    console.error("Error deleting /players data:", error);
  }
}

export async function saveInterOfTheDay(interData) {
  console.log("Sending data of inter to firebase... " + interData);
  const db = getDatabase();
  await set(ref(db, "inter/last24hours"), { interData })
    .then(() => {
      console.log("Inter data written successfully");
    })
    .catch((error) => {
      console.error("Error writing data:", error);
    });
}

export async function getInterOfTheDay() {
  const db = getDatabase();
  await get(ref(db, "inter/last24hours"));
  try {
    const snapshot = await get(ref(db, "inter/last24hours"));
    if (snapshot.exists()) {
      const interData = snapshot.val();
      console.log("Fetched inter of the day successfully. ");
      // console.log(interData);
      return interData.interData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching inter of the day:", error);
    return null;
  }
}
