import { defineStore } from 'pinia'
import { ref } from 'vue'

// SSR 环境下 localStorage 不可用
const isClient = typeof window !== 'undefined'

export interface PromptTemplate {
  id: string
  name: string
  description: string
  content: string
  updatedAt: number
}

// 默认提示词模板
const WEATHER_ANALYSIS_PROMPT = `你是一个景区天气预报和观景分析专家。请根据提供的天气数据，分析每个景区每天的观景窗口期。

## WMO 天气代码对照表
- 0: 晴朗
- 1: 主要晴朗
- 2: 多云
- 3: 阴天
- 45, 48: 雾
- 51-57: 毛毛雨
- 61-67: 雨
- 71-77: 雪
- 80-86: 阵雨/阵雪
- 95-99: 雷暴

## 输入数据格式
- 景区名称：{scenicName}
- 日期：{date}
- 午前天气数据（6:00-12:00）：温度、天气代码、云量、湿度
- 午后天气数据（12:00-18:00）：温度、天气代码、云量、湿度

## 分析任务
1. **常规天气判断**：根据 WMO 代码判断天气状况（晴、多云、阴、雨、雪等）
2. **特殊天气识别**（必须同时满足所有条件）：
   - 云海：天气代码 0-2（晴朗/多云）+ 云量 30-70% + 湿度>60%
   - 日出：午前时段 + 天气代码 0-1（晴朗）+ 云量<30%
   - 日落：午后时段 + 天气代码 0-1（晴朗）+ 云量<30%
   - 雾凇：温度≤0°C + 湿度>80% + 天气代码 0-3 或 45-48
   - 彩虹：雨（代码 61-67）后转晴（代码 0-2）
   - 佛光：云量 50-90% + 湿度>70% + 天气代码 0-2
3. **观景适宜度评级**：
   - 优：天气代码 0-2（晴朗/多云）+ 无降水
   - 良：天气代码 2-3（多云/阴）
   - 中：天气代码 45-57（雾/毛毛雨）
   - 差：天气代码 61+（雨/雪/雷暴）

## 输出格式要求
请严格按照以下 JSON 格式返回（不要包含 markdown 标记）：
{
  "date": "2026-06-22",
  "morning": {
    "weather": "晴",
    "isSpecial": false,
    "specialType": null,
    "suitability": "优"
  },
  "afternoon": {
    "weather": "多云",
    "isSpecial": false,
    "specialType": null,
    "suitability": "良"
  }
}

## 特殊天气判断规则（修正版）
- 云海：云量 30-70% + 湿度>60%（任何时段都可能出现，不限于清晨）
- 日出：晴朗 + 云量<30% + 午前时段
- 日落：晴朗 + 云量<30% + 午后时段
- 雾凇：温度≤0°C + 湿度>80%
- 彩虹：雨后转晴
- 佛光：云雾 + 阳光

## 注意事项
1. 必须返回有效的 JSON 格式，不能有额外的文字说明
2. weather 字段使用简体中文（晴、多云、阴、小雨、中雨、大雨、小雪、中雪、大雪、雾等）
3. isSpecial 为 true 时，specialType 填写具体类型名称（云海/日出/日落/雾凇/彩虹/佛光）
4. suitability 只能是：优、良、中、差

## 开始分析
景区：{scenicName}
日期：{date}
午前数据：温度{amTemp}°C, 天气代码{amCode}, 云量{amCloud}%, 湿度{amHumidity}%
午后数据：温度{pmTemp}°C, 天气代码{pmCode}, 云量{pmCloud}%, 湿度{pmHumidity}%`

const BATCH_ANALYSIS_PROMPT = `你是一个景区天气预报和观景分析专家。请分析以下多个景区的天气数据。

## 任务
分析每个景区每天的午前和午后天气，判断：
1. 常规天气状况
2. 是否有特殊天气现象（云海、日出、日落、雾凇、彩虹、佛光）
3. 观景适宜度（优/良/中/差）

## 输入数据
{weatherData}

## 输出格式
返回 JSON 数组，每个元素包含：
{
  "scenicId": "景区 ID",
  "scenicName": "景区名称",
  "date": "YYYY-MM-DD",
  "morning": {
    "weather": "天气描述",
    "isSpecial": true/false,
    "specialType": "类型或 null",
    "suitability": "优/良/中/差"
  },
  "afternoon": { ... }
}

## 特殊天气判断规则
- 云海：云量 30-70% + 湿度>60%（任何时段均可，不限于清晨）
- 日出：晴朗 + 云量<30% + 午前时段
- 日落：晴朗 + 云量<30% + 午后时段
- 雾凇：温度≤0°C + 湿度>80%
- 彩虹：雨后转晴
- 佛光：云雾 + 阳光

## 开始分析
请返回纯 JSON 数组：`

const defaultPrompts: PromptTemplate[] = [
  {
    id: 'weather_analysis',
    name: '天气分析提示词',
    description: '用于分析单个景区单日天气，判断特殊景观和观景适宜度',
    content: WEATHER_ANALYSIS_PROMPT,
    updatedAt: Date.now()
  },
  {
    id: 'batch_analysis',
    name: '批量分析提示词',
    description: '用于一次分析多个景区多天的天气数据',
    content: BATCH_ANALYSIS_PROMPT,
    updatedAt: Date.now()
  }
]

export const usePromptStore = defineStore('prompt', () => {
  const prompts = ref<PromptTemplate[]>([...defaultPrompts])

  // 获取提示词
  function getPrompt(id: string): PromptTemplate | undefined {
    return prompts.value.find(p => p.id === id)
  }

  // 更新提示词
  function updatePrompt(id: string, content: string, name?: string, description?: string): boolean {
    const prompt = prompts.value.find(p => p.id === id)
    if (!prompt) return false

    prompt.content = content
    if (name) prompt.name = name
    if (description) prompt.description = description
    prompt.updatedAt = Date.now()
    return true
  }

  // 重置为默认值
  function resetPrompt(id: string): boolean {
    const prompt = prompts.value.find(p => p.id === id)
    if (!prompt) return false

    const defaultPrompt = defaultPrompts.find(p => p.id === id)
    if (defaultPrompt) {
      prompt.content = defaultPrompt.content
      prompt.name = defaultPrompt.name
      prompt.description = defaultPrompt.description
      prompt.updatedAt = Date.now()
    }
    return true
  }

  // 重置所有提示词
  function resetAllPrompts() {
    prompts.value = [...defaultPrompts]
  }

  // 导出为 JSON
  function exportToJson(): string {
    return JSON.stringify(prompts.value, null, 2)
  }

  // 从 JSON 导入
  function importFromJson(json: string): { success: number; error?: string } {
    try {
      const data: PromptTemplate[] = JSON.parse(json)

      if (!Array.isArray(data)) {
        throw new Error('JSON 格式错误，应为数组')
      }

      let count = 0
      data.forEach(item => {
        if (item.id && item.content) {
          const existing = prompts.value.find(p => p.id === item.id)
          if (existing) {
            existing.content = item.content
            existing.name = item.name || existing.name
            existing.description = item.description || existing.description
            existing.updatedAt = Date.now()
            count++
          } else {
            prompts.value.push({
              ...item,
              updatedAt: Date.now()
            })
            count++
          }
        }
      })

      return { success: count }
    } catch (error) {
      return {
        success: 0,
        error: (error as Error).message
      }
    }
  }

  return {
    prompts,
    getPrompt,
    updatePrompt,
    resetPrompt,
    resetAllPrompts,
    exportToJson,
    importFromJson
  }
}, {
  persist: isClient ? [{
    key: 'scenic-weather-prompts',
    storage: localStorage
  }] : []
})
