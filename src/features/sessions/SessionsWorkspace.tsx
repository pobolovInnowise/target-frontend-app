import { useEffect, useRef, useState } from 'react'
import { CreateSessionForm } from './CreateSessionForm'
import { createMockSessionsApi } from './mockSessionsApi'
import { SessionList } from './SessionList'
import type { SessionsApi } from './sessionsApi'
import { StatusFilter } from './StatusFilter'
import type {
  NewSessionInput,
  Session,
  StatusFilter as StatusFilterValue,
} from './types'

type LoadState = 'loading' | 'error' | 'ready'

// Single place where the default (mock) boundary is wired.
const defaultApi = createMockSessionsApi()

interface SessionsWorkspaceProps {
  api?: SessionsApi
}

export function SessionsWorkspace({ api = defaultApi }: SessionsWorkspaceProps) {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [sessions, setSessions] = useState<Session[]>([])
  const [filter, setFilter] = useState<StatusFilterValue>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    let isStale = false

    api
      .listSessions()
      .then((loaded) => {
        if (isStale) return
        setSessions(loaded)
        setLoadState('ready')
      })
      .catch(() => {
        if (isStale) return
        setLoadState('error')
      })

    return () => {
      isStale = true
    }
  }, [api, loadAttempt])

  function handleRetry() {
    setLoadState('loading')
    setLoadAttempt((attempt) => attempt + 1)
  }

  async function handleCreate(input: NewSessionInput) {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    try {
      const created = await api.createSession(input)
      setSessions((current) => [...current, created])
      setFilter('all')
      setIsFormOpen(false)
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const visibleSessions =
    filter === 'all'
      ? sessions
      : sessions.filter((session) => session.status === filter)

  return (
    <main className="workspace">
      <h1>Training Sessions Workspace</h1>

      {loadState === 'loading' ? (
        <p role="status">Loading sessions…</p>
      ) : null}

      {loadState === 'error' ? (
        <div role="alert" className="load-error">
          <p>Could not load sessions. Check your connection and try again.</p>
          <button type="button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      ) : null}

      {loadState === 'ready' ? (
        <>
          <div className="toolbar">
            <StatusFilter value={filter} onChange={setFilter} />
            <button
              type="button"
              aria-expanded={isFormOpen}
              onClick={() => setIsFormOpen((open) => !open)}
            >
              New session
            </button>
          </div>

          {isFormOpen ? (
            <CreateSessionForm
              isSubmitting={isSubmitting}
              onSubmit={handleCreate}
              onCancel={() => setIsFormOpen(false)}
            />
          ) : null}

          <SessionList sessions={visibleSessions} />
        </>
      ) : null}
    </main>
  )
}
