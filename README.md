# 易宿酒店预订平台（yisu-hotel-platform）

易宿酒店预订平台是一个面向现代旅游出行场景的综合服务体系，旨在为酒店商家与终端消费者之间搭建高效、便捷的信息交互桥梁。

本项目分为两部分：
- 商户端（PC 管理端）：酒店信息录入/编辑，提交审核
- 用户端（微信小程序）：酒店查询、列表、详情

## 目录结构
- `miniprogram/`：微信小程序（用户端预定流程，使用微信开发者工具打开）
- `client/`：前端 React（PC 管理端）
- `server/`：Node.js 后端服务（Express + Prisma + MySQL）
- `docs/`：汇报 PPT / 设计文档

## 本地启动

### 1) 启动后端（server）
在 `server/` 目录下执行：
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

默认地址：`http://localhost:3001`

### 2) 启动 PC 管理端（client）
在 `client/` 目录下执行：
```bash
npm install
npm run dev
```

默认地址：Vite 控制台输出（通常为 `http://localhost:5173`）

### 3) 启动微信小程序（miniprogram）
使用微信开发者工具打开仓库中的 `miniprogram/` 目录。

> 注意：小程序请求后端时默认 `baseURL=http://localhost:3001`，需要先启动后端。

## 环境变量
后端：`server/.env`
```env
PORT=3001
JWT_SECRET=dev_secret
DATABASE_URL="mysql://root:你的密码@localhost:3306/yisuhotel"

# 可选：默认种子账号（首次启动 server 会自动创建，若已存在则跳过）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
MERCHANT_USERNAME=merchant
MERCHANT_PASSWORD=merchant123
```

## PC 管理端路由
- `/admin/login`：登录 / 注册
- `/admin/merchant/hotel-edit`：商户酒店录入/编辑（仅 `merchant` 可访问）
- `/admin/audit`：管理员审核列表（仅 `admin` 可访问）
- `/admin/profile`：个人中心（已登录即可访问）

## 后端接口（Auth）
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`：获取当前登录用户信息（从数据库读取最新 `username/role`）
- `PUT /api/auth/profile`：修改用户名（需登录）
- `PUT /api/auth/password`：修改密码（需登录，必须提供旧密码）

## 退出登录
PC 管理端右上角下拉菜单点击“退出登录”会：
- 清理本地 token / 登录态
- 跳转回 `/admin/login`

## UI 依赖说明
PC 管理端使用 Ant Design（antd）组件库：
- 已在 `client/src/main.jsx` 引入 `antd/dist/reset.css`

## 说明
当前为脚手架骨架：
- 已包含基础路由、鉴权、审核流转与前后端调用示例
- 业务功能需要在此基础上逐步补齐与完善 UI/交互
