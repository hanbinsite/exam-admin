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

**需 Admin JWT**

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
GET /api/v1/admin/users?page=1&pageSize=20
```

**需 Admin JWT + `score:view` 权限**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 20，最大 100 |

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

**需 Admin JWT + `subject:manage` 权限 + 对应科目授权**

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

**需 Admin JWT + `subject:manage` 权限 + 对应科目授权**

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

**需 Admin JWT + `subject:manage` 权限 + 对应科目授权**

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

### 6.1 获取题目统计

```
GET /api/v1/subjects/{subject_id}/questions/stats
```

**无需认证**

成功响应：
```json
{
  "code": 200,
  "data": {
    "by_type": {
      "choice": 174,
      "multi_choice": 10,
      "judgment": 36,
      "fill_blank": 0,
      "material": 2
    },
    "by_difficulty": {
      "easy": 50,
      "medium": 130,
      "hard": 30
    }
  },
  "message": "success"
}
```

### 6.2 创建单道题目

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

### 6.3 更新题目

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

### 6.4 删除题目

```
DELETE /api/v1/admin/questions/{question_id}
```

**需 Admin JWT + `question:manage` 权限 + 题目所属科目授权**

> 权限检查：先查询题目获取 subject_id，再校验科目级权限

### 6.5 批量导入题目

```
POST /api/v1/admin/questions/batch
```

**需 Admin JWT + `question:manage` 权限 + 对应科目授权**

> 请求体为 `QuestionCreate` 对象数组（Pydantic 验证），非 raw dict

请求体（JSON 数组）：
```json
[
  {
    "subject_id": "blockchain",
    "type_id": 1,
    "title": "题目1",
    "answer": "A",
    "difficulty": "medium",
    "score": 1.0,
    "content": {"options": [{"key": "A", "text": "选项1"}, {"key": "B", "text": "选项2"}]}
  },
  {
    "subject_id": "blockchain",
    "type_id": 3,
    "title": "题目2",
    "answer": "对",
    "difficulty": "easy",
    "score": 1.0
  }
]
```

> 权限检查：取第一条数据的 subject_id 进行科目级权限校验

成功响应：
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

## 7. 学习资料管理

### 7.1 获取资料列表

```
GET /api/v1/subjects/{subject_id}/materials?type={type}
```

**需 User JWT**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subject_id | string | 是 | 科目 ID（路径参数） |
| type | string | 否 | 资料类型过滤：guide/practice_task/case_analysis |

成功响应：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "subject_id": "blockchain",
      "type": "guide",
      "title": "搭建以太坊开发环境",
      "content": "本实操将引导你完成以太坊开发环境的搭建...",
      "meta": null,
      "summary": "环境搭建指南",
      "tags": ["以太坊", "开发环境"],
      "sort_order": 1
    }
  ],
  "message": "success"
}
```

### 7.2 获取资料详情

```
GET /api/v1/materials/{material_id}
```

**需 User JWT**

### 7.3 创建学习资料

```
POST /api/v1/admin/materials
```

**需 Admin JWT + `material:manage` 权限 + 对应科目授权**

请求体：
```json
{
  "subject_id": "blockchain",
  "type": "guide",
  "title": "搭建以太坊开发环境",
  "content": "本实操将引导你完成...",
  "summary": "环境搭建指南",
  "tags": ["以太坊", "开发环境"],
  "sort_order": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subject_id | string | 是 | 科目 ID |
| type | string | 是 | 资料类型：guide(实操指南)/practice_task(实操任务)/case_analysis(案例分析) |
| title | string | 是 | 标题，最长 200 字符 |
| content | string | 是 | 正文内容 |
| meta | object | 否 | 元数据 JSON（如步骤列表、预期输出等） |
| summary | string | 否 | 摘要 |
| tags | array | 否 | 标签数组 |
| sort_order | int | 否 | 排序序号 |

### 7.4 更新学习资料

```
PUT /api/v1/admin/materials/{material_id}
```

**需 Admin JWT + `material:manage` 权限 + 资料所属科目授权**

> 权限检查：先查询资料获取 subject_id，再校验科目级权限

请求体（部分更新）：
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "summary": "更新后的摘要"
}
```

### 7.5 删除学习资料

```
DELETE /api/v1/admin/materials/{material_id}
```

**需 Admin JWT + `material:manage` 权限 + 资料所属科目授权**

> 权限检查：先查询资料获取 subject_id，再校验科目级权限

---

## 8. 考试配置管理

### 8.1 获取考试配置列表

```
GET /api/v1/subjects/{subject_id}/exams
```

**需 User JWT**

成功响应：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "区块链期末考试",
      "description": "期末考试",
      "duration": 120,
      "is_active": true
    }
  ],
  "message": "success"
}
```

### 8.2 获取考试配置详情

```
GET /api/v1/exams/{exam_id}
```

**需 User JWT**

成功响应：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "subject_id": "blockchain",
    "name": "区块链期末考试",
    "description": "期末考试",
    "duration": 120,
    "question_rules": {
      "1": {"count": 50, "random": true}
    },
    "scoring_rules": {
      "choice": 1,
      "judgment": 1
    },
    "is_active": true
  },
  "message": "success"
}
```

> `question_rules` 中的 key 是题型 ID，value 包含 `count`(抽取数量)、`random`(是否随机)、`fixed_ids`(固定题目 ID 数组)

### 8.3 创建考试配置

```
POST /api/v1/admin/exams
```

**需 Admin JWT + `exam:manage` 权限 + 对应科目授权**

请求体：
```json
{
  "subject_id": "blockchain",
  "name": "区块链期末考试",
  "description": "期末综合考试",
  "duration": 120,
  "question_rules": {
    "1": {"count": 50, "random": true},
    "3": {"count": 20, "random": true},
    "5": {"count": 2, "fixed_ids": [101, 102]}
  },
  "scoring_rules": {
    "choice": 1,
    "judgment": 1,
    "material": 5
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subject_id | string | 是 | 科目 ID |
| name | string | 是 | 考试名称，最长 200 字符 |
| description | string | 否 | 考试说明 |
| duration | int | 否 | 考试时长（分钟），默认 120 |
| question_rules | object | 是 | 抽题规则 JSON，key 为题型 ID |
| scoring_rules | object | 是 | 评分规则 JSON |

### 8.4 更新考试配置

```
PUT /api/v1/admin/exams/{exam_id}
```

**需 Admin JWT + `exam:manage` 权限 + 考试所属科目授权**

> 权限检查：先查询考试配置获取 subject_id，再校验科目级权限

请求体（部分更新）：
```json
{
  "name": "更新后的考试名称",
  "duration": 90,
  "is_active": true,
  "description": "更新后的说明"
}
```

---

## 9. 成绩统计（管理员）

### 9.1 科目成绩统计

```
GET /api/v1/admin/scores/stats?subjectId={subject_id}
```

**需 Admin JWT + `score:view` 权限**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subjectId | string | 是 | 科目 ID |

成功响应：
```json
{
  "code": 200,
  "data": {
    "average_score": 72.5,
    "max_score": 95.0,
    "min_score": 30.0,
    "total_submissions": 150,
    "score_distribution": {
      "0-20": 5,
      "20-40": 15,
      "40-60": 30,
      "60-80": 60,
      "80-100": 40
    }
  },
  "message": "success"
}
```

| 字段 | 说明 |
|------|------|
| average_score | 平均分 |
| max_score | 最高分 |
| min_score | 最低分 |
| total_submissions | 提交总数 |
| score_distribution | 分数段分布（单条 SQL CASE WHEN 聚合） |

### 9.2 成绩列表（分页）

```
GET /api/v1/admin/scores/list?subjectId={subject_id}&page=1&pageSize=20
```

**需 Admin JWT + `score:view` 权限**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subjectId | string | 是 | 科目 ID |
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 20 |

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
        "total_score": 77.8,
        "submitted_at": "2026-04-21T12:00:00"
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
| user_name | 学生姓名（关联 User 表） |
| user_email | 学生邮箱（关联 User 表） |
| total | DB 实际总数（非当前页条数），支持正确分页 |

---

## 10. RBAC 权限管理

### 10.1 初始化 RBAC

```
POST /api/v1/admin/rbac/init
```

**需 Admin JWT + `admin:manage` 权限**

> 首次部署或清库后必须调用，初始化 9 个权限 + 3 个角色 + 角色权限映射

成功响应：
```json
{
  "code": 200,
  "data": {
    "permissions_created": 9,
    "roles_created": 3
  },
  "message": "RBAC initialized"
}
```

### 10.2 权限管理

#### 获取权限列表

```
GET /api/v1/admin/rbac/permissions
```

**需 Admin JWT**

成功响应：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "code": "subject:manage",
      "name": "科目管理",
      "description": "创建/编辑/删除科目"
    }
  ],
  "message": "success"
}
```

#### 创建权限

```
POST /api/v1/admin/rbac/permissions
```

**需 Admin JWT + `admin:manage` 权限**

请求体：
```json
{
  "code": "report:export",
  "name": "报表导出",
  "description": "导出成绩报表"
}
```

#### 更新权限

```
PUT /api/v1/admin/rbac/permissions/{permission_id}
```

**需 Admin JWT + `admin:manage` 权限**

请求体（部分更新）：
```json
{
  "name": "报表导出（修改版）",
  "description": "导出成绩报表和统计报表"
}
```

#### 删除权限

```
DELETE /api/v1/admin/rbac/permissions/{permission_id}
```

**需 Admin JWT + `admin:manage` 权限**

### 10.3 角色管理

#### 获取角色列表

```
GET /api/v1/admin/rbac/roles?includeInactive=true
```

**需 Admin JWT**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| includeInactive | boolean | 否 | 是否包含已禁用角色 |

成功响应：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "code": "super_admin",
      "name": "超级管理员",
      "is_super": true,
      "is_active": true,
      "sort_order": 0
    },
    {
      "id": 2,
      "code": "admin",
      "name": "管理员",
      "is_super": false,
      "is_active": true,
      "sort_order": 1
    }
  ],
  "message": "success"
}
```

#### 获取角色详情

```
GET /api/v1/admin/rbac/roles/{role_id}
```

**需 Admin JWT**

成功响应：
```json
{
  "code": 200,
  "data": {
    "id": 2,
    "code": "admin",
    "name": "管理员",
    "is_super": false,
    "is_active": true,
    "permissions": [
      {"code": "subject:manage", "name": "科目管理"},
      {"code": "question:manage", "name": "题目管理"}
    ]
  },
  "message": "success"
}
```

#### 创建角色

```
POST /api/v1/admin/rbac/roles
```

**需 Admin JWT + `admin:manage` 权限**

请求体：
```json
{
  "name": "班主任",
  "code": "class_master",
  "description": "班级管理者",
  "is_super": false,
  "sort_order": 3
}
```

#### 更新角色

```
PUT /api/v1/admin/rbac/roles/{role_id}
```

**需 Admin JWT + `admin:manage` 权限**

请求体（部分更新）：
```json
{
  "name": "班主任（修改版）",
  "is_active": true,
  "sort_order": 4
}
```

#### 删除角色

```
DELETE /api/v1/admin/rbac/roles/{role_id}
```

**需 Admin JWT + `admin:manage` 权限**

> super_admin 角色不可删除

#### 获取角色权限

```
GET /api/v1/admin/rbac/roles/{role_code}/permissions
```

**需 Admin JWT**

> super_admin 角色自动返回所有权限，无需分配

#### 分配角色权限

```
POST /api/v1/admin/rbac/roles/permissions
```

**需 Admin JWT + `admin:manage` 权限**

请求体：
```json
{
  "role_code": "admin",
  "permission_codes": ["subject:manage", "question:manage", "question_type:manage"]
}
```

> 此操作会替换该角色的所有现有权限（全量覆盖）

### 10.4 菜单管理

#### 获取菜单树

```
GET /api/v1/admin/rbac/menus
```

**需 Admin JWT**

成功响应：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "parent_id": null,
      "name": "题库管理",
      "path": "/questions",
      "icon": "icon-question",
      "component": "questions/index",
      "permission_code": "question:manage",
      "sort_order": 1,
      "children": []
    }
  ],
  "message": "success"
}
```

#### 创建菜单

```
POST /api/v1/admin/rbac/menus
```

**需 Admin JWT + `admin:manage` 权限**

请求体：
```json
{
  "parent_id": null,
  "name": "题库管理",
  "path": "/questions",
  "icon": "icon-question",
  "component": "questions/index",
  "permission_code": "question:manage",
  "sort_order": 1
}
```

#### 更新菜单

```
PUT /api/v1/admin/rbac/menus/{menu_id}
```

**需 Admin JWT + `admin:manage` 权限**

#### 删除菜单

```
DELETE /api/v1/admin/rbac/menus/{menu_id}
```

**需 Admin JWT + `admin:manage` 权限**

#### 获取角色菜单

```
GET /api/v1/admin/rbac/roles/{role_code}/menus
```

**需 Admin JWT**

#### 分配角色菜单

```
POST /api/v1/admin/rbac/roles/menus
```

**需 Admin JWT + `admin:manage` 权限**

请求体：
```json
{
  "role_code": "admin",
  "menu_ids": [1, 2, 3, 4, 5]
}
```

> 此操作会替换该角色的所有现有菜单（全量覆盖）

### 10.5 管理员角色分配

#### 获取管理员列表

```
GET /api/v1/admin/rbac/admins
```

**需 Admin JWT**

成功响应：
```json
{
  "code": 200,
  "data": [
    {
      "id": "admin_default",
      "name": "Default Admin",
      "email": "admin@exam.com",
      "role": {
        "code": "super_admin",
        "name": "超级管理员",
        "is_super": true
      },
      "subjects": ["blockchain", "python"]
    }
  ],
  "message": "success"
}
```

#### 修改管理员角色

```
PUT /api/v1/admin/rbac/admins/{admin_id}/role
```

**需 Admin JWT + `admin:manage` 权限**

请求体：
```json
{
  "role_code": "teacher"
}
```

#### 获取管理员菜单

```
GET /api/v1/admin/rbac/admins/{admin_id}/menus
```

**需 Admin JWT**

> 返回该管理员角色对应的菜单树，super_admin 返回完整菜单树

#### 获取管理员授权科目

```
GET /api/v1/admin/rbac/admins/{admin_id}/subjects
```

**需 Admin JWT**

成功响应：
```json
{
  "code": 200,
  "data": ["blockchain", "python"],
  "message": "success"
}
```

### 10.6 科目授权（SubjectAdmin）

#### 分配管理员科目

```
POST /api/v1/admin/rbac/subject-admins
```

**需 Admin JWT + `admin:manage` 权限**

请求体：
```json
{
  "admin_id": "admin_002",
  "subject_id": "blockchain"
}
```

成功响应：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "admin_id": "admin_002",
    "subject_id": "blockchain"
  },
  "message": "success"
}
```

#### 取消管理员科目授权

```
DELETE /api/v1/admin/rbac/subject-admins?adminId={admin_id}&subjectId={subject_id}
```

**需 Admin JWT + `admin:manage` 权限**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| adminId | string | 是 | 管理员 ID |
| subjectId | string | 是 | 科目 ID |

### 10.7 用户科目授权（UserSubject）

#### 获取用户已授权科目

```
GET /api/v1/admin/rbac/user-subjects/{user_id}
```

**需 Admin JWT**

成功响应：
```json
{
  "code": 200,
  "data": ["blockchain", "python"],
  "message": "success"
}
```

#### 获取科目下已授权用户

```
GET /api/v1/admin/rbac/user-subjects/subject/{subject_id}
```

**需 Admin JWT**

成功响应：
```json
{
  "code": 200,
  "data": ["user_001", "user_002", "user_003"],
  "message": "success"
}
```

#### 分配用户科目

```
POST /api/v1/admin/rbac/user-subjects
```

**需 Admin JWT + `admin:manage` 权限**

请求体：
```json
{
  "user_id": "user_001",
  "subject_id": "blockchain"
}
```

#### 取消用户科目授权

```
DELETE /api/v1/admin/rbac/user-subjects?userId={user_id}&subjectId={subject_id}
```

**需 Admin JWT + `admin:manage` 权限**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户 ID |
| subjectId | string | 是 | 科目 ID |

---

## 11. 健康检查

### 11.1 健康检查

```
GET /api/v1/health
```

**无需认证**

响应：
```json
{
  "code": 200,
  "data": {
    "status": "ok",
    "db": "connected",
    "redis": "connected"
  },
  "message": "ok"
}
```

### 11.2 Ping（轻量级）

```
GET /api/v1/ping
```

**无需认证**

响应：
```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected"
}
```

> 返回裸 JSON（无 code/data/message 包装），适合 UptimeRobot HEAD 请求

---

## 权限检查汇总

| 端点 | 权限 code | 科目级检查 |
|------|-----------|-----------|
| `GET /admin/dashboard` | dashboard:view | 否 |
| `GET /admin/users` | score:view | 否 |
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
| `GET /admin/scores/stats` | score:view | 否 |
| `GET /admin/scores/list` | score:view | 否 |
| RBAC 全部管理接口 | admin:manage | 否 |

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
| 500 | 服务器内部错误 |
