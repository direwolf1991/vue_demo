<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: { type: Object, required: true },
  milestoneId: { type: String, required: true },
})

const emit = defineEmits(['open-task'])

function buildMilestoneIndex(milestones, parent = null, map = new Map()) {
  for (const m of milestones || []) {
    map.set(m.id, { milestone: m, parentId: parent?.id || null })
    if (m.children?.length) buildMilestoneIndex(m.children, m, map)
  }
  return map
}

function collectTasks(milestone) {
  const list = []
  for (const t of milestone.tasks || []) list.push(t)
  for (const c of milestone.children || []) list.push(...collectTasks(c))
  return list
}

const milestoneIndex = computed(() => buildMilestoneIndex(props.project.milestones || []))
const current = computed(() => milestoneIndex.value.get(props.milestoneId)?.milestone || null)
const tasks = computed(() => (current.value ? collectTasks(current.value) : []))
</script>

<template>
  <div class="wrap">
    <div class="header">
      <div class="title">里程碑任务列表</div>
      <div class="meta" v-if="current">
        <span>里程碑：{{ current.name }}</span>
        <span>负责人：{{ current.owner }}</span>
        <span>计划：{{ current.plannedStart }} ~ {{ current.plannedEnd }}</span>
      </div>
    </div>

    <div v-if="!current" class="empty">未找到里程碑</div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>任务名称</th>
          <th>负责人</th>
          <th>状态</th>
          <th>计划</th>
          <th>实际</th>
          <th>进度</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tasks" :key="t.id">
          <td>
            <a class="link" href="javascript:void(0)" @click="emit('open-task', t.id)">{{ t.name }}</a>
          </td>
          <td>{{ t.assignee }}</td>
          <td>{{ t.status }}</td>
          <td>{{ t.plannedStart }} ~ {{ t.plannedEnd }}</td>
          <td>{{ t.actualStart || '-' }} ~ {{ t.actualEnd || '-' }}</td>
          <td>{{ t.progress }}%</td>
        </tr>
      </tbody>
    </table>
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
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  border-bottom: 1px solid #f0f2f5;
  padding: 6px 8px;
  text-align: left;
  font-size: 12px;
}
.link {
  color: #1f8ef1;
  text-decoration: none;
}
.link:hover {
  color: #1773c2;
}
</style>
