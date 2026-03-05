# 项目管理（Geeker Admin 版）

当前项目已统一基于 **Geeker Admin（Vue3 + Element Plus + ProTable）** 进行融合重构，核心功能为「项目管理」模块。

## 本地启动

```bash
pnpm dev
```

默认地址：`http://localhost:8848/`

## 功能入口

- 项目列表：`/project/list`
- 项目进度：`/project/progress/:id`
- 里程碑任务（隐藏路由）：`/project/milestoneTasks/:projectId/:milestoneId`
- 任务详情（隐藏路由）：`/project/taskDetail/:projectId/:taskId`

## 目录说明

- Geeker Admin 主工程：`geeker-admin/`
- 项目管理页面：
  - `geeker-admin/src/views/project/list`
  - `geeker-admin/src/views/project/progress`
  - `geeker-admin/src/views/project/milestoneTasks`
  - `geeker-admin/src/views/project/taskDetail`
