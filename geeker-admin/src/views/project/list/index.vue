<template>
  <div class="table-box">
    <div class="card mb10">
      <el-radio-group v-model="activeStatus" @change="handleStatusChange">
        <el-radio-button label="全部" value="全部" />
        <el-radio-button label="待启动" value="待启动" />
        <el-radio-button label="进行中" value="进行中" />
        <el-radio-button label="已完成" value="已完成" />
      </el-radio-group>
    </div>
    <ProTable
      ref="proTable"
      title="项目列表"
      :columns="columns"
      :request-api="getTableList"
      :request-auto="true"
      :init-param="initParam"
      :pagination="true"
      row-key="id"
    >
      <template #tableHeader="{ selectedList }">
        <el-button type="primary" :icon="CirclePlus" @click="openCreate">创建项目</el-button>
        <el-button type="danger" :icon="Delete" @click="onBatchDelete">批量删除（仅待启动）</el-button>
        <el-button :icon="Download" @click="onExport(selectedList)">批量导出（Excel）</el-button>
        <el-button :icon="Tickets" @click="logVisible = true">操作日志</el-button>
      </template>
    </ProTable>

    <el-dialog v-model="selectVisible" title="选择项目类型" width="720px">
      <div class="type-select-wrap">
        <div class="type-intro">请选择项目类型，右侧为简要流程参考</div>
        <div class="type-grid">
          <el-card shadow="hover" class="type-card" @click="startCreate('建设类')">
            <template #header>
              <div class="type-title">建设类</div>
            </template>
            <div class="type-desc">适用于工程建设、实施交付的项目类型</div>
            <div class="flow">
              <div class="node">需求</div>
              <div class="arrow">→</div>
              <div class="node">设计</div>
              <div class="arrow">→</div>
              <div class="node">开发</div>
              <div class="arrow">→</div>
              <div class="node">测试</div>
              <div class="arrow">→</div>
              <div class="node">投产</div>
            </div>
          </el-card>
          <el-card shadow="hover" class="type-card" @click="startCreate('日常优化类')">
            <template #header>
              <div class="type-title">日常优化类</div>
            </template>
            <div class="type-desc">适用于持续优化、改造迭代的项目类型</div>
            <div class="flow">
              <div class="node">评估</div>
              <div class="arrow">→</div>
              <div class="node">排期</div>
              <div class="arrow">→</div>
              <div class="node">实施</div>
              <div class="arrow">→</div>
              <div class="node">验收</div>
            </div>
          </el-card>
        </div>
      </div>
      <template #footer>
        <el-button @click="selectVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="logVisible" title="操作日志" size="520px">
      <el-table :data="logs" size="small" border height="100%">
        <el-table-column prop="time" label="时间" width="170" />
        <el-table-column prop="action" label="动作" width="110" />
        <el-table-column prop="userId" label="用户" width="120" />
        <el-table-column prop="detail" label="详情" min-width="180" />
      </el-table>
    </el-drawer>

    <el-dialog v-model="ownerVisible" title="负责人详情" width="700px">
      <div class="owner-head">
        <div class="owner-title">{{ ownerName || "-" }}</div>
        <div class="owner-meta">
          <el-tag type="info" style="margin-right: 8px">部门：{{ ownerDept || "-" }}</el-tag>
          <el-tag type="success" style="margin-right: 8px">项目数：{{ ownerStats.total }}</el-tag>
          <el-tag type="warning" style="margin-right: 8px">进行中：{{ ownerStats.ongoing }}</el-tag>
          <el-tag type="danger" style="margin-right: 8px">待启动：{{ ownerStats.pending }}</el-tag>
          <el-tag style="margin-right: 8px">已完成：{{ ownerStats.finished }}</el-tag>
          <el-tag type="primary">总预算：{{ Number(ownerStats.totalBudget).toFixed(2) }}</el-tag>
        </div>
      </div>
      <el-table :data="ownerProjects" size="small" border height="360px" style="margin-top: 12px">
        <el-table-column prop="code" label="编号" width="140" />
        <el-table-column prop="name" label="项目名称" min-width="200">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="goProgress(scope.row)">{{ scope.row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="startDate" label="开始" width="110" />
        <el-table-column prop="endDate" label="结束" width="110" />
        <el-table-column prop="budget" label="预算" width="110">
          <template #default="scope">{{ Number(scope.row.budget ?? 0).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="ownerVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="formVisible" :title="editing ? '编辑项目' : '创建项目'" width="560px">
      <el-form ref="formRef" :model="form" label-width="92px">
        <el-form-item label="项目名称">
          <el-input v-model="form.name" placeholder="≤50字" />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-select v-model="form.type" placeholder="请选择" :disabled="true">
            <el-option label="建设类" value="建设类" />
            <el-option label="日常优化类" value="日常优化类" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="预算">
          <el-input v-model="form.budget" placeholder="保留2位小数" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.owner" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { onMounted, onActivated, ref, watch, reactive } from "vue";
import { useRoute, useRouter, onBeforeRouteUpdate } from "vue-router";

import { CirclePlus, Delete, Download, EditPen, Tickets } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps, ProTableInstance } from "@/components/ProTable/interface";
import type { Project } from "@/api/interface";
import {
  addProjectLog,
  batchDeleteProjects,
  createProject,
  getProjectList,
  getProjectLogs,
  updateProject,
  validateProject
} from "@/api/modules/project";

const router = useRouter();
const route = useRoute();
const proTable = ref<ProTableInstance>();
const logVisible = ref(false);
const logs = ref<Project.LogItem[]>([]);

const initParam = reactive({ status: "" });

const activeStatus = ref("全部");

const handleStatusChange = (val: string | number | boolean | undefined) => {
  const v = String(val ?? "");
  initParam.status = v === "全部" ? "" : v;
};

const columns: ColumnProps<Project.ProjectItem>[] = [
  { type: "selection", fixed: "left", width: 55 },
  {
    prop: "code",
    label: "项目编号",
    width: 150,
    search: { el: "input" },
    sortable: true
  },
  {
    prop: "name",
    label: "项目名称",
    minWidth: 180,
    search: { el: "input" },
    sortable: true,
    render: ({ row }) => (
      <el-link type="primary" underline={false} onClick={() => goProgress(row)}>
        {row.name}
      </el-link>
    )
  },
  {
    prop: "type",
    label: "类型",
    width: 120,
    sortable: true,
    enum: [
      { label: "建设类", value: "建设类" },
      { label: "日常优化类", value: "日常优化类" }
    ],
    search: { el: "select" }
  },
  {
    prop: "status",
    label: "状态",
    width: 100,
    sortable: true,
    enum: [
      { label: "待启动", value: "待启动" },
      { label: "进行中", value: "进行中" },
      { label: "已完成", value: "已完成" }
    ]
    // search: { el: "select" }
  },
  {
    prop: "startDate",
    label: "开始",
    width: 110,
    sortable: true,
    sortMethod: (a: any, b: any) => String(a.startDate).localeCompare(String(b.startDate))
  },
  {
    prop: "endDate",
    label: "结束",
    width: 110,
    sortable: true,
    sortMethod: (a: any, b: any) => String(a.endDate).localeCompare(String(b.endDate))
  },
  {
    prop: "budget",
    label: "预算",
    width: 110,
    sortable: true,
    sortMethod: (a: any, b: any) => Number(a.budget ?? 0) - Number(b.budget ?? 0),
    render: scope => Number(scope.row.budget ?? 0).toFixed(2)
  },
  {
    prop: "owner",
    label: "负责人",
    width: 110,
    sortable: true,
    search: { el: "input" },
    render: ({ row }) =>
      row.owner ? (
        <el-link type="primary" underline={false} onClick={() => openOwner(row)}>
          {row.owner}
        </el-link>
      ) : (
        "-"
      )
  },
  { prop: "department", label: "部门", width: 120, sortable: true },
  {
    prop: "operation",
    label: "操作",
    fixed: "right",
    width: 90,
    render: ({ row }) => (
      <el-button link type="primary" icon={EditPen} onClick={() => openEdit(row)}>
        编辑
      </el-button>
    )
  }
];

const getTableList = async (params: Project.ReqProjectParams) => {
  try {
    const res = await getProjectList(params);
    return res;
  } catch (error) {
    console.error("Failed to fetch project list:", error);
    return { data: { list: [], total: 0 } };
  }
};

async function loadLogs() {
  const res = await getProjectLogs();
  logs.value = res.data || [];
}

onMounted(() => {
  loadLogs();
});

// 使用 onActivated 确保 KeepAlive 下的刷新
onActivated(() => {
  const isProjectList = route.name === "projectList" || String(route.path || "").startsWith("/project/list");
  if (isProjectList) {
    proTable.value?.getTableList();
  }
});

onBeforeRouteUpdate((to, _from, next) => {
  if (to.name === "projectList" || String(to.path || "").startsWith("/project/list")) {
    setTimeout(() => {
      proTable.value?.getTableList();
    }, 0);
  }
  next();
});

watch(
  () => route.path,
  newPath => {
    if (String(newPath || "").startsWith("/project/list")) {
      setTimeout(() => {
        proTable.value?.getTableList();
      }, 300);
    }
  }
);

watch(
  () => route.fullPath,
  newFull => {
    if (String(newFull || "").startsWith("/project/list")) {
      setTimeout(() => {
        proTable.value?.getTableList();
      }, 0);
    }
  }
);

function goProgress(p: Project.ProjectItem) {
  router.push(`/project/detail/${p.id}/overview`);
}

const formVisible = ref(false);
const selectVisible = ref(false);
const selectedType = ref("");
const ownerVisible = ref(false);
const ownerName = ref("");
const ownerDept = ref("");
const ownerProjects = ref<Project.ProjectItem[]>([]);
const ownerStats = ref({
  total: 0,
  pending: 0,
  ongoing: 0,
  finished: 0,
  totalBudget: 0
});

async function openOwner(p: Project.ProjectItem) {
  ownerName.value = p.owner || "";
  ownerDept.value = p.department || "";
  const res = await getProjectList({ pageNum: 1, pageSize: 10000, owner: ownerName.value } as any);
  const list = (res as any)?.data?.list || [];
  ownerProjects.value = list;
  const pending = list.filter((x: any) => x.status === "待启动").length;
  const ongoing = list.filter((x: any) => x.status === "进行中").length;
  const finished = list.filter((x: any) => x.status === "已完成").length;
  const totalBudget = list.reduce((sum: number, x: any) => sum + Number(x.budget || 0), 0);
  ownerStats.value = {
    total: list.length,
    pending,
    ongoing,
    finished,
    totalBudget
  };
  ownerVisible.value = true;
}
const editing = ref<Project.ProjectItem | null>(null);
const form = ref<Record<string, any>>({
  name: "",
  type: "",
  startDate: "",
  endDate: "",
  budget: "",
  owner: "",
  department: "",
  description: "",
  _originalType: ""
});

function openCreate() {
  editing.value = null;
  selectVisible.value = true;
}

function startCreate(type: string) {
  selectedType.value = type;
  form.value = {
    name: "",
    type,
    startDate: "",
    endDate: "",
    budget: "",
    owner: "",
    department: "",
    description: "",
    _originalType: ""
  };
  selectVisible.value = false;
  formVisible.value = true;
}

function openEdit(p: Project.ProjectItem) {
  editing.value = p;
  form.value = {
    name: p.name,
    type: p.type,
    startDate: p.startDate,
    endDate: p.endDate,
    budget: String(p.budget ?? ""),
    owner: p.owner,
    department: p.department,
    description: p.description,
    _originalType: p.type
  };
  formVisible.value = true;
}

async function saveForm() {
  const errors = validateProject(form.value, !!editing.value);
  if (errors.length) {
    ElMessage.error(errors[0]);
    return;
  }
  if (editing.value) {
    await updateProject(editing.value.id, {
      name: form.value.name.trim(),
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      budget: Number(form.value.budget || 0),
      owner: form.value.owner,
      department: form.value.department,
      description: form.value.description
    });
  } else {
    await createProject({
      name: form.value.name.trim(),
      type: form.value.type,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      budget: Number(form.value.budget || 0),
      owner: form.value.owner,
      department: form.value.department,
      description: form.value.description,
      milestones: form.value.type === "建设类" ? [] : undefined,
      staffing: form.value.type === "日常优化类" ? { contractAmount: 0, people: [] } : undefined,
      phases: form.value.type === "日常优化类" ? [] : undefined
    });
  }
  formVisible.value = false;
  ElMessage.success("保存成功");
  proTable.value?.getTableList();
  await loadLogs();
}

async function onBatchDelete() {
  const ids = ((proTable.value as any)?.selectedListIds || []).map((x: any) => Number(x)).filter((n: any) => !Number.isNaN(n));
  if (!ids.length) {
    ElMessage.warning("请先勾选项目");
    return;
  }
  try {
    await ElMessageBox.confirm("仅「待启动」状态项目会被删除，是否确认？", "确认删除", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
  } catch (e) {
    return;
  }
  try {
    const res = await batchDeleteProjects(ids);
    ElMessage.success(`删除 ${res.data.removed} 个项目`);
  } finally {
    proTable.value?.clearSelection?.();
    proTable.value?.getTableList();
    await loadLogs();
  }
}

async function onExport(raw: any) {
  const list: Project.ProjectItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.value) ? raw.value : [];
  if (!list.length) {
    ElMessage.warning("请先勾选项目");
    return;
  }

  const cols: Array<{ key: keyof Project.ProjectItem | "budget"; title: string }> = [
    { key: "code", title: "项目编号" },
    { key: "name", title: "项目名称" },
    { key: "type", title: "项目类型" },
    { key: "status", title: "项目状态" },
    { key: "startDate", title: "项目开始日期" },
    { key: "endDate", title: "计划项目结束日期" },
    { key: "owner", title: "负责人" },
    { key: "department", title: "所属部门" },
    { key: "budget", title: "项目预算" },
    { key: "description", title: "项目简介" }
  ];

  const escapeHtml = (s: any) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const header = `<tr>${cols.map(c => `<th>${escapeHtml(c.title)}</th>`).join("")}</tr>`;
  const body = list
    .map(p => {
      const cells = cols
        .map(c => {
          const v = c.key === "budget" ? Number(p.budget ?? 0).toFixed(2) : (p as any)[c.key];
          return `<td>${escapeHtml(v)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="UTF-8" /></head><body><table border="1">${header}${body}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "projects.xls";
  a.click();
  URL.revokeObjectURL(url);

  await addProjectLog("批量导出", `导出 ${list.length} 条项目（Excel）`);
  await loadLogs();
}
</script>

<style scoped>
.type-select-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.type-intro {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.type-card {
  cursor: pointer;
}
.type-title {
  font-size: 15px;
  font-weight: 600;
}
.type-desc {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.flow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding-top: 4px;
}
.node {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
}
.arrow {
  color: var(--el-text-color-secondary);
}
</style>
