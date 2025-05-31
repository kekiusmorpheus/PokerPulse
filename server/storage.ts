import { users, playerBalances, transactions, type User, type InsertUser, type PlayerBalance, type InsertPlayerBalance, type Transaction, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Player balance methods
  getPlayerBalance(walletAddress: string): Promise<PlayerBalance | undefined>;
  createPlayerBalance(balance: InsertPlayerBalance): Promise<PlayerBalance>;
  updatePlayerBalance(walletAddress: string, newBalance: number): Promise<PlayerBalance>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(signature: string): Promise<Transaction | undefined>;
  updateTransactionStatus(signature: string, status: string, confirmed?: boolean): Promise<void>;
  getPlayerTransactions(walletAddress: string): Promise<Transaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Player balance methods
  async getPlayerBalance(walletAddress: string): Promise<PlayerBalance | undefined> {
    const [balance] = await db.select().from(playerBalances).where(eq(playerBalances.walletAddress, walletAddress));
    return balance || undefined;
  }

  async createPlayerBalance(balance: InsertPlayerBalance): Promise<PlayerBalance> {
    const [newBalance] = await db
      .insert(playerBalances)
      .values(balance)
      .returning();
    return newBalance;
  }

  async updatePlayerBalance(walletAddress: string, newBalance: number): Promise<PlayerBalance> {
    const [updatedBalance] = await db
      .update(playerBalances)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(playerBalances.walletAddress, walletAddress))
      .returning();
    return updatedBalance;
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransaction(signature: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.transactionSignature, signature));
    return transaction || undefined;
  }

  async updateTransactionStatus(signature: string, status: string, confirmed?: boolean): Promise<void> {
    const updateData: any = { status };
    if (confirmed !== undefined) {
      updateData.blockchainConfirmed = confirmed;
    }
    
    await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.transactionSignature, signature));
  }

  async getPlayerTransactions(walletAddress: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.walletAddress, walletAddress));
  }
}

export const storage = new DatabaseStorage();
