<template>
  <div class="progress-page">
    <div class="card">
      <div v-if="project" class="header">
        <div class="title">项目进度 · {{ project.name }}（{{ project.type }}）</div>
        <div class="toolbar">
          <div class="progress">
            <div class="progress-bg">
              <div class="progress-bar" :style="{ width: `${projectProgress}%`, background: percentColor(projectProgress) }" />
            </div>
            <div class="progress-text">{{ projectProgress }}%</div>
          </div>
          <el-button size="small" @click="manualAdjust(5)">+5%</el-button>
          <el-button size="small" @click="manualAdjust(-5)">-5%</el-button>
          <el-button
            v-if="isConstruction && constructionTab === 'milestone'"
            type="primary"
            size="small"
            @click="goMilestoneSettings"
          >
            +设置里程碑
          </el-button>
        </div>
      </div>

      <el-empty v-else description="未找到项目" />

      <template v-if="project">
        <div v-if="isConstruction" class="section">
          <el-tabs v-model="constructionTab" type="card">
            <el-tab-pane label="项目总览" name="overview" />
            <el-tab-pane label="进度" name="gantt" />
            <el-tab-pane label="里程碑" name="milestone" />
            <el-tab-pane label="需求" name="requirements" />
          </el-tabs>

          <div v-if="constructionTab === 'overview'" class="block">
            <el-empty description="项目总览（暂无内容）" />
          </div>

          <div v-else-if="constructionTab === 'gantt'" class="block">
            <div class="block-title">甘特图</div>
            <div class="gantt">
              <div class="gantt-head">
                <div class="gantt-left">名称</div>
                <div class="gantt-right">
                  <div class="ticks">
                    <span v-for="t in ganttModel.ticks" :key="t.key" class="tick" :style="{ left: t.left }">{{ t.label }}</span>
                  </div>
                </div>
              </div>
              <div class="gantt-body">
                <div v-for="r in ganttModel.rows" :key="r.key" class="gantt-row">
                  <div class="gantt-left">
                    <div class="gantt-label" :style="{ paddingLeft: `${r.level * 14}px` }">
                      <span v-if="r.hasChildren" class="caret" @click="toggleCollapse(r.key)">{{
                        collapsed.has(r.key) ? "▸" : "▾"
                      }}</span>
                      <span v-if="r.type === 'task'">
                        <el-link type="primary" :underline="false" @click="goTask(r.key.slice(2))">{{ r.label }}</el-link>
                      </span>
                      <span v-else-if="r.type === 'milestone'">
                        <el-link type="primary" :underline="false" @click="goMilestone(r.key.slice(2))">{{ r.label }}</el-link>
                      </span>
                      <span v-else>{{ r.label }}</span>
                    </div>
                  </div>
                  <div class="gantt-right">
                    <div class="track">
                      <div class="bar" :class="r.type" :style="r.layout">
                        <div class="fill" :style="fillStyle(r.progress)" />
                        <div class="percent">{{ r.progress }}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="constructionTab === 'milestone'" class="block">
            <div class="block-title">里程碑树状列表（任务明细）</div>
            <el-table :data="milestoneTableRows" row-key="id" :tree-props="{ children: 'children' }" size="small" border>
              <el-table-column label="按阶段分组" min-width="220">
                <template #default="scope">
                  <span v-if="scope.row.type === 'task'" class="name-link" @click="goTask(String(scope.row.id).slice(2))">{{
                    scope.row.name
                  }}</span>
                  <span v-else class="name-link" @click="goMilestone(String(scope.row.id).slice(2))">{{ scope.row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="负责人" width="120">
                <template #default="scope">
                  <span v-if="scope.row.type === 'milestone'">{{ scope.row.owner }}</span>
                  <span v-else>{{ scope.row.assignee }}</span>
                </template>
              </el-table-column>
              <el-table-column label="计划开始" width="120">
                <template #default="scope">
                  {{ scope.row.plannedStart || "-" }}
                </template>
              </el-table-column>
              <el-table-column label="计划完成" width="120">
                <template #default="scope">
                  {{ scope.row.plannedEnd || "-" }}
                </template>
              </el-table-column>
              <el-table-column label="可用工作日" width="120">
                <template #default="scope">
                  {{ workingDays(scope.row.plannedStart, scope.row.plannedEnd) }}
                </template>
              </el-table-column>
              <el-table-column label="任务进度" width="180">
                <template #default="scope">
                  <el-progress :percentage="Number(scope.row.progress || 0)" :stroke-width="8" />
                </template>
              </el-table-column>
              <el-table-column label="实际开始" width="120">
                <template #default="scope">
                  {{ scope.row.actualStart || "-" }}
                </template>
              </el-table-column>
              <el-table-column label="实际完成" width="120">
                <template #default="scope">
                  {{ scope.row.actualEnd || "-" }}
                </template>
              </el-table-column>
              <el-table-column label="是否延期" width="100">
                <template #default="scope">
                  <el-tag v-if="isDelayed(scope.row)" type="danger">是</el-tag>
                  <span v-else>否</span>
                </template>
              </el-table-column>
              <el-table-column label="延期天数" width="100">
                <template #default="scope">
                  {{ delayDays(scope.row) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else-if="constructionTab === 'requirements'" class="block">
            <el-empty description="需求（暂无内容）" />
          </div>
        </div>

        <div v-if="isOptimization" class="section">
          <div class="block">
            <div class="block-title">甘特图</div>
            <div class="gantt">
              <div class="gantt-head">
                <div class="gantt-left">名称</div>
                <div class="gantt-right">
                  <div class="ticks">
                    <span v-for="t in ganttModel.ticks" :key="t.key" class="tick" :style="{ left: t.left }">{{ t.label }}</span>
                  </div>
                </div>
              </div>
              <div class="gantt-body">
                <div v-for="r in ganttModel.rows" :key="r.key" class="gantt-row">
                  <div class="gantt-left">
                    <div class="gantt-label" :style="{ paddingLeft: `${r.level * 14}px` }">
                      <span v-if="r.hasChildren" class="caret" @click="toggleCollapse(r.key)">{{
                        collapsed.has(r.key) ? "▸" : "▾"
                      }}</span>
                      <span v-if="r.type === 'task'">
                        <el-link type="primary" :underline="false" @click="goTask(r.key.slice(2))">{{ r.label }}</el-link>
                      </span>
                      <span v-else>{{ r.label }}</span>
                    </div>
                  </div>
                  <div class="gantt-right">
                    <div class="track">
                      <div class="bar" :class="r.type" :style="r.layout">
                        <div class="fill" :style="fillStyle(r.progress)" />
                        <div class="percent">{{ r.progress }}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="project.staffing" class="block">
            <div class="block-title">人员 - 任务清单与人力使用率</div>
            <div class="staffing-bar">
              <span>合同金额：{{ Number(project.staffing.contractAmount || 0).toFixed(2) }}</span>
              <div class="rate">
                <span>人力使用率：</span>
                <el-progress :percentage="usageRate" :stroke-width="10" :show-text="true" style="width: 220px" />
              </div>
              <el-tag v-if="dualWarning" type="danger">预警：使用率＜60% 且 周期进度＞80%</el-tag>
            </div>

            <div class="people">
              <el-card v-for="p in project.staffing.people" :key="p.user" shadow="never" class="person">
                <template #header>
                  <div class="person-head">
                    <span class="person-name">{{ p.user }}</span>
                    <span class="person-meta">单价：{{ p.pricePerHour }}/小时</span>
                  </div>
                </template>
                <el-table :data="p.tasks || []" size="small" border>
                  <el-table-column prop="name" label="任务" min-width="180">
                    <template #default="scope">
                      <el-link type="primary" :underline="false" @click="goTask(scope.row.id)">{{ scope.row.name }}</el-link>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="90" />
                  <el-table-column prop="effortHours" label="小时" width="80" />
                  <el-table-column prop="progress" label="进度" width="140">
                    <template #default="scope">
                      <el-progress :percentage="Number(scope.row.progress || 0)" :stroke-width="8" />
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </div>
          </div>
        </div>
      </template>
    </div>

    <el-dialog v-model="showSettings" title="进度字段设置" width="640px">
      <div class="grid">
        <el-checkbox v-model="fieldSettings.milestoneOwner">里程碑：负责人</el-checkbox>
        <el-checkbox v-model="fieldSettings.milestonePlan">里程碑：计划时间</el-checkbox>
        <el-checkbox v-model="fieldSettings.milestoneActual">里程碑：实际时间</el-checkbox>
        <el-checkbox v-model="fieldSettings.milestoneProgress">里程碑：进度/预警</el-checkbox>
        <el-checkbox v-model="fieldSettings.taskAssignee">任务：执行人</el-checkbox>
        <el-checkbox v-model="fieldSettings.taskStatus">任务：状态</el-checkbox>
        <el-checkbox v-model="fieldSettings.taskPlan">任务：计划时间</el-checkbox>
        <el-checkbox v-model="fieldSettings.taskActual">任务：实际时间</el-checkbox>
        <el-checkbox v-model="fieldSettings.taskProgress">任务：进度</el-checkbox>
      </div>
      <template #footer>
        <el-button type="primary" @click="showSettings = false">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { Project } from "@/api/interface";
import { addProjectLog, getProjectById } from "@/api/modules/project";
import { workingDays, isDelayed, delayDays } from "../useMilestones";

const route = useRoute();
const router = useRouter();
const project = ref<Project.ProjectItem | null>(null);

async function load() {
  const id = Number(route.params.id);
  if (!id) {
    project.value = null;
    return;
  }
  try {
    const res = await getProjectById(id);
    project.value = res.data || null;
  } catch {
    project.value = null;
  }
}

onMounted(load);
watch(() => route.params.id, load);

const isConstruction = computed(() => project.value?.type === "建设类");
const isOptimization = computed(() => project.value?.type === "日常优化类");

const constructionTab = ref<"overview" | "gantt" | "milestone" | "requirements">("overview");

watch(
  () => route.fullPath,
  () => {
    const q = String(route.query.tab || "");
    if (q === "overview" || q === "gantt" || q === "milestone" || q === "requirements") {
      constructionTab.value = q as any;
      return;
    }
    const n = route.name;
    if (n === "projectOverview") constructionTab.value = "overview";
    else if (n === "projectProgress") constructionTab.value = "gantt";
    else if (n === "projectRequirements") constructionTab.value = "requirements";
  },
  { immediate: true }
);

const showSettings = ref(false);
const settingsKey = computed(() => `geeker:progress-fields:${project.value?.type || ""}`);
const fieldSettings = ref({
  milestoneOwner: true,
  milestonePlan: true,
  milestoneActual: true,
  milestoneProgress: true,
  taskAssignee: true,
  taskStatus: true,
  taskPlan: true,
  taskActual: true,
  taskProgress: true
});

function loadFieldSettings() {
  try {
    const raw = localStorage.getItem(settingsKey.value);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") fieldSettings.value = { ...fieldSettings.value, ...parsed };
  } catch {}
}

watch(
  () => settingsKey.value,
  () => loadFieldSettings(),
  { immediate: true }
);
watch(
  () => fieldSettings.value,
  v => {
    try {
      localStorage.setItem(settingsKey.value, JSON.stringify(v));
    } catch {}
  },
  { deep: true }
);

function percentColor(p: number) {
  if (p >= 80) return "var(--el-color-success)";
  if (p >= 50) return "var(--el-color-warning)";
  return "var(--el-color-danger)";
}

function milestoneStats(m: Project.Milestone) {
  const allTasks = [...(m.tasks || []), ...(m.children || []).flatMap(c => c.tasks || [])];
  const progress = allTasks.length ? Math.round(allTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / allTasks.length) : 0;
  const actualStart =
    allTasks
      .map(t => t.actualStart)
      .filter(Boolean)
      .sort()[0] || null;
  const actualEnd =
    allTasks
      .map(t => t.actualEnd)
      .filter(Boolean)
      .sort()
      .slice(-1)[0] || null;
  const delayWarning = progress < 80 && new Date() > new Date(m.plannedEnd);
  return { progress, actualStart, actualEnd, delayWarning };
}

const projectProgress = computed(() => {
  const p = project.value;
  if (!p) return 0;
  if (isConstruction.value) {
    const ms = p.milestones || [];
    const ps = ms.map(m => milestoneStats(m).progress);
    return ms.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ms.length) : 0;
  }
  if (isOptimization.value) {
    const allTasks = (p.staffing?.people || []).flatMap(x => x.tasks || []);
    return allTasks.length ? Math.round(allTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / allTasks.length) : 0;
  }
  return 0;
});

function manualAdjust(delta: number) {
  ElMessage.success(`已记录调整：${delta > 0 ? "+" : ""}${delta}%`);
  if (project.value) {
    addProjectLog("手动调整进度", `项目【${project.value.code}】${project.value.name} 调整 ${delta > 0 ? "+" : ""}${delta}%`);
  }
}

function goMilestone(milestoneId: string) {
  const id = project.value?.id || Number(route.params.id);
  router.push(`/project/milestoneTasks/${id}/${milestoneId}`);
}

function goTask(taskId: string) {
  const id = project.value?.id || Number(route.params.id);
  router.push(`/project/taskDetail/${id}/${taskId}`);
}

function goMilestoneSettings() {
  const id = project.value?.id || Number(route.params.id);
  router.push(`/project/detail/${id}/milestone-settings`);
}

const usageRate = computed(() => {
  const p = project.value;
  if (!p || p.type !== "日常优化类") return 0;
  const staffing = p.staffing;
  if (!staffing || !staffing.contractAmount) return 0;
  const invested = staffing.people.reduce((sum, person) => {
    const hours = (person.tasks || []).reduce((h, t) => h + (t.effortHours || 0), 0);
    return sum + hours * (person.pricePerHour || 0);
  }, 0);
  return Math.round((invested / staffing.contractAmount) * 100);
});

const dualWarning = computed(() => {
  const u = usageRate.value || 0;
  const pp = projectProgress.value || 0;
  return u < 60 && pp > 80;
});

function toDayIndex(isoDate: string | null) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function fillStyle(p: number) {
  const v = clamp(p || 0, 0, 100);
  return { width: `${v}%`, background: percentColor(v) };
}

const collapsed = ref(new Set<string>());
function toggleCollapse(key: string) {
  const set = new Set(collapsed.value);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  collapsed.value = set;
}

function makeRow(args: any) {
  return { ...args, hasChildren: false };
}

const milestoneTableRows = computed(() => {
  const p = project.value;
  if (!p || p.type !== "建设类") return [];
  function mapMilestone(m: any): any {
    const stats = milestoneStats(m);
    const children: any[] = [];
    for (const t of m.tasks || []) {
      children.push({
        id: `t:${t.id}`,
        type: "task",
        name: t.name,
        assignee: t.assignee,
        status: t.status,
        plannedStart: t.plannedStart,
        plannedEnd: t.plannedEnd,
        actualStart: t.actualStart || null,
        actualEnd: t.actualEnd || null,
        progress: Number(t.progress || 0),
        children: []
      });
    }
    for (const c of m.children || []) {
      children.push(mapMilestone(c));
    }
    return {
      id: `m:${m.id}`,
      type: "milestone",
      name: m.name,
      owner: m.owner,
      plannedStart: m.plannedStart,
      plannedEnd: m.plannedEnd,
      actualStart: stats.actualStart,
      actualEnd: stats.actualEnd,
      progress: stats.progress,
      delayWarning: stats.delayWarning,
      children
    };
  }
  return (p.milestones || []).map(mapMilestone);
});

const ganttModel = computed(() => {
  const p = project.value;
  if (!p) return { rows: [], ticks: [] as any[] };

  const rows: any[] = [];

  if (isConstruction.value) {
    for (const m of p.milestones || []) {
      rows.push(
        makeRow({
          key: `m:${m.id}`,
          label: m.name,
          start: m.plannedStart,
          end: m.plannedEnd,
          progress: milestoneStats(m).progress,
          level: 0,
          type: "milestone",
          parentKey: null
        })
      );
      for (const t of m.tasks || [])
        rows.push(
          makeRow({
            key: `t:${t.id}`,
            label: t.name,
            start: t.plannedStart,
            end: t.plannedEnd,
            progress: t.progress,
            level: 1,
            type: "task",
            parentKey: `m:${m.id}`
          })
        );
      for (const c of m.children || []) {
        rows.push(
          makeRow({
            key: `m:${c.id}`,
            label: c.name,
            start: c.plannedStart,
            end: c.plannedEnd,
            progress: milestoneStats({ ...c, children: [] } as any).progress,
            level: 1,
            type: "milestone",
            parentKey: `m:${m.id}`
          })
        );
        for (const t of c.tasks || [])
          rows.push(
            makeRow({
              key: `t:${t.id}`,
              label: t.name,
              start: t.plannedStart,
              end: t.plannedEnd,
              progress: t.progress,
              level: 2,
              type: "task",
              parentKey: `m:${c.id}`
            })
          );
      }
    }
  }

  if (isOptimization.value) {
    const phases = p.phases || [];
    const fallbackStart = p.startDate;
    const fallbackEnd = p.endDate;
    if (phases.length) {
      for (const ph of phases) {
        const pTasks = ph.tasks || [];
        const taskStarts = pTasks.map(t => t.plannedStart).filter(Boolean);
        const taskEnds = pTasks.map(t => t.plannedEnd).filter(Boolean);
        const phaseStart = taskStarts.sort()[0] || ph.plannedStart || fallbackStart;
        const phaseEnd = taskEnds.sort().slice(-1)[0] || ph.plannedEnd || fallbackEnd;
        const phaseProgress = pTasks.length
          ? Math.round(pTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / pTasks.length)
          : 0;
        rows.push(
          makeRow({
            key: `ph:${ph.id}`,
            label: ph.name,
            start: phaseStart,
            end: phaseEnd,
            progress: phaseProgress,
            level: 0,
            type: "phase",
            parentKey: null
          })
        );
        for (const t of pTasks)
          rows.push(
            makeRow({
              key: `t:${t.id}`,
              label: t.name,
              start: t.plannedStart || fallbackStart,
              end: t.plannedEnd || fallbackEnd,
              progress: t.progress,
              level: 1,
              type: "task",
              parentKey: `ph:${ph.id}`
            })
          );
      }
    } else {
      for (const person of p.staffing?.people || []) {
        const taskStarts = (person.tasks || []).map(t => t.plannedStart).filter(Boolean);
        const taskEnds = (person.tasks || []).map(t => t.plannedEnd).filter(Boolean);
        const groupStart = taskStarts.sort()[0] || fallbackStart;
        const groupEnd = taskEnds.sort().slice(-1)[0] || fallbackEnd;
        const groupProgress = (person.tasks || []).length
          ? Math.round((person.tasks || []).reduce((sum, t) => sum + (t.progress || 0), 0) / (person.tasks || []).length)
          : 0;
        rows.push(
          makeRow({
            key: `p:${person.user}`,
            label: person.user,
            start: groupStart,
            end: groupEnd,
            progress: groupProgress,
            level: 0,
            type: "group",
            parentKey: null
          })
        );
        for (const t of person.tasks || [])
          rows.push(
            makeRow({
              key: `t:${t.id}`,
              label: t.name,
              start: t.plannedStart || fallbackStart,
              end: t.plannedEnd || fallbackEnd,
              progress: t.progress,
              level: 1,
              type: "task",
              parentKey: `p:${person.user}`
            })
          );
      }
    }
  }

  const childrenByParent = new Map<string, number>();
  for (const r of rows) if (r.parentKey) childrenByParent.set(r.parentKey, (childrenByParent.get(r.parentKey) || 0) + 1);
  for (const r of rows) r.hasChildren = !!childrenByParent.get(r.key);

  const mapped = rows
    .map(r => ({ ...r, startIdx: toDayIndex(r.start), endIdx: toDayIndex(r.end) }))
    .filter(r => r.startIdx !== null && r.endIdx !== null && r.endIdx >= r.startIdx);

  const startIdx = mapped.length ? Math.min(...mapped.map(r => r.startIdx)) : null;
  const endIdx = mapped.length ? Math.max(...mapped.map(r => r.endIdx)) : null;
  if (startIdx === null || endIdx === null) return { rows: [], ticks: [] as any[] };
  const totalDays = Math.max(1, endIdx - startIdx + 1);

  const parentMap = new Map(mapped.map(r => [r.key, r.parentKey]));
  function hasCollapsedAncestor(r: any) {
    let k = r.parentKey;
    while (k) {
      if (collapsed.value.has(k)) return true;
      k = parentMap.get(k) || null;
    }
    return false;
  }

  const visibleRows = mapped
    .filter(r => !hasCollapsedAncestor(r))
    .map(r => {
      const left = ((r.startIdx - startIdx) / totalDays) * 100;
      const width = ((r.endIdx - r.startIdx + 1) / totalDays) * 100;
      return { ...r, layout: { left: `${clamp(left, 0, 100)}%`, width: `${clamp(width, 0, 100)}%` } };
    });

  const tickCount = 6;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const tIdx = Math.round(startIdx + (i * (totalDays - 1)) / (tickCount - 1));
    const left = (i / (tickCount - 1)) * 100;
    const d = new Date(tIdx * 86400000);
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return { key: `tick:${tIdx}`, left: `${left}%`, label: `${mm}-${dd}` };
  });

  return { rows: visibleRows, ticks };
});
</script>

<style scoped>
.card {
  padding: 12px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.progress {
  display: flex;
  gap: 8px;
  align-items: center;
}
.progress-bg {
  width: 200px;
  height: 9px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
}
.progress-bar {
  height: 100%;
}
.progress-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.section {
  padding-top: 10px;
}
.block {
  margin-top: 10px;
}
.block-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.gantt {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}
.gantt-head,
.gantt-row {
  display: grid;
  grid-template-columns: 240px 1fr;
}
.gantt-head {
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.gantt-left {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  border-right: 1px solid var(--el-border-color-lighter);
}
.gantt-right {
  position: relative;
  min-height: 34px;
}
.ticks {
  position: absolute;
  inset: 0;
}
.tick {
  position: absolute;
  top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transform: translateX(-50%);
}
.gantt-body .gantt-row {
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.gantt-body .gantt-row:last-child {
  border-bottom: none;
}
.gantt-label {
  font-size: 13px;
  line-height: 20px;
  color: var(--el-text-color-primary);
}
.caret {
  display: inline-block;
  width: 16px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  user-select: none;
}
.track {
  position: relative;
  height: 34px;
  background: repeating-linear-gradient(to right, rgb(15 23 42 / 4%), rgb(15 23 42 / 4%) 1px, transparent 1px, transparent 40px);
}
.bar {
  position: absolute;
  top: 50%;
  height: 12px;
  overflow: hidden;
  background: rgb(64 158 255 / 14%);
  border: 1px solid rgb(64 158 255 / 28%);
  border-radius: 6px;
  transform: translateY(-50%);
}
.bar.milestone {
  height: 14px;
  background: rgb(99 102 241 / 14%);
  border-color: rgb(99 102 241 / 28%);
}
.bar.group,
.bar.phase {
  background: rgb(148 163 184 / 18%);
  border-color: rgb(148 163 184 / 30%);
}
.fill {
  height: 100%;
}
.percent {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  pointer-events: none;
}
.tree .node {
  margin-bottom: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}
.node-head {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.node-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.node-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.node-progress {
  display: flex;
  gap: 8px;
  align-items: center;
}
.small-bg {
  width: 140px;
  height: 7px;
  overflow: hidden;
  background: var(--el-fill-color);
  border-radius: 999px;
}
.small-bar {
  height: 100%;
}
.small-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.warn {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-danger);
}
.node-body {
  padding: 10px;
}
.list-title {
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.child {
  margin-top: 10px;
}
.child-head {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
}
.child-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.child-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px 12px;
}
.staffing-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-bottom: 10px;
  color: var(--el-text-color-regular);
}
.rate {
  display: flex;
  gap: 8px;
  align-items: center;
}
.people {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.person-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.person-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.person-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.name-link {
  color: var(--el-color-primary);
  cursor: pointer;
}
</style>
