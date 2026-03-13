<template>
  <div class="calorie-calculator">
    <el-tabs v-model="activePage" class="page-tabs">
      <el-tab-pane label="运动安排" name="workout">
        <el-card shadow="hover">
          <template #header>
            <span>运动安排</span>
          </template>

          <div class="workout-toolbar">
            <el-select v-model="selectedTrainingDay" placeholder="选择训练日" style="width: 240px">
              <el-option
                v-for="day in trainingDayOptions"
                :key="day"
                :label="day"
                :value="day"
              />
            </el-select>

            <div class="workout-summary">
              当前显示 {{ selectedTrainingDay || '未选择' }}，共 {{ displayedWorkoutList.length }} 个动作
            </div>
          </div>

          <div v-if="workoutLoadError" class="error-text">{{ workoutLoadError }}</div>

          <el-table
            v-loading="isLoadingWorkout"
            :data="displayedWorkoutList"
            border
            style="width: 100%"
            empty-text="暂无运动安排"
          >
            <el-table-column prop="训练部位" label="训练部位" width="120" />
            <el-table-column prop="动作名称" label="动作名称" width="160" />
            <el-table-column
              prop="核心动作要领（含颈椎保护）"
              label="核心动作要领（含颈椎保护）"
              min-width="260"
            />
            <el-table-column prop="关键备注" label="关键备注" min-width="180" />
            <el-table-column prop="力竭组安排（每组建议次数）" label="力竭组安排" min-width="200" />
            <el-table-column prop="常规组重量 (标准 16 次)" label="常规组重量" width="150" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="饮食热量" name="nutrition">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="col-card" shadow="hover">
              <template #header>
                <span>基础信息录入</span>
              </template>

              <el-form label-width="100px">
                <el-form-item label="身高(cm)">
                  <el-input v-model="userInfo.height" type="number" placeholder="请输入身高" />
                </el-form-item>
                <el-form-item label="体重(kg)">
                  <el-input v-model="userInfo.weight" type="number" placeholder="请输入体重" />
                </el-form-item>
                <el-form-item label="年龄">
                  <el-input v-model="userInfo.age" type="number" placeholder="请输入年龄" />
                </el-form-item>
                <el-form-item label="活动强度">
                  <el-select v-model="userInfo.activityLevel" placeholder="请选择活动强度">
                    <el-option label="久坐（办公室工作）" value="1.2" />
                    <el-option label="轻度活动（每周1-3天运动）" value="1.375" />
                    <el-option label="中度活动（每周3-5天运动）" value="1.55" />
                    <el-option label="积极活动（每周6-7天运动）" value="1.725" />
                    <el-option label="高强度活动（体力劳动或专业运动员）" value="1.9" />
                  </el-select>
                </el-form-item>
                <el-form-item label="热量缺口(%)">
                  <el-input v-model="userInfo.calorieDeficit" type="number" placeholder="0-100之间的数值">
                    <template #append>%</template>
                  </el-input>
                </el-form-item>
                <el-form-item label="是否轻断食">
                  <el-switch v-model="isFastingDay" active-text="轻断食日" inactive-text="正常日" />
                </el-form-item>
                <el-form-item label="晚餐坚果麦片(g)">
                  <el-input v-model.number="dinner.nutOatWeight" type="number" min="0" />
                </el-form-item>
                <el-form-item label="晚餐酸奶(ml)">
                  <el-input v-model.number="dinner.yogurtMl" type="number" min="0" />
                </el-form-item>
                <el-form-item label="晚餐牛肉干(g)">
                  <el-input v-model.number="dinner.beefJerkyWeight" type="number" min="0" />
                </el-form-item>
                <el-form-item label="上传菜单">
                  <el-upload
                    :auto-upload="false"
                    :show-file-list="false"
                    accept=".json"
                    :on-change="handleMenuUpload"
                  >
                    <el-button size="small" type="primary">重新上传食谱JSON</el-button>
                  </el-upload>
                  <span class="upload-hint">页面启动时会自动加载站点根路径下的 食谱.json</span>
                  <span v-if="menuUploadError" class="error-text">{{ menuUploadError }}</span>
                </el-form-item>
                <el-form-item label="目标体重(kg)">
                  <el-input v-model="userInfo.targetWeight" type="number" placeholder="请输入目标体重" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="calculateCalories">计算</el-button>
                  <el-button @click="resetForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="col-card" shadow="hover">
              <template #header>
                <span>日常消耗和摄入计算</span>
              </template>

              <div v-if="calculatedResults">
                <div class="title-section">热量消耗</div>
                <div class="nutrient-item">
                  基础代谢率(BMR): <span class="result-value">{{ calculatedResults.bmr }} 千卡</span>
                </div>
                <div class="nutrient-item">
                  每日消耗热量(TDEE): <span class="result-value">{{ calculatedResults.tdee }} 千卡</span>
                </div>

                <div class="title-section">每日推荐摄入</div>
                <div class="nutrient-item">
                  热量: <span class="result-value">{{ calculatedResults.dailyCalories }} 千卡</span>
                </div>
                <div class="nutrient-item">
                  蛋白质: <span class="result-value">{{ calculatedResults.protein }} g</span>
                </div>
                <div class="nutrient-item">
                  脂肪: <span class="result-value">{{ calculatedResults.fat }} g</span>
                </div>
                <div class="nutrient-item">
                  碳水: <span class="result-value">{{ calculatedResults.carbs }} g</span>
                </div>

                <div class="title-section">轻断食日推荐摄入</div>
                <div class="nutrient-item">
                  热量: <span class="result-value">{{ calculatedResults.fastingCalories }} 千卡</span>
                </div>
                <div class="nutrient-item">
                  蛋白质: <span class="result-value">{{ calculatedResults.fastingProtein }} g</span>
                </div>
                <div class="nutrient-item">
                  脂肪: <span class="result-value">{{ calculatedResults.fastingFat }} g</span>
                </div>
                <div class="nutrient-item">
                  碳水: <span class="result-value">{{ calculatedResults.fastingCarbs }} g</span>
                </div>

                <div class="title-section">目标体重消耗热量</div>
                <div class="nutrient-item">
                  <span>
                    需要消耗热量:
                    <span class="result-value">{{ targetWeightCalories }} 千卡</span>
                  </span>
                </div>
              </div>
              <div v-else>
                <p>请先填写基础信息并点击计算</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="col-card" shadow="hover">
              <template #header>
                <span>每日菜单</span>
              </template>

              <div v-if="menuLoadError" class="error-text">{{ menuLoadError }}</div>
              <el-select
                v-model="selectedDay"
                placeholder="选择日期查看菜单"
                style="width: 100%; margin-bottom: 15px"
                @change="loadMenuForDay"
              >
                <el-option v-for="day in selectedDays" :key="day" :label="day" :value="day" />
              </el-select>

              <div v-if="currentMenu">
                <div class="title-section">{{ selectedDay }} 菜单</div>
                <el-checkbox-group v-model="selectedFoodList" @change="calculateNutrition">
                  <div v-for="(nutrition, food) in currentMenu" :key="String(food)" class="food-item">
                    <el-checkbox :label="String(food)">{{ food }}</el-checkbox>
                    <div class="food-macros">
                      <span>碳水: {{ nutrition.碳水 }}</span>
                      <span>蛋白质: {{ nutrition.蛋白质 }}</span>
                      <span>脂肪: {{ nutrition.脂肪 }}</span>
                    </div>
                  </div>
                </el-checkbox-group>
              </div>
              <div v-else-if="isLoadingMenus" class="empty-state">正在加载食谱数据...</div>
              <div v-else>
                <p>暂无可用菜单</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="col-card" shadow="hover">
              <template #header>
                <span>营养摄入计算</span>
              </template>

              <div v-if="Number(totalNutrition.calories) > 0">
                <div class="nutrient-item" v-if="selectedFoodList.length">
                  餐厅提供的食物菜单,按表格输出别计算营养的汇总：
                  <span class="result-value">{{ selectedFoodList.join('，') }}</span>
                  <span class="nutrition-tip">
                    （今日为{{ isFastingDay ? '轻断食日' : '正常日' }} 早餐需要摄入 {{ nutritionTarget.protein }}g蛋白质,
                    {{ nutritionTarget.fat }}g脂肪, {{ nutritionTarget.carbs }}g碳水）
                  </span>
                </div>

                <div class="title-section">已选食物营养汇总</div>
                <div class="nutrient-item">
                  总热量: <span class="result-value">{{ totalNutrition.calories }} 千卡</span>
                </div>
                <div class="nutrient-item">
                  蛋白质: <span class="result-value">{{ totalNutrition.protein }} g</span>
                </div>
                <div class="nutrient-item">
                  脂肪: <span class="result-value">{{ totalNutrition.fat }} g</span>
                </div>
                <div class="nutrient-item">
                  碳水: <span class="result-value">{{ totalNutrition.carbs }} g</span>
                </div>
              </div>
              <div v-else>
                <p>请从左侧菜单选择食物</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'

type NutritionRow = { 碳水: string; 蛋白质: string; 脂肪: string }
type MenuData = Record<string, Record<string, NutritionRow>>

type WorkoutRow = Record<string, any>

const activePage = ref<'workout' | 'nutrition'>('workout')

const userInfo = reactive({
  height: '169',
  weight: '74',
  age: '31',
  activityLevel: '1.375',
  calorieDeficit: '20',
  targetWeight: '65',
})

const selectedDays = ref<string[]>([])
const selectedDay = ref('')
const calculatedResults = ref<
  | null
  | {
      bmr: string
      tdee: string
      dailyCalories: string
      protein: string
      fat: string
      carbs: string
      fastingCalories: string
      fastingProtein: string
      fastingFat: string
      fastingCarbs: string
    }
>(null)

const menuData = ref<MenuData>({})
const menuUploadError = ref('')
const menuLoadError = ref('')
const currentMenu = ref<Record<string, NutritionRow> | null>(null)
const isLoadingMenus = ref(false)
const selectedFoodList = ref<string[]>([])

const totalNutrition = reactive({
  calories: '0',
  protein: '0',
  fat: '0',
  carbs: '0',
})

const isFastingDay = ref(false)

const dinner = reactive({
  nutOatWeight: 80,
  yogurtMl: 300,
  beefJerkyWeight: 30,
})

const dinnerNutOat = { protein: 16.6, fat: 21.6, carbs: 42.6, weight: 100 }
const dinnerYogurt = { protein: 2.6, fat: 2.9, carbs: 13.7, weight: 100 }
const dinnerBeefJerky = { protein: 70.8, fat: 4.2, carbs: 2.6, weight: 100 }

const nutritionTarget = reactive({ protein: '0', fat: '0', carbs: '0' })
const targetWeightCalories = ref<string | number>(0)

const workoutLoadError = ref('')
const isLoadingWorkout = ref(false)
const trainingScheduleByDay = ref<Record<string, WorkoutRow[]>>({})
const trainingDayOptions = ref<string[]>([])
const selectedTrainingDay = ref('')

const displayedWorkoutList = computed(() => trainingScheduleByDay.value[selectedTrainingDay.value] || [])

function getTodayLabel() {
  const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekMap[new Date().getDay()]
}

function loadJsonFile(path: string) {
  return fetch(path, { cache: 'no-cache' }).then((response) => {
    if (!response.ok) throw new Error('加载失败')
    return response.json()
  })
}

function loadInitialData() {
  loadMenuData()
  loadWorkoutData()
}

function loadMenuData() {
  isLoadingMenus.value = true
  menuLoadError.value = ''

  loadJsonFile(withBase('/食谱.json'))
    .then((json) => applyMenuData(json))
    .catch(() => applyMenuData(eat_json as any))
    .finally(() => {
      isLoadingMenus.value = false
    })
}

function loadWorkoutData() {
  isLoadingWorkout.value = true
  workoutLoadError.value = ''

  loadJsonFile(withBase('/运动安排.json'))
    .then((json) => applyWorkoutData(json))
    .catch(() => applyWorkoutData(sport_json as any))
    .finally(() => {
      isLoadingWorkout.value = false
    })
}

function applyMenuData(json: MenuData) {
  menuData.value = (json || {}) as MenuData
  const days = Object.keys(menuData.value)
  selectedDays.value = days

  if (!days.length) {
    selectedDay.value = ''
    currentMenu.value = null
    selectedFoodList.value = []
    calculateNutrition()
    return
  }

  const today = getTodayLabel()
  const defaultDay = days.includes(today) ? today : days[0]
  loadMenuForDay(defaultDay)
}

function applyWorkoutData(rows: WorkoutRow[]) {
  const grouped: Record<string, WorkoutRow[]> = {}

  ;(rows || []).forEach((item) => {
    parseTrainingDays(item.训练日).forEach((day) => {
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(item)
    })
  })

  trainingScheduleByDay.value = grouped
  const weekOrder = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  trainingDayOptions.value = weekOrder.filter((day) => grouped[day])

  const today = getTodayLabel()
  selectedTrainingDay.value = grouped[today] ? today : trainingDayOptions.value[0] || ''
}

function parseTrainingDays(trainingDayText: string) {
  const normalized = String(trainingDayText || '').replace(/\s+/g, '')
  const matches = normalized.match(/周[一二三四五六日天]|[一二三四五六日天]/g) || []
  const days: string[] = []

  matches.forEach((token) => {
    let day = token.startsWith('周') ? token : `周${token}`
    if (day === '周天') day = '周日'
    if (!days.includes(day)) days.push(day)
  })

  return days
}

function calculateCalories() {
  if (!userInfo.height || !userInfo.weight || !userInfo.age || !userInfo.activityLevel || !userInfo.calorieDeficit) {
    ElMessage.error('请填写完整信息')
    return
  }

  const height = Number.parseFloat(userInfo.height)
  const weight = Number.parseFloat(userInfo.weight)
  const age = Number.parseFloat(userInfo.age)
  const activityLevel = Number.parseFloat(userInfo.activityLevel)
  const calorieDeficit = Number.parseFloat(userInfo.calorieDeficit) / 100

  if ([height, weight, age, activityLevel, calorieDeficit].some((n) => Number.isNaN(n))) {
    ElMessage.error('请填写有效的数字')
    return
  }

  // 使用原页面的公式（男性）
  const bmr = 66 + 13.7 * weight + 5 * height - 6.8 * age
  const tdee = bmr * activityLevel
  const dailyCalories = tdee * (1 - calorieDeficit)

  const proteinGrams = (dailyCalories * 0.3 / 4).toFixed(1)
  const fatGrams = (dailyCalories * 0.3 / 9).toFixed(1)
  const carbsGrams = (dailyCalories * 0.4 / 4).toFixed(1)

  const fastingCalories = (dailyCalories * 0.25).toFixed(0)
  const fastingProtein = (Number(proteinGrams) * 0.25).toFixed(1)
  const fastingFat = (Number(fatGrams) * 0.25).toFixed(1)
  const fastingCarbs = (Number(carbsGrams) * 0.25).toFixed(1)

  calculatedResults.value = {
    bmr: bmr.toFixed(0),
    tdee: tdee.toFixed(0),
    dailyCalories: dailyCalories.toFixed(0),
    protein: proteinGrams,
    fat: fatGrams,
    carbs: carbsGrams,
    fastingCalories,
    fastingProtein,
    fastingFat,
    fastingCarbs,
  }

  calculateTargetWeightCalories()
  calculateNutritionTarget()

  if (selectedDays.value.length) {
    const today = getTodayLabel()
    const defaultDay = selectedDays.value.includes(today) ? today : selectedDays.value[0]
    loadMenuForDay(defaultDay)
  }
}

function calculateTargetWeightCalories() {
  const current = Number.parseFloat(userInfo.weight)
  const target = Number.parseFloat(userInfo.targetWeight)

  if (!Number.isNaN(current) && !Number.isNaN(target) && current > target) {
    targetWeightCalories.value = ((current - target) * 7700).toFixed(0)
  } else {
    targetWeightCalories.value = 0
  }
}

function resetForm() {
  userInfo.height = ''
  userInfo.weight = ''
  userInfo.age = ''
  userInfo.activityLevel = ''
  userInfo.calorieDeficit = '20'
  userInfo.targetWeight = ''

  calculatedResults.value = null
  selectedFoodList.value = []

  totalNutrition.calories = '0'
  totalNutrition.protein = '0'
  totalNutrition.fat = '0'
  totalNutrition.carbs = '0'

  nutritionTarget.protein = '0'
  nutritionTarget.fat = '0'
  nutritionTarget.carbs = '0'

  targetWeightCalories.value = 0
}

function loadMenuForDay(day: string) {
  selectedDay.value = day
  currentMenu.value = menuData.value[day] || null
  selectedFoodList.value = []
  calculateNutrition()
}

function calculateNutrition() {
  let calories = 0
  let protein = 0
  let fat = 0
  let carbs = 0

  if (!currentMenu.value) {
    totalNutrition.calories = '0'
    totalNutrition.protein = '0'
    totalNutrition.fat = '0'
    totalNutrition.carbs = '0'
    return
  }

  selectedFoodList.value.forEach((food) => {
    const nutrition = currentMenu.value?.[food]
    if (!nutrition) return

    const p = Number.parseFloat(nutrition.蛋白质)
    const f = Number.parseFloat(nutrition.脂肪)
    const c = Number.parseFloat(nutrition.碳水)

    if ([p, f, c].some((n) => Number.isNaN(n))) return

    calories += p * 4 + f * 9 + c * 4
    protein += p
    fat += f
    carbs += c
  })

  totalNutrition.calories = calories.toFixed(1)
  totalNutrition.protein = protein.toFixed(1)
  totalNutrition.fat = fat.toFixed(1)
  totalNutrition.carbs = carbs.toFixed(1)
}

function calculateNutritionTarget() {
  const nutOatW = dinner.nutOatWeight
  const yogurtW = dinner.yogurtMl
  const beefW = dinner.beefJerkyWeight

  const dinnerProtein =
    (dinnerNutOat.protein * nutOatW) / dinnerNutOat.weight +
    (dinnerYogurt.protein * yogurtW) / dinnerYogurt.weight +
    (dinnerBeefJerky.protein * beefW) / dinnerBeefJerky.weight

  const dinnerFat =
    (dinnerNutOat.fat * nutOatW) / dinnerNutOat.weight +
    (dinnerYogurt.fat * yogurtW) / dinnerYogurt.weight +
    (dinnerBeefJerky.fat * beefW) / dinnerBeefJerky.weight

  const dinnerCarbs =
    (dinnerNutOat.carbs * nutOatW) / dinnerNutOat.weight +
    (dinnerYogurt.carbs * yogurtW) / dinnerYogurt.weight +
    (dinnerBeefJerky.carbs * beefW) / dinnerBeefJerky.weight

  let recProtein = 0
  let recFat = 0
  let recCarbs = 0

  if (calculatedResults.value) {
    if (isFastingDay.value) {
      recProtein = Number.parseFloat(calculatedResults.value.fastingProtein)
      recFat = Number.parseFloat(calculatedResults.value.fastingFat)
      recCarbs = Number.parseFloat(calculatedResults.value.fastingCarbs)
    } else {
      recProtein = Number.parseFloat(calculatedResults.value.protein)
      recFat = Number.parseFloat(calculatedResults.value.fat)
      recCarbs = Number.parseFloat(calculatedResults.value.carbs)
    }
  }

  nutritionTarget.protein = String(Math.max(0, Number((recProtein - dinnerProtein).toFixed(1))))
  nutritionTarget.fat = String(Math.max(0, Number((recFat - dinnerFat).toFixed(1))))
  nutritionTarget.carbs = String(Math.max(0, Number((recCarbs - dinnerCarbs).toFixed(1))))
}

function handleMenuUpload(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw
  if (!rawFile) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = String(e.target?.result ?? '')
      const json = JSON.parse(text)
      menuUploadError.value = ''
      menuLoadError.value = ''
      applyMenuData(json)
      calculateCalories()
    } catch {
      menuUploadError.value = '文件格式错误，请上传正确的JSON文件'
    }
  }
  reader.readAsText(rawFile)
}

onMounted(() => {
  loadInitialData()
})

watch(isFastingDay, () => {
  calculateNutritionTarget()
})

watch(calculatedResults, () => {
  calculateNutritionTarget()
})

watch(
  dinner,
  () => {
    calculateNutritionTarget()
  },
  { deep: true }
)

// 下面两份数据用于在站点未提供 json 文件时作为兜底
const eat_json: MenuData = {
  "周一": {
    "南瓜粥": {"碳水": "7.9", "蛋白质": "1.4", "脂肪": "0.3"},
    "卤蛋/白水煮鸡蛋": {"碳水": "1.3", "蛋白质": "12.8", "脂肪": "8.8"},
    "包菜炒蛋": {"碳水": "3.1", "蛋白质": "7.5", "脂肪": "9.2"},
    "烤番茄/蒸包子": {"碳水": "3.6", "蛋白质": "1.1", "脂肪": "0.2"},
    "白吐司": {"碳水": "49.0", "蛋白质": "8.3", "脂肪": "3.2"},
    "杏鲍菇炒鸡胸肉": {"碳水": "4.2", "蛋白质": "18.5", "脂肪": "3.1"},
    "洋葱炒肉": {"碳水": "3.8", "蛋白质": "12.1", "脂肪": "6.5"},
    "炝炒大白菜": {"碳水": "3.2", "蛋白质": "1.5", "脂肪": "0.2"},
    "清炒油麦": {"碳水": "2.1", "蛋白质": "1.4", "脂肪": "0.4"},
    "清炒菜苔": {"碳水": "3.0", "蛋白质": "2.0", "脂肪": "0.3"},
    "清炒儿菜": {"碳水": "2.5", "蛋白质": "1.6", "脂肪": "0.2"},
    "泡包菜": {"碳水": "4.1", "蛋白质": "1.2", "脂肪": "0.1"},
    "牛奶": {"碳水": "4.8", "蛋白质": "3.2", "脂肪": "3.8"},
    "豆浆": {"碳水": "1.5", "蛋白质": "3.0", "脂肪": "1.6"},
    "南瓜牛奶汁": {"碳水": "8.2", "蛋白质": "2.1", "脂肪": "2.5"}
  },
  "周二": {
    "小米粥": {"碳水": "8.4", "蛋白质": "1.4", "脂肪": "0.7"},
    "蒸鸡蛋": {"碳水": "1.5", "蛋白质": "12.5", "脂肪": "8.8"},
    "西红柿炒蛋": {"碳水": "3.4", "蛋白质": "8.2", "脂肪": "9.6"},
    "手工水饺/蒸烧麦": {"碳水": "25.0", "蛋白质": "6.8", "脂肪": "6.8"},
    "白吐司": {"碳水": "49.0", "蛋白质": "8.3", "脂肪": "3.2"},
    "榛菜炒肉": {"碳水": "3.5", "蛋白质": "13.2", "脂肪": "7.1"},
    "莴笋丝炒肉": {"碳水": "3.3", "蛋白质": "12.8", "脂肪": "6.8"},
    "炝炒生菜": {"碳水": "2.2", "蛋白质": "1.4", "脂肪": "0.2"},
    "清炒水白菜": {"碳水": "2.8", "蛋白质": "1.5", "脂肪": "0.2"},
    "清炒包菜": {"碳水": "4.6", "蛋白质": "1.5", "脂肪": "0.2"},
    "清炒豆芽": {"碳水": "3.0", "蛋白质": "4.5", "脂肪": "0.3"},
    "脆瓜": {"碳水": "2.5", "蛋白质": "0.9", "脂肪": "0.1"},
    "牛奶": {"碳水": "4.8", "蛋白质": "3.2", "脂肪": "3.8"},
    "豆浆": {"碳水": "1.5", "蛋白质": "3.0", "脂肪": "1.6"},
    "玉米浆": {"碳水": "10.6", "蛋白质": "3.5", "脂肪": "1.0"}
  },
  "周三": {
    "菜粥": {"碳水": "7.9", "蛋白质": "1.4", "脂肪": "1.2"},
    "茶叶蛋": {"碳水": "3.5", "蛋白质": "12.6", "脂肪": "8.5"},
    "胡萝卜炒蛋": {"碳水": "4.2", "蛋白质": "7.8", "脂肪": "9.3"},
    "鸡蛋饼/蒸馒头": {"碳水": "50.0", "蛋白质": "7.0", "脂肪": "1.1"},
    "白吐司": {"碳水": "49.0", "蛋白质": "8.3", "脂肪": "3.2"},
    "西葫芦炒肉": {"碳水": "3.8", "蛋白质": "12.5", "脂肪": "6.9"},
    "豌豆片炒鸡胸肉": {"碳水": "5.1", "蛋白质": "19.2", "脂肪": "3.3"},
    "炝炒包菜": {"碳水": "4.6", "蛋白质": "1.5", "脂肪": "0.2"},
    "清炒菜苔": {"碳水": "3.0", "蛋白质": "2.0", "脂肪": "0.3"},
    "清炒菠菜": {"碳水": "3.6", "蛋白质": "2.6", "脂肪": "0.3"},
    "家常豆腐": {"碳水": "2.6", "蛋白质": "8.1", "脂肪": "4.2"},
    "泡萝卜": {"碳水": "3.8", "蛋白质": "1.1", "脂肪": "0.1"},
    "牛奶": {"碳水": "4.8", "蛋白质": "3.2", "脂肪": "3.8"},
    "豆浆": {"碳水": "1.5", "蛋白质": "3.0", "脂肪": "1.6"},
    "米浆": {"碳水": "9.2", "蛋白质": "2.8", "脂肪": "0.8"}
  },
  "周四": {
    "咸蛋瘦肉粥": {"碳水": "8.5", "蛋白质": "3.2", "脂肪": "2.1"},
    "煎鸡蛋": {"碳水": "1.3", "蛋白质": "13.3", "脂肪": "10.5"},
    "西红柿炒蛋": {"碳水": "3.4", "蛋白质": "8.2", "脂肪": "9.6"},
    "蒸红薯/蒸花卷": {"碳水": "20.1", "蛋白质": "1.6", "脂肪": "0.2"},
    "白吐司": {"碳水": "49.0", "蛋白质": "8.3", "脂肪": "3.2"},
    "花菜炒肉": {"碳水": "4.1", "蛋白质": "12.8", "脂肪": "7.2"},
    "葱烧鸡胸肉": {"碳水": "3.5", "蛋白质": "20.1", "脂肪": "3.5"},
    "炝炒油麦": {"碳水": "2.1", "蛋白质": "1.4", "脂肪": "0.4"},
    "清炒小白菜": {"碳水": "2.3", "蛋白质": "1.5", "脂肪": "0.2"},
    "清炒大白菜": {"碳水": "3.2", "蛋白质": "1.5", "脂肪": "0.2"},
    "油渣莲白": {"碳水": "5.2", "蛋白质": "1.8", "脂肪": "12.5"},
    "豆腐乳": {"碳水": "4.8", "蛋白质": "8.2", "脂肪": "8.1"},
    "牛奶": {"碳水": "4.8", "蛋白质": "3.2", "脂肪": "3.8"},
    "豆浆": {"碳水": "1.5", "蛋白质": "3.0", "脂肪": "1.6"},
    "绿豆薏米豆浆": {"碳水": "2.8", "蛋白质": "3.5", "脂肪": "1.8"}
  },
  "周五": {
    "玉米粥": {"碳水": "10.2", "蛋白质": "2.0", "脂肪": "0.8"},
    "卤蛋/蒸鸡蛋": {"碳水": "1.3", "蛋白质": "12.8", "脂肪": "8.8"},
    "包菜炒蛋": {"碳水": "3.1", "蛋白质": "7.5", "脂肪": "9.2"},
    "手工水饺/蒸包子": {"碳水": "25.0", "蛋白质": "6.8", "脂肪": "6.8"},
    "白吐司": {"碳水": "49.0", "蛋白质": "8.3", "脂肪": "3.2"},
    "黄瓜炒肉": {"碳水": "3.2", "蛋白质": "13.1", "脂肪": "6.9"},
    "豆干炒肉": {"碳水": "4.5", "蛋白质": "15.2", "脂肪": "7.5"},
    "炝炒水白菜": {"碳水": "2.8", "蛋白质": "1.5", "脂肪": "0.2"},
    "清炒菜苔": {"碳水": "3.0", "蛋白质": "2.0", "脂肪": "0.3"},
    "清炒生菜": {"碳水": "2.2", "蛋白质": "1.4", "脂肪": "0.2"},
    "清炒西兰花": {"碳水": "5.7", "蛋白质": "3.1", "脂肪": "4.2"},
    "酱黄瓜": {"碳水": "3.4", "蛋白质": "3.0", "脂肪": "0.3"},
    "牛奶": {"碳水": "4.8", "蛋白质": "3.2", "脂肪": "3.8"},
    "豆浆": {"碳水": "1.5", "蛋白质": "3.0", "脂肪": "1.6"},
    "南瓜牛奶汁": {"碳水": "8.2", "蛋白质": "2.1", "脂肪": "2.5"}
  },
  "周六": {
    "南瓜粥": {"碳水": "7.9", "蛋白质": "1.4", "脂肪": "0.3"},
    "小葱煎蛋": {"碳水": "1.8", "蛋白质": "12.9", "脂肪": "11.2"},
    "青椒炒蛋": {"碳水": "2.3", "蛋白质": "7.2", "脂肪": "9.2"},
    "油条": {"碳水": "50.1", "蛋白质": "6.9", "脂肪": "17.6"},
    "三明治": {"碳水": "35.2", "蛋白质": "10.5", "脂肪": "8.5"},
    "杏鲍菇炒鸡胸肉": {"碳水": "4.2", "蛋白质": "18.5", "脂肪": "3.1"},
    "炝炒油麦": {"碳水": "2.1", "蛋白质": "1.4", "脂肪": "0.4"},
    "清炒水白菜": {"碳水": "2.8", "蛋白质": "1.5", "脂肪": "0.2"},
    "泡青菜头": {"碳水": "3.5", "蛋白质": "1.2", "脂肪": "0.1"},
    "牛奶": {"碳水": "4.8", "蛋白质": "3.2", "脂肪": "3.8"},
    "豆浆": {"碳水": "1.5", "蛋白质": "3.0", "脂肪": "1.6"}
  },
  "周日": {
    "白米粥": {"碳水": "9.6", "蛋白质": "1.1", "脂肪": "0.3"},
    "煎鸡蛋": {"碳水": "1.3", "蛋白质": "13.3", "脂肪": "10.5"},
    "西红柿炒蛋": {"碳水": "3.4", "蛋白质": "8.2", "脂肪": "9.6"},
    "韭菜盒子": {"碳水": "45.3", "蛋白质": "7.8", "脂肪": "22.4"},
    "三明治": {"碳水": "35.2", "蛋白质": "10.5", "脂肪": "8.5"},
    "宫保鸡丁": {"碳水": "6.2", "蛋白质": "18.5", "脂肪": "10.2"},
    "炝炒生菜": {"碳水": "2.2", "蛋白质": "1.4", "脂肪": "0.2"},
    "清炒包菜": {"碳水": "4.6", "蛋白质": "1.5", "脂肪": "0.2"},
    "豆腐乳": {"碳水": "4.8", "蛋白质": "8.2", "脂肪": "8.1"},
    "牛奶": {"碳水": "4.8", "蛋白质": "3.2", "脂肪": "3.8"},
    "豆浆": {"碳水": "1.5", "蛋白质": "3.0", "脂肪": "1.6"}
  }
} as any

const sport_json: WorkoutRow[] = [
  {
    "训练日": "周一 / 四",
    "训练部位": "胸",
    "动作名称": "蝴蝶机夹胸",
    "核心动作要领（含颈椎保护）": "坐直、肩胛后收下沉，颈椎中立不抬头，手肘微屈，夹胸顶峰停 1 秒，慢回放",
    "关键备注": "只收胸，不耸肩、不甩腰",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周一 / 四",
    "训练部位": "胸",
    "动作名称": "史密斯卧推",
    "核心动作要领（含颈椎保护）": "肩胛贴凳，下巴微收，杠下到乳头上方，推起不锁肘",
    "关键备注": "腰不过度反弓，护颈护腰",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组 12 次，4 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周一 / 四",
    "训练部位": "胸 / 三头",
    "动作名称": "双杆臂屈伸",
    "核心动作要领（含颈椎保护）": "身体略前倾偏胸，直身偏三头，颈部放松不前探，下放大臂平行即可",
    "关键备注": "不下太低，避免肩撞击",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周一 / 四",
    "训练部位": "三头",
    "动作名称": "绳索下压",
    "核心动作要领（含颈椎保护）": "大臂贴紧身体固定，颈椎中立，仅小臂动，向下压直",
    "关键备注": "不耸肩、不身体后仰借力",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周一 / 四",
    "训练部位": "腹",
    "动作名称": "死虫式",
    "核心动作要领（含颈椎保护）": "平躺，后脑勺轻贴地，下巴微收，对侧手脚伸展，腰始终贴地",
    "关键备注": "不塌腰、不抬头，保护颈椎",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自重"
  },
  {
    "训练日": "周一 / 四",
    "训练部位": "腹",
    "动作名称": "平板支撑",
    "核心动作要领（含颈椎保护）": "肘撑，头部自然延伸，不低不抬，身体一条直线",
    "关键备注": "不塌腰、不翘臀，呼吸均匀",
    "力竭组安排（每组建议次数）": "支撑到力竭为止",
    "常规组重量 (标准 16 次)": "自重"
  },
  {
    "训练日": "周一 / 四",
    "训练部位": "肩",
    "动作名称": "哑铃侧平举",
    "核心动作要领（含颈椎保护）": "手肘微弯，颈椎中立，举到与肩同高，慢下放",
    "关键备注": "不耸肩、不甩臂，防斜方代偿",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周一 / 四",
    "训练部位": "肩",
    "动作名称": "哑铃后束飞鸟",
    "核心动作要领（含颈椎保护）": "俯身、背平直，颈部与脊柱一条线，手肘微弯向后展",
    "关键备注": "后束弱，用极轻重量找感觉",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周二 / 五",
    "训练部位": "背",
    "动作名称": "静态悬吊",
    "核心动作要领（含颈椎保护）": "双手握杠，肩膀下沉，颈椎放松不前引，身体自然悬垂",
    "关键备注": "不耸肩，练握力与背阔激活",
    "力竭组安排（每组建议次数）": "支撑到力竭为止",
    "常规组重量 (标准 16 次)": "自重"
  },
  {
    "训练日": "周二 / 五",
    "训练部位": "背",
    "动作名称": "龙门架高位下拉",
    "核心动作要领（含颈椎保护）": "坐直，下巴微收，拉杆拉至上胸，肩胛下沉后收",
    "关键备注": "不过度后仰，不甩脖子",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组 12 次，4 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周二 / 五",
    "训练部位": "背",
    "动作名称": "俯身绳索划船",
    "核心动作要领（含颈椎保护）": "背平直，颈部中立，拉至小腹，感受中背收缩",
    "关键备注": "腰不弯、头不抬，护腰护颈",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周二 / 五",
    "训练部位": "二头",
    "动作名称": "哑铃弯举",
    "核心动作要领（含颈椎保护）": "大臂贴身体，颈椎中立，只弯小臂，顶峰停顿慢放",
    "关键备注": "不甩臂、不身体借力",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周二 / 五",
    "训练部位": "二头",
    "动作名称": "哑铃锤式弯举",
    "核心动作要领（含颈椎保护）": "拳眼向前，手肘固定，颈部放松，弯举至胸前",
    "关键备注": "侧重肱肌，手腕不弯",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周二 / 五",
    "训练部位": "肩",
    "动作名称": "哑铃侧平举",
    "核心动作要领（含颈椎保护）": "轻重量，颈椎中立，抬至肩高，慢放",
    "关键备注": "小重量多次数，保护肩袖",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周二 / 五",
    "训练部位": "肩",
    "动作名称": "哑铃后束飞鸟",
    "核心动作要领（含颈椎保护）": "俯身，颈部不低头，小幅度后展",
    "关键备注": "专注后束收缩",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周三 / 六",
    "训练部位": "腿",
    "动作名称": "史密斯深蹲",
    "核心动作要领（含颈椎保护）": "后背贴靠，下巴微收，下蹲至大腿平行，膝与脚尖同向",
    "关键备注": "腰不塌，颈椎保持中立",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组 12 次，4 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周三 / 六",
    "训练部位": "腿",
    "动作名称": "坐姿腿屈伸",
    "核心动作要领（含颈椎保护）": "背贴靠背，颈椎放松，慢伸膝，顶峰停 1 秒",
    "关键备注": "不锁死膝盖，减轻关节压力",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组 14 次，3 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周三 / 六",
    "训练部位": "肩",
    "动作名称": "哑铃侧平举",
    "核心动作要领（含颈椎保护）": "轻重量，颈椎中立，抬至肩高慢放",
    "关键备注": "腿训后肩已累，重量减 30%",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  },
  {
    "训练日": "周三 / 六",
    "训练部位": "肩",
    "动作名称": "哑铃后束飞鸟",
    "核心动作要领（含颈椎保护）": "俯身，颈部不低头，小幅度后展",
    "关键备注": "收尾动作，找感觉为主",
    "力竭组安排（每组建议次数）": "1 组 16 次，2 组力竭",
    "常规组重量 (标准 16 次)": "自填"
  }
] as any
</script>

<style scoped>
.calorie-calculator {
  padding: 16px;
}

.col-card {
  margin-bottom: 20px;
  height: 100%;
}

.page-tabs {
  width: 100%;
}

.workout-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.workout-summary {
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.title-section {
  margin: 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.nutrient-item {
  margin-bottom: 8px;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.food-macros {
  display: flex;
  gap: 10px;
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.result-value {
  font-weight: 600;
}

.empty-state {
  padding: 32px 0;
  text-align: center;
  color: var(--vp-c-text-2);
}

.upload-hint,
.error-text {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
}

.error-text {
  color: var(--vp-c-danger-1);
}

.nutrition-tip {
  margin-left: 10px;
  color: var(--vp-c-success-1);
}
</style>
