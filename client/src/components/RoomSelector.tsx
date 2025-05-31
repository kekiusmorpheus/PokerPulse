import React from 'react';
import { RoomType, RoomConfig } from '../types/poker';

interface RoomSelectorProps {
  selectedRoom: RoomType | null;
  onRoomSelect: (roomType: RoomType) => void;
  onJoinTable: (roomType: RoomType) => void;
  playerCounts: { [key in RoomType]: number };
}

const RoomSelector: React.FC<RoomSelectorProps> = ({ 
  selectedRoom, 
  onRoomSelect, 
  onJoinTable,
  playerCounts 
}) => {
  const rooms: { [key in RoomType]: RoomConfig } = {
    degen: {
      name: 'DEGEN ARENA',
      description: 'For those taking the red pill...',
      smallBlind: 1000,
      bigBlind: 2000,
      buyIn: 100000,
      maxPlayers: 9,
      level: 'ENTRY LEVEL',
      levelColor: 'text-[#00AA2E] border-[#00AA2E]'
    },
    green: {
      name: 'GREEN PILL ROOM',
      description: 'Reality is what you make it...',
      smallBlind: 5000,
      bigBlind: 10000,
      buyIn: 500000,
      maxPlayers: 9,
      level: 'INTERMEDIATE',
      levelColor: 'text-yellow-400 border-yellow-400'
    },
    morpheus: {
      name: 'MORPHEUS VAULT',
      description: 'There is no spoon...',
      smallBlind: 10000,
      bigBlind: 20000,
      buyIn: 1000000,
      maxPlayers: 9,
      level: 'ELITE',
      levelColor: 'text-red-400 border-red-400'
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(rooms).map(([roomType, config]) => (
        <div
          key={roomType}
          className={`room-card p-4 border bg-black bg-opacity-50 hover:bg-[#003300] cursor-pointer transition-all duration-300 ${
            selectedRoom === roomType 
              ? 'border-[#00AA2E] matrix-glow' 
              : 'border-[#00FF41]'
          }`}
          onClick={() => onRoomSelect(roomType as RoomType)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-[#00FF41]">{config.name}</h3>
            <span className={`text-xs px-2 py-1 border ${config.levelColor}`}>
              {config.level}
            </span>
          </div>
          
          <div className="text-sm space-y-1 opacity-80 text-[#00FF41]">
            <div>Blinds: {config.smallBlind.toLocaleString()}K/{config.bigBlind.toLocaleString()}K KEKMORPH</div>
            <div>Buy-in: {config.buyIn.toLocaleString()}K KEKMORPH</div>
            <div>
              Players: <span className="text-[#00AA2E]">{playerCounts[roomType as RoomType]}/{config.maxPlayers}</span>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-[#00AA2E] mb-4">
            {config.description}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoinTable(roomType as RoomType);
            }}
            className="w-full mt-3 px-4 py-2 border-2 border-[#00AA2E] bg-[#003300] hover:bg-[#00FF41] hover:text-black text-[#00FF41] transition-all duration-300 font-bold"
          >
            JOIN TABLE
          </button>
        </div>
      ))}
    </div>
  );
};

export default RoomSelector;
