export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export type StatusFilter = 'all' | SessionStatus

export interface Session {
  id: string
  title: string
  status: SessionStatus
  /** ISO 8601 */
  startsAt: string
}

export interface NewSessionInput {
  /** Already trimmed. */
  title: string
  /** ISO 8601 */
  startsAt: string
}
