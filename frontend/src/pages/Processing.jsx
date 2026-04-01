import { useEffect } from 'react'
import { useParams, useNavigate, useBeforeUnload } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import AgentProgressCard from '../components/ui/AgentProgressCard'
import useAgentProgress from '../hooks/useAgentProgress'

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function Processing() {
  const { callId }  = useParams()
  const navigate    = useNavigate()

  const {
    agents, isComplete, hasError,
    elapsed, estimated, doneCount, totalCount, overallPct,
  } = useAgentProgress(callId)

  // Warn on navigation away
  useBeforeUnload((e) => {
    if (!isComplete && !hasError) {
      e.preventDefault()
      return 'Analysis is still running. Are you sure you want to leave?'
    }
  })

  // Auto-navigate when complete
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => navigate(`/results/${callId}`), 1200)
      return () => clearTimeout(t)
    }
  }, [isComplete, callId, navigate])

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {isComplete ? (
            <>
              <div className="w-16 h-16 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-accent-green" />
              </div>
              <h1 className="text-2xl font-bold text-white">Analysis Complete!</h1>
              <p className="text-gray-400 text-sm mt-1">Redirecting to your results…</p>
            </>
          ) : hasError ? (
            <>
              <div className="w-16 h-16 rounded-full bg-accent-red/15 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-accent-red" />
              </div>
              <h1 className="text-2xl font-bold text-white">Analysis Failed</h1>
              <p className="text-gray-400 text-sm mt-1">An error occurred during processing. Please try again.</p>
              <button onClick={() => navigate('/upload')} className="btn-primary mt-4">
                Upload Again
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-brand-600/15 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Zap size={28} className="text-accent-cyan fill-current" />
              </div>
              <h1 className="text-2xl font-bold text-white">Analyzing Your Call</h1>
              <p className="text-gray-400 text-sm mt-1">
                {doneCount} of {totalCount} agents complete · do not navigate away
              </p>
            </>
          )}
        </motion.div>

        {/* Overall progress */}
        {!hasError && (
          <div className="glass-card p-5 mb-6">
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-gray-400">Overall Progress</span>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {formatTime(elapsed)}
                </span>
                {!isComplete && estimated > 0 && (
                  <span className="text-xs text-gray-600">~{formatTime(estimated)} left</span>
                )}
              </div>
            </div>
            <div className="h-2.5 bg-dark-600 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-600 to-accent-cyan rounded-full"
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>{doneCount}/{totalCount} agents</span>
              <span>{overallPct}%</span>
            </div>
          </div>
        )}

        {/* Agent cards */}
        <div className="space-y-2.5">
          {agents.map((agent, i) => (
            <AgentProgressCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
