import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload as UploadIcon, FileAudio, FileText, X,
  Loader2, ChevronRight, Info
} from 'lucide-react'
import PageTransition from '../components/ui/PageTransition'
import useUpload from '../hooks/useUpload'

const CALL_TYPES = [
  'Cold Outreach', 'Discovery', 'Demo', 'Follow-up',
  'Negotiation', 'Closing', 'Re-engagement', 'Other',
]

function FileIcon({ type }) {
  if (type?.startsWith('audio')) return <FileAudio size={32} className="text-accent-cyan" />
  return <FileText size={32} className="text-accent-violet" />
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Upload() {
  const { file, uploading, uploadPct, error, onDrop, submit, clearFile } = useUpload()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav':  ['.wav'],
      'audio/x-m4a':  ['.m4a'],
      'audio/mp4':    ['.m4a'],
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const metadata = Object.fromEntries(fd.entries())
    await submit(metadata)
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="page-header">Analyze a Sales Call</h1>
          <p className="page-subtitle">Upload an audio recording or text transcript to begin the AI pipeline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer p-10 text-center
              ${isDragActive
                ? 'border-accent-cyan bg-accent-cyan/5 scale-[1.01]'
                : file
                  ? 'border-brand-600/50 bg-brand-600/5'
                  : 'border-white/10 bg-dark-700/30 hover:border-white/20 hover:bg-dark-700/50'
              }`}
          >
            <input {...getInputProps()} />

            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-3"
                >
                  <FileIcon type={file.type} />
                  <div>
                    <p className="font-semibold text-white">{file.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearFile() }}
                    className="btn-ghost text-accent-red hover:text-accent-red hover:bg-accent-red/10"
                  >
                    <X size={14} /> Remove
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 text-gray-400"
                >
                  <UploadIcon size={36} className={isDragActive ? 'text-accent-cyan animate-bounce' : 'text-gray-600'} />
                  <div>
                    <p className="font-medium text-white">
                      {isDragActive ? 'Drop it here…' : 'Drag & drop your file'}
                    </p>
                    <p className="text-sm mt-1">or click to browse</p>
                  </div>
                  <p className="text-xs text-gray-600">Supports .mp3 .wav .m4a .txt .pdf · Max 100 MB</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload progress overlay */}
            {uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-2xl bg-dark-800/80 flex flex-col items-center justify-center gap-3"
              >
                <Loader2 size={28} className="text-accent-cyan animate-spin" />
                <p className="text-white font-medium text-sm">Uploading… {uploadPct}%</p>
                <div className="w-48 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-600 to-accent-cyan"
                    animate={{ width: `${uploadPct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Metadata */}
          <div className="glass-card p-5 space-y-4">
            <p className="section-label">Call Details</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Rep Name</label>
                <input name="rep_name" type="text" placeholder="Jane Smith" className="input-dark" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Prospect Name</label>
                <input name="prospect_name" type="text" placeholder="John Doe" className="input-dark" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Company</label>
                <input name="company" type="text" placeholder="Acme Corp" className="input-dark" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Call Date</label>
                <input name="call_date" type="date" className="input-dark" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Call Type <span className="text-gray-600 font-normal">(optional — AI will auto-detect)</span>
              </label>
              <select name="call_type" className="input-dark">
                <option value="">Auto-detect</option>
                {CALL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
              <Info size={14} /> {error}
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Info size={13} className="flex-shrink-0 mt-0.5" />
            <span>The AI pipeline runs 7 agents sequentially. You can watch live progress on the next screen. Average analysis time is 45–60 seconds.</span>
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="btn-primary w-full py-4 justify-center text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
            {uploading ? 'Uploading…' : 'Run AI Analysis'}
          </button>
        </form>
      </div>
    </PageTransition>
  )
}
