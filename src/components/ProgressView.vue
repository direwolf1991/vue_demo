<script setup>
import { computed, ref, watch } from 'vue'
import { PROJECT_TYPES, addLog } from '../data/mock'

const props = defineProps({
  project: { type: Object, required: true },
})

defineEmits(['open-milestone', 'open-task'])

function toDayIndex(isoDate) {
  if (!isoDate) return null
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return null
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function percentColor(p) {
  if (p >= 80) return '#16a34a'
  if (p >= 50) return '#f59e0b'
  return '#dc2626'
}

function barStyle(p) {
  return { width: `${Math.min(100, Math.max(0, p))}%`, background: percentColor(p) }
}

function fillStyle(p) {
  const v = clamp(p || 0, 0, 100)
  return { width: `${v}%`, background: percentColor(v) }
}

const isConstruction = computed(() => props.project.type === PROJECT_TYPES.CONSTRUCTION)
const isOptimization = computed(() => props.project.type === PROJECT_TYPES.OPTIMIZATION)

const showSettings = ref(false)
const collapsed = ref(new Set())
const constructionTab = ref('gantt')
const settingsKey = computed(() => `progress-fields:${props.project.type}`)
const fieldSettings = ref({
  milestoneOwner: true,
  milestonePlan: true,
  milestoneActual: true,
  milestoneProgress: true,
  taskAssignee: true,
  taskStatus: true,
  taskPlan: true,
  taskActual: true,
  taskProgress: true,
})

function loadFieldSettings() {
  try {
    const raw = localStorage.getItem(settingsKey.value)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      fieldSettings.value = { ...fieldSettings.value, ...parsed }
    }
  } catch {
    // ignore
  }
}

watch(
  () => settingsKey.value,
  () => {
    loadFieldSettings()
  },
  { immediate: true }
)

watch(
  () => fieldSettings.value,
  v => {
    try {
      localStorage.setItem(settingsKey.value, JSON.stringify(v))
    } catch {
      // ignore
    }
  },
  { deep: true }
)

function milestoneStats(m) {
  const allTasks = [...(m.tasks || []), ...((m.children || []).flatMap(c => c.tasks || []))]
  const progress = allTasks.length
    ? Math.round(allTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / allTasks.length)
    : 0
  const actualStart = allTasks
    .map(t => t.actualStart)
    .filter(Boolean)
    .sort()[0] || null
  const actualEnd = allTasks
    .map(t => t.actualEnd)
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || null
  const delayWarning = progress < 80 && new Date() > new Date(m.plannedEnd)
  return { progress, actualStart, actualEnd, delayWarning }
}

const projectProgress = computed(() => {
  if (isConstruction.value) {
    const ms = props.project.milestones || []
    const ps = ms.map(m => milestoneStats(m).progress)
    return ms.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ms.length) : 0
  }
  if (isOptimization.value) {
    const staffing = props.project.staffing
    if (!staffing) return 0
    const allTasks = staffing.people.flatMap(p => p.tasks || [])
    return allTasks.length
      ? Math.round(allTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / allTasks.length)
      : 0
  }
  return 0
})

const usageRate = computed(() => {
  if (!isOptimization.value) return null
  const staffing = props.project.staffing
  if (!staffing || !staffing.contractAmount) return 0
  const invested = staffing.people.reduce((sum, p) => {
    const hours = (p.tasks || []).reduce((h, t) => h + (t.effortHours || 0), 0)
    return sum + hours * (p.pricePerHour || 0)
  }, 0)
  return Math.round((invested / staffing.contractAmount) * 100)
})

const dualWarning = computed(() => {
  if (!isOptimization.value) return false
  const u = usageRate.value || 0
  const pp = projectProgress.value || 0
  return u < 60 && pp > 80
})

function manualAdjust(delta) {
  // 仅演示：记录日志，不修改数据
  addLog('手动调整进度', `项目【${props.project.code}】${props.project.name} 调整 ${delta > 0 ? '+' : ''}${delta}%`)
}

function makeRow({ key, label, start, end, progress, level, type, parentKey, owner }) {
  return {
    key,
    label,
    start,
    end,
    progress: progress || 0,
    level: level || 0,
    type: type || 'task',
    parentKey: parentKey || null,
    hasChildren: false,
    owner: owner || null,
  }
}

function idxToDate(idx) {
  return new Date(idx * 86400000)
}

function businessDays(isoStart, isoEnd) {
  const s = toDayIndex(isoStart)
  const e = toDayIndex(isoEnd)
  if (s === null || e === null || e < s) return 0
  let count = 0
  for (let i = s; i <= e; i++) {
    const day = idxToDate(i).getUTCDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

const ganttModel = computed(() => {
  const rows = []

  if (isConstruction.value) {
    for (const m of props.project.milestones || []) {
      const ms = milestoneStats(m)
      rows.push(
        makeRow({
          key: `m:${m.id}`,
          label: m.name,
          start: m.plannedStart,
          end: m.plannedEnd,
          progress: ms.progress,
          level: 0,
          type: 'milestone',
          parentKey: null,
          owner: m.owner || null,
        })
      )

      for (const t of m.tasks || []) {
        rows.push(
          makeRow({
            key: `t:${t.id}`,
            label: t.name,
            start: t.plannedStart,
            end: t.plannedEnd,
            progress: t.progress,
            level: 1,
            type: 'task',
            parentKey: `m:${m.id}`,
            owner: t.assignee || null,
          })
        )
      }

      for (const c of m.children || []) {
        rows.push(
          makeRow({
            key: `m:${c.id}`,
            label: c.name,
            start: c.plannedStart,
            end: c.plannedEnd,
            progress: milestoneStats({ ...c, children: [] }).progress,
            level: 1,
            type: 'milestone',
            parentKey: `m:${m.id}`,
            owner: c.owner || null,
          })
        )
        for (const t of c.tasks || []) {
          rows.push(
            makeRow({
              key: `t:${t.id}`,
              label: t.name,
              start: t.plannedStart,
              end: t.plannedEnd,
              progress: t.progress,
              level: 2,
              type: 'task',
              parentKey: `m:${c.id}`,
              owner: t.assignee || null,
            })
          )
        }
      }
    }
  }

  if (isOptimization.value) {
    const phases = props.project.phases || []
    const fallbackStart = props.project.startDate
    const fallbackEnd = props.project.endDate
    if (phases.length) {
      for (const ph of phases) {
        const pTasks = ph.tasks || []
        const taskStarts = pTasks.map(t => t.plannedStart).filter(Boolean)
        const taskEnds = pTasks.map(t => t.plannedEnd).filter(Boolean)
        const phaseStart = taskStarts.sort()[0] || ph.plannedStart || fallbackStart
        const phaseEnd = taskEnds.sort().slice(-1)[0] || ph.plannedEnd || fallbackEnd
        const phaseProgress = pTasks.length
          ? Math.round(pTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / pTasks.length)
          : 0
        rows.push(
          makeRow({
            key: `ph:${ph.id}`,
            label: ph.name,
            start: phaseStart,
            end: phaseEnd,
            progress: phaseProgress,
            level: 0,
            type: 'phase',
            parentKey: null,
            owner: ph.owner || null,
          })
        )
        for (const t of pTasks) {
          rows.push(
            makeRow({
              key: `t:${t.id}`,
              label: t.name,
              start: t.plannedStart || fallbackStart,
              end: t.plannedEnd || fallbackEnd,
              progress: t.progress,
              level: 1,
              type: 'task',
              parentKey: `ph:${ph.id}`,
              owner: t.assignee || null,
            })
          )
        }
      }
    } else {
      // 回退：按人员分组（无阶段数据时）
      const staffing = props.project.staffing
      for (const p of staffing?.people || []) {
        const taskStarts = (p.tasks || []).map(t => t.plannedStart).filter(Boolean)
        const taskEnds = (p.tasks || []).map(t => t.plannedEnd).filter(Boolean)
        const groupStart = taskStarts.sort()[0] || fallbackStart
        const groupEnd = taskEnds.sort().slice(-1)[0] || fallbackEnd
        const groupProgress = (p.tasks || []).length
          ? Math.round((p.tasks || []).reduce((sum, t) => sum + (t.progress || 0), 0) / (p.tasks || []).length)
          : 0
        rows.push(
          makeRow({
            key: `p:${p.user}`,
            label: p.user,
            start: groupStart,
            end: groupEnd,
            progress: groupProgress,
            level: 0,
            type: 'group',
            parentKey: null,
            owner: p.user || null,
          })
        )
        for (const t of p.tasks || []) {
          rows.push(
            makeRow({
              key: `t:${t.id}`,
              label: t.name,
              start: t.plannedStart || fallbackStart,
              end: t.plannedEnd || fallbackEnd,
              progress: t.progress,
              level: 1,
              type: 'task',
              parentKey: `p:${p.user}`,
              owner: t.assignee || null,
            })
          )
        }
      }
    }
  }

  // 标注是否有子节点
  const childrenByParent = new Map()
  for (const r of rows) {
    if (r.parentKey) {
      childrenByParent.set(r.parentKey, (childrenByParent.get(r.parentKey) || 0) + 1)
    }
  }
  for (const r of rows) {
    r.hasChildren = !!childrenByParent.get(r.key)
  }

  const mapped = rows
    .map(r => ({
      ...r,
      startIdx: toDayIndex(r.start),
      endIdx: toDayIndex(r.end),
    }))
    .filter(r => r.startIdx !== null && r.endIdx !== null && r.endIdx >= r.startIdx)

  const startIdx = mapped.length ? Math.min(...mapped.map(r => r.startIdx)) : null
  const endIdx = mapped.length ? Math.max(...mapped.map(r => r.endIdx)) : null
  const totalDays = startIdx !== null && endIdx !== null ? Math.max(1, endIdx - startIdx + 1) : 1

  const parentMap = new Map(mapped.map(r => [r.key, r.parentKey]))
  function hasCollapsedAncestor(r) {
    let k = r.parentKey
    while (k) {
      if (collapsed.value.has(k)) return true
      k = parentMap.get(k) || null
    }
    return false
  }
  const visibleRows = mapped
    .filter(r => !hasCollapsedAncestor(r))
    .map(r => {
      const left = ((r.startIdx - startIdx) / totalDays) * 100
      const width = ((r.endIdx - r.startIdx + 1) / totalDays) * 100
      return {
        ...r,
        layout: { left: `${clamp(left, 0, 100)}%`, width: `${clamp(width, 0, 100)}%` },
      }
    })

  const tickCount = 6
  const ticks = startIdx === null
    ? []
    : Array.from({ length: tickCount }, (_, i) => {
        const tIdx = Math.round(startIdx + (i * (totalDays - 1)) / (tickCount - 1))
        const left = (i / (tickCount - 1)) * 100
        const d = new Date(tIdx * 86400000)
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(d.getUTCDate()).padStart(2, '0')
        return { key: `tick:${tIdx}`, left: `${left}%`, label: `${mm}-${dd}` }
      })

  return { rows: visibleRows, ticks }
})

function toggleCollapse(key) {
  const set = new Set(collapsed.value)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  collapsed.value = set
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <div class="title">项目进度 · {{ project.name }}（{{ project.type }}）</div>
      <div class="toolbar">
        <div class="bar">
          <div class="bar-inner" :style="barStyle(projectProgress)"></div>
        </div>
        <span class="percent">{{ projectProgress }}%</span>
        <button class="btn" @click="manualAdjust(5)">+5%</button>
        <button class="btn" @click="manualAdjust(-5)">-5%</button>
        <button v-if="isConstruction && constructionTab==='milestone'" class="btn" @click="showSettings=true">设置</button>
      </div>
    </div>

    <div v-if="isConstruction" class="section">
      <div class="tabs">
        <button class="tab-item" :class="{ active: constructionTab==='gantt' }" @click="constructionTab='gantt'">甘特图</button>
        <button class="tab-item" :class="{ active: constructionTab==='milestone' }" @click="constructionTab='milestone'">里程碑</button>
      </div>
      <div v-if="constructionTab==='gantt'" class="subtitle">甘特图</div>
      <div class="gantt" v-if="constructionTab==='gantt'">
        <div class="gantt-head">
          <div class="gantt-left">名称</div>
          <div class="timeline">
            <div class="gantt-ticks">
              <span v-for="t in ganttModel.ticks" :key="t.key" class="tick" :style="{ left: t.left }">{{ t.label }}</span>
            </div>
          </div>
        </div>
        <div class="gantt-body">
          <div v-for="r in ganttModel.rows" :key="r.key" class="gantt-row">
            <div class="gantt-left">
              <div class="gantt-label" :style="{ paddingLeft: `${r.level * 14}px` }">
                <span v-if="r.hasChildren" class="caret" @click="toggleCollapse(r.key)">{{ collapsed.has(r.key) ? '▸' : '▾' }}</span>
                <span>{{ r.label }}</span>
              </div>
            </div>
            <div class="timeline">
              <div class="gantt-track">
                <div class="gantt-bar" :class="r.type" :style="r.layout">
                  <div class="gantt-fill" :style="fillStyle(r.progress)"></div>
                  <div class="gantt-percent">{{ r.progress }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="constructionTab==='milestone'" class="subtitle" style="margin-top: 12px">里程碑树状列表（任务明细）</div>
      <div v-if="constructionTab==='milestone'" class="tree">
        <div v-for="m in project.milestones" :key="m.id" class="node">
          <div class="node-header">
            <div class="node-title">
              <a class="link" href="javascript:void(0)" @click="$emit('open-milestone', m.id)">{{ m.name }}</a>
            </div>
            <div class="node-meta">
              <span v-if="fieldSettings.milestoneOwner">负责人：{{ m.owner }}</span>
              <span v-if="fieldSettings.milestonePlan">计划：{{ m.plannedStart }} ~ {{ m.plannedEnd }}</span>
              <span v-if="fieldSettings.milestoneActual">实际：{{ milestoneStats(m).actualStart || '-' }} ~ {{ milestoneStats(m).actualEnd || '-' }}</span>
            </div>
            <div v-if="fieldSettings.milestoneProgress" class="node-progress">
              <div class="bar small"><div class="bar-inner" :style="barStyle(milestoneStats(m).progress)"></div></div>
              <span class="percent">{{ milestoneStats(m).progress }}%</span>
              <span v-if="milestoneStats(m).delayWarning" class="warn">延期预警</span>
            </div>
          </div>
          <div class="node-body">
            <div class="list-title">任务列表</div>
            <table class="table">
              <thead>
                <tr>
                  <th>任务</th>
                  <th v-if="fieldSettings.taskAssignee">执行人</th>
                  <th v-if="fieldSettings.taskStatus">状态</th>
                  <th v-if="fieldSettings.taskPlan">计划</th>
                  <th v-if="fieldSettings.taskActual">实际</th>
                  <th v-if="fieldSettings.taskProgress">进度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in m.tasks" :key="t.id">
                  <td>
                    <a class="link" href="javascript:void(0)" @click="$emit('open-task', t.id)">{{ t.name }}</a>
                  </td>
                  <td v-if="fieldSettings.taskAssignee">{{ t.assignee }}</td>
                  <td v-if="fieldSettings.taskStatus">{{ t.status }}</td>
                  <td v-if="fieldSettings.taskPlan">{{ t.plannedStart }} ~ {{ t.plannedEnd }}</td>
                  <td v-if="fieldSettings.taskActual">{{ t.actualStart || '-' }} ~ {{ t.actualEnd || '-' }}</td>
                  <td v-if="fieldSettings.taskProgress">
                    <div class="bar tiny"><div class="bar-inner" :style="barStyle(t.progress)"></div></div>
                    <span class="percent small">{{ t.progress }}%</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-for="c in (m.children || [])" :key="c.id" class="child">
              <div class="child-header">
                <div class="node-title">
                  <a class="link" href="javascript:void(0)" @click="$emit('open-milestone', c.id)">{{ c.name }}</a>
                </div>
                <div class="node-meta">
                  <span v-if="fieldSettings.milestoneOwner">负责人：{{ c.owner }}</span>
                  <span v-if="fieldSettings.milestonePlan">计划：{{ c.plannedStart }} ~ {{ c.plannedEnd }}</span>
                  <span v-if="fieldSettings.milestoneActual">实际：{{ milestoneStats({ ...c, children: [] }).actualStart || '-' }} ~ {{ milestoneStats({ ...c, children: [] }).actualEnd || '-' }}</span>
                </div>
              </div>
              <table class="table">
                <thead>
                  <tr>
                    <th>任务</th>
                    <th v-if="fieldSettings.taskAssignee">执行人</th>
                    <th v-if="fieldSettings.taskStatus">状态</th>
                    <th v-if="fieldSettings.taskPlan">计划</th>
                    <th v-if="fieldSettings.taskActual">实际</th>
                    <th v-if="fieldSettings.taskProgress">进度</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in c.tasks" :key="t.id">
                    <td>
                      <a class="link" href="javascript:void(0)" @click="$emit('open-task', t.id)">{{ t.name }}</a>
                    </td>
                    <td v-if="fieldSettings.taskAssignee">{{ t.assignee }}</td>
                    <td v-if="fieldSettings.taskStatus">{{ t.status }}</td>
                    <td v-if="fieldSettings.taskPlan">{{ t.plannedStart }} ~ {{ t.plannedEnd }}</td>
                    <td v-if="fieldSettings.taskActual">{{ t.actualStart || '-' }} ~ {{ t.actualEnd || '-' }}</td>
                    <td v-if="fieldSettings.taskProgress">
                      <div class="bar tiny"><div class="bar-inner" :style="barStyle(t.progress)"></div></div>
                      <span class="percent small">{{ t.progress }}%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isOptimization" class="section">
      <div class="subtitle">甘特图</div>
      <div class="gantt">
        <div class="gantt-head">
          <div class="gantt-left">名称</div>
          <div class="timeline">
            <div class="gantt-ticks">
              <span v-for="t in ganttModel.ticks" :key="t.key" class="tick" :style="{ left: t.left }">{{ t.label }}</span>
            </div>
          </div>
        </div>
        <div class="gantt-body">
          <div v-for="r in ganttModel.rows" :key="r.key" class="gantt-row">
            <div class="gantt-left">
              <div class="gantt-label" :style="{ paddingLeft: `${r.level * 14}px` }">
                <span v-if="r.hasChildren" class="caret" @click="toggleCollapse(r.key)">{{ collapsed.has(r.key) ? '▸' : '▾' }}</span>
                <span>{{ r.label }}</span>
              </div>
            </div>
            <div class="timeline">
              <div class="gantt-track">
                <div class="gantt-bar" :class="r.type" :style="r.layout">
                  <div class="gantt-fill" :style="fillStyle(r.progress)"></div>
                  <div class="gantt-percent">{{ r.progress }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="subtitle" style="margin-top: 12px">人员 - 任务清单与人力使用率</div>
      <div class="summary">
        <span>合同金额：{{ project.staffing.contractAmount.toFixed(2) }}</span>
        <span>人力使用率：</span>
        <div class="bar small"><div class="bar-inner" :style="barStyle(usageRate ?? 0)"></div></div>
        <span class="percent">{{ usageRate ?? 0 }}%</span>
        <span v-if="dualWarning" class="warn">预警：使用率＜60% 且 周期进度＞80%</span>
      </div>
      <div class="tree">
        <div v-for="p in project.staffing.people" :key="p.user" class="node">
          <div class="node-header">
            <div class="node-title">{{ p.user }}</div>
            <div class="node-meta">
              <span>单价：{{ p.pricePerHour }}/小时</span>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>任务</th>
                <th>状态</th>
                <th>投入小时</th>
                <th>进度</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in p.tasks" :key="t.id">
                <td>
                  <a class="link" href="javascript:void(0)" @click="$emit('open-task', t.id)">{{ t.name }}</a>
                </td>
                <td>{{ t.status }}</td>
                <td>{{ t.effortHours }}</td>
                <td>
                  <div class="bar tiny"><div class="bar-inner" :style="barStyle(t.progress)"></div></div>
                  <span class="percent small">{{ t.progress }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showSettings" class="modal">
    <div class="modal-content" style="width: 640px">
      <div class="modal-header">
        <div class="title">进度字段设置</div>
        <button class="btn" @click="showSettings=false">关闭</button>
      </div>
      <div class="form" style="padding: 12px 16px">
        <div class="grid">
          <label class="chk"><input type="checkbox" v-model="fieldSettings.milestoneOwner" />里程碑：负责人</label>
          <label class="chk"><input type="checkbox" v-model="fieldSettings.milestonePlan" />里程碑：计划时间</label>
          <label class="chk"><input type="checkbox" v-model="fieldSettings.milestoneActual" />里程碑：实际时间</label>
          <label class="chk"><input type="checkbox" v-model="fieldSettings.milestoneProgress" />里程碑：进度/预警</label>
          <label class="chk"><input type="checkbox" v-model="fieldSettings.taskAssignee" />任务：执行人</label>
          <label class="chk"><input type="checkbox" v-model="fieldSettings.taskStatus" />任务：状态</label>
          <label class="chk"><input type="checkbox" v-model="fieldSettings.taskPlan" />任务：计划时间</label>
          <label class="chk"><input type="checkbox" v-model="fieldSettings.taskActual" />任务：实际时间</label>
          <label class="chk"><input type="checkbox" v-model="fieldSettings.taskProgress" />任务：进度</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn primary" @click="showSettings=false">完成</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e6e8eb;
  border-radius: 6px;
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e6e8eb;
}
.title {
  font-weight: 600;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar {
  width: 200px;
  height: 9px;
  background: #f3f4f6;
  border: 1px solid #e6e8eb;
  border-radius: 10px;
  overflow: hidden;
}
.bar.small {
  width: 140px;
  height: 7px;
}
.bar.tiny {
  width: 90px;
  height: 5px;
}
.bar-inner {
  height: 100%;
}
.percent {
  font-weight: 600;
}
.percent.small {
  font-size: 12px;
  font-weight: 500;
  color: #555;
}
.section {
  padding: 10px 12px;
}
.subtitle {
  font-weight: 600;
  margin-bottom: 6px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.tab-item {
  background: #f3f4f6;
  border: 1px solid #e6e8eb;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
}
.tab-item.active {
  background: #fff;
  border-color: #c9ced6;
}
.gantt {
  border: 1px solid #e6e8eb;
  border-radius: 6px;
  overflow: hidden;
}
.grid {
  display: grid;
  grid-template-columns: 220px 120px 110px 110px 80px 1fr;
}
.gantt-head {
  display: grid;
  grid-template-columns: 240px 1fr;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
}
.gantt-left {
  padding: 8px 10px;
  border-right: 1px solid #f0f2f5;
  color: #333;
  font-size: 13px;
}
.hcell, .cell {
  padding: 6px 8px;
  border-right: 1px solid #f0f2f5;
  color: #333;
  font-size: 12px;
}
.hcell:last-child, .cell:last-child {
  border-right: none;
}
.timeline {
  position: relative;
  min-height: 30px;
}
.gantt-ticks {
  position: absolute;
  inset: 0;
}
.tick {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}
.gantt-body .gantt-row {
  display: grid;
  grid-template-columns: 240px 1fr;
  border-bottom: 1px solid #f0f2f5;
}
.gantt-body .gantt-row:last-child {
  border-bottom: none;
}
.gantt-label {
  font-size: 12px;
  color: #1f2937;
  line-height: 20px;
}
.caret {
  display: inline-block;
  width: 16px;
  color: #374151;
  cursor: pointer;
  user-select: none;
}
.gantt-track {
  position: relative;
  height: 30px;
  background: repeating-linear-gradient(
    to right,
    rgba(15, 23, 42, 0.04),
    rgba(15, 23, 42, 0.04) 1px,
    transparent 1px,
    transparent 40px
  );
}
.gantt-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 10px;
  background: rgba(31, 142, 241, 0.18);
  border: 1px solid rgba(31, 142, 241, 0.35);
  border-radius: 6px;
  overflow: hidden;
}
.gantt-bar.milestone {
  background: rgba(99, 102, 241, 0.16);
  border-color: rgba(99, 102, 241, 0.35);
  height: 11px;
}
.gantt-bar.group {
  background: rgba(148, 163, 184, 0.18);
  border-color: rgba(148, 163, 184, 0.35);
}
.gantt-fill {
  height: 100%;
}
.gantt-percent {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #111827;
  pointer-events: none;
}
.tree .node {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  margin-bottom: 8px;
}
.node-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  padding: 8px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
}
.node-title {
  font-weight: 600;
}
.node-meta {
  display: flex;
  gap: 10px;
  color: #666;
}
.node-progress {
  display: flex;
  align-items: center;
  gap: 6px;
}
.node-body {
  padding: 8px;
}
.list-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  border-bottom: 1px solid #f0f2f5;
  padding: 5px 6px;
  text-align: left;
  font-size: 12px;
}
.child {
  margin-top: 8px;
}
.child-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  color: #555;
}
.warn {
  color: #d03a2e;
  font-size: 11px;
  font-weight: 600;
}
.btn {
  background: #f3f4f6;
  border: 1px solid #c9ced6;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e6e8eb;
  overflow: hidden;
}
.modal-header, .modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
}
.modal-footer {
  border-top: 1px solid #f0f2f5;
  border-bottom: none;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px 12px;
}
.chk {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
  font-size: 13px;
}
.link {
  color: #1f8ef1;
  text-decoration: none;
}
.link:hover {
  color: #1773c2;
}
</style>
