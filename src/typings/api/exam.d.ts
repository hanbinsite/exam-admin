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
      role: 'super_admin' | 'admin' | 'teacher';
      buttons: string[];
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
      content?: object;
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

    interface MaterialCreateRequest {
      subject_id: string;
      type: MaterialType;
      title: string;
      content: string;
      meta?: object;
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
      is_super: boolean;
      is_active: boolean;
      sort_order: number;
      permissions?: Permission[];
    }

    interface Menu {
      id: number;
      parent_id: number | null;
      name: string;
      path: string;
      icon?: string;
      component?: string;
      permission_code?: string;
      sort_order: number;
      children?: Menu[];
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
}
