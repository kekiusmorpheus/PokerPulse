import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { apiRequest } from '../lib/queryClient';

interface PlayerBalanceProps {
  walletAddress: string;
}

export const PlayerBalance = ({ walletAddress }: PlayerBalanceProps) => {
  const [cashoutAmount, setCashoutAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: balance, isLoading } = useQuery({
    queryKey: ['/api/balance', walletAddress],
    queryFn: async () => {
      const response = await fetch(`/api/balance/${walletAddress}`);
      return response.json();
    },
    enabled: !!walletAddress,
  });

  const cashoutMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/cashout', {
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
      setCashoutAmount('');
    },
  });

  const handleCashout = () => {
    const amount = parseInt(cashoutAmount);
    if (amount > 0 && amount <= (balance?.balance || 0)) {
      cashoutMutation.mutate(amount);
    }
  };

  if (isLoading) {
    return <div className="text-green-400">Loading balance...</div>;
  }

  const currentBalance = balance?.balance || 0;

  return (
    <Card className="bg-black/80 border-green-500 text-green-400">
      <CardHeader>
        <CardTitle className="text-green-400">KEKMORPH Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-bold text-green-400">
          {currentBalance.toLocaleString()} KEKMORPH
        </div>
        
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Cash out amount"
            value={cashoutAmount}
            onChange={(e) => setCashoutAmount(e.target.value)}
            max={currentBalance}
            className="bg-black/50 border-green-500 text-green-400"
          />
          <Button
            onClick={handleCashout}
            disabled={
              !cashoutAmount ||
              parseInt(cashoutAmount) <= 0 ||
              parseInt(cashoutAmount) > currentBalance ||
              cashoutMutation.isPending
            }
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {cashoutMutation.isPending ? 'Processing...' : 'Cash Out'}
          </Button>
        </div>
        
        {cashoutMutation.isSuccess && (
          <div className="text-green-400 text-sm">
            Cash out request submitted. Treasury wallet transfer will be processed.
          </div>
        )}
        
        {cashoutMutation.isError && (
          <div className="text-red-400 text-sm">
            Cash out failed. Please try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
};