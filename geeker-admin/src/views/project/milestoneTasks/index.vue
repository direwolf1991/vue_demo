<template>
  <div class="table-box">
    <el-card shadow="never" class="mb-15">
      <template #header>
        <div class="card-header">
          <span>里程碑概览</span>
          <el-button link type="primary" @click="goBack">返回项目进度</el-button>
        </div>
      </template>

      <el-descriptions v-if="milestone" :column="3" border>
        <el-descriptions-item label="项目">{{ project?.name }}</el-descriptions-item>
        <el-descriptions-item label="里程碑">{{ milestone.name }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ milestone.owner }}</el-descriptions-item>
        <el-descriptions-item label="计划开始">{{ milestone.plannedStart }}</el-descriptions-item>
        <el-descriptions-item label="计划结束">{{ milestone.plannedEnd }}</el-descriptions-item>
        <el-descriptions-item label="任务数量">{{ tasks.length }}</el-descriptions-item>
      </el-descriptions>

      <el-empty v-else description="未找到里程碑" />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <div>
            <el-button type="primary" size="small" @click="openAdd" :disabled="!milestone">新增任务</el-button>
            <el-button type="danger" size="small" @click="batchRemove" :disabled="!selected.length">批量删除</el-button>
            <el-button v-if="!editMode" size="small" @click="enterEdit" :disabled="!tasks.length">批量修改</el-button>
            <template v-else>
              <el-button type="primary" size="small" @click="saveBulkEdit">保存修改</el-button>
              <el-button size="small" @click="cancelEdit">取消修改</el-button>
            </template>
          </div>
        </div>
      </template>

      <el-table :data="tableRows" border size="small" row-key="id" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="任务名称" min-width="200">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="goTask(scope.row.id)">{{ scope.row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="负责人" width="120">
          <template #default="scope">
            <template v-if="editMode">
              <el-input v-model="scope.row.assignee" size="small" />
            </template>
            <template v-else>
              {{ scope.row.assignee }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <template v-if="editMode">
              <el-input v-model="scope.row.status" size="small" />
            </template>
            <template v-else>
              {{ scope.row.status }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="plannedStart" label="计划开始" width="160">
          <template #default="scope">
            <template v-if="editMode">
              <el-date-picker v-model="scope.row.plannedStart" type="date" value-format="YYYY-MM-DD" size="small" />
            </template>
            <template v-else>
              {{ scope.row.plannedStart }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="plannedEnd" label="计划结束" width="160">
          <template #default="scope">
            <template v-if="editMode">
              <el-date-picker v-model="scope.row.plannedEnd" type="date" value-format="YYYY-MM-DD" size="small" />
            </template>
            <template v-else>
              {{ scope.row.plannedEnd }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="actualStart" label="实际开始" width="160">
          <template #default="scope">
            <template v-if="editMode">
              <el-date-picker v-model="scope.row.actualStart" type="date" value-format="YYYY-MM-DD" size="small" />
            </template>
            <template v-else>
              {{ scope.row.actualStart || "-" }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="actualEnd" label="实际结束" width="160">
          <template #default="scope">
            <template v-if="editMode">
              <el-date-picker v-model="scope.row.actualEnd" type="date" value-format="YYYY-MM-DD" size="small" />
            </template>
            <template v-else>
              {{ scope.row.actualEnd || "-" }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="140">
          <template #default="scope">
            <el-progress :percentage="Number(scope.row.progress || 0)" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="effortHours" label="投入小时" width="120" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="scope">
            <el-button v-if="!editMode" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
            <el-button v-if="!editMode" link type="danger" @click="removeOne(scope.row)">删除</el-button>
            <span v-else>批量修改中</span>
          </template>
        </el-table-column>
      </el-table>
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
      <el-form-item label="进度">
        <el-input :model-value="String(deriveProgress(editForm))" disabled />
      </el-form-item>
      <el-form-item label="投入小时">
        <el-input :model-value="String(deriveEffortHours(editForm))" disabled />
      </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addVisible" title="新增任务" width="560px">
      <el-form :model="addForm" label-width="92px">
        <el-form-item label="任务名称">
          <el-input v-model="addForm.name" />
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="addForm.assignee" />
        </el-form-item>
        <el-form-item label="状态">
          <el-input v-model="addForm.status" />
        </el-form-item>
        <el-form-item label="计划开始">
          <el-date-picker v-model="addForm.plannedStart" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="计划结束">
          <el-date-picker v-model="addForm.plannedEnd" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/modules/user";
import type { Project } from "@/api/interface";
import { getProjectById, updateProject, addProjectLog } from "@/api/modules/project";
import { workingDays } from "@/views/project/detail/useMilestones";

const route = useRoute();
const router = useRouter();

const project = ref<Project.ProjectItem | null>(null);

function buildMilestoneIndex(
  milestones: Project.Milestone[] = [],
  parent: Project.Milestone | null = null,
  map = new Map<string, { milestone: Project.Milestone; parentId: null | string }>()
) {
  for (const m of milestones) {
    map.set(m.id, { milestone: m, parentId: parent?.id || null });
    if (m.children?.length) buildMilestoneIndex(m.children, m, map);
  }
  return map;
}

function collectTasks(milestone: Project.Milestone) {
  const list: Project.Task[] = [];
  for (const t of milestone.tasks || []) list.push(t);
  for (const c of milestone.children || []) list.push(...collectTasks(c));
  return list;
}

const projectId = computed(() => Number(route.params.projectId));
const milestoneId = computed(() => String(route.params.milestoneId || ""));
const milestoneIndex = computed(() => buildMilestoneIndex(project.value?.milestones || []));
const milestone = computed(() => milestoneIndex.value.get(milestoneId.value)?.milestone || null);
const tasks = computed(() => (milestone.value ? collectTasks(milestone.value) : []));
const editMode = ref(false);
const editableTasks = ref<Project.Task[]>([]);
function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function deriveProgress(t: Project.Task) {
  const planned = workingDays(t.plannedStart || null, t.plannedEnd || null);
  if (t.actualEnd) return 100;
  if (t.actualStart) {
    const elapsed = workingDays(t.actualStart, todayIso());
    if (planned > 0) return Math.max(0, Math.min(99, Math.round((elapsed / planned) * 100)));
  }
  return 0;
}
function deriveEffortHours(t: Project.Task) {
  if (!t.actualStart) return 0;
  const end = t.actualEnd || todayIso();
  const days = workingDays(t.actualStart, end);
  return days * 8;
}
const tableRows = computed(() => {
  const base = editMode.value ? editableTasks.value : tasks.value;
  return (base || []).map(t => ({
    ...t,
    progress: deriveProgress(t),
    effortHours: deriveEffortHours(t)
  }));
});

async function load() {
  const res = await getProjectById(projectId.value);
  project.value = res.data || null;
}

function goBack() {
  router.push({ name: "projectProgress", params: { id: projectId.value }, query: { tab: "milestone" } });
}

function goTask(taskId: string) {
  router.push(`/project/taskDetail/${projectId.value}/${taskId}`);
}

onMounted(load);
watch(() => route.params.projectId, load);
watch(
  tasks,
  list => {
    if (!editMode.value) editableTasks.value = list.map(t => ({ ...t }));
  },
  { immediate: true }
);

const selected = ref<Project.Task[]>([]);
function onSelectionChange(list: Project.Task[]) {
  selected.value = list || [];
}

const editVisible = ref(false);
const editForm = ref<any>({
  id: "",
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
function openEdit(row: Project.Task) {
  editForm.value = {
    id: row.id,
    name: row.name,
    assignee: row.assignee || "",
    status: row.status || "",
    plannedStart: row.plannedStart || "",
    plannedEnd: row.plannedEnd || "",
    actualStart: row.actualStart || "",
    actualEnd: row.actualEnd || "",
    progress: Number(row.progress || 0),
    effortHours: Number(row.effortHours ?? 0)
  };
  editVisible.value = true;
}

function patchTaskInMilestones(list: Project.Milestone[] = [], taskId: string, patch: any): Project.Milestone[] {
  return (list || []).map(m => ({
    ...m,
    tasks: (m.tasks || []).map(t => (t.id === taskId ? { ...t, ...patch } : { ...t })),
    children: patchTaskInMilestones(m.children || [], taskId, patch)
  }));
}
function removeTaskInMilestones(list: Project.Milestone[] = [], taskId: string): Project.Milestone[] {
  return (list || []).map(m => ({
    ...m,
    tasks: (m.tasks || []).filter(t => t.id !== taskId),
    children: removeTaskInMilestones(m.children || [], taskId)
  }));
}
function addTaskToMilestone(list: Project.Milestone[] = [], milestoneId: string, task: Project.Task): Project.Milestone[] {
  return (list || []).map(m => {
    if (m.id === milestoneId) {
      return { ...m, tasks: [...(m.tasks || []), task] };
    }
    return { ...m, children: addTaskToMilestone(m.children || [], milestoneId, task) };
  });
}

async function saveEdit() {
  if (!project.value) return;
  const pid = project.value.id;
  const userStore = useUserStore();
  const patch: Partial<Project.Task> = {
    name: editForm.value.name,
    assignee: editForm.value.assignee,
    status: editForm.value.status,
    plannedStart: editForm.value.plannedStart,
    plannedEnd: editForm.value.plannedEnd,
    actualStart: editForm.value.actualStart || null,
    actualEnd: editForm.value.actualEnd || null,
    progress: deriveProgress(editForm.value as Project.Task),
    effortHours: deriveEffortHours(editForm.value as Project.Task)
  };
  const updatedMilestones = patchTaskInMilestones(project.value.milestones || [], editForm.value.id, patch);
  await updateProject(pid, { milestones: updatedMilestones });
  await addProjectLog("任务修改", `任务【${editForm.value.name}】已更新`, userStore.userInfo?.name || "unknown");
  ElMessage.success("任务已保存");
  editVisible.value = false;
  await load();
}

async function removeOne(row: Project.Task) {
  if (!project.value) return;
  try {
    await ElMessageBox.confirm("确认删除该任务？", "确认删除", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
  } catch {
    return;
  }
  const pid = project.value.id;
  const userStore = useUserStore();
  const updatedMilestones = removeTaskInMilestones(project.value.milestones || [], row.id);
  await updateProject(pid, { milestones: updatedMilestones });
  await addProjectLog("任务删除", `任务【${row.name}】已删除`, userStore.userInfo?.name || "unknown");
  ElMessage.success("已删除");
  await load();
}

async function batchRemove() {
  if (!project.value || !selected.value.length) return;
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条任务？`, "确认删除", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
  } catch {
    return;
  }
  const pid = project.value.id;
  const userStore = useUserStore();
  let milestones = project.value.milestones || [];
  for (const t of selected.value) {
    milestones = removeTaskInMilestones(milestones, t.id);
  }
  await updateProject(pid, { milestones });
  await addProjectLog("任务批量删除", `删除 ${selected.value.length} 条任务`, userStore.userInfo?.name || "unknown");
  selected.value = [];
  ElMessage.success("已删除");
  await load();
}

const addVisible = ref(false);
const addForm = ref<any>({
  name: "",
  assignee: "",
  status: "",
  plannedStart: "",
  plannedEnd: ""
});
function openAdd() {
  if (!milestone.value) return;
  addForm.value = { name: "", assignee: "", status: "", plannedStart: "", plannedEnd: "" };
  addVisible.value = true;
}
function nextTaskId() {
  return `T${Date.now()}${Math.random().toString(16).slice(2)}`;
}
async function saveAdd() {
  if (!project.value || !milestone.value) return;
  const pid = project.value.id;
  const userStore = useUserStore();
  const task: Project.Task = {
    id: nextTaskId(),
    name: addForm.value.name.trim() || "未命名任务",
    assignee: addForm.value.assignee || "",
    status: addForm.value.status || "未开始",
    plannedStart: addForm.value.plannedStart || "",
    plannedEnd: addForm.value.plannedEnd || "",
    actualStart: null,
    actualEnd: null,
    progress: 0,
    effortHours: 0
  };
  const milestones = addTaskToMilestone(project.value.milestones || [], milestone.value.id, task);
  await updateProject(pid, { milestones });
  await addProjectLog(
    "任务新增",
    `里程碑【${milestone.value.name}】新增任务【${task.name}】`,
    userStore.userInfo?.name || "unknown"
  );
  addVisible.value = false;
  ElMessage.success("已新增任务");
  await load();
}

function enterEdit() {
  editableTasks.value = tasks.value.map(t => ({ ...t }));
  editMode.value = true;
}
function cancelEdit() {
  editableTasks.value = tasks.value.map(t => ({ ...t }));
  editMode.value = false;
}
async function saveBulkEdit() {
  if (!project.value || !editableTasks.value.length) {
    editMode.value = false;
    return;
  }
  const pid = project.value.id;
  const userStore = useUserStore();
  let milestones = project.value.milestones || [];
  for (const t of editableTasks.value) {
    const patch: Partial<Project.Task> = {
      assignee: t.assignee || "",
      status: t.status || "",
      plannedStart: t.plannedStart || "",
      plannedEnd: t.plannedEnd || "",
      actualStart: t.actualStart || null,
      actualEnd: t.actualEnd || null,
      progress: deriveProgress(t),
      effortHours: deriveEffortHours(t)
    };
    milestones = patchTaskInMilestones(milestones, t.id, patch);
  }
  await updateProject(pid, { milestones });
  await addProjectLog("任务批量修改", `批量修改 ${editableTasks.value.length} 条任务`, userStore.userInfo?.name || "unknown");
  ElMessage.success("已保存批量修改");
  editMode.value = false;
  await load();
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
