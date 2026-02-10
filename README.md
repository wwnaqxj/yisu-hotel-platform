# 易宿酒店预订平台（yisu-hotel-platform）

## 项目简介
本项目包含两部分：
- `miniprogram/`：微信小程序（用户端预定流程）
- `client/`：前端 React（PC 管理端）
- `server/`：Node.js 后端服务（登录鉴权、酒店信息录入、审核发布、查询展示）

## 目录结构
- `miniprogram/`：微信小程序工程（使用微信开发者工具打开）
- `client/`：前端工程
- `server/`：后端工程
- `docs/`：汇报 PPT / 设计文档

## 本地启动

### 1) 启动后端
```bash
npm install
npm run dev
```
在 `server/` 目录下执行。

默认地址：`http://localhost:3001`

### 2) 启动前端
```bash
npm install
npm run dev
```
在 `client/` 目录下执行。

默认地址：Vite 控制台输出（通常为 `http://localhost:5173`）

### 3) 启动微信小程序
使用微信开发者工具打开仓库中的 `miniprogram/` 目录。

> 注意：小程序请求后端时默认 `baseURL=http://localhost:3001`，需要先启动后端。

## 环境变量
后端：`server/.env`
```env
PORT=3001
JWT_SECRET=dev_secret
```

## 说明
当前为脚手架骨架：
- 已包含路由、页面、组件、store、请求封装的基础结构
- 业务功能需要在此基础上逐步补齐
