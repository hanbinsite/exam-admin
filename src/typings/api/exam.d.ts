declare namespace Exam {
  namespace Service {
    interface Response<T = unknown> {
      code: number;
      data: T;
      message: string;
    }
  }

  namespace Auth {
    interface AdminInfo {
      id: string;
      name: string;
      email: string;
      role: string;
    }

    interface AdminProfile {
      id: string;
      name: string;
      email: string;
      role: string;
      role_info: {
        code: string;
        name: string;
        is_super: boolean;
      };
    }

    interface LoginToken {
      token: string;
      admin: AdminInfo;
    }

    interface LoginRequest {
      email: string;
      password: string;
    }

    interface RegisterRequest {
      name: string;
      email: string;
      password: string;
    }

    interface MenuMeta {
      title: string;
      i18nKey?: string | null;
      icon?: string;
      order?: number;
      hideInMenu?: boolean;
      href?: string;
    }

    interface MenuItem {
      name: string;
      path: string;
      meta: MenuMeta;
      children?: MenuItem[];
    }

    interface AuthMenusResponse {
      routes: MenuItem[];
      home: string;
    }
  }

  namespace Dashboard {
    interface DashboardData {
      total_users: number;
      total_submissions: number;
      active_subjects: number;
    }
  }

  namespace Subject {
    interface SubjectStats {
      totalQuestions: number;
      totalMaterials: number;
      totalExams: number;
    }

    interface Subject {
      id: string;
      name: string;
      description: string;
      category: string;
      icon: string;
      is_active: boolean;
      stats?: SubjectStats;
    }

    interface SubjectCreateRequest {
      id: string;
      name: string;
      description?: string;
      category?: string;
      icon?: string;
    }

    interface SubjectUpdateRequest {
      name?: string;
      description?: string;
      category?: string;
      icon?: string;
      is_active?: boolean;
    }
  }

  namespace QuestionType {
    interface QuestionType {
      id: number;
      subject_id: string;
      name: string;
      display_name: string;
      has_options: boolean;
      has_sub_questions: boolean;
      scoring_type: 'auto' | 'mixed';
      default_score: number;
      sort_order: number;
    }

    interface QuestionTypeCreateRequest {
      subject_id: string;
      name: string;
      display_name: string;
      has_options?: boolean;
      has_sub_questions?: boolean;
      scoring_type?: 'auto' | 'mixed';
      default_score?: number;
      sort_order?: number;
    }
  }

  namespace Question {
    interface QuestionListItem {
      id: number;
      type: { name: string; display_name: string };
      category?: string;
      difficulty: 'easy' | 'medium' | 'hard';
      title: string;
      score: number;
      answer: string;
      sort_order?: number;
    }

    interface QuestionListData {
      items: QuestionListItem[];
      total: number;
      page: number;
      page_size: number;
    }

    interface QuestionListParams {
      page?: number;
      pageSize?: number;
      type_id?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
      category?: string;
      keyword?: string;
    }

    interface Question {
      id: number;
      subject_id: string;
      type_id: number;
      parent_id?: number;
      title: string;
      content?: {
        options?: { key: string; text: string }[];
      };
      answer: string;
      explanation?: string;
      difficulty: 'easy' | 'medium' | 'hard';
      score: number;
      category?: string;
      tags?: string[];
      sort_order?: number;
    }

    interface QuestionCreateRequest {
      subject_id: string;
      type_id: number;
      parent_id?: number;
      title: string;
      content?: { options?: { key: string; text: string }[] };
      answer?: string;
      explanation?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      score?: number;
      category?: string;
      tags?: string[];
      sort_order?: number;
    }

    interface QuestionStats {
      by_type: Record<string, number>;
      by_difficulty: Record<string, number>;
    }

    interface BatchImportResult {
      created: number;
      skipped: number;
    }
  }

  namespace Material {
    type MaterialType = 'guide' | 'practice_task' | 'case_analysis';

    interface Material {
      id: number;
      subject_id: string;
      type: MaterialType;
      title: string;
      content: string;
      meta?: object;
      summary?: string;
      tags?: string[];
      sort_order: number;
    }

    interface MaterialListData {
      items: Material[];
      total: number;
      page: number;
      page_size: number;
    }

    interface MaterialCreateRequest {
      subject_id: string;
      type: MaterialType;
      title: string;
      content: string;
      meta?: Record<string, unknown>;
      summary?: string;
      tags?: string[];
      sort_order?: number;
    }
  }

  namespace ExamModule {
    interface QuestionRule {
      count: number;
      random?: boolean;
      fixed_ids?: number[];
    }

    interface ExamConfig {
      id: number;
      subject_id: string;
      name: string;
      description?: string;
      duration: number;
      question_rules: Record<string, QuestionRule>;
      scoring_rules: Record<string, number>;
      is_active: boolean;
    }

    interface ExamCreateRequest {
      subject_id: string;
      name: string;
      description?: string;
      duration?: number;
      question_rules: Record<string, QuestionRule>;
      scoring_rules: Record<string, number>;
      is_active?: boolean;
    }
  }

  namespace ExamSession {
    interface ExamSessionItem {
      id: number;
      user_id: string;
      user_name: string;
      user_email: string;
      status: 'in_progress' | 'completed' | 'expired';
      started_at: string;
      expires_at: string;
      completed_at: string | null;
    }

    interface ExamSessionListData {
      items: ExamSessionItem[];
      total: number;
      page: number;
      page_size: number;
    }

    interface ExamSessionDetail {
      id: number;
      user_id: string;
      user_name: string;
      user_email: string;
      exam_id: number;
      exam_name: string;
      status: 'in_progress' | 'completed' | 'expired';
      started_at: string;
      expires_at: string;
      completed_at: string | null;
      selected_questions: Record<string, number[]>;
    }
  }

  namespace Score {
    interface ScoreStats {
      average_score: number;
      max_score: number;
      min_score: number;
      total_submissions: number;
      score_distribution: Record<string, number>;
    }

    interface ScoreItem {
      id: number;
      user_id: string;
      user_name: string;
      user_email: string;
      attempt_number: number;
      total_score: number;
      submitted_at: string;
    }

    interface ScoreListData {
      items: ScoreItem[];
      total: number;
      page: number;
      page_size: number;
    }
  }

  namespace User {
    interface User {
      id: string;
      name: string;
      email: string;
      is_active: boolean;
      created_at: string;
    }

    interface UserListData {
      items: User[];
      total: number;
      page: number;
      page_size: number;
    }
  }

  namespace RBAC {
    interface Permission {
      id: number;
      code: string;
      name: string;
      description?: string;
    }

    interface Role {
      id: number;
      code: string;
      name: string;
      description?: string;
      is_super: boolean;
      is_active: boolean;
      sort_order: number;
      permissions?: Permission[];
    }

    interface Menu {
      id: number;
      parent_id: number | null;
      name: string;
      route_key: string;
      path: string;
      icon?: string;
      component?: string | null;
      permission_code?: string;
      i18n_key?: string;
      hide_in_menu: boolean;
      href?: string | null;
      sort_order: number;
      is_visible: boolean;
      is_active: boolean;
      children?: Menu[];
    }

    interface MenuCreateRequest {
      parent_id?: number | null;
      name: string;
      route_key?: string;
      path?: string;
      icon?: string;
      component?: string | null;
      permission_code?: string;
      i18n_key?: string;
      hide_in_menu?: boolean;
      href?: string | null;
      sort_order?: number;
      is_visible?: boolean;
      is_active?: boolean;
    }

    interface AdminDetail {
      id: string;
      name: string;
      email: string;
      role: {
        code: string;
        name: string;
        is_super: boolean;
      };
      subjects: string[];
    }

    interface RbacInitResult {
      permissions_created: number;
      roles_created: number;
    }
  }

  namespace KnowledgePoint {
    interface KnowledgePoint {
      id: number;
      subject_id: string;
      parent_id: number | null;
      name: string;
      description?: string;
      sort_order: number;
      is_active: boolean;
      children?: KnowledgePoint[];
    }

    interface KnowledgePointCreateRequest {
      subject_id: string;
      parent_id?: number | null;
      name: string;
      description?: string;
      sort_order?: number;
      is_active?: boolean;
    }

    interface KnowledgePointAssignRequest {
      question_id: number;
      knowledge_point_ids: number[];
      primary_id?: number;
    }
  }
}
