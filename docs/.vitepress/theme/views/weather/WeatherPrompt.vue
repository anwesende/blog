<template>
  <div class="weather-prompt">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>提示词模板</span>
          <div class="toolbar">
            <el-button @click="exportPrompts">导出提示词</el-button>
            <el-button @click="showImportDialog = true">导入提示词</el-button>
            <el-button type="warning" @click="resetAllPrompts">重置所有提示词</el-button>
          </div>
        </div>
      </template>

      <el-table :data="promptList" border style="width: 100%">
        <el-table-column prop="name" label="名称" width="200" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editPrompt(row)">编辑</el-button>
            <el-button size="small" @click="resetSinglePrompt(row)">重置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑提示词对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="`编辑提示词：${currentPrompt?.name || ''}`"
      width="800px"
    >
      <div class="edit-content">
        <el-alert
          title="编辑提示词"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <p>提示词用于指导 LLM 分析天气数据。可以使用以下占位符：</p>
          <ul>
            <li><code>{scenicName}</code> - 景区名称</li>
            <li><code>{date}</code> - 日期</li>
            <li><code>{amTemp}</code> - 上午温度</li>
            <li><code>{amCode}</code> - 上午天气代码</li>
            <li><code>{amCloud}</code> - 上午云量</li>
            <li><code>{amHumidity}</code> - 上午湿度</li>
            <li><code>{pmTemp}</code>、<code>{pmCode}</code>、<code>{pmCloud}</code>、<code>{pmHumidity}</code> - 下午数据</li>
          </ul>
        </el-alert>

        <el-form :model="currentPrompt" label-width="80px">
          <el-form-item label="名称">
            <el-input v-model="currentPrompt.name" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="currentPrompt.description" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="内容">
            <el-input
              v-model="currentPrompt.content"
              type="textarea"
              :rows="20"
              style="font-family: 'Courier New', monospace; font-size: 13px"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="savePrompt">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="showImportDialog" title="导入提示词" width="600px">
      <el-input
        v-model="importJson"
        type="textarea"
        :rows="15"
        placeholder="粘贴 JSON 数据..."
        style="font-family: 'Courier New', monospace"
      />
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="doImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { usePromptStore, type PromptTemplate } from '@/stores/prompt'

const promptStore = usePromptStore()

const promptList = computed(() => promptStore.prompts)

const showEditDialog = ref(false)
const showImportDialog = ref(false)
const currentPrompt = ref<PromptTemplate | null>(null)
const importJson = ref('')

const editPrompt = (row: PromptTemplate) => {
  currentPrompt.value = { ...row }
  showEditDialog.value = true
}

const savePrompt = () => {
  if (!currentPrompt.value) return

  promptStore.updatePrompt(
    currentPrompt.value.id,
    currentPrompt.value.content,
    currentPrompt.value.name,
    currentPrompt.value.description
  )
  ElMessage.success('保存成功')
  showEditDialog.value = false
}

const resetSinglePrompt = (row: PromptTemplate) => {
  promptStore.resetPrompt(row.id)
  ElMessage.success('已重置为默认提示词')
}

const resetAllPrompts = () => {
  ElMessage.confirm('确定要重置所有提示词吗？自定义内容将丢失。', {
    type: 'warning'
  }).then(() => {
    promptStore.resetAllPrompts()
    ElMessage.success('已重置所有提示词')
  }).catch(() => {})
}

const exportPrompts = () => {
  const json = promptStore.exportToJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `prompt-templates-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const doImport = () => {
  if (!importJson.value.trim()) {
    ElMessage.warning('请输入 JSON 数据')
    return
  }

  const result = promptStore.importFromJson(importJson.value)
  if (result.error) {
    ElMessage.error(result.error)
  } else {
    ElMessage.success(`成功导入 ${result.success} 个提示词`)
    showImportDialog.value = false
    importJson.value = ''
  }
}

const formatTime = (time: number) => {
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.weather-prompt {
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

  .edit-content {
    ul {
      margin: 8px 0;
      padding-left: 20px;

      li {
        margin: 4px 0;

        code {
          background: #f5f7fa;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
