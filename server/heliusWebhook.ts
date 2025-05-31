import type { Request, Response } from 'express';
import { storage } from './storage';

const TREASURY_WALLET = 'DAArxLx78Xb5xJUWLe8mx87WdW9NtMqNP7tv2vDsR8G';
const KEKMORPH_TOKEN_ADDRESS = 'J1GjNJohLVY1PmjvQo5WBdwU3PdBVq1FWPFJggvfSwme';

interface HeliusWebhookPayload {
  signature: string;
  type: string;
  description: string;
  source: string;
  timestamp: number;
  tokenTransfers?: Array<{
    fromTokenAccount: string;
    toTokenAccount: string;
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
  }>;
  accountData?: Array<{
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
  }>;
}

export async function handleHeliusWebhook(req: Request, res: Response) {
  try {
    console.log('\n🔔 HELIUS WEBHOOK RECEIVED');
    
    const payload: HeliusWebhookPayload = req.body;
    
    if (!payload.signature) {
      console.log('Invalid webhook payload - missing signature');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    console.log(`Transaction: ${payload.signature}`);
    console.log(`Type: ${payload.type}`);
    console.log(`Description: ${payload.description}`);
    
    // Check if we already processed this transaction
    const existingTx = await storage.getTransaction(payload.signature);
    if (existingTx) {
      console.log(`Transaction ${payload.signature} already processed`);
      return res.status(200).json({ message: 'Already processed' });
    }

    // Process token transfers (Helius enhanced webhook format)
    if (payload.tokenTransfers && payload.tokenTransfers.length > 0) {
      for (const transfer of payload.tokenTransfers) {
        if (transfer.mint === KEKMORPH_TOKEN_ADDRESS) {
          console.log(`KEKMORPH transfer detected:`);
          console.log(`  From: ${transfer.fromUserAccount?.substring(0, 8)}...`);
          console.log(`  To: ${transfer.toUserAccount?.substring(0, 8)}...`);
          console.log(`  Amount: ${transfer.tokenAmount} KEKMORPH`);
          
          // Check if this is a transfer TO treasury
          if (transfer.toUserAccount === TREASURY_WALLET) {
            const senderWallet = transfer.fromUserAccount;
            const amount = transfer.tokenAmount;
            
            console.log(`✅ DEPOSIT DETECTED: ${amount} KEKMORPH from ${senderWallet.substring(0, 8)}...`);
            
            // Record the transaction
            await storage.createTransaction({
              walletAddress: senderWallet,
              transactionSignature: payload.signature,
              amount: Math.round(amount),
              type: 'deposit',
              status: 'confirmed',
              blockchainConfirmed: true
            });
            
            // Update player balance
            let playerBalance = await storage.getPlayerBalance(senderWallet);
            
            if (!playerBalance) {
              playerBalance = await storage.createPlayerBalance({
                walletAddress: senderWallet,
                balance: Math.round(amount),
                nickname: null,
                avatar: null
              });
              console.log(`Created new player balance for ${senderWallet.substring(0, 8)}...`);
            } else {
              await storage.updatePlayerBalance(
                senderWallet, 
                playerBalance.balance + Math.round(amount)
              );
              console.log(`Updated balance for ${senderWallet.substring(0, 8)}... to ${playerBalance.balance + Math.round(amount)}`);
            }
          }
          
          // Check if this is a transfer FROM treasury (withdrawal)
          if (transfer.fromUserAccount === TREASURY_WALLET) {
            const recipientWallet = transfer.toUserAccount;
            const amount = transfer.tokenAmount;
            
            console.log(`✅ WITHDRAWAL DETECTED: ${amount} KEKMORPH to ${recipientWallet.substring(0, 8)}...`);
            
            // Record the withdrawal transaction
            await storage.createTransaction({
              walletAddress: recipientWallet,
              transactionSignature: payload.signature,
              amount: Math.round(amount),
              type: 'withdrawal',
              status: 'confirmed',
              blockchainConfirmed: true
            });
            
            // Update player balance (subtract withdrawal)
            const playerBalance = await storage.getPlayerBalance(recipientWallet);
            if (playerBalance) {
              await storage.updatePlayerBalance(
                recipientWallet, 
                Math.max(0, playerBalance.balance - Math.round(amount))
              );
              console.log(`Updated balance for ${recipientWallet.substring(0, 8)}... after withdrawal`);
            }
          }
        }
      }
    }
    
    // Fallback: Process account data format (if tokenTransfers is not available)
    else if (payload.accountData && Array.isArray(payload.accountData)) {
      for (const accountChange of payload.accountData) {
        if (accountChange.tokenBalanceChanges) {
          for (const tokenChange of accountChange.tokenBalanceChanges) {
            if (tokenChange.mint === KEKMORPH_TOKEN_ADDRESS) {
              const amount = parseFloat(tokenChange.rawTokenAmount.tokenAmount) / Math.pow(10, tokenChange.rawTokenAmount.decimals);
              const userWallet = tokenChange.userAccount;
              
              console.log(`KEKMORPH token change detected:`);
              console.log(`  User: ${userWallet.substring(0, 8)}...`);
              console.log(`  Amount: ${amount} KEKMORPH`);
              
              // Process similar to QuickNode format
              if (accountChange.account === TREASURY_WALLET && amount > 0) {
                console.log(`✅ DEPOSIT DETECTED: ${amount} KEKMORPH from ${userWallet.substring(0, 8)}...`);
                
                await storage.createTransaction({
                  walletAddress: userWallet,
                  transactionSignature: payload.signature,
                  amount: Math.round(amount),
                  type: 'deposit',
                  status: 'confirmed',
                  blockchainConfirmed: true
                });
                
                let playerBalance = await storage.getPlayerBalance(userWallet);
                
                if (!playerBalance) {
                  await storage.createPlayerBalance({
                    walletAddress: userWallet,
                    balance: Math.round(amount),
                    nickname: null,
                    avatar: null
                  });
                } else {
                  await storage.updatePlayerBalance(
                    userWallet, 
                    playerBalance.balance + Math.round(amount)
                  );
                }
              }
            }
          }
        }
      }
    }

    console.log('🔔 Helius webhook processed successfully\n');
    res.status(200).json({ message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('Helius webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}