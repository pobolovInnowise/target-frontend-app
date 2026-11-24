import type { Session } from './types'

const startsAtFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

interface SessionListProps {
  sessions: Session[]
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return <p className="empty">No sessions to show.</p>
  }

  return (
    <ul className="session-list">
      {sessions.map((session) => (
        <li key={session.id} className="session-row">
          <span className="session-title">{session.title}</span>
          <span className={`session-status status-${session.status}`}>
            {session.status}
          </span>
          <time dateTime={session.startsAt}>
            {startsAtFormat.format(new Date(session.startsAt))}
          </time>
        </li>
      ))}
    </ul>
  )
}
