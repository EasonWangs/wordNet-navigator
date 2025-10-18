import type { WordNode, PosDefinitionPair } from '@/types/wordnet'

/**
 * 数据迁移工具：将旧格式的词汇数据转换为新格式
 * 旧格式：{ pos: string|string[], definition: string }
 * 新格式：{ posDefinitions: [{pos, definition}, ...] }
 */
export function migrateWordData(word: WordNode): WordNode {
  // 如果已经是新格式，直接返回
  if (word.posDefinitions && word.posDefinitions.length > 0) {
    return word
  }

  // 如果没有词性定义，返回空的posDefinitions
  return {
    ...word,
    posDefinitions: [],
  }
}

/**
 * 获取词汇的所有词性（数组形式）
 */
export function getWordPosList(word: WordNode): string[] {
  if (word.posDefinitions && word.posDefinitions.length > 0) {
    return word.posDefinitions
      .map(pd => pd.pos)
      .filter((pos): pos is string => !!pos)
  }

  return []
}

/**
 * 获取词汇的主要定义（第一个定义）
 */
export function getPrimaryDefinition(word: WordNode): string | undefined {
  if (word.posDefinitions && word.posDefinitions.length > 0) {
    return word.posDefinitions[0].definition
  }

  return undefined
}

/**
 * 检查词汇是否有任何词性
 */
export function hasAnyPos(word: WordNode): boolean {
  return getWordPosList(word).length > 0
}

/**
 * 格式化词性-定义对用于显示
 */
export function formatPosDefinitionPairs(
  posDefinitions: PosDefinitionPair[] | undefined,
  posTypes: Array<{ key: string; label: string; abbreviation?: string }>
): Array<{ posLabel: string; definition: string }> {
  if (!posDefinitions || posDefinitions.length === 0) {
    return []
  }

  return posDefinitions
    .filter(pd => pd.pos || pd.definition) // 过滤掉完全空的对
    .map(pd => {
      let posLabel = '-'
      if (pd.pos) {
        const posType = posTypes.find(pt => pt.key === pd.pos)
        if (posType) {
          posLabel = posType.abbreviation
            ? `${posType.label} (${posType.abbreviation})`
            : posType.label
        } else {
          posLabel = pd.pos
        }
      }

      return {
        posLabel,
        definition: pd.definition || '-',
      }
    })
}
