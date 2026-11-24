import type { SessionsApi } from './sessionsApi'
import type { Session } from './types'

interface MockSessionsApiOptions {
  /** Artificial latency applied to every call. */
  delayMs?: number
}

// The only place in the app that holds hard-coded session data (AC-12).
const initialSessions: Session[] = [
  {
    id: 'session-1',
    title: 'Onboarding workshop',
    status: 'scheduled',
    startsAt: '2027-02-10T09:00:00.000Z',
  },
  {
    id: 'session-2',
    title: 'React fundamentals',
    status: 'completed',
    startsAt: '2026-09-15T13:30:00.000Z',
  },
  {
    id: 'session-3',
    title: 'Code review practice',
    status: 'completed',
    startsAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'session-4',
    title: 'Testing with Vitest',
    status: 'cancelled',
    startsAt: '2026-11-01T15:00:00.000Z',
  },
]

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

/** In-memory `SessionsApi`: no network, no service worker, resets on reload. */
export function createMockSessionsApi(
  options: MockSessionsApiOptions = {},
): SessionsApi {
  const { delayMs = 400 } = options
  const sessions: Session[] = initialSessions.map((session) => ({ ...session }))
  let nextId = sessions.length + 1

  return {
    async listSessions() {
      await wait(delayMs)
      return sessions.map((session) => ({ ...session }))
    },
    async createSession(input) {
      await wait(delayMs)
      const created: Session = {
        id: `session-${nextId++}`,
        title: input.title,
        status: 'scheduled',
        startsAt: input.startsAt,
      }
      sessions.push(created)
      return { ...created }
    },
  }
}
