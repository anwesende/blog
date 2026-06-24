// WMO 天气代码
export enum WMOWeatherCode {
  CLEAR_SKY = 0,           // 晴朗
  MAINLY_CLEAR = 1,        // 主要晴朗
  PARTLY_CLOUDY = 2,       // 多云
  OVERCAST = 3,            // 阴天
  FOG = 45,                // 雾
  DEPOSITING_RIME_FOG = 48,// 沉积雾凇
  LIGHT_DRIZZLE = 51,      // 轻度毛毛雨
  MODERATE_DRIZZLE = 53,   // 中度毛毛雨
  DENSE_DRIZZLE = 55,      // 密集毛毛雨
  LIGHT_FREEZING_DRIZZLE = 56,
  DENSE_FREEZING_DRIZZLE = 57,
  LIGHT_RAIN = 61,         // 小雨
  MODERATE_RAIN = 63,      // 中雨
  HEAVY_RAIN = 65,         // 大雨
  LIGHT_FREEZING_RAIN = 66,
  HEAVY_FREEZING_RAIN = 67,
  LIGHT_SNOW = 71,         // 小雪
  MODERATE_SNOW = 73,      // 中雪
  HEAVY_SNOW = 75,         // 大雪
  SNOW_GRAINS = 77,
  LIGHT_SHOWERS = 80,      // 小阵雨
  MODERATE_SHOWERS = 81,   // 中阵雨
  HEAVY_SHOWERS = 82,      // 大阵雨
  SNOW_SHOWERS = 85,       // 阵雪
  HEAVY_SNOW_SHOWERS = 86, // 大阵雪
  THUNDERSTORM = 95,       // 雷暴
  THUNDERSTORM_HAIL = 99   // 雷暴冰雹
}

// 天气描述映射
export interface WeatherDescription {
  code: number
  cn: string               // 中文描述
  en: string               // 英文描述
  category: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'stormy'
}

// 时段天气数据
export interface WeatherPeriod {
  temperature: number      // 温度 (°C)
  weatherCode: number      // WMO 代码
  weatherDesc: string      // 天气描述
  cloudCover?: number      // 云量 (%)
  humidity?: number        // 湿度 (%)
  visibility?: number      // 能见度 (km)
  precipitation?: number   // 降水量 (mm)
  isSpecial?: boolean      // 是否特殊天气
  specialType?: string     // 特殊天气类型（云海、日出等）
  suitability?: '优' | '良' | '中' | '差'  // 观景适宜度
  recommendedPeriod?: 'morning' | 'afternoon' | 'both'  // LLM 推荐时段
  advice?: string          // LLM 观景建议
}

// 单日天气数据
export interface DailyWeather {
  scenicId: string         // 景区 ID
  date: string             // 日期 YYYY-MM-DD
  morning: WeatherPeriod   // 午前 (6:00-12:00)
  afternoon: WeatherPeriod // 午后 (12:00-18:00)
}

// Open-Meteo API 响应结构
export interface OpenMeteoResponse {
  latitude: number
  longitude: number
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    cloud_cover: number[]
    relative_humidity_2m: number[]
    visibility: number[]
    precipitation: number[]
  }
}

// 离线天气数据文件结构
export interface OfflineWeatherData {
  downloadTime: number     // 下载时间戳
  dateRange: {
    start: string          // 开始日期
    end: string            // 结束日期
  }
  data: DailyWeather[]     // 天气数据列表
}

// 景区信息
export interface ScenicSpot {
  id: string
  name: string
  province: string
  city: string
  latitude: number
  longitude: number
  elevation?: number
  enabled?: boolean        // 是否启用
  description?: string     // 景区描述
}

// 特殊天气高亮配置
export interface SpecialWeatherHighlight {
  type: string
  keywords: string[]
  color: string
  icon: string
}

// 应用配置
export interface AppConfig {
  llm: {
    baseUrl: string
    model: string
    apiKey: string
    timeout: number
  }
  openMeteo: {
    baseUrl: string
  }
  report: {
    defaultDays: number
    hourlyRange: [number, number]
  }
  highlight: {
    specialWeather: SpecialWeatherHighlight[]
    suitability: Record<string, string>
  }
  prompts: {
    weatherAnalysis: string
  }
}
