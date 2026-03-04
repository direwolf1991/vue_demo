<script setup>
import { ref, computed } from 'vue'
import { state, PROJECT_TYPES, genProjectCode, addLog, validateProject } from '../data/mock'

const filters = ref({
  code: '',
  name: '',
  owner: '',
  type: '',
  status: '',
})
const page = ref(1)
const pageSize = 15
const selectedIds = ref(new Set())
const showForm = ref(false)
const showFilter = ref(false)
const showDeleteConfirm = ref(false)
const editProject = ref(null)
const form = ref({
  name: '',
  type: '',
  startDate: '',
  endDate: '',
  budget: '',
  owner: '',
  department: '',
  description: '',
})
const errors = ref([])
const filterDraft = ref({
  code: '',
  name: '',
  owner: '',
  type: '',
  status: '',
})

const ownerOptions = computed(() => {
  const set = new Set()
  for (const p of state.projects) {
    if (p.owner) set.add(p.owner)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const statusOptions = computed(() => {
  const set = new Set()
  for (const p of state.projects) {
    if (p.status) set.add(p.status)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const filtered = computed(() => {
  const list = state.projects.filter(p => {
    const byCode = filters.value.code ? p.code.includes(filters.value.code.trim()) : true
    const byName = filters.value.name ? p.name.includes(filters.value.name.trim()) : true
    const byOwner = filters.value.owner ? (p.owner || '').includes(filters.value.owner.trim()) : true
    const byType = filters.value.type ? p.type === filters.value.type : true
    const byStatus = filters.value.status ? p.status === filters.value.status : true
    return byCode && byName && byOwner && byType && byStatus
  })
  return list.sort((a, b) => a.code.localeCompare(b.code))
})

const pageCount = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

function toggleSelect(id) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

function openFilter() {
  filterDraft.value = { ...filters.value }
  showFilter.value = true
}

function applyFilter() {
  filters.value = { ...filterDraft.value }
  page.value = 1
  showFilter.value = false
  addLog('筛选项目', '更新筛选条件')
}

function resetFilter() {
  filterDraft.value = { code: '', name: '', owner: '', type: '', status: '' }
}

function resetForm() {
  editProject.value = null
  form.value = {
    name: '',
    type: '',
    startDate: '',
    endDate: '',
    budget: '',
    owner: '',
    department: '',
    description: '',
  }
  errors.value = []
}

function onCreate() {
  resetForm()
  showForm.value = true
}

function onEdit(p) {
  editProject.value = p
  form.value = {
    name: p.name,
    type: p.type,
    startDate: p.startDate,
    endDate: p.endDate,
    budget: String(p.budget ?? ''),
    owner: p.owner ?? '',
    department: p.department ?? '',
    description: p.description ?? '',
    _originalType: p.type,
  }
  errors.value = []
  showForm.value = true
}

function saveForm() {
  errors.value = validateProject(form.value, !!editProject.value)
  if (errors.value.length) return
  if (editProject.value) {
    Object.assign(editProject.value, {
      name: form.value.name.trim(),
      // type 不可修改
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      budget: Number(form.value.budget || 0),
      owner: form.value.owner,
      department: form.value.department,
      description: form.value.description,
    })
    addLog('编辑项目', `【${editProject.value.code}】${editProject.value.name}`)
  } else {
    const project = {
      id: Date.now(),
      code: genProjectCode(),
      name: form.value.name.trim(),
      type: form.value.type,
      status: '待启动',
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      budget: Number(form.value.budget || 0),
      owner: form.value.owner,
      department: form.value.department,
      description: form.value.description,
      milestones: form.value.type === PROJECT_TYPES.CONSTRUCTION ? [] : undefined,
      staffing: form.value.type === PROJECT_TYPES.OPTIMIZATION ? { contractAmount: 0, people: [] } : undefined,
    }
    state.projects.push(project)
    addLog('创建项目', `【${project.code}】${project.name}`)
  }
  showForm.value = false
}

function batchDelete() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) return
  showDeleteConfirm.value = true
}

function confirmBatchDelete() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) {
    showDeleteConfirm.value = false
    return
  }
  const keep = []
  const removed = []
  for (const p of state.projects) {
    if (ids.includes(p.id) && p.status === '待启动') {
      removed.push(p)
    } else {
      keep.push(p)
    }
  }
  state.projects.splice(0, state.projects.length, ...keep)
  selectedIds.value.clear()
  addLog('批量删除', `删除 ${removed.length} 个「待启动」项目`)
  showDeleteConfirm.value = false
}

function exportExcelSelected() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) return
  const selected = state.projects.filter(p => ids.includes(p.id))
  const cols = [
    { key: 'code', title: '项目编号' },
    { key: 'name', title: '项目名称' },
    { key: 'type', title: '项目类型' },
    { key: 'status', title: '项目状态' },
    { key: 'startDate', title: '项目开始日期' },
    { key: 'endDate', title: '计划项目结束日期' },
    { key: 'owner', title: '项目经理' },
    { key: 'department', title: '所属部门' },
    { key: 'budget', title: '项目预算' },
    { key: 'description', title: '项目简介' },
  ]
  const escapeHtml = s =>
    String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  const header = `<tr>${cols.map(c => `<th>${escapeHtml(c.title)}</th>`).join('')}</tr>`
  const body = selected
    .map(p => {
      const cells = cols
        .map(c => {
          const v = c.key === 'budget' ? Number(p.budget ?? 0).toFixed(2) : p[c.key]
          return `<td>${escapeHtml(v)}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
  const html = `<!doctype html><html><head><meta charset="UTF-8" /></head><body><table border="1">${header}${body}</table></body></html>`
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'projects.xls'
  a.click()
  URL.revokeObjectURL(url)
  addLog('批量导出', `导出 ${selected.length} 条项目（Excel）`)
}

defineEmits(['open-progress'])
</script>

<template>
  <div class="card">
    <div class="card-header">
      <div class="title">项目</div>
      <div class="toolbar">
        <button class="btn primary" @click="onCreate">创建项目</button>
        <button class="btn danger" @click="batchDelete">批量删除（仅待启动）</button>
        <button class="btn" @click="exportExcelSelected">批量导出（Excel）</button>
        <button class="btn" @click="openFilter">搜索</button>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th style="width:32px"></th>
          <th>项目编号（升序）</th>
          <th>项目名称</th>
          <th>类型</th>
          <th>状态</th>
          <th>开始</th>
          <th>结束</th>
          <th>预算</th>
          <th>负责人</th>
          <th>部门</th>
          <th style="width:160px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in paged" :key="p.id">
          <td><input type="checkbox" :checked="selectedIds.has(p.id)" @change="toggleSelect(p.id)" /></td>
          <td>{{ p.code }}</td>
          <td>
            <a href="javascript:void(0)" class="link" @click="$emit('open-progress', p.id)">{{ p.name }}</a>
          </td>
          <td>{{ p.type }}</td>
          <td>{{ p.status }}</td>
          <td>{{ p.startDate }}</td>
          <td>{{ p.endDate }}</td>
          <td>{{ Number(p.budget ?? 0).toFixed(2) }}</td>
          <td>{{ p.owner }}</td>
          <td>{{ p.department }}</td>
          <td>
            <button class="btn" @click="onEdit(p)">编辑</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button class="btn" :disabled="page===1" @click="page--">上一页</button>
      <span>第 {{ page }} / {{ pageCount }} 页</span>
      <button class="btn" :disabled="page===pageCount" @click="page++">下一页</button>
    </div>
  </div>

  <div v-if="showForm" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="title">{{ editProject ? '编辑项目' : '创建项目' }}</div>
        <button class="btn" @click="showForm=false">关闭</button>
      </div>

      <div class="form">
        <div class="row">
          <label>项目名称</label>
          <input class="input" v-model="form.name" placeholder="≤50字" />
        </div>
        <div class="row">
          <label>项目类型</label>
          <select class="input" v-model="form.type" :disabled="!!editProject">
            <option value="">请选择</option>
            <option :value="PROJECT_TYPES.CONSTRUCTION">建设类</option>
            <option :value="PROJECT_TYPES.OPTIMIZATION">日常优化类</option>
          </select>
        </div>
        <div class="row">
          <label>开始时间</label>
          <input class="input" type="date" v-model="form.startDate" />
        </div>
        <div class="row">
          <label>结束时间</label>
          <input class="input" type="date" v-model="form.endDate" />
        </div>
        <div class="row">
          <label>预算（保留2位小数）</label>
          <input class="input" v-model="form.budget" placeholder="如 100000.00" />
        </div>
        <div class="row">
          <label>负责人</label>
          <input class="input" v-model="form.owner" />
        </div>
        <div class="row">
          <label>部门</label>
          <input class="input" v-model="form.department" />
        </div>
        <div class="row">
          <label>说明（富文本简化为多行）</label>
          <textarea class="input" rows="3" v-model="form.description"></textarea>
        </div>
      </div>

      <div v-if="errors.length" class="errors">
        <div v-for="e in errors" :key="e" class="error">{{ e }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn primary" @click="saveForm">保存</button>
      </div>
    </div>
  </div>

  <div v-if="showFilter" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="title">项目筛选</div>
        <button class="btn" @click="showFilter=false">关闭</button>
      </div>

      <div class="form">
        <div class="row">
          <label>项目编号</label>
          <input class="input" v-model="filterDraft.code" />
        </div>
        <div class="row">
          <label>项目名称</label>
          <input class="input" v-model="filterDraft.name" />
        </div>
        <div class="row">
          <label>项目经理</label>
          <div>
            <input class="input" v-model="filterDraft.owner" list="owner-options" placeholder="支持模糊搜索" />
            <datalist id="owner-options">
              <option v-for="o in ownerOptions" :key="o" :value="o"></option>
            </datalist>
          </div>
        </div>
        <div class="row">
          <label>项目类型</label>
          <select class="input" v-model="filterDraft.type">
            <option value="">全部</option>
            <option :value="PROJECT_TYPES.CONSTRUCTION">建设类项目</option>
            <option :value="PROJECT_TYPES.OPTIMIZATION">日常优化类项目</option>
          </select>
        </div>
        <div class="row">
          <label>项目状态</label>
          <select class="input" v-model="filterDraft.status">
            <option value="">全部</option>
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="resetFilter">重置</button>
        <button class="btn primary" @click="applyFilter">搜索</button>
      </div>
    </div>
  </div>

  <div v-if="showDeleteConfirm" class="modal">
    <div class="modal-content" style="width: 520px">
      <div class="modal-header">
        <div class="title">确认删除</div>
        <button class="btn" @click="showDeleteConfirm=false">关闭</button>
      </div>
      <div class="form">
        <div style="color:#333">是否确认删除？删除后不可恢复。</div>
        <div style="margin-top:6px;color:#666">仅「待启动」状态项目会被删除。</div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="showDeleteConfirm=false">取消</button>
        <button class="btn danger" @click="confirmBatchDelete">确认删除</button>
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
  gap: 8px;
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
  cursor: pointer;
}
.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}
.btn {
  background: #f3f4f6;
  border: 1px solid #c9ced6;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
}
.btn.primary {
  background: #1f8ef1;
  border-color: #1773c2;
  color: #fff;
}
.btn.danger {
  background: #ffebe9;
  border-color: #ffb3ac;
  color: #d03a2e;
}
.input {
  border: 1px solid #c9ced6;
  border-radius: 4px;
  padding: 6px 8px;
  background: #fff;
  min-width: 160px;
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
  width: 720px;
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
.form {
  padding: 12px 16px;
}
.row {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.errors {
  padding: 8px 16px;
}
.error {
  color: #d03a2e;
  font-size: 13px;
}
</style>
