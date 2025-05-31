import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const KEKMORPH_TOKEN_ADDRESS = 'J1GjNJohLVY1PmjvQo5WBdwU3PdBVq1FWPFJggvfSwme';
const TREASURY_WALLET = 'DAArxLx78Xb5xJUWLe8mx87WdW9NtMqNP7tv2vDsR8G';

export async function sendKekMorphTokens(
  recipientWalletAddress: string,
  amount: number
): Promise<string> {
  if (!process.env.TREASURY_PRIVATE_KEY) {
    throw new Error('Treasury private key not configured');
  }

  if (!process.env.VITE_SOLANA_RPC_URL) {
    throw new Error('Solana RPC URL not configured');
  }

  // Create connection
  const connection = new Connection(process.env.VITE_SOLANA_RPC_URL);
  
  // Create treasury wallet keypair from private key
  const treasuryKeypair = Keypair.fromSecretKey(
    Buffer.from(process.env.TREASURY_PRIVATE_KEY, 'base64')
  );
  
  const recipientPubkey = new PublicKey(recipientWalletAddress);
  const treasuryPubkey = new PublicKey(TREASURY_WALLET);
  const mintPubkey = new PublicKey(KEKMORPH_TOKEN_ADDRESS);
  
  // Get token accounts
  const treasuryTokenAccount = await getAssociatedTokenAddress(mintPubkey, treasuryPubkey);
  const recipientTokenAccount = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);
  
  // Create transfer transaction
  const transaction = new Transaction().add(
    createTransferInstruction(
      treasuryTokenAccount,
      recipientTokenAccount,
      treasuryPubkey,
      amount * 1000000, // Convert to token units (6 decimals)
      [],
      TOKEN_PROGRAM_ID
    )
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = treasuryPubkey;
  
  // Sign and send transaction
  transaction.sign(treasuryKeypair);
  const signature = await connection.sendRawTransaction(transaction.serialize());
  
  // Wait for confirmation
  await connection.confirmTransaction(signature);
  
  return signature;
}