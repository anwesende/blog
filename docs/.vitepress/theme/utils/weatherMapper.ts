import type { WeatherDescription } from '@/types/weather'

/**
 * WMO 天气代码映射表
 * https://open-meteo.com/en/docs
 */
export const WMO_CODE_MAP: Record<number, WeatherDescription> = {
  0: { code: 0, cn: '晴', en: 'Clear sky', category: 'sunny' },
  1: { code: 1, cn: '主要晴朗', en: 'Mainly clear', category: 'sunny' },
  2: { code: 2, cn: '多云', en: 'Partly cloudy', category: 'cloudy' },
  3: { code: 3, cn: '阴', en: 'Overcast', category: 'cloudy' },
  45: { code: 45, cn: '雾', en: 'Fog', category: 'foggy' },
  48: { code: 48, cn: '雾凇', en: 'Depositing rime fog', category: 'foggy' },
  51: { code: 51, cn: '轻度毛毛雨', en: 'Light drizzle', category: 'rainy' },
  53: { code: 53, cn: '中度毛毛雨', en: 'Moderate drizzle', category: 'rainy' },
  55: { code: 55, cn: '密集毛毛雨', en: 'Dense drizzle', category: 'rainy' },
  56: { code: 56, cn: '轻度冻毛毛雨', en: 'Light freezing drizzle', category: 'rainy' },
  57: { code: 57, cn: '密集冻毛毛雨', en: 'Dense freezing drizzle', category: 'rainy' },
  61: { code: 61, cn: '小雨', en: 'Slight rain', category: 'rainy' },
  63: { code: 63, cn: '中雨', en: 'Moderate rain', category: 'rainy' },
  65: { code: 65, cn: '大雨', en: 'Heavy rain', category: 'rainy' },
  66: { code: 66, cn: '轻度冻雨', en: 'Light freezing rain', category: 'rainy' },
  67: { code: 67, cn: '重度冻雨', en: 'Heavy freezing rain', category: 'rainy' },
  71: { code: 71, cn: '小雪', en: 'Slight snow fall', category: 'snowy' },
  73: { code: 73, cn: '中雪', en: 'Moderate snow fall', category: 'snowy' },
  75: { code: 75, cn: '大雪', en: 'Heavy snow fall', category: 'snowy' },
  77: { code: 77, cn: '雪粒', en: 'Snow grains', category: 'snowy' },
  80: { code: 80, cn: '小阵雨', en: 'Slight rain showers', category: 'rainy' },
  81: { code: 81, cn: '中阵雨', en: 'Moderate rain showers', category: 'rainy' },
  82: { code: 82, cn: '大阵雨', en: 'Violent rain showers', category: 'rainy' },
  85: { code: 85, cn: '小阵雪', en: 'Slight snow showers', category: 'snowy' },
  86: { code: 86, cn: '大阵雪', en: 'Heavy snow showers', category: 'snowy' },
  95: { code: 95, cn: '雷暴', en: 'Thunderstorm', category: 'stormy' },
  96: { code: 96, cn: '雷暴伴小冰雹', en: 'Thunderstorm with slight hail', category: 'stormy' },
  99: { code: 99, cn: '雷暴伴冰雹', en: 'Thunderstorm with heavy hail', category: 'stormy' }
}

/**
 * 根据 WMO 代码获取天气描述
 */
export function getWeatherDescription(code: number): WeatherDescription {
  return WMO_CODE_MAP[code] || { code, cn: '未知', en: 'Unknown', category: 'cloudy' }
}

/**
 * 获取天气代码对应的 emoji
 */
export function getWeatherEmoji(code: number): string {
  const category = WMO_CODE_MAP[code]?.category
  switch (category) {
    case 'sunny': return '☀️'
    case 'cloudy': return '☁️'
    case 'rainy': return '🌧️'
    case 'snowy': return '❄️'
    case 'foggy': return '🌫️'
    case 'stormy': return '⛈️'
    default: return '🌤️'
  }
}

/**
 * 简化天气描述（用于报表显示）
 */
export function simplifyWeatherDesc(desc: string): string {
  const map: Record<string, string> = {
    '晴': '晴',
    '主要晴朗': '晴',
    '多云': '多云',
    '阴': '阴',
    '雾': '雾',
    '雾凇': '雾凇',
    '小雨': '雨',
    '中雨': '雨',
    '大雨': '雨',
    '小雪': '雪',
    '中雪': '雪',
    '大雪': '雪',
    '雷暴': '雷'
  }

  // 查找匹配
  for (const [key, value] of Object.entries(map)) {
    if (desc.includes(key)) {
      return value
    }
  }

  return desc
}
