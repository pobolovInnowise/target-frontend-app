import type { NewSessionInput, Session } from './types'

/** Replaceable request boundary for training sessions. */
export interface SessionsApi {
  /** Rejects on failure. */
  listSessions(): Promise<Session[]>
  /** Resolves with the created session; the API assigns `id` and status `scheduled`. */
  createSession(input: NewSessionInput): Promise<Session>
}
