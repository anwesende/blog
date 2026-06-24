import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppConfig, SpecialWeatherHighlight } from '@/types/weather'

// SSR 环境下 localStorage 不可用
const isClient = typeof window !== 'undefined'

const defaultConfig: AppConfig = {
  llm: {
    baseUrl: 'http://localhost:8080',
    model: 'qwen2.5-7b',
    apiKey: '',
    timeout: 120000
  },
  openMeteo: {
    baseUrl: 'https://api.open-meteo.com'
  },
  report: {
    defaultDays: 7,
    hourlyRange: [6, 18]
  },
  highlight: {
    specialWeather: [
      {
        type: '云海',
        keywords: ['云海', 'cloud sea', 'cloudsea'],
        color: '#FFD700',
        icon: '🌟'
      },
      {
        type: '日出',
        keywords: ['日出', 'sunrise', '朝阳'],
        color: '#FF6B35',
        icon: '🌅'
      },
      {
        type: '日落',
        keywords: ['日落', 'sunset', '夕阳'],
        color: '#FF8C42',
        icon: '🌇'
      },
      {
        type: '雾凇',
        keywords: ['雾凇', 'rime', 'ice'],
        color: '#E8F4F8',
        icon: '❄️'
      },
      {
        type: '彩虹',
        keywords: ['彩虹', 'rainbow'],
        color: '#FF69B4',
        icon: '🌈'
      },
      {
        type: '佛光',
        keywords: ['佛光', 'buddha light', 'glory'],
        color: '#FFD700',
        icon: '✨'
      }
    ],
    suitability: {
      '优': '#52C41A',
      '良': '#1890FF',
      '中': '#FAAD14',
      '差': '#F5222D'
    }
  },
  prompts: {
    weatherAnalysis: ''
  }
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<AppConfig>({ ...defaultConfig })

  function updateConfig(newConfig: Partial<AppConfig>) {
    config.value = { ...config.value, ...newConfig }
  }

  function resetConfig() {
    config.value = { ...defaultConfig }
  }

  return {
    config,
    updateConfig,
    resetConfig
  }
}, {
  persist: isClient ? [{
    key: 'scenic-weather-config',
    storage: localStorage
  }] : []
})
