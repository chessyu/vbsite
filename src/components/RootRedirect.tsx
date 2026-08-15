const LAST_VISITED_KEY = 'vbsite_last_visited_user'

/** 记录用户访问过的空间 */
export function recordLastVisitedUser(username: string) {
  try {
    localStorage.setItem(LAST_VISITED_KEY, username)
  } catch {
    // localStorage 不可用时静默失败
  }
}

/** 获取最近访问的用户空间 */
export function getLastVisitedUser(): string | null {
  try {
    return localStorage.getItem(LAST_VISITED_KEY)
  } catch {
    return null
  }
}
