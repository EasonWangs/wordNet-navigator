// WordNet data types

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb'

export type RelationType =
  | 'hypernym'    // 上位词
  | 'hyponym'     // 下位词
  | 'synonym'     // 同义词
  | 'antonym'     // 反义词
  | 'meronym'     // 部分词
  | 'holonym'     // 整体词
  | 'compound'    // 复合词
  | 'graphonyms'  // 相似词

// 词性-定义对：词性和定义成对出现（都是可选的）
export interface PosDefinitionPair {
  pos?: string  // 词性 key（可选）
  definition?: string  // 该词性的定义（可选）
}

export interface WordNode {
  id: string
  label: string
  phonetic?: string  // 音标，如 /dɒg/ 或 /dɔːg/

  // 新结构：词性-定义对数组
  posDefinitions?: PosDefinitionPair[]

  // 例句独立存在，不绑定到特定词性
  examples?: string[]

  // ===== 向后兼容旧结构（已废弃，仅用于数据迁移） =====
  pos?: PartOfSpeech | PartOfSpeech[]
  definition?: string
}

export interface WordEdge {
  source: string
  target: string
  relation: string  // 改为 string 以支持自定义关系类型
}

export interface GraphData {
  nodes: Array<{ data: WordNode }>
  edges: Array<{ data: WordEdge }>
}

export interface CytoscapeNode {
  data: WordNode
}

export interface CytoscapeEdge {
  data: WordEdge
}

// Relation display configuration
export interface RelationConfig {
  color: string
  label: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
}

export type RelationConfigMap = Record<RelationType, RelationConfig>

// Layout types supported by Cytoscape
export type LayoutType = 'cose' | 'circle' | 'grid' | 'breadthfirst'
