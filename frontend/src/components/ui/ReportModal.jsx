import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Mail, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { downloadPdfReport, emailReport } from '../../services/api'

export default function ReportModal({ callId, isOpen, onClose }) {
  const [email,      setEmail]      = useState('')
  const [downloading,setDownloading]= useState(false)
  const [emailing,   setEmailing]   = useState(false)
  const [emailSent,  setEmailSent]  = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadPdfReport(callId)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDownloading(false)
    }
  }

  const handleEmail = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address')
      return
    }
    setEmailing(true)
    try {
      await emailReport(callId, email)
      setEmailSent(true)
      toast.success(`Report sent to ${email}`)
      setTimeout(() => { setEmailSent(false); onClose() }, 2000)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEmailing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass-card w-full max-w-md p-6 pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Export Report</h3>
                <button onClick={onClose} className="btn-ghost p-1.5">
                  <X size={18} />
                </button>
              </div>

              {/* Download PDF */}
              <div className="glass-card-hover p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">Download PDF</p>
                    <p className="text-gray-400 text-xs mt-0.5">Full report with charts and transcript</p>
                  </div>
                  <button onClick={handleDownload} disabled={downloading} className="btn-primary py-2 px-4 text-xs">
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {downloading ? 'Generating…' : 'Download'}
                  </button>
                </div>
              </div>

              {/* Email Report */}
              <div className="glass-card-hover p-4">
                <p className="font-semibold text-white text-sm mb-3">Email Report</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="input-dark flex-1 py-2"
                    onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
                  />
                  <button onClick={handleEmail} disabled={emailing || emailSent} className="btn-primary py-2 px-4 text-xs flex-shrink-0">
                    {emailSent    ? <CheckCircle size={14} /> :
                     emailing     ? <Loader2 size={14} className="animate-spin" /> :
                     <Mail size={14} />}
                    {emailSent ? 'Sent!' : emailing ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
