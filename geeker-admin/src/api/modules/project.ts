import type { Project, ResPage, ResultData } from "@/api/interface";
import { useUserStore } from "@/stores/modules/user";

let seq = 1;
function genProjectCode() {
  const date = new Date();
  const y = date.getFullYear().toString();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const code = `P${y}${m}${d}-${String(seq).padStart(4, "0")}`;
  seq += 1;
  return code;
}

const logs: Project.LogItem[] = [];
function addLog(action: string, detail: string, userId?: string) {
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toISOString(),
    action,
    detail,
    userId: userId || useUserStore().userInfo?.name || "unknown"
  });
}

const projects: Project.ProjectItem[] = [
  {
    id: 1,
    code: "P20260303-0001",
    name: "新办公园区网络建设",
    type: "建设类",
    status: "进行中",
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    budget: 1200000.0,
    owner: "王强",
    department: "信息化部",
    description: "园区网络与安全体系建设（里程碑驱动）",
    milestones: [
      {
        id: "M1",
        name: "方案设计",
        owner: "刘敏",
        plannedStart: "2026-03-01",
        plannedEnd: "2026-03-15",
        tasks: [
          {
            id: "T1",
            name: "需求调研",
            assignee: "刘敏",
            status: "已完成",
            plannedStart: "2026-03-01",
            plannedEnd: "2026-03-05",
            actualStart: "2026-03-01",
            actualEnd: "2026-03-04",
            progress: 100,
            effortHours: 24
          },
          {
            id: "T2",
            name: "设计评审",
            assignee: "王强",
            status: "进行中",
            plannedStart: "2026-03-06",
            plannedEnd: "2026-03-12",
            actualStart: "2026-03-06",
            actualEnd: null,
            progress: 60,
            effortHours: 18
          }
        ],
        children: [
          {
            id: "M1-1",
            name: "安全策略设计",
            owner: "张华",
            plannedStart: "2026-03-10",
            plannedEnd: "2026-03-20",
            tasks: [
              {
                id: "T3",
                name: "策略草案",
                assignee: "张华",
                status: "进行中",
                plannedStart: "2026-03-10",
                plannedEnd: "2026-03-16",
                actualStart: "2026-03-11",
                actualEnd: null,
                progress: 40,
                effortHours: 12
              }
            ]
          }
        ]
      },
      {
        id: "M2",
        name: "设备采购与部署",
        owner: "王强",
        plannedStart: "2026-03-16",
        plannedEnd: "2026-06-15",
        tasks: [
          {
            id: "T4",
            name: "招标与采购",
            assignee: "王强",
            status: "未开始",
            plannedStart: "2026-03-16",
            plannedEnd: "2026-04-15",
            actualStart: null,
            actualEnd: null,
            progress: 0,
            effortHours: 0
          }
        ]
      }
    ]
  },
  {
    id: 2,
    code: "P20260303-0002",
    name: "电商站点日常性能优化",
    type: "日常优化类",
    status: "进行中",
    startDate: "2026-03-01",
    endDate: "2026-04-30",
    budget: 300000.0,
    owner: "李青",
    department: "研发部",
    description: "站点性能与稳定性持续优化（人员-任务）",
    staffing: {
      contractAmount: 200000.0,
      people: [
        {
          user: "陈亮",
          pricePerHour: 300,
          tasks: [
            {
              id: "O1",
              name: "首页资源压缩",
              status: "已完成",
              progress: 100,
              effortHours: 20,
              plannedStart: "2026-03-01",
              plannedEnd: "2026-03-10"
            },
            {
              id: "O2",
              name: "关键路径优化",
              status: "进行中",
              progress: 50,
              effortHours: 16,
              plannedStart: "2026-03-11",
              plannedEnd: "2026-03-31"
            }
          ]
        },
        {
          user: "赵敏",
          pricePerHour: 280,
          tasks: [
            {
              id: "O3",
              name: "数据库慢查询治理",
              status: "进行中",
              progress: 40,
              effortHours: 12,
              plannedStart: "2026-03-05",
              plannedEnd: "2026-04-10"
            }
          ]
        }
      ]
    },
    phases: [
      {
        id: "PH1",
        name: "项目立项",
        plannedStart: "2026-03-01",
        plannedEnd: "2026-03-10",
        tasks: [
          {
            id: "O1",
            name: "首页资源压缩",
            status: "已完成",
            progress: 100,
            plannedStart: "2026-03-01",
            plannedEnd: "2026-03-10"
          }
        ]
      },
      {
        id: "PH2",
        name: "设计研发",
        plannedStart: "2026-03-11",
        plannedEnd: "2026-04-10",
        tasks: [
          {
            id: "O2",
            name: "关键路径优化",
            status: "进行中",
            progress: 50,
            plannedStart: "2026-03-11",
            plannedEnd: "2026-03-31"
          },
          {
            id: "O3",
            name: "数据库慢查询治理",
            status: "进行中",
            progress: 40,
            plannedStart: "2026-03-05",
            plannedEnd: "2026-04-10"
          }
        ]
      }
    ]
  },
  {
    id: 3,
    code: "P20260303-0003",
    name: "测试待启动项目",
    type: "建设类",
    status: "待启动",
    startDate: "2026-03-10",
    endDate: "2026-05-31",
    budget: 100000.0,
    owner: "测试",
    department: "测试部",
    description: "用于演示批量删除与导出",
    milestones: []
  }
];

export function validateProject(payload: Record<string, any>, isEdit = false) {
  const errors: string[] = [];
  const name = (payload.name || "").trim();
  if (!name) errors.push("项目名称不能为空");
  if (name.length > 50) errors.push("项目名称需≤50字");
  if (!payload.type) errors.push("项目类型不能为空");
  if (!payload.startDate || !payload.endDate) errors.push("开始与结束时间必填");
  if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
    errors.push("开始时间需≤结束时间");
  }
  if (payload.budget !== undefined) {
    const b = Number(payload.budget);
    if (Number.isNaN(b)) errors.push("预算需为数字");
    else if (b < 0) errors.push("预算不可为负数");
    else if (!/^\d+(\.\d{1,2})?$/.test(String(payload.budget))) errors.push("预算保留2位小数");
  }
  if (isEdit && payload._originalType && payload.type !== payload._originalType) {
    errors.push("编辑时项目类型不可修改");
  }
  return errors;
}

export function getProjectList(params: Project.ReqProjectParams): Promise<ResultData<ResPage<Project.ProjectItem>>> {
  const pageNum = Number(params.pageNum) || 1;
  const pageSize = Number(params.pageSize) || 10;
  const { code, name, owner, status, type } = params;
  const list = projects
    .filter(p => (code ? p.code.includes(code.trim()) : true))
    .filter(p => (name ? p.name.includes(name.trim()) : true))
    .filter(p => (owner ? (p.owner || "").includes(owner.trim()) : true))
    .filter(p => (status ? p.status === status : true))
    .filter(p => (type ? p.type === type : true))
    .sort((a, b) => a.code.localeCompare(b.code));

  const start = (pageNum - 1) * pageSize;
  const pageList = list.slice(start, start + pageSize);
  return Promise.resolve({
    code: "0000",
    msg: "success",
    data: { list: pageList, pageNum, pageSize, total: list.length }
  });
}

export function getProjectById(id: number): Promise<ResultData<Project.ProjectItem | null>> {
  const p = projects.find(x => x.id === id) || null;
  return Promise.resolve({ code: "0000", msg: "success", data: p });
}

export function getProjectLogs(): Promise<ResultData<Project.LogItem[]>> {
  return Promise.resolve({ code: "0000", msg: "success", data: logs });
}

export function addProjectLog(action: string, detail: string, userId?: string): Promise<ResultData<boolean>> {
  addLog(action, detail, userId);
  return Promise.resolve({ code: "0000", msg: "success", data: true });
}

export function createProject(payload: {
  budget: number;
  department: string;
  description: string;
  endDate: string;
  milestones?: Project.Milestone[];
  name: string;
  owner: string;
  phases?: Project.Phase[];
  staffing?: Project.Staffing;
  startDate: string;
  type: Project.ProjectType;
}): Promise<ResultData<Project.ProjectItem>> {
  const project: Project.ProjectItem = {
    id: Date.now(),
    code: genProjectCode(),
    status: "待启动",
    ...payload
  };
  projects.push(project);
  addLog("创建项目", `【${project.code}】${project.name}`, useUserStore().userInfo?.name || "unknown");
  return Promise.resolve({ code: "0000", msg: "success", data: project });
}

export function updateProject(
  id: number,
  payload: Partial<Project.ProjectItem>
): Promise<ResultData<Project.ProjectItem | null>> {
  const idx = projects.findIndex(x => x.id === id);
  if (idx < 0) return Promise.resolve({ code: "404", msg: "not found", data: null });
  projects[idx] = { ...projects[idx], ...payload };
  addLog("编辑项目", `【${projects[idx].code}】${projects[idx].name}`, useUserStore().userInfo?.name || "unknown");
  return Promise.resolve({ code: "0000", msg: "success", data: projects[idx] });
}

export function batchDeleteProjects(ids: number[]): Promise<ResultData<{ removed: number }>> {
  const before = projects.length;
  const remain = projects.filter(p => !(ids.includes(p.id) && p.status === "待启动"));
  projects.splice(0, projects.length, ...remain);
  addLog("批量删除", `删除 ${before - projects.length} 个「待启动」项目`);
  return Promise.resolve({ code: "0000", msg: "success", data: { removed: before - projects.length } });
}
