<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: { type: Object, required: true },
  taskId: { type: String, required: true },
})

function findConstructionTask(project, taskId) {
  for (const m of project.milestones || []) {
    const hit = findTaskInMilestone(m, taskId)
    if (hit) return hit
  }
  return null
}

function findTaskInMilestone(m, taskId) {
  for (const t of m.tasks || []) {
    if (t.id === taskId) return { task: t, scope: '建设类', milestoneName: m.name }
  }
  for (const c of m.children || []) {
    const hit = findTaskInMilestone(c, taskId)
    if (hit) return hit
  }
  return null
}

function findOptimizationTask(project, taskId) {
  const staffing = project.staffing
  if (!staffing) return null
  for (const p of staffing.people || []) {
    for (const t of p.tasks || []) {
      if (t.id === taskId) return { task: t, scope: '日常优化类', assignee: p.user }
    }
  }
  return null
}

const found = computed(() => findConstructionTask(props.project, props.taskId) || findOptimizationTask(props.project, props.taskId))
</script>

<template>
  <div class="wrap">
    <div class="header">
      <div class="title">任务详情</div>
      <div class="meta" v-if="found">
        <span>范围：{{ found.scope }}</span>
        <span v-if="found.milestoneName">里程碑：{{ found.milestoneName }}</span>
      </div>
    </div>

    <div v-if="!found" class="empty">未找到任务</div>

    <div v-else class="body">
      <div class="row">
        <div class="label">任务名称</div>
        <div class="value">{{ found.task.name }}</div>
      </div>
      <div class="row">
        <div class="label">状态</div>
        <div class="value">{{ found.task.status }}</div>
      </div>
      <div class="row">
        <div class="label">负责人</div>
        <div class="value">{{ found.task.assignee || found.assignee || '-' }}</div>
      </div>
      <div class="row">
        <div class="label">计划时间</div>
        <div class="value">{{ found.task.plannedStart || '-' }} ~ {{ found.task.plannedEnd || '-' }}</div>
      </div>
      <div class="row">
        <div class="label">实际时间</div>
        <div class="value">{{ found.task.actualStart || '-' }} ~ {{ found.task.actualEnd || '-' }}</div>
      </div>
      <div class="row">
        <div class="label">进度</div>
        <div class="value">{{ found.task.progress ?? 0 }}%</div>
      </div>
      <div class="row" v-if="found.task.effortHours !== undefined">
        <div class="label">投入小时</div>
        <div class="value">{{ found.task.effortHours }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  background: #fff;
  border: 1px solid #e6e8eb;
  border-radius: 6px;
  overflow: hidden;
}
.header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
}
.title {
  font-weight: 600;
  margin-bottom: 6px;
}
.meta {
  color: #666;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
}
.empty {
  padding: 16px;
  color: #666;
}
.body {
  padding: 12px 16px;
}
.row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}
.row:last-child {
  border-bottom: none;
}
.label {
  color: #666;
}
.value {
  color: #111827;
}
</style>

