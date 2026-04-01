import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, TrendingUp, AlertTriangle, BookOpen, FileText,
  Download, Mail, Share2, Save, ChevronLeft,
  Clock, User, Building, Phone, Star, AlertCircle,
  Lightbulb, Target, CheckCircle, ArrowRight
} from 'lucide-react'
import { getAnalysis } from '../services/api'
import SentimentChart from '../components/ui/SentimentChart'
import { SkeletonResults } from '../components/ui/SkeletonLoader'
import ReportModal from '../components/ui/ReportModal'
import PageTransition from '../components/ui/PageTransition'

const TABS = [
  { id: 'overview',    label: 'Overview',         icon: BarChart2    },
  { id: 'sentiment',   label: 'Sentiment Timeline',icon: TrendingUp   },
  { id: 'failures',    label: 'Failure Analysis',  icon: AlertTriangle },
  { id: 'briefing',    label: 'Pre-Call Briefing', icon: BookOpen     },
]

const VERDICT_CONFIG = {
  Strong:   { class: 'badge-green',  label: '✓ Strong Call' },
  Neutral:  { class: 'badge-amber',  label: '~ Neutral Call' },
  Weak:     { class: 'badge-amber',  label: '⚠ Weak Call' },
  Lost:     { class: 'badge-red',    label: '✗ Deal Lost' },
}

const SEVERITY_CONFIG = {
  critical: { class: 'badge-red',   label: 'Critical' },
  major:    { class: 'badge-amber', label: 'Major' },
  minor:    { class: 'badge-cyan',  label: 'Minor' },
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? 'text-accent-green' : score >= 40 ? 'text-accent-amber' : 'text-accent-red'
  const ring  = score >= 70 ? 'stroke-accent-green' : score >= 40 ? 'stroke-accent-amber' : 'stroke-accent-red'
  const pct   = (score / 100) * 2 * Math.PI * 30
  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r="30" fill="none" stroke="#1c2947" strokeWidth="6" />
        <circle cx="35" cy="35" r="30" fill="none" className={ring} strokeWidth="6"
          strokeDasharray={`${pct} 999`} strokeLinecap="round"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-black text-xl ${color}`}>
        {score}
      </div>
    </div>
  )
}

export default function Results() {
  const { callId } = useParams()
  const navigate   = useNavigate()
  const [activeTab,   setActiveTab]   = useState('overview')
  const [reportOpen,  setReportOpen]  = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analysis', callId],
    queryFn:  () => getAnalysis(callId),
  })

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <SkeletonResults />
    </div>
  )

  if (isError || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <AlertCircle size={48} className="text-accent-red" />
      <p className="text-white font-semibold">Could not load analysis</p>
      <button onClick={() => navigate('/history')} className="btn-secondary">Go to History</button>
    </div>
  )

  const { call, analysis } = data
  const verdictCfg = VERDICT_CONFIG[analysis?.verdict] ?? VERDICT_CONFIG.Neutral

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <button onClick={() => navigate('/history')} className="btn-ghost mb-6">
          <ChevronLeft size={16} /> Back to History
        </button>

        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={verdictCfg.class}>{verdictCfg.label}</span>
                {analysis?.classification?.call_type && (
                  <span className="badge-violet">{analysis.classification.call_type}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                {call?.prospect_name || 'Unknown Prospect'} — {call?.company || 'Unknown Company'}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><User size={13} /> {call?.rep_name || '—'}</span>
                <span className="flex items-center gap-1.5"><Building size={13} /> {call?.company || '—'}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} /> {analysis?.classification?.duration_minutes?.toFixed(0) || '?'} min</span>
                <span className="flex items-center gap-1.5"><Phone size={13} /> {call?.call_date || '—'}</span>
              </div>
            </div>
            <ScoreBadge score={Math.round(analysis?.overall_score ?? 0)} />
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="glass-card p-3 mb-6 flex items-center gap-2 flex-wrap">
          <button onClick={() => setReportOpen(true)} className="btn-primary text-xs py-2 px-4">
            <Download size={13} /> Download Report
          </button>
          <button onClick={() => setReportOpen(true)} className="btn-secondary text-xs py-2 px-4">
            <Mail size={13} /> Email Report
          </button>
          <button className="btn-ghost text-xs">
            <Share2 size={13} /> Share Link
          </button>
          <button className="btn-ghost text-xs">
            <Save size={13} /> Saved
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-dark-800 rounded-xl mb-6 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium flex-1 justify-center whitespace-nowrap transition-all duration-200
                ${activeTab === id
                  ? 'bg-dark-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Overall Score',    value: `${Math.round(analysis?.overall_score ?? 0)}/100`,     color: 'text-accent-cyan' },
                    { label: 'Failure Points',   value: analysis?.failure_points?.length ?? 0,                 color: 'text-accent-red'  },
                    { label: 'Engagement Level', value: analysis?.sentiment_data?.engagement_level || 'N/A',   color: 'text-accent-amber'},
                  ].map((s, i) => (
                    <div key={i} className="glass-card p-4 text-center">
                      <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText size={15} className="text-brand-400" /> Call Summary
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {analysis?.classification?.summary || 'No summary available.'}
                  </p>
                </div>

                {/* Key outcomes */}
                {analysis?.classification?.key_topics?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="font-semibold text-white mb-3">Key Topics Discussed</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.classification.key_topics.map((t, i) => (
                        <span key={i} className="badge-violet text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Sentiment Timeline ── */}
            {activeTab === 'sentiment' && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-1">Emotional Arc</h3>
                <p className="text-xs text-gray-500 mb-6">Minute-by-minute sentiment breakdown. ⚡ markers indicate mood shifts.</p>
                <SentimentChart
                  data={analysis?.sentiment_data?.timeline ?? []}
                  moodShifts={analysis?.sentiment_data?.mood_shifts ?? []}
                />
                {analysis?.sentiment_data?.mood_shifts?.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="section-label mb-3">Mood Shifts Detected</p>
                    {analysis.sentiment_data.mood_shifts.map((shift, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent-amber/8 border border-accent-amber/15">
                        <span className="text-accent-amber font-mono text-xs bg-accent-amber/15 px-2 py-1 rounded">
                          {shift.minute}m
                        </span>
                        <p className="text-sm text-gray-300">{shift.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Failure Analysis ── */}
            {activeTab === 'failures' && (
              <div className="space-y-4">
                {!analysis?.failure_points?.length ? (
                  <div className="glass-card p-10 text-center">
                    <CheckCircle size={40} className="text-accent-green mx-auto mb-3" />
                    <p className="text-white font-semibold">No critical failures detected</p>
                    <p className="text-gray-400 text-sm mt-1">This call performed well across all diagnostic dimensions.</p>
                  </div>
                ) : (
                  analysis.failure_points.map((fp, i) => {
                    const sevCfg = SEVERITY_CONFIG[fp.severity] ?? SEVERITY_CONFIG.minor
                    const coaching = analysis.coaching_responses?.[i]
                    return (
                      <div key={i} className="glass-card p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-dark-600 px-2 py-1 rounded text-gray-300">
                              {fp.timestamp || `~${i * 3 + 2}m`}
                            </span>
                            <span className={sevCfg.class}>{sevCfg.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">{fp.root_cause_category}</span>
                        </div>

                        <p className="text-sm text-gray-200 mb-4 font-medium">{fp.what_happened}</p>

                        {coaching && (
                          <div className="space-y-3">
                            {/* What was said */}
                            {fp.transcript_excerpt && (
                              <div className="p-3 rounded-lg bg-accent-red/8 border border-accent-red/15">
                                <p className="text-xs text-accent-red mb-1 font-semibold">What was said</p>
                                <p className="text-sm text-gray-300 italic">"{fp.transcript_excerpt}"</p>
                              </div>
                            )}

                            {/* What to say instead */}
                            <div className="p-3 rounded-lg bg-accent-green/8 border border-accent-green/15">
                              <p className="text-xs text-accent-green mb-1 font-semibold flex items-center gap-1">
                                <Lightbulb size={11} /> Better approach
                              </p>
                              <p className="text-sm text-gray-200">{coaching.alternative_phrasing}</p>
                            </div>

                            {/* Why it works */}
                            {coaching.why_it_works && (
                              <div className="p-3 rounded-lg bg-brand-600/8 border border-brand-600/15">
                                <p className="text-xs text-brand-400 mb-1 font-semibold">Why this works</p>
                                <p className="text-sm text-gray-300">{coaching.why_it_works}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ── Pre-Call Briefing ── */}
            {activeTab === 'briefing' && (() => {
              const b = analysis?.pre_call_briefing
              if (!b) return (
                <div className="glass-card p-10 text-center text-gray-400">No briefing available.</div>
              )
              return (
                <div className="space-y-4">
                  <div className="glass-card p-5">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Target size={15} className="text-accent-cyan" /> Recommended Approach
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{b.recommended_approach}</p>
                  </div>

                  {b.prospect_triggers?.length > 0 && (
                    <div className="glass-card p-5">
                      <h3 className="font-semibold text-white mb-3">Prospect Triggers</h3>
                      <div className="space-y-2">
                        {b.prospect_triggers.map((t, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan mt-2 flex-shrink-0" />
                            <p className="text-sm text-gray-300">{t}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {b.objections_to_expect?.length > 0 && (
                    <div className="glass-card p-5">
                      <h3 className="font-semibold text-white mb-3">Objections to Expect</h3>
                      <div className="space-y-3">
                        {b.objections_to_expect.map((obj, i) => (
                          <div key={i} className="p-3 rounded-lg bg-accent-amber/8 border border-accent-amber/15">
                            <p className="text-sm font-medium text-accent-amber mb-1">{obj.objection}</p>
                            <p className="text-sm text-gray-300 flex items-start gap-1.5">
                              <ArrowRight size={12} className="mt-1 flex-shrink-0" />
                              {obj.suggested_response}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {b.opening_lines?.length > 0 && (
                    <div className="glass-card p-5">
                      <h3 className="font-semibold text-white mb-3">Opening Lines</h3>
                      {b.opening_lines.map((line, i) => (
                        <p key={i} className="text-sm text-gray-300 italic border-l-2 border-brand-600/40 pl-3 mb-2">
                          "{line}"
                        </p>
                      ))}
                    </div>
                  )}

                  {b.questions_to_ask?.length > 0 && (
                    <div className="glass-card p-5">
                      <h3 className="font-semibold text-white mb-3">Questions to Ask</h3>
                      <div className="space-y-2">
                        {b.questions_to_ask.map((q, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="text-xs font-bold text-brand-400 mt-0.5">Q{i + 1}</span>
                            <p className="text-sm text-gray-300">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      <ReportModal callId={callId} isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </PageTransition>
  )
}
