<template>
  <div class="weather-data-management">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>天气数据管理</span>
          <div class="toolbar">
            <el-button type="success" @click="openFetchDialog" :loading="fetchingWeather">
              获取启用景区天气
            </el-button>
            <el-button type="warning" @click="openAnalysisDialog">
              LLM 天气分析
            </el-button>
            <el-button @click="exportData">导出数据</el-button>
            <el-button @click="importDialogVisible = true">导入数据</el-button>
          </div>
        </div>
      </template>

      <div class="stats">
        <el-statistic title="数据条数" :value="weatherCount" />
        <el-statistic title="最后更新时间" :value="lastUpdateTime" :formatter="formatTime" />
      </div>

      <el-alert
        v-if="enabledScenicsCount > 0"
        type="info"
        :closable="false"
        style="margin: 16px 0"
      >
        <template #title>
          <span>当前有 <strong>{{ enabledScenicsCount }}</strong> 个启用景区，点击"获取启用景区天气"设置时间范围后获取数据</span>
        </template>
      </el-alert>

      <el-table :data="allWeatherData" border style="width: 100%; margin-top: 20px" max-height="500">
        <el-table-column prop="scenicId" label="景区 ID" width="100" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="午前天气" width="150">
          <template #default="{ row }">
            <WeatherCell :weather="row.morning" compact />
          </template>
        </el-table-column>
        <el-table-column label="午后天气" width="150">
          <template #default="{ row }">
            <WeatherCell :weather="row.afternoon" compact />
          </template>
        </el-table-column>
        <el-table-column prop="morning.temperature" label="温度范围" width="120">
          <template #default="{ row }">
            {{ row.morning.temperature }}°C ~ {{ row.afternoon.temperature }}°C
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row, $index }">
            <el-button size="small" type="danger" @click="deleteRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 获取天气数据对话框 -->
    <el-dialog
      v-model="showFetchDialog"
      title="获取天气数据"
      width="500px"
    >
      <el-form :model="fetchForm" label-width="100px">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="fetchForm.startDate"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="(date) => date.getTime() < Date.now() - 86400000"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="fetchForm.endDate"
            type="date"
            placeholder="选择结束日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :min-date="fetchForm.startDate"
          />
        </el-form-item>
        <el-form-item label="获取时段">
          <el-radio-group v-model="fetchForm.period">
            <el-radio label="both">全天（上午 + 下午）</el-radio>
            <el-radio label="morning">仅上午（6:00-12:00）</el-radio>
            <el-radio label="afternoon">仅下午（12:00-18:00）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <el-alert
        type="info"
        :closable="false"
        style="margin-top: 16px"
      >
        <template #title>
          <span>将为所有 <strong>{{ enabledScenicsCount }}</strong> 个启用的景区获取选定日期范围内的天气数据</span>
        </template>
      </el-alert>
      <template #footer>
        <el-button @click="showFetchDialog = false">取消</el-button>
        <el-button type="primary" @click="fetchEnabledScenicsWeather" :loading="fetchingWeather">
          开始获取
        </el-button>
      </template>
    </el-dialog>

    <!-- 获取进度对话框 -->
    <el-dialog
      v-model="showProgressDialog"
      title="获取进度"
      width="500px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div v-if="fetchProgress.loading" class="fetch-progress">
        <el-progress
          :percentage="fetchProgress.percent"
          :status="fetchProgress.status"
          :format="() => `${fetchProgress.successCount}成功 / ${fetchProgress.failCount}失败`"
        />
        <p class="fetch-status">{{ fetchProgress.currentText }}</p>
        <p class="fetch-detail" v-if="fetchProgress.currentScenic">
          正在处理：{{ fetchProgress.currentScenic }}
        </p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showProgressDialog = false" :disabled="fetchProgress.loading">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- LLM 分析对话框 -->
    <el-dialog
      v-model="showAnalysisDialog"
      title="LLM 天气分析"
      width="600px"
    >
      <div class="analysis-config">
        <el-alert
          title="分析说明"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <p>使用 LLM 分析天气数据，生成观景建议和特殊景观（云海、日出、佛光等）预测。</p>
          <p>需要在"配置"页面设置 LLM API 地址和模型。</p>
        </el-alert>

        <el-form :model="analysisForm" label-width="100px">
          <el-form-item label="分析景区">
            <el-select
              v-model="analysisForm.scenicIds"
              multiple
              placeholder="选择要分析的景区（留空则分析全部）"
              style="width: 100%"
            >
              <el-option
                v-for="scenic in scenicListWithWeather"
                :key="scenic.id"
                :label="scenic.name"
                :value="scenic.id"
              >
                {{ scenic.name }} ({{ scenic.weatherCount }}条数据)
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="analysisForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="分析时段">
            <el-radio-group v-model="analysisForm.period">
              <el-radio label="both">全天</el-radio>
              <el-radio label="morning">仅上午</el-radio>
              <el-radio label="afternoon">仅下午</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <div v-if="analysisProgress.loading" class="analysis-progress">
          <el-progress
            :percentage="analysisProgress.percent"
            :status="analysisProgress.status"
          />
          <p class="fetch-status">{{ analysisProgress.currentText }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAnalysisDialog = false" :disabled="analysisProgress.loading">取消</el-button>
        <el-button
          type="primary"
          @click="startAnalysis"
          :loading="analysisProgress.loading"
          :disabled="!canAnalyze"
        >
          开始分析
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入天气数据" width="500px">
      <el-input
        v-model="importJson"
        type="textarea"
        :rows="10"
        placeholder="粘贴 JSON 数据..."
      />
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useWeatherStore } from '@/stores/weather'
import { useScenicStore } from '@/stores/scenic'
import { useConfigStore } from '@/stores/config'
import { OpenMeteoApi } from '@/api/openMeteo'
import { getWeatherDescription } from '@/utils/weatherMapper'
import type { DailyWeather, WeatherPeriod } from '@/types/weather'
import WeatherCell from '@/components/weather/WeatherCell.vue'
import dayjs from 'dayjs'
import axios from 'axios'

const weatherStore = useWeatherStore()
const scenicStore = useScenicStore()
const configStore = useConfigStore()

const weatherCount = computed(() => weatherStore.weatherCount)
const lastUpdateTime = computed(() => weatherStore.lastUpdateTime)
const enabledScenicsCount = computed(() => scenicStore.enabledCount)

// 获取启用的景区列表（有天气数据的）
const scenicListWithWeather = computed(() => {
  const scenics = scenicStore.getEnabledScenics()
  return scenics.map(scenic => {
    const weathers = weatherStore.getScenicWeather(scenic.id)
    return {
      ...scenic,
      weatherCount: weathers.length
    }
  }).filter(s => s.weatherCount > 0)
})

const hasWeatherData = computed(() => weatherCount.value > 0)

const allWeatherData = computed(() => {
  const data: DailyWeather[] = []
  weatherStore.weatherDataMap.forEach((value) => {
    data.push(value)
  })
  return data.sort((a, b) => {
    if (a.scenicId !== b.scenicId) return a.scenicId.localeCompare(b.scenicId)
    return a.date.localeCompare(b.date)
  })
})

// 获取天气数据相关
const fetchingWeather = ref(false)
const showFetchDialog = ref(false)
const showProgressDialog = ref(false)

const fetchForm = ref({
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().add(6, 'day').format('YYYY-MM-DD'),
  period: 'both' as 'both' | 'morning' | 'afternoon'
})

const fetchProgress = ref({
  loading: false,
  current: 0,
  total: 0,
  percent: 0,
  status: '' as '' | 'exception',
  currentText: '',
  currentScenic: '',
  successCount: 0,
  failCount: 0
})

// 生成日期范围
function getDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  let current = dayjs(start)
  const endDate = dayjs(end)

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    dates.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }

  return dates
}

// 从 API 响应中提取时段天气数据
function extractPeriodWeather(
  hourlyData: any,
  date: string,
  period: 'morning' | 'afternoon'
): WeatherPeriod {
  const dateIndex = hourlyData.hourly.time.findIndex((t: string) => t.startsWith(date))
  const startIndex = dateIndex === -1 ? 0 : dateIndex

  // 上午 6-12 点，下午 12-18 点
  const hourStart = period === 'morning' ? 6 : 12
  const hourEnd = period === 'morning' ? 12 : 18

  const temperatures: number[] = []
  const weatherCodes: number[] = []
  const cloudCovers: number[] = []
  const humidities: number[] = []

  for (let h = hourStart; h < hourEnd; h++) {
    const idx = startIndex + h
    if (idx < hourlyData.hourly.time.length) {
      temperatures.push(hourlyData.hourly.temperature_2m[idx])
      weatherCodes.push(hourlyData.hourly.weather_code[idx])
      cloudCovers.push(hourlyData.hourly.cloud_cover[idx])
      humidities.push(hourlyData.hourly.relative_humidity_2m[idx])
    }
  }

  // 计算平均值
  const avgTemp = temperatures.length > 0
    ? Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length)
    : 0

  // 取主要的天气代码（出现次数最多的）
  const weatherCodeMap = new Map<number, number>()
  weatherCodes.forEach(code => {
    weatherCodeMap.set(code, (weatherCodeMap.get(code) || 0) + 1)
  })
  const mainWeatherCode = Array.from(weatherCodeMap.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 0

  const avgCloud = cloudCovers.length > 0
    ? Math.round(cloudCovers.reduce((a, b) => a + b, 0) / cloudCovers.length)
    : 0

  const avgHumidity = humidities.length > 0
    ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
    : 0

  // 获取天气描述
  const weatherDesc = getWeatherDescription(mainWeatherCode).cn

  return {
    temperature: avgTemp,
    weatherCode: mainWeatherCode,
    weatherDesc,
    cloudCover: avgCloud,
    humidity: avgHumidity
  }
}

// 打开获取对话框
function openFetchDialog() {
  if (enabledScenicsCount.value === 0) {
    ElMessage.warning('没有启用的景区，请先在景区管理中启用景区')
    return
  }
  showFetchDialog.value = true
}

// 获取所有启用景区的天气数据
async function fetchEnabledScenicsWeather() {
  const enabledScenics = scenicStore.getEnabledScenics()

  if (enabledScenics.length === 0) {
    ElMessage.warning('没有启用的景区，请先在景区管理中启用景区')
    return
  }

  // 验证日期范围
  if (!fetchForm.value.startDate || !fetchForm.value.endDate) {
    ElMessage.warning('请选择日期范围')
    return
  }

  showFetchDialog.value = false
  fetchingWeather.value = true
  showProgressDialog.value = true

  const dates = getDateRange(fetchForm.value.startDate, fetchForm.value.endDate)

  fetchProgress.value = {
    loading: true,
    current: 0,
    total: enabledScenics.length * dates.length,
    percent: 0,
    status: '',
    currentText: '准备获取数据...',
    currentScenic: '',
    successCount: 0,
    failCount: 0
  }

  const api = new OpenMeteoApi(configStore.config.openMeteo.baseUrl)

  try {
    for (const scenic of enabledScenics) {
      fetchProgress.value.currentScenic = scenic.name
      fetchProgress.value.currentText = `正在获取 ${scenic.name} 的天气数据...`

      try {
        const response = await api.getHourlyWeather(
          scenic.latitude,
          scenic.longitude,
          fetchForm.value.startDate,
          fetchForm.value.endDate
        )

        // 处理每一天的数据
        for (const date of dates) {
          let morning: WeatherPeriod | null = null
          let afternoon: WeatherPeriod | null = null

          if (fetchForm.value.period === 'both' || fetchForm.value.period === 'morning') {
            morning = extractPeriodWeather(response, date, 'morning')
          }

          if (fetchForm.value.period === 'both' || fetchForm.value.period === 'afternoon') {
            afternoon = extractPeriodWeather(response, date, 'afternoon')
          }

          if (morning && afternoon) {
            weatherStore.setWeather({
              scenicId: scenic.id,
              date,
              morning,
              afternoon
            })
            fetchProgress.value.successCount++
          } else if (morning || afternoon) {
            weatherStore.setWeather({
              scenicId: scenic.id,
              date,
              morning: morning || { ...afternoon! },
              afternoon: afternoon || { ...morning! }
            })
            fetchProgress.value.successCount++
          }

          fetchProgress.value.current++
          fetchProgress.value.percent = Math.round(
            (fetchProgress.value.current / fetchProgress.value.total) * 100
          )

          await new Promise(resolve => setTimeout(resolve, 50))
        }
      } catch (error) {
        console.error(`获取 ${scenic.name} 天气失败:`, error)
        fetchProgress.value.failCount++
        fetchProgress.value.current++
      }
    }

    fetchProgress.value.status = fetchProgress.value.failCount > 0 ? 'exception' : 'success'
    fetchProgress.value.loading = false
    fetchProgress.value.currentText = fetchProgress.value.failCount > 0
      ? `完成！成功 ${fetchProgress.value.successCount} 条，失败 ${fetchProgress.value.failCount} 条`
      : `获取完成！共 ${fetchProgress.value.successCount} 条数据`

    ElMessage.success(
      fetchProgress.value.failCount > 0
        ? `获取完成！成功 ${fetchProgress.value.successCount} 条，失败 ${fetchProgress.value.failCount} 条`
        : '获取完成！'
    )
  } catch (error) {
    console.error('获取天气数据失败:', error)
    fetchProgress.value.status = 'exception'
    fetchProgress.value.loading = false
    fetchProgress.value.currentText = '获取失败'
    ElMessage.error('获取天气数据失败')
  } finally {
    fetchingWeather.value = false
  }
}

// LLM 分析相关
const showAnalysisDialog = ref(false)
const analysisForm = ref({
  scenicIds: [] as string[],
  dateRange: [dayjs().format('YYYY-MM-DD'), dayjs().add(6, 'day').format('YYYY-MM-DD')] as [string, string],
  period: 'both' as 'both' | 'morning' | 'afternoon'
})

// 打开分析对话框
function openAnalysisDialog() {
  if (weatherCount.value === 0) {
    ElMessage.warning('暂无天气数据，请先获取天气数据')
    return
  }
  showAnalysisDialog.value = true
}

const analysisProgress = ref({
  loading: false,
  current: 0,
  total: 0,
  percent: 0,
  status: '' as '' | 'exception',
  currentText: ''
})

const canAnalyze = computed(() => {
  const ids = analysisForm.value.scenicIds.length > 0
    ? analysisForm.value.scenicIds
    : scenicListWithWeather.value.map(s => s.id)
  const dateRange = analysisForm.value.dateRange
  return ids.length > 0 && dateRange && dateRange[0] && dateRange[1]
})

// 构建分析提示词
function buildAnalysisPrompt(scenicName: string, weather: DailyWeather): string {
  const am = weather.morning
  const pm = weather.afternoon

  return `请分析以下景区天气数据，给出观景建议：

景区：${scenicName}
日期：${weather.date}

上午 (6:00-12:00):
- 天气：${am.weatherDesc} (代码：${am.weatherCode})
- 温度：${am.temperature}°C
- 云量：${am.cloudCover}%
- 湿度：${am.humidity}%

下午 (12:00-18:00):
- 天气：${pm.weatherDesc} (代码：${pm.weatherCode})
- 温度：${pm.temperature}°C
- 云量：${pm.cloudCover}%
- 湿度：${pm.humidity}%

请返回 JSON 格式，包含：
1. 推荐时段（morning/afternoon/both）
2. 特殊景观预测（云海/日出/佛光等，无则空数组）
3. 观景适宜度（优/良/中/差）
4. 简要建议（50 字以内）

只返回纯 JSON，不要其他内容。`
}

// 调用 LLM 分析
async function analyzeWithLLM(scenicName: string, weather: DailyWeather): Promise<any> {
  const config = configStore.config
  const url = `${config.llm.baseUrl.replace(/\/$/, '')}/v1/chat/completions`

  const prompt = buildAnalysisPrompt(scenicName, weather)

  try {
    const response = await axios.post(url, {
      model: config.llm.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的天气分析助手，返回纯 JSON 格式的分析结果。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(config.llm.apiKey ? { 'Authorization': `Bearer ${config.llm.apiKey}` } : {})
      },
      timeout: config.llm.timeout
    })

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('LLM 返回为空')
    }

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('LLM 分析失败:', error)
    throw error
  }
}

// 开始 LLM 分析
async function startAnalysis() {
  const scenicIds = analysisForm.value.scenicIds.length > 0
    ? analysisForm.value.scenicIds
    : scenicListWithWeather.value.map(s => s.id)

  if (scenicIds.length === 0) {
    ElMessage.warning('没有可分析的景区数据')
    return
  }

  const [startDate, endDate] = analysisForm.value.dateRange
  const dates = getDateRange(startDate, endDate)

  analysisProgress.value = {
    loading: true,
    current: 0,
    total: scenicIds.length * dates.length,
    percent: 0,
    status: '',
    currentText: '准备分析...'
  }

  let successCount = 0
  let failCount = 0

  try {
    for (const scenicId of scenicIds) {
      const scenic = scenicStore.getScenicById(scenicId)
      if (!scenic) continue

      for (const date of dates) {
        const weather = weatherStore.getWeather(scenicId, date)
        if (!weather) {
          analysisProgress.value.current++
          continue
        }

        analysisProgress.value.currentText = `正在分析 ${scenic.name} ${date}...`
        analysisProgress.value.percent = Math.round(
          (analysisProgress.value.current / analysisProgress.value.total) * 100
        )

        try {
          const result = await analyzeWithLLM(scenic.name, weather)

          // 更新天气数据中的分析结果（支持中英文字段名）
          if (result) {
            // 适配多种字段名
            const suitability = result['适宜度'] || result['suitability'] || result['recommended_suitability']
            const specialPredict = result['特殊景观预测'] || result['specialTypes'] ||
                                   result['special_scenery_prediction'] || result['special_weather'] || []
            const recommendedPeriod = result['推荐时段'] || result['recommended_period']
            const advice = result['简要建议'] || result['advice'] || result['brief_advice'] || result['suggestion']

            // 判断哪个时段需要更新
            const updateMorning = analysisForm.value.period === 'both' || analysisForm.value.period === 'morning'
            const updateAfternoon = analysisForm.value.period === 'both' || analysisForm.value.period === 'afternoon'

            // 根据推荐时段优先更新
            let preferMorning = true
            if (recommendedPeriod === 'morning') {
              preferMorning = true
            } else if (recommendedPeriod === 'afternoon') {
              preferMorning = false
            } else if (recommendedPeriod === 'both') {
              preferMorning = true // 都推荐时平均分配
            }

            if (suitability) {
              if (updateMorning && (preferMorning || !updateAfternoon)) {
                weather.morning.suitability = suitability
                weather.morning.recommendedPeriod = recommendedPeriod
                if (advice) weather.morning.advice = advice
              }
              if (updateAfternoon && (!preferMorning || !updateMorning)) {
                weather.afternoon.suitability = suitability
                weather.afternoon.recommendedPeriod = recommendedPeriod
                if (advice) weather.afternoon.advice = advice
              }
            }

            // 特殊景观预测
            if (Array.isArray(specialPredict) && specialPredict.length > 0) {
              const specialType = specialPredict[0]
              if (updateMorning) {
                weather.morning.isSpecial = true
                weather.morning.specialType = specialType
              }
              if (updateAfternoon) {
                weather.afternoon.isSpecial = true
                weather.afternoon.specialType = specialType
              }
            }

            weatherStore.setWeather(weather)
            successCount++
          }
        } catch (error) {
          console.error(`分析 ${scenic.name} ${date} 失败:`, error)
          failCount++
        }

        analysisProgress.value.current++
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    analysisProgress.value.status = failCount > 0 ? 'exception' : 'success'
    analysisProgress.value.loading = false
    analysisProgress.value.currentText = `分析完成！成功 ${successCount} 条，失败 ${failCount} 条`

    ElMessage.success(
      failCount > 0
        ? `分析完成！成功 ${successCount} 条，失败 ${failCount} 条`
        : '分析完成！'
    )
  } catch (error) {
    console.error('LLM 分析失败:', error)
    analysisProgress.value.status = 'exception'
    analysisProgress.value.loading = false
    analysisProgress.value.currentText = '分析失败'
    ElMessage.error('LLM 分析失败')
  }
}

// 导入导出相关
const importDialogVisible = ref(false)
const importJson = ref('')

const formatTime = (time: number | null) => {
  if (!time) return '无'
  return new Date(time).toLocaleString('zh-CN')
}

const exportData = () => {
  const json = weatherStore.exportToJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `weather-data-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const doImport = () => {
  if (!importJson.value.trim()) {
    ElMessage.warning('请输入 JSON 数据')
    return
  }

  const result = weatherStore.importFromJson(importJson.value)
  if (result.error) {
    ElMessage.error(result.error)
  } else {
    ElMessage.success(`成功导入 ${result.success} 条数据`)
    importDialogVisible.value = false
    importJson.value = ''
  }
}

const deleteRow = (index: number) => {
  const row = allWeatherData.value[index]
  const key = `${row.scenicId}_${row.date}`
  weatherStore.weatherDataMap.delete(key)
  weatherStore.lastUpdateTime = Date.now()
  ElMessage.success('删除成功')
}
</script>

<style lang="scss" scoped>
.weather-data-management {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .stats {
    display: flex;
    gap: 40px;
    padding: 20px 0;
  }

  .fetch-progress {
    .fetch-status {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 8px;
    }

    .fetch-detail {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 4px;
    }
  }

  .analysis-config {
    .analysis-progress {
      margin-top: 16px;

      .fetch-status {
        text-align: center;
        color: #666;
        font-size: 14px;
        margin-top: 8px;
      }
    }
  }
}
</style>
