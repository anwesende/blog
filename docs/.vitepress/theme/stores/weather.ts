import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyWeather, OfflineWeatherData } from '@/types/weather'

// SSR 环境下 localStorage 不可用
const isClient = typeof window !== 'undefined'

export const useWeatherStore = defineStore('weather', () => {
  // 天气数据存储 key: scenicId_date
  const weatherDataMap = ref<Map<string, DailyWeather>>(new Map())

  // 数据更新时间
  const lastUpdateTime = ref<number | null>(null)

  // 计算属性
  const weatherCount = computed(() => weatherDataMap.value.size)

  // 生成存储 key
  function makeKey(scenicId: string, date: string): string {
    return `${scenicId}_${date}`
  }

  // 解析存储 key
  function parseKey(key: string): { scenicId: string; date: string } {
    const parts = key.split('_')
    return {
      scenicId: parts[0],
      date: parts.slice(1).join('_') // 日期可能包含连字符
    }
  }

  // 设置单日天气
  function setWeather(weather: DailyWeather) {
    const key = makeKey(weather.scenicId, weather.date)
    weatherDataMap.value.set(key, weather)
    lastUpdateTime.value = Date.now()
  }

  // 批量设置天气
  function batchSetWeather(weathers: DailyWeather[]) {
    weathers.forEach(w => setWeather(w))
  }

  // 获取单日天气
  function getWeather(scenicId: string, date: string): DailyWeather | undefined {
    const key = makeKey(scenicId, date)
    return weatherDataMap.value.get(key)
  }

  // 获取景区所有天气
  function getScenicWeather(scenicId: string): DailyWeather[] {
    const results: DailyWeather[] = []
    weatherDataMap.value.forEach((weather, key) => {
      const parsed = parseKey(key)
      if (parsed.scenicId === scenicId) {
        results.push(weather)
      }
    })
    return results.sort((a, b) => a.date.localeCompare(b.date))
  }

  // 获取日期范围内的天气
  function getWeatherByDateRange(
    scenicId: string,
    startDate: string,
    endDate: string
  ): DailyWeather[] {
    const results: DailyWeather[] = []
    weatherDataMap.value.forEach((weather, key) => {
      const parsed = parseKey(key)
      if (
        parsed.scenicId === scenicId &&
        parsed.date >= startDate &&
        parsed.date <= endDate
      ) {
        results.push(weather)
      }
    })
    return results.sort((a, b) => a.date.localeCompare(b.date))
  }

  // 删除指定景区的天气
  function deleteScenicWeather(scenicId: string): number {
    let count = 0
    weatherDataMap.value.forEach((_, key) => {
      const parsed = parseKey(key)
      if (parsed.scenicId === scenicId) {
        weatherDataMap.value.delete(key)
        count++
      }
    })
    if (count > 0) {
      lastUpdateTime.value = Date.now()
    }
    return count
  }

  // 删除指定日期的天气
  function deleteByDate(date: string): number {
    let count = 0
    weatherDataMap.value.forEach((_, key) => {
      const parsed = parseKey(key)
      if (parsed.date === date) {
        weatherDataMap.value.delete(key)
        count++
      }
    })
    if (count > 0) {
      lastUpdateTime.value = Date.now()
    }
    return count
  }

  // 清空所有天气
  function clearAll() {
    weatherDataMap.value = new Map()
    lastUpdateTime.value = null
  }

  // 导出为 JSON
  function exportToJson(): string {
    const data: OfflineWeatherData = {
      downloadTime: lastUpdateTime.value || Date.now(),
      dateRange: {
        start: '',
        end: ''
      },
      data: Array.from(weatherDataMap.value.values()).sort((a, b) => {
        if (a.scenicId !== b.scenicId) return a.scenicId.localeCompare(b.scenicId)
        return a.date.localeCompare(b.date)
      })
    }

    // 计算日期范围
    if (data.data.length > 0) {
      data.dateRange.start = data.data[0].date
      data.dateRange.end = data.data[data.data.length - 1].date
    }

    return JSON.stringify(data, null, 2)
  }

  // 从 JSON 导入
  function importFromJson(json: string): { success: number; error?: string } {
    try {
      const data: OfflineWeatherData = JSON.parse(json)

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('JSON 格式错误，缺少 data 数组')
      }

      batchSetWeather(data.data)
      return { success: data.data.length }
    } catch (error) {
      return {
        success: 0,
        error: (error as Error).message
      }
    }
  }

  // 检查是否有指定日期范围的天气数据
  function hasWeatherData(
    scenicId: string,
    startDate: string,
    endDate: string
  ): boolean {
    const weathers = getWeatherByDateRange(scenicId, startDate, endDate)
    return weathers.length > 0
  }

  return {
    weatherDataMap,
    weatherCount,
    lastUpdateTime,
    setWeather,
    batchSetWeather,
    getWeather,
    getScenicWeather,
    getWeatherByDateRange,
    deleteScenicWeather,
    deleteByDate,
    clearAll,
    exportToJson,
    importFromJson,
    hasWeatherData
  }
}, {
  persist: isClient ? [{
    key: 'scenic-weather-data',
    storage: localStorage,
    // 使用 serializer 处理 Map 类型
    serializer: {
      serialize: (value) => {
        const map = new Map(value.weatherDataMap)
        return JSON.stringify({
          ...value,
          weatherDataMap: Array.from(map.entries())
        })
      },
      deserialize: (value) => {
        const parsed = JSON.parse(value)
        return {
          ...parsed,
          weatherDataMap: new Map(parsed.weatherDataMap)
        }
      }
    }
  }] : []
})
