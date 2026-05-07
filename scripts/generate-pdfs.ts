/**
 * 批量生成知识库 PDF 文件
 * 
 * 使用方法：
 *   npx ts-node scripts/generate-pdfs.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureKnowledgePdf } from '../lib/knowledge-base/service';
import { KnowledgeDocument } from '../lib/knowledge-base/types';

const KNOWLEDGE_FILE = path.join(process.cwd(), 'rag', 'knowledge_base.json');

async function generateAllPdfs() {
  console.log('[Start] 开始生成 PDF 文件...');
  
  try {
    // 读取知识库文件
    const data = await fs.readFile(KNOWLEDGE_FILE, 'utf8');
    const documents: KnowledgeDocument[] = JSON.parse(data);
    
    console.log(`[Info] 共 ${documents.length} 篇文档需要处理`);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        console.log(`[Progress] (${i + 1}/${documents.length}) 生成 PDF: ${doc.title}`);
        await ensureKnowledgePdf(doc);
        success++;
      } catch (error) {
        console.error(`[Error] 生成失败: ${doc.title}`, error);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('[完成] PDF 生成任务结束！');
    console.log(`[统计] 成功: ${success} 篇，失败: ${failed} 篇`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('[Error] 读取知识库文件失败:', error);
    process.exit(1);
  }
}

generateAllPdfs();
