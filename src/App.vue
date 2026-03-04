<script setup>
import { ref, computed } from 'vue'
import ProjectList from './components/ProjectList.vue'
import ProgressView from './components/ProgressView.vue'
import MilestoneTasks from './components/MilestoneTasks.vue'
import TaskDetail from './components/TaskDetail.vue'
import PlaceholderPage from './components/PlaceholderPage.vue'
import { state } from './data/mock'

const primaryMenu = ref('项目')
const secondaryMenu = ref('进度')
const currentProjectId = ref(null)
const page = ref('progress')
const currentMilestoneId = ref(null)
const currentTaskId = ref(null)

const currentProject = computed(() =>
  state.projects.find(p => p.id === currentProjectId.value) || null
)

function openProgress(projectId) {
  currentProjectId.value = projectId
  secondaryMenu.value = '进度'
  page.value = 'progress'
  currentMilestoneId.value = null
  currentTaskId.value = null
}

function openSecondary(tab) {
  secondaryMenu.value = tab
  currentMilestoneId.value = null
  currentTaskId.value = null
  if (tab === '进度') page.value = 'progress'
  if (tab === '项目总览') page.value = 'overview'
  if (tab === '需求') page.value = 'requirements'
}

function openMilestone(milestoneId) {
  currentMilestoneId.value = milestoneId
  currentTaskId.value = null
  secondaryMenu.value = '进度'
  page.value = 'milestoneTasks'
}

function openTask(taskId) {
  currentTaskId.value = taskId
  secondaryMenu.value = '进度'
  page.value = 'taskDetail'
}

function backToProgress() {
  currentMilestoneId.value = null
  currentTaskId.value = null
  secondaryMenu.value = '进度'
  page.value = 'progress'
}

function backToList() {
  currentProjectId.value = null
  page.value = 'progress'
  secondaryMenu.value = '进度'
  currentMilestoneId.value = null
  currentTaskId.value = null
}
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <div class="brand">禅道风格 · 项目管理 Demo</div>
      <nav class="menu">
        <button class="menu-item" :class="{ active: primaryMenu === '项目' }">项目</button>
      </nav>
    </header>

    <div class="subbar" v-if="currentProject">
      <div class="submenus">
        <button class="submenu-item" :class="{ active: secondaryMenu === '进度' }" @click="openSecondary('进度')">进度</button>
        <button class="submenu-item" :class="{ active: secondaryMenu === '项目总览' }" @click="openSecondary('项目总览')">项目总览</button>
        <button class="submenu-item" :class="{ active: secondaryMenu === '需求' }" @click="openSecondary('需求')">需求</button>
      </div>
      <div class="actions">
        <button v-if="page === 'milestoneTasks' || page === 'taskDetail'" class="btn secondary" @click="backToProgress">返回进度</button>
        <button class="btn" @click="backToList">返回项目列表</button>
      </div>
    </div>

    <main class="content">
      <ProjectList
        v-if="!currentProject"
        @open-progress="openProgress"
      />

      <template v-else>
        <ProgressView
          v-if="page === 'progress'"
          :project="currentProject"
          @open-milestone="openMilestone"
          @open-task="openTask"
        />

        <MilestoneTasks
          v-else-if="page === 'milestoneTasks'"
          :project="currentProject"
          :milestone-id="currentMilestoneId"
          @open-task="openTask"
        />

        <TaskDetail
          v-else-if="page === 'taskDetail'"
          :project="currentProject"
          :task-id="currentTaskId"
        />

        <PlaceholderPage v-else-if="page === 'overview'" title="项目总览" />
        <PlaceholderPage v-else-if="page === 'requirements'" title="需求" />
      </template>
    </main>

    <footer class="footer">
      <div>所有操作均记录日志，便于追溯与穿透</div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f6f8;
}
.topbar {
  background: #2c3e50;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
}
.brand {
  font-weight: 600;
}
.menu {
  display: flex;
  gap: 8px;
}
.menu-item {
  background: transparent;
  color: #fff;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
}
.menu-item.active {
  background: rgba(255,255,255,0.15);
  border-radius: 4px;
}
.subbar {
  background: #fff;
  border-bottom: 1px solid #e6e8eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
}
.submenus {
  display: flex;
  gap: 8px;
}
.submenu-item {
  background: #f3f4f6;
  border: 1px solid #e6e8eb;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
}
.submenu-item.active {
  background: #fff;
  border-color: #c9ced6;
}
.content {
  max-width: 1200px;
  margin: 16px auto;
  padding: 0 16px;
  width: 100%;
}
.footer {
  margin-top: auto;
  padding: 16px;
  text-align: center;
  color: #666;
}
.btn {
  background: #1f8ef1;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
}
.btn.secondary {
  background: #f3f4f6;
  color: #333;
  border: 1px solid #c9ced6;
}
</style>
