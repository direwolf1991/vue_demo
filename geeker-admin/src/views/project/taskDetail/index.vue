<template>
  <div class="table-box">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>任务详情</span>
          <div class="actions">
            <el-button link type="primary" @click="goMilestone" v-if="found?.milestoneId">返回里程碑</el-button>
            <el-button link type="primary" @click="goBack">返回项目进度</el-button>
            <el-button link type="primary" @click="openEdit" v-if="found">编辑</el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="!found" description="未找到任务" />

      <el-descriptions v-else :column="2" border>
        <el-descriptions-item label="项目">{{ project?.name }}</el-descriptions-item>
        <el-descriptions-item label="范围">{{ found.scope }}</el-descriptions-item>
        <el-descriptions-item v-if="found.milestoneName" label="里程碑">{{ found.milestoneName }}</el-descriptions-item>
        <el-descriptions-item v-if="found.assignee" label="负责人">{{ found.assignee }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ found.task.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ found.task.status }}</el-descriptions-item>
        <el-descriptions-item label="计划时间">
          {{ found.task.plannedStart || "-" }} ~ {{ found.task.plannedEnd || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="实际时间">
          {{ found.task.actualStart || "-" }} ~ {{ found.task.actualEnd || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="进度">
          <el-progress :percentage="Number(found.task.progress || 0)" :stroke-width="10" />
        </el-descriptions-item>
        <el-descriptions-item v-if="found.task.effortHours !== undefined" label="投入小时">
          {{ found.task.effortHours }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-dialog v-model="editVisible" title="编辑任务" width="560px">
      <el-form :model="editForm" label-width="92px">
        <el-form-item label="任务名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="editForm.assignee" />
        </el-form-item>
        <el-form-item label="状态">
          <el-input v-model="editForm.status" />
        </el-form-item>
        <el-form-item label="计划开始">
          <el-date-picker v-model="editForm.plannedStart" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="计划结束">
          <el-date-picker v-model="editForm.plannedEnd" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="实际开始">
          <el-date-picker v-model="editForm.actualStart" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="实际结束">
          <el-date-picker v-model="editForm.actualEnd" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="进度(0-100)">
          <el-input v-model.number="editForm.progress" />
        </el-form-item>
        <el-form-item label="投入小时">
          <el-input v-model.number="editForm.effortHours" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/modules/user";

import type { Project } from "@/api/interface";
import { getProjectById, updateProject, addProjectLog } from "@/api/modules/project";

const route = useRoute();
const router = useRouter();

const project = ref<Project.ProjectItem | null>(null);

const projectId = computed(() => Number(route.params.projectId));
const taskId = computed(() => String(route.params.taskId || ""));

function findTaskInMilestone(
  m: Project.Milestone,
  id: string
): null | { task: Project.Task; milestoneName: string; milestoneId: string } {
  for (const t of m.tasks || []) {
    if (t.id === id) return { task: t, milestoneName: m.name, milestoneId: m.id };
  }
  for (const c of m.children || []) {
    const hit = findTaskInMilestone(c, id);
    if (hit) return hit;
  }
  return null;
}

function findConstructionTask(p: Project.ProjectItem, id: string) {
  for (const m of p.milestones || []) {
    const hit = findTaskInMilestone(m, id);
    if (hit) return hit;
  }
  return null;
}

function findOptimizationTask(p: Project.ProjectItem, id: string): null | { task: Project.Task; assignee: string } {
  const staffing = p.staffing;
  if (!staffing) return null;
  for (const person of staffing.people || []) {
    for (const t of person.tasks || []) {
      if (t.id === id) return { task: t, assignee: person.user };
    }
  }
  return null;
}

const found = computed(() => {
  if (!project.value) return null;
  const construction = findConstructionTask(project.value, taskId.value);
  if (construction) {
    return {
      scope: "建设类",
      milestoneName: construction.milestoneName,
      milestoneId: construction.milestoneId,
      task: construction.task,
      assignee: construction.task.assignee || ""
    };
  }
  const optimization = findOptimizationTask(project.value, taskId.value);
  if (optimization) {
    return {
      scope: "日常优化类",
      milestoneName: "",
      milestoneId: "",
      task: optimization.task,
      assignee: optimization.task.assignee || optimization.assignee
    };
  }
  return null;
});

async function load() {
  const res = await getProjectById(projectId.value);
  project.value = res.data || null;
}

function goBack() {
  router.push({ name: "projectProgress", params: { id: projectId.value }, query: { tab: "milestone" } });
}

function goMilestone() {
  if (!found.value?.milestoneId) return;
  router.push(`/project/milestoneTasks/${projectId.value}/${found.value.milestoneId}`);
}

onMounted(load);
watch(() => route.params.projectId, load);

const editVisible = ref(false);
const editForm = ref<any>({
  name: "",
  assignee: "",
  status: "",
  plannedStart: "",
  plannedEnd: "",
  actualStart: "",
  actualEnd: "",
  progress: 0,
  effortHours: 0
});

function openEdit() {
  if (!found.value) return;
  const t = found.value.task;
  editForm.value = {
    name: t.name,
    assignee: found.value.assignee || "",
    status: t.status || "",
    plannedStart: t.plannedStart || "",
    plannedEnd: t.plannedEnd || "",
    actualStart: t.actualStart || "",
    actualEnd: t.actualEnd || "",
    progress: Number(t.progress || 0),
    effortHours: Number(t.effortHours ?? 0)
  };
  editVisible.value = true;
}

function patchTaskInMilestones(list: Project.Milestone[], milestoneId: string, taskId: string, patch: any): Project.Milestone[] {
  return (list || []).map(m => {
    const cloned: Project.Milestone = {
      ...m,
      tasks: (m.tasks || []).map(t => (t.id === taskId && m.id === milestoneId ? { ...t, ...patch } : { ...t })),
      children: patchTaskInMilestones(m.children || [], milestoneId, taskId, patch)
    };
    return cloned;
  });
}

function patchTaskInStaffing(staffing: Project.Staffing | undefined, taskId: string, patch: any): Project.Staffing | undefined {
  if (!staffing) return staffing;
  const people = (staffing.people || []).map(p => ({
    ...p,
    tasks: (p.tasks || []).map(t => (t.id === taskId ? { ...t, ...patch } : { ...t }))
  }));
  return { ...staffing, people };
}

async function saveEdit() {
  if (!project.value || !found.value) return;
  const pid = project.value.id;
  const userStore = useUserStore();
  const patch: Partial<Project.Task> = {
    name: editForm.value.name,
    status: editForm.value.status,
    plannedStart: editForm.value.plannedStart,
    plannedEnd: editForm.value.plannedEnd,
    actualStart: editForm.value.actualStart || null,
    actualEnd: editForm.value.actualEnd || null,
    progress: Number(editForm.value.progress || 0),
    effortHours: Number(editForm.value.effortHours || 0),
    assignee: editForm.value.assignee
  };

  if (found.value.scope === "建设类") {
    const updatedMilestones = patchTaskInMilestones(
      project.value.milestones || [],
      found.value.milestoneId,
      found.value.task.id,
      patch
    );
    await updateProject(pid, { milestones: updatedMilestones });
  } else {
    const updatedStaffing = patchTaskInStaffing(project.value.staffing, found.value.task.id, patch);
    await updateProject(pid, { staffing: updatedStaffing });
  }
  await addProjectLog("任务修改", `任务【${found.value.task.name}】已更新`, userStore.userInfo?.name || "unknown");
  ElMessage.success("任务已保存");
  editVisible.value = false;
  await load();
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions {
  display: flex;
  gap: 8px;
}
</style>
