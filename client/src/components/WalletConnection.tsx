import React from 'react';
import { usePhantomWallet } from '../hooks/usePhantomWallet';
import { Button } from './ui/button';

const WalletConnection: React.FC = () => {
  const { walletState, isConnecting, error, connect, disconnect } = usePhantomWallet();

  const handleConnect = async () => {
    if (walletState.isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-6 py-2 border-2 border-[#00FF41] bg-black bg-opacity-50 hover:bg-[#003300] text-[#00FF41] transition-all duration-300 animate-glow-pulse"
      >
        <i className="fab fa-ethereum mr-2"></i>
        <span>
          {isConnecting 
            ? 'CONNECTING...' 
            : walletState.isConnected 
              ? 'CONNECTED'
              : 'CONNECT PHANTOM'
          }
        </span>
      </Button>

      {walletState.isConnected && (
        <div className="px-4 py-2 border border-[#00FF41] bg-black bg-opacity-50">
          <div className="text-xs opacity-80">KEKMORPH BALANCE</div>
          <div className="text-lg font-bold text-[#00FF41]">
            {walletState.kekMorphBalance.toLocaleString()}
          </div>
        </div>
      )}

      {error && (
        <div className="text-[#FF0040] text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
