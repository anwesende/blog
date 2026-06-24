<template>
  <div class="weather-report">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>天气预报报表</span>
          <div class="toolbar">
            <el-select v-model="selectedScenicId" placeholder="选择景区" style="width: 200px; margin-right: 12px">
              <el-option
                v-for="scenic in scenicList"
                :key="scenic.id"
                :label="scenic.name"
                :value="scenic.id"
              />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px; margin-right: 12px"
              @change="loadWeatherData"
            />
            <el-button type="primary" @click="loadWeatherData">刷新</el-button>
          </div>
        </div>
      </template>

      <div v-loading="isLoading">
        <el-table
          v-if="weatherData.length > 0"
          :data="weatherData"
          border
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column label="日期" width="140" fixed>
            <template #default="{ row }">
              <div class="date-cell">
                <div>{{ row.date }}</div>
                <div class="weekday">{{ getWeekday(row.date) }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="午前 (6:00-12:00)" align="center">
            <el-table-column label="天气" width="120">
              <template #default="{ row }">
                <WeatherCell :weather="row.morning" compact />
              </template>
            </el-table-column>
            <el-table-column prop="morning.temperature" label="温度" width="80">
              <template #default="{ row }">
                {{ row.morning.temperature }}°C
              </template>
            </el-table-column>
            <el-table-column prop="morning.humidity" label="湿度" width="70">
              <template #default="{ row }">
                {{ row.morning.humidity }}%
              </template>
            </el-table-column>
            <el-table-column prop="morning.cloudCover" label="云量" width="70">
              <template #default="{ row }">
                {{ row.morning.cloudCover }}%
              </template>
            </el-table-column>
          </el-table-column>

          <el-table-column label="午后 (12:00-18:00)" align="center">
            <el-table-column label="天气" width="120">
              <template #default="{ row }">
                <WeatherCell :weather="row.afternoon" compact />
              </template>
            </el-table-column>
            <el-table-column prop="afternoon.temperature" label="温度" width="80">
              <template #default="{ row }">
                {{ row.afternoon.temperature }}°C
              </template>
            </el-table-column>
            <el-table-column prop="afternoon.humidity" label="湿度" width="70">
              <template #default="{ row }">
                {{ row.afternoon.humidity }}%
              </template>
            </el-table-column>
            <el-table-column prop="afternoon.cloudCover" label="云量" width="70">
              <template #default="{ row }">
                {{ row.afternoon.cloudCover }}%
              </template>
            </el-table-column>
          </el-table-column>

          <el-table-column label="观景建议" min-width="150">
            <template #default="{ row }">
              <div class="viewing-suggestion">
                <span v-if="getBestViewingPeriod(row)" :class="['period-tag', getBestViewingPeriod(row)]">
                  {{ getBestViewingPeriod(row) === 'morning' ? '推荐上午' : '推荐下午' }}
                </span>
                <span class="suggestion-text">{{ getSuggestion(row) }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-else description="暂无天气数据，请选择景区并加载数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import { useScenicStore } from '@/stores/scenic'
import type { DailyWeather } from '@/types/weather'
import WeatherCell from '@/components/weather/WeatherCell.vue'

const weatherStore = useWeatherStore()
const scenicStore = useScenicStore()

const scenicList = computed(() => scenicStore.getEnabledScenics())

const selectedScenicId = ref('1')
const dateRange = ref<[Date, Date] | null>(null)
const isLoading = ref(false)
const weatherData = ref<DailyWeather[]>([])

// 初始化日期范围为未来 7 天
const initDateRange = () => {
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + 7)
  dateRange.value = [today, endDate]
}

// 加载天气数据
const loadWeatherData = () => {
  if (!selectedScenicId.value || !dateRange.value) return

  isLoading.value = true

  // 从 store 中获取实际天气数据
  setTimeout(() => {
    const [start, end] = dateRange.value!
    const startDate = start.toISOString().split('T')[0]
    const endDate = end.toISOString().split('T')[0]

    const data = weatherStore.getWeatherByDateRange(selectedScenicId.value, startDate, endDate)
    weatherData.value = data
    isLoading.value = false
  }, 300)
}

// 获取最佳观景时段
const getBestViewingPeriod = (row: DailyWeather): 'morning' | 'afternoon' | null => {
  const morningScore = calculateViewingScore(row.morning)
  const afternoonScore = calculateViewingScore(row.afternoon)

  if (morningScore > afternoonScore) return 'morning'
  if (afternoonScore > morningScore) return 'afternoon'
  return null
}

// 计算观景评分
const calculateViewingScore = (weather: any): number => {
  let score = 50

  // 云量评分（20-40% 最佳）
  if (weather.cloudCover >= 20 && weather.cloudCover <= 40) score += 30
  else if (weather.cloudCover < 20 || weather.cloudCover <= 60) score += 15

  // 湿度评分（40-60% 最佳）
  if (weather.humidity >= 40 && weather.humidity <= 60) score += 20
  else if (weather.humidity < 40 || weather.humidity <= 70) score += 10

  // 适宜度评分
  if (weather.suitability === '优') score += 30
  else if (weather.suitability === '良') score += 20
  else if (weather.suitability === '中') score += 10

  return score
}

// 获取观景建议
const getSuggestion = (row: DailyWeather): string => {
  const bestPeriod = getBestViewingPeriod(row)
  if (!bestPeriod) return '全天适宜观景'

  const period = bestPeriod === 'morning' ? row.morning : row.afternoon
  const suggestions: string[] = []

  if (period.cloudCover! < 30) {
    suggestions.push('云量较少')
  } else if (period.cloudCover! > 70) {
    suggestions.push('云量较多，可能影响视野')
  }

  if (period.humidity! > 70) {
    suggestions.push('湿度较大，注意防潮')
  }

  if (period.suitability === '优') {
    suggestions.push('观景条件极佳')
  }

  return suggestions.join('；') || '适宜观景'
}

// 获取星期
const getWeekday = (dateStr: string): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(dateStr)
  return weekdays[date.getDay()]
}

onMounted(() => {
  initDateRange()
  loadWeatherData()
})
</script>

<style lang="scss" scoped>
.weather-report {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
  }

  .viewing-suggestion {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .period-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;

      &.morning {
        background-color: #e6f7ff;
        color: #1890ff;
      }

      &.afternoon {
        background-color: #fff7e6;
        color: #fa8c16;
      }
    }

    .suggestion-text {
      color: #666;
      font-size: 12px;
    }
  }

  .date-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .weekday {
      color: #999;
      font-size: 11px;
    }
  }
}
</style>
