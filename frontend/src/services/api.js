import axios from 'axios'

// When deployed on Vercel (frontend) + Render (backend), set VITE_API_URL to your Render URL
// e.g. https://salesiq-backend.onrender.com
const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'An error occurred'
    return Promise.reject(new Error(msg))
  }
)

// ─── Calls ───────────────────────────────────────────────────────────────────
export const uploadCall = (formData, onProgress) =>
  axios.post(`${API_BASE}/api/calls/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  }).then((r) => r.data)

export const getCalls = (params) => api.get('/calls', { params })

export const getCall = (id) => api.get(`/calls/${id}`)

export const deleteCall = (id) => api.delete(`/calls/${id}`)

// ─── Analysis ────────────────────────────────────────────────────────────────
export const getAnalysis = (callId) => api.get(`/analysis/${callId}`)

// ─── Reports ─────────────────────────────────────────────────────────────────
export const downloadPdfReport = async (callId) => {
  const response = await axios.get(`${API_BASE}/api/report/pdf/${callId}`, {
    responseType: 'blob',
  })
  const url  = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', `SalesIQ_Report_${callId}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const emailReport = (callId, emailAddress) =>
  api.post('/report/email', { call_id: callId, email: emailAddress })

// ─── Knowledge Base ───────────────────────────────────────────────────────────
export const searchKnowledge = (query, filters) =>
  api.get('/knowledge/search', { params: { q: query, ...filters } })

// ─── Settings ────────────────────────────────────────────────────────────────
export const getSettings = () => api.get('/settings')

export const updateSettings = (data) => api.put('/settings', data)

// ─── WebSocket factory ────────────────────────────────────────────────────────
export const createAnalysisSocket = (callId) => {
  let wsBase
  if (API_BASE) {
    // Split deployment: backend is on Render, convert https → wss
    wsBase = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://')
  } else {
    // Same-origin deployment (Docker / local)
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    wsBase = `${protocol}://${window.location.host}`
  }
  return new WebSocket(`${wsBase}/ws/analysis/${callId}`)
}

export default api
