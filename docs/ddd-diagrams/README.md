# DDD 架构图表

这个文件夹包含自动生成的 DDD 架构可视化图表。

## 📊 文件说明

### SVG 格式（需要 graphviz）

#### 1. `dependencies.svg` ⭐ 推荐
- **大小:** ~163KB
- **内容:** 完整的模块依赖关系图
- **特点:** 
  - 显示所有文件级别的依赖
  - 包含依赖箭头指向
  - 最详细和有用的图表
- **生成命令:** `pnpm ddd:graph`
- **用途:** 理解代码结构、追踪依赖关系

#### 2. `architecture.svg`
- **大小:** ~4KB
- **内容:** 高层 DDD 架构概览
- **特点:**
  - 显示 Domain、Application、Infrastructure 三层
  - 简洁的层级视图
- **生成命令:** `pnpm ddd:archi`
- **用途:** 文档展示、架构演示

#### 3. `report.html`
- **大小:** ~366KB
- **内容:** 交互式 HTML 报告
- **特点:**
  - 可点击的依赖图
  - 搜索功能
  - 违规检测列表
  - 模块统计信息
- **生成命令:** `pnpm ddd:report`
- **用途:** 深度分析、Code Review

### Mermaid 格式（纯文本，Git 友好）

#### 4. `dependencies.mmd` 🎨 NEW
- **大小:** ~15KB
- **内容:** Mermaid 格式的依赖关系图
- **特点:**
  - 纯文本格式
  - 可以在 GitHub 中直接渲染
  - 易于版本控制
  - 可编辑
- **生成命令:** `pnpm ddd:mermaid`
- **用途:** 文档中嵌入、在线查看、Git 版本控制

#### 5. `dependencies.md`
- 说明如何使用 Mermaid 图表

#### 6. `strategic-design.md` ⭐ 手写
- **内容:** 手工绘制的 DDD 战略设计图
- **包含:**
  - 架构层级关系
  - 领域模型类图
  - 核心用例流程
  - 应用服务依赖图
  - LangGraph 状态流转
  - 基础设施依赖
  - 部署架构
- **用途:** 文档、演示、团队沟通

## 🚀 快速开始

```bash
# 查看最有用的依赖图
open docs/ddd-diagrams/dependencies.svg

# 查看交互式报告
open docs/ddd-diagrams/report.html
```

## 🔄 重新生成

```bash
# SVG 格式
pnpm ddd:graph    # 生成 dependencies.svg
pnpm ddd:archi    # 生成 architecture.svg
pnpm ddd:report   # 生成 report.html

# Mermaid 格式 🎨
pnpm ddd:mermaid  # 生成 dependencies.mmd

# 一次性生成所有
pnpm ddd:all      # 包含所有格式
```

## 🎨 颜色编码

图表中使用以下颜色区分层级：

| 颜色 | 层级 | 说明 |
|------|------|------|
| 🔴 红色 | Domain | 实体、值对象、领域服务 |
| 🟢 绿色 | Application | 用例、DTO、应用接口 |
| 🔵 蓝色 | Infrastructure | 仓储、AI 服务、数据库 |
| 🟡 黄色 | API App | Hono REST API |
| 🟣 紫色 | Web App | Next.js 前端 |

## 📚 完整文档

详细使用指南请参考：
- [DDD_VISUALIZATION.md](../DDD_VISUALIZATION.md) - 完整文档
- [DDD_QUICK_START.md](../DDD_QUICK_START.md) - 快速开始
- [DDD_IMPLEMENTATION_SUMMARY.md](../DDD_IMPLEMENTATION_SUMMARY.md) - 实施总结

## ⚠️ 注意事项

- 这些文件是自动生成的，**不要手动编辑**
- 每次运行 `pnpm ddd:*` 命令都会覆盖现有文件
- 建议在重大架构变更后重新生成
- 可以将这些文件提交到 Git 用于文档目的

---

**最后更新:** 2026-01-29  
**生成工具:** dependency-cruiser + graphviz
