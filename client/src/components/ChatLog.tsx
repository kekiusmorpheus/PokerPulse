import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'action' | 'system';
}

interface ChatLogProps {
  gameId: string;
  currentPlayerId: string;
  currentPlayerName: string;
  isVisible: boolean;
  onToggle: () => void;
  gameActions?: string[];
}

const ChatLog: React.FC<ChatLogProps> = ({
  gameId,
  currentPlayerId,
  currentPlayerName,
  isVisible,
  onToggle,
  gameActions = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      playerId: 'system',
      playerName: 'SYSTEM',
      message: 'Welcome to the Matrix Poker table. Good luck!',
      timestamp: new Date(),
      type: 'system'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      playerId: currentPlayerId,
      playerName: currentPlayerName,
      message: newMessage,
      timestamp: new Date(),
      type: 'chat'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Add game actions to chat automatically
  useEffect(() => {
    gameActions.forEach((action, index) => {
      const actionMessage: ChatMessage = {
        id: `action_${Date.now()}_${index}`,
        playerId: 'system',
        playerName: 'GAME',
        message: action,
        timestamp: new Date(),
        type: 'action'
      };
      setMessages(prev => {
        if (!prev.some(msg => msg.message === action && msg.type === 'action')) {
          return [...prev, actionMessage];
        }
        return prev;
      });
    });
  }, [gameActions]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'system':
        return 'text-yellow-400 opacity-80 italic';
      case 'action':
        return 'text-green-400 opacity-90';
      default:
        return 'text-green-300';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-20">
        <button
          onClick={onToggle}
          className="w-14 h-14 rounded-full bg-black bg-opacity-90 border-2 border-green-500 hover:border-green-400 transition-colors flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-green-400 text-xs font-bold">CHAT</div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mx-auto mt-1"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-black bg-opacity-95 border-2 border-green-500 rounded-lg z-20 backdrop-blur-sm shadow-2xl">
      <div className="flex justify-between items-center p-3 border-b border-green-500 bg-green-900 bg-opacity-20">
        <h3 className="font-bold text-green-400">TABLE CHAT</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-semibold">LIVE</span>
          </div>
          <button
            onClick={onToggle}
            className="text-green-400 hover:text-red-400 transition-colors p-1"
            title="Close chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3 h-72">
        <div className="space-y-2">
          {messages.map((message) => (
            <div key={message.id} className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${getMessageStyle(message.type)}`}>
                  {message.playerName}
                </span>
                <span className="text-gray-500 text-xs">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div className={`${getMessageStyle(message.type)} text-sm`}>
                {message.message}
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="p-3 border-t border-green-500">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type message..."
            className="flex-1 px-3 py-2 bg-black bg-opacity-50 border border-green-500 rounded text-green-300 placeholder-gray-500 text-sm focus:outline-none focus:border-green-400"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-green-500 text-black hover:bg-green-400 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatLog;