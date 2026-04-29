import type { RouteComponent } from 'vue-router';
import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types';
import { generatedRoutes } from '../elegant/routes';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const customRoutes: CustomRoute[] = [];

// Views for dynamic routes from backend that use parent_child naming
// (e.g. subjects_list, exams_sessions).
// These are NOT in the generated imports.ts because elegant-router only
// auto-discovers index.vue and [param].vue files.
const customViews: Record<string, RouteComponent | (() => Promise<RouteComponent>)> = {
  subjects_list: () => import('@/views/subjects/list.vue'),
  'question-types_list': () => import('@/views/question-types/list.vue'),
  questions_list: () => import('@/views/questions/list.vue'),
  'knowledge-points_list': () => import('@/views/knowledge-points/list.vue'),
  materials_list: () => import('@/views/materials/list.vue'),
  exams_list: () => import('@/views/exams/list.vue'),
  exams_sessions: () => import('@/views/exams/sessions.vue'),
  scores_list: () => import('@/views/scores/list.vue'),
  users_list: () => import('@/views/users/list.vue'),
  rbac_permissions: () => import('@/views/rbac/permissions.vue'),
  rbac_roles: () => import('@/views/rbac/roles.vue'),
  rbac_admins: () => import('@/views/rbac/admins.vue'),
  rbac_menus: () => import('@/views/rbac/menus.vue')
};

const allViews = { ...views, ...customViews };

/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  [...customRoutes, ...generatedRoutes].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item);
    } else {
      authRoutes.push(item);
    }
  });

  return { constantRoutes, authRoutes };
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  return transformElegantRoutesToVueRoutes(routes, layouts, allViews);
}
