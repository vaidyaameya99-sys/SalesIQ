import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, BookOpen, CheckCircle, Filter, Lightbulb } from 'lucide-react'
import { searchKnowledge } from '../services/api'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import PageTransition from '../components/ui/PageTransition'

const EXAMPLE_QUERIES = [
  'How have we handled pricing objections?',
  'What phrases work well in discovery calls?',
  'How do we respond when prospects ask about competitors?',
  'Best closing lines that worked',
  'How to re-engage a lost prospect?',
]

export default function KnowledgeBase() {
  const [query,    setQuery]    = useState('')
  const [submitted,setSubmitted]= useState('')
  const [callType, setCallType] = useState('')
  const [outcome,  setOutcome]  = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', submitted, callType, outcome],
    queryFn:  () => searchKnowledge(submitted, { call_type: callType, outcome }),
    enabled:  !!submitted,
    select:   (d) => d?.results ?? [],
  })

  const handleSearch = (q = query) => {
    if (!q.trim()) return
    setQuery(q)
    setSubmitted(q.trim())
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="page-header flex items-center gap-2">
            <BookOpen size={26} className="text-brand-400" /> Knowledge Base
          </h1>
          <p className="page-subtitle">Search across all analyzed calls for winning language and approaches</p>
        </div>

        {/* Search */}
        <div className="glass-card p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ask about winning tactics, objection handling, closing lines…"
                className="input-dark pl-10"
              />
            </div>
            <button onClick={() => handleSearch()} className="btn-primary px-5">
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mt-3">
            <select value={callType} onChange={(e) => setCallType(e.target.value)} className="input-dark py-2 text-sm flex-1">
              <option value="">All Call Types</option>
              {['Cold Outreach','Discovery','Demo','Follow-up','Negotiation','Closing'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="input-dark py-2 text-sm flex-1">
              <option value="">All Outcomes</option>
              <option value="Strong">Winning Calls Only</option>
              <option value="Neutral">Neutral Calls</option>
            </select>
          </div>
        </div>

        {/* Example queries */}
        {!submitted && (
          <div className="mb-8">
            <p className="section-label mb-3">Example searches</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(q)}
                  className="px-3 py-1.5 rounded-lg bg-dark-700 border border-white/8 text-xs text-gray-300 hover:text-white hover:border-brand-600/40 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading && submitted && (
          <div className="space-y-3">
            {[1,2,3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {data?.length === 0 && submitted && !isLoading && (
          <div className="glass-card p-12 text-center">
            <BookOpen size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-white font-semibold">No results found</p>
            <p className="text-gray-500 text-sm mt-1">Try a different search term or upload more analyzed calls</p>
          </div>
        )}

        {data?.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">{data.length} results for "{submitted}"</p>
            {data.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card-hover p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-accent-green" />
                    <span className="text-xs text-accent-green font-semibold">{result.call_outcome || 'Strong Call'}</span>
                    {result.call_type && (
                      <span className="badge-violet text-xs">{result.call_type}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{result.relevance_score ? `${(result.relevance_score * 100).toFixed(0)}% match` : ''}</span>
                </div>

                <p className="text-sm text-gray-200 leading-relaxed mb-4 border-l-2 border-brand-600/40 pl-3 italic">
                  "{result.excerpt}"
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{result.rep_name || 'Unknown rep'}</span>
                  <span>·</span>
                  <span>{result.company || 'Unknown company'}</span>
                  {result.timestamp && <span>· {result.timestamp}</span>}
                </div>

                {result.insight && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-brand-600/8 border border-brand-600/15">
                    <Lightbulb size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">{result.insight}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
