"""
Huggingface 知识库爬虫 - 专为 LearnGenie 项目定制
基于 RAG_Tech_Bot 的 get_hf_blogs.py 修改

功能：
1. 爬取 Huggingface Blog 和 Docs 的文章
2. 自动转换为 LearnGenie 知识库 JSON 格式
3. 支持增量更新和去重

使用方法：
    python hf_crawler.py --target all --output ../../rag/knowledge_base_crawled.json
"""

import os
import re
import json
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import argparse
import time
from datetime import datetime
from typing import List, Dict, Any

# 配置请求会话，添加重试机制
session = requests.Session()
retry_strategy = Retry(
    total=3,  # 总重试次数
    backoff_factor=2,  # 重试间隔倍数
    status_forcelist=[429, 500, 502, 503, 504],  # 需要重试的 HTTP 状态码
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("http://", adapter)
session.mount("https://", adapter)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# 代理配置（Clash）
PROXIES = {
    "http": "http://127.0.0.1:7897",   # Clash HTTP 代理地址
    "https": "http://127.0.0.1:7897",  # Clash HTTPS 代理地址
}

BLOG_BASE = "https://huggingface.co/blog"

# Huggingface 文档库列表
DOC_LIBRARIES = [
    'peft', 'transformers', 'datasets', 'diffusers', 'evaluate',
    'tokenizer', 'timm', 'accelerate', 'trl', 'safetensors',
    'bitsandbytes', 'lighteval', 'lerobot', 'autotrain'
]

DOC_BASE = [f"https://huggingface.co/docs/{lib}/index" for lib in DOC_LIBRARIES]


def sanitize_filename(title: str, max_len: int = 100) -> str:
    """清理标题为合法文件名"""
    safe_title = re.sub(r'[\\/*?:"<>|]', "_", title)
    safe_title = safe_title.strip()
    if len(safe_title) > max_len:
        safe_title = safe_title[:max_len]
    return safe_title


def generate_doc_id(title: str, source: str) -> str:
    """生成唯一的文档 ID"""
    normalized = re.sub(r'[^a-z0-9\u4e00-\u9fff]+', '-', title.lower())
    normalized = normalized.strip('-')[:48]
    timestamp = datetime.now().strftime('%Y%m%d')
    return f"{source}-{normalized}-{timestamp}"


def extract_keywords(text: str, title: str) -> List[str]:
    """从文本和标题中提取关键词"""
    keywords = set()

    # AI/ML 相关关键词库
    ai_keywords = [
        '人工智能', 'AI', '机器学习', 'machine learning', '深度学习', 'deep learning',
        '神经网络', 'neural network', 'transformer', 'LLM', '大语言模型',
        'NLP', '自然语言处理', 'CV', '计算机视觉', '强化学习', 'reinforcement learning',
        '监督学习', '无监督学习', '聚类', '分类', '回归', '模型', '训练',
        '数据集', 'dataset', '微调', 'fine-tuning', '推理', 'inference',
        'HuggingFace', 'PyTorch', 'TensorFlow', 'BERT', 'GPT', 'Diffusion',
        '生成式AI', 'Generative AI', '多模态', 'multimodal', '嵌入', 'embedding',
        '向量', 'vector', '检索', 'retrieval', 'RAG', 'agent', '智能体'
    ]

    text_lower = text.lower()
    title_lower = title.lower()

    for keyword in ai_keywords:
        if keyword.lower() in text_lower or keyword.lower() in title_lower:
            keywords.add(keyword)

    # 添加标题中的技术术语（大写或驼峰命名）
    tech_terms = re.findall(r'\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b', title)
    keywords.update(tech_terms[:5])

    return list(keywords)[:15]


def generate_summary(text: str, max_len: int = 200) -> str:
    """生成文本摘要"""
    # 清理文本
    cleaned = re.sub(r'\s+', ' ', text).strip()

    # 尝试提取第一段有意义的文字
    sentences = re.split(r'[.!?。！？]+', cleaned)
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) > 30:
            if len(sentence) > max_len:
                return sentence[:max_len] + "..."
            return sentence

    # 如果没有合适的句子，截取开头
    if len(cleaned) > max_len:
        return cleaned[:max_len] + "..."
    return cleaned


def classify_module(title: str, content: str, source: str) -> str:
    """根据内容分类到课程模块 - 基于 Huggingface 库的特定分类"""
    text = (title + " " + content).lower()

    # 根据 Huggingface 库名称进行分类（优先级最高）
    library_modules = {
        # 09_模型微调与优化
        'peft': '09_模型微调与优化',
        'trl': '09_模型微调与优化',

        # 10_生成式AI与多模态
        'diffusers': '10_生成式AI与多模态',

        # 11_数据处理与工程
        'datasets': '11_数据处理与工程',
        'tokenizers': '11_数据处理与工程',

        # 12_模型部署与工程化
        'accelerate': '12_模型部署与工程化',
        'optimum': '12_模型部署与工程化',
        'safetensors': '12_模型部署与工程化',
        'timm': '12_模型部署与工程化',

        # 07_计算机视觉与NLP概览
        'transformers': '07_计算机视觉与NLP概览',

        # 评估与测试
        'evaluate': '11_数据处理与工程',
        'lighteval': '11_数据处理与工程',

        # 其他工具
        'autotrain': '09_模型微调与优化',
        'lerobot': '08_强化学习与智能体',
        'bitsandbytes': '12_模型部署与工程化',
    }

    # 检查标题中的库名称
    for lib, module in library_modules.items():
        if lib in title.lower() or lib in text[:500]:  # 只检查前500字符
            return module

    # 基于内容关键词的分类（备用规则）
    if any(kw in text for kw in ['reinforcement learning', '强化学习', 'agent', '智能体', 'rl', 'robot']):
        return "08_强化学习与智能体"
    elif any(kw in text for kw in ['diffusion', '生成模型', 'generative', '图像生成', 'text-to-image', 'stable diffusion']):
        return "10_生成式AI与多模态"
    elif any(kw in text for kw in ['fine-tuning', '微调', 'lora', 'adapter', 'parameter-efficient', 'peft']):
        return "09_模型微调与优化"
    elif any(kw in text for kw in ['deployment', '推理', 'inference', 'production', '部署', 'optimization', '量化', 'quantization']):
        return "12_模型部署与工程化"
    elif any(kw in text for kw in ['dataset', '数据', '数据处理', '数据增强', 'preprocessing']):
        return "11_数据处理与工程"
    elif any(kw in text for kw in ['vision', '图像', '目标检测', 'image', 'cnn', 'computer vision']) and 'nlp' not in text:
        return "07_计算机视觉与NLP概览"
    elif any(kw in text for kw in ['nlp', '自然语言处理', 'text', 'tokenization', 'bert', 'gpt']):
        return "07_计算机视觉与NLP概览"
    else:
        return "扩展阅读资料"


def convert_to_knowledge_doc(
    title: str,
    content: str,
    source: str,
    url: str
) -> Dict[str, Any]:
    """将爬取的内容转换为 LearnGenie 知识库格式"""

    doc_id = generate_doc_id(title, source)
    keywords = extract_keywords(content, title)
    summary = generate_summary(content)
    module = classify_module(title, content, source)

    # 添加来源信息到内容开头
    full_content = f"""来源：{url}
分类：{module}

{content}"""

    return {
        "docId": doc_id,
        "title": title,
        "course": "人工智能课程",
        "module": module,
        "summary": summary,
        "keywords": keywords,
        "content": full_content,
        "pdfPath": f"{doc_id}.pdf",
        "sourceType": "upload",
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }


def crawl_blog(output_file: str, max_articles: int = None):
    """爬取 Huggingface Blog"""
    print("[Start] 正在爬取 Huggingface Blog...")
    print(f"[Info] 代理设置: {'已启用' if PROXIES else '未启用'}")

    documents = []

    try:
        print(f"[Progress] 正在获取博客列表...")
        res = session.get(BLOG_BASE, headers=HEADERS, proxies=PROXIES, timeout=60)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
        links = soup.select("a[href^='/blog/']")
        urls = list(set(urljoin(BLOG_BASE, a["href"]) for a in links if a["href"].count("/") == 2))

        print(f"[Info] 发现 {len(urls)} 篇博客文章")

        for i, url in enumerate(urls):
            if max_articles and i >= max_articles:
                break

            try:
                print(f"[Progress] 正在处理 ({i+1}/{len(urls)}): {url}")
                resp = session.get(url, headers=HEADERS, proxies=PROXIES, timeout=60)
                resp.raise_for_status()
                page = BeautifulSoup(resp.text, "html.parser")

                title = page.find("h1").text.strip() if page.find("h1") else "Untitled"
                content_div = page.find("article") or page.find("main")

                if not content_div:
                    print(f"[Skipped] 无内容区块: {url}")
                    continue

                paragraphs = content_div.find_all(["p", "h2", "h3", "li"])
                text = "\n\n".join(p.get_text().strip() for p in paragraphs)

                if len(text.strip()) < 100:
                    print(f"[Skipped] 内容过短: {title}")
                    continue

                doc = convert_to_knowledge_doc(title, text, "hf-blog", url)
                documents.append(doc)
                print(f"[Success] 已处理: {title[:60]}...")

                time.sleep(2)  # 增加延迟，避免请求过快

            except requests.exceptions.ProxyError as e:
                print(f"[Error] 代理错误 {url}: {e}")
                print("[Hint] 请检查 PROXIES 配置是否正确")
                continue
            except requests.exceptions.Timeout as e:
                print(f"[Error] 请求超时 {url}: {e}")
                continue
            except requests.exceptions.RequestException as e:
                print(f"[Error] 请求失败 {url}: {e}")
                continue
            except Exception as e:
                print(f"[Error] 处理失败 {url}: {e}")
                continue

    except requests.exceptions.ProxyError as e:
        print(f"[Error] 代理错误: {e}")
        print("[Hint] 请检查 PROXIES 配置是否正确")
    except requests.exceptions.RequestException as e:
        print(f"[Error] 爬取 Blog 列表失败: {e}")
    except Exception as e:
        print(f"[Error] 爬取 Blog 列表失败: {e}")

    print(f"[Complete] Blog 爬取完成，共 {len(documents)} 篇文章")
    return documents


def crawl_docs(output_file: str, max_articles: int = None):
    """爬取 Huggingface Docs"""
    print("[Start] 正在爬取 Huggingface Docs...")
    print(f"[Info] 代理设置: {'已启用' if PROXIES else '未启用'}")

    documents = []
    doc_bases_tuple = tuple(DOC_BASE)

    for start_url in DOC_BASE:
        library_name = start_url.split('/docs/')[1].split('/')[0] if '/docs/' in start_url else 'unknown'
        print(f"[Progress] 正在爬取库文档: {library_name}")

        visited = set()
        queue = [start_url]
        count = 0

        while queue:
            if max_articles and count >= max_articles:
                break

            url = queue.pop(0)
            if url in visited or not url.startswith(doc_bases_tuple):
                continue

            try:
                resp = session.get(url, headers=HEADERS, proxies=PROXIES, timeout=60)
                resp.raise_for_status()
                page = BeautifulSoup(resp.text, "html.parser")

                title = page.find("h1").text.strip() if page.find("h1") else "Untitled"
                content_div = page.find("article") or page.find("main")

                if not content_div:
                    visited.add(url)
                    continue

                paragraphs = content_div.find_all(["p", "h2", "h3", "li", "pre", "code"])
                text = "\n\n".join(p.get_text().strip() for p in paragraphs)

                if len(text.strip()) < 100:
                    visited.add(url)
                    continue

                doc = convert_to_knowledge_doc(
                    f"[{library_name.upper()}] {title}",
                    text,
                    "hf-docs",
                    url
                )
                documents.append(doc)
                count += 1

                if count % 10 == 0:
                    print(f"[Progress] {library_name}: 已处理 {count} 篇文档")

                visited.add(url)

                # 提取子链接
                for a in page.select("a[href]"):
                    href = a["href"]
                    full_url = urljoin(url, href)
                    if full_url.startswith(doc_bases_tuple) and full_url not in visited:
                        queue.append(full_url)

                time.sleep(1)  # 增加延迟

            except requests.exceptions.ProxyError as e:
                print(f"[Error] 代理错误 {url}: {e}")
                print("[Hint] 请检查 PROXIES 配置是否正确")
                continue
            except requests.exceptions.Timeout as e:
                print(f"[Error] 请求超时 {url}: {e}")
                continue
            except requests.exceptions.RequestException as e:
                print(f"[Error] 请求失败 {url}: {e}")
                continue
            except Exception as e:
                print(f"[Error] {url}: {e}")
                continue

        print(f"[Complete] {library_name} 文档爬取完成，共 {count} 篇")

    print(f"[Complete] Docs 爬取完成，共 {len(documents)} 篇文档")
    return documents


def merge_with_existing(new_docs: List[Dict], existing_file: str = None) -> List[Dict]:
    """合并新文档与现有文档，去重"""
    if not existing_file or not os.path.exists(existing_file):
        return new_docs

    try:
        with open(existing_file, 'r', encoding='utf-8') as f:
            existing_docs = json.load(f)

        # 使用 title 作为去重键
        existing_titles = {doc['title'] for doc in existing_docs}

        merged = existing_docs.copy()
        added = 0

        for doc in new_docs:
            if doc['title'] not in existing_titles:
                merged.append(doc)
                added += 1

        print(f"[Info] 合并完成：原有 {len(existing_docs)} 篇，新增 {added} 篇，总计 {len(merged)} 篇")
        return merged

    except Exception as e:
        print(f"[Warning] 合并现有文档失败: {e}，将只保存新文档")
        return new_docs


def save_documents(documents: List[Dict], output_file: str):
    """保存文档到 JSON 文件"""
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, ensure_ascii=False, indent=2)

    print(f"[Saved] 已保存 {len(documents)} 篇文档到: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="爬取 Huggingface 文章并转换为 LearnGenie 知识库格式"
    )
    parser.add_argument(
        "--target",
        choices=["blog", "docs", "all"],
        default="all",
        help="要爬取的目标: blog=博客, docs=文档, all=全部"
    )
    parser.add_argument(
        "--output",
        default="../../rag/knowledge_base_crawled.json",
        help="输出 JSON 文件路径"
    )
    parser.add_argument(
        "--max-articles",
        type=int,
        default=None,
        help="每类最多爬取的文章数量（用于测试）"
    )
    parser.add_argument(
        "--merge",
        action="store_true",
        help="是否合并到现有知识库文件"
    )
    parser.add_argument(
        "--existing",
        default="../../rag/knowledge_base.json",
        help="现有知识库文件路径（用于合并）"
    )

    args = parser.parse_args()

    all_documents = []

    if args.target in ["blog", "all"]:
        blog_docs = crawl_blog(args.output, args.max_articles)
        all_documents.extend(blog_docs)

    if args.target in ["docs", "all"]:
        docs_docs = crawl_docs(args.output, args.max_articles)
        all_documents.extend(docs_docs)

    if args.merge:
        all_documents = merge_with_existing(all_documents, args.existing)

    save_documents(all_documents, args.output)

    print("\n" + "="*60)
    print(f"[完成] 爬取任务结束！")
    print(f"[统计] 总计: {len(all_documents)} 篇文档")
    print(f"[输出] 文件位置: {os.path.abspath(args.output)}")
    print("="*60)


if __name__ == "__main__":
    main()
