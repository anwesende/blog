import axios from 'axios'
import type { OpenMeteoResponse } from '@/types/weather'

/**
 * Open-Meteo API 封装
 * 文档：https://open-meteo.com/en/docs
 */
export class OpenMeteoApi {
  private baseUrl: string

  constructor(baseUrl = 'https://api.open-meteo.com') {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  /**
   * 获取小时天气数据
   * @param latitude 纬度
   * @param longitude 经度
   * @param startDate 开始日期 YYYY-MM-DD
   * @param endDate 结束日期 YYYY-MM-DD
   */
  async getHourlyWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<OpenMeteoResponse> {
    const url = `${this.baseUrl}/v1/forecast`

    const params = {
      latitude,
      longitude,
      hourly: 'temperature_2m,weather_code,cloud_cover,relative_humidity_2m,visibility,precipitation',
      start_date: startDate,
      end_date: endDate,
      timezone: 'auto'
    }

    try {
      const response = await axios.get(url, { params })
      return response.data as OpenMeteoResponse
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Open-Meteo API 请求失败：${error.message}`)
      }
      throw error
    }
  }

  /**
   * 批量获取多个地点的天气数据
   */
  async getBatchWeather(
    locations: Array<{ latitude: number; longitude: number }>,
    startDate: string,
    endDate: string
  ): Promise<Map<string, OpenMeteoResponse>> {
    const results = new Map<string, OpenMeteoResponse>()

    // 串行请求避免限流
    for (const loc of locations) {
      try {
        const key = `${loc.latitude},${loc.longitude}`
        const data = await this.getHourlyWeather(
          loc.latitude,
          loc.longitude,
          startDate,
          endDate
        )
        results.set(key, data)

        // 礼貌性延迟，避免触发限流
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`获取地点 ${loc.latitude},${loc.longitude} 天气失败:`, error)
      }
    }

    return results
  }
}

export const createOpenMeteoApi = (baseUrl?: string) => {
  return new OpenMeteoApi(baseUrl)
}
