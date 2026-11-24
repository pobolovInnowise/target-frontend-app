import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SessionsApi } from './sessionsApi'
import { SessionsWorkspace } from './SessionsWorkspace'
import type { Session } from './types'

const FUTURE_LOCAL_DATE_TIME = '2099-12-31T10:00'

const initialSessions: Session[] = [
  {
    id: 's1',
    title: 'Onboarding workshop',
    status: 'scheduled',
    startsAt: '2099-01-10T09:00:00.000Z',
  },
  {
    id: 's2',
    title: 'React fundamentals',
    status: 'completed',
    startsAt: '2020-09-15T13:30:00.000Z',
  },
  {
    id: 's3',
    title: 'Testing with Vitest',
    status: 'cancelled',
    startsAt: '2020-11-01T15:00:00.000Z',
  },
]

function createFakeApi() {
  const listSessions = vi.fn<SessionsApi['listSessions']>(async () =>
    initialSessions.map((session) => ({ ...session })),
  )
  const createSession = vi.fn<SessionsApi['createSession']>(async (input) => ({
    id: 'created-1',
    status: 'scheduled',
    ...input,
  }))
  const api: SessionsApi = { listSessions, createSession }
  return { api, listSessions, createSession }
}

describe('SessionsWorkspace', () => {
  it('creates a session through the form and shows it in the list (AC-14)', async () => {
    const user = userEvent.setup()
    const { api, listSessions, createSession } = createFakeApi()

    render(<SessionsWorkspace api={api} />)

    // List loaded through the injected boundary (AC-1).
    expect(await screen.findByText('Onboarding workshop')).toBeInTheDocument()
    expect(screen.getByText('React fundamentals')).toBeInTheDocument()
    expect(screen.getByText('Testing with Vitest')).toBeInTheDocument()

    // Filtering shows only the chosen status, without a new request (AC-5).
    await user.click(screen.getByRole('button', { name: 'completed' }))
    expect(screen.getByRole('button', { name: 'completed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('React fundamentals')).toBeInTheDocument()
    expect(screen.queryByText('Onboarding workshop')).not.toBeInTheDocument()
    expect(screen.queryByText('Testing with Vitest')).not.toBeInTheDocument()
    expect(listSessions).toHaveBeenCalledTimes(1)

    // Open the form and submit a valid session (AC-6, AC-7, AC-8).
    await user.click(screen.getByRole('button', { name: 'New session' }))
    await user.type(screen.getByLabelText('Title'), '  Team retro  ')
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: FUTURE_LOCAL_DATE_TIME },
    })
    await user.click(screen.getByRole('button', { name: 'Create session' }))

    // New session is visible with status `scheduled` (AC-10).
    expect(await screen.findByText('Team retro')).toBeInTheDocument()
    expect(createSession).toHaveBeenCalledTimes(1)
    expect(createSession).toHaveBeenCalledWith({
      title: 'Team retro',
      startsAt: new Date(FUTURE_LOCAL_DATE_TIME).toISOString(),
    })
    const createdRow = screen.getByText('Team retro').closest('li')
    expect(createdRow).not.toBeNull()
    expect(within(createdRow as HTMLElement).getByText('scheduled')).toBeInTheDocument()

    // Filter is reset to `All` so the new session is never hidden (D1, AC-11).
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'completed' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByText('Onboarding workshop')).toBeInTheDocument()

    // Form is closed after success (D5).
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Create session' }),
    ).not.toBeInTheDocument()
  })

  it('rejects an invalid title and a past date without calling the API (AC-7, AC-8)', async () => {
    const user = userEvent.setup()
    const { api, createSession } = createFakeApi()

    render(<SessionsWorkspace api={api} />)
    await screen.findByText('Onboarding workshop')

    await user.click(screen.getByRole('button', { name: 'New session' }))
    await user.type(screen.getByLabelText('Title'), '  ab  ')
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2000-01-01T10:00' },
    })
    await user.click(screen.getByRole('button', { name: 'Create session' }))

    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(2)
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription(
      /3 to 80 characters/,
    )
    expect(screen.getByLabelText('Date and time')).toHaveAccessibleDescription(
      /must be in the future/,
    )
    expect(createSession).not.toHaveBeenCalled()
  })
})
