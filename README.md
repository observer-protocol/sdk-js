# Observer Protocol SDK

JavaScript SDK for cryptographically verifiable AI agent identity and transactions.

## Quick Start (5 Minutes)

### 1. Install
```bash
npm install @observerprotocol/sdk
```

### 2. Register Your Agent
```javascript
const { ObserverProtocol } = require('@observerprotocol/sdk');

const observer = new ObserverProtocol();

// Register your agent
const agent = await observer.registerAgent({
  publicKey: '02a1b2c3...', // Your agent's public key (hex)
  alias: 'MyAgent',
  lightningNodePubkey: '03d4e5f6...' // Your Lightning node
});

console.log('Agent registered:', agent.id);
console.log('Badge URL:', agent.badge_url);
```

### 3. Verify Identity
```javascript
// Sign a challenge message with your agent's private key
const challenge = `verify:${agent.id}:${Date.now()}`;
const signature = signWithPrivateKey(challenge, privateKey);

// Submit verification
const verified = await observer.verifyAgent(agent.id, challenge, signature);
console.log('Verified:', verified.verified);
```

### 4. Record Transactions
```javascript
const tx = await observer.recordTransaction({
  senderId: agent.id,
  recipientId: 'other-agent-id',
  amountSats: 1000,
  paymentHash: 'payment_hash_from_lightning',
  proof: 'preimage_or_signature'
});

console.log('Transaction recorded:', tx.id);
```

### 5. Check Reputation
```javascript
const reputation = await observer.getReputation(agent.id);
console.log('Transaction count:', reputation.transaction_count);
console.log('Success rate:', reputation.success_rate);
console.log('Reputation score:', reputation.score);
```

## Why Observer Protocol?

AI agents need trust without intermediaries. Observer Protocol provides:

- **Cryptographic Identity**: Prove you're the same agent across sessions
- **Transaction Verification**: Immutable proof of agent-to-agent payments
- **Reputation Graph**: Build trust through verifiable history
- **No KYC**: Privacy-preserving verification using Bitcoin keys

## API Reference

### `ObserverProtocol`

#### Constructor
```javascript
const observer = new ObserverProtocol({
  apiUrl: 'https://api.observerprotocol.org', // Optional
  apiKey: 'your-api-key' // Optional, for higher rate limits
});
```

#### Methods

**`registerAgent(agentData)`**
- Register a new agent identity
- Returns: `{ id, badge_url, public_key_hash, created_at }`

**`verifyAgent(agentId, challengeMessage, signature)`**
- Cryptographically verify agent ownership
- Returns: `{ verified, timestamp }`

**`recordTransaction(transaction)`**
- Record a verified agent transaction
- Returns: `{ id, status, recorded_at }`

**`getReputation(agentId)`**
- Get agent reputation metrics
- Returns: `{ transaction_count, success_rate, score, badge_level }`

**`queryTransactions(filters)`**
- Query transaction history
- Filters: `{ agentId, since, limit }`

## Examples

### L402 Payment Verification
```javascript
// After completing an L402 payment
await observer.recordTransaction({
  senderId: myAgentId,
  recipientId: serviceProviderId,
  amountSats: paymentAmount,
  paymentHash: l402Response.payment_hash,
  proof: l402Response.preimage
});
```

### Nostr Zap Recording
```javascript
// After sending a Nostr zap
await observer.recordTransaction({
  senderId: myAgentId,
  recipientId: recipientAgentId,
  amountSats: zapAmount,
  paymentHash: zapReceipt.payment_hash,
  proof: zapReceipt.preimage
});
```

## Badge System

Agents earn badges based on verified activity:

- 🥉 **Bronze**: 1+ verified transaction
- 🥈 **Silver**: 10+ transactions, 90%+ success rate
- 🥇 **Gold**: 100+ transactions, 95%+ success rate
- 💎 **Platinum**: 1000+ transactions, 98%+ success rate

Display your badge: `<img src="{agent.badge_url}" alt="Verified Agent" />`

## Support

- GitHub: https://github.com/observerprotocol/sdk-js
- Website: https://observerprotocol.org
- Nostr: npub1observer...

## License

MIT
