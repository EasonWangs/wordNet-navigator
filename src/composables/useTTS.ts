/**
 * Vue Composable for Text-to-Speech
 * 文本转语音的 Vue 组合式函数
 */

import { ref, onUnmounted } from 'vue'
import { ttsService, type TTSOptions } from '@/utils/textToSpeech'

export function useTTS() {
  const isSpeaking = ref(false)
  const error = ref<string | null>(null)
  const isSupported = ref('speechSynthesis' in window)

  /**
   * 智能朗读（自动检测语言）
   */
  const smartSpeak = async (text: string, options?: Omit<TTSOptions, 'lang'>) => {
    if (!text.trim()) return

    try {
      error.value = null
      isSpeaking.value = true
      await ttsService.smartSpeak(text, options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '朗读失败'
      console.error('TTS error:', err)
    } finally {
      isSpeaking.value = false
    }
  }

  /**
   * 停止朗读
   */
  const stop = () => {
    ttsService.stop()
    isSpeaking.value = false
  }

  // 组件卸载时停止朗读
  onUnmounted(() => {
    stop()
  })

  return {
    // 状态
    isSpeaking,
    error,
    isSupported,

    // 方法
    smartSpeak,
    stop,
  }
}
