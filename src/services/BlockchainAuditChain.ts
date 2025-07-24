import { ExecutiveAction, Executive, ActivityEvent } from '../types';

/**
 * Blockchain Audit Chain Service
 * 
 * Provides immutable audit records for executive decisions with cryptographic
 * verification and timestamp validation. Implements a simplified blockchain
 * structure for audit trail integrity.
 */

export interface AuditBlock {
  index: number;
  timestamp: number;
  previousHash: string;
  hash: string;
  data: AuditRecord;
  nonce: number;
}

export interface AuditRecord {
  id: string;
  executiveId: string;
  executiveName: string;
  actionType: string;
  description: string;
  value: number;
  riskLevel: string;
  timestamp: number;
  context: any;
  signature: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface AuditChainConfig {
  difficulty: number;
  blockTime: number;
  maxBlocks: number;
}

export class BlockchainAuditChain {
  private chain: AuditBlock[] = [];
  private pendingRecords: AuditRecord[] = [];
  private config: AuditChainConfig;
  private isMining: boolean = false;

  constructor(config: Partial<AuditChainConfig> = {}) {
    this.config = {
      difficulty: 4, // Number of leading zeros required
      blockTime: 10000, // 10 seconds
      maxBlocks: 1000,
      ...config
    };

    // Create genesis block
    this.createGenesisBlock();
  }

  /**
   * Create the genesis block (first block in the chain)
   */
  private createGenesisBlock(): void {
    const genesisBlock: AuditBlock = {
      index: 0,
      timestamp: Date.now(),
      previousHash: '0'.repeat(64), // 64 zeros for genesis
      hash: '',
      data: {
        id: 'genesis',
        executiveId: 'system',
        executiveName: 'System',
        actionType: 'genesis',
        description: 'Genesis block for audit chain',
        value: 0,
        riskLevel: 'none',
        timestamp: Date.now(),
        context: {},
        signature: '',
        verificationStatus: 'verified'
      },
      nonce: 0
    };

    genesisBlock.hash = this.calculateHash(genesisBlock);
    this.chain.push(genesisBlock);
  }

  /**
   * Add a new audit record to the pending queue
   */
  public addAuditRecord(
    executive: Executive,
    action: ExecutiveAction,
    context: any = {}
  ): string {
    const record: AuditRecord = {
      id: this.generateRecordId(),
      executiveId: executive.id,
      executiveName: executive.name,
      actionType: action.type,
      description: action.description,
      value: action.value,
      riskLevel: action.riskLevel,
      timestamp: Date.now(),
      context,
      signature: this.signRecord(executive, action),
      verificationStatus: 'pending'
    };

    this.pendingRecords.push(record);
    
    // Start mining if not already mining
    if (!this.isMining) {
      this.minePendingRecords();
    }

    return record.id;
  }

  /**
   * Mine pending records into a new block
   */
  private async minePendingRecords(): Promise<void> {
    if (this.pendingRecords.length === 0 || this.isMining) {
      return;
    }

    this.isMining = true;

    try {
      const records = this.pendingRecords.splice(0, 10); // Process up to 10 records per block
      const blockData = this.aggregateRecords(records);
      
      const newBlock: AuditBlock = {
        index: this.chain.length,
        timestamp: Date.now(),
        previousHash: this.getLatestBlock().hash,
        hash: '',
        data: blockData,
        nonce: 0
      };

      // Mine the block
      const minedBlock = await this.mineBlock(newBlock);
      
      // Verify the block before adding
      if (this.verifyBlock(minedBlock)) {
        this.chain.push(minedBlock);
        
        // Update verification status for all records in the block
        records.forEach(record => {
          record.verificationStatus = 'verified';
        });

        console.log(`✅ Mined block ${minedBlock.index} with ${records.length} audit records`);
      } else {
        console.error('❌ Block verification failed');
        // Return records to pending queue
        this.pendingRecords.unshift(...records);
      }
    } catch (error) {
      console.error('❌ Mining error:', error);
    } finally {
      this.isMining = false;
      
      // Continue mining if there are more pending records
      if (this.pendingRecords.length > 0) {
        setTimeout(() => this.minePendingRecords(), 1000);
      }
    }
  }

  /**
   * Mine a block with proof-of-work
   */
  private async mineBlock(block: AuditBlock): Promise<AuditBlock> {
    const target = '0'.repeat(this.config.difficulty);
    
    return new Promise((resolve) => {
      const mine = () => {
        block.hash = this.calculateHash(block);
        
        if (block.hash.startsWith(target)) {
          resolve(block);
          return;
        }
        
        block.nonce++;
        
        // Use requestAnimationFrame to prevent blocking the UI
        requestAnimationFrame(mine);
      };
      
      mine();
    });
  }

  /**
   * Calculate SHA-256 hash of a block
   */
  private calculateHash(block: AuditBlock): string {
    const data = `${block.index}${block.timestamp}${block.previousHash}${JSON.stringify(block.data)}${block.nonce}`;
    return this.sha256(data);
  }

  /**
   * Simple SHA-256 implementation (in production, use crypto-js or similar)
   */
  private sha256(str: string): string {
    // This is a simplified hash function for demo purposes
    // In production, use a proper cryptographic library
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to hex string
    return hash.toString(16).padStart(8, '0').repeat(8);
  }

  /**
   * Sign an audit record with executive's digital signature
   */
  private signRecord(executive: Executive, action: ExecutiveAction): string {
    const data = `${executive.id}${action.type}${action.description}${action.value}${Date.now()}`;
    return this.sha256(data);
  }

  /**
   * Aggregate multiple records into a single block data
   */
  private aggregateRecords(records: AuditRecord[]): AuditRecord {
    return {
      id: `block-${this.chain.length}`,
      executiveId: 'system',
      executiveName: 'Audit Chain',
      actionType: 'block_aggregation',
      description: `Block containing ${records.length} audit records`,
      value: records.reduce((sum, r) => sum + r.value, 0),
      riskLevel: 'medium',
      timestamp: Date.now(),
      context: { records },
      signature: '',
      verificationStatus: 'verified'
    };
  }

  /**
   * Verify a block's integrity
   */
  private verifyBlock(block: AuditBlock): boolean {
    // Verify hash calculation
    const calculatedHash = this.calculateHash({
      ...block,
      hash: ''
    });
    
    if (calculatedHash !== block.hash) {
      return false;
    }

    // Verify proof-of-work
    const target = '0'.repeat(this.config.difficulty);
    if (!block.hash.startsWith(target)) {
      return false;
    }

    // Verify previous hash link
    if (block.index > 0) {
      const previousBlock = this.chain[block.index - 1];
      if (block.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify the entire chain integrity
   */
  public verifyChain(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify hash link
      if (currentBlock.previousHash !== previousBlock.hash) {
        errors.push(`Invalid hash link at block ${i}`);
      }

      // Verify block integrity
      if (!this.verifyBlock(currentBlock)) {
        errors.push(`Invalid block ${i}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get audit records for an executive
   */
  public getExecutiveAuditRecords(executiveId: string): AuditRecord[] {
    const records: AuditRecord[] = [];
    
    this.chain.forEach(block => {
      if (block.data.context?.records) {
        const blockRecords = block.data.context.records as AuditRecord[];
        const executiveRecords = blockRecords.filter(r => r.executiveId === executiveId);
        records.push(...executiveRecords);
      }
    });

    return records.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get audit records by time range
   */
  public getAuditRecordsByTimeRange(startTime: number, endTime: number): AuditRecord[] {
    const records: AuditRecord[] = [];
    
    this.chain.forEach(block => {
      if (block.data.context?.records) {
        const blockRecords = block.data.context.records as AuditRecord[];
        const timeFilteredRecords = blockRecords.filter(
          r => r.timestamp >= startTime && r.timestamp <= endTime
        );
        records.push(...timeFilteredRecords);
      }
    });

    return records.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get chain statistics
   */
  public getChainStats(): {
    totalBlocks: number;
    totalRecords: number;
    chainLength: number;
    lastBlockTime: number;
    averageBlockTime: number;
    verificationStatus: { pending: number; verified: number; failed: number };
  } {
    let totalRecords = 0;
    let verificationStatus = { pending: 0, verified: 0, failed: 0 };

    this.chain.forEach(block => {
      if (block.data.context?.records) {
        const records = block.data.context.records as AuditRecord[];
        totalRecords += records.length;
        
        records.forEach(record => {
          verificationStatus[record.verificationStatus]++;
        });
      }
    });

    const blockTimes = [];
    for (let i = 1; i < this.chain.length; i++) {
      blockTimes.push(this.chain[i].timestamp - this.chain[i - 1].timestamp);
    }

    return {
      totalBlocks: this.chain.length,
      totalRecords,
      chainLength: this.chain.length,
      lastBlockTime: this.chain.length > 0 ? this.chain[this.chain.length - 1].timestamp : 0,
      averageBlockTime: blockTimes.length > 0 ? blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length : 0,
      verificationStatus
    };
  }

  /**
   * Get the latest block
   */
  private getLatestBlock(): AuditBlock {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Generate a unique record ID
   */
  private generateRecordId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export chain for backup/verification
   */
  public exportChain(): string {
    return JSON.stringify(this.chain, null, 2);
  }

  /**
   * Import chain from backup
   */
  public importChain(chainData: string): boolean {
    try {
      const importedChain = JSON.parse(chainData) as AuditBlock[];
      
      // Verify the imported chain
      const tempChain = this.chain;
      this.chain = importedChain;
      const verification = this.verifyChain();
      
      if (verification.isValid) {
        return true;
      } else {
        this.chain = tempChain;
        console.error('❌ Imported chain verification failed:', verification.errors);
        return false;
      }
    } catch (error) {
      console.error('❌ Chain import failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const blockchainAuditChain = new BlockchainAuditChain(); 