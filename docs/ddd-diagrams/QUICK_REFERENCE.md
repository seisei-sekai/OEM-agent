# DDD 可视化快速参考

## 🎯 最常用命令

```bash
# 生成详细依赖图（最有用）⭐
pnpm ddd:graph

# 查看依赖图
open docs/ddd-diagrams/dependencies.svg

# 验证 DDD 规则
pnpm ddd:validate
```

## 📊 三种图表对比

| 图表 | 文件 | 大小 | 推荐度 | 用途 |
|------|------|------|--------|------|
| **依赖图** | `dependencies.svg` | 163KB | ⭐⭐⭐⭐⭐ | 查看所有依赖关系和箭头 |
| 交互报告 | `report.html` | 366KB | ⭐⭐⭐⭐ | 深度分析、搜索功能 |
| 架构图 | `architecture.svg` | 4KB | ⭐⭐⭐ | 简单的层级视图 |

## 🚀 一行命令

```bash
# 生成并查看依赖图
pnpm ddd:graph && open docs/ddd-diagrams/dependencies.svg

# 生成所有图表
pnpm ddd:all
```

## 🎨 图表说明

### dependencies.svg（推荐）
- ✓ 显示所有文件和它们的依赖
- ✓ 包含依赖箭头（A → B 表示 A 依赖 B）
- ✓ 颜色编码：红=Domain, 绿=Application, 蓝=Infrastructure
- ✓ 最完整的视图

### report.html
- ✓ 可点击的交互式图表
- ✓ 搜索和过滤功能
- ✓ 违规检测列表
- ✓ 模块统计

### architecture.svg
- ✓ 高层概览
- ✓ 三层结构（Domain/Application/Infrastructure）
- ✓ 适合文档展示

## 📁 文件位置

```
docs/ddd-diagrams/
├── dependencies.svg    ← 查看这个 ⭐
├── architecture.svg
├── report.html
└── README.md
```

## 💡 使用场景

**开发中：**
```bash
pnpm ddd:validate  # 检查是否违反 DDD 规则
```

**Code Review：**
```bash
pnpm ddd:all  # 更新所有图表
```

**理解架构：**
```bash
open docs/ddd-diagrams/dependencies.svg  # 查看依赖关系
```

**深度分析：**
```bash
open docs/ddd-diagrams/report.html  # 使用交互式报告
```

---

**生成命令：** `pnpm ddd:graph`  
**最佳图表：** `dependencies.svg`
