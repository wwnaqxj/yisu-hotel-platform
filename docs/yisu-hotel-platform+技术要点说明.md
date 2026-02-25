# yisu-hotel-platform + 技术要点说明

本文档用于概述本项目的整体技术栈与关键技术实现点，便于答辩/汇报/交付时快速说明“项目用了什么技术、解决了什么问题、关键模块怎么实现与部署”。

---

## 1. 项目形态与模块划分

本项目为“酒店平台”类应用，包含三端：

- **PC 管理端（商户端/管理员端）**：用于酒店信息、房型、图片视频等内容管理与审核。
- **用户端小程序**：用于酒店浏览、详情查看、查询周边信息，并提供数字助手交互。
- **后端服务（API）**：提供统一的业务接口、鉴权、数据库访问、媒体上传与代理访问。

推荐的线上部署形态：

- **同一域名**下：
  - Nginx 托管前端静态资源
  - `^~ /api/` 反向代理到 Node.js 后端
- 媒体资源通过后端 `/api/media/...` 统一代理（避免前端/小程序直连 MinIO 端口）。

---

## 2. 技术栈概览

### 2.1 PC 前端（client）

- **构建工具**：Vite 5
- **框架**：React 18
- **路由**：react-router-dom 6
- **状态管理**：Redux Toolkit + react-redux
- **UI 组件库**：
  - MUI（@mui/material、@mui/icons-material、emotion）
  - Ant Design（antd、@ant-design/icons）
- **网络请求**：axios
- **日期处理**：dayjs
- **行政区数据**：china-area-data
- **拼音处理**：pinyin-pro

典型场景要点：

- **SPA History 路由刷新不 404**：线上 Nginx 需要配置 `try_files ... /index.html` 让刷新子路由时回退到入口页面。
- **表单输入兼容**：部分场景下 `type="number"` 可能导致中文输入法体验不佳，通常采用 `type="text" + inputMode` 的方式控制输入。

### 2.2 后端（server）

- **运行时**：Node.js
- **Web 框架**：Express 4
- **环境配置**：dotenv
- **日志**：morgan
- **跨域**：cors
- **鉴权**：JWT（jsonwebtoken）
- **密码加密**：bcryptjs
- **上传处理**：multer
- **对象存储 SDK**：minio（MinIO Node SDK）

典型能力要点：

- **统一 API 前缀**：对外接口统一走 `/api/...`，便于 Nginx 反代与前后端同域部署。
- **登录鉴权**：基于 JWT 的 token 机制，后端中间件进行请求鉴权。
- **媒体上传与访问**：上传到 MinIO；访问时建议由后端提供 `/api/media/:bucket/:objectName` 代理输出，降低端口暴露与跨域问题。

### 2.3 数据库与 ORM（Prisma + MySQL）

- **数据库**：MySQL
- **ORM**：Prisma 6（@prisma/client + prisma）

数据模型（示例）：

- `User`：用户（角色：admin/merchant）
- `Hotel`：酒店（状态流转：pending/approved/rejected/offline，含图/视频/设施等 JSON 字段）
- `Room`：房型（价格、床型、面积、早餐、总房间数、可订房间数）

技术要点：

- **结构化字段 + 灵活字段结合**：如设施/图片/视频采用 `Json` 字段存储，提升迭代灵活性。
- **迁移管理**：通过 Prisma Migrate 管理表结构变更，生产环境通常使用 `prisma migrate deploy`。

### 2.4 用户端小程序（miniprogram）

- **页面**：home/list/detail/assistant 等
- **网络请求封装**：`miniprogram/utils/request`（对接后端 `/api/...`）
- **地图能力**：
  - 小程序 `map` 组件
  - 周边 POI：后端提供 `/api/geo/nearby`（可对接高德/腾讯等地图服务）
- **数字助手**：
  - 悬浮组件：`components/assistant-float`
  - 可跳转全屏助手页：`pages/assistant`
  - 语音能力：`WechatSI` 插件（语音识别与 TTS）

典型要点：

- **媒体 URL 归一化**：为适配小程序安全域名与 HTTPS，需将媒体链接统一转为 `https://<domain>/api/media/...`。
- **周边信息展示**：基于经纬度展示地铁/公交/餐饮等 POI，并支持 `wx.openLocation` 导航。

---

## 3. 媒体存储（MinIO）与访问策略

### 3.1 为什么需要 MinIO

- 适合存储酒店图片/视频等大文件
- 可替代本地磁盘存储，便于扩容与备份

### 3.2 上传与返回结构（后端）

后端将文件写入 MinIO 后返回：

- `bucket`
- `objectName`
- `url`（拼接的公开访问 URL）

代码位置示例：

- `server/utils/minioClient.js`：
  - `putObjectFromBuffer`：将 buffer 写入对象存储并返回 `url`

### 3.3 建议的对外访问方式：后端代理 `/api/media`

核心原因：

- 避免前端/小程序直连 MinIO 端口（9000/9001）
- 同域名下更容易处理 HTTPS、缓存与鉴权
- 便于做权限控制（如私有资源）

---

## 4. 接口与网络层设计

### 4.1 前端/小程序到后端

- PC 前端：axios 请求 `/api/...`
- 小程序：request 封装请求 `/api/...`

### 4.2 Nginx 反代策略（核心）

- 静态资源：由 Nginx 直接提供
- API：`location ^~ /api/ { proxy_pass http://127.0.0.1:3001/; }`
- SPA 刷新回退：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 5. 部署与运维要点（宝塔/服务器）

- **Nginx**：
  - 托管 `client/dist`
  - 反代 `/api` 到 Node
  - 配置 HTTPS、证书与 TLS
  - 禁止直接暴露敏感路径（`.env/.git` 等）

- **Node 服务进程管理**：
  - 推荐 PM2 常驻运行（重启自启、日志管理）

- **MinIO**：
  - 推荐 Docker 部署
  - 通过环境变量配置访问密钥、endpoint、public base url

- **MySQL**：
  - 生产环境独立用户、最小权限
  - Prisma 迁移需区分 dev 与 prod 模式

---

## 6. 安全与合规要点

- **密码不可明文存储**：使用 bcrypt 加密（bcryptjs）
- **接口鉴权**：JWT + 中间件验证
- **HTTPS 必须**：
  - 小程序对安全域名/HTTPS 有强要求
  - 媒体与 API 均应走 HTTPS
- **敏感配置**：
  - `.env` 等应加入 `.gitignore`，不入库

---

## 7. 目录结构参考（简版）

- `client/`：PC 前端
- `server/`：Node.js 后端（Express + Prisma）
- `miniprogram/`：微信小程序
- `docs/`：项目文档

---

## 8. 可扩展方向（后续迭代建议）

- 订单/支付/库存锁定（真实预订流程）
- 媒体访问权限控制（私有桶 + 临时签名 URL）
- 缓存与性能优化（Nginx 缓存、CDN、图片压缩）
- 管理端权限与审计日志
- 数字助手接入更完整的知识库/酒店数据检索
