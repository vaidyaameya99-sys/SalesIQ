import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, Filter, Download, Trash2, ChevronRight,
  Clock, User, Building, BarChart2, Plus
} from 'lucide-react'
import { format } from 'date-fns'
import useCallHistory from '../hooks/useCallHistory'
import { SkeletonTable } from '../components/ui/SkeletonLoader'
import PageTransition from '../components/ui/PageTransition'

const CALL_TYPE_COLORS = {
  'Cold Outreach':  'badge-cyan',
  'Discovery':      'badge-violet',
  'Demo':           'badge-green',
  'Follow-up':      'badge-amber',
  'Negotiation':    'badge-amber',
  'Closing':        'badge-green',
  'Lost':           'badge-red',
  'Re-engagement':  'badge-cyan',
}

const VERDICT_COLORS = {
  Strong:  'badge-green',
  Neutral: 'badge-amber',
  Weak:    'badge-amber',
  Lost:    'badge-red',
}

export default function History() {
  const navigate = useNavigate()
  const [search,  setSearch]  = useState('')
  const [sortBy,  setSortBy]  = useState('date')
  const [outcome, setOutcome] = useState('')

  const { calls, loading, removeCall } = useCallHistory()

  const filtered = calls
    .filter((c) => {
      const q = search.toLowerCase()
      const matchSearch = !q || [c.rep_name, c.prospect_name, c.company].some((v) =>
        v?.toLowerCase().includes(q)
      )
      const matchOutcome = !outcome || c.analysis?.verdict === outcome
      return matchSearch && matchOutcome
    })
    .sort((a, b) => {
      if (sortBy === 'date')    return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'score')   return (b.analysis?.overall_score ?? 0) - (a.analysis?.overall_score ?? 0)
      if (sortBy === 'outcome') return (a.analysis?.verdict ?? '').localeCompare(b.analysis?.verdict ?? '')
      return 0
    })

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="page-header">Call History</h1>
            <p className="page-subtitle">{calls.length} calls analyzed</p>
          </div>
          <button onClick={() => navigate('/upload')} className="btn-primary text-sm py-2.5">
            <Plus size={15} /> New Analysis
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search rep, prospect, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark pl-9 py-2 text-sm"
            />
          </div>

          {/* Outcome filter */}
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="input-dark py-2 text-sm w-40"
          >
            <option value="">All Outcomes</option>
            <option value="Strong">Strong</option>
            <option value="Neutral">Neutral</option>
            <option value="Weak">Weak</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-dark py-2 text-sm w-36"
          >
            <option value="date">Sort: Date</option>
            <option value="score">Sort: Score</option>
            <option value="outcome">Sort: Outcome</option>
          </select>

          <button className="btn-secondary py-2 text-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={6} />
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <BarChart2 size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">No calls found</p>
            <p className="text-gray-500 text-sm mb-6">
              {search || outcome
                ? 'Try adjusting your filters'
                : 'Upload your first sales call to get started'}
            </p>
            {!search && !outcome && (
              <button onClick={() => navigate('/upload')} className="btn-primary text-sm">
                Analyze First Call <ChevronRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((call, i) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card-hover p-4 flex items-center gap-4 cursor-pointer group"
                onClick={() => navigate(`/results/${call.id}`)}
              >
                {/* Score ring */}
                <div className="w-10 h-10 rounded-full border-2 border-brand-600/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-400">
                    {Math.round(call.analysis?.overall_score ?? 0)}
                  </span>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white text-sm truncate">
                      {call.prospect_name || 'Unknown'} — {call.company || 'Unknown'}
                    </p>
                    {call.analysis?.verdict && (
                      <span className={`${VERDICT_COLORS[call.analysis.verdict] ?? 'badge'} text-xs flex-shrink-0`}>
                        {call.analysis.verdict}
                      </span>
                    )}
                    {call.analysis?.classification?.call_type && (
                      <span className={`${CALL_TYPE_COLORS[call.analysis.classification.call_type] ?? 'badge'} text-xs flex-shrink-0`}>
                        {call.analysis.classification.call_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User size={11} /> {call.rep_name || '—'}</span>
                    <span className="flex items-center gap-1"><Building size={11} /> {call.company || '—'}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {call.created_at
                        ? format(new Date(call.created_at), 'MMM d, yyyy')
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCall(call.id) }}
                    className="btn-ghost text-accent-red hover:text-accent-red hover:bg-accent-red/10 p-2"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <ChevronRight size={16} className="text-gray-600 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
