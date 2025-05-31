import { Connection, PublicKey } from '@solana/web3.js';
import { storage } from './storage';

const TREASURY_WALLET = 'DAArxLx78Xb5xJUWLe8mx87WdW9NtMqNP7tv2vDsR8G';
const KEKMORPH_TOKEN_ADDRESS = 'J1GjNJohLVY1PmjvQo5WBdwU3PdBVq1FWPFJggvfSwme';

let processedSignatures = new Set<string>();

export async function checkTreasuryTransactions(): Promise<void> {
  if (!process.env.VITE_SOLANA_RPC_URL) {
    console.error('Solana RPC URL not configured');
    return;
  }

  try {
    const connection = new Connection(process.env.VITE_SOLANA_RPC_URL);
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    
    // Get recent transactions to the treasury wallet
    const signatures = await connection.getSignaturesForAddress(treasuryPubkey, { limit: 10 });
    
    for (const sig of signatures) {
      // Check if we already processed this transaction
      const existingTx = await storage.getTransaction(sig.signature);
      if (existingTx) continue;
      
      // Get transaction details
      const transaction = await connection.getTransaction(sig.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!transaction) continue;
      
      // Parse transaction to find KEKMORPH token transfers
      const preTokenBalances = transaction.meta?.preTokenBalances || [];
      const postTokenBalances = transaction.meta?.postTokenBalances || [];
      
      // Find KEKMORPH token transfers to treasury
      for (const postBalance of postTokenBalances) {
        if (postBalance.mint === KEKMORPH_TOKEN_ADDRESS && 
            postBalance.owner === TREASURY_WALLET) {
          
          const preBalance = preTokenBalances.find(
            pre => pre.accountIndex === postBalance.accountIndex
          );
          
          const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
          const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
          const transferAmount = postAmount - preAmount;
          
          if (transferAmount > 0) {
            // Find the sender's wallet address
            const instruction = transaction.transaction.message.instructions[0];
            const accountKeys = transaction.transaction.message.accountKeys;
            const senderPubkey = accountKeys[0]; // First account is usually the signer
            
            if (senderPubkey) {
              const senderAddress = senderPubkey.toString();
              
              // Record the deposit transaction
              await storage.createTransaction({
                walletAddress: senderAddress,
                transactionSignature: sig.signature,
                amount: Math.round(transferAmount),
                type: 'deposit',
                status: 'confirmed',
                blockchainConfirmed: true
              });
              
              // Update player balance
              let playerBalance = await storage.getPlayerBalance(senderAddress);
              
              if (!playerBalance) {
                playerBalance = await storage.createPlayerBalance({
                  walletAddress: senderAddress,
                  balance: Math.round(transferAmount),
                  nickname: null,
                  avatar: null
                });
              } else {
                await storage.updatePlayerBalance(
                  senderAddress, 
                  playerBalance.balance + Math.round(transferAmount)
                );
              }
              
              console.log(`Processed treasury deposit: ${transferAmount} KEKMORPH from ${senderAddress}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error monitoring treasury transactions:', error);
  }
}

// Start monitoring every 30 seconds
export function startTreasuryMonitoring(): void {
  setInterval(checkTreasuryTransactions, 30000);
  console.log('Treasury monitoring started - checking every 30 seconds');
}