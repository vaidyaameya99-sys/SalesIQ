import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { uploadCall } from '../services/api'

export default function useUpload() {
  const navigate = useNavigate()
  const [file,       setFile]       = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [uploadPct,  setUploadPct]  = useState(0)
  const [error,      setError]      = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0]
    if (!f) return
    const allowed = ['audio/mpeg','audio/wav','audio/x-m4a','audio/mp4','text/plain','application/pdf']
    if (!allowed.includes(f.type) && !f.name.match(/\.(mp3|wav|m4a|txt|pdf)$/i)) {
      toast.error('Unsupported file type. Use .mp3, .wav, .m4a, .txt or .pdf')
      return
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error('File too large. Max 100 MB.')
      return
    }
    setFile(f)
    setError(null)
  }, [])

  const submit = useCallback(async (metadata) => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }
    setUploading(true)
    setUploadPct(0)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      Object.entries(metadata).forEach(([k, v]) => {
        if (v) form.append(k, v)
      })
      const { call_id } = await uploadCall(form, setUploadPct)
      toast.success('Upload complete — running agents...')
      navigate(`/processing/${call_id}`)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }, [file, navigate])

  const clearFile = useCallback(() => {
    setFile(null)
    setError(null)
    setUploadPct(0)
  }, [])

  return { file, uploading, uploadPct, error, onDrop, submit, clearFile }
}
