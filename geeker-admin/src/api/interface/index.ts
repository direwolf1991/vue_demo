// 请求响应参数（不包含data）
export interface Result {
  code: string;
  msg: string;
}

// 请求响应参数（包含data）
export interface ResultData<T = any> extends Result {
  data: T;
}

// 分页响应参数
export interface ResPage<T> {
  list: T[];
  pageNum: number;
  pageSize: number;
  total: number;
}

// 分页请求参数
export interface ReqPage {
  pageNum: number;
  pageSize: number;
}

// 文件上传模块
export namespace Upload {
  export interface ResFileUrl {
    fileUrl: string;
  }
}

// 登录模块
export namespace Login {
  export interface ReqLoginForm {
    username: string;
    password: string;
  }
  export interface ResLogin {
    access_token: string;
  }
  export interface ResAuthButtons {
    [key: string]: string[];
  }
}

// 用户管理模块
export namespace User {
  export interface ReqUserParams extends ReqPage {
    username: string;
    gender: number;
    idCard: string;
    email: string;
    address: string;
    createTime: string[];
    status: number;
  }
  export interface ResUserList {
    id: string;
    username: string;
    gender: number;
    user: { detail: { age: number } };
    idCard: string;
    email: string;
    address: string;
    createTime: string;
    status: number;
    avatar: string;
    photo: any[];
    children?: ResUserList[];
  }
  export interface ResStatus {
    userLabel: string;
    userValue: number;
  }
  export interface ResGender {
    genderLabel: string;
    genderValue: number;
  }
  export interface ResDepartment {
    id: string;
    name: string;
    children?: ResDepartment[];
  }
  export interface ResRole {
    id: string;
    name: string;
    children?: ResDepartment[];
  }
}

// 项目管理模块
export namespace Project {
  export type ProjectType = "建设类" | "日常优化类";

  export interface LogItem {
    action: string;
    detail: string;
    id: string;
    time: string;
    userId: string;
  }

  export interface Task {
    actualEnd?: null | string;
    actualStart?: null | string;
    assignee?: string;
    effortHours?: number;
    id: string;
    name: string;
    plannedEnd: string;
    plannedStart: string;
    progress: number;
    status: string;
  }

  export interface Milestone {
    children?: Milestone[];
    id: string;
    name: string;
    owner: string;
    plannedEnd: string;
    plannedStart: string;
    tasks: Task[];
  }

  export interface StaffingPerson {
    pricePerHour: number;
    tasks: Task[];
    user: string;
  }

  export interface Staffing {
    contractAmount: number;
    people: StaffingPerson[];
  }

  export interface Phase {
    id: string;
    name: string;
    plannedEnd: string;
    plannedStart: string;
    tasks: Task[];
  }

  export interface ProjectItem {
    budget: number;
    code: string;
    department: string;
    description: string;
    endDate: string;
    id: number;
    milestones?: Milestone[];
    name: string;
    owner: string;
    phases?: Phase[];
    staffing?: Staffing;
    startDate: string;
    status: string;
    type: ProjectType;
  }

  export interface ReqProjectParams extends ReqPage {
    code?: string;
    name?: string;
    owner?: string;
    status?: string;
    type?: "" | ProjectType;
  }
}
