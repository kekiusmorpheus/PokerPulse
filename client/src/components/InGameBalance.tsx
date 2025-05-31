import { useQuery } from '@tanstack/react-query';

interface InGameBalanceProps {
  walletAddress: string;
}

export const InGameBalance = ({ walletAddress }: InGameBalanceProps) => {
  const { data: balanceData, isLoading, error } = useQuery({
    queryKey: ['/api/balance', walletAddress],
    queryFn: async () => {
      const response = await fetch(`/api/balance/${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      return response.json();
    },
    enabled: !!walletAddress,
    refetchInterval: 30000,
    retry: 3,
  });

  const balance = balanceData?.balance || 0;

  if (error) {
    return (
      <div className="border-t border-green-600 pt-2 mt-2">
        <div className="text-red-400 text-xs">Error loading balance</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border-t border-green-600 pt-2 mt-2">
        <div className="text-green-300 text-xs">IN-GAME CHIPS</div>
        <div className="text-green-400 font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="border-t border-green-600 pt-2 mt-2">
      <div className="text-green-300 text-xs font-semibold">IN-GAME CHIPS</div>
      <div className="text-green-400 font-bold text-sm">
        {balance.toLocaleString()} KEKMORPH
      </div>
      <div className="text-green-500 text-xs">
        Available for tables
      </div>
    </div>
  );
};