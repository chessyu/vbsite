import { useState, useEffect, useCallback } from 'react'
import type { SpaceConfig } from '@/types/space'
import { parseSpaceConfig } from '@/lib/spaceSchema'

/** 配置加载错误的判别联合：区分「用户不存在」与「配置损坏」 */
export type SpaceConfigError =
  /** 404：用户空间不存在 */
  | { kind: 'not-found'; message: string }
  /** fetch 失败 / 响应不是合法 JSON */
  | { kind: 'network'; message: string }
  /** schema 校验失败（issues 为 path 化的错误列表） */
  | { kind: 'invalid-config'; message: string; issues: string[] }
  /** 构建时注入数据损坏 */
  | { kind: 'parse-build'; message: string }

/** 构建时注入的用户数据（单用户构建模式） */
const BUILD_TIME_DATA = import.meta.env.VITE_SPACE_CONFIG as string | undefined

/** 校验原始配置；返回结构化错误或 { config, warnings } */
function validate(
  raw: unknown,
  failKind: 'parse-build' | 'invalid-config',
): { config: SpaceConfig; warnings: string[] } | { error: SpaceConfigError } {
  const result = parseSpaceConfig(raw)
  if (result.ok) {
    if (import.meta.env.DEV && result.warnings.length) {
      console.warn('[VBSite] 配置警告：\n' + result.warnings.join('\n'))
    }
    return { config: result.config, warnings: result.warnings }
  }
  return {
    error: { kind: failKind, message: '配置格式校验失败', issues: result.issues },
  }
}

export function useSpaceConfig(username: string) {
  const [config, setConfig] = useState<SpaceConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<SpaceConfigError | null>(null)

  const loadConfig = useCallback(() => {
    // 重置状态
    setConfig(null)
    setError(null)
    setLoading(true)

    // 优先使用构建时注入的数据（单用户构建模式）
    if (BUILD_TIME_DATA) {
      try {
        const raw = JSON.parse(BUILD_TIME_DATA)
        const result = validate(raw, 'parse-build')
        if ('error' in result) setError(result.error)
        else setConfig(result.config)
      } catch {
        setError({ kind: 'parse-build', message: 'Failed to parse build-time config' })
      }
      setLoading(false)
      return
    }

    // 开发/多用户模式：从静态 JSON 加载
    fetch(`/users/${username}/space.json`)
      .then(res => {
        if (!res.ok) {
          throw Object.assign(new Error(`用户空间 "${username}" 不存在`), {
            kind: 'not-found' as const,
          })
        }
        return res.json()
      })
      .then((raw: unknown) => {
        const result = validate(raw, 'invalid-config')
        if ('error' in result) setError(result.error)
        else setConfig(result.config)
        setLoading(false)
      })
      .catch((err: Error & { kind?: 'not-found' }) => {
        setError(
          err.kind === 'not-found'
            ? { kind: 'not-found', message: err.message }
            : { kind: 'network', message: err.message },
        )
        setLoading(false)
      })
  }, [username])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return { config, loading, error }
}
