/**
 * Observer Protocol SDK
 * Cryptographic verification for AI agents
 * 
 * @observerprotocol/sdk v1.0.0
 */

const fetch = require('node-fetch');

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
   * @returns {Promise<Object>} Registered agent data
   */
  async registerAgent(agentData) {
    const response = await fetch(`${this.apiUrl}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      },
      body: JSON.stringify(agentData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Registration failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Verify agent identity cryptographically
   * @param {string} agentId - Agent ID from registration
   * @param {string} challengeMessage - Message to sign for verification
   * @param {string} signature - Cryptographic signature
   * @returns {Promise<Object>} Verification result
   */
  async verifyAgent(agentId, challengeMessage, signature) {
    const response = await fetch(`${this.apiUrl}/agents/${agentId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      },
      body: JSON.stringify({
        challenge_message: challengeMessage,
        signature: signature
      })
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
    const response = await fetch(`${this.apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      },
      body: JSON.stringify(transaction)
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
    const response = await fetch(`${this.apiUrl}/agents/${agentId}/reputation`, {
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Reputation fetch failed: ${error}`);
    }

    return response.json();
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
    if (filters.agentId) params.append('agent_id', filters.agentId);
    if (filters.since) params.append('since', filters.since);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${this.apiUrl}/transactions?${params}`, {
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transaction query failed: ${error}`);
    }

    return response.json();
  }
}

module.exports = { ObserverProtocol };
