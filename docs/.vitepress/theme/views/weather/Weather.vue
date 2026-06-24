<template>
  <PageContainer>
    <div class="weather-page">
      <el-tabs v-model="activeTab" class="weather-tabs">
        <!-- 报表展示 -->
        <el-tab-pane label="报表展示" name="report">
          <WeatherReport />
        </el-tab-pane>

        <!-- 景区管理 -->
        <el-tab-pane label="景区管理" name="scenic">
          <ScenicManagement />
        </el-tab-pane>

        <!-- 天气数据 -->
        <el-tab-pane label="天气数据" name="weather">
          <WeatherDataManagement />
        </el-tab-pane>

        <!-- 提示词 -->
        <el-tab-pane label="提示词" name="prompt">
          <WeatherPrompt />
        </el-tab-pane>

        <!-- 配置 -->
        <el-tab-pane label="配置" name="config">
          <WeatherConfig />
        </el-tab-pane>
      </el-tabs>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageContainer from '../../components/layout/PageContainer.vue'
import WeatherReport from './WeatherReport.vue'
import ScenicManagement from './ScenicManagement.vue'
import WeatherDataManagement from './WeatherDataManagement.vue'
import WeatherPrompt from './WeatherPrompt.vue'
import WeatherConfig from './WeatherConfig.vue'

const activeTab = ref('report')
</script>

<style lang="scss" scoped>
.weather-page {
  padding: 16px;
}

.weather-tabs {
  width: 100%;
}
</style>
