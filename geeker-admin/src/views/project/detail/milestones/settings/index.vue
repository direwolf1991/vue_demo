<template>
  <div class="milestone-settings">
    <div class="head">
      <div class="title">项目里程碑设置</div>
      <div class="actions">
        <el-button @click="openAddChildBatch">批量新增子里程碑</el-button>
        <el-button type="danger" :disabled="!hasDeletableSelection" @click="batchRemove">批量删除</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </div>
    </div>
    <el-empty v-if="!project" description="未找到项目" />
    <div v-else class="body">
      <el-table
        :data="treeData"
        row-key="id"
        :tree-props="{ children: 'children' }"
        border
        size="small"
        style="width: 100%"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="里程碑" min-width="220">
          <template #default="scope">
            <div class="name">
              <span v-if="scope.row.isRoot">{{ scope.row.name }}</span>
              <el-input v-else v-model="scope.row.name" size="small" placeholder="里程碑名称" style="max-width: 220px" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="160">
          <template #default="scope">
            <el-select v-model="scope.row.type" :disabled="scope.row.isRoot" placeholder="请选择">
              <el-option v-for="opt in typeOptions" :key="opt" :label="opt" :value="opt" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="计划开始" width="160">
          <template #default="scope">
            <el-date-picker v-model="scope.row.plannedStart" type="date" value-format="YYYY-MM-DD" />
          </template>
        </el-table-column>
        <el-table-column label="计划结束" width="160">
          <template #default="scope">
            <el-date-picker v-model="scope.row.plannedEnd" type="date" value-format="YYYY-MM-DD" />
          </template>
        </el-table-column>
        <el-table-column label="产出物" min-width="260">
          <template #default="scope">
            <div v-if="scope.row.isRoot" class="deliverables">
              <el-tag
                v-for="d in scope.row.deliverables"
                :key="d"
                closable
                @close="removeRootDeliverable(scope.row, d)"
                style="margin: 0 6px 6px 0"
              >
                {{ d }}
              </el-tag>
              <el-input
                v-model="deliverableInputs[String(scope.row.id)]"
                placeholder="新增产出物"
                size="small"
                style="width: 180px; margin-right: 8px"
              />
              <el-button size="small" @click="addRootDeliverable(scope.row)">添加</el-button>
            </div>
            <div v-else>
              <el-select v-model="scope.row.deliverable" placeholder="选择产出物" style="width: 220px">
                <el-option v-for="d in rootDeliverables(scope.row)" :key="d" :label="d" :value="d" />
              </el-select>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="scope">
            <el-tooltip content="新增子里程碑" placement="top">
              <el-button link type="primary" :icon="CirclePlus" @click="openAddChild(scope.row)" />
            </el-tooltip>
            <el-tooltip v-if="!scope.row.isRoot" content="同级新增里程碑" placement="top">
              <el-button link type="primary" :icon="Plus" @click="openAddSibling(scope.row)" />
            </el-tooltip>
            <el-tooltip v-if="!scope.row.isRoot" content="删除" placement="top">
              <el-button link type="danger" :icon="Delete" @click="removeNode(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="addDialogVisible" title="新增子里程碑" width="560px">
      <el-form :model="addForm" label-width="92px">
        <el-form-item label="里程碑名称">
          <el-input v-model="addForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="addForm.type" placeholder="请选择">
            <el-option v-for="opt in typeOptions" :key="opt" :label="opt" :value="opt" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始">
          <el-date-picker v-model="addForm.plannedStart" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="计划结束">
          <el-date-picker v-model="addForm.plannedEnd" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="产出物">
          <el-select v-model="addForm.deliverable" placeholder="选择产出物">
            <el-option v-for="d in addDeliverableOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddChild">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CirclePlus, Delete, Plus } from "@element-plus/icons-vue";
import type { Project } from "@/api/interface";
import { buildMilestoneIndex, mergeMilestoneNode } from "../../useMilestones";
import { addProjectLog, getProjectById, updateProject } from "@/api/modules/project";
import { ElMessage, ElMessageBox } from "element-plus";

const route = useRoute();
const router = useRouter();
const project = ref<Project.ProjectItem | null>(null);
const deliverableInputs = reactive<Record<string, string>>({});
const selectedRows = ref<any[]>([]);

const addDialogVisible = ref(false);
const addTargets = ref<any[]>([]);
const addMode = ref<"child" | "sibling">("child");
const addSiblingAfterId = ref<string | null>(null);
const addRefNode = ref<any | null>(null);
const addForm = reactive({
  name: "",
  type: "",
  plannedStart: "",
  plannedEnd: "",
  deliverable: ""
});

const typeOptions = ["需求", "设计", "开发", "测试", "投产", "项目评价", "其他"];

function toTree(m: any, isRoot: boolean) {
  return {
    id: m.id,
    name: m.name,
    type: m.type || "",
    plannedStart: m.plannedStart || "",
    plannedEnd: m.plannedEnd || "",
    deliverables: Array.isArray(m.deliverables) ? m.deliverables : [],
    deliverable: m.deliverable || "",
    isRoot,
    children: (m.children || []).map((c: any) => toTree(c, false))
  };
}

const treeData = computed(() => {
  const p = project.value;
  if (!p || p.type !== "建设类") return [];
  return (p.milestones || []).map(m => toTree(m, true));
});

const originalMilestoneIndex = computed(() => buildMilestoneIndex(project.value?.milestones || []));

function findRootForId(nid: any) {
  function walk(nodes: any[], currentRoot: any | null): any | null {
    for (const n of nodes) {
      const nextRoot = n.isRoot ? n : currentRoot;
      if (n.id === nid) return nextRoot;
      const hit = walk(n.children || [], nextRoot);
      if (hit) return hit;
    }
    return null;
  }
  return walk(treeData.value, null);
}

function rootDeliverables(node: any) {
  const root = findRootForId(node.id);
  return Array.isArray(root?.deliverables) ? root.deliverables : [];
}

function addRootDeliverable(root: any) {
  const key = String(root.id);
  const name = String(deliverableInputs[key] || "").trim();
  if (!name) return;
  if (!Array.isArray(root.deliverables)) root.deliverables = [];
  if (!root.deliverables.includes(name)) root.deliverables.push(name);
  deliverableInputs[key] = "";
}

function removeRootDeliverable(root: any, name: string) {
  root.deliverables = (root.deliverables || []).filter((d: string) => d !== name);
}

const addDeliverableOptions = computed(() => rootDeliverables(addRefNode.value || {}));

function openAddChild(parent: any) {
  addMode.value = "child";
  addSiblingAfterId.value = null;
  addTargets.value = [parent];
  addRefNode.value = parent;
  addForm.name = "";
  addForm.type = "";
  addForm.plannedStart = parent.plannedStart || "";
  addForm.plannedEnd = parent.plannedEnd || "";
  const options = rootDeliverables(parent);
  addForm.deliverable = options[0] || "";
  addDialogVisible.value = true;
}

function openAddChildBatch() {
  const parents = selectedRows.value.filter(x => x && x.id);
  if (!parents.length) {
    ElMessage.warning("请先勾选里程碑");
    return;
  }
  addMode.value = "child";
  addSiblingAfterId.value = null;
  addTargets.value = parents;
  addRefNode.value = parents[0];
  addForm.name = "";
  addForm.type = "";
  addForm.plannedStart = parents[0].plannedStart || "";
  addForm.plannedEnd = parents[0].plannedEnd || "";
  const options = rootDeliverables(parents[0]);
  addForm.deliverable = options[0] || "";
  addDialogVisible.value = true;
}

function findContainerForId(nid: any) {
  function walk(nodes: any[], parent: any | null): { arr: any[]; index: number; parent: any | null } | null {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.id === nid) return { arr: nodes, index: i, parent };
      const hit = walk(n.children || [], n);
      if (hit) return hit;
    }
    return null;
  }
  return walk(treeData.value, null);
}

function openAddSibling(row: any) {
  const ctx = findContainerForId(row.id);
  if (!ctx || !ctx.parent) {
    ElMessage.warning("一级里程碑不支持同级新增");
    return;
  }
  addMode.value = "sibling";
  addSiblingAfterId.value = String(row.id);
  addTargets.value = [row];
  addRefNode.value = row;
  addForm.name = "";
  addForm.type = row.type || "";
  addForm.plannedStart = row.plannedStart || "";
  addForm.plannedEnd = row.plannedEnd || "";
  const options = rootDeliverables(row);
  addForm.deliverable = options[0] || "";
  addDialogVisible.value = true;
}

function nextTempId() {
  const anyCrypto: any = globalThis as any;
  const uuid = anyCrypto?.crypto?.randomUUID
    ? anyCrypto.crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `tmp_${uuid}`;
}

function confirmAddChild() {
  const targets = addTargets.value;
  if (!targets.length) return;
  const name = addForm.name.trim();
  if (!name) {
    ElMessage.warning("请输入里程碑名称");
    return;
  }
  if (!addForm.type) {
    ElMessage.warning("请选择类型");
    return;
  }
  if (!addForm.plannedStart || !addForm.plannedEnd) {
    ElMessage.warning("请选择计划开始与计划结束时间");
    return;
  }
  const optsNode = addRefNode.value || targets[0];
  const options = rootDeliverables(optsNode);
  if (options.length && addForm.deliverable && !options.includes(addForm.deliverable)) {
    ElMessage.warning("产出物不在可选范围内");
    return;
  }
  if (addMode.value === "child") {
    for (const parent of targets) {
      if (!Array.isArray(parent.children)) parent.children = [];
      parent.children.push({
        id: nextTempId(),
        name,
        type: addForm.type,
        plannedStart: addForm.plannedStart,
        plannedEnd: addForm.plannedEnd,
        deliverable: addForm.deliverable,
        isRoot: false,
        children: []
      });
    }
    addDialogVisible.value = false;
    return;
  }
  if (addMode.value === "sibling") {
    const afterId = addSiblingAfterId.value;
    if (!afterId) return;
    const ctx = findContainerForId(afterId);
    if (!ctx || !ctx.parent) {
      ElMessage.warning("一级里程碑不支持同级新增");
      return;
    }
    ctx.arr.splice(ctx.index + 1, 0, {
      id: nextTempId(),
      name,
      type: addForm.type,
      plannedStart: addForm.plannedStart,
      plannedEnd: addForm.plannedEnd,
      deliverable: addForm.deliverable,
      isRoot: false,
      children: []
    });
    addDialogVisible.value = false;
  }
}

function onSelectionChange(list: any[]) {
  selectedRows.value = list || [];
}

const hasDeletableSelection = computed(() => selectedRows.value.some(x => x && !x.isRoot));

async function batchRemove() {
  const list = selectedRows.value.filter(x => x && !x.isRoot);
  if (!list.length) return;
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${list.length} 条里程碑？`, "确认删除", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
  } catch {
    return;
  }
  for (const n of list) removeNode(n);
  selectedRows.value = [];
  ElMessage.success("已删除");
}

function removeNode(node: any) {
  function removeIn(arr: any[]): boolean {
    const idx = arr.findIndex(x => x.id === node.id);
    if (idx >= 0) {
      arr.splice(idx, 1);
      return true;
    }
    for (const it of arr) {
      if (removeIn(it.children || [])) return true;
    }
    return false;
  }
  const arr = treeData.value;
  removeIn(arr);
}

function toMilestone(t: any) {
  return mergeMilestoneNode(t, originalMilestoneIndex.value);
}

async function save() {
  if (!project.value) return;
  const id = project.value.id;
  const payload = {
    milestones: treeData.value.map(t => toMilestone(t))
  } as any;
  await updateProject(id, payload);
  await addProjectLog("里程碑设置", `项目【${project.value.code}】里程碑已调整`);
  ElMessage.success("已保存里程碑设置");
  router.push({ name: "projectProgress", params: { id }, query: { tab: "milestone" } });
}

async function load() {
  const id = Number(route.params.id);
  const res = await getProjectById(id);
  project.value = res.data || null;
}

onMounted(load);
</script>

<style scoped>
.milestone-settings {
  padding: 12px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.name {
  display: flex;
  align-items: center;
}
.deliverables {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
