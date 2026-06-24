<template>
  <div class="weather-config">
    <el-card shadow="hover">
      <template #header>
        <span>天气服务配置</span>
      </template>

      <el-form :model="config" label-width="120px" label-position="top">
        <el-divider content-position="left">Open-Meteo API 配置</el-divider>

        <el-form-item label="API 基础地址">
          <el-input v-model="config.openMeteo.baseUrl" placeholder="https://api.open-meteo.com" />
          <div class="form-tip">Open-Meteo 天气 API 地址</div>
        </el-form-item>

        <el-divider content-position="left">LLM 配置（用于天气分析）</el-divider>

        <el-form-item label="LLM API 地址">
          <el-input v-model="config.llm.baseUrl" placeholder="http://localhost:8080" />
          <div class="form-tip">LocalAI 或其他兼容 OpenAI 格式的 API 地址</div>
        </el-form-item>

        <el-form-item label="模型名称">
          <el-input v-model="config.llm.model" placeholder="qwen2.5-7b" />
          <div class="form-tip">用于生成天气分析报告的模型</div>
        </el-form-item>

        <el-form-item label="API Key">
          <el-input v-model="config.llm.apiKey" type="password" show-password placeholder="可选" />
        </el-form-item>

        <el-form-item label="超时时间 (ms)">
          <el-input-number v-model="config.llm.timeout" :min="10000" :step="10000" style="width: 100%" />
          <div class="form-tip">请求超时时间，默认 120000ms (2 分钟)</div>
        </el-form-item>

        <el-divider content-position="left">报表配置</el-divider>

        <el-form-item label="默认显示天数">
          <el-input-number v-model="config.report.defaultDays" :min="1" :max="30" style="width: 100%" />
          <div class="form-tip">报表默认显示的未来天数</div>
        </el-form-item>

        <el-form-item label="小时范围">
          <div style="display: flex; gap: 12px; align-items: center">
            <el-input-number v-model="config.report.hourlyRange[0]" :min="0" :max="23" style="width: 120px" />
            <span>至</span>
            <el-input-number v-model="config.report.hourlyRange[1]" :min="0" :max="23" style="width: 120px" />
          </div>
          <div class="form-tip">每日显示的小时范围，如 6-18 表示 6:00-18:00</div>
        </el-form-item>

        <el-divider content-position="left">特殊天气高亮</el-divider>

        <el-table :data="config.highlight.specialWeather" border style="width: 100%">
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="color" label="颜色" width="100">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 8px">
                <div :style="{ width: '20px', height: '20px', background: row.color, borderRadius: '4px' }" />
                {{ row.color }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="icon" label="图标" width="80" />
          <el-table-column label="关键词" min-width="200">
            <template #default="{ row }">
              {{ row.keywords.join(', ') }}
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px">
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
          <el-button @click="resetConfig">重置配置</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import type { AppConfig } from '@/types/weather'

const configStore = useConfigStore()

// 深拷贝配置用于表单编辑
const config = ref<AppConfig>(JSON.parse(JSON.stringify(configStore.config)))

// 监听配置变化，同步到 store
watch(config, (newVal) => {
  configStore.updateConfig(newVal)
}, { deep: true })

const saveConfig = () => {
  configStore.updateConfig(config.value)
  ElMessage.success('配置已保存')
}

const resetConfig = () => {
  configStore.resetConfig()
  config.value = JSON.parse(JSON.stringify(configStore.config))
  ElMessage.success('配置已重置')
}
</script>

<style lang="scss" scoped>
.weather-config {
  .form-tip {
    color: #999;
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>
