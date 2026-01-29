# DDD 依赖关系图 (Mermaid)

**生成命令:** `pnpm ddd:mermaid`  
**源文件:** `dependencies.mmd`

## 🎨 在线预览

将 `dependencies.mmd` 文件内容复制到以下任一网站查看：
- [Mermaid Live Editor](https://mermaid.live/) - 官方在线编辑器
- [GitHub](https://github.com) - 直接在 Markdown 中显示
- [VS Code](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) - 安装 Markdown Preview Mermaid 插件

## 📝 使用方法

### 方法 1：在 Markdown 中嵌入

```markdown
\`\`\`mermaid
flowchart LR
  Domain --> Application
  Application --> Infrastructure
\`\`\`
```

### 方法 2：在线查看

```bash
# 复制内容到剪贴板
cat docs/ddd-diagrams/dependencies.mmd | pbcopy

# 然后访问 https://mermaid.live/ 粘贴查看
```

### 方法 3：在 VS Code 中预览

1. 安装 Mermaid 插件
2. 打开 `dependencies.md`
3. 使用 Markdown Preview

## 🔄 重新生成

```bash
pnpm ddd:mermaid
```

## 📊 文件信息

- **格式:** Mermaid flowchart
- **行数:** 315 行
- **内容:** 完整的 DDD 层级和模块依赖关系

## 🎯 优势

相比 SVG 图表，Mermaid 的优势：
- ✓ 纯文本格式，易于版本控制
- ✓ 可以直接在 GitHub/GitLab 的 Markdown 中显示
- ✓ 可编辑和自定义
- ✓ 文件体积小
- ✓ 支持在线编辑器

## 📚 参考

- [Mermaid 官方文档](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [GitHub Mermaid 支持](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)
