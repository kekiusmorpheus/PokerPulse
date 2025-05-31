import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { sendKekMorphTokens } from "./treasuryWallet";
import { calculateBalanceFromBlockchain } from "./blockchainBalance";
import { verifySpecificWallet } from "./verifyBalance";
import { fastCalculateBalance } from "./fastScan";
import { handleQuickNodeWebhook } from "./webhookHandler";
import { handleHeliusWebhook } from "./heliusWebhook";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get player balance calculated from blockchain transactions
  app.get("/api/balance/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      // Try fast method first, fallback to comprehensive scan
      let balance = await fastCalculateBalance(walletAddress);
      if (balance === 0) {
        console.log('Fast scan returned 0, trying comprehensive scan...');
        balance = await calculateBalanceFromBlockchain(walletAddress);
      }
      res.json({ balance });
    } catch (error) {
      console.error('Error calculating balance from blockchain:', error);
      res.status(500).json({ error: "Failed to calculate balance" });
    }
  });

  // Record transaction and update balance
  app.post("/api/transaction", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Check if transaction already exists
      const existingTx = await storage.getTransaction(validatedData.transactionSignature);
      if (existingTx) {
        return res.json(existingTx);
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction(validatedData);
      
      // Update player balance if deposit
      if (validatedData.type === 'deposit') {
        let playerBalance = await storage.getPlayerBalance(validatedData.walletAddress);
        
        if (!playerBalance) {
          // Create new balance record
          playerBalance = await storage.createPlayerBalance({
            walletAddress: validatedData.walletAddress,
            balance: validatedData.amount,
            nickname: null,
            avatar: null
          });
        } else {
          // Update existing balance
          playerBalance = await storage.updatePlayerBalance(
            validatedData.walletAddress, 
            playerBalance.balance + validatedData.amount
          );
        }
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to record transaction" });
    }
  });

  // Buy in chips (virtual transfer from balance to chips)
  app.post("/api/buy-in", async (req, res) => {
    try {
      const { walletAddress, amount } = req.body;
      
      const balance = await calculateBalanceFromBlockchain(walletAddress);
      if (balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      res.json({ 
        message: "Chips purchased successfully",
        amount
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to buy chips" });
    }
  });

  // Cash out chips (virtual transfer from chips back to balance)
  app.post("/api/chip-cashout", async (req, res) => {
    try {
      const { walletAddress, amount } = req.body;
      
      res.json({ 
        message: "Chips cashed out successfully",
        amount
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to cash out chips" });
    }
  });

  // Cash out to wallet (transfer KEKMORPH tokens from treasury)
  app.post("/api/cashout", async (req, res) => {
    try {
      const { walletAddress, amount } = req.body;
      
      const balance = await calculateBalanceFromBlockchain(walletAddress);
      if (balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Send KEKMORPH tokens from treasury wallet
      const signature = await sendKekMorphTokens(walletAddress, amount);
      
      // Create withdrawal transaction record for tracking
      const withdrawalTx = await storage.createTransaction({
        walletAddress,
        transactionSignature: signature,
        amount,
        type: 'withdrawal',
        status: 'confirmed',
        blockchainConfirmed: true
      });
      
      res.json({ 
        message: "Cash out completed successfully", 
        transaction: withdrawalTx,
        signature
      });
    } catch (error) {
      console.error('Cashout error:', error);
      res.status(500).json({ error: "Failed to process cashout" });
    }
  });

  // Helius webhook endpoint for real-time transaction notifications
  app.post("/api/webhook/helius", handleHeliusWebhook);
  
  // Also support QuickNode format
  app.post("/api/webhook/quicknode", handleQuickNodeWebhook);

  // Debug endpoint to manually verify wallet transactions
  app.get("/api/debug/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      await verifySpecificWallet(walletAddress);
      res.json({ message: "Check server logs for detailed analysis" });
    } catch (error) {
      console.error('Debug verification error:', error);
      res.status(500).json({ error: "Failed to verify wallet" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
