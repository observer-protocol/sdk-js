/**
 * Observer Protocol SDK TypeScript Definitions
 * @observerprotocol/sdk v1.0.0
 */

declare module '@observerprotocol/sdk' {
  export interface ObserverProtocolOptions {
    /** API endpoint URL. Default: https://api.observerprotocol.org */
    apiUrl?: string;
    /** API key for higher rate limits */
    apiKey?: string;
  }

  export interface AgentRegistrationData {
    /** Agent's public key (hex string) */
    publicKey: string;
    /** Human-readable agent name */
    alias: string;
    /** Lightning node pubkey (optional) */
    lightningNodePubkey?: string;
    /** Framework used (optional) */
    framework?: string;
    /** Capability tags (optional) */
    capabilityTags?: string[];
  }

  export interface RegisteredAgent {
    /** Unique agent ID (hashed public key) */
    id: string;
    /** URL to SVG badge */
    badge_url: string;
    /** Hash of the public key */
    public_key_hash: string;
    /** Registration timestamp */
    created_at: string;
  }

  export interface VerificationResult {
    /** Whether verification succeeded */
    verified: boolean;
    /** Verification timestamp */
    timestamp: string;
  }

  export interface TransactionData {
    /** Sender agent ID */
    senderId: string;
    /** Recipient agent ID */
    recipientId: string;
    /** Amount in satoshis */
    amountSats: number;
    /** Lightning payment hash */
    paymentHash: string;
    /** Cryptographic proof (preimage or signature) */
    proof: string;
    /** Optional context tag */
    contextTag?: string;
    /** Direction hint (inbound/outbound) */
    direction?: 'inbound' | 'outbound';
  }

  export interface RecordedTransaction {
    /** Transaction ID */
    id: string;
    /** Status of recording */
    status: string;
    /** Recording timestamp */
    recorded_at: string;
  }

  export interface ReputationData {
    /** Total number of verified transactions */
    transaction_count: number;
    /** Success rate as percentage (0-100) */
    success_rate: number;
    /** Reputation score (0-100) */
    score: number;
    /** Badge level (bronze/silver/gold/platinum) */
    badge_level: 'bronze' | 'silver' | 'gold' | 'platinum';
    /** First transaction timestamp */
    first_transaction_at?: string;
    /** Last transaction timestamp */
    last_transaction_at?: string;
  }

  export interface TransactionFilters {
    /** Filter by agent ID */
    agentId?: string;
    /** Filter by ISO date (transactions since) */
    since?: string;
    /** Maximum results to return */
    limit?: number;
  }

  export interface Transaction {
    /** Transaction ID */
    id: string;
    /** Sender agent ID */
    sender_id: string;
    /** Recipient agent ID */
    recipient_id: string;
    /** Amount in satoshis */
    amount_sats: number;
    /** Protocol used (L402, x402, etc.) */
    protocol: string;
    /** Timestamp bucket */
    time_window: string;
    /** Verification status */
    verified: boolean;
  }

  export class ObserverProtocol {
    /**
     * Create a new Observer Protocol SDK instance
     * @param options - Configuration options
     */
    constructor(options?: ObserverProtocolOptions);

    /**
     * Register a new agent identity
     * @param agentData - Agent registration data
     * @returns Registered agent information
     */
    registerAgent(agentData: AgentRegistrationData): Promise<RegisteredAgent>;

    /**
     * Verify agent identity cryptographically
     * @param agentId - Agent ID from registration
     * @param challengeMessage - Message to sign for verification
     * @param signature - Cryptographic signature
     * @returns Verification result
     */
    verifyAgent(
      agentId: string,
      challengeMessage: string,
      signature: string
    ): Promise<VerificationResult>;

    /**
     * Record a verified transaction
     * @param transaction - Transaction data
     * @returns Recorded transaction information
     */
    recordTransaction(transaction: TransactionData): Promise<RecordedTransaction>;

    /**
     * Get agent reputation data
     * @param agentId - Agent ID
     * @returns Reputation metrics
     */
    getReputation(agentId: string): Promise<ReputationData>;

    /**
     * Query transaction history
     * @param filters - Query filters
     * @returns List of transactions
     */
    queryTransactions(filters?: TransactionFilters): Promise<Transaction[]>;
  }
}
