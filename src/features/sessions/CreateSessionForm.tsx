import { useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import type { NewSessionInput } from './types'
import { validateSessionForm } from './validation'
import type { SessionFormErrors } from './validation'

interface CreateSessionFormProps {
  isSubmitting: boolean
  onSubmit: (input: NewSessionInput) => Promise<void>
  onCancel: () => void
}

export function CreateSessionForm({
  isSubmitting,
  onSubmit,
  onCancel,
}: CreateSessionFormProps) {
  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [errors, setErrors] = useState<SessionFormErrors>({})
  const titleRef = useRef<HTMLInputElement>(null)
  const dateTimeRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const nextErrors = validateSessionForm(title, dateTime, Date.now())
    setErrors(nextErrors)
    if (nextErrors.title) {
      titleRef.current?.focus()
      return
    }
    if (nextErrors.startsAt) {
      dateTimeRef.current?.focus()
      return
    }

    await onSubmit({
      title: title.trim(),
      startsAt: new Date(dateTime).toISOString(),
    })
  }

  return (
    <form className="create-form" noValidate onSubmit={handleSubmit}>
      <h2>New session</h2>

      <div className="field">
        <label htmlFor="session-title">Title</label>
        <input
          ref={titleRef}
          id="session-title"
          name="title"
          type="text"
          autoComplete="off"
          value={title}
          disabled={isSubmitting}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'session-title-error' : undefined}
          onChange={(event) => setTitle(event.target.value)}
        />
        {errors.title ? (
          <p id="session-title-error" role="alert" className="field-error">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="session-starts-at">Date and time</label>
        <input
          ref={dateTimeRef}
          id="session-starts-at"
          name="startsAt"
          type="datetime-local"
          autoComplete="off"
          value={dateTime}
          disabled={isSubmitting}
          aria-invalid={errors.startsAt ? true : undefined}
          aria-describedby={errors.startsAt ? 'session-starts-at-error' : undefined}
          onChange={(event) => setDateTime(event.target.value)}
        />
        {errors.startsAt ? (
          <p id="session-starts-at-error" role="alert" className="field-error">
            {errors.startsAt}
          </p>
        ) : null}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          Create session
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
