import { kv } from '../lib/kv';
import fs from 'fs/promises';
import path from 'path';

// 加载 .env.local 文件
async function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
    console.log('✅ 已加载 .env.local 文件');
  } catch (error) {
    console.log('⚠️  未找到 .env.local 文件');
  }
}

interface HSCodeItem {
  id: number;
  hsCode: string;
  englishName: string;
  chineseNote: string;
}

async function initKV() {
  try {
    // 加载环境变量
    await loadEnv();

    console.log('开始初始化 Vercel KV 数据...');

    // 读取 HScode.txt 文件
    const filePath = path.join(process.cwd(), 'HScode.txt');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');

    console.log(`读取到 ${lines.length} 行数据`);

    // 解析数据，跳过表头
    const items: HSCodeItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(/\t/);
      console.log(`行 ${i}: 列数 ${columns.length}, 内容: ${columns}`);
      if (columns.length >= 4) {
        // 文件有4列：序号、HS编码、英文品名、中文备注
        const id = parseInt(columns[0]?.trim(), 10) || i;
        const hsCode = columns[1]?.trim() || '';
        const englishName = columns[2]?.trim() || '';
        const chineseNote = columns[3]?.trim() || '';

        items.push({
          id, // 使用序号列作为 ID
          hsCode,
          englishName,
          chineseNote
        });
      } else {
        console.warn(`行 ${i} 列数不足: ${columns.length}`);
      }
    }

    console.log(`解析出 ${items.length} 条 HS 编码记录`);

    // 检查 KV 连接
    try {
      await kv.ping();
      console.log('KV 连接成功');
    } catch (error) {
      console.error('KV 连接失败，请检查环境变量配置:', error);
      process.exit(1);
    }

    // 将数据存储到 KV
    // 使用 'hscodes' 作为键，存储整个数组
    await kv.set('hscodes', items);

    console.log('数据已成功导入 Vercel KV');
    console.log('导入的数据预览:');
    items.slice(0, 5).forEach(item => {
      console.log(`  ${item.hsCode}: ${item.englishName}`);
    });

  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initKV();