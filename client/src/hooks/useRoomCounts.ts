import { useState, useEffect } from 'react';
import { gameManager } from '../lib/gameManager';
import { RoomType } from '../types/poker';

export const useRoomCounts = () => {
  const [playerCounts, setPlayerCounts] = useState<{ [key in RoomType]: number }>({
    degen: 0,
    green: 0,
    morpheus: 0
  });

  useEffect(() => {
    const updateCounts = () => {
      const counts = gameManager.getActiveGames();
      setPlayerCounts(counts as { [key in RoomType]: number });
    };

    // Update immediately
    updateCounts();

    // Update every 5 seconds
    const interval = setInterval(updateCounts, 5000);

    return () => clearInterval(interval);
  }, []);

  return playerCounts;
};