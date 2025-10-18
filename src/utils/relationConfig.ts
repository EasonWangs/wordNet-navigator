import type { RelationConfigMap } from '@/types/wordnet'

export const relationConfig: RelationConfigMap = {
  hypernym: {
    color: '#e74c3c',
    label: '上位词',
    lineStyle: 'solid',
  },
  hyponym: {
    color: '#3498db',
    label: '下位词',
    lineStyle: 'solid',
  },
  synonym: {
    color: '#2ecc71',
    label: '同义词',
    lineStyle: 'dashed',
  },
  antonym: {
    color: '#f39c12',
    label: '反义词',
    lineStyle: 'dotted',
  },
  meronym: {
    color: '#9b59b6',
    label: '部分词',
    lineStyle: 'solid',
  },
  holonym: {
    color: '#1abc9c',
    label: '整体词',
    lineStyle: 'solid',
  },
  compound: {
    color: '#e67e22',
    label: '复合词',
    lineStyle: 'dashed',
  },
}
