# 接口文档（API）

## 统一约定

- **BaseURL**：`http://localhost:3001`
- **数据格式**：`application/json`
- **鉴权方式**：需要登录的接口在请求头携带

```http
Authorization: Bearer <token>
```

- **错误返回**（统一）：

```json
{ "message": "error message" }
```

## 一、移动端（微信小程序 / 用户端）接口

### 1) 酒店列表

- **URL**：`GET /api/hotel/list`
- **鉴权**：否
- **Query**：
  - `city`：城市（可选，模糊匹配）
  - `keyword`：关键词（可选，匹配酒店中英文名/地址）
  - `page`：页码（可选，默认 1）
  - `pageSize`：每页数量（可选，默认 10，最大 50）
- **说明**：默认只返回 `approved`（已上架/已通过）酒店；如传 `status` 可指定状态（一般不给小程序开放）。

- **响应**：

```json
{
  "page": 1,
  "pageSize": 10,
  "total": 1,
  "items": [
    {
      "id": 1,
      "ownerId": 2,
      "nameZh": "上海和平饭店",
      "nameEn": "Peace Hotel",
      "city": "上海",
      "address": "南京东路",
      "star": 5,
      "openTime": "2020-01-01",
      "status": "approved",
      "rejectReason": "",
      "createdAt": "2026-02-10T00:00:00.000Z",
      "updatedAt": "2026-02-10T00:00:00.000Z",
      "price": 299,
      "minPrice": 299
    }
  ]
}
```

### 2) 酒店详情

- **URL**：`GET /api/hotel/detail/:id`
- **鉴权**：否
- **Path**：
  - `id`：酒店 ID
- **说明**：仅返回 `approved` 酒店。

- **响应**：

```json
{
  "hotel": {
    "id": 1,
    "nameZh": "上海和平饭店",
    "nameEn": "Peace Hotel",
    "city": "上海",
    "address": "南京东路",
    "star": 5,
    "openTime": "2020-01-01",
    "status": "approved",
    "rejectReason": ""
  },
  "rooms": [
    { "id": 1, "hotelId": 1, "name": "标准间", "price": 299 }
  ]
}
```

## 二、PC 管理端接口

### A. 登录 / 用户（Auth）

#### 1) 注册
- **URL**：`POST /api/auth/register`
- **鉴权**：否
- **Body**：

```json
{ "username": "merchant", "password": "merchant123", "role": "merchant" }
```

- **响应**：

```json
{
  "token": "<jwt>",
  "user": { "id": 2, "username": "merchant", "role": "merchant" }
}
```

#### 2) 登录
- **URL**：`POST /api/auth/login`
- **鉴权**：否
- **Body**：

```json
{ "username": "merchant", "password": "merchant123" }
```

- **响应**：

```json
{
  "token": "<jwt>",
  "user": { "id": 2, "username": "merchant", "role": "merchant" }
}
```

#### 3) 获取当前登录用户
- **URL**：`GET /api/auth/me`
- **鉴权**：是
- **响应**：

```json
{ "user": { "id": 2, "username": "merchant", "role": "merchant" } }
```

#### 4) 修改用户名（个人中心）
- **URL**：`PUT /api/auth/profile`
- **鉴权**：是
- **Body**：

```json
{ "username": "merchant_new" }
```

- **响应**：

```json
{ "user": { "id": 2, "username": "merchant_new", "role": "merchant" } }
```

#### 5) 修改密码（个人中心）
- **URL**：`PUT /api/auth/password`
- **鉴权**：是
- **Body**：

```json
{ "oldPassword": "merchant123", "newPassword": "merchant456" }
```

- **响应**：

```json
{ "ok": true }
```

> 建议前端在修改密码成功后要求重新登录。

### B. 商户端（merchant）接口

> 以下接口需要：
> - `Authorization: Bearer <token>`
> - 且用户 `role=merchant`

#### 1) 我的酒店列表
- **URL**：`GET /api/merchant/hotel/list`
- **鉴权**：是（merchant）
- **响应**：

```json
{ "items": [ { "id": 1, "nameZh": "...", "status": "pending" } ] }
```

#### 2) 获取我的酒店详情（编辑回填）
- **URL**：`GET /api/merchant/hotel/:id`
- **鉴权**：是（merchant，且必须是自己的酒店）
- **响应**：

```json
{ "hotel": { "id": 1, "nameZh": "..." }, "rooms": [ { "name": "标准间", "price": 299 } ] }
```

#### 3) 创建酒店（提交审核）
- **URL**：`POST /api/merchant/hotel`
- **鉴权**：是（merchant）
- **Body**（核心字段）：

```json
{
  "nameZh": "上海和平饭店",
  "nameEn": "Peace Hotel",
  "city": "上海",
  "address": "南京东路",
  "star": 5,
  "openTime": "2020-01-01",
  "roomTypes": [
    { "name": "标准间", "price": 299 },
    { "name": "豪华大床房", "price": 599 }
  ]
}
```

- **响应**：

```json
{ "hotel": { "id": 1, "status": "pending" } }
```

#### 4) 更新酒店（重新提交审核）
- **URL**：`PUT /api/merchant/hotel/:id`
- **鉴权**：是（merchant，且必须是自己的酒店）
- **Body**：同创建（可只传需要更新的字段）
- **说明**：更新后会把 `status` 重置为 `pending`。

### C. 管理员端（admin）接口

> 以下接口需要：
> - `Authorization: Bearer <token>`
> - 且用户 `role=admin`

#### 1) 审核列表
- **URL**：`GET /api/admin/audit`
- **鉴权**：是（admin）
- **Query**：
  - `status`：`pending | approved | rejected | offline`（默认 `pending`）

- **响应**：

```json
{ "items": [ { "id": 1, "nameZh": "...", "status": "pending" } ] }
```

#### 2) 审核通过
- **URL**：`POST /api/admin/audit/:id/approve`
- **鉴权**：是（admin）
- **响应**：

```json
{ "hotel": { "id": 1, "status": "approved" } }
```

#### 3) 审核驳回
- **URL**：`POST /api/admin/audit/:id/reject`
- **鉴权**：是（admin）
- **Body**：

```json
{ "reason": "资料不完整" }
```

- **响应**：

```json
{ "hotel": { "id": 1, "status": "rejected", "rejectReason": "资料不完整" } }
```

#### 4) 下线酒店
- **URL**：`POST /api/admin/hotel/:id/offline`
- **鉴权**：是（admin）

#### 5) 上线酒店
- **URL**：`POST /api/admin/hotel/:id/online`
- **鉴权**：是（admin）

