# 管理后台 API 文档（最终精修版）

> 适用于管理后台前端、管理脚本、联调测试。本文档已按当前代码实现核对，基于 `/api/v1` 路由输出。

---

## 目录

- [1. 文档说明](#1-文档说明)
- [2. 认证与权限模型](#2-认证与权限模型)
- [3. 通用约定](#3-通用约定)
- [4. 管理员认证](#4-管理员认证)
- [5. 仪表盘](#5-仪表盘)
- [6. 用户管理](#6-用户管理)
- [7. 科目管理](#7-科目管理)
- [8. 题型管理](#8-题型管理)
- [9. 题目管理](#9-题目管理)
- [10. 学习资料管理](#10-学习资料管理)
- [11. 考试配置管理](#11-考试配置管理)
- [12. 考试会话管理](#12-考试会话管理)
- [13. 成绩统计](#13-成绩统计)
- [14. RBAC 管理](#14-rbac-管理)
- [15. 知识点管理](#15-知识点管理)
- [16. 接口索引表](#16-接口索引表)
- [17. 错误响应示例](#17-错误响应示例)
- [18. 限流说明](#18-限流说明)
- [19. 安全实现说明](#19-安全实现说明)

---

## 1. 文档说明

### 1.1 基础信息

- **Base URL**: `https://exam-server.hanbin123.com/api/v1`
- **认证方式**: `Authorization: Bearer <admin_token>`
- **Token 类型**: Admin JWT
- **角色要求**: `role=admin`
- **默认分页**:
  - `page=1`
  - `pageSize=20`
  - `pageSize <= 100`

### 1.2 统一响应结构

```json
{
  "code": 200,
  "data": {},
  "message": "success"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 业务状态码 |
| data | any | 响应数据，可能为对象、数组或 `null` |
| message | string | 响应消息 |

### 1.3 时间格式约定

文档中的时间字段统一按 **ISO 8601** 示例书写，例如：

- `2026-04-21T10:00:00+00:00`
- `2026-04-21T12:00:00+00:00`

说明：实际返回是否包含时区偏移，取决于当前服务层 `isoformat()` 输出与底层数据对象时区信息。

---

## 2. 认证与权限模型

### 2.1 内置角色

| 角色 code | 名称 | is_super | 说明 |
|-----------|------|----------|------|
| `super_admin` | 超级管理员 | `true` | 绕过全部权限检查与科目授权检查 |
| `admin` | 管理员 | `false` | 需具备权限 code + 科目授权 |
| `teacher` | 教师 | `false` | 需具备权限 code + 科目授权 |

### 2.2 内置权限

| 权限 code | 名称 | 说明 |
|-----------|------|------|
| `subject:manage` | 科目管理 | 创建 / 更新 / 删除科目 |
| `question:manage` | 题目管理 | 创建 / 更新 / 删除题目 |
| `question_type:manage` | 题型管理 | 创建 / 更新 / 删除题型 |
| `material:manage` | 资料管理 | 创建 / 更新 / 删除学习资料 |
| `exam:manage` | 考试配置管理 | 创建 / 更新 / 删除考试配置、查看考试会话 |
| `score:view` | 成绩查看 | 查看成绩统计与成绩列表 |
| `grading:review` | 主观题评阅 | 当前代码中已内置权限，但未暴露单独评阅接口 |
| `admin:manage` | 管理员管理 | 管理员、角色、菜单、授权关系管理 |
| `dashboard:view` | 仪表盘查看 | 查看系统概览 |

### 2.3 科目授权规则

管理员写接口中，常见权限校验逻辑如下：

| 场景 | subject_id 来源 |
|------|-----------------|
| 创建类接口 | 从请求体读取 `subject_id` |
| 更新 / 删除类接口 | 先查实体，再取实体 `subject_id` |
| 科目本身 CRUD | 不做科目授权限制，仅校验 `subject:manage` |
| 统计类接口 | 从 query 参数读取，如 `subjectId` |

### 2.4 超级管理员行为

`super_admin`：
- 自动拥有全部权限
- 不需要 `SubjectAdmin` 关系授权
- 可直接访问所有管理员端点（仍需有效 Admin JWT）

---

## 3. 通用约定

### 3.1 分页返回结构

凡返回分页结果的接口，统一为：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "total_pages": 0
}
```

说明：
- 部分旧接口只返回到 `page_size`
- 当前代码中 `PaginatedResponse.build()` 返回 `total_pages`
- 若某接口未使用 `PaginatedResponse.build()`，则可能不含 `total_pages`

### 3.2 常见认证失败文案

| 场景 | 典型 message |
|------|--------------|
| Token 无效 / 过期 | `Invalid or expired token` |
| Token 已撤销 | `Token has been revoked` |
| 使用用户 Token 访问管理员接口 | `Admin access required` |
| 管理员账号不存在 / 停用 | `Admin account not found or deactivated` / `Admin account is deactivated` |

---

## 4. 管理员认证

### 4.1 管理员登录

- **方法**: `POST`
- **路径**: `/admin/auth/login`
- **认证**: 无需认证
- **权限**: 无

**请求体**

```json
{
  "email": "admin@exam.com",
  "password": "Qkl123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 管理员邮箱 |
| password | string | 是 | 密码 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "admin": {
      "id": "admin_default",
      "name": "Default Admin",
      "email": "admin@exam.com",
      "is_active": true,
      "role": "admin",
      "role_info": {
        "code": "super_admin",
        "name": "超级管理员",
        "is_super": true
      }
    }
  },
  "message": "success"
}
```

**常见失败**

```json
{
  "code": 401,
  "data": null,
  "message": "Invalid email or password"
}
```

### 4.2 注册新管理员

- **方法**: `POST`
- **路径**: `/admin/auth/register`
- **认证**: 需 Admin JWT
- **权限**: `admin:manage`

**请求体**

```json
{
  "name": "新管理员",
  "email": "newadmin@exam.com",
  "password": "StrongPass123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 最长 100 字符 |
| email | string | 是 | 邮箱 |
| password | string | 是 | 6~20 位，需通过密码强度校验 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "token": "eyJ...",
    "admin": {
      "id": "xxxxxxxxxxxxxxxx",
      "name": "新管理员",
      "email": "newadmin@exam.com",
      "is_active": true,
      "role": "admin",
      "role_info": {
        "code": "teacher",
        "name": "教师",
        "is_super": false
      }
    }
  },
  "message": "success"
}
```

**常见失败**
- 403：无 `admin:manage`
- 409：`Admin email already exists`

**实现备注**
- 当前实现优先给新管理员分配 `teacher` 角色（若该角色存在）

### 4.3 获取当前管理员信息

- **方法**: `GET`
- **路径**: `/admin/auth/me`
- **认证**: 需 Admin JWT
- **权限**: 无

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": "admin_default",
    "name": "Default Admin",
    "email": "admin@exam.com",
    "is_active": true,
    "role": "admin",
    "role_info": {
      "code": "super_admin",
      "name": "超级管理员",
      "is_super": true
    }
  },
  "message": "success"
}
```

### 4.4 修改管理员个人信息

- **方法**: `PUT`
- **路径**: `/admin/auth/me`
- **认证**: 需 Admin JWT
- **权限**: 无

**请求体**

```json
{
  "name": "新名称",
  "email": "newemail@exam.com"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 最长 100 字符 |
| email | string | 否 | 最长 200 字符 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": "admin_default",
    "name": "新名称",
    "email": "newemail@exam.com",
    "is_active": true,
    "role": "admin"
  },
  "message": "success"
}
```

**常见失败**
- 409：`Email already in use`

### 4.5 修改管理员密码

- **方法**: `PUT`
- **路径**: `/admin/auth/password`
- **认证**: 需 Admin JWT
- **权限**: 无

**请求体**

```json
{
  "old_password": "OldPass123",
  "new_password": "NewPass456"
}
```

**成功响应**

```json
{
  "code": 200,
  "data": {
    "message": "Password changed successfully"
  },
  "message": "success"
}
```

**常见失败**

```json
{
  "code": 400,
  "data": null,
  "message": "Old password is incorrect"
}
```

### 4.6 获取当前管理员菜单

- **方法**: `GET`
- **路径**: `/admin/auth/menus`
- **认证**: 需 Admin JWT
- **权限**: 无

**成功响应**

```json
{
  "code": 200,
  "data": {
    "routes": [
      {
        "id": 1,
        "name": "dashboard",
        "routeKey": "dashboard",
        "title": "仪表盘",
        "path": "/dashboard",
        "meta": {
          "title": "仪表盘",
          "i18nKey": "route.dashboard",
          "icon": "mdi:monitor-dashboard",
          "order": 1
        }
      }
    ],
    "home": "dashboard"
  },
  "message": "success"
}
```

### 4.7 获取当前管理员权限列表

- **方法**: `GET`
- **路径**: `/admin/auth/permissions`
- **认证**: 需 Admin JWT
- **权限**: 无

**成功响应**

```json
{
  "code": 200,
  "data": [
    "subject:manage",
    "question:manage",
    "score:view"
  ],
  "message": "success"
}
```

### 4.8 管理员登出

- **方法**: `POST`
- **路径**: `/admin/auth/logout`
- **认证**: 需 Admin JWT
- **权限**: 无

**成功响应**

```json
{
  "code": 200,
  "data": null,
  "message": "logged out"
}
```

---

## 5. 仪表盘

### 5.1 获取系统概览

- **方法**: `GET`
- **路径**: `/admin/dashboard`
- **认证**: 需 Admin JWT
- **权限**: `dashboard:view`

**成功响应**

```json
{
  "code": 200,
  "data": {
    "total_users": 150,
    "total_submissions": 320,
    "active_subjects": 3
  },
  "message": "success"
}
```

---

## 6. 用户管理

### 6.1 后台新增用户

- **方法**: `POST`
- **路径**: `/admin/users`
- **认证**: 需 Admin JWT
- **权限**: `admin:manage`

**请求体**

```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "UserPass123",
  "phone": "13800138000"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 最长 100 字符 |
| email | string | 是 | 邮箱，需唯一 |
| password | string | 是 | 6~20 位，需通过密码强度校验（含字母+数字） |
| phone | string | 否 | 最长 20 字符 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": "abc123",
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "is_active": true
  },
  "message": "user created"
}
```

**常见失败**
- 403：无 `admin:manage` 权限
- 409：`Email already registered`

### 6.2 分页获取用户列表

- **方法**: `GET`
- **路径**: `/admin/users`
- **认证**: 需 Admin JWT
- **权限**: `score:view`

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 默认 1 |
| pageSize | int | 否 | 默认 20，最大 100 |
| keyword | string | 否 | 按姓名或邮箱模糊搜索 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "abc123",
        "name": "张三",
        "email": "zhangsan@example.com",
        "phone": "13800138000",
        "user_code": "A3K9X2",
        "is_active": true,
        "submissions_count": 5,
        "created_at": "2026-04-21T10:00:00+00:00"
      }
    ],
    "total": 150,
    "page": 1,
    "page_size": 20,
    "total_pages": 8
  },
  "message": "success"
}
```

### 6.3 查看用户详情

- **方法**: `GET`
- **路径**: `/admin/users/{user_id}`
- **认证**: 需 Admin JWT
- **权限**: `score:view`

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 用户 ID |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": "abc123",
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "user_code": "A3K9X2",
    "avatar": "https://example.com/avatar.jpg",
    "is_active": true,
    "created_at": "2026-04-21T10:00:00+00:00",
    "last_login": "2026-04-22T09:30:00+00:00"
  },
  "message": "success"
}
```

### 6.4 激活用户

- **方法**: `PUT`
- **路径**: `/admin/users/{user_id}/activate`
- **认证**: 需 Admin JWT
- **权限**: `admin:manage`

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": "abc123",
    "is_active": true
  },
  "message": "success"
}
```

### 6.5 重置用户密码

- **方法**: `PUT`
- **路径**: `/admin/users/{user_id}/reset-password`
- **认证**: 需 Admin JWT
- **权限**: `admin:manage`

**请求体**

```json
{
  "new_password": "NewPass456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| new_password | string | 是 | 6~20 位，需通过密码强度校验 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "message": "Password reset successfully"
  },
  "message": "success"
}
```

### 6.6 停用用户

- **方法**: `DELETE`
- **路径**: `/admin/users/{user_id}`
- **认证**: 需 Admin JWT
- **权限**: `admin:manage`

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": "abc123",
    "deleted": true
  },
  "message": "user deactivated"
}
```

### 6.7 分配 / 重置用户查询码

- **方法**: `PUT`
- **路径**: `/admin/users/{user_id}/assign-code`
- **认证**: 需 Admin JWT
- **权限**: `admin:manage`

**请求体**

```json
{
  "user_code": "A3K9X2"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_code | string | 否 | 不传时自动生成 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "user_id": "abc123",
    "user_code": "A3K9X2"
  },
  "message": "success"
}
```

---

## 7. 科目管理

### 7.1 获取科目列表

- **方法**: `GET`
- **路径**: `/subjects`
- **认证**: 需 User JWT 或 Admin JWT
- **权限**: 无

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 默认 1 |
| pageSize | int | 否 | 默认 20，最大 100 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "blockchain",
        "name": "区块链技术",
        "description": "区块链技术基础与应用",
        "category": "计算机",
        "icon": "",
        "is_active": true,
        "stats": {
          "totalQuestions": 210,
          "totalMaterials": 15,
          "totalExams": 3
        }
      }
    ],
    "total": 8,
    "page": 1,
    "page_size": 20
  },
  "message": "success"
}
```

### 7.2 获取科目详情

- **方法**: `GET`
- **路径**: `/subjects/{subject_id}`
- **认证**: 需 User JWT 或 Admin JWT
- **权限**: 用户侧按用户科目访问权限检查；管理员直接可访问

### 7.3 创建科目

- **方法**: `POST`
- **路径**: `/admin/subjects`
- **认证**: 需 Admin JWT
- **权限**: `subject:manage`

**请求体**

```json
{
  "id": "blockchain",
  "name": "区块链技术",
  "description": "区块链技术基础与应用",
  "category": "计算机",
  "icon": ""
}
```

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": "blockchain",
    "name": "区块链技术",
    "description": "区块链技术基础与应用",
    "category": "计算机",
    "icon": "",
    "is_active": true,
    "stats": null
  },
  "message": "success"
}
```

### 7.4 更新科目

- **方法**: `PUT`
- **路径**: `/admin/subjects/{subject_id}`
- **认证**: 需 Admin JWT
- **权限**: `subject:manage`

### 7.5 删除科目

- **方法**: `DELETE`
- **路径**: `/admin/subjects/{subject_id}`
- **认证**: 需 Admin JWT
- **权限**: `subject:manage`

**成功响应**

```json
{
  "code": 200,
  "data": null,
  "message": "deleted"
}
```

**常见失败**
- 409：`Cannot delete subject with existing questions`
- 409：`Cannot delete subject with existing materials`
- 409：`Cannot delete subject with existing exams`

---

## 8. 题型管理

### 8.1 获取题型列表

- **方法**: `GET`
- **路径**: `/subjects/{subject_id}/question-types`
- **认证**: 需 User JWT 或 Admin JWT
- **权限**: 用户侧需用户科目访问权限；管理员直接可访问

### 8.2 创建题型

- **方法**: `POST`
- **路径**: `/admin/question-types`
- **认证**: 需 Admin JWT
- **权限**: `question_type:manage` + 对应科目授权

**请求体**

```json
{
  "subject_id": "blockchain",
  "name": "choice",
  "display_name": "单选题",
  "has_options": true,
  "has_sub_questions": false,
  "scoring_type": "auto",
  "default_score": 1.0,
  "sort_order": 1
}
```

### 8.3 更新题型

- **方法**: `PUT`
- **路径**: `/admin/question-types/{type_id}`
- **认证**: 需 Admin JWT
- **权限**: `question_type:manage` + 题型所属科目授权

### 8.4 删除题型

- **方法**: `DELETE`
- **路径**: `/admin/question-types/{type_id}`
- **认证**: 需 Admin JWT
- **权限**: `question_type:manage` + 题型所属科目授权

**常见失败**
- 409：关联题目仍存在，不能删除

---

## 9. 题目管理

### 9.1 管理端题目列表

- **方法**: `GET`
- **路径**: `/admin/subjects/{subject_id}/questions`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 科目授权

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 默认 1 |
| pageSize | int | 否 | 默认 20，最大 100 |
| type_id | int | 否 | 题型 ID 过滤 |
| difficulty | string | 否 | 难度过滤：`easy` / `medium` / `hard` |
| category | string | 否 | 分类过滤 |
| keyword | string | 否 | 按题干模糊搜索 |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "type": {
          "name": "choice",
          "display_name": "单选题"
        },
        "category": "职业素养",
        "difficulty": "medium",
        "title": "职业素养的构成...",
        "score": 1.0,
        "answer": "C",
        "sort_order": 1
      }
    ],
    "total": 210,
    "page": 1,
    "page_size": 20
  },
  "message": "success"
}
```

### 9.2 获取题目统计

- **方法**: `GET`
- **路径**: `/subjects/{subject_id}/questions/stats`
- **认证**: 需 User JWT 或 Admin JWT
- **权限**: 用户侧需用户科目访问权限；管理员直接可访问

### 9.3 创建题目

- **方法**: `POST`
- **路径**: `/admin/questions`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 对应科目授权

**请求体**

```json
{
  "subject_id": "blockchain",
  "type_id": 1,
  "parent_id": null,
  "category": "职业素养",
  "difficulty": "medium",
  "title": "职业素养的构成除了敬业精神，还应包括（）。",
  "content": {
    "options": [
      {"key": "A", "text": "创新精神"},
      {"key": "B", "text": "合作的态度"},
      {"key": "C", "text": "创新精神与合作的态度"},
      {"key": "D", "text": "敬业精神"}
    ]
  },
  "answer": "C",
  "explanation": "职业素养的构成除了敬业精神，还应包括合作的态度。",
  "tags": ["职业素养", "合作精神"],
  "score": 1.0,
  "sort_order": 0
}
```

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": 101
  },
  "message": "success"
}
```

### 9.4 更新题目

- **方法**: `PUT`
- **路径**: `/admin/questions/{question_id}`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 题目所属科目授权

### 9.5 删除题目

- **方法**: `DELETE`
- **路径**: `/admin/questions/{question_id}`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 题目所属科目授权

### 9.6 批量导入题目

- **方法**: `POST`
- **路径**: `/admin/questions/batch`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 科目授权

**成功响应**

```json
{
  "code": 200,
  "data": {
    "created": 2,
    "skipped": 0
  },
  "message": "batch import done"
}
```

---

## 10. 学习资料管理

### 10.1 用户侧资料列表

- **方法**: `GET`
- **路径**: `/subjects/{subject_id}/materials`
- **认证**: 需 User JWT
- **权限**: 用户科目访问权限

### 10.2 创建资料

- **方法**: `POST`
- **路径**: `/admin/materials`
- **认证**: 需 Admin JWT
- **权限**: `material:manage` + 科目授权

### 10.3 更新资料

- **方法**: `PUT`
- **路径**: `/admin/materials/{material_id}`
- **认证**: 需 Admin JWT
- **权限**: `material:manage` + 资料所属科目授权

### 10.4 删除资料

- **方法**: `DELETE`
- **路径**: `/admin/materials/{material_id}`
- **认证**: 需 Admin JWT
- **权限**: `material:manage` + 资料所属科目授权

---

## 11. 考试配置管理

### 11.1 用户侧考试列表

- **方法**: `GET`
- **路径**: `/subjects/{subject_id}/exams`
- **认证**: 需 User JWT
- **权限**: 用户科目访问权限

### 11.2 用户侧考试详情

- **方法**: `GET`
- **路径**: `/exams/{exam_id}`
- **认证**: 需 User JWT 或 Admin JWT
- **权限**: 用户侧需用户科目访问权限；管理员直接可访问

### 11.3 创建考试配置

- **方法**: `POST`
- **路径**: `/admin/exams`
- **认证**: 需 Admin JWT
- **权限**: `exam:manage` + 科目授权

**请求体**

```json
{
  "subject_id": "blockchain",
  "name": "区块链期末考试",
  "description": "期末综合考试",
  "duration": 120,
  "question_rules": {
    "choice": {"count": 50, "random": true},
    "judgment": {"count": 20, "random": true}
  },
  "scoring_rules": {
    "choice": {"comparison": "exact", "case_sensitive": false},
    "judgment": {"comparison": "exact", "case_sensitive": false},
    "fill_blank": {"comparison": "normalized"}
  }
}
```

**成功响应**

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "区块链期末考试"
  },
  "message": "success"
}
```

### 11.4 更新考试配置

- **方法**: `PUT`
- **路径**: `/admin/exams/{exam_id}`
- **认证**: 需 Admin JWT
- **权限**: `exam:manage` + 考试所属科目授权

### 11.5 删除考试配置

- **方法**: `DELETE`
- **路径**: `/admin/exams/{exam_id}`
- **认证**: 需 Admin JWT
- **权限**: `exam:manage` + 考试所属科目授权

**常见失败**
- 400：`Cannot delete exam with active sessions`

### 11.6 scoring_rules 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| comparison | string | `exact` / `contains` / `normalized` |
| case_sensitive | boolean | 是否区分大小写 |

| comparison | 说明 | 典型题型 |
|------------|------|----------|
| exact | 精确匹配 | 单选、判断 |
| contains | 用户答案包含标准答案 | 多选等扩展场景 |
| normalized | 忽略大小写并压缩空白 | 填空 |

---

## 12. 考试会话管理

### 12.1 查看会话列表

- **方法**: `GET`
- **路径**: `/admin/exams/{exam_id}/sessions`
- **认证**: 需 Admin JWT
- **权限**: `exam:manage` + 科目授权

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 默认 1 |
| pageSize | int | 否 | 默认 20，最大 100 |

### 12.2 查看会话详情

- **方法**: `GET`
- **路径**: `/admin/exams/sessions/{session_id}`
- **认证**: 需 Admin JWT
- **权限**: `exam:manage` + 科目授权

---

## 13. 成绩统计

### 13.1 科目成绩统计

- **方法**: `GET`
- **路径**: `/admin/scores/stats`
- **认证**: 需 Admin JWT
- **权限**: `score:view` + `subjectId` 对应科目授权

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subjectId | string | 是 | 科目 ID |

**成功响应**

```json
{
  "code": 200,
  "data": {
    "average_score": 72.6,
    "max_score": 96.0,
    "min_score": 18.0,
    "total_submissions": 120,
    "score_distribution": {
      "0-20": 2,
      "20-40": 8,
      "40-60": 20,
      "60-80": 45,
      "80-100": 45
    }
  },
  "message": "success"
}
```

### 13.2 成绩列表

- **方法**: `GET`
- **路径**: `/admin/scores/list`
- **认证**: 需 Admin JWT
- **权限**: `score:view` + `subjectId` 对应科目授权

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subjectId | string | 是 | 科目 ID |
| page | int | 否 | 默认 1 |
| pageSize | int | 否 | 默认 20，最大 100 |

---

## 14. RBAC 管理

> 本节从“完整字段文档”角度说明 RBAC，而非仅列端点。

### 14.1 权限实体字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 权限主键 |
| code | string | 权限唯一标识 |
| name | string | 权限名称 |
| description | string/null | 权限描述 |

### 14.2 角色实体字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 角色主键 |
| name | string | 角色名称 |
| code | string | 角色唯一标识 |
| description | string/null | 角色描述 |
| is_active | boolean | 是否启用 |
| is_super | boolean | 是否超级角色 |
| sort_order | int | 排序 |
| permissions | array | 角色绑定权限列表 |

### 14.3 菜单实体字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 菜单主键 |
| parent_id | int/null | 父菜单 ID |
| name | string | 菜单名称 |
| route_key | string/null | 路由唯一键 |
| path | string/null | 路由路径 |
| icon | string/null | 图标 |
| component | string/null | 组件路径 |
| permission_code | string/null | 绑定权限 code |
| i18n_key | string/null | 国际化 key |
| hide_in_menu | boolean | 是否隐藏 |
| href | string/null | 外链 |
| sort_order | int | 排序 |
| is_visible | boolean | 是否可见 |
| is_active | boolean | 是否启用 |
| children | array/null | 子菜单 |

### 14.4 管理员详情字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 管理员 ID |
| name | string | 管理员名称 |
| email | string | 邮箱 |
| role | object/null | 角色对象 |
| subject_ids | array | 已授权科目 ID 列表 |
| is_active | boolean | 是否激活（仅管理员详情接口扩展返回） |

### 14.5 SubjectAdmin 关系字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 关系主键 |
| admin_id | string | 管理员 ID |
| subject_id | string | 科目 ID |
| granted_by | string/null | 授权人 ID |
| granted_at | string/null | 授权时间 |

### 14.6 UserSubject 关系字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 关系主键 |
| user_id | string | 用户 ID |
| subject_id | string | 科目 ID |
| granted_by | string/null | 授权人 ID |
| granted_at | string/null | 授权时间 |

### 14.7 RBAC 端点清单

#### 权限管理

| 方法 | 路径 | 认证 | 权限 |
|------|------|------|------|
| GET | `/admin/rbac/permissions` | Admin JWT | 无 |
| POST | `/admin/rbac/permissions` | Admin JWT | `admin:manage` |
| PUT | `/admin/rbac/permissions/{permission_id}` | Admin JWT | `admin:manage` |
| DELETE | `/admin/rbac/permissions/{permission_id}` | Admin JWT | `admin:manage` |

#### 角色管理

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/admin/rbac/roles` | Admin JWT | 无 | 分页，支持 `includeInactive` / `page` / `pageSize` |
| GET | `/admin/rbac/roles/{role_id}` | Admin JWT | 无 | |
| POST | `/admin/rbac/roles` | Admin JWT | `admin:manage` | |
| PUT | `/admin/rbac/roles/{role_id}` | Admin JWT | `admin:manage` | |
| DELETE | `/admin/rbac/roles/{role_id}` | Admin JWT | `admin:manage` | |
| GET | `/admin/rbac/roles/{role_code}/permissions` | Admin JWT | 无 | |
| POST | `/admin/rbac/roles/permissions` | Admin JWT | `admin:manage` | |
| GET | `/admin/rbac/roles/{role_code}/menus` | Admin JWT | 无 | |
| POST | `/admin/rbac/roles/menus` | Admin JWT | `admin:manage` | |

#### 菜单管理

| 方法 | 路径 | 认证 | 权限 |
|------|------|------|------|
| GET | `/admin/rbac/menus` | Admin JWT | 无 |
| POST | `/admin/rbac/menus` | Admin JWT | `admin:manage` |
| PUT | `/admin/rbac/menus/{menu_id}` | Admin JWT | `admin:manage` |
| DELETE | `/admin/rbac/menus/{menu_id}` | Admin JWT | `admin:manage` |

#### 管理员与授权关系

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | `/admin/rbac/admins` | Admin JWT | 无 | 分页，支持 `page` / `pageSize` |
| GET | `/admin/rbac/admins/{admin_id}` | Admin JWT | 无 | |
| PUT | `/admin/rbac/admins/{admin_id}/role` | Admin JWT | `admin:manage` | |
| GET | `/admin/rbac/admins/{admin_id}/menus` | Admin JWT | 无 |
| GET | `/admin/rbac/admins/{admin_id}/subjects` | Admin JWT | 无 |
| PUT | `/admin/rbac/admins/{admin_id}/deactivate` | Admin JWT | `admin:manage` |
| PUT | `/admin/rbac/admins/{admin_id}/activate` | Admin JWT | `admin:manage` |
| POST | `/admin/rbac/subject-admins` | Admin JWT | `admin:manage` |
| DELETE | `/admin/rbac/subject-admins` | Admin JWT | `admin:manage` |
| POST | `/admin/rbac/user-subjects` | Admin JWT | `admin:manage` |
| DELETE | `/admin/rbac/user-subjects` | Admin JWT | `admin:manage` |
| GET | `/admin/rbac/user-subjects/{user_id}` | Admin JWT | 无 |
| GET | `/admin/rbac/user-subjects/subject/{subject_id}` | Admin JWT | 无 |
| POST | `/admin/rbac/init` | Admin JWT | `admin:manage` |

### 14.8 RBAC 常见失败示例

**角色 code 冲突**

```json
{
  "code": 409,
  "data": null,
  "message": "Role code already exists"
}
```

**删除超级角色**

```json
{
  "code": 403,
  "data": null,
  "message": "Cannot delete super role"
}
```

**给超级角色分配权限**

```json
{
  "code": 403,
  "data": null,
  "message": "Super role has all permissions automatically"
}
```

---

## 15. 知识点管理

### 15.1 获取知识点树

- **方法**: `GET`
- **路径**: `/admin/knowledge-points/subjects/{subject_id}`
- **认证**: 需 Admin JWT
- **权限**: 当前代码仅要求管理员登录

### 15.2 获取知识点详情

- **方法**: `GET`
- **路径**: `/admin/knowledge-points/{kp_id}`
- **认证**: 需 Admin JWT
- **权限**: 当前代码仅要求管理员登录

### 15.3 创建知识点

- **方法**: `POST`
- **路径**: `/admin/knowledge-points`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 科目授权

### 15.4 更新知识点

- **方法**: `PUT`
- **路径**: `/admin/knowledge-points/{kp_id}`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 科目授权

### 15.5 删除知识点

- **方法**: `DELETE`
- **路径**: `/admin/knowledge-points/{kp_id}`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 科目授权

### 15.6 为题目分配知识点

- **方法**: `POST`
- **路径**: `/admin/knowledge-points/assign`
- **认证**: 需 Admin JWT
- **权限**: `question:manage` + 科目授权

### 15.7 获取题目关联知识点

- **方法**: `GET`
- **路径**: `/admin/knowledge-points/questions/{question_id}`
- **认证**: 需 Admin JWT
- **权限**: 当前代码仅要求管理员登录

---

## 16. 接口索引表

| 模块 | 方法 | 路径 |
|------|------|------|
| 管理员认证 | POST | `/admin/auth/login` |
| 管理员认证 | POST | `/admin/auth/register` |
| 管理员认证 | GET | `/admin/auth/me` |
| 管理员认证 | PUT | `/admin/auth/me` |
| 管理员认证 | PUT | `/admin/auth/password` |
| 管理员认证 | GET | `/admin/auth/menus` |
| 管理员认证 | GET | `/admin/auth/permissions` |
| 管理员认证 | POST | `/admin/auth/logout` |
| 仪表盘 | GET | `/admin/dashboard` |
| 用户管理 | POST | `/admin/users` |
| 用户管理 | GET | `/admin/users` |
| 用户管理 | GET | `/admin/users/{user_id}` |
| 用户管理 | PUT | `/admin/users/{user_id}/activate` |
| 用户管理 | PUT | `/admin/users/{user_id}/reset-password` |
| 用户管理 | DELETE | `/admin/users/{user_id}` |
| 用户管理 | PUT | `/admin/users/{user_id}/assign-code` |
| 科目管理 | POST | `/admin/subjects` |
| 科目管理 | PUT | `/admin/subjects/{subject_id}` |
| 科目管理 | DELETE | `/admin/subjects/{subject_id}` |
| 题型管理 | POST | `/admin/question-types` |
| 题型管理 | PUT | `/admin/question-types/{type_id}` |
| 题型管理 | DELETE | `/admin/question-types/{type_id}` |
| 题目管理 | GET | `/admin/subjects/{subject_id}/questions` |
| 题目管理 | POST | `/admin/questions` |
| 题目管理 | PUT | `/admin/questions/{question_id}` |
| 题目管理 | DELETE | `/admin/questions/{question_id}` |
| 题目管理 | POST | `/admin/questions/batch` |
| 资料管理 | POST | `/admin/materials` |
| 资料管理 | PUT | `/admin/materials/{material_id}` |
| 资料管理 | DELETE | `/admin/materials/{material_id}` |
| 考试配置 | POST | `/admin/exams` |
| 考试配置 | PUT | `/admin/exams/{exam_id}` |
| 考试配置 | DELETE | `/admin/exams/{exam_id}` |
| 考试会话 | GET | `/admin/exams/{exam_id}/sessions` |
| 考试会话 | GET | `/admin/exams/sessions/{session_id}` |
| 成绩统计 | GET | `/admin/scores/stats` |
| 成绩统计 | GET | `/admin/scores/list` |
| RBAC | 全部 | `/admin/rbac/*` |
| 知识点 | 全部 | `/admin/knowledge-points/*` |

---

## 17. 错误响应示例

### 17.1 未登录 / Token 无效

```json
{
  "code": 401,
  "data": null,
  "message": "Invalid or expired token"
}
```

### 17.2 权限不足

```json
{
  "code": 403,
  "data": null,
  "message": "No permission 'question:manage' for subject 'blockchain'"
}
```

### 17.3 资源不存在

```json
{
  "code": 404,
  "data": null,
  "message": "Question not found"
}
```

### 17.4 资源冲突

```json
{
  "code": 409,
  "data": null,
  "message": "Subject ID already exists"
}
```

### 17.5 参数 / 业务错误

```json
{
  "code": 400,
  "data": null,
  "message": "Old password is incorrect"
}
```

---

## 18. 限流说明

| 路径模式 | 限制 | 时间窗口 |
|----------|------|----------|
| `/auth/login` | 10 次 | 60 秒 |
| `/auth/register` | 5 次 | 60 秒 |
| `/admin/auth/login` | 10 次 | 60 秒 |
| `/admin/auth/register` | 3 次 | 60 秒 |
| `/exams/session/*` | 20 次 | 60 秒 |
| `/cli/*` | 5 次 | 60 秒 |
| 其他端点 | 100 次 | 60 秒 |

**排除限流的端点**：`/health`、`/ping`、`/docs`、`/openapi.json`、`/redoc`

**触发限流示例**

```json
{
  "code": 429,
  "data": null,
  "message": "Rate limit exceeded. Max 10 requests per 60 seconds."
}
```

---

## 19. 安全实现说明

- Admin JWT 与 User JWT 使用不同密钥
- 支持 `jti` 级别 Token 撤销
- 老 Token 会退化到用户 / 管理员级黑名单
- 权限检查结果会进行短期缓存
- Redis 不可用时，关键认证 / 权限逻辑采取 fail-closed 策略
- 启动时校验 JWT 密钥强度，不安全配置会拒绝启动
