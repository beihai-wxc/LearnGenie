import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const CAROUSEL_DIR = path.join(process.cwd(), 'public', 'carousel');

async function convertToWebP() {
  const files = fs.readdirSync(CAROUSEL_DIR).filter(file => file.endsWith('.png'));
  
  console.log(`找到 ${files.length} 个 PNG 文件，开始转换为 WebP 格式...\n`);
  
  let totalOriginalSize = 0;
  let totalWebPSize = 0;
  
  for (const file of files) {
    const inputPath = path.join(CAROUSEL_DIR, file);
    const outputName = file.replace('.png', '.webp');
    const outputPath = path.join(CAROUSEL_DIR, outputName);
    
    const originalStats = fs.statSync(inputPath);
    totalOriginalSize += originalStats.size;
    
    try {
      await sharp(inputPath)
        .webp({ 
          quality: 80,      // 质量设置为 80，平衡文件大小和质量
          effort: 6         // 压缩努力程度 (0-6)，6 表示较高压缩率
        })
        .toFile(outputPath);
      
      const webpStats = fs.statSync(outputPath);
      totalWebPSize += webpStats.size;
      
      const reduction = ((originalStats.size - webpStats.size) / originalStats.size * 100).toFixed(2);
      console.log(`✅ ${file} → ${outputName}`);
      console.log(`   原始大小：${(originalStats.size / 1024).toFixed(2)} KB`);
      console.log(`   WebP 大小：${(webpStats.size / 1024).toFixed(2)} KB`);
      console.log(`   体积减少：${reduction}%\n`);
      
    } catch (error) {
      console.error(`❌ 转换失败 ${file}:`, error);
    }
  }
  
  const totalReduction = ((totalOriginalSize - totalWebPSize) / totalOriginalSize * 100).toFixed(2);
  console.log('==========================================');
  console.log(`转换完成！`);
  console.log(`总原始大小：${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`总 WebP 大小：${(totalWebPSize / 1024).toFixed(2)} KB`);
  console.log(`总体积减少：${totalReduction}%`);
  console.log(`节省空间：${((totalOriginalSize - totalWebPSize) / 1024).toFixed(2)} KB`);
  console.log('==========================================');
}

convertToWebP().catch(console.error);
