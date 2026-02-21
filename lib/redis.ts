import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Cache TTL for project data (seconds) */
export const PROJECT_CACHE_TTL = 60;
/** Cache TTL for sidebar lists (projects list, teams list) */
export const LIST_CACHE_TTL = 60;
/** Cache TTL for unread notification count */
export const UNREAD_CACHE_TTL = 15;

export function projectCacheKey(projectId: string) {
  return `project:${projectId}`;
}
export function projectsListCacheKey(userId: string) {
  return `projects:${userId}`;
}
export function teamsListCacheKey(userId: string) {
  return `teams:${userId}`;
}
export function unreadCountCacheKey(userId: string) {
  return `unread:${userId}`;
}

export async function invalidateProjectCache(projectId: string) {
  try {
    await redis.del(projectCacheKey(projectId));
  } catch {
    // Don't let cache errors break mutations
  }
}

export async function invalidateUserCaches(...keys: string[]) {
  if (keys.length === 0) return;
  try {
    await redis.del(...(keys as [string, ...string[]]));
  } catch {
    // ignore
  }
}
