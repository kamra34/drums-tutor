/**
 * API client — typed fetch wrapper with JWT auth.
 * All backend communication goes through this module.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

let _token: string | null = localStorage.getItem('auth_token')

export function setToken(token: string | null) {
  _token = token
  if (token) localStorage.setItem('auth_token', token)
  else localStorage.removeItem('auth_token')
}

export function getToken(): string | null { return _token }

let _autoSetupPromise: Promise<void> | null = null

/** Auto-create a default local user if not logged in. Called before API requests. */
async function ensureAuth(): Promise<void> {
  if (_token) return
  if (_autoSetupPromise) return _autoSetupPromise
  _autoSetupPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/auto-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
      }
    } catch {
      // Server not running — will fail gracefully on actual requests
    }
    _autoSetupPromise = null
  })()
  return _autoSetupPromise
}

async function doFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> ?? {}),
  }
  if (_token) headers['Authorization'] = `Bearer ${_token}`
  return fetch(`${API_BASE}${path}`, { ...opts, headers })
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  await ensureAuth()

  let res = await doFetch(path, opts)

  // On 401, clear stale token, re-auth, and retry once
  if (res.status === 401) {
    setToken(null)
    _autoSetupPromise = null
    await ensureAuth()
    if (_token) {
      res = await doFetch(path, opts)
    }
  }

  const data = await res.json()
  if (!res.ok) throw new ApiError(res.status, data.error || 'Request failed', data)
  return data as T
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message)
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: 'user' | 'admin'
}

export async function apiRegister(email: string, password: string, displayName: string) {
  return request<{ token: string; user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  })
}

export async function apiLogin(email: string, password: string) {
  return request<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function apiGetMe() {
  return request<{ user: AuthUser }>('/api/auth/me')
}

export async function apiSetupAdmin() {
  return request<{ token: string; user: AuthUser; message: string }>('/api/auth/setup-admin', {
    method: 'POST',
  })
}

// ── Exercises ────────────────────────────────────────────────────────────────

export interface DbExercise {
  id: string
  title: string
  description: string
  patternData: any
  config: any
  category: string
  difficulty: number
  bpm: number
  timeSignature: number[]
  bars: number
  tags: string[]
  isBuiltin: boolean
  isAiGenerated: boolean
  instrument?: string
  backingTrackName?: string | null
  backingTrackBpm?: number | null
  backingTrackOffset?: number | null
  backingTrackVolume?: number | null
  createdAt: string
  _count?: { sessions: number }
  sessions?: { id: string; score: number; stars: number; accuracy: number; bpm: number; startedAt: string }[]
}

export async function apiListExercises(params?: { category?: string; instrument?: string; limit?: number }) {
  const q = new URLSearchParams()
  if (params?.category) q.set('category', params.category)
  if (params?.instrument) q.set('instrument', params.instrument)
  if (params?.limit) q.set('limit', String(params.limit))
  return request<{ exercises: DbExercise[] }>(`/api/exercises?${q}`)
}

export async function apiGetExercise(id: string) {
  return request<{ exercise: DbExercise }>(`/api/exercises/${id}`)
}

export async function apiSaveExercise(data: {
  title: string; description?: string; patternData: any; config?: any
  category?: string; instrument?: string; difficulty?: number; bpm?: number
  timeSignature?: number[]; bars?: number; tags?: string[]
  isAiGenerated?: boolean
}) {
  return request<{ exercise: DbExercise }>('/api/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiUpdateExercise(id: string, data: {
  title?: string; description?: string; patternData?: any; config?: any
  category?: string; difficulty?: number; bpm?: number
  timeSignature?: number[]; bars?: number; tags?: string[]
  isAiGenerated?: boolean
}) {
  return request<{ exercise: DbExercise }>(`/api/exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiDeleteExercise(id: string) {
  return request<{ deleted: boolean }>(`/api/exercises/${id}`, { method: 'DELETE' })
}

// ── Backing Track ────────────────────────────────────────────────────────────

export async function apiUploadBackingTrack(
  exerciseId: string, file: File,
  meta: { bpm: number; offset: number; volume: number },
): Promise<void> {
  await ensureAuth()
  const token = getToken()
  // Convert file to base64 for reliable JSON transport (avoids body parser issues)
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.split(',')[1]) // strip "data:audio/mpeg;base64," prefix
    }
    reader.readAsDataURL(file)
  })
  const res = await fetch(`${API_BASE}/api/exercises/${exerciseId}/backing-track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      data: base64,
      name: file.name,
      mime: file.type || 'audio/mpeg',
      bpm: meta.bpm,
      offset: meta.offset,
      volume: meta.volume,
    }),
  })
  if (!res.ok) throw new Error('Upload failed')
}

export async function apiGetBackingTrack(exerciseId: string): Promise<Blob | null> {
  await ensureAuth()
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/exercises/${exerciseId}/backing-track`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}

// ── Practice Sessions ────────────────────────────────────────────────────────

export interface DbSession {
  id: string
  exerciseId: string | null
  bpm: number
  score: number
  stars: number
  accuracy: number
  missedNotes: number
  totalNotes: number
  hitNotes: number
  practiceMode: string
  startedAt: string
  completedAt: string | null
  exercise?: { id: string; title: string; category: string } | null
}

export async function apiRecordSession(data: {
  exerciseId?: string; bpm: number; score: number; stars: number; accuracy: number
  timingData?: any; velocityData?: any; missedNotes?: number; totalNotes?: number
  hitNotes?: number; practiceMode?: string
}) {
  return request<{ session: DbSession }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiListSessions(params?: { limit?: number; practiceMode?: string }) {
  const q = new URLSearchParams()
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.practiceMode) q.set('practiceMode', params.practiceMode)
  return request<{ sessions: DbSession[]; total: number }>(`/api/sessions?${q}`)
}

export async function apiGetSessionStats() {
  return request<{
    totalSessions: number
    totalByMode: any[]
    bestScores: any[]
    recentActivity: any[]
  }>('/api/sessions/stats')
}

export async function apiGetBestScore(exerciseId: string) {
  return request<{ best: DbSession | null }>(`/api/sessions/best/${exerciseId}`)
}

// ── Progress ─────────────────────────────────────────────────────────────────

export interface DbProgress {
  id: string
  currentModule: string
  completedLessons: string[]
  skillTiming: number
  skillDynamics: number
  skillIndependence: number
  skillSpeed: number
  skillMusicality: number
}

export async function apiGetProgress() {
  return request<{ progress: DbProgress }>('/api/progress')
}

export async function apiUpdateProgress(data: Partial<{
  currentModule: string; skillTiming: number; skillDynamics: number
  skillIndependence: number; skillSpeed: number; skillMusicality: number
}>) {
  return request<{ progress: DbProgress }>('/api/progress', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function apiCompleteLesson(lessonId: string) {
  return request<{ progress: DbProgress }>('/api/progress/complete-lesson', {
    method: 'POST',
    body: JSON.stringify({ lessonId }),
  })
}

// ── Chat Conversations ──────────────────────────────────────────────────────

export interface DbConversation {
  id: string
  title: string
  instrument?: string
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
  messages?: DbChatMessage[]
}

export interface DbChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  hasImage: boolean
  createdAt: string
}

export async function apiListChats(instrument?: string) {
  const query = instrument ? `?instrument=${instrument}` : ''
  return request<{ conversations: DbConversation[] }>(`/api/chats${query}`)
}

export async function apiCreateChat(title?: string, instrument?: string) {
  return request<{ conversation: DbConversation }>('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ title: title ?? 'New conversation', ...(instrument ? { instrument } : {}) }),
  })
}

export async function apiGetChat(id: string) {
  return request<{ conversation: DbConversation }>(`/api/chats/${id}`)
}

export async function apiUpdateChatTitle(id: string, title: string) {
  return request<{ updated: boolean }>(`/api/chats/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export async function apiDeleteChat(id: string) {
  return request<{ deleted: boolean }>(`/api/chats/${id}`, { method: 'DELETE' })
}

export async function apiAddChatMessage(conversationId: string, data: {
  role: 'user' | 'assistant'
  content: string
  hasImage?: boolean
}) {
  return request<{ message: DbChatMessage }>(`/api/chats/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
