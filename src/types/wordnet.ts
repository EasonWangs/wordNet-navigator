// WordNet data types

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb'

export type RelationType =
  | 'hypernym'    // 上位词
  | 'hyponym'     // 下位词
  | 'synonym'     // 同义词
  | 'antonym'     // 反义词
  | 'meronym'     // 部分词
  | 'holonym'     // 整体词

export interface WordNode {
  id: string
  label: string
  pos: PartOfSpeech
  definition?: string
  examples?: string[]
}

export interface WordEdge {
  source: string
  target: string
  relation: RelationType
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
