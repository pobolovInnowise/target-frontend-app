export const TITLE_MIN_LENGTH = 3
export const TITLE_MAX_LENGTH = 80

export interface SessionFormErrors {
  title?: string
  startsAt?: string
}

/**
 * Validates the create-session form. An empty result means the input is valid.
 * `dateTimeLocal` is a `datetime-local` value, interpreted as browser local time.
 */
export function validateSessionForm(
  title: string,
  dateTimeLocal: string,
  now: number,
): SessionFormErrors {
  const errors: SessionFormErrors = {}

  const trimmedTitle = title.trim()
  if (trimmedTitle.length === 0) {
    errors.title = 'Title is required. Enter 3 to 80 characters.'
  } else if (
    trimmedTitle.length < TITLE_MIN_LENGTH ||
    trimmedTitle.length > TITLE_MAX_LENGTH
  ) {
    errors.title = `Title must be ${TITLE_MIN_LENGTH} to ${TITLE_MAX_LENGTH} characters long.`
  }

  if (dateTimeLocal === '') {
    errors.startsAt = 'Date and time are required. Choose a future date and time.'
  } else {
    const startsAt = Date.parse(dateTimeLocal)
    if (Number.isNaN(startsAt) || startsAt <= now) {
      errors.startsAt = 'Date and time must be in the future. Choose a later date and time.'
    }
  }

  return errors
}
