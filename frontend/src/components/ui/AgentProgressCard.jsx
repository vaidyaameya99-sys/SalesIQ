import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, Clock, AlertCircle } from 'lucide-react'

const STATUS_CONFIG = {
  waiting: {
    icon:       Clock,
    iconClass:  'text-gray-500',
    cardClass:  'agent-waiting',
    label:      'Waiting',
    labelClass: 'text-gray-500',
  },
  running: {
    icon:       Loader2,
    iconClass:  'text-accent-cyan animate-spin',
    cardClass:  'agent-running',
    label:      'Running',
    labelClass: 'text-accent-cyan',
  },
  done: {
    icon:       CheckCircle,
    iconClass:  'text-accent-green',
    cardClass:  'agent-done',
    label:      'Complete',
    labelClass: 'text-accent-green',
  },
  error: {
    icon:       AlertCircle,
    iconClass:  'text-accent-red',
    cardClass:  'agent-error',
    label:      'Error',
    labelClass: 'text-accent-red',
  },
}

export default function AgentProgressCard({ agent, index }) {
  const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.waiting
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={`rounded-xl p-4 transition-all duration-500 ${cfg.cardClass}`}
    >
      <div className="flex items-start gap-4">
        {/* Step number */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-xs font-semibold text-gray-400">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="font-semibold text-sm text-white truncate">{agent.label}</span>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.labelClass} flex-shrink-0`}>
              <Icon size={13} className={cfg.iconClass} />
              {cfg.label}
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-2">{agent.desc}</p>

          {/* Message */}
          <AnimatePresence>
            {agent.status === 'running' && agent.message && (
              <motion.p
                key={agent.message}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-accent-cyan/80 italic mb-2"
              >
                {agent.message}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          {agent.status === 'running' && (
            <div className="h-1 bg-dark-600 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-600 to-accent-cyan rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${agent.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          )}

          {agent.status === 'done' && (
            <div className="h-1 bg-accent-green/20 rounded-full overflow-hidden">
              <div className="h-full w-full bg-accent-green/60 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
