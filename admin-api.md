# 管理后台接口文档

> 供管理后台前端项目使用，所有管理员端点需携带 Admin JWT（`Authorization: Bearer <token>`）

## 基础信息

- **Base URL**: `https://exam-server.hanbin123.com/api/v1`
- **响应格式**: 所有接口统一返回 `{ "code": int, "data": ..., "message": str }`
- **认证方式**: Admin JWT，Bearer Scheme，`role=admin`
- **错误码**: 200 成功 | 400 参数错误 | 401 未登录 | 403 权限不足 | 404 资源不存在 | 409 冲突

## 权限体系

### RBAC 角色

| 角色 code | 名称 | is_super | 说明 |
|-----------|------|----------|------|
| super_admin | 超级管理员 | true | 绕过所有权限检查，无需科目授权 |
| admin | 管理员 | false | 需科目授权 + 权限分配 |
| teacher | 教师 | false | 需科目授权 + 权限分配 |

### 9 个内置权限

| 权限 code | 名称 | 说明 |
|-----------|------|------|
| subject:manage | 科目管理 | 创建/编辑/删除科目 |
| question:manage | 题目管理 | 创建/编辑/删除题目 |
| question_type:manage | 题型管理 | 创建/编辑/删除题型 |
| material:manage | 资料管理 | 创建/编辑/删除学习资料 |
| exam:manage | 考试配置管理 | 创建/编辑考试配置 |
| score:view | 成绩查看 | 查看所有学生成绩 |
| grading:review | 主观题评阅 | 评阅主观题 |
| admin:manage | 管理员管理 | 创建/编辑管理员及角色 |
| dashboard:view | 仪表盘查看 | 查看管理仪表盘 |

### 权限检查模式

**Create 操作**: 从 request body 获取 `subject_id`，调用 `check_body_subject_permission(db, admin, permission_code, subject_id)`

**Update/Delete 操作**: 先查询实体获取 `subject_id`，再进行科目级权限检查

**super_admin**: 绕过所有权限检查，无需 SubjectAdmin 分配

**admin/teacher**: 需同时拥有对应权限 code + SubjectAdmin 科目授权

---

## 1. 管理员认证

### 1.1 管理员登录

```
POST /api/v1/admin/auth/login
```

**无需认证**

请求体：
```json
{
  "email": "admin@exam.com",
  "password": "Qkl123456"
}
```

成功响应：
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "admin": {
      "id": "admin_default",
      "name": "Default Admin",
      "email": "admin@exam.com",
      "role": "admin"
    }
  },
  "message": "success"
}
```

> 登录成功后获取 `token`，后续所有管理员端点请求头需携带 `Authorization: Bearer <token>`
> Admin JWT 有效期由 `JWT_EXPIRE_DAYS_ADMIN` 控制（默认 7 天）

失败响应：
```json
{
  "code": 401,
  "data": null,
  "message": "Invalid email or password"
}
```

### 1.2 注册新管理员

```
POST /api/v1/admin/auth/register
```

**需 Admin JWT + `admin:manage` 权限**

> 需已有管理员 JWT 且拥有 admin:manage 权限才能创建新管理员，防止未授权注册

请求体：
```json
{
  "name": "新管理员",
  "email": "newadmin@exam.com",
  "password": "StrongPass123"
}
```

成功响应：
```json
{
  "code": 200,
  "data": {
    "token": "eyJ...",
    "admin": {
      "id": "xxx",
      "name": "新管理员",
      "email": "newadmin@exam.com",
      "role": "admin"
    }
  },
  "message": "success"
}
```

> 需已有管理员 JWT 才能创建新管理员，防止未授权注册

### 1.3 获取当前管理员信息

```
GET /api/v1/admin/auth/me
```

**需 Admin JWT**

成功响应：
```json
{
  "code": 200,
  "data": {
    "id": "admin_default",
    "name": "Default Admin",
    "email": "admin@exam.com",
    "role": "admin",
    "role_info": {"code": "super_admin", "name": "超级管理员", "is_super": true}
  },
  "message": "success"
}
```

### 1.4 修改管理员个人信息

```
PUT /api/v1/admin/auth/me
```

**需 Admin JWT**

请求体（部分更新）：
```json
{
  "name": "新名称",
  "email": "newemail@exam.com"
}
```

### 1.5 管理员修改密码

```
PUT /api/v1/admin/auth/password
```

**需 Admin JWT**

请求体：
```json
{
  "old_password": "OldPass123",
  "new_password": "NewPass456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| old_password | string | 是 | 当前密码 |
| new_password | string | 是 | 新密码，最少 6 位 |

成功响应：
```json
{
  "code": 200,
  "data": {"message": "Password changed successfully"},
  "message": "success"
}
```

### 1.6 获取当前管理员菜单（前端路由）

```
GET /api/v1/admin/auth/menus
```

**需 Admin JWT**

> 返回当前管理员角色对应的菜单树，格式为前端 ElegantConstRoute

成功响应：
```json
{
  "code": 200,
  "data": {
    "routes": [
      {
        "name": "dashboard",
        "path": "/dashboard",
        "meta": {
          "title": "仪表盘",
          "i18nKey": "route.dashboard",
          "icon": "mdi:monitor-dashboard",
          "order": 1
        }
      },
      {
        "name": "subjects",
        "path": "/subjects",
        "meta": {
          "title": "科目管理",
          "i18nKey": "route.subjects",
          "icon": "mdi:book-open-variant",
          "order": 2
        },
        "children": [
          {
            "name": "subjects_list",
            "path": "/subjects/list",
            "meta": {
              "title": "科目列表",
              "i18nKey": "route.subjects_list",
              "icon": "mdi:format-list-bulleted",
              "order": 1
            }
          }
        ]
      }
    ],
    "home": "dashboard"
  },
  "message": "success"
}
```

| 字段 | 说明 |
|------|------|
| routes.name | 路由标识（route_key），前端靠此匹配组件 |
| routes.path | 路由路径 |
| routes.meta.title | 菜单显示标题 |
| routes.meta.i18nKey | 国际化 key |
| routes.meta.icon | Iconify 图标名 |
| routes.meta.order | 排序，越小越靠前 |
| routes.meta.hideInMenu | 是否在侧边栏隐藏 |
| routes.meta.href | 外链地址 |
| routes.children | 子菜单列表 |
| home | 登录后默认跳转页 |

> super_admin 返回所有菜单；其他角色根据 role_menus 过滤

---

## 2. 管理员仪表盘

### 2.1 获取系统概览

```
GET /api/v1/admin/dashboard
```

**需 Admin JWT + `dashboard:view` 权限**

成功响应：
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

| 字段 | 说明 |
|------|------|
| total_users | 注册学生总数 |
| total_submissions | 考试提交总数 |
| active_subjects | 激活科目数 |

---

## 3. 用户管理

### 3.1 分页获取用户列表

```
GET /api/v1/admin/users?page=1&pageSize=20&keyword=张
```

**需 Admin JWT + `score:view` 权限**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 20，最大 100 |
| keyword | string | 否 | 按姓名或邮箱搜索（模糊匹配） |

成功响应：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "abc123",
        "name": "张三",
        "email": "zhangsan@example.com",
        "created_at": "2026-04-21 10:00:00"
      }
    ],
    "total": 150,
    "page": 1,
    "page_size": 20
  },
  "message": "success"
}
```

| 字段 | 说明 |
|------|------|
| total | DB 实际总用户数（非当前页条数），支持正确分页 |
| page | 当前页码 |
| page_size | 每页数量 |

### 3.2 查看用户详情

```
GET /api/v1/admin/users/{user_id}
```

**需 Admin JWT + `score:view` 权限**

### 3.3 激活已停用用户

```
PUT /api/v1/admin/users/{user_id}/activate
```

**需 Admin JWT + `admin:manage` 权限**

> 将 `is_active` 设置为 true，恢复用户登录权限

### 3.4 重置用户密码

```
PUT /api/v1/admin/users/{user_id}/reset-password
```

**需 Admin JWT + `admin:manage` 权限**

### 3.5 停用用户

```
DELETE /api/v1/admin/users/{user_id}
```

**需 Admin JWT + `admin:manage` 权限**

> 软删除：将 `is_active` 设为 false，可通过 3.3 激活恢复

---

## 4. 科目管理

### 4.1 获取科目列表

```
GET /api/v1/subjects
```

**无需认证**

成功响应：
```json
{
  "code": 200,
  "data": [
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
  "message": "success"
}
```

### 4.2 获取科目详情

```
GET /api/v1/subjects/{subject_id}
```

**无需认证**

成功响应：
```json
{
  "code": 200,
  "data": {
    "id": "blockchain",
    "name": "区块链技术",
    "description": "区块链技术基础与应用",
    "category": "计算机",
    "icon": "",
    "is_active": true
  },
  "message": "success"
}
```

### 4.3 创建科目

```
POST /api/v1/subjects
```

**需 Admin JWT + `subject:manage` 权限**

> 科目是顶级实体，创建科目不需要科目授权（创建时科目尚未存在）

请求体：
```json
{
  "id": "blockchain",
  "name": "区块链技术",
  "description": "区块链技术基础与应用",
  "category": "计算机",
  "icon": ""
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 科目唯一标识，最长 50 字符 |
| name | string | 是 | 科目名称，最长 200 字符 |
| description | string | 否 | 科目描述 |
| category | string | 否 | 分类，最长 100 字符 |
| icon | string | 否 | 图标 URL |

成功响应：
```json
{
  "code": 200,
  "data": {
    "id": "blockchain",
    "name": "区块链技术",
    "description": "区块链技术基础与应用",
    "category": "计算机",
    "is_active": true
  },
  "message": "success"
}
```

失败（ID重复）：
```json
{
  "code": 409,
  "data": null,
  "message": "Subject ID already exists"
}
```

### 4.4 更新科目

```
PUT /api/v1/subjects/{subject_id}
```

**需 Admin JWT + `subject:manage` 权限**

> 科目管理是全局操作，拥有权限即可操作任意科目

请求体（部分更新，只传需要修改的字段）：
```json
{
  "name": "区块链技术（更新版）",
  "description": "新描述",
  "is_active": true
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 科目名称 |
| description | string | 否 | 描述 |
| category | string | 否 | 分类 |
| is_active | boolean | 否 | 是否激活，默认 true |

成功响应：同科目详情格式

### 4.5 删除科目

```
DELETE /api/v1/subjects/{subject_id}
```

**需 Admin JWT + `subject:manage` 权限**

> 科目管理是全局操作，拥有权限即可操作任意科目

成功响应：
```json
{
  "code": 200,
  "data": null,
  "message": "deleted"
}
```

> 如果科目下有题目，则无法删除，返回 409

---

## 5. 题型管理

### 5.1 获取题型列表

```
GET /api/v1/subjects/{subject_id}/question-types
```

**无需认证**

成功响应：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "subject_id": "blockchain",
      "name": "choice",
      "display_name": "单选题",
      "has_options": true,
      "has_sub_questions": false,
      "scoring_type": "auto",
      "default_score": 1.0,
      "sort_order": 1
    },
    {
      "id": 2,
      "subject_id": "blockchain",
      "name": "multi_choice",
      "display_name": "多选题",
      "has_options": true,
      "has_sub_questions": false,
      "scoring_type": "auto",
      "default_score": 2.0,
      "sort_order": 2
    },
    {
      "id": 3,
      "subject_id": "blockchain",
      "name": "judgment",
      "display_name": "判断题",
      "has_options": false,
      "has_sub_questions": false,
      "scoring_type": "auto",
      "default_score": 1.0,
      "sort_order": 3
    }
  ],
  "message": "success"
}
```

### 5.2 创建题型

```
POST /api/v1/admin/question-types
```

**需 Admin JWT + `question_type:manage` 权限 + 对应科目授权**

请求体：
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

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subject_id | string | 是 | 所属科目 ID |
| name | string | 是 | 题型标识名（choice/multi_choice/judgment/fill_blank/material） |
| display_name | string | 是 | 显示名称（单选题/多选题/判断题/填空题/材料题） |
| has_options | boolean | 否 | 是否有选项（选择题为 true），默认 false |
| has_sub_questions | boolean | 否 | 是否有子问题（材料题为 true），默认 false |
| scoring_type | string | 否 | 评分类型（auto 自动/mixed 混合），默认 auto |
| default_score | float | 否 | 默认分值，默认 1.0 |
| sort_order | int | 否 | 排序序号，默认 0 |

### 5.3 更新题型

```
PUT /api/v1/admin/question-types/{type_id}
```

**需 Admin JWT + `question_type:manage` 权限 + 题型所属科目授权**

> 权限检查：先查询题型获取 subject_id，再校验科目级权限

请求体（部分更新）：
```json
{
  "display_name": "单选题（修改版）",
  "default_score": 2.0
}
```

### 5.4 删除题型

```
DELETE /api/v1/admin/question-types/{type_id}
```

**需 Admin JWT + `question_type:manage` 权限 + 题型所属科目授权**

> 权限检查：先查询题型获取 subject_id，再校验科目级权限
> 如果题型下有题目，则无法删除

---

## 6. 题目管理

### 6.1 获取题目列表（管理端）

```
GET /api/v1/admin/subjects/{subject_id}/questions?page=1&pageSize=20&type_id={type_id}&difficulty={level}&category={category}&keyword={keyword}
```

**需 Admin JWT + `question:manage` 权限 + 科目授权**

> 管理员可分页查看科目下的题目列表，带答案用于管理

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subject_id | string | 是 | 科目 ID（路径参数） |
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 20，最大 100 |
| type_id | int | 否 | 按题型 ID 过滤 |
| difficulty | string | 否 | 按难度过滤（easy/medium/hard） |
| category | string | 否 | 按分类过滤 |
| keyword | string | 否 | 按题干关键词搜索（模糊匹配） |

成功响应：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "type": {"name": "choice", "display_name": "单选题"},
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

| 字段 | 说明 |
|------|------|
| total | DB 实际总数（非当前页条数） |
| answer | 管理端返回答案，用于编辑查看 |

### 6.2 获取题目统计

```
GET /api/v1/subjects/{subject_id}/questions/stats
```

**无需认证**

### 6.3 创建单道题目

```
POST /api/v1/admin/questions
```

**需 Admin JWT + `question:manage` 权限 + 对应科目授权**

请求体：
```json
{
  "subject_id": "blockchain",
  "type_id": 1,
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
  "difficulty": "medium",
  "score": 1.0,
  "category": "职业素养",
  "tags": ["职业素养", "合作精神"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subject_id | string | 是 | 所属科目 ID |
| type_id | int | 是 | 题型 ID（从题型列表获取） |
| parent_id | int | 否 | 父题目 ID（材料题的子题目需填） |
| title | string | 是 | 题干 |
| content | object | 否 | 题目内容（选项、题干细节等 JSON） |
| answer | string | 否 | 正确答案 |
| explanation | string | 否 | 解析说明 |
| difficulty | string | 否 | 难度：easy/medium/hard，默认 medium |
| score | float | 否 | 分值，默认 1.0 |
| category | string | 否 | 分类标签 |
| tags | array | 否 | 标签数组 |
| sort_order | int | 否 | 排序序号 |

### 6.4 更新题目

```
PUT /api/v1/admin/questions/{question_id}
```

**需 Admin JWT + `question:manage` 权限 + 题目所属科目授权**

> 权限检查：先查询题目获取 subject_id，再校验科目级权限

请求体（部分更新）：
```json
{
  "title": "修改后的题干",
  "answer": "A",
  "explanation": "修改后的解析",
  "difficulty": "hard"
}
```

### 6.5 删除题目

```
DELETE /api/v1/admin/questions/{question_id}
```

**需 Admin JWT + `question:manage` 权限 + 题目所属科目授权**

> 权限检查：先查询题目获取 subject_id，再校验科目级权限

### 6.6 批量导入题目

```
POST /api/v1/admin/questions/batch
```

**需 Admin JWT + `question:manage` 权限 + 科目授权**

> 安全限制：批量中的所有题目必须属于同一个 `subject_id`，否则返回 400

请求体：
```json
[
  {
    "subject_id": "blockchain",
    "type_id": 1,
    "title": "题目一",
    "content": {"options": [{"key": "A", "text": "选项A"}]},
    "answer": "A"
  },
  {
    "subject_id": "blockchain",
    "type_id": 1,
    "title": "题目二",
    "content": {"options": [{"key": "A", "text": "选项A"}]},
    "answer": "A"
  }
]
```

## 7. 学习资料管理

### 7.1 获取资料列表

```
GET /api/v1/subjects/{subject_id}/materials?page=1&pageSize=20&type={type}
```

**需 User JWT + 用户科目授权**

> 该接口为用户侧读取接口，管理端通常用于对照查看资料展示效果

### 7.2 创建资料

```
POST /api/v1/admin/materials
```

**需 Admin JWT + `material:manage` 权限 + 科目授权**

请求体：
```json
{
  "subject_id": "blockchain",
  "type": "guide",
  "title": "区块链实操指南",
  "content": "资料正文内容",
  "meta": {"author": "admin"},
  "summary": "摘要信息",
  "tags": ["区块链", "实操"],
  "sort_order": 1
}
```

### 7.3 更新资料

```
PUT /api/v1/admin/materials/{material_id}
```

**需 Admin JWT + `material:manage` 权限 + 资料所属科目授权**

> 权限检查：先查询资料获取 `subject_id`，再校验科目级权限

### 7.4 删除资料

```
DELETE /api/v1/admin/materials/{material_id}
```

**需 Admin JWT + `material:manage` 权限 + 资料所属科目授权**

---

## 8. 考试配置管理

### 8.1 获取考试配置列表

```
GET /api/v1/subjects/{subject_id}/exams
```

**需 User JWT + 用户科目授权**

> 该接口为用户侧考试配置列表，管理端通常用于核对前台展示

### 8.2 获取考试配置详情

```
GET /api/v1/exams/{exam_id}
```

**需 User JWT + 用户科目授权**

> 用户侧仅返回考试基础信息，不暴露 `question_rules` / `scoring_rules`

### 8.3 创建考试配置

```
POST /api/v1/admin/exams
```

**需 Admin JWT + `exam:manage` 权限 + 科目授权**

请求体：
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
    "choice": 1,
    "judgment": 1
  },
  "is_active": true
}
```

### 8.4 更新考试配置

```
PUT /api/v1/admin/exams/{exam_id}
```

**需 Admin JWT + `exam:manage` 权限 + 考试所属科目授权**

### 8.5 删除考试配置（软删除）

```
DELETE /api/v1/admin/exams/{exam_id}
```

**需 Admin JWT + `exam:manage` 权限 + 考试所属科目授权**

> 软删除：将 `is_active` 设为 false，保留历史成绩和错题数据
> 若存在进行中的会话，则禁止删除

---

## 9. 考试会话管理（管理员）

### 9.1 查看考试会话列表

```
GET /api/v1/admin/exams/{exam_id}/sessions?page=1&pageSize=20
```

**需 Admin JWT + `exam:manage` 权限 + 科目授权**

成功响应：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": "abc123",
        "user_name": "张三",
        "user_email": "zhangsan@example.com",
        "status": "completed",
        "started_at": "2026-04-21T10:00:00",
        "expires_at": "2026-04-21T12:00:00",
        "completed_at": "2026-04-21T11:45:00"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20
  },
  "message": "success"
}
```

### 9.2 查看考试会话详情

```
GET /api/v1/admin/exams/sessions/{session_id}
```

**需 Admin JWT + `exam:manage` 权限 + 科目授权**

> 返回会话详情，包括用户信息、考试名称、抽题结果 `selected_questions`

---

## 10. 成绩统计（管理员）

### 10.1 科目成绩统计

```
GET /api/v1/admin/scores/stats?subjectId={subject_id}
```

**需 Admin JWT + `score:view` 权限 + query.subjectId 科目授权**

### 10.2 成绩列表（分页）

```
GET /api/v1/admin/scores/list?subjectId={subject_id}&page=1&pageSize=20
```

**需 Admin JWT + `score:view` 权限 + query.subjectId 科目授权**

成功响应：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": "abc123",
        "user_name": "张三",
        "user_email": "zhangsan@example.com",
        "attempt_number": 1,
        "total_score": 86,
        "submitted_at": "2026-04-21T11:45:00"
      }
    ],
    "total": 120,
    "page": 1,
    "page_size": 20
  },
  "message": "success"
}
```

### 10.3 用户管理扩展

#### 重置用户密码

```
PUT /api/v1/admin/users/{user_id}/reset-password
```

**需 Admin JWT + `admin:manage` 权限**

### 10.4 RBAC 管理

#### 初始化 RBAC

```
POST /api/v1/admin/rbac/init
```

**需 Admin JWT + `admin:manage` 权限**

#### 权限管理

- `GET /api/v1/admin/rbac/permissions`
- `POST /api/v1/admin/rbac/permissions`
- `PUT /api/v1/admin/rbac/permissions/{permission_id}`
- `DELETE /api/v1/admin/rbac/permissions/{permission_id}`

#### 角色管理

- `GET /api/v1/admin/rbac/roles`
- `GET /api/v1/admin/rbac/roles/{role_id}`
- `POST /api/v1/admin/rbac/roles`
- `PUT /api/v1/admin/rbac/roles/{role_id}`
- `DELETE /api/v1/admin/rbac/roles/{role_id}`
- `POST /api/v1/admin/rbac/roles/permissions`
- `GET /api/v1/admin/rbac/roles/{role_code}/permissions`
- `POST /api/v1/admin/rbac/roles/menus`
- `GET /api/v1/admin/rbac/roles/{role_code}/menus`

#### 菜单管理

- `GET /api/v1/admin/rbac/menus`
- `POST /api/v1/admin/rbac/menus`
- `PUT /api/v1/admin/rbac/menus/{menu_id}`
- `DELETE /api/v1/admin/rbac/menus/{menu_id}`

> 菜单字段支持：`route_key`、`i18n_key`、`hide_in_menu`、`href`
> `route_key` 必须唯一，并与前端路由 key 对齐

#### 管理员与授权关系管理

- `GET /api/v1/admin/rbac/admins`
- `PUT /api/v1/admin/rbac/admins/{admin_id}/role`
- `GET /api/v1/admin/rbac/admins/{admin_id}/menus`
- `GET /api/v1/admin/rbac/admins/{admin_id}/subjects`
- `POST /api/v1/admin/rbac/subject-admins`
- `DELETE /api/v1/admin/rbac/subject-admins`
- `POST /api/v1/admin/rbac/user-subjects`
- `DELETE /api/v1/admin/rbac/user-subjects`
- `GET /api/v1/admin/rbac/user-subjects/{user_id}`
- `GET /api/v1/admin/rbac/user-subjects/subject/{subject_id}`

> 说明：RBAC 读接口并非全部要求 `admin:manage`，部分只需 Admin JWT，具体以接口实际说明为准

---

## 11. 知识点管理

### 11.1 获取知识点树

```
GET /api/v1/admin/knowledge-points/subjects/{subject_id}
```

**需 Admin JWT**

### 11.2 创建知识点

```
POST /api/v1/admin/knowledge-points
```

**需 Admin JWT + `question:manage` 权限 + 科目授权**

请求体：
```json
{
  "subject_id": "blockchain",
  "parent_id": null,
  "name": "区块链基础",
  "description": "区块链基础知识",
  "sort_order": 1
}
```

### 11.3 更新知识点

```
PUT /api/v1/admin/knowledge-points/{kp_id}
```

**需 Admin JWT + `question:manage` 权限 + 科目授权**

### 11.4 删除知识点

```
DELETE /api/v1/admin/knowledge-points/{kp_id}
```

**需 Admin JWT + `question:manage` 权限 + 科目授权**

> 如果有子知识点或关联题目，则无法删除

### 11.5 为题目分配知识点

```
POST /api/v1/admin/knowledge-points/assign
```

**需 Admin JWT + `question:manage` 权限 + 科目授权**

请求体：
```json
{
  "question_id": 1,
  "knowledge_point_ids": [1, 2, 3],
  "primary_id": 1
}
```

### 11.6 获取题目关联的知识点

```
GET /api/v1/admin/knowledge-points/questions/{question_id}
```

**需 Admin JWT**

---

## 12. 附录

### 12.1 重置用户密码

```
PUT /api/v1/admin/users/{user_id}/reset-password
```

**需 Admin JWT + `admin:manage` 权限**


## 权限检查汇总

| 端点 | 权限 code | 科目级检查 |
|------|-----------|-----------|
| `POST /admin/auth/login` | 无需权限 | 否 |
| `POST /admin/auth/register` | admin:manage | 否 |
| `GET /admin/auth/me` | Admin JWT | 否 |
| `PUT /admin/auth/me` | Admin JWT | 否 |
| `PUT /admin/auth/password` | Admin JWT | 否 |
| `GET /admin/auth/menus` | Admin JWT | 否 |
| `GET /admin/dashboard` | dashboard:view | 否 |
| `GET /admin/users` | score:view | 否 |
| `GET /admin/users/{id}` | score:view | 否 |
| `PUT /admin/users/{id}/activate` | admin:manage | 否 |
| `DELETE /admin/users/{id}` | admin:manage | 否 |
| `PUT /admin/users/{id}/reset-password` | admin:manage | 否 |
| `POST /subjects` | subject:manage | 否（全局权限） |
| `PUT /subjects/{id}` | subject:manage | 否（全局权限） |
| `DELETE /subjects/{id}` | subject:manage | 否（全局权限） |
| `GET /admin/subjects/{id}/questions` | question:manage | path.subject_id |
| `POST /admin/question-types` | question_type:manage | body.subject_id |
| `PUT /admin/question-types/{id}` | question_type:manage | 查实体→subject_id |
| `DELETE /admin/question-types/{id}` | question_type:manage | 查实体→subject_id |
| `POST /admin/questions` | question:manage | body.subject_id |
| `PUT /admin/questions/{id}` | question:manage | 查实体→subject_id |
| `DELETE /admin/questions/{id}` | question:manage | 查实体→subject_id |
| `POST /admin/questions/batch` | question:manage | body[0].subject_id |
| `POST /admin/materials` | material:manage | body.subject_id |
| `PUT /admin/materials/{id}` | material:manage | 查实体→subject_id |
| `DELETE /admin/materials/{id}` | material:manage | 查实体→subject_id |
| `POST /admin/exams` | exam:manage | body.subject_id |
| `PUT /admin/exams/{id}` | exam:manage | 查实体→subject_id |
| `DELETE /admin/exams/{id}` | exam:manage | 查实体→subject_id |
| `GET /admin/exams/{id}/sessions` | exam:manage | 查实体→subject_id |
| `GET /admin/exams/sessions/{id}` | exam:manage | 查实体→subject_id |
| `GET /admin/scores/stats` | score:view | query.subjectId |
| `GET /admin/scores/list` | score:view | query.subjectId |
| 知识点管理接口 | question:manage | 查实体→subject_id |
| RBAC 管理写接口 | admin:manage | 否 |
| RBAC 部分读接口 | Admin JWT / 见接口说明 | 视接口而定 |

---

## 错误码汇总

| code | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 参数错误 / 业务逻辑错误 |
| 401 | 未登录 / 登录失败 |
| 403 | 权限不足（缺少权限 code / 无科目授权 / Admin JWT 访问 User 端点） |
| 404 | 资源不存在 |
| 409 | 冲突（ID 已存在 / 删除有关联数据） |
| 429 | 请求过于频繁（触发 Rate Limit） |
| 500 | 服务器内部错误 |

---

## Rate Limiting（接口限流）

系统对敏感接口实施限流保护，基于 IP 地址 + Redis 计数：

| 端点 | 限制 | 时间窗口 |
|------|------|---------|
| `/auth/login` | 10 次 | 60 秒 |
| `/auth/register` | 5 次 | 60 秒 |
| `/admin/auth/login` | 10 次 | 60 秒 |
| `/admin/auth/register` | 3 次 | 60 秒 |
| `/exams/session/*` | 20 次 | 60 秒 |
| 其他端点 | 100 次 | 60 秒 |

**排除限流的端点**：`/health`、`/ping`、`/docs`、`/openapi.json`

**触发限流响应**：
```json
{
  "code": 429,
  "data": null,
  "message": "Rate limit exceeded. Max 10 requests per 60 seconds."
}
```

> 若未配置 Redis（REDIS_URL 为空），则回退为本地内存限流（非禁用）
