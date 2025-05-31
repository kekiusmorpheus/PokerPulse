import type { Request, Response } from 'express';
import { storage } from './storage';

const TREASURY_WALLET = 'DAArxLx78Xb5xJUWLe8mx87WdW9NtMqNP7tv2vDsR8G';
const KEKMORPH_TOKEN_ADDRESS = 'J1GjNJohLVY1PmjvQo5WBdwU3PdBVq1FWPFJggvfSwme';

interface QuickNodeWebhookPayload {
  accountData: {
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges?: Array<{
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
      tokenAccount: string;
      userAccount: string;
    }>;
  }[];
  description: string;
  type: string;
  source: string;
  txHash: string;
  timestamp: string;
}

export async function handleQuickNodeWebhook(req: Request, res: Response) {
  try {
    console.log('\n🔔 WEBHOOK RECEIVED from QuickNode');
    
    const payload: QuickNodeWebhookPayload = req.body;
    
    if (!payload.accountData || !Array.isArray(payload.accountData)) {
      console.log('Invalid webhook payload structure');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    console.log(`Transaction: ${payload.txHash}`);
    console.log(`Timestamp: ${payload.timestamp}`);
    
    // Check if we already processed this transaction
    const existingTx = await storage.getTransaction(payload.txHash);
    if (existingTx) {
      console.log(`Transaction ${payload.txHash} already processed`);
      return res.status(200).json({ message: 'Already processed' });
    }

    // Process each account change in the transaction
    for (const accountChange of payload.accountData) {
      if (accountChange.tokenBalanceChanges) {
        for (const tokenChange of accountChange.tokenBalanceChanges) {
          // Check if this is a KEKMORPH token change involving treasury
          if (tokenChange.mint === KEKMORPH_TOKEN_ADDRESS) {
            const amount = parseFloat(tokenChange.rawTokenAmount.tokenAmount) / Math.pow(10, tokenChange.rawTokenAmount.decimals);
            const userWallet = tokenChange.userAccount;
            
            console.log(`KEKMORPH token change detected:`);
            console.log(`  User: ${userWallet.substring(0, 8)}...`);
            console.log(`  Amount: ${amount} KEKMORPH`);
            console.log(`  Token Account: ${tokenChange.tokenAccount.substring(0, 8)}...`);
            
            // Determine if this is a deposit to treasury or withdrawal from treasury
            if (accountChange.account === TREASURY_WALLET && amount > 0) {
              // This is a deposit TO treasury
              console.log(`✅ DEPOSIT DETECTED: ${amount} KEKMORPH from ${userWallet.substring(0, 8)}...`);
              
              // Record the transaction
              await storage.createTransaction({
                walletAddress: userWallet,
                transactionSignature: payload.txHash,
                amount: Math.round(amount),
                type: 'deposit',
                status: 'confirmed',
                blockchainConfirmed: true
              });
              
              // Update player balance
              let playerBalance = await storage.getPlayerBalance(userWallet);
              
              if (!playerBalance) {
                playerBalance = await storage.createPlayerBalance({
                  walletAddress: userWallet,
                  balance: Math.round(amount),
                  nickname: null,
                  avatar: null
                });
                console.log(`Created new player balance for ${userWallet.substring(0, 8)}...`);
              } else {
                await storage.updatePlayerBalance(
                  userWallet, 
                  playerBalance.balance + Math.round(amount)
                );
                console.log(`Updated balance for ${userWallet.substring(0, 8)}... to ${playerBalance.balance + Math.round(amount)}`);
              }
              
            } else if (userWallet === TREASURY_WALLET && amount < 0) {
              // This is a withdrawal FROM treasury (negative amount means treasury sent tokens)
              const withdrawalAmount = Math.abs(amount);
              
              // Find the recipient by looking at other account changes
              for (const otherChange of payload.accountData) {
                if (otherChange.tokenBalanceChanges) {
                  for (const otherTokenChange of otherChange.tokenBalanceChanges) {
                    if (otherTokenChange.mint === KEKMORPH_TOKEN_ADDRESS && 
                        otherTokenChange.userAccount !== TREASURY_WALLET &&
                        parseFloat(otherTokenChange.rawTokenAmount.tokenAmount) > 0) {
                      
                      const recipientWallet = otherTokenChange.userAccount;
                      console.log(`✅ WITHDRAWAL DETECTED: ${withdrawalAmount} KEKMORPH to ${recipientWallet.substring(0, 8)}...`);
                      
                      // Record the withdrawal transaction
                      await storage.createTransaction({
                        walletAddress: recipientWallet,
                        transactionSignature: payload.txHash,
                        amount: Math.round(withdrawalAmount),
                        type: 'withdrawal',
                        status: 'confirmed',
                        blockchainConfirmed: true
                      });
                      
                      // Update player balance (subtract withdrawal)
                      const playerBalance = await storage.getPlayerBalance(recipientWallet);
                      if (playerBalance) {
                        await storage.updatePlayerBalance(
                          recipientWallet, 
                          Math.max(0, playerBalance.balance - Math.round(withdrawalAmount))
                        );
                        console.log(`Updated balance for ${recipientWallet.substring(0, 8)}... after withdrawal`);
                      }
                      
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log('🔔 Webhook processed successfully\n');
    res.status(200).json({ message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}