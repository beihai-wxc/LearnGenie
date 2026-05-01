"""
将爬取的 JSON 数据导入到 LearnGenie 应用

使用方法：
    python import_to_app.py --input ../../rag/knowledge_base_crawled.json --api-url http://localhost:3000/api/knowledge/ingest
"""

import json
import argparse
import requests
from typing import Dict, Any
import time


def import_document(doc: Dict[str, Any], api_url: str) -> bool:
    """通过 API 导入单个文档"""

    # 准备请求数据（符合 UploadKnowledgeIngestInput 格式）
    payload = {
        "title": doc["title"],
        "text": doc["content"],
        "summary": doc["summary"],
        "keywords": doc["keywords"],
        "module": doc["module"]
    }

    try:
        response = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"[Success] 已导入: {doc['title'][:50]}...")
                return True
            else:
                print(f"[Failed] 导入失败: {doc['title'][:50]}... - {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"[Error] HTTP {response.status_code}: {doc['title'][:50]}...")
            return False

    except Exception as e:
        print(f"[Error] 请求异常: {doc['title'][:50]}... - {e}")
        return False


def import_from_json(input_file: str, api_url: str, delay: float = 1.0):
    """从 JSON 文件导入所有文档"""

    print(f"[Start] 正在从 {input_file} 导入文档...")
    print(f"[Info] API 地址: {api_url}")

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            documents = json.load(f)

        print(f"[Info] 共发现 {len(documents)} 篇文档")

        success_count = 0
        failed_count = 0

        for i, doc in enumerate(documents):
            print(f"\n[Progress] ({i+1}/{len(documents)})")

            if import_document(doc, api_url):
                success_count += 1
            else:
                failed_count += 1

            # 避免请求过快
            if i < len(documents) - 1:
                time.sleep(delay)

        print("\n" + "="*60)
        print(f"[完成] 导入任务结束！")
        print(f"[统计] 成功: {success_count} 篇，失败: {failed_count} 篇")
        print("="*60)

    except FileNotFoundError:
        print(f"[Error] 文件不存在: {input_file}")
    except json.JSONDecodeError:
        print(f"[Error] JSON 格式错误: {input_file}")
    except Exception as e:
        print(f"[Error] 导入失败: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="将爬取的 JSON 数据导入到 LearnGenie 应用"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="输入 JSON 文件路径"
    )
    parser.add_argument(
        "--api-url",
        default="http://localhost:3000/api/knowledge/ingest",
        help="LearnGenie 知识库导入 API 地址"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="请求间隔时间（秒）"
    )

    args = parser.parse_args()

    import_from_json(args.input, args.api_url, args.delay)


if __name__ == "__main__":
    main()
