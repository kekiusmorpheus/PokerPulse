import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const playerBalances = pgTable("player_balances", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull().unique(),
  balance: integer("balance").notNull().default(0),
  nickname: varchar("nickname", { length: 100 }),
  avatar: varchar("avatar", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull(),
  transactionSignature: varchar("transaction_signature", { length: 200 }).notNull().unique(),
  amount: integer("amount").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'deposit' or 'withdrawal'
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'confirmed', 'failed'
  blockchainConfirmed: boolean("blockchain_confirmed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPlayerBalanceSchema = createInsertSchema(playerBalances).pick({
  walletAddress: true,
  balance: true,
  nickname: true,
  avatar: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  walletAddress: true,
  transactionSignature: true,
  amount: true,
  type: true,
  status: true,
  blockchainConfirmed: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PlayerBalance = typeof playerBalances.$inferSelect;
export type InsertPlayerBalance = z.infer<typeof insertPlayerBalanceSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
