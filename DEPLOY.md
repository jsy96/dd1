# HS 编码管理系统 - Vercel 部署指南

## 快速开始

### 1. 环境准备
```bash
# 安装依赖
npm install

# 确保 HScode.txt 文件在项目根目录
ls HScode.txt
```

### 2. 配置 Vercel KV
1. 在 Vercel Dashboard 创建 Redis 数据库
2. 复制以下信息：
   - KV_REST_API_URL
   - KV_REST_API_TOKEN
3. 更新 `.env.local` 文件

### 3. 导入数据到生产 KV
```bash
# 确保环境变量已配置
npm run init-kv

# 输出应显示："🔗 使用真实 Vercel KV"
```

### 4. 本地验证
```bash
# 启动开发服务器
npm run dev

# 在浏览器打开
open http://localhost:3000
```

### 5. 部署到 Vercel
```bash
# 方法一：使用 Vercel CLI
npm install -g vercel
vercel login
vercel --prod

# 方法二：通过 Git 仓库
git init
git add .
git commit -m "Initial commit"
# 连接到 GitHub/GitLab，Vercel 会自动部署
```

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| KV_REST_API_URL | Redis REST API URL | `https://your-redis.upstash.io` |
| KV_REST_API_TOKEN | Redis REST API Token | `xxx...xxx` |

## 手动数据迁移

如果您需要重新导入数据：
```bash
# 1. 清空现有数据（可选）
node -e "const {kv} = require('./lib/kv'); kv.del('hscodes').then(() => console.log('已清空数据'))"

# 2. 重新导入
npm run init-kv
```

## 故障排除

### 问题：导入失败，显示内存模拟
**原因**：环境变量未正确配置或包含占位符
**解决**：检查 `.env.local` 文件，确保使用真实的 Vercel KV 凭据

### 问题：数据不一致
**解决**：删除 KV 中的数据并重新导入
```bash
npm run init-kv  # 会覆盖现有数据
```

### 问题：API 返回空数据
**解决**：检查 KV 连接状态
```bash
node -e "const {kv} = require('./lib/kv'); kv.ping().then(console.log)"
```

## 生产环境优化建议

1. **启用缓存**：在 API 路由中添加适当的缓存头
2. **添加认证**：为管理操作添加简单的 API 密钥认证
3. **备份数据**：定期导出 KV 数据到本地文件
4. **监控**：设置 Vercel Analytics 监控应用性能

## 支持的 API 端点

- `GET /api/hscodes` - 获取所有记录
- `POST /api/hscodes` - 创建新记录
- `PUT /api/hscodes/[id]` - 更新记录
- `DELETE /api/hscodes/[id]` - 删除记录

## 联系支持

如有问题，请检查：
1. Vercel KV 是否在有效期内
2. 环境变量是否正确
3. HScode.txt 文件格式是否正确（4列，Tab分隔）