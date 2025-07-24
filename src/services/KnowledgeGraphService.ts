import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';

export interface KnowledgeNode {
  id: string;
  type: 'executive' | 'contact' | 'deal' | 'meeting' | 'email' | 'decision' | 'company' | 'opportunity';
  label: string;
  properties: Record<string, any>;
  metadata: {
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    version: number;
    encrypted: boolean;
  };
  relationships: Relationship[];
}

export interface Relationship {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: 'reports_to' | 'collaborates_with' | 'manages' | 'influences' | 'depends_on' | 'competes_with' | 'partners_with' | 'owns' | 'advises' | 'mentors';
  properties: Record<string, any>;
  strength: number;
  metadata: {
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    version: number;
    encrypted: boolean;
  };
}

export interface KnowledgeGraphConfig {
  encryptionEnabled: boolean;
  validationEnabled: boolean;
  syncInterval: number;
  maxNodes: number;
  maxRelationships: number;
  enableVersioning: boolean;
  enableAuditTrail: boolean;
  graphVisualization: boolean;
}

export interface GraphQuery {
  nodeTypes?: string[];
  relationshipTypes?: string[];
  properties?: Record<string, any>;
  depth?: number;
  limit?: number;
  filters?: GraphFilter[];
}

export interface GraphFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface GraphMetrics {
  totalNodes: number;
  totalRelationships: number;
  nodeTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
  averageDegree: number;
  density: number;
  connectedComponents: number;
  averagePathLength: number;
}

export interface SyncResult {
  nodesAdded: number;
  nodesUpdated: number;
  nodesDeleted: number;
  relationshipsAdded: number;
  relationshipsUpdated: number;
  relationshipsDeleted: number;
  conflicts: GraphConflict[];
  validationErrors: ValidationError[];
}

export interface GraphConflict {
  nodeId: string;
  conflictType: 'version_mismatch' | 'property_conflict' | 'relationship_conflict';
  localVersion: number;
  remoteVersion: number;
  resolution: 'local_wins' | 'remote_wins' | 'manual_resolution' | 'merge';
}

export interface ValidationError {
  nodeId?: string;
  relationshipId?: string;
  errorType: 'invalid_property' | 'missing_required_field' | 'circular_reference' | 'orphaned_relationship';
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

export class KnowledgeGraphService extends EventEmitter {
  private config: KnowledgeGraphConfig;
  private nodes: Map<string, KnowledgeNode> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private encryptionKey: Buffer;
  private syncInterval?: NodeJS.Timeout;
  private isSyncing: boolean = false;
  private auditTrail: any[] = [];

  constructor(config: Partial<KnowledgeGraphConfig> = {}) {
    super();
    this.config = {
      encryptionEnabled: true,
      validationEnabled: true,
      syncInterval: 30000,
      maxNodes: 10000,
      maxRelationships: 50000,
      enableVersioning: true,
      enableAuditTrail: true,
      graphVisualization: true,
      ...config
    };
    
    this.encryptionKey = this.generateEncryptionKey();
    this.startSync();
  }

  private generateEncryptionKey(): Buffer {
    return randomBytes(32);
  }

  private encryptData(data: string): string {
    if (!this.config.encryptionEnabled) return data;
    const hash = createHash('sha256');
    hash.update(data + this.encryptionKey.toString('hex'));
    return hash.digest('hex').substring(0, 32);
  }

  private decryptData(encryptedData: string): string {
    if (!this.config.encryptionEnabled) return encryptedData;
    return encryptedData;
  }

  public createNode(
    type: KnowledgeNode['type'],
    label: string,
    properties: Record<string, any> = {},
    createdBy: string = 'system'
  ): KnowledgeNode {
    const nodeId = this.generateNodeId();
    const now = Date.now();
    
    const node: KnowledgeNode = {
      id: nodeId,
      type,
      label,
      properties: this.config.encryptionEnabled ? 
        Object.fromEntries(
          Object.entries(properties).map(([key, value]) => [
            key, 
            this.encryptData(JSON.stringify(value))
          ])
        ) : properties,
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy,
        version: 1,
        encrypted: this.config.encryptionEnabled
      },
      relationships: []
    };

    this.nodes.set(nodeId, node);
    this.emit('nodeCreated', node);
    this.logAuditTrail('node_created', { nodeId, type, label, createdBy });
    
    return node;
  }

  public updateNode(
    nodeId: string,
    updates: Partial<Pick<KnowledgeNode, 'label' | 'properties'>>,
    updatedBy: string = 'system'
  ): KnowledgeNode | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    const updatedProperties = { ...node.properties };
    if (updates.properties) {
      const newProperties = this.config.encryptionEnabled ? 
        Object.fromEntries(
          Object.entries(updates.properties).map(([key, value]) => [
            key, 
            this.encryptData(JSON.stringify(value))
          ])
        ) : updates.properties;
      Object.assign(updatedProperties, newProperties);
    }

    const updatedNode: KnowledgeNode = {
      ...node,
      label: updates.label || node.label,
      properties: updatedProperties,
      metadata: {
        ...node.metadata,
        updatedAt: Date.now(),
        version: node.metadata.version + 1
      }
    };

    this.nodes.set(nodeId, updatedNode);
    this.emit('nodeUpdated', updatedNode);
    this.logAuditTrail('node_updated', { nodeId, updatedBy });
    
    return updatedNode;
  }

  public deleteNode(nodeId: string, deletedBy: string = 'system'): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const relationshipsToRemove = Array.from(this.relationships.values())
      .filter(rel => rel.sourceNodeId === nodeId || rel.targetNodeId === nodeId);
    
    relationshipsToRemove.forEach(rel => {
      this.relationships.delete(rel.id);
    });

    this.nodes.delete(nodeId);
    this.emit('nodeDeleted', node);
    this.logAuditTrail('node_deleted', { nodeId, deletedBy });
    
    return true;
  }

  public createRelationship(
    sourceNodeId: string,
    targetNodeId: string,
    type: Relationship['type'],
    properties: Record<string, any> = {},
    strength: number = 0.5,
    createdBy: string = 'system'
  ): Relationship | null {
    if (!this.nodes.has(sourceNodeId) || !this.nodes.has(targetNodeId)) {
      return null;
    }

    const relationshipId = this.generateRelationshipId();
    const now = Date.now();
    
    const relationship: Relationship = {
      id: relationshipId,
      sourceNodeId,
      targetNodeId,
      type,
      properties: this.config.encryptionEnabled ? 
        Object.fromEntries(
          Object.entries(properties).map(([key, value]) => [
            key, 
            this.encryptData(JSON.stringify(value))
          ])
        ) : properties,
      strength: Math.max(0, Math.min(1, strength)),
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy,
        version: 1,
        encrypted: this.config.encryptionEnabled
      }
    };

    this.relationships.set(relationshipId, relationship);
    
    const sourceNode = this.nodes.get(sourceNodeId);
    const targetNode = this.nodes.get(targetNodeId);
    
    if (sourceNode) {
      sourceNode.relationships.push(relationship);
      this.nodes.set(sourceNodeId, sourceNode);
    }
    
    if (targetNode) {
      targetNode.relationships.push(relationship);
      this.nodes.set(targetNodeId, targetNode);
    }

    this.emit('relationshipCreated', relationship);
    this.logAuditTrail('relationship_created', { 
      relationshipId, sourceNodeId, targetNodeId, type, createdBy 
    });
    
    return relationship;
  }

  public updateRelationship(
    relationshipId: string,
    updates: Partial<Pick<Relationship, 'properties' | 'strength'>>,
    updatedBy: string = 'system'
  ): Relationship | null {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) return null;

    const updatedProperties = { ...relationship.properties };
    if (updates.properties) {
      const newProperties = this.config.encryptionEnabled ? 
        Object.fromEntries(
          Object.entries(updates.properties).map(([key, value]) => [
            key, 
            this.encryptData(JSON.stringify(value))
          ])
        ) : updates.properties;
      Object.assign(updatedProperties, newProperties);
    }

    const updatedRelationship: Relationship = {
      ...relationship,
      properties: updatedProperties,
      strength: updates.strength !== undefined ? 
        Math.max(0, Math.min(1, updates.strength)) : relationship.strength,
      metadata: {
        ...relationship.metadata,
        updatedAt: Date.now(),
        version: relationship.metadata.version + 1
      }
    };

    this.relationships.set(relationshipId, updatedRelationship);
    this.emit('relationshipUpdated', updatedRelationship);
    this.logAuditTrail('relationship_updated', { relationshipId, updatedBy });
    
    return updatedRelationship;
  }

  public deleteRelationship(relationshipId: string, deletedBy: string = 'system'): boolean {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) return false;

    const sourceNode = this.nodes.get(relationship.sourceNodeId);
    const targetNode = this.nodes.get(relationship.targetNodeId);
    
    if (sourceNode) {
      sourceNode.relationships = sourceNode.relationships.filter(r => r.id !== relationshipId);
      this.nodes.set(relationship.sourceNodeId, sourceNode);
    }
    
    if (targetNode) {
      targetNode.relationships = targetNode.relationships.filter(r => r.id !== relationshipId);
      this.nodes.set(relationship.targetNodeId, targetNode);
    }

    this.relationships.delete(relationshipId);
    this.emit('relationshipDeleted', relationship);
    this.logAuditTrail('relationship_deleted', { relationshipId, deletedBy });
    
    return true;
  }

  public queryGraph(query: GraphQuery): { nodes: KnowledgeNode[], relationships: Relationship[] } {
    let nodes = Array.from(this.nodes.values());
    let relationships = Array.from(this.relationships.values());

    if (query.nodeTypes) {
      nodes = nodes.filter(node => query.nodeTypes!.includes(node.type));
    }

    if (query.relationshipTypes) {
      relationships = relationships.filter(rel => query.relationshipTypes!.includes(rel.type));
    }

    if (query.properties) {
      nodes = nodes.filter(node => {
        return Object.entries(query.properties!).every(([key, value]) => {
          const nodeValue = this.config.encryptionEnabled ? 
            this.decryptData(node.properties[key] || '') : node.properties[key];
          return nodeValue === value;
        });
      });
    }

    if (query.filters) {
      nodes = nodes.filter(node => {
        return query.filters!.every(filter => {
          const value = node.properties[filter.field];
          const decryptedValue = this.config.encryptionEnabled ? 
            this.decryptData(value || '') : value;
          
          switch (filter.operator) {
            case 'equals': return decryptedValue === filter.value;
            case 'contains': return String(decryptedValue).includes(String(filter.value));
            case 'greater_than': return Number(decryptedValue) > Number(filter.value);
            case 'less_than': return Number(decryptedValue) < Number(filter.value);
            case 'in': return Array.isArray(filter.value) && filter.value.includes(decryptedValue);
            case 'not_in': return Array.isArray(filter.value) && !filter.value.includes(decryptedValue);
            default: return true;
          }
        });
      });
    }

    if (query.depth) {
      const nodeIds = new Set(nodes.map(n => n.id));
      relationships = relationships.filter(rel => 
        nodeIds.has(rel.sourceNodeId) && nodeIds.has(rel.targetNodeId)
      );
    }

    if (query.limit) {
      nodes = nodes.slice(0, query.limit);
      const nodeIds = new Set(nodes.map(n => n.id));
      relationships = relationships.filter(rel => 
        nodeIds.has(rel.sourceNodeId) && nodeIds.has(rel.targetNodeId)
      );
    }

    return { nodes, relationships };
  }

  public getGraphMetrics(): GraphMetrics {
    const nodes = Array.from(this.nodes.values());
    const relationships = Array.from(this.relationships.values());
    
    const nodeTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};
    
    nodes.forEach(node => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    });
    
    relationships.forEach(rel => {
      relationshipTypes[rel.type] = (relationshipTypes[rel.type] || 0) + 1;
    });

    const totalDegree = relationships.length * 2;
    const averageDegree = nodes.length > 0 ? totalDegree / nodes.length : 0;
    const maxPossibleEdges = nodes.length * (nodes.length - 1);
    const density = maxPossibleEdges > 0 ? relationships.length / maxPossibleEdges : 0;

    return {
      totalNodes: nodes.length,
      totalRelationships: relationships.length,
      nodeTypes,
      relationshipTypes,
      averageDegree,
      density,
      connectedComponents: this.calculateConnectedComponents(),
      averagePathLength: this.calculateAveragePathLength()
    };
  }

  private calculateConnectedComponents(): number {
    const visited = new Set<string>();
    let components = 0;
    
    for (const node of Array.from(this.nodes.values())) {
      if (!visited.has(node.id)) {
        this.dfs(node.id, visited);
        components++;
      }
    }
    
    return components;
  }

  private dfs(nodeId: string, visited: Set<string>): void {
    visited.add(nodeId);
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    for (const rel of node.relationships) {
      const neighborId = rel.sourceNodeId === nodeId ? rel.targetNodeId : rel.sourceNodeId;
      if (!visited.has(neighborId)) {
        this.dfs(neighborId, visited);
      }
    }
  }

  private calculateAveragePathLength(): number {
    const nodes = Array.from(this.nodes.values());
    if (nodes.length < 2) return 0;
    
    let totalPathLength = 0;
    let pathCount = 0;
    
    for (let i = 0; i < Math.min(nodes.length, 100); i++) {
      for (let j = i + 1; j < Math.min(nodes.length, 100); j++) {
        const pathLength = this.shortestPathLength(nodes[i].id, nodes[j].id);
        if (pathLength > 0) {
          totalPathLength += pathLength;
          pathCount++;
        }
      }
    }
    
    return pathCount > 0 ? totalPathLength / pathCount : 0;
  }

  private shortestPathLength(sourceId: string, targetId: string): number {
    const queue: Array<{ nodeId: string; distance: number }> = [{ nodeId: sourceId, distance: 0 }];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift()!;
      
      if (nodeId === targetId) return distance;
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      const node = this.nodes.get(nodeId);
      if (!node) continue;
      
      for (const rel of node.relationships) {
        const neighborId = rel.sourceNodeId === nodeId ? rel.targetNodeId : rel.sourceNodeId;
        if (!visited.has(neighborId)) {
          queue.push({ nodeId: neighborId, distance: distance + 1 });
        }
      }
    }
    
    return -1;
  }

  public validateGraph(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const rel of Array.from(this.relationships.values())) {
      if (!this.nodes.has(rel.sourceNodeId)) {
        errors.push({
          relationshipId: rel.id,
          errorType: 'orphaned_relationship',
          message: `Relationship ${rel.id} references non-existent source node ${rel.sourceNodeId}`,
          severity: 'error'
        });
      }
      
      if (!this.nodes.has(rel.targetNodeId)) {
        errors.push({
          relationshipId: rel.id,
          errorType: 'orphaned_relationship',
          message: `Relationship ${rel.id} references non-existent target node ${rel.targetNodeId}`,
          severity: 'error'
        });
      }
    }
    
    for (const node of Array.from(this.nodes.values())) {
      const visited = new Set<string>();
      if (this.hasCircularReference(node.id, visited, new Set<string>())) {
        errors.push({
          nodeId: node.id,
          errorType: 'circular_reference',
          message: `Circular reference detected starting from node ${node.id}`,
          severity: 'critical'
        });
      }
    }
    
    return errors;
  }

  private hasCircularReference(
    nodeId: string, 
    visited: Set<string>, 
    recursionStack: Set<string>
  ): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    
    for (const rel of node.relationships) {
      const neighborId = rel.sourceNodeId === nodeId ? rel.targetNodeId : rel.sourceNodeId;
      if (this.hasCircularReference(neighborId, visited, recursionStack)) {
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }

  public async syncWithExternalSystem(externalData: any): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }
    
    this.isSyncing = true;
    const result: SyncResult = {
      nodesAdded: 0,
      nodesUpdated: 0,
      nodesDeleted: 0,
      relationshipsAdded: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      conflicts: [],
      validationErrors: []
    };

    try {
      for (const externalNode of externalData.nodes || []) {
        const existingNode = this.nodes.get(externalNode.id);
        
        if (!existingNode) {
          this.createNode(
            externalNode.type,
            externalNode.label,
            externalNode.properties,
            externalNode.createdBy || 'external_sync'
          );
          result.nodesAdded++;
        } else if (existingNode.metadata.version < externalNode.version) {
          this.updateNode(
            externalNode.id,
            {
              label: externalNode.label,
              properties: externalNode.properties
            },
            'external_sync'
          );
          result.nodesUpdated++;
        }
      }

      for (const externalRel of externalData.relationships || []) {
        const existingRel = this.relationships.get(externalRel.id);
        
        if (!existingRel) {
          this.createRelationship(
            externalRel.sourceNodeId,
            externalRel.targetNodeId,
            externalRel.type,
            externalRel.properties,
            externalRel.strength,
            externalRel.createdBy || 'external_sync'
          );
          result.relationshipsAdded++;
        } else if (existingRel.metadata.version < externalRel.version) {
          this.updateRelationship(
            externalRel.id,
            {
              properties: externalRel.properties,
              strength: externalRel.strength
            },
            'external_sync'
          );
          result.relationshipsUpdated++;
        }
      }

      result.validationErrors = this.validateGraph();
      
      this.emit('syncCompleted', result);
      this.logAuditTrail('sync_completed', result);
      
    } catch (error) {
      this.emit('syncFailed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private startSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.performPeriodicSync();
    }, this.config.syncInterval);
  }

  private async performPeriodicSync(): Promise<void> {
    try {
      const externalData = {
        nodes: [
          {
            id: 'exec-1',
            type: 'executive' as const,
            label: 'CEO',
            properties: { department: 'executive', level: 'C-suite' },
            version: 1,
            createdBy: 'external_system'
          }
        ],
        relationships: []
      };
      
      await this.syncWithExternalSystem(externalData);
    } catch (error) {
      console.error('Periodic sync failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRelationshipId(): string {
    return `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logAuditTrail(action: string, data: any): void {
    if (!this.config.enableAuditTrail) return;
    
    this.auditTrail.push({
      timestamp: Date.now(),
      action,
      data,
      userId: data.createdBy || data.updatedBy || data.deletedBy || 'system'
    });
    
    if (this.auditTrail.length > 1000) {
      this.auditTrail = this.auditTrail.slice(-1000);
    }
  }

  public getAuditTrail(timeRange: number = 3600000): any[] {
    const cutoff = Date.now() - timeRange;
    return this.auditTrail.filter(entry => entry.timestamp > cutoff);
  }

  public exportGraph(): any {
    return {
      nodes: Array.from(this.nodes.values()),
      relationships: Array.from(this.relationships.values()),
      metadata: {
        exportedAt: Date.now(),
        version: '1.0',
        nodeCount: this.nodes.size,
        relationshipCount: this.relationships.size
      }
    };
  }

  public importGraph(graphData: any): void {
    this.nodes.clear();
    this.relationships.clear();
    
    for (const node of graphData.nodes || []) {
      this.nodes.set(node.id, node);
    }
    
    for (const rel of graphData.relationships || []) {
      this.relationships.set(rel.id, rel);
    }
    
    this.emit('graphImported', { nodeCount: this.nodes.size, relationshipCount: this.relationships.size });
  }

  public dispose(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.removeAllListeners();
    this.nodes.clear();
    this.relationships.clear();
    this.auditTrail = [];
  }
}

export const knowledgeGraphService = new KnowledgeGraphService(); 