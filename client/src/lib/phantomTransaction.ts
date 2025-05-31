import { KEKMORPH_TOKEN_ADDRESS, TREASURY_WALLET } from './solana';

// Create a proper SPL token transfer transaction for Phantom wallet
export const createKekMorphTransferTransaction = async (
  amount: number,
  fromWallet: string
): Promise<any> => {
  try {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL;
    
    // Fetch recent blockhash
    const blockhashResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getLatestBlockhash',
        params: [{ commitment: 'confirmed' }]
      })
    });
    
    const blockhashData = await blockhashResponse.json();
    const recentBlockhash = blockhashData.result.value.blockhash;
    
    // Create SPL token transfer instruction
    const transferInstruction = {
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token Program
      accounts: [
        {
          pubkey: fromWallet,
          isSigner: true,
          isWritable: false
        },
        {
          pubkey: TREASURY_WALLET,
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: KEKMORPH_TOKEN_ADDRESS,
          isSigner: false,
          isWritable: false
        }
      ],
      data: {
        instruction: 'transfer',
        amount: amount * 1000000, // Convert to token decimals (6 for KEKMORPH)
        decimals: 6
      }
    };
    
    // Create the transaction object
    const transaction = {
      recentBlockhash: recentBlockhash,
      feePayer: fromWallet,
      instructions: [transferInstruction],
      signers: []
    };
    
    return transaction;
    
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create token transfer transaction');
  }
};

// Phantom wallet KEKMORPH token transfer
export const triggerPhantomTransfer = async (
  amount: number,
  fromWallet: string
): Promise<string> => {
  const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');
  const { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
  
  if (!window.solana) {
    throw new Error('Phantom wallet not found');
  }

  // Use environment RPC URL
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL;
  const connection = new Connection(rpcUrl);
  
  const fromPubkey = new PublicKey(fromWallet);
  const toPubkey = new PublicKey(TREASURY_WALLET);
  const mintPubkey = new PublicKey(KEKMORPH_TOKEN_ADDRESS);
  
  // Get token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
  const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);
  
  // Create KEKMORPH token transfer transaction
  const transaction = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amount * 1000000, // Convert to token units (6 decimals)
      [],
      TOKEN_PROGRAM_ID
    )
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  
  // Sign and send through Phantom
  const signed = await window.solana.signAndSendTransaction(transaction);
  
  return signed.signature;
};