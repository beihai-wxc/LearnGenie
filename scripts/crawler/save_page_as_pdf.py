"""
使用 Playwright 将网页保存为 PDF
专用于保存 Huggingface 等文档网站的原文 PDF

使用方法:
    python save_page_as_pdf.py --url https://huggingface.co/docs/trl/index --output ../../rag/pdfs/trl-docs.pdf

注意:
    建议保存到 ../../rag/pdfs，与 LearnGenie 服务层 KNOWLEDGE_PDF_DIR 保持一致
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

# 检查 playwright 是否安装
try:
    from playwright.async_api import async_playwright
except ImportError:
    print("[Error] 请先安装 Playwright:")
    print("  pip install playwright")
    sys.exit(1)


def find_edge_executable() -> str:
    """查找系统安装的 Edge 浏览器路径"""
    possible_paths = [
        # Windows 系统路径
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        # 用户安装路径
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
    ]
    
    for path in possible_paths:
        path = os.path.expandvars(path)
        if os.path.exists(path):
            print(f"[Info] 找到 Edge 浏览器: {path}")
            return path
    
    return None


async def save_page_as_pdf(url: str, output_path: str, wait_selector: str = "article, main, .content") -> bool:
    """
    使用 Playwright 将网页保存为 PDF
    
    Args:
        url: 网页 URL
        output_path: PDF 输出路径
        wait_selector: 等待内容加载的 CSS 选择器
    
    Returns:
        成功返回 True，失败返回 False
    """
    print(f"[Start] 正在将 {url} 保存为 PDF...")
    
    # 查找 Edge 浏览器
    edge_path = find_edge_executable()
    if not edge_path:
        print("[Error] 未找到 Edge 浏览器，请确保已安装 Microsoft Edge")
        return False
    
    async with async_playwright() as p:
        try:
            # 启动浏览器（使用系统 Edge）
            print("[Info] 正在启动 Edge 浏览器...")
            browser = await p.chromium.launch(
                headless=True,
                executable_path=edge_path
            )
            context = await browser.new_context(
                viewport={"width": 1200, "height": 800}
            )
            page = await context.new_page()
            
            # 导航到页面
            print("[Progress] 正在加载页面...")
            await page.goto(url, wait_until="networkidle", timeout=60000)
            
            # 等待内容加载
            try:
                await page.wait_for_selector(wait_selector, timeout=10000)
                print(f"[Progress] 内容已加载: {wait_selector}")
            except Exception as e:
                print(f"[Warning] 等待内容超时: {e}")
            
            # 隐藏不必要的元素
            await page.add_style_tag(content="""
                nav, header, footer, .sidebar, .ads, .comments,
                .cookie-banner, .announcement, .feedback-section,
                [class*="navigation"], [class*="advertisement"],
                #cookie-banner, .fixed, .sticky {
                    display: none !important;
                }
            """)
            
            # 确保输出目录存在
            output_dir = os.path.dirname(output_path)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
            
            # 保存为 PDF
            print("[Progress] 正在生成 PDF...")
            await page.pdf(
                path=output_path,
                format="A4",
                print_background=True,
                margin={
                    "top": "40px",
                    "right": "40px",
                    "bottom": "40px",
                    "left": "40px",
                },
                display_header_footer=True,
                header_template="""
                    <div style="font-size: 9px; width: 100%; text-align: center; color: #666; padding: 10px 40px;">
                        <span class="title"></span>
                    </div>
                """,
                footer_template="""
                    <div style="font-size: 9px; width: 100%; text-align: center; color: #666; padding: 10px 40px;">
                        <span class="pageNumber"></span> / <span class="totalPages"></span>
                    </div>
                """,
            )
            
            await browser.close()
            
            # 检查文件是否生成成功
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                print(f"[Success] PDF 已保存: {output_path}")
                print(f"[Info] 文件大小: {file_size / 1024:.1f} KB")
                return True
            else:
                print(f"[Error] PDF 文件未生成")
                return False
                
        except Exception as e:
            print(f"[Error] 保存 PDF 失败: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(
        description="将网页保存为 PDF"
    )
    parser.add_argument(
        "--url",
        required=True,
        help="要保存的网页 URL"
    )
    parser.add_argument(
        "--output",
        required=True,
        help="PDF 输出路径"
    )
    parser.add_argument(
        "--wait-selector",
        default="article, main, .content",
        help="等待内容加载的 CSS 选择器"
    )
    
    args = parser.parse_args()
    
    # 运行异步任务
    success = asyncio.run(save_page_as_pdf(args.url, args.output, args.wait_selector))
    
    if success:
        print("\n" + "="*60)
        print("[完成] PDF 生成成功！")
        print("="*60)
        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("[失败] PDF 生成失败！")
        print("="*60)
        sys.exit(1)


if __name__ == "__main__":
    main()
