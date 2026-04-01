import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mic2, TrendingUp, AlertTriangle, Brain, BookOpen,
  FileText, Database, ArrowRight, Zap, ChevronRight,
  BarChart2, Shield, Clock
} from 'lucide-react'

const AGENTS = [
  { icon: Mic2,          color: 'text-accent-cyan',   bg: 'bg-accent-cyan/10',   label: 'Transcription',   desc: 'Audio → timestamped transcript via Whisper API' },
  { icon: BarChart2,     color: 'text-accent-violet', bg: 'bg-accent-violet/10', label: 'Call Classifier', desc: 'Identifies call type, rep, prospect & outcome' },
  { icon: TrendingUp,    color: 'text-accent-green',  bg: 'bg-accent-green/10',  label: 'Sentiment',       desc: 'Per-minute emotional arc with mood shift detection' },
  { icon: AlertTriangle, color: 'text-accent-amber',  bg: 'bg-accent-amber/10',  label: 'Diagnostics',     desc: 'Exact failure moments with timestamps & severity' },
  { icon: Brain,         color: 'text-brand-400',     bg: 'bg-brand-600/10',     label: 'Sales Coach',     desc: 'Alternative phrasing with winning call examples' },
  { icon: FileText,      color: 'text-accent-cyan',   bg: 'bg-accent-cyan/10',   label: 'Pre-Call Briefing', desc: 'Full prep doc before re-engaging the same prospect' },
  { icon: Database,      color: 'text-accent-violet', bg: 'bg-accent-violet/10', label: 'Knowledge RAG',   desc: 'Semantic search across all past winning calls' },
]

const FEATURES = [
  { icon: Clock,   label: '< 60 sec analysis',    desc: 'From upload to full report in under a minute' },
  { icon: Brain,   label: 'AI-powered coaching',  desc: '7 specialized agents working in sequence' },
  { icon: Shield,  label: 'No re-do mistakes',    desc: 'Know exactly what to fix before the next call' },
  { icon: BookOpen,label: 'Cumulative learning',  desc: 'Every call makes the knowledge base smarter' },
]

function AnimatedCounter({ target, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const steps = 50
    const increment = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setCount(Math.floor(current))
      if (current >= target) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration])
  return <span>{count.toLocaleString()}{suffix}</span>
}

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-dark-900 bg-grid-dark overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark-900/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-cyan flex items-center justify-center">
              <Zap size={16} className="text-dark-900 fill-current" />
            </div>
            <span className="text-white font-bold text-lg">Sales<span className="text-accent-cyan">IQ</span></span>
          </div>
          <button onClick={() => navigate('/upload')} className="btn-primary text-sm py-2.5 px-5">
            Get Started <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-accent-cyan/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-cyan text-xs mb-6 inline-flex">
              <Zap size={11} /> AI-Powered Sales Intelligence
            </span>

            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
              Know exactly{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-cyan">
                where deals die
              </span>
              <br />and how to revive them
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload any sales call recording. 7 AI agents analyze the conversation,
              pinpoint every failure moment with timestamps, coach the rep on what to
              say differently, and generate a full pre-call briefing for the next attempt.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/upload')}
                className="btn-primary text-base py-3.5 px-8"
              >
                Analyze a Call <ChevronRight size={18} />
              </button>
              <button
                onClick={() => navigate('/history')}
                className="btn-secondary text-base py-3.5 px-8"
              >
                View Past Analyses
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-20 grid grid-cols-3 gap-6 max-w-xl mx-auto"
          >
            {[
              { value: 247, suffix: '+', label: 'Calls Analyzed' },
              { value: 1840, suffix: '+', label: 'Insights Generated' },
              { value: 94, suffix: '%', label: 'Rep Improvement Rate' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-5 text-center">
                <p className="text-3xl font-black text-accent-cyan">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 7 Agents */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">The Engine</span>
            <h2 className="text-3xl font-bold text-white mt-2">7 Specialized AI Agents</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto">Each agent is optimized for one task and passes its output to the next — a true agentic pipeline.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="glass-card-hover p-5 group"
              >
                <div className={`w-10 h-10 rounded-xl ${agent.bg} flex items-center justify-center mb-4`}>
                  <agent.icon size={20} className={agent.color} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-gray-600">#{i + 1}</span>
                  <h3 className="font-semibold text-white text-sm">{agent.label}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{agent.desc}</p>
              </motion.div>
            ))}

            {/* Plus card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.56 }}
              className="glass-card p-5 flex flex-col items-center justify-center text-center border-dashed"
            >
              <p className="text-3xl font-black text-gray-700">→</p>
              <p className="text-xs text-gray-500 mt-2">Pipeline runs in sequence, real-time</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center mx-auto mb-3">
                <f.icon size={20} className="text-brand-400" />
              </div>
              <p className="font-semibold text-white text-sm mb-1">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto glass-card glow-border p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Start analyzing calls today</h2>
          <p className="text-gray-400 mb-8">Upload an audio file or paste a transcript — get a full AI diagnosis in under 60 seconds.</p>
          <button onClick={() => navigate('/upload')} className="btn-primary text-base py-4 px-10">
            Analyze Your First Call <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>
    </div>
  )
}
