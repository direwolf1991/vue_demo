import { reactive } from 'vue'

export const PROJECT_TYPES = {
  CONSTRUCTION: '建设类',
  OPTIMIZATION: '日常优化类',
}

let seq = 1
export function genProjectCode() {
  const date = new Date()
  const y = date.getFullYear().toString()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const code = `P${y}${m}${d}-${String(seq).padStart(4, '0')}`
  seq += 1
  return code
}

export const state = reactive({
  logs: [],
  projects: [
    {
      id: 1,
      code: 'P20260303-0001',
      name: '新办公园区网络建设',
      type: PROJECT_TYPES.CONSTRUCTION,
      status: '进行中',
      startDate: '2026-03-01',
      endDate: '2026-06-30',
      budget: 1200000.0,
      owner: '王强',
      department: '信息化部',
      description: '园区网络与安全体系建设（里程碑驱动）',
      milestones: [
        {
          id: 'M1',
          name: '方案设计',
          owner: '刘敏',
          plannedStart: '2026-03-01',
          plannedEnd: '2026-03-15',
          tasks: [
            {
              id: 'T1',
              name: '需求调研',
              assignee: '刘敏',
              status: '已完成',
              plannedStart: '2026-03-01',
              plannedEnd: '2026-03-05',
              actualStart: '2026-03-01',
              actualEnd: '2026-03-04',
              progress: 100,
              effortHours: 24,
            },
            {
              id: 'T2',
              name: '设计评审',
              assignee: '王强',
              status: '进行中',
              plannedStart: '2026-03-06',
              plannedEnd: '2026-03-12',
              actualStart: '2026-03-06',
              actualEnd: null,
              progress: 60,
              effortHours: 18,
            },
          ],
          children: [
            {
              id: 'M1-1',
              name: '安全策略设计',
              owner: '张华',
              plannedStart: '2026-03-10',
              plannedEnd: '2026-03-20',
              tasks: [
                {
                  id: 'T3',
                  name: '策略草案',
                  assignee: '张华',
                  status: '进行中',
                  plannedStart: '2026-03-10',
                  plannedEnd: '2026-03-16',
                  actualStart: '2026-03-11',
                  actualEnd: null,
                  progress: 40,
                  effortHours: 12,
                },
              ],
            },
          ],
        },
        {
          id: 'M2',
          name: '设备采购与部署',
          owner: '王强',
          plannedStart: '2026-03-16',
          plannedEnd: '2026-06-15',
          tasks: [
            {
              id: 'T4',
              name: '招标与采购',
              assignee: '王强',
              status: '未开始',
              plannedStart: '2026-03-16',
              plannedEnd: '2026-04-15',
              actualStart: null,
              actualEnd: null,
              progress: 0,
              effortHours: 0,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      code: 'P20260303-0002',
      name: '电商站点日常性能优化',
      type: PROJECT_TYPES.OPTIMIZATION,
      status: '进行中',
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      budget: 300000.0,
      owner: '李青',
      department: '研发部',
      description: '站点性能与稳定性持续优化（人员-任务）',
      staffing: {
        contractAmount: 200000.0,
        people: [
          {
            user: '陈亮',
            pricePerHour: 300,
            tasks: [
              {
                id: 'O1',
                name: '首页资源压缩',
                status: '已完成',
                progress: 100,
                effortHours: 20,
                plannedStart: '2026-03-01',
                plannedEnd: '2026-03-10',
              },
              {
                id: 'O2',
                name: '关键路径优化',
                status: '进行中',
                progress: 50,
                effortHours: 16,
                plannedStart: '2026-03-11',
                plannedEnd: '2026-03-31',
              },
            ],
          },
          {
            user: '赵敏',
            pricePerHour: 280,
            tasks: [
              {
                id: 'O3',
                name: '数据库慢查询治理',
                status: '进行中',
                progress: 40,
                effortHours: 12,
                plannedStart: '2026-03-05',
                plannedEnd: '2026-04-10',
              },
            ],
          },
        ],
      },
      phases: [
        {
          id: 'PH1',
          name: '项目立项',
          plannedStart: '2026-03-01',
          plannedEnd: '2026-03-10',
          tasks: [
            { id: 'O1', name: '首页资源压缩', status: '已完成', progress: 100, plannedStart: '2026-03-01', plannedEnd: '2026-03-10' },
          ],
        },
        {
          id: 'PH2',
          name: '设计研发',
          plannedStart: '2026-03-11',
          plannedEnd: '2026-04-10',
          tasks: [
            { id: 'O2', name: '关键路径优化', status: '进行中', progress: 50, plannedStart: '2026-03-11', plannedEnd: '2026-03-31' },
            { id: 'O3', name: '数据库慢查询治理', status: '进行中', progress: 40, plannedStart: '2026-03-05', plannedEnd: '2026-04-10' },
          ],
        },
      ],
    },
    {
      id: 3,
      code: 'P20260303-0003',
      name: '测试待启动项目',
      type: PROJECT_TYPES.CONSTRUCTION,
      status: '待启动',
      startDate: '2026-03-10',
      endDate: '2026-05-31',
      budget: 100000.0,
      owner: '测试',
      department: '测试部',
      description: '用于演示批量删除与导出',
      milestones: [],
    },
  ],
})

export function addLog(action, detail) {
  state.logs.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toISOString(),
    action,
    detail,
  })
}

export function validateProject(payload, isEdit = false) {
  const errors = []
  const name = (payload.name || '').trim()
  if (!name) errors.push('项目名称不能为空')
  if (name.length > 50) errors.push('项目名称需≤50字')
  if (!payload.type) errors.push('项目类型不能为空')
  if (!payload.startDate || !payload.endDate) errors.push('开始与结束时间必填')
  if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
    errors.push('开始时间需≤结束时间')
  }
  if (payload.budget !== undefined) {
    const b = Number(payload.budget)
    if (Number.isNaN(b)) errors.push('预算需为数字')
    else if (b < 0) errors.push('预算不可为负数')
    else if (!/^\d+(\.\d{1,2})?$/.test(String(payload.budget))) errors.push('预算保留2位小数')
  }
  if (isEdit && payload._originalType && payload.type !== payload._originalType) {
    errors.push('编辑时项目类型不可修改')
  }
  return errors
}
