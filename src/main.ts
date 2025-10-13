import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/index.css'
import { storageService } from './services/storageService'
import { mockGraphData } from './services/wordnetService'

// 初始化应用数据
if (!storageService.isInitialized()) {
  console.log('首次启动，正在初始化 Mock 数据到 LocalStorage...')
  storageService.initializeMockData(mockGraphData)
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#root')
