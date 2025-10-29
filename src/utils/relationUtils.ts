import { storageService } from '@/services/storageService'
import type { StoredRelationType } from '@/services/storageService'

/**
 * 关系类型工具函数
 */

// 缓存关系类型配置，避免重复读取
let cachedRelationTypes: StoredRelationType[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 1000 // 缓存1秒

/**
 * 获取关系类型配置（带缓存）
 */
export function getRelationTypes(forceRefresh = false): StoredRelationType[] {
  const now = Date.now()

  if (forceRefresh || !cachedRelationTypes || (now - cacheTimestamp) > CACHE_TTL) {
    cachedRelationTypes = storageService.getRelationTypes()
    cacheTimestamp = now
  }

  return cachedRelationTypes
}

/**
 * 清除关系类型缓存（在修改关系类型后调用）
 */
export function clearRelationTypesCache() {
  cachedRelationTypes = null
  cacheTimestamp = 0
}

/**
 * 检查是否为对称关系（自己配对自己）
 */
export function isSymmetricRelation(relationKey: string, relationTypes?: StoredRelationType[]): boolean {
  const types = relationTypes || getRelationTypes()
  const relationType = types.find(rt => rt.key === relationKey)
  return relationType?.pairWith === relationKey
}

/**
 * 获取所有对称关系类型的集合
 */
export function getSymmetricRelationTypes(relationTypes?: StoredRelationType[]): Set<string> {
  const types = relationTypes || getRelationTypes()
  const symmetricTypes = new Set<string>()

  types.forEach(rt => {
    if (rt.pairWith === rt.key) {
      symmetricTypes.add(rt.key)
    }
  })

  return symmetricTypes
}

/**
 * 对称关系边的标准化（确保 source < target）
 * 返回 null 表示应该跳过这条边
 */
export function normalizeSymmetricEdge(
  source: string,
  target: string,
  relation: string,
  relationTypes?: StoredRelationType[]
): { source: string; target: string } | null {
  if (!isSymmetricRelation(relation, relationTypes)) {
    // 非对称关系，保持原样
    return { source, target }
  }

  // 对称关系，只保留 source < target 的方向
  if (source < target) {
    return { source, target }
  } else if (source > target) {
    return null // 跳过这个方向
  } else {
    // source === target（自环），保留
    return { source, target }
  }
}
