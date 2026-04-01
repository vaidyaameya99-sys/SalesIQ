import { useState, useEffect, useRef, useCallback } from 'react'
import { createAnalysisSocket } from '../services/api'

const AGENTS = [
  { id: 'transcription',  label: 'Transcription Agent',    desc: 'Converting audio to timestamped transcript' },
  { id: 'classifier',     label: 'Call Classifier Agent',  desc: 'Identifying call type and extracting metadata' },
  { id: 'sentiment',      label: 'Sentiment & Emotion Agent', desc: 'Analyzing minute-by-minute emotional arc' },
  { id: 'diagnostics',    label: 'Diagnostics Agent',      desc: 'Detecting failure points and root causes' },
  { id: 'coach',          label: 'Sales Coach Agent',      desc: 'Generating coaching responses with examples' },
  { id: 'briefing',       label: 'Pre-Call Briefing Agent', desc: 'Building re-engagement strategy document' },
  { id: 'knowledge_rag',  label: 'Knowledge RAG Agent',    desc: 'Indexing call into knowledge base' },
]

const initialAgentState = () =>
  AGENTS.map((a) => ({ ...a, status: 'waiting', progress: 0, message: '' }))

export default function useAgentProgress(callId) {
  const [agents,      setAgents]      = useState(initialAgentState)
  const [isComplete,  setIsComplete]  = useState(false)
  const [hasError,    setHasError]    = useState(false)
  const [elapsed,     setElapsed]     = useState(0)
  const socketRef     = useRef(null)
  const timerRef      = useRef(null)
  const startTimeRef  = useRef(Date.now())

  const updateAgent = useCallback((agentId, patch) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, ...patch } : a))
    )
  }, [])

  useEffect(() => {
    if (!callId) return

    // Elapsed timer
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    // WebSocket connection
    const ws = createAnalysisSocket(callId)
    socketRef.current = ws

    ws.onopen = () => {
      console.log('[WS] Connected to analysis stream')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'agent_update') {
          updateAgent(data.agent, {
            status:   data.status,
            progress: data.progress ?? 0,
            message:  data.message ?? '',
          })
        } else if (data.type === 'complete') {
          setIsComplete(true)
          clearInterval(timerRef.current)
        } else if (data.type === 'error') {
          setHasError(true)
          clearInterval(timerRef.current)
        }
      } catch (e) {
        console.error('[WS] Parse error', e)
      }
    }

    ws.onerror = () => {
      setHasError(true)
      clearInterval(timerRef.current)
    }

    ws.onclose = () => {
      console.log('[WS] Connection closed')
    }

    return () => {
      ws.close()
      clearInterval(timerRef.current)
    }
  }, [callId, updateAgent])

  const doneCount     = agents.filter((a) => a.status === 'done').length
  const runningAgent  = agents.find((a) => a.status === 'running')
  const overallPct    = Math.round((doneCount / AGENTS.length) * 100)
  const estimated     = Math.max(0, 55 - elapsed)

  return {
    agents,
    isComplete,
    hasError,
    elapsed,
    estimated,
    doneCount,
    totalCount: AGENTS.length,
    runningAgent,
    overallPct,
  }
}
