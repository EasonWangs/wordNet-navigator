/**
 * 搜索历史管理工具
 */

const SEARCH_HISTORY_KEY = 'wordnet_search_history'
const MAX_HISTORY_ITEMS = 10

export interface SearchHistoryItem {
  word: string
  timestamp: number
}

/**
 * 获取搜索历史
 */
export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const data = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!data) return []
    const history = JSON.parse(data) as SearchHistoryItem[]
    return history.slice(0, MAX_HISTORY_ITEMS)
  } catch (error) {
    console.error('Failed to load search history:', error)
    return []
  }
}

/**
 * 添加搜索记录
 */
export function addSearchHistory(word: string): void {
  if (!word || word.trim() === '' || word === '*') {
    return // 不保存空搜索和全部搜索
  }

  const trimmedWord = word.trim()
  const history = getSearchHistory()

  // 移除已存在的相同词汇（去重）
  const filteredHistory = history.filter(item => item.word !== trimmedWord)

  // 添加到开头
  const newHistory: SearchHistoryItem[] = [
    { word: trimmedWord, timestamp: Date.now() },
    ...filteredHistory
  ].slice(0, MAX_HISTORY_ITEMS)

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

/**
 * 清空搜索历史
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.error('Failed to clear search history:', error)
  }
}

/**
 * 删除指定的搜索记录
 */
export function removeSearchHistoryItem(word: string): void {
  const history = getSearchHistory()
  const filteredHistory = history.filter(item => item.word !== word)

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory))
  } catch (error) {
    console.error('Failed to remove search history item:', error)
  }
}
