import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const TREASURY_WALLET = 'DAArxLx78Xb5xJUWLe8mx87WdW9NtMqNP7tv2vDsR8G';
const KEKMORPH_TOKEN_ADDRESS = 'J1GjNJohLVY1PmjvQo5WBdwU3PdBVq1FWPFJggvfSwme';

// Cache for faster repeated lookups
const balanceCache = new Map<string, { balance: number, lastUpdate: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function fastCalculateBalance(walletAddress: string): Promise<number> {
  // Check cache first
  const cached = balanceCache.get(walletAddress);
  if (cached && Date.now() - cached.lastUpdate < CACHE_DURATION) {
    console.log(`Cache hit for ${walletAddress.substring(0, 8)}... - returning ${cached.balance}`);
    return cached.balance;
  }

  if (!process.env.VITE_SOLANA_RPC_URL) {
    throw new Error('Solana RPC URL not configured');
  }

  try {
    const connection = new Connection(process.env.VITE_SOLANA_RPC_URL);
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    const walletPubkey = new PublicKey(walletAddress);
    
    console.log(`🚀 FAST SCAN for ${walletAddress.substring(0, 8)}...`);
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    // Method 1: Get signatures for this specific wallet's transactions
    const walletSignatures = await connection.getSignaturesForAddress(walletPubkey, {
      limit: 1000
    });
    
    console.log(`Found ${walletSignatures.length} transactions from wallet`);
    
    // Method 2: Use token balance changes (more efficient)
    for (const sig of walletSignatures.slice(0, 50)) { // Reduced to 50 to avoid rate limits
      try {
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const transaction = await connection.getTransaction(sig.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (!transaction || !transaction.meta) continue;
        
        const preTokenBalances = transaction.meta.preTokenBalances || [];
        const postTokenBalances = transaction.meta.postTokenBalances || [];
        
        // Look for KEKMORPH token balance changes
        for (const preBalance of preTokenBalances) {
          if (preBalance.mint === KEKMORPH_TOKEN_ADDRESS && preBalance.owner === walletAddress) {
            const postBalance = postTokenBalances.find(
              post => post.accountIndex === preBalance.accountIndex
            );
            
            if (postBalance) {
              const preAmount = preBalance.uiTokenAmount?.uiAmount || 0;
              const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
              const difference = preAmount - postAmount;
              
              // Player sent tokens (potential deposit to treasury)
              if (difference > 0) {
                // Check if treasury received tokens in this transaction
                const treasuryReceived = postTokenBalances.some(
                  post => post.mint === KEKMORPH_TOKEN_ADDRESS && 
                          post.owner === TREASURY_WALLET &&
                          (post.uiTokenAmount?.uiAmount || 0) > 
                          (preTokenBalances.find(pre => pre.accountIndex === post.accountIndex)?.uiTokenAmount?.uiAmount || 0)
                );
                
                if (treasuryReceived) {
                  totalDeposits += difference;
                  console.log(`✓ FAST DEPOSIT: ${difference} KEKMORPH to treasury (${sig.signature.substring(0, 8)}...)`);
                }
              }
            }
          }
        }
        
        // Check for withdrawals (treasury to wallet)
        for (const postBalance of postTokenBalances) {
          if (postBalance.mint === KEKMORPH_TOKEN_ADDRESS && postBalance.owner === walletAddress) {
            const preBalance = preTokenBalances.find(
              pre => pre.accountIndex === postBalance.accountIndex
            );
            
            if (preBalance) {
              const preAmount = preBalance.uiTokenAmount?.uiAmount || 0;
              const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
              const increase = postAmount - preAmount;
              
              // Player received tokens (potential withdrawal from treasury)
              if (increase > 0) {
                // Check if treasury sent tokens in this transaction
                const treasurySent = preTokenBalances.some(
                  pre => pre.mint === KEKMORPH_TOKEN_ADDRESS && 
                         pre.owner === TREASURY_WALLET &&
                         (pre.uiTokenAmount?.uiAmount || 0) > 
                         (postTokenBalances.find(post => post.accountIndex === pre.accountIndex)?.uiTokenAmount?.uiAmount || 0)
                );
                
                if (treasurySent) {
                  totalWithdrawals += increase;
                  console.log(`✓ FAST WITHDRAWAL: ${increase} KEKMORPH from treasury (${sig.signature.substring(0, 8)}...)`);
                }
              }
            }
          }
        }
      } catch (error) {
        continue; // Skip failed transactions
      }
    }
    
    const balance = Math.max(0, Math.round(totalDeposits - totalWithdrawals));
    
    // Cache the result
    balanceCache.set(walletAddress, {
      balance,
      lastUpdate: Date.now()
    });
    
    console.log(`🚀 FAST SCAN RESULT: ${totalDeposits} deposits - ${totalWithdrawals} withdrawals = ${balance}`);
    
    return balance;
    
  } catch (error) {
    console.error('Fast scan error:', error);
    return 0;
  }
}

// Alternative ultra-fast method using token account balance checking
export async function ultraFastBalance(walletAddress: string): Promise<number> {
  if (!process.env.VITE_SOLANA_RPC_URL) {
    throw new Error('Solana RPC URL not configured');
  }

  try {
    const connection = new Connection(process.env.VITE_SOLANA_RPC_URL);
    
    // Get all token accounts for the wallet
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { mint: new PublicKey(KEKMORPH_TOKEN_ADDRESS) }
    );
    
    console.log(`Found ${tokenAccounts.value.length} KEKMORPH token accounts for wallet`);
    
    // For now, we still need to scan transactions to get treasury interaction history
    // This method is faster for current balance but doesn't show treasury deposit history
    
    return fastCalculateBalance(walletAddress);
    
  } catch (error) {
    console.error('Ultra fast balance error:', error);
    return 0;
  }
}