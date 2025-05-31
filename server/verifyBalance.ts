import { Connection, PublicKey } from '@solana/web3.js';

const TREASURY_WALLET = 'DAArxLx78Xb5xJUWLe8mx87WdW9NtMqNP7tv2vDsR8G';
const KEKMORPH_TOKEN_ADDRESS = 'J1GjNJohLVY1PmjvQo5WBdwU3PdBVq1FWPFJggvfSwme';

export async function verifySpecificWallet(walletAddress: string): Promise<void> {
  if (!process.env.VITE_SOLANA_RPC_URL) {
    throw new Error('Solana RPC URL not configured');
  }

  try {
    console.log(`\n=== MANUAL VERIFICATION FOR WALLET ${walletAddress} ===`);
    
    const connection = new Connection(process.env.VITE_SOLANA_RPC_URL);
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    
    // Get all treasury transactions
    const signatures = await connection.getSignaturesForAddress(treasuryPubkey, { limit: 100 });
    console.log(`Found ${signatures.length} treasury transactions to analyze`);
    
    let totalFound = 0;
    
    for (const sig of signatures) {
      const transaction = await connection.getTransaction(sig.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!transaction || !transaction.meta) continue;
      
      const preTokenBalances = transaction.meta.preTokenBalances || [];
      const postTokenBalances = transaction.meta.postTokenBalances || [];
      
      // Check if this transaction involves our wallet
      let involvesCaller = false;
      let transferAmount = 0;
      
      // Method 1: Check token balance changes for our wallet
      for (const preBalance of preTokenBalances) {
        if (preBalance.mint === KEKMORPH_TOKEN_ADDRESS && preBalance.owner === walletAddress) {
          involvesCaller = true;
          const postBalance = postTokenBalances.find(
            post => post.accountIndex === preBalance.accountIndex
          );
          
          if (postBalance) {
            const preAmount = preBalance.uiTokenAmount?.uiAmount || 0;
            const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
            const difference = preAmount - postAmount;
            
            if (difference > 0) {
              transferAmount = difference;
              totalFound += difference;
              console.log(`✓ Transaction ${sig.signature.substring(0, 8)}... : ${difference} KEKMORPH sent to treasury`);
            }
          }
        }
      }
      
      // Method 2: Check if wallet was fee payer and treasury received tokens
      const accountKeys = transaction.transaction?.message?.accountKeys || [];
      if (accountKeys.length > 0 && accountKeys[0]?.toString() === walletAddress) {
        // Check for treasury receiving tokens in this transaction
        for (const postBalance of postTokenBalances) {
          if (postBalance.mint === KEKMORPH_TOKEN_ADDRESS && postBalance.owner === TREASURY_WALLET) {
            const preBalance = preTokenBalances.find(
              pre => pre.accountIndex === postBalance.accountIndex
            );
            
            const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
            const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
            const treasuryIncrease = postAmount - preAmount;
            
            if (treasuryIncrease > 0 && !involvesCaller) {
              transferAmount = treasuryIncrease;
              totalFound += treasuryIncrease;
              console.log(`✓ Transaction ${sig.signature.substring(0, 8)}... : ${treasuryIncrease} KEKMORPH sent (fee payer method)`);
            }
          }
        }
      }
      
      // Method 3: Check transaction logs for transfer details
      const logs = transaction.meta.logMessages || [];
      for (const log of logs) {
        if (log.includes('Transfer') && log.includes(walletAddress.substring(0, 10)) && log.includes(TREASURY_WALLET.substring(0, 10))) {
          console.log(`Log: ${log}`);
        }
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total KEKMORPH sent to treasury: ${totalFound}`);
    console.log(`Expected: 400,000 KEKMORPH`);
    console.log(`=================\n`);
    
  } catch (error) {
    console.error('Error in manual verification:', error);
  }
}