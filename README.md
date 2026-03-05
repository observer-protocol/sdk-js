# Observer Protocol SDK

JavaScript SDK for cryptographically verifiable AI agent identity and transactions.

## Quick Start (5 Minutes)

### 1. Install
```bash
npm install @observerprotocol/sdk @noble/secp256k1

# Optional: For cryptographic signing
npm install @noble/secp256k1
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

## Integration Patterns

### Lightning/LND (Self-Hosted Node)
For agents running their own LND node.

```javascript
const observer = new ObserverProtocol();

// Poll LND for settled invoices
async function pollAndSubmit() {
  const invoices = await fetchLNDInvoices(); // Your LND API call
  
  for (const invoice of invoices) {
    if (invoice.settled) {
      await observer.submitLightningAttestation({
        agentId: 'your-agent-id',
        paymentHash: invoice.r_hash,
        preimage: invoice.r_preimage, // Cryptographic proof
        amountSats: invoice.amt_paid_sat,
        direction: 'inbound',
        counterparty: extractFromMemo(invoice.memo),
        memo: invoice.memo,
      });
    }
  }
}

// Run every 30 seconds
setInterval(pollAndSubmit, 30000);
```

See: `INTEGRATION-PATTERNS.md` for full LND listener service code.

### Alby Hub Integration
For agents using Alby Hub (hosted Lightning).

**Webhook-based (real-time):**
```javascript
const express = require('express');
const app = express();

const observer = new ObserverProtocol();

app.post('/webhook', async (req, res) => {
  const { type, invoice } = req.body;
  
  if (type !== 'invoice.settled') return res.send('OK');
  
  const result = await observer.submitLightningAttestation({
    agentId: 'your-agent-id',
    paymentHash: invoice.payment_hash,
    preimage: invoice.preimage,
    amountSats: invoice.amount,
    direction: 'inbound',
    memo: invoice.description,
  });
  
  console.log('Verified:', result.event_id);
  res.json(result);
});

app.listen(3000);
```

**Polling-based (no webhook):**
```javascript
// Poll Alby API every 30 seconds
async function pollAlby() {
  const invoices = await fetch('https://api.getalby.com/invoices', {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  }).then(r => r.json());
  
  for (const invoice of invoices.invoices) {
    if (invoice.settled && isNew(invoice)) {
      await observer.submitLightningAttestation({
        agentId: 'your-agent-id',
        paymentHash: invoice.payment_hash,
        preimage: invoice.preimage,
        amountSats: invoice.amount,
        direction: 'inbound',
        memo: invoice.description,
      });
    }
  }
}

setInterval(pollAlby, 30000);
```

### x402 (Coinbase) Integration
For agents using x402 protocol for USDC payments.

```javascript
const observer = new ObserverProtocol();

// After receiving x402 payment
async function onX402Payment(payment) {
  const result = await observer.submitX402Attestation({
    agentId: 'your-agent-id',
    transactionHash: payment.transactionHash,
    amountUsdc: payment.amount, // in base units (e.g., 100000 for $0.10)
    network: 'base', // or 'ethereum'
    payerAddress: payment.payerAddress,
    payeeAddress: payment.payeeAddress,
    direction: 'inbound',
  });
  
  console.log('x402 verified:', result.event_id, result.verified);
}
```

### On-Chain Event Watcher
Watch for x402 payments on-chain:

```javascript
const { watchContractEvent } = require('viem');
const observer = new ObserverProtocol();

watchContractEvent({
  address: '0x...', // x402 contract
  abi: x402Abi,
  eventName: 'PaymentProcessed',
  onLogs: async (logs) => {
    for (const log of logs) {
      await observer.submitX402Attestation({
        agentId: 'your-agent-id',
        transactionHash: log.transactionHash,
        amountUsdc: log.args.amount,
        network: 'base',
        payerAddress: log.args.payer,
        payeeAddress: log.args.payee,
        direction: log.args.payee === myAddress ? 'inbound' : 'outbound',
      });
    }
  },
});
```

## Why Observer Protocol?

AI agents need trust without intermediaries. Observer Protocol provides:

- **Cryptographic Identity**: Prove you're the same agent across sessions
- **Transaction Verification**: Immutable proof of agent-to-agent payments
- **Reputation Graph**: Build trust through verifiable history
- **No KYC**: Privacy-preserving verification using Bitcoin keys
- **Infrastructure Agnostic**: Works with LND, Alby, x402, or any payment rail

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

**`submitLightningAttestation(payment)`**
- Submit Lightning payment for verification
- Params: `{ agentId, paymentHash, preimage, amountSats, direction, counterparty, memo }`
- Returns: `{ event_id, verified, stored_at }`

**`submitX402Attestation(payment)`**
- Submit x402 payment for verification  
- Params: `{ agentId, transactionHash, amountUsdc, network, payerAddress, payeeAddress, direction }`
- Returns: `{ event_id, verified, stored_at }`

**`getReputation(agentId)`**
- Get agent reputation metrics
- Returns: `{ transaction_count, success_rate, score, badge_level }`

**`queryTransactions(filters)`**
- Query transaction history
- Filters: `{ agentId, since, limit }`

**`getTrends()`**
- Get aggregated protocol activity
- Returns: `{ protocol_counts, total_events, total_verified_agents }`

**`getAgentProfile(agentId)`**
- Get full agent profile
- Returns: `{ agent_id, alias, verified, verified_tx_count, ... }`

**`getBadgeUrl(agentId)`**
- Get badge SVG URL
- Returns: `string`

## Badge System

Agents earn badges based on verified activity:

- 🥉 **Bronze**: 1+ verified transaction
- 🥈 **Silver**: 10+ transactions, 90%+ success rate
- 🥇 **Gold**: 100+ transactions, 95%+ success rate
- 💎 **Platinum**: 1000+ transactions, 98%+ success rate

Display your badge: `<img src="{agent.badge_url}" alt="Verified Agent" />`

## Examples

### L402 Payment Verification
```javascript
// After completing an L402 payment
await observer.submitLightningAttestation({
  agentId: myAgentId,
  paymentHash: l402Response.payment_hash,
  preimage: l402Response.preimage,
  amountSats: paymentAmount,
  direction: 'outbound',
  counterparty: serviceProviderId,
});
```

### Nostr Zap Recording
```javascript
// After sending a Nostr zap
await observer.submitLightningAttestation({
  agentId: myAgentId,
  paymentHash: zapReceipt.payment_hash,
  preimage: zapReceipt.preimage,
  amountSats: zapAmount,
  direction: 'outbound',
  counterparty: recipientNpub,
  memo: 'Zap for great content',
});
```

### Receiving Payment (Automatic)
```javascript
// With webhook/polling setup, payments are auto-verified
// Just check your reputation
const rep = await observer.getReputation(myAgentId);
console.log(`Verified transactions: ${rep.transaction_count}`);
```

## Manual Submission (No SDK)

If you prefer not to use the SDK:

```bash
# Lightning payment
curl -X POST "https://api.observerprotocol.org/observer/submit-transaction?\
agent_id=your-agent-id&\
protocol=lightning&\
transaction_reference=PAYMENT_HASH&\
timestamp=2026-03-05T12:00:00Z&\
signature=PREIMAGE_OR_SIGNATURE&\
optional_metadata=%7B%22amount_sats%22%3A1000%7D"

# x402 payment
curl -X POST "https://api.observerprotocol.org/observer/submit-transaction?\
agent_id=your-agent-id&\
protocol=x402&\
transaction_reference=TX_HASH&\
timestamp=2026-03-05T12:00:00Z&\
signature=PROOF&\
optional_metadata=%7B%22amount_usdc%22%3A100000%2C%22network%22%3A%22base%22%7D"
```

## Support

- GitHub: https://github.com/observerprotocol/sdk-js
- Website: https://observerprotocol.org
- Integration Guide: See `INTEGRATION-PATTERNS.md`
- Nostr: npub187rmuw7uvs64les3qu0pkudlqcm3r8qzr3eu2657w2ktvw430xlq24lcna

## License

MIT
