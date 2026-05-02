# Huggingface 知识库爬虫

专为 LearnGenie 项目定制的 Huggingface 文章爬虫，自动将爬取的内容转换为知识库 JSON 格式。

## 功能特性

- ✅ 爬取 Huggingface Blog 技术文章
- ✅ 爬取 Huggingface Docs 官方文档
- ✅ 自动分类到对应的 AI 课程模块
- ✅ 智能提取关键词和生成摘要
- ✅ 支持增量更新和去重
- ✅ 输出格式完全兼容 LearnGenie 知识库

## 安装依赖

```bash
cd scripts/crawler
pip install requests beautifulsoup4
```

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
python hf_crawler.py --target all --merge --existing ../../rag/knowledge_base.json --output ../../rag/knowledge_base_merged.json
```

## 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--target` | 爬取目标：`blog`/`docs`/`all` | `all` |
| `--output` | 输出 JSON 文件路径 | `../../rag/knowledge_base_crawled.json` |
| `--max-articles` | 每类最多爬取数量（测试用） | 无限制 |
| `--merge` | 是否合并到现有知识库 | `False` |
| `--existing` | 现有知识库文件路径 | `../../rag/knowledge_base.json` |

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
    "createdAt": "2025-01-01T12:00:00.000000",
    "updatedAt": "2025-01-01T12:00:00.000000"
  }
]
```

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

## 集成到 LearnGenie

### 方法一：直接替换知识库文件

```bash
# 1. 运行爬虫
python hf_crawler.py --target all --output ../../rag/knowledge_base_crawled.json

# 2. 备份原有知识库
copy ../../rag/knowledge_base.json ../../rag/knowledge_base_backup.json

# 3. 合并到主知识库（手动合并或使用 merge 参数）
```

### 方法二：通过 API 导入

```bash
# 1. 运行爬虫生成 JSON
python hf_crawler.py --target all --output ./crawled_docs.json

# 2. 使用脚本导入到 LearnGenie
# 参见 import_to_learn_genie.py
```

### 方法三：增量更新

```bash
# 合并到现有知识库，自动去重
python hf_crawler.py --target all --merge --existing ../../rag/knowledge_base.json --output ../../rag/knowledge_base.json
```

## 注意事项

1. **网络连接**：确保能够访问 huggingface.co
2. **爬取频率**：默认有 0.5-1 秒的延迟，请遵守网站的 robots.txt
3. **内容长度**：会自动过滤内容少于 100 字符的文章
4. **PDF 生成**：爬虫只生成 JSON 数据，PDF 文件由 LearnGenie 自动生成

## 文件结构

```
scripts/crawler/
├── hf_crawler.py      # 主爬虫脚本
├── README.md          # 使用说明
└── requirements.txt   # 依赖列表
```

## 更新日志

### v1.0 (2025-01-01)
- 初始版本
- 支持 Blog 和 Docs 爬取
- 自动分类和关键词提取
