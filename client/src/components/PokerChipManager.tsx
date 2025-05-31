import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PokerChipManagerProps {
  walletAddress: string;
  onChipUpdate: (newChipAmount: number) => void;
  currentChips: number;
}

export const PokerChipManager = ({ walletAddress, onChipUpdate, currentChips }: PokerChipManagerProps) => {
  const [buyInAmount, setBuyInAmount] = useState('');
  const [cashOutAmount, setCashOutAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: balance, isLoading } = useQuery({
    queryKey: ['/api/balance', walletAddress],
    queryFn: async () => {
      const response = await fetch(`/api/balance/${walletAddress}`);
      return response.json();
    },
    enabled: !!walletAddress,
  });

  const buyInMutation = useMutation({
    mutationFn: async (amount: number) => {
      // Transfer from balance to chips (database operation)
      const response = await fetch('/api/buy-in', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress,
          amount,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance', walletAddress] });
      onChipUpdate(currentChips + parseInt(buyInAmount));
      setBuyInAmount('');
    },
  });

  const cashOutMutation = useMutation({
    mutationFn: async (amount: number) => {
      // Transfer from chips back to balance (database operation)
      const response = await fetch('/api/chip-cashout', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress,
          amount,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance', walletAddress] });
      onChipUpdate(currentChips - parseInt(cashOutAmount));
      setCashOutAmount('');
    },
  });

  const handleBuyIn = () => {
    const amount = parseInt(buyInAmount);
    if (amount > 0 && amount <= (balance?.balance || 0)) {
      buyInMutation.mutate(amount);
    }
  };

  const handleChipCashOut = () => {
    const amount = parseInt(cashOutAmount);
    if (amount > 0 && amount <= currentChips) {
      cashOutMutation.mutate(amount);
    }
  };

  if (isLoading) {
    return <div className="text-green-400">Loading...</div>;
  }

  const currentBalance = balance?.balance || 0;

  return (
    <Card className="bg-black/80 border-green-500 text-green-400">
      <CardHeader>
        <CardTitle className="text-green-400 text-sm">CHIP MANAGEMENT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Balance Section */}
        <div className="space-y-4">
          <div className="text-center bg-black/30 p-3 rounded border border-green-600">
            <div className="text-green-300 text-xs">WALLET BALANCE</div>
            <div className="text-green-400 font-bold text-lg">{currentBalance.toLocaleString()} KEKMORPH</div>
            <div className="text-green-500 text-xs">Send KEKMORPH to treasury to add balance</div>
          </div>
          
          {/* Table Chips Section */}
          <div className="text-center bg-blue-900/20 p-3 rounded border border-blue-400">
            <div className="text-blue-300 text-xs">TABLE CHIPS</div>
            <div className="text-blue-400 font-bold text-lg">{currentChips.toLocaleString()}</div>
            <div className="text-blue-500 text-xs">Chips for playing poker</div>
          </div>
          
          {/* Buy In */}
          <div className="space-y-2">
            <div className="text-xs text-green-300">Buy In (Balance → Table)</div>
            <Input
              type="number"
              placeholder="Amount"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              max={currentBalance}
              className="bg-black/50 border-green-500 text-green-400 h-8 text-xs"
            />
            <Button
              onClick={handleBuyIn}
              disabled={
                !buyInAmount ||
                parseInt(buyInAmount) <= 0 ||
                parseInt(buyInAmount) > currentBalance ||
                buyInMutation.isPending
              }
              className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs"
            >
              {buyInMutation.isPending ? 'Buying...' : 'BUY IN'}
            </Button>
          </div>
          
          {/* Cash Out to Wallet */}
          <div className="space-y-2">
            <div className="text-xs text-green-300">Cash Out (Balance → Wallet)</div>
            <Input
              type="number"
              placeholder="Amount"
              value={cashOutAmount}
              onChange={(e) => setCashOutAmount(e.target.value)}
              max={currentBalance}
              className="bg-black/50 border-green-500 text-green-400 h-8 text-xs"
            />
            <Button
              onClick={() => {
                const amount = parseInt(cashOutAmount);
                if (amount > 0 && amount <= currentBalance) {
                  // Cash out to actual wallet
                  fetch('/api/cashout', {
                    method: 'POST',
                    body: JSON.stringify({ walletAddress, amount }),
                    headers: { 'Content-Type': 'application/json' }
                  }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/balance', walletAddress] });
                    setCashOutAmount('');
                  });
                }
              }}
              disabled={
                !cashOutAmount ||
                parseInt(cashOutAmount) <= 0 ||
                parseInt(cashOutAmount) > currentBalance
              }
              className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs"
            >
              CASH OUT TO WALLET
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};