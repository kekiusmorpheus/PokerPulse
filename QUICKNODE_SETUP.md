# QuickNode Webhook Setup Instructions

## 1. Create QuickNode Account
- Go to https://www.quicknode.com/
- Sign up for a Solana RPC endpoint
- Choose a plan that supports webhooks

## 2. Configure Webhook in QuickNode Dashboard
- Navigate to "Webhooks" section
- Create a new webhook with these settings:

**Webhook URL:** `https://your-replit-app.replit.dev/api/webhook/quicknode`

**Chain:** Solana Mainnet

**Webhook Type:** Account Activity

**Target Account:** `DAArxLx78Xb5xJUWLe8mx87WdW9NtMqNP7tv2vDsR8G` (Treasury Wallet)

**Filter Options:**
- Token Balance Changes: ✅ Enabled
- Target Token Mint: `J1GjNJohLVY1PmjvQo5WBdwU3PdBVq1FWPFJggvfSwme` (KEKMORPH)

## 3. Benefits of Webhook Integration
- **Instant Detection**: Transactions detected in real-time (seconds vs minutes)
- **Zero Polling**: No more continuous blockchain scanning
- **Reduced API Calls**: 99% fewer RPC requests
- **Better Performance**: Immediate balance updates
- **Lower Costs**: Reduced RPC usage fees

## 4. How It Works
1. Player sends KEKMORPH to treasury wallet
2. QuickNode instantly detects the transaction
3. Webhook notifies our server immediately
4. Player balance updates in real-time
5. No delays or manual refresh needed

## 5. Current Fallback
The system currently uses blockchain scanning as fallback, but with webhooks:
- Instant transaction detection
- Real-time balance updates
- Automatic player notifications
- Zero latency poker chip crediting