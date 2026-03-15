/**
 * keepService — 仿 MES-USER KeepService 的 Vue 3 版本
 * - token 存 sessionStorage（分頁關閉即清除）
 * - 帳號記憶存 localStorage（跨 session 保留）
 * - 以 Vue ref 暴露 token / user，讓 component 可響應式取用
 */
import { ref } from 'vue'

const TOKEN_KEY = 'fubon_token'
const USER_KEY = 'fubon_user'
const REMEMBER_KEY = 'fubon_remember'

// ── Reactive state ──────────────────────────────────────────
export const token = ref(sessionStorage.getItem(TOKEN_KEY) || null)
export const currentUser = ref(
  JSON.parse(sessionStorage.getItem(USER_KEY) || 'null')
)

// ── Auth helpers ────────────────────────────────────────────
function generateFakeJwt(username) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({ sub: username, iat: Date.now(), exp: Date.now() + 3_600_000 })
  )
  const sig = Math.random().toString(36).substring(2, 14)
  return `${header}.${payload}.${sig}`
}

// ── Mock credentials ────────────────────────────────────────
const MOCK_USERS = [{ username: 'henry1010921@gmail.com', password: '111111' }]

// ── Public API ───────────────────────────────────────────────
export function login(username, password) {
  const match = MOCK_USERS.find(
    (u) => u.username === username && u.password === password
  )
  if (!match) return false

  const fakeToken = generateFakeJwt(username)
  const user = { username }
  sessionStorage.setItem(TOKEN_KEY, fakeToken)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  token.value = fakeToken
  currentUser.value = user
  return true
}

export function logout() {
  // 清除 token、user、以及所有頁面草稿
  sessionStorage.clear()
  token.value = null
  currentUser.value = null
}

// 記住帳號
export function saveRememberedUser(username) {
  localStorage.setItem(REMEMBER_KEY, username)
}

export function clearRememberedUser() {
  localStorage.removeItem(REMEMBER_KEY)
}

export function getRememberedUser() {
  return localStorage.getItem(REMEMBER_KEY) || ''
}

// ── Fetch interceptor：自動帶 Authorization header ─────────
export async function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (token.value && url.includes('/api/')) {
    headers['Authorization'] = `Bearer ${token.value}`
  }
  const res = await fetch(url, { ...options, headers })

  // 仿 jwtInterceptor：403 → 強制登出
  if (res.status === 403) {
    logout()
    window.location.hash = '#/login'
  }
  return res
}
