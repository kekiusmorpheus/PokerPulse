import { Connection, PublicKey } from '@solana/web3.js';

const TREASURY_WALLET = 'DAArxLx78Xb5xJUWLe8mx87WdW9NtMqNP7tv2vDsR8G';
const KEKMORPH_TOKEN_ADDRESS = 'J1GjNJohLVY1PmjvQo5WBdwU3PdBVq1FWPFJggvfSwme';

export async function calculateBalanceFromBlockchain(walletAddress: string): Promise<number> {
  if (!process.env.VITE_SOLANA_RPC_URL) {
    throw new Error('Solana RPC URL not configured');
  }

  try {
    const connection = new Connection(process.env.VITE_SOLANA_RPC_URL);
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    console.log(`\n=== SCANNING TREASURY WALLET FOR ${walletAddress.substring(0, 8)}... ===`);
    console.log(`Treasury: ${TREASURY_WALLET}`);
    
    // Get ALL transactions to/from treasury wallet - scan comprehensively
    let allSignatures: any[] = [];
    let beforeSignature: string | undefined;
    
    // Fetch ALL treasury transactions (no limit)
    while (true) {
      const signatures = await connection.getSignaturesForAddress(treasuryPubkey, {
        limit: 1000,
        before: beforeSignature
      });
      
      if (signatures.length === 0) break;
      
      allSignatures = allSignatures.concat(signatures);
      beforeSignature = signatures[signatures.length - 1].signature;
      
      // Continue until we get ALL history
      if (allSignatures.length >= 50000) {
        console.log(`Reached 50,000 transactions, stopping scan...`);
        break;
      }
    }
    
    console.log(`Found ${allSignatures.length} total treasury transactions to analyze`);
    console.log(`Treasury currently holds 450K KEKMORPH total - scanning for ${walletAddress.substring(0, 8)}... portion`);
    
    // Process each transaction
    for (const sig of allSignatures) {
      try {
        const transaction = await connection.getTransaction(sig.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (!transaction || !transaction.meta) continue;
        
        const preTokenBalances = transaction.meta.preTokenBalances || [];
        const postTokenBalances = transaction.meta.postTokenBalances || [];
        
        // Method 1: Direct token balance analysis for our wallet
        for (const preBalance of preTokenBalances) {
          if (preBalance.mint === KEKMORPH_TOKEN_ADDRESS && preBalance.owner === walletAddress) {
            const postBalance = postTokenBalances.find(
              post => post.accountIndex === preBalance.accountIndex
            );
            
            if (postBalance) {
              const preAmount = preBalance.uiTokenAmount?.uiAmount || 0;
              const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
              const difference = preAmount - postAmount;
              
              // Player sent tokens (deposit to treasury)
              if (difference > 0) {
                // Verify treasury received these tokens
                const treasuryReceived = postTokenBalances.some(
                  post => post.mint === KEKMORPH_TOKEN_ADDRESS && 
                          post.owner === TREASURY_WALLET &&
                          (post.uiTokenAmount?.uiAmount || 0) > 
                          (preTokenBalances.find(pre => pre.accountIndex === post.accountIndex)?.uiTokenAmount?.uiAmount || 0)
                );
                
                if (treasuryReceived) {
                  totalDeposits += difference;
                  console.log(`✓ DEPOSIT: ${difference} KEKMORPH from ${walletAddress.substring(0, 8)}... (tx: ${sig.signature.substring(0, 8)}...)`);
                }
              }
            }
          }
        }
        
        // Method 2: Analyze treasury balance increases and find the sender
        for (const postBalance of postTokenBalances) {
          if (postBalance.mint === KEKMORPH_TOKEN_ADDRESS && postBalance.owner === TREASURY_WALLET) {
            const preBalance = preTokenBalances.find(
              pre => pre.accountIndex === postBalance.accountIndex
            );
            
            const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
            const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
            const treasuryIncrease = postAmount - preAmount;
            
            if (treasuryIncrease > 0) {
              // Find who sent this amount by looking for corresponding decrease
              for (const senderPreBalance of preTokenBalances) {
                if (senderPreBalance.mint === KEKMORPH_TOKEN_ADDRESS && senderPreBalance.owner === walletAddress) {
                  const senderPostBalance = postTokenBalances.find(
                    post => post.accountIndex === senderPreBalance.accountIndex
                  );
                  
                  if (senderPostBalance) {
                    const senderPreAmount = senderPreBalance.uiTokenAmount?.uiAmount || 0;
                    const senderPostAmount = senderPostBalance.uiTokenAmount?.uiAmount || 0;
                    const senderDecrease = senderPreAmount - senderPostAmount;
                    
                    // Match the amounts (within small tolerance for precision)
                    if (Math.abs(senderDecrease - treasuryIncrease) < 0.001 && senderDecrease > 0) {
                      totalDeposits += senderDecrease;
                      console.log(`✓ MATCHED DEPOSIT: ${senderDecrease} KEKMORPH to treasury from ${walletAddress.substring(0, 8)}... (tx: ${sig.signature.substring(0, 8)}...)`);
                    }
                  }
                }
              }
            }
          }
        }
        
        // Also check if this wallet is the fee payer and tokens went to treasury
        const accountKeys = transaction.transaction?.message?.accountKeys || [];
        if (accountKeys.length > 0 && accountKeys[0]?.toString() === walletAddress) {
          // This wallet was the transaction signer, check for treasury token increases
          for (const postBalance of postTokenBalances) {
            if (postBalance.mint === KEKMORPH_TOKEN_ADDRESS && postBalance.owner === TREASURY_WALLET) {
              const preBalance = preTokenBalances.find(
                pre => pre.accountIndex === postBalance.accountIndex
              );
              
              const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
              const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
              const treasuryIncrease = postAmount - preAmount;
              
              if (treasuryIncrease > 0) {
                // Check if any account lost the same amount (this would be our wallet)
                const senderLoss = preTokenBalances.find(
                  pre => pre.mint === KEKMORPH_TOKEN_ADDRESS && 
                         pre.owner === walletAddress &&
                         (pre.uiTokenAmount?.uiAmount || 0) > 
                         (postTokenBalances.find(post => post.accountIndex === pre.accountIndex)?.uiTokenAmount?.uiAmount || 0)
                );
                
                if (senderLoss) {
                  totalDeposits += treasuryIncrease;
                  console.log(`Found treasury deposit: ${treasuryIncrease} KEKMORPH from fee payer ${walletAddress.substring(0, 8)}...`);
                }
              }
            }
          }
        }
        
        // Check for withdrawals (treasury sending to player)
        for (const preBalance of preTokenBalances) {
          if (preBalance.mint === KEKMORPH_TOKEN_ADDRESS && preBalance.owner === TREASURY_WALLET) {
            const postBalance = postTokenBalances.find(
              post => post.accountIndex === preBalance.accountIndex
            );
            
            if (postBalance) {
              const preAmount = preBalance.uiTokenAmount?.uiAmount || 0;
              const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
              const treasuryLoss = preAmount - postAmount;
              
              // Treasury sent tokens - check if player received them
              if (treasuryLoss > 0) {
                const playerReceived = postTokenBalances.some(
                  post => post.mint === KEKMORPH_TOKEN_ADDRESS && 
                          post.owner === walletAddress &&
                          (post.uiTokenAmount?.uiAmount || 0) > 
                          (preTokenBalances.find(pre => pre.accountIndex === post.accountIndex)?.uiTokenAmount?.uiAmount || 0)
                );
                
                if (playerReceived) {
                  totalWithdrawals += treasuryLoss;
                }
              }
            }
          }
        }
      } catch (error) {
        // Skip failed transactions
        continue;
      }
    }
    
    const balance = Math.max(0, Math.round(totalDeposits - totalWithdrawals));
    console.log(`Wallet ${walletAddress.substring(0, 8)}... balance: ${totalDeposits} deposits - ${totalWithdrawals} withdrawals = ${balance}`);
    console.log(`Note: Treasury holds 450K total KEKMORPH - may need deeper scan for full history`);
    
    return balance;
  } catch (error) {
    console.error('Error calculating balance from blockchain:', error);
    return 0;
  }
}