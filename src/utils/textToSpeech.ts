/**
 * Text-to-Speech Service using Web Speech API
 * 基于浏览器原生 Web Speech API 的文本转语音服务
 */

export interface TTSOptions {
  lang?: string // 语言代码，如 'en-US', 'zh-CN'
  rate?: number // 语速 (0.1 - 10)，默认 1
  pitch?: number // 音调 (0 - 2)，默认 1
  volume?: number // 音量 (0 - 1)，默认 1
}

export class TextToSpeechService {
  private synth: SpeechSynthesis
  private voices: SpeechSynthesisVoice[] = []
  private voicesLoaded = false

  constructor() {
    if (!('speechSynthesis' in window)) {
      throw new Error('浏览器不支持 Web Speech API')
    }
    this.synth = window.speechSynthesis
    this.loadVoices()
  }

  /**
   * 加载可用的语音列表
   */
  private loadVoices() {
    const loadVoicesList = () => {
      this.voices = this.synth.getVoices()
      this.voicesLoaded = this.voices.length > 0
    }

    loadVoicesList()

    // Safari 等浏览器需要监听 voiceschanged 事件
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoicesList
    }
  }

  /**
   * 等待语音列表加载完成
   */
  private async waitForVoices(): Promise<void> {
    if (this.voicesLoaded) return

    return new Promise((resolve) => {
      let attempts = 0
      const maxAttempts = 10

      const checkVoices = () => {
        this.voices = this.synth.getVoices()
        this.voicesLoaded = this.voices.length > 0

        if (this.voicesLoaded) {
          resolve()
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(checkVoices, 100)
        } else {
          // 超时也继续，使用默认语音
          resolve()
        }
      }

      checkVoices()
    })
  }

  /**
   * 朗读文本
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    // 等待语音列表加载
    await this.waitForVoices()

    // 先停止当前朗读并等待一下
    this.stop()

    // 等待一小段时间确保 cancel 完成
    await new Promise(resolve => setTimeout(resolve, 100))

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)

      // 设置参数
      utterance.lang = options.lang || 'en-US'
      utterance.rate = options.rate || 1
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume !== undefined ? options.volume : 1

      // 设置声音（如果指定）
      if (this.voices.length > 0) {
        // 尝试找到匹配语言的声音
        const matchedVoice = this.voices.find(voice => voice.lang.startsWith(utterance.lang.split('-')[0]))
        if (matchedVoice) {
          utterance.voice = matchedVoice
        }
      }

      // 事件监听
      utterance.onend = () => {
        resolve()
      }

      utterance.onerror = (event) => {
        // 忽略 canceled 错误（这是正常的停止操作）
        if (event.error === 'canceled') {
          resolve()
          return
        }
        console.error('TTS Error:', event)
        reject(new Error(`TTS error: ${event.error}`))
      }

      // 开始朗读
      this.synth.speak(utterance)
    })
  }

  /**
   * 停止朗读
   */
  stop() {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  /**
   * 检测文本语言并返回合适的语言代码
   */
  detectLanguage(text: string): string {
    // 检测是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(text)) {
      return 'zh-CN'
    }
    // 检测是否包含日文字符
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja-JP'
    }
    // 检测是否包含韩文字符
    if (/[\uac00-\ud7af]/.test(text)) {
      return 'ko-KR'
    }
    // 默认英语
    return 'en-US'
  }

  /**
   * 智能朗读（自动检测语言）
   */
  async smartSpeak(text: string, options: Omit<TTSOptions, 'lang'> = {}): Promise<void> {
    const lang = this.detectLanguage(text)
    return this.speak(text, { ...options, lang })
  }
}

// 创建单例实例
export const ttsService = new TextToSpeechService()

// 工具函数：检查浏览器是否支持 TTS
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window
}
