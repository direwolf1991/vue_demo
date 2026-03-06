<template>
  <el-container class="project-detail-layout">
    <el-aside width="200px" class="detail-aside">
      <div class="project-title">{{ project?.name || "项目详情" }}</div>
      <el-menu :default-active="activeMenu" class="detail-menu" @select="handleSelect">
        <el-menu-item index="overview">
          <el-icon><DataBoard /></el-icon>
          <span>项目总览</span>
        </el-menu-item>
        <el-menu-item index="progress">
          <el-icon><TrendCharts /></el-icon>
          <span>项目详情</span>
        </el-menu-item>
        <el-menu-item index="requirements">
          <el-icon><List /></el-icon>
          <span>需求管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="detail-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { DataBoard, TrendCharts, List } from "@element-plus/icons-vue";
import { getProjectById } from "@/api/modules/project";
import type { Project } from "@/api/interface";

const route = useRoute();
const router = useRouter();
const project = ref<Project.ProjectItem | null>(null);

const activeMenu = computed(() => {
  const parts = route.path.split("/");
  return parts[parts.length - 1] || "overview";
});

async function loadProject() {
  const id = Number(route.params.id);
  if (!id) {
    project.value = null;
    router.replace("/project/list");
    return;
  }
  try {
    const res = await getProjectById(id);
    project.value = res.data || null;
  } catch {
    project.value = null;
  }
}

function handleSelect(key: string) {
  const idNum = project.value?.id || Number(route.params.id);
  if (!idNum || Number.isNaN(idNum)) {
    router.push("/project/list");
    return;
  }
  router.push(`/project/detail/${idNum}/${key}`);
}

onMounted(loadProject);
watch(() => route.params.id, loadProject);
</script>

<style scoped lang="scss">
.project-detail-layout {
  height: 100%;
  background-color: var(--el-bg-color);
}
.detail-aside {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-overlay);
  border-right: 1px solid var(--el-border-color-light);
  .project-title {
    padding: 20px 16px;
    overflow: hidden;
    font-size: 16px;
    font-weight: bold;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
    border-bottom: 1px solid var(--el-border-color-light);
  }
  .detail-menu {
    flex: 1;
    background-color: transparent;
    border-right: none;
  }
}
.detail-main {
  padding: 16px;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}
</style>
