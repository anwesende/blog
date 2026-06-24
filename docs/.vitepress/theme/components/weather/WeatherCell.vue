<template>
  <div v-if="weather" :class="['weather-cell', { compact }]">
    <!-- 常规天气 -->
    <div v-if="!weather.isSpecial" class="weather-normal">
      <span class="weather-icon">{{ weatherEmoji }}</span>
      <span class="weather-desc">{{ weather.weatherDesc }}</span>
      <span v-if="weather.suitability" :class="['suitability-tag', suitabilityClass]">
        {{ weather.suitability }}
      </span>
    </div>

    <!-- 特殊天气高亮 -->
    <div v-else :class="['weather-special', specialClass]">
      <span class="weather-icon">{{ specialIcon }}</span>
      <span class="weather-desc">{{ weather.specialType }}</span>
      <span v-if="weather.suitability" :class="['suitability-tag', suitabilityClass]">
        {{ weather.suitability }}
      </span>
    </div>

    <!-- 温度（可选显示） -->
    <div v-if="!compact && weather.temperature !== undefined" class="weather-temp">
      {{ weather.temperature }}°C
    </div>
  </div>
  <div v-else class="weather-empty">
    <span>无数据</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherPeriod } from '@/types/weather'
import { getWeatherEmoji } from '@/utils/weatherMapper'
import { useConfigStore } from '@/stores/config'

interface Props {
  weather: WeatherPeriod | null
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const configStore = useConfigStore()

// 天气 emoji
const weatherEmoji = computed(() => {
  if (!props.weather) return ''
  return getWeatherEmoji(props.weather.weatherCode)
})

// 特殊天气类型和样式
const specialClass = computed(() => {
  if (!props.weather?.specialType) return ''

  const type = props.weather.specialType.toLowerCase()
  const config = configStore.config.highlight.specialWeather.find(s =>
    s.type.toLowerCase().includes(type) || type.includes(s.type.toLowerCase())
  )

  if (config) {
    return `weather-${config.type}`
  }

  return ''
})

// 特殊天气图标
const specialIcon = computed(() => {
  if (!props.weather?.specialType) return ''

  const config = configStore.config.highlight.specialWeather.find(s =>
    s.type === props.weather!.specialType
  )

  return config?.icon || '🌟'
})

// 适宜度样式
const suitabilityClass = computed(() => {
  const map: Record<string, string> = {
    '优': 'excellent',
    '良': 'good',
    '中': 'fair',
    '差': 'poor'
  }
  return map[props.weather?.suitability || ''] || ''
})
</script>

<style lang="scss" scoped>
.weather-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 50px;
  justify-content: center;

  &.compact {
    min-height: 36px;
    font-size: 12px;
  }
}

.weather-normal,
.weather-special {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.weather-icon {
  font-size: 18px;
}

.compact .weather-icon {
  font-size: 14px;
}

.weather-desc {
  font-size: 13px;
}

.compact .weather-desc {
  font-size: 11px;
}

.weather-temp {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.compact .weather-temp {
  display: none;
}

.weather-empty {
  color: #ccc;
  font-size: 12px;
  padding: 10px 0;
}

/* 特殊天气高亮样式 */
.weather-云海 {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.3));
  border: 1px solid #FFD700;
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: bold;
  animation: shimmer 2s infinite;
}

.weather-日出 {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.3));
  border: 1px solid #FF6B35;
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: bold;
}

.weather-日落 {
  background: linear-gradient(135deg, rgba(255, 140, 66, 0.15), rgba(255, 140, 66, 0.3));
  border: 1px solid #FF8C42;
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: bold;
}

.weather-雾凇 {
  background: linear-gradient(135deg, rgba(232, 244, 248, 0.5), rgba(232, 244, 248, 0.7));
  border: 1px solid #A8D5E2;
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: bold;
}

.weather-彩虹 {
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.15), rgba(255, 105, 180, 0.3));
  border: 1px solid #FF69B4;
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: bold;
}

.weather-佛光 {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.4));
  border: 1px solid #FFD700;
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: bold;
  animation: glow 1.5s ease-in-out infinite alternate;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes glow {
  from {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
  to {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
  }
}
</style>
