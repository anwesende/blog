<template>
  <div class="scenic-management">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>景区列表</span>
            <span class="stats">共 {{ scenicStore.scenicCount }} 个，启用 {{ scenicStore.enabledCount }} 个</span>
          </div>
          <div class="toolbar">
            <el-button type="primary" @click="showAddDialog = true">添加景区</el-button>
            <el-button @click="showImportDialog = true">批量导入</el-button>
            <el-button
              type="danger"
              @click="showBatchDeleteDialog = true"
              :disabled="selectedScenicIds.length === 0"
            >
              批量删除 ({{ selectedScenicIds.length }})
            </el-button>
            <el-dropdown @command="handleBatchCommand" :disabled="selectedScenicIds.length === 0">
              <el-button :disabled="selectedScenicIds.length === 0">
                批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="enable">批量启用</el-dropdown-item>
                  <el-dropdown-item command="disable">批量禁用</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-dropdown @command="handleClearCommand">
              <el-button type="danger" plain>
                清空<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="custom" divided>清空自定义景区</el-dropdown-item>
                  <el-dropdown-item command="all" style="color: #f56c6c">清空所有景区</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <el-table
        :data="scenicList"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="景区名称" min-width="180" />
        <el-table-column prop="province" label="省份" width="100" />
        <el-table-column prop="city" label="城市" width="120" />
        <el-table-column label="坐标" width="180">
          <template #default="{ row }">
            {{ row.latitude.toFixed(4) }}, {{ row.longitude.toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column prop="elevation" label="海拔 (m)" width="90" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled !== false ? 'success' : 'info'" size="small">
              {{ row.enabled !== false ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editScenic(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.enabled !== false ? 'warning' : 'success'"
              @click="toggleScenicEnabled(row)"
            >
              {{ row.enabled !== false ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteScenic(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="scenicList.length === 0" class="empty-state">
        <el-empty description="暂无景区数据，请点击右上角添加" />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑景区' : '添加景区'"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="scenicForm" label-width="80px" :rules="rules" ref="formRef">
        <el-form-item label="景区名称" prop="name">
          <el-input v-model="scenicForm.name" placeholder="如：黄山风景区" />
        </el-form-item>
        <el-form-item label="省份" prop="province">
          <el-input v-model="scenicForm.province" placeholder="如：安徽省" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="scenicForm.city" placeholder="如：黄山市" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input-number v-model="scenicForm.latitude" :min="-90" :max="90" :precision="4" style="width: 100%" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input-number v-model="scenicForm.longitude" :min="-180" :max="180" :precision="4" style="width: 100%" />
        </el-form-item>
        <el-form-item label="海拔 (m)" prop="elevation">
          <el-input-number v-model="scenicForm.elevation" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="scenicForm.description"
            type="textarea"
            :rows="3"
            placeholder="景区简介（可选）"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="scenicForm.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveScenic">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入景区"
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <p>支持两种方式导入：</p>
          <ol>
            <li>上传 JSON 文件（推荐）</li>
            <li>直接粘贴 JSON 内容</li>
          </ol>
          <p>JSON 格式示例：</p>
          <pre class="json-example">[
  {
    "id": "100",
    "name": "景区名称",
    "province": "省份",
    "city": "城市",
    "latitude": 27.4521,
    "longitude": 114.1785,
    "elevation": 1918
  }
]</pre>
        </el-alert>

        <el-upload
          :auto-upload="false"
          :show-file-list="true"
          accept=".json"
          :on-change="handleFileChange"
          style="margin-bottom: 16px"
        >
          <el-button type="primary">选择 JSON 文件</el-button>
        </el-upload>

        <el-divider>或</el-divider>

        <el-input
          v-model="importJsonText"
          type="textarea"
          :rows="8"
          placeholder="粘贴 JSON 数据..."
        />
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="doImport">导入</el-button>
      </template>
    </el-dialog>

    <!-- 批量删除确认对话框 -->
    <el-dialog
      v-model="showBatchDeleteDialog"
      title="批量删除景区"
      width="400px"
    >
      <el-alert
        :title="`确定要删除选中的 ${selectedScenicIds.length} 个景区吗？此操作不可恢复。`"
        type="warning"
        :closable="false"
      />
      <template #footer>
        <el-button @click="showBatchDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="doBatchDelete">确认删除</el-button>
      </template>
    </el-dialog>

    <!-- 清空确认对话框 -->
    <el-dialog
      v-model="showClearDialog"
      :title="clearMode === 'all' ? '清空所有景区' : '清空自定义景区'"
      width="400px"
    >
      <el-alert
        :title="clearMode === 'all'
          ? '确定要清空所有景区吗？此操作将删除所有数据（包括默认景区），不可恢复。'
          : '确定要清空自定义景区吗？此操作将保留默认景区。'"
        type="warning"
        :closable="false"
      />
      <template #footer>
        <el-button @click="showClearDialog = false">取消</el-button>
        <el-button type="danger" @click="doClear">确认清空</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, type FormRules, type UploadUserFile } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useScenicStore } from '@/stores/scenic'
import type { ScenicSpot } from '@/types/weather'

const scenicStore = useScenicStore()

const scenicList = computed(() => scenicStore.scenicList)

const selectedScenicIds = ref<string[]>([])

const showAddDialog = ref(false)
const showImportDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const showClearDialog = ref(false)
const clearMode = ref<'custom' | 'all'>('custom')

const isEdit = ref(false)
const formRef = ref()

const scenicForm = ref<ScenicSpot>({
  id: '',
  name: '',
  province: '',
  city: '',
  latitude: 0,
  longitude: 0,
  elevation: 0,
  enabled: true,
  description: ''
})

const importJsonText = ref('')

const rules: FormRules = {
  name: [{ required: true, message: '请输入景区名称', trigger: 'blur' }],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'blur' }]
}

// 选择变化
const handleSelectionChange = (selection: ScenicSpot[]) => {
  selectedScenicIds.value = selection.map(s => s.id)
}

// 批量操作命令
const handleBatchCommand = (command: string) => {
  if (command === 'enable') {
    scenicStore.batchToggleScenics(selectedScenicIds.value, true)
    ElMessage.success(`已启用 ${selectedScenicIds.value.length} 个景区`)
  } else if (command === 'disable') {
    scenicStore.batchToggleScenics(selectedScenicIds.value, false)
    ElMessage.success(`已禁用 ${selectedScenicIds.value.length} 个景区`)
  }
  selectedScenicIds.value = []
}

// 清空命令
const handleClearCommand = (command: string) => {
  if (command === 'custom') {
    clearMode.value = 'custom'
  } else if (command === 'all') {
    clearMode.value = 'all'
  }
  showClearDialog.value = true
}

// 执行清空
const doClear = () => {
  if (clearMode.value === 'all') {
    scenicStore.clearAll()
    ElMessage.success('已清空所有景区')
  } else {
    // 清空自定义景区（保留默认）
    scenicStore.resetToDefaults()
    ElMessage.success('已清空自定义景区，保留默认景区')
  }
  showClearDialog.value = false
}

// 编辑景区
const editScenic = (row: ScenicSpot) => {
  isEdit.value = true
  scenicForm.value = { ...row }
  showAddDialog.value = true
}

// 删除景区
const deleteScenic = (row: ScenicSpot) => {
  scenicStore.deleteScenic(row.id)
  ElMessage.success('删除成功')
}

// 批量删除
const doBatchDelete = () => {
  scenicStore.batchDeleteScenics(selectedScenicIds.value)
  ElMessage.success(`已删除 ${selectedScenicIds.value.length} 个景区`)
  selectedScenicIds.value = []
  showBatchDeleteDialog.value = false
}

// 切换启用状态
const toggleScenicEnabled = (row: ScenicSpot) => {
  scenicStore.toggleScenicEnabled(row.id)
  ElMessage.success(row.enabled ? '已禁用' : '已启用')
}

// 保存景区
const saveScenic = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        scenicStore.updateScenic(scenicForm.value.id, scenicForm.value)
        ElMessage.success('更新成功')
      } else {
        scenicForm.value.id = Date.now().toString()
        scenicStore.addScenic({ ...scenicForm.value })
        ElMessage.success('添加成功')
      }
      showAddDialog.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  scenicForm.value = {
    id: '',
    name: '',
    province: '',
    city: '',
    latitude: 0,
    longitude: 0,
    elevation: 0,
    enabled: true,
    description: ''
  }
  isEdit.value = false
  formRef.value?.resetFields()
}

// 文件变化处理
const handleFileChange = (file: UploadUserFile) => {
  if (file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = String(e.target?.result ?? '')
        importJsonText.value = text
      } catch {
        ElMessage.error('文件读取失败')
      }
    }
    reader.readAsText(file.raw)
  }
}

// 执行导入
const doImport = () => {
  if (!importJsonText.value.trim()) {
    ElMessage.warning('请输入 JSON 数据或上传文件')
    return
  }

  try {
    const data = JSON.parse(importJsonText.value)
    if (!Array.isArray(data)) {
      ElMessage.error('JSON 格式错误，应为数组')
      return
    }

    const count = scenicStore.importScenics(data as ScenicSpot[])
    ElMessage.success(`成功导入 ${count} 个景区`)
    showImportDialog.value = false
    importJsonText.value = ''
  } catch (e) {
    ElMessage.error(`JSON 解析失败：${(e as Error).message}`)
  }
}
</script>

<style lang="scss" scoped>
.scenic-management {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .stats {
        color: #666;
        font-size: 14px;
      }
    }

    .toolbar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .empty-state {
    padding: 40px 0;
  }

  .import-content {
    .json-example {
      background: #f5f7fa;
      padding: 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      margin-top: 8px;
      overflow-x: auto;
    }

    ol {
      margin: 8px 0;
      padding-left: 20px;

      li {
        margin: 4px 0;
      }
    }
  }
}
</style>
