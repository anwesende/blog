import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ScenicSpot } from '@/types/weather'

// SSR 环境下 localStorage 不可用
const isClient = typeof window !== 'undefined'

// 默认景区数据
const defaultScenics: ScenicSpot[] = [
  {
    id: '1',
    name: '黄山风景区',
    province: '安徽省',
    city: '黄山市',
    latitude: 30.1372,
    longitude: 118.1542,
    elevation: 1864,
    enabled: true
  },
  {
    id: '2',
    name: '武功山风景区',
    province: '江西省',
    city: '萍乡市',
    latitude: 27.4521,
    longitude: 114.1785,
    elevation: 1918,
    enabled: true
  }
]

export const useScenicStore = defineStore('scenic', () => {
  const scenicList = ref<ScenicSpot[]>([...defaultScenics])

  // 计算属性
  const scenicCount = computed(() => scenicList.value.length)
  const enabledCount = computed(() => scenicList.value.filter(s => s.enabled !== false).length)

  // 根据 ID 获取景区
  function getScenicById(id: string): ScenicSpot | undefined {
    return scenicList.value.find(s => s.id === id)
  }

  // 添加景区
  function addScenic(scenic: ScenicSpot): void {
    scenicList.value.push({ ...scenic, enabled: scenic.enabled !== false })
  }

  // 更新景区
  function updateScenic(id: string, scenic: Partial<ScenicSpot>): boolean {
    const index = scenicList.value.findIndex(s => s.id === id)
    if (index === -1) return false
    scenicList.value[index] = { ...scenicList.value[index], ...scenic }
    return true
  }

  // 删除景区
  function deleteScenic(id: string): boolean {
    const index = scenicList.value.findIndex(s => s.id === id)
    if (index === -1) return false
    scenicList.value.splice(index, 1)
    return true
  }

  // 批量删除景区
  function batchDeleteScenics(ids: string[]): number {
    let count = 0
    ids.forEach(id => {
      if (deleteScenic(id)) count++
    })
    return count
  }

  // 切换景区启用状态
  function toggleScenicEnabled(id: string): boolean {
    const scenic = getScenicById(id)
    if (!scenic) return false
    scenic.enabled = !scenic.enabled
    return true
  }

  // 批量启用/禁用景区
  function batchToggleScenics(ids: string[], enabled: boolean): number {
    let count = 0
    ids.forEach(id => {
      const scenic = getScenicById(id)
      if (scenic) {
        scenic.enabled = enabled
        count++
      }
    })
    return count
  }

  // 获取启用的景区列表
  function getEnabledScenics(): ScenicSpot[] {
    return scenicList.value.filter(s => s.enabled !== false)
  }

  // 批量导入景区
  function importScenics(scenics: ScenicSpot[]): number {
    let count = 0
    scenics.forEach(s => {
      if (!getScenicById(s.id)) {
        scenicList.value.push({ ...s, enabled: s.enabled !== false })
        count++
      }
    })
    return count
  }

  // 导出为 JSON
  function exportToJson(): string {
    return JSON.stringify(scenicList.value, null, 2)
  }

  // 清空所有景区（保留默认）
  function resetToDefaults(): void {
    scenicList.value = [...defaultScenics]
  }

  // 完全清空所有景区
  function clearAll(): void {
    scenicList.value = []
  }

  return {
    scenicList,
    scenicCount,
    enabledCount,
    getScenicById,
    getEnabledScenics,
    addScenic,
    updateScenic,
    deleteScenic,
    batchDeleteScenics,
    toggleScenicEnabled,
    batchToggleScenics,
    importScenics,
    exportToJson,
    resetToDefaults,
    clearAll
  }
}, {
  persist: isClient ? [{
    key: 'scenic-weather-scenics',
    storage: localStorage
  }] : []
})
