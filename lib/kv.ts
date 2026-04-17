// KV 客户端，支持真实 Vercel KV 和内存模拟

interface KVClient {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  del: (key: string) => Promise<void>;
  ping: () => Promise<string>;
}

import fs from 'fs/promises';
import path from 'path';

// 内存模拟存储，带文件持久化
class MemoryKV implements KVClient {
  private store: Map<string, any>;
  private dataFile: string;
  private ready: Promise<void>;

  constructor() {
    this.store = new Map();
    this.dataFile = path.join(process.cwd(), '.kv-data.json');
    this.ready = this.loadFromFile();
  }

  private async loadFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      const parsed = JSON.parse(data);
      for (const [key, value] of Object.entries(parsed)) {
        this.store.set(key, value);
      }
      console.log(`📁 从 ${this.dataFile} 加载了 ${this.store.size} 个键值对`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`📁 数据文件 ${this.dataFile} 不存在，将创建新文件`);
      } else {
        console.error('📁 加载数据文件失败:', error.message);
      }
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const data: Record<string, any> = {};
      for (const [key, value] of this.store.entries()) {
        data[key] = value;
      }
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('📁 保存数据文件失败:', error);
    }
  }

  private async ensureReady(): Promise<void> {
    await this.ready;
  }

  async get(key: string): Promise<any> {
    await this.ensureReady();
    return this.store.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    await this.ensureReady();
    this.store.set(key, value);
    await this.saveToFile();
  }

  async del(key: string): Promise<void> {
    await this.ensureReady();
    this.store.delete(key);
    await this.saveToFile();
  }

  async ping(): Promise<string> {
    await this.ensureReady();
    return 'PONG';
  }
}

// 真实 Vercel KV 客户端
async function createRealKV(): Promise<KVClient> {
  const { kv } = await import('@vercel/kv');
  return {
    get: (key: string) => kv.get(key),
    set: (key: string, value: any) => kv.set(key, value),
    del: (key: string) => kv.del(key),
    ping: () => kv.ping()
  };
}

// 创建 KV 客户端实例
let kvInstance: KVClient | null = null;

export async function getKVClient(): Promise<KVClient> {
  if (kvInstance) {
    return kvInstance;
  }

  // 检查是否有真实配置（非占位符）
  const hasRealConfig = process.env.KV_REST_API_URL &&
                       process.env.KV_REST_API_TOKEN &&
                       !process.env.KV_REST_API_URL.includes('your-kv-endpoint');

  if (!hasRealConfig) {
    console.log('⚠️ 使用内存模拟 KV (无真实配置)');
    kvInstance = new MemoryKV();
  } else {
    try {
      console.log('🔗 使用真实 Vercel KV');
      kvInstance = await createRealKV();
    } catch (error) {
      console.error('❌ 无法初始化真实 KV，回退到内存模拟:', error);
      kvInstance = new MemoryKV();
    }
  }

  return kvInstance;
}

// 导出一个方便的包装器
export const kv = {
  get: async (key: string) => {
    const client = await getKVClient();
    return client.get(key);
  },
  set: async (key: string, value: any) => {
    const client = await getKVClient();
    await client.set(key, value);
  },
  del: async (key: string) => {
    const client = await getKVClient();
    await client.del(key);
  },
  ping: async () => {
    const client = await getKVClient();
    return client.ping();
  }
};