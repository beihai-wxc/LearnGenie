"""
知识库清理工具
整合所有清理功能：重复文档、孤儿PDF、重新生成PDF

使用方法:
    # 试运行（查看将要清理的内容）
    python cleanup.py
    
    # 执行清理
    python cleanup.py --no-dry-run
    
    # 只清理孤儿PDF
    python cleanup.py --orphan-pdfs-only
    
    # 重新生成高质量PDF
    python cleanup.py --regenerate-pdfs
"""

import argparse
import asyncio
import json
import os
import sys
from collections import defaultdict
from typing import List, Dict, Any, Set

# 检查 playwright
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


class KnowledgeBaseCleaner:
    """知识库清理器"""
    
    def __init__(self, rag_dir: str, dry_run: bool = True):
        self.rag_dir = rag_dir
        self.dry_run = dry_run
        self.pdfs_dir = os.path.join(rag_dir, "pdfs")
        self.uploads_file = os.path.join(rag_dir, "uploaded-docs.json")
        self.knowledge_file = os.path.join(rag_dir, "knowledge_base.json")
        
        self.uploads: List[Dict] = []
        self.knowledge: List[Dict] = []
        self.valid_pdfs: Set[str] = set()
        
    def load_data(self) -> bool:
        """加载数据文件"""
        print("[Info] 加载数据文件...")
        
        # 加载 uploaded-docs.json
        if os.path.exists(self.uploads_file):
            try:
                with open(self.uploads_file, 'r', encoding='utf-8') as f:
                    self.uploads = json.load(f)
                print(f"  ✓ uploaded-docs.json: {len(self.uploads)} 篇")
            except Exception as e:
                print(f"  ✗ uploaded-docs.json: {e}")
                return False
        else:
            print(f"  ⚠ uploaded-docs.json: 文件不存在")
        
        # 加载 knowledge_base.json
        if os.path.exists(self.knowledge_file):
            try:
                with open(self.knowledge_file, 'r', encoding='utf-8') as f:
                    self.knowledge = json.load(f)
                print(f"  ✓ knowledge_base.json: {len(self.knowledge)} 篇")
            except Exception as e:
                print(f"  ✗ knowledge_base.json: {e}")
                return False
        else:
            print(f"  ⚠ knowledge_base.json: 文件不存在")
        
        # 收集有效PDF引用
        for doc in self.uploads + self.knowledge:
            pdf_path = doc.get("pdfPath", "")
            if pdf_path:
                self.valid_pdfs.add(pdf_path)
        print(f"  → 有效PDF引用: {len(self.valid_pdfs)} 个")
        
        return True
    
    def find_duplicate_uploads(self) -> List[Dict]:
        """找出重复的上传文档"""
        print("\n[Step 1] 检查重复上传文档...")
        
        # 按标题分组
        title_groups = defaultdict(list)
        for doc in self.uploads:
            title = doc.get("title", "")
            title_groups[title].append(doc)
        
        # 找出重复
        duplicates = []
        for title, docs in title_groups.items():
            if len(docs) > 1:
                hf_docs = [d for d in docs if d["docId"].startswith("hf-")]
                upload_docs = [d for d in docs if d["docId"].startswith("upload-")]
                
                if hf_docs and upload_docs:
                    # 有hf版本，upload版本都是重复的
                    duplicates.extend(upload_docs)
                    print(f"  ! 重复: {title}")
                    print(f"    保留: {hf_docs[0]['docId']}")
                    print(f"    删除: {len(upload_docs)} 个 upload-*")
        
        return duplicates
    
    def find_orphan_pdfs(self) -> List[str]:
        """找出孤儿PDF文件"""
        print("\n[Step 2] 检查孤儿PDF文件...")
        
        if not os.path.exists(self.pdfs_dir):
            print(f"  ⚠ PDF目录不存在: {self.pdfs_dir}")
            return []
        
        all_pdfs = [f for f in os.listdir(self.pdfs_dir) if f.endswith('.pdf')]
        orphans = [f for f in all_pdfs if f not in self.valid_pdfs]
        
        upload_orphans = [f for f in orphans if f.startswith('upload-')]
        
        if orphans:
            total_size = sum(os.path.getsize(os.path.join(self.pdfs_dir, f)) for f in orphans)
            print(f"  ! 发现 {len(orphans)} 个孤儿PDF")
            print(f"    - upload-*: {len(upload_orphans)} 个")
            print(f"    - 占用空间: {total_size / 1024 / 1024:.2f} MB")
        else:
            print(f"  ✓ 没有发现孤儿PDF")
        
        return orphans
    
    def remove_duplicates_from_json(self, duplicates: List[Dict]) -> bool:
        """从JSON中移除重复文档"""
        if not duplicates:
            return True
        
        print(f"\n[Action] 从 uploaded-docs.json 移除 {len(duplicates)} 篇重复文档...")
        
        if self.dry_run:
            print("  [Dry Run] 跳过实际删除")
            return True
        
        doc_ids_to_remove = {d["docId"] for d in duplicates}
        new_uploads = [d for d in self.uploads if d["docId"] not in doc_ids_to_remove]
        
        try:
            with open(self.uploads_file, 'w', encoding='utf-8') as f:
                json.dump(new_uploads, f, ensure_ascii=False, indent=2)
            print(f"  ✓ 已保存: {len(new_uploads)} 篇文档")
            self.uploads = new_uploads
            return True
        except Exception as e:
            print(f"  ✗ 保存失败: {e}")
            return False
    
    def remove_orphan_pdfs(self, orphans: List[str]) -> bool:
        """删除孤儿PDF文件"""
        if not orphans:
            return True
        
        print(f"\n[Action] 删除 {len(orphans)} 个孤儿PDF文件...")
        
        if self.dry_run:
            print("  [Dry Run] 跳过实际删除")
            return True
        
        deleted = 0
        failed = 0
        
        for pdf in orphans:
            pdf_path = os.path.join(self.pdfs_dir, pdf)
            try:
                os.remove(pdf_path)
                deleted += 1
                print(f"  ✓ 删除: {pdf}")
            except Exception as e:
                failed += 1
                print(f"  ✗ 失败: {pdf} - {e}")
        
        print(f"  → 成功: {deleted}, 失败: {failed}")
        return failed == 0
    
    async def regenerate_pdfs(self, max_docs: int = None) -> bool:
        """重新生成高质量PDF"""
        print("\n[Step 3] 重新生成高质量PDF...")
        
        if not PLAYWRIGHT_AVAILABLE:
            print("  ✗ Playwright 未安装，跳过PDF生成")
            print("     请运行: pip install playwright")
            return False
        
        # 合并所有文档
        all_docs = self.knowledge + self.uploads
        
        # 只处理有sourceUrl的文档
        docs_with_url = []
        for doc in all_docs:
            content = doc.get("content", "")
            for line in content.split("\n")[:5]:
                if line.startswith("来源：") or line.startswith("来源:"):
                    docs_with_url.append(doc)
                    break
        
        if max_docs:
            docs_with_url = docs_with_url[:max_docs]
        
        print(f"  → 将处理 {len(docs_with_url)} 篇有来源URL的文档")
        
        if self.dry_run:
            print("  [Dry Run] 跳过实际生成")
            return True
        
        # 查找Edge浏览器
        edge_path = self._find_edge()
        if not edge_path:
            print("  ✗ 未找到Edge浏览器")
            return False
        
        print(f"  → 使用Edge: {edge_path}")
        
        # 生成PDF
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                executable_path=edge_path
            )
            
            success_count = 0
            for i, doc in enumerate(docs_with_url, 1):
                if await self._save_single_pdf(browser, doc, i, len(docs_with_url)):
                    success_count += 1
                if i < len(docs_with_url):
                    await asyncio.sleep(2)
            
            await browser.close()
        
        print(f"  → 成功生成: {success_count}/{len(docs_with_url)}")
        return success_count == len(docs_with_url)
    
    def _find_edge(self) -> str:
        """查找Edge浏览器"""
        paths = [
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
        ]
        for path in paths:
            path = os.path.expandvars(path)
            if os.path.exists(path):
                return path
        return None
    
    async def _save_single_pdf(self, browser, doc: Dict, index: int, total: int) -> bool:
        """保存单个PDF"""
        # 提取URL
        content = doc.get("content", "")
        source_url = None
        for line in content.split("\n")[:5]:
            if line.startswith("来源：") or line.startswith("来源:"):
                source_url = line.replace("来源：", "").replace("来源:", "").strip()
                break
        
        if not source_url:
            return False
        
        doc_id = doc.get("docId", f"doc-{index}")
        pdf_path = os.path.join(self.pdfs_dir, f"{doc_id}.pdf")
        
        # 如果已存在则跳过
        if os.path.exists(pdf_path):
            print(f"  [{index}/{total}] 已存在: {doc_id}.pdf")
            return True
        
        print(f"  [{index}/{total}] 生成: {doc.get('title', 'Unknown')[:40]}...")
        
        try:
            context = await browser.new_context(viewport={"width": 1200, "height": 800})
            page = await context.new_page()
            
            await page.goto(source_url, wait_until="networkidle", timeout=60000)
            
            # 隐藏无关元素
            await page.add_style_tag(content="""
                nav, header, footer, .sidebar, .ads, .comments,
                .cookie-banner, .announcement, .feedback-section,
                [class*="navigation"], [class*="advertisement"] {
                    display: none !important;
                }
            """)
            
            await page.pdf(
                path=pdf_path,
                format="A4",
                print_background=True,
                margin={"top": "40px", "right": "40px", "bottom": "40px", "left": "40px"},
                display_header_footer=True,
                header_template=f"<div style='font-size:9px;text-align:center;color:#666;'>{doc.get('title', '')}</div>",
                footer_template="<div style='font-size:9px;text-align:center;color:#666;'><span class='pageNumber'></span> / <span class='totalPages'></span></div>",
            )
            
            await context.close()
            return True
            
        except Exception as e:
            print(f"    失败: {e}")
            return False
    
    def run(self, skip_duplicates: bool = False, skip_orphans: bool = False, regenerate: bool = False, max_docs: int = None) -> bool:
        """运行清理流程"""
        print("="*60)
        print("[Start] 知识库清理工具")
        if self.dry_run:
            print("[Mode] 试运行（不会实际修改）")
        else:
            print("[Mode] 实际执行")
        print("="*60)
        
        # 加载数据
        if not self.load_data():
            return False
        
        success = True
        
        # 步骤1: 清理重复文档
        if not skip_duplicates:
            duplicates = self.find_duplicate_uploads()
            if duplicates:
                success = self.remove_duplicates_from_json(duplicates) and success
                # 重新加载有效PDF列表
                self.valid_pdfs = set()
                for doc in self.uploads + self.knowledge:
                    pdf_path = doc.get("pdfPath", "")
                    if pdf_path:
                        self.valid_pdfs.add(pdf_path)
        
        # 步骤2: 清理孤儿PDF
        if not skip_orphans:
            orphans = self.find_orphan_pdfs()
            if orphans:
                success = self.remove_orphan_pdfs(orphans) and success
        
        # 步骤3: 重新生成PDF
        if regenerate:
            if PLAYWRIGHT_AVAILABLE:
                success = asyncio.run(self.regenerate_pdfs(max_docs)) and success
            else:
                print("\n[Warning] Playwright未安装，跳过PDF生成")
                print("  安装命令: pip install playwright")
        
        # 完成
        print("\n" + "="*60)
        if self.dry_run:
            print("[完成] 试运行结束")
            print("[提示] 使用 --no-dry-run 执行实际清理")
        else:
            print("[完成] 清理任务结束")
            if regenerate:
                print("[提示] 请运行: npm run rag:build-index 重建索引")
        print("="*60)
        
        return success


def main():
    parser = argparse.ArgumentParser(
        description="知识库清理工具 - 清理重复文档和孤儿PDF",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 试运行（查看将要清理的内容）
  python cleanup.py
  
  # 执行清理
  python cleanup.py --no-dry-run
  
  # 只清理孤儿PDF
  python cleanup.py --orphan-pdfs-only --no-dry-run
  
  # 清理并重新生成PDF
  python cleanup.py --no-dry-run --regenerate-pdfs
  
  # 测试模式（只处理3篇文档）
  python cleanup.py --no-dry-run --regenerate-pdfs --max-docs 3
        """
    )
    parser.add_argument(
        "--rag-dir",
        default="../../rag",
        help="RAG目录路径 (默认: ../../rag)"
    )
    parser.add_argument(
        "--no-dry-run",
        action="store_true",
        help="实际执行清理（默认是试运行）"
    )
    parser.add_argument(
        "--skip-duplicates",
        action="store_true",
        help="跳过重复文档清理"
    )
    parser.add_argument(
        "--skip-orphans",
        action="store_true",
        help="跳过孤儿PDF清理"
    )
    parser.add_argument(
        "--orphan-pdfs-only",
        action="store_true",
        help="只清理孤儿PDF"
    )
    parser.add_argument(
        "--regenerate-pdfs",
        action="store_true",
        help="重新生成高质量PDF"
    )
    parser.add_argument(
        "--max-docs",
        type=int,
        default=None,
        help="最多处理文档数（用于测试）"
    )
    
    args = parser.parse_args()
    
    # 如果只清理孤儿PDF
    skip_duplicates = args.skip_duplicates or args.orphan_pdfs_only
    skip_orphans = args.skip_orphans
    
    cleaner = KnowledgeBaseCleaner(
        rag_dir=args.rag_dir,
        dry_run=not args.no_dry_run
    )
    
    success = cleaner.run(
        skip_duplicates=skip_duplicates,
        skip_orphans=skip_orphans,
        regenerate=args.regenerate_pdfs,
        max_docs=args.max_docs
    )
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
