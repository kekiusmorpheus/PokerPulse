import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { GameState, Player } from '../types/poker';

declare global {
  interface Window {
    db: any;
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: any = null;
let db: any = null;

export const initializeFirebase = () => {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    window.db = db;
    console.log('Firebase initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return null;
  }
};

export const waitForFirebase = (): Promise<any> => {
  return new Promise((resolve) => {
    if (db) {
      resolve(db);
    } else {
      const checkInterval = setInterval(() => {
        if (db) {
          clearInterval(checkInterval);
          resolve(db);
        }
      }, 100);
    }
  });
};

// Real-time game state management
export const subscribeToGameState = (gameId: string, callback: (gameState: GameState | null) => void) => {
  if (!db) return () => {};
  
  const gameRef = doc(db, 'games', gameId);
  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        ...data,
        gameId: doc.id
      } as GameState);
    } else {
      callback(null);
    }
  });
};

export const updateGameState = async (gameId: string, gameState: Partial<GameState>) => {
  if (!db) return;
  
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    ...gameState,
    lastUpdated: serverTimestamp()
  });
};

export const createGame = async (gameId: string, gameState: GameState) => {
  if (!db) return;
  
  const gameRef = doc(db, 'games', gameId);
  await setDoc(gameRef, {
    ...gameState,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  });
};

export const addPlayerToGame = async (gameId: string, player: Player) => {
  if (!db) return;
  
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    [`players.${player.id}`]: {
      ...player,
      joinedAt: serverTimestamp()
    },
    lastUpdated: serverTimestamp()
  });
};

export const removePlayerFromGame = async (gameId: string, playerId: string) => {
  if (!db) return;
  
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    [`players.${playerId}`]: null,
    lastUpdated: serverTimestamp()
  });
};

export const getActiveGames = async () => {
  if (!db) return [];
  
  const gamesRef = collection(db, 'games');
  const snapshot = await getDocs(gamesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Transaction logging for buy-ins
export const logTransaction = async (transactionData: {
  playerId: string;
  gameId: string;
  amount: number;
  type: 'buy-in' | 'cashout' | 'win' | 'loss';
  txSignature: string;
}) => {
  if (!db) return;
  
  const transactionRef = doc(collection(db, 'transactions'));
  await setDoc(transactionRef, {
    ...transactionData,
    timestamp: serverTimestamp()
  });
};