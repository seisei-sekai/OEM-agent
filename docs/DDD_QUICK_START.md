# DDD 可视化快速开始

**Created:** 2026-01-29-21:50 (Tokyo Time)
**Last Updated:** 2026-01-29-21:50 (Tokyo Time)  
**Purpose:** DDD 架构可视化工具快速入门

---

## ✅ 已生成的文件

```bash
docs/ddd-diagrams/
├── architecture.svg    # 4.1KB - 架构层级图
├── dependencies.svg    # 163KB - 详细依赖图 ⭐ 推荐
└── report.html         # 366KB - 交互式报告

docs/
├── DDD_VISUALIZATION.md     # 完整文档
├── DDD_QUICK_START.md       # 快速开始
└── DDD_IMPLEMENTATION_SUMMARY.md  # 实施总结
```

## 🚀 快速使用

### 1. 验证 DDD 规则

```bash
pnpm ddd:validate
```

**当前状态:** ✅ No DDD layer violations found!

这意味着：

- Domain 层没有依赖外层（Application/Infrastructure）
- Application 层只依赖 Domain 接口
- 依赖反转原则正确实施

### 2. 查看架构图

打开生成的 SVG 文件：

```bash
# macOS
open docs/ddd-diagrams/dependencies.svg

# Linux
xdg-open docs/ddd-diagrams/dependencies.svg

# Windows
start docs\ddd-diagrams\dependencies.svg
```

**颜色说明：**

- 🔴 红色 = Domain 层（核心业务逻辑）
- 🟢 绿色 = Application 层（用例）
- 🔵 蓝色 = Infrastructure 层（外部集成）

### 3. 查看详细依赖（⭐ 推荐）

```bash
open docs/ddd-diagrams/dependencies.svg
```

显示所有文件级别的依赖关系，带箭头指向，最完整的依赖图。

### 4. 查看交互式报告

```bash
open docs/ddd-diagrams/report.html
```

包含：

- 可点击的依赖图
- 循环依赖检测
- 模块统计信息
- 违规详情

## 📊 所有命令

```bash
# 单独运行
pnpm ddd:validate   # 验证规则
pnpm ddd:graph      # 生成 SVG 依赖图
pnpm ddd:archi      # 生成 SVG 架构图
pnpm ddd:report     # 生成 HTML 报告
pnpm ddd:mermaid    # 生成 Mermaid 图表 🎨 NEW

# 一次性运行所有
pnpm ddd:all        # 包含所有格式
```

## 🎯 使用场景

### 开发时

```bash
# 修改代码后验证架构
pnpm ddd:validate
```

### Code Review 前

```bash
# 更新所有图表
pnpm ddd:all
```

### 新成员 Onboarding

```bash
# 打开交互式报告了解架构
open docs/ddd-diagrams/report.html

# 或查看详细依赖图
open docs/ddd-diagrams/dependencies.svg
```

### CI/CD 集成

```yaml
# 在 CI 中添加
- name: Validate DDD Architecture
  run: pnpm ddd:validate
```

## 📖 完整文档

详细信息请查看：[DDD_VISUALIZATION.md](./DDD_VISUALIZATION.md)

## 🔧 依赖

- `dependency-cruiser` - 依赖分析工具 ✅ 已安装
- `graphviz` (dot 命令) - 图表生成 ✅ 已安装

## 💡 最佳实践

1. **每次重大变更后运行** `pnpm ddd:all`
2. **提交前验证** `pnpm ddd:validate`
3. **定期查看** HTML 报告识别重构机会
4. **在文档中引用** 生成的图表

## 🎨 Mermaid 格式（NEW）

如果你想要纯文本、Git 友好的图表：

```bash
# 生成 Mermaid 格式
pnpm ddd:mermaid

# 在线查看
cat docs/ddd-diagrams/dependencies.mmd | pbcopy
# 访问 https://mermaid.live/ 粘贴

# 或查看手写的战略设计图（推荐）
open docs/ddd-diagrams/strategic-design.md
# 在 GitHub 或 VS Code 中会自动渲染
```

**Mermaid 优势：**

- ✓ 纯文本格式，易于版本控制
- ✓ 可以在 GitHub Markdown 中直接显示
- ✓ 文件体积小（4KB vs 163KB）
- ✓ 可编辑和自定义

---

**下一步：**

- SVG 格式：`open docs/ddd-diagrams/dependencies.svg`
- Mermaid 格式：查看 `docs/ddd-diagrams/strategic-design.md`
- 完整指南：[DDD_MERMAID_GUIDE.md](./DDD_MERMAID_GUIDE.md)
