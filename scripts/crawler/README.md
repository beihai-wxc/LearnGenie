# Huggingface 知识库爬虫

专为 LearnGenie 项目定制的 Huggingface 文章爬虫，自动将爬取的内容转换为知识库 JSON 格式，并使用 Playwright 将文档页面保存为高质量 PDF。

## 功能特性

- ✅ 爬取 Huggingface Blog 技术文章
- ✅ 爬取 Huggingface Docs 官方文档
- ✅ 自动分类到对应的 AI 课程模块
- ✅ 智能提取关键词和生成摘要
- ✅ 支持增量更新和去重
- ✅ 输出格式完全兼容 LearnGenie 知识库
- ✅ **使用 Playwright 将文档页面保存为高质量 PDF**
- ✅ **综合清理工具，一键清理重复文档和孤儿PDF**

## 安装依赖

### 基础依赖
```bash
cd scripts/crawler
pip install -r requirements.txt
```

### PDF 生成依赖（可选，用于保存原文 PDF）
```bash
pip install playwright
```

**注意**：脚本会自动使用系统已安装的 **Microsoft Edge** 浏览器，无需下载 Chromium。

## 使用方法

### 1. 爬取全部内容（推荐）

```bash
python hf_crawler.py --target all --output ../../rag/knowledge_base_crawled.json
```

### 2. 只爬取博客文章

```bash
python hf_crawler.py --target blog --output ../../rag/knowledge_base_crawled.json
```

### 3. 只爬取官方文档

```bash
python hf_crawler.py --target docs --output ../../rag/knowledge_base_crawled.json
```

### 4. 测试模式（只爬取少量文章）

```bash
python hf_crawler.py --target all --max-articles 5 --output ../../rag/knowledge_base_crawled.json
```

### 5. 合并到现有知识库

```bash
python hf_crawler.py --target all --merge --existing ../../rag/knowledge_base.json --output ../../rag/knowledge_base.json
```

---

## 保存原文 PDF

### 方法一：批量保存所有文档为 PDF

```bash
python cleanup.py --regenerate-pdfs --max-docs 10
```

**参数说明：**
- `--regenerate-pdfs`: 重新生成高质量PDF
- `--max-docs`: 最多处理文档数（用于测试）
- `--no-dry-run`: 实际执行（默认是试运行）

### 方法二：保存单个页面为 PDF

```bash
python save_page_as_pdf.py --url https://huggingface.co/docs/trl/index --output ../../rag/pdfs/trl-docs.pdf
```

**参数说明：**
- `--url`: 要保存的网页 URL
- `--output`: PDF 输出路径
- `--wait-selector`: 等待内容加载的 CSS 选择器（默认：`article, main, .content`）

---

## 知识库清理工具

`cleanup.py` 是综合清理工具，可以一键完成以下任务：

### 功能
1. **清理重复文档** - 删除 uploaded-docs.json 中的重复 upload-* 文档
2. **清理孤儿PDF** - 删除 JSON 中没有引用的 PDF 文件
3. **重新生成PDF** - 使用 Playwright 生成高质量 PDF

### 使用方法

```bash
# 试运行（查看将要清理的内容）
python cleanup.py

# 执行清理（删除重复文档和孤儿PDF）
python cleanup.py --no-dry-run

# 只清理孤儿PDF
python cleanup.py --orphan-pdfs-only --no-dry-run

# 清理并重新生成高质量PDF
python cleanup.py --no-dry-run --regenerate-pdfs

# 测试模式（只处理3篇文档）
python cleanup.py --no-dry-run --regenerate-pdfs --max-docs 3
```

---

## 完整工作流程

### 初次使用

```bash
# 1. 爬取文档
python hf_crawler.py --target all --output ../../rag/knowledge_base_crawled.json

# 2. 导入到 LearnGenie
python import_to_app.py --input ../../rag/knowledge_base_crawled.json

# 3. 生成高质量PDF
python cleanup.py --no-dry-run --regenerate-pdfs

# 4. 重建索引
npm run rag:build-index
```

### 增量更新

```bash
# 1. 爬取新文档并合并
python hf_crawler.py --target all --merge --existing ../../rag/knowledge_base.json --output ../../rag/knowledge_base.json

# 2. 导入新增文档
python import_to_app.py --input ../../rag/knowledge_base_crawled.json

# 3. 为新文档生成PDF
python cleanup.py --no-dry-run --regenerate-pdfs

# 4. 重建索引
npm run rag:build-index
```

### 定期清理

```bash
# 清理重复文档和孤儿PDF
python cleanup.py --no-dry-run

# 重建索引
npm run rag:build-index
```

---

## 输出格式

爬虫生成的 JSON 文件格式与 LearnGenie 知识库完全兼容：

```json
[
  {
    "docId": "hf-blog-article-title-20250101",
    "title": "文章标题",
    "course": "人工智能课程",
    "module": "06_神经网络与深度学习",
    "summary": "文章摘要...",
    "keywords": ["深度学习", "Transformer", "PyTorch"],
    "content": "来源：https://huggingface.co/blog/xxx\n分类：06_神经网络与深度学习\n\n正文内容...",
    "pdfPath": "hf-blog-article-title-20250101.pdf",
    "sourceType": "upload",
    "sourceUrl": "https://huggingface.co/blog/xxx",
    "hasOriginalPdf": true,
    "originalPdfPath": "hf-blog-article-title-20250101.pdf",
    "createdAt": "2025-01-01T12:00:00.000000",
    "updatedAt": "2025-01-01T12:00:00.000000"
  }
]
```

---

## 模块分类规则

爬虫会根据内容自动将文章分类到以下模块：

| 关键词 | 分类模块 |
|--------|----------|
| Transformer, BERT, GPT, LLM, NLP | 07_计算机视觉与NLP概览 |
| CNN, Vision, 图像识别, 目标检测 | 07_计算机视觉与NLP概览 |
| 强化学习, Agent, 智能体, RL | 08_强化学习与智能体 |
| 神经网络, 深度学习, CNN, RNN | 06_神经网络与深度学习 |
| 监督学习, 分类, 回归 | 04_监督学习 |
| 无监督学习, 聚类, PCA, 降维 | 05_无监督学习与聚类 |
| 机器学习基础, 特征工程, 过拟合 | 03_机器学习基础 |
| 知识表示, 搜索, 专家系统 | 02_知识表示与搜索 |
| Fine-tuning, PEFT, LoRA, 训练优化 | 09_模型微调与优化 |
| Diffusion, 生成模型, 图像生成 | 10_生成式AI与多模态 |
| Dataset, 数据处理, 数据增强 | 11_数据处理与工程 |
| Deployment, 推理, 部署, 工程化 | 12_模型部署与工程化 |
| 其他 | 扩展阅读资料 |

---

## 文件结构

```
scripts/
├── crawler/
│   ├── hf_crawler.py           # 主爬虫脚本
│   ├── save_page_as_pdf.py     # 单页面保存 PDF 脚本
│   ├── cleanup.py              # 综合清理工具（清理重复文档、孤儿PDF、重新生成PDF）
│   ├── import_to_app.py        # 导入到 LearnGenie 脚本
│   ├── README.md               # 使用说明
│   └── requirements.txt        # 依赖列表
├── generate-pdfs.ts            # Node.js 批量生成 PDF（备用）
└── check-i18n-keys.mjs         # i18n 国际化键检查
```

---

## 注意事项

1. **网络连接**：确保能够访问 huggingface.co
2. **爬取频率**：默认有 1-2 秒的延迟，请遵守网站的 robots.txt
3. **内容长度**：会自动过滤内容少于 100 字符的文章
4. **PDF 生成**：
   - 需要安装 Playwright（`pip install playwright`）
   - 脚本会自动使用系统已安装的 Edge 浏览器
   - 生成 PDF 需要较长时间（每篇约 5-10 秒）
   - PDF 文件较大（每篇约 500KB-2MB）
   - 建议分批处理大量文档
5. **清理工具**：
   - 默认是试运行模式，不会实际删除文件
   - 使用 `--no-dry-run` 参数执行实际清理
   - 清理后需要运行 `npm run rag:build-index` 重建索引

---

## 更新日志

### v3.0 (2026-05-05)
- 新增：综合清理工具 `cleanup.py`，整合所有清理功能
- 删除：合并重复的清理脚本（`cleanup_duplicate_uploads.py`, `cleanup_orphan_pdfs.py`, `regenerate_pdfs.py`, `batch_save_pdfs.py`）
- 优化：简化使用流程，减少脚本数量

### v2.0 (2026-05-05)
- 新增：使用 Playwright 将文档页面保存为高质量 PDF
- 新增：`batch_save_pdfs.py` 批量保存脚本
- 新增：`save_page_as_pdf.py` 单页面保存脚本
- 更新：知识库类型定义，支持 `hasOriginalPdf` 字段
- 更新：服务层逻辑，优先使用原始 PDF

### v1.0 (2025-01-01)
- 初始版本
- 支持 Blog 和 Docs 爬取
- 自动分类和关键词提取
