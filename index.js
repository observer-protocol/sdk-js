/**
 * Observer Protocol SDK
 * Cryptographic verification for AI agents
 * 
 * @observerprotocol/sdk v1.0.0
 */

// Use built-in fetch (Node 18+) or fallback to node-fetch
const fetch = globalThis.fetch || require('node-fetch');

const DEFAULT_API_URL = 'https://api.observerprotocol.org';

class ObserverProtocol {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || DEFAULT_API_URL;
    this.apiKey = options.apiKey || null;
  }

  /**
   * Register a new agent identity
   * @param {Object} agentData - Agent registration data
   * @param {string} agentData.publicKey - Agent's public key (hex)
   * @param {string} agentData.alias - Human-readable agent name
   * @param {string} agentData.lightningNodePubkey - Lightning node pubkey
   * @param {string} agentData.framework - Agent framework (optional)
   * @returns {Promise<Object>} Registered agent data
   */
  async registerAgent(agentData) {
    const params = new URLSearchParams();
    params.append('public_key', agentData.publicKey);
    if (agentData.alias) params.append('agent_name', agentData.alias);
    if (agentData.alias) params.append('alias', agentData.alias);
    if (agentData.framework) params.append('framework', agentData.framework);
    if (agentData.lightningNodePubkey) params.append('lightning_pubkey', agentData.lightningNodePubkey);

    const response = await fetch(`${this.apiUrl}/observer/register-agent?${params}`, {
      method: 'POST',
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Registration failed: ${error}`);
    }

    const data = await response.json();
    // Normalize response to match documented interface
    return {
      id: data.agent_id,
      badge_url: `${this.apiUrl}/observer/badge/${data.agent_id}.svg`,
      public_key_hash: data.agent_id, // agent_id is the hashed public key
      created_at: new Date().toISOString(),
      ...data
    };
  }

  /**
   * Verify agent identity cryptographically
   * @param {string} agentId - Agent ID from registration
   * @param {string} challengeMessage - Message to sign for verification (not used in MVP)
   * @param {string} signature - Cryptographic signature
   * @returns {Promise<Object>} Verification result
   */
  async verifyAgent(agentId, challengeMessage, signature) {
    const params = new URLSearchParams();
    params.append('agent_id', agentId);
    params.append('signed_challenge', signature);

    const response = await fetch(`${this.apiUrl}/observer/verify-agent?${params}`, {
      method: 'POST',
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Verification failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Record a verified transaction
   * @param {Object} transaction - Transaction data
   * @param {string} transaction.senderId - Sender agent ID
   * @param {string} transaction.recipientId - Recipient agent ID
   * @param {number} transaction.amountSats - Amount in satoshis
   * @param {string} transaction.paymentHash - Lightning payment hash
   * @param {string} transaction.proof - Cryptographic proof of payment
   * @returns {Promise<Object>} Recorded transaction
   */
  async recordTransaction(transaction) {
    const params = new URLSearchParams();
    params.append('agent_id', transaction.senderId || transaction.agent_id);
    params.append('protocol', 'lightning');
    params.append('transaction_reference', transaction.paymentHash);
    params.append('timestamp', new Date().toISOString());
    params.append('signature', transaction.proof);
    if (transaction.recipientId) {
      params.append('optional_metadata', JSON.stringify({ recipient: transaction.recipientId }));
    }

    const response = await fetch(`${this.apiUrl}/observer/submit-transaction?${params}`, {
      method: 'POST',
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transaction recording failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get agent reputation data
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} Reputation metrics
   */
  async getReputation(agentId) {
    // Use the agent profile endpoint and extract reputation data
    const response = await fetch(`${this.apiUrl}/observer/agents/${agentId}`, {
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Reputation fetch failed: ${error}`);
    }

    const data = await response.json();
    // Normalize to expected interface
    return {
      transaction_count: data.verified_tx_count || 0,
      success_rate: data.verified ? 100 : 0,
      score: data.verified ? 100 : 0,
      badge_level: this._getBadgeLevel(data.verified_tx_count || 0),
      ...data
    };
  }

  /**
   * Get badge level based on transaction count
   * @private
   */
  _getBadgeLevel(txCount) {
    if (txCount >= 1000) return 'platinum';
    if (txCount >= 100) return 'gold';
    if (txCount >= 10) return 'silver';
    return 'bronze';
  }

  /**
   * Query transaction history
   * @param {Object} filters - Query filters
   * @param {string} filters.agentId - Filter by agent
   * @param {string} filters.since - ISO date string
   * @param {number} filters.limit - Max results
   * @returns {Promise<Array>} Transaction list
   */
  async queryTransactions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    // Note: The feed endpoint doesn't support agent filtering in MVP
    
    const response = await fetch(`${this.apiUrl}/observer/feed?${params}`, {
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transaction query failed: ${error}`);
    }

    const data = await response.json();
    return data.events || [];
  }

  /**
   * Get trends data
   * @returns {Promise<Object>} Trends data
   */
  async getTrends() {
    const response = await fetch(`${this.apiUrl}/observer/trends`, {
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Trends fetch failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get agent profile
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} Agent profile
   */
  async getAgentProfile(agentId) {
    const response = await fetch(`${this.apiUrl}/observer/agents/${agentId}`, {
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Profile fetch failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get badge SVG URL
   * @param {string} agentId - Agent ID
   * @returns {string} Badge URL
   */
  getBadgeUrl(agentId) {
    return `${this.apiUrl}/observer/badge/${agentId}.svg`;
  }

  /**
   * Submit Lightning payment attestation (generic)
   * @param {Object} payment - Payment data
   * @param {string} payment.agentId - Your agent ID
   * @param {string} payment.paymentHash - Lightning payment hash
   * @param {string} payment.preimage - Lightning preimage (proof)
   * @param {number} payment.amountSats - Amount in satoshis
   * @param {string} payment.direction - 'inbound' or 'outbound'
   * @param {string} payment.counterparty - Counterparty identifier (optional)
   * @param {string} payment.memo - Payment memo (optional)
   * @returns {Promise<Object>} Submission result
   */
  async submitLightningAttestation(payment) {
    const params = new URLSearchParams({
      agent_id: payment.agentId,
      protocol: 'lightning',
      transaction_reference: payment.paymentHash,
      timestamp: new Date().toISOString(),
      signature: payment.preimage || 'placeholder_sig',
      optional_metadata: JSON.stringify({
        amount_sats: payment.amountSats,
        direction: payment.direction || 'inbound',
        counterparty: payment.counterparty || 'unknown',
        memo: payment.memo || '',
        preimage_available: !!payment.preimage,
      }),
    });

    const response = await fetch(`${this.apiUrl}/observer/submit-transaction?${params}`, {
      method: 'POST',
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Attestation submission failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Submit x402 payment attestation
   * @param {Object} payment - x402 payment data
   * @param {string} payment.agentId - Your agent ID
   * @param {string} payment.transactionHash - On-chain transaction hash
   * @param {number} payment.amountUsdc - Amount in USDC (base units)
   * @param {string} payment.network - Network (e.g., 'base', 'ethereum')
   * @param {string} payment.payerAddress - Payer wallet address
   * @param {string} payment.payeeAddress - Payee wallet address
   * @param {string} payment.direction - 'inbound' or 'outbound'
   * @returns {Promise<Object>} Submission result
   */
  async submitX402Attestation(payment) {
    const params = new URLSearchParams({
      agent_id: payment.agentId,
      protocol: 'x402',
      transaction_reference: payment.transactionHash,
      timestamp: new Date().toISOString(),
      signature: payment.signature || 'placeholder_sig',
      optional_metadata: JSON.stringify({
        amount_usdc: payment.amountUsdc,
        network: payment.network,
        payer_address: payment.payerAddress,
        payee_address: payment.payeeAddress,
        direction: payment.direction || 'inbound',
      }),
    });

    const response = await fetch(`${this.apiUrl}/observer/submit-transaction?${params}`, {
      method: 'POST',
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`x402 attestation submission failed: ${error}`);
    }

    return response.json();
  }
}

module.exports = { ObserverProtocol };
