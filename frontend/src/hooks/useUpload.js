import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function useUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [warmingUp, setWarmingUp] = useState(false)
  const [warmSecs, setWarmSecs] = useState(0)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const warmTimer = useRef(null)
  const countTimer = useRef(null)

  const clearWarmTimers = () => {
    if (warmTimer.current) { clearTimeout(warmTimer.current); warmTimer.current = null }
    if (countTimer.current) { clearInterval(countTimer.current); countTimer.current = null }
  }

  const onDrop = (accepted) => {
    if (accepted.length) { setFile(accepted[0]); setError(null) }
  }

  const clearFile = () => setFile(null)

  const submit = async (metadata) => {
    if (!file) return
    setUploading(true)
    setUploadPct(0)
    setWarmingUp(false)
    setWarmSecs(0)
    setError(null)

    // After 4 s with no progress, assume server cold-start and show warm-up UI
    warmTimer.current = setTimeout(() => {
      setWarmingUp(true)
      let secs = 0
      countTimer.current = setInterval(() => { secs += 1; setWarmSecs(secs) }, 1000)
    }, 4000)

    try {
      const fd = new FormData()
      fd.append('file', file)
      Object.entries(metadata).forEach(([k, v]) => { if (v) fd.append(k, v) })

      // NOTE: api instance already has baseURL='/api', so route must NOT repeat /api
      const { data } = await api.post('/calls/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 100)
          setUploadPct(pct)
          if (pct > 0) { clearWarmTimers(); setWarmingUp(false) }
        },
      })

      clearWarmTimers()
      navigate(`/processing/${data.call_id}`)
    } catch (err) {
      clearWarmTimers()
      setWarmingUp(false)
      let msg = err?.response?.data?.detail || err?.message || 'Upload failed'
      if (
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('cors') ||
        msg === 'Network Error'
      ) {
        msg = 'Cannot reach the server. Please wait 10 seconds and try again — the server may be waking up.'
      }
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  return { file, uploading, uploadPct, warmingUp, warmSecs, error, onDrop, submit, clearFile }
}
