import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createReport } from '../api/client'
import ReportForm from './ReportForm'

vi.mock('../api/client', () => ({ createReport: vi.fn() }))

function renderForm() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReportForm lat={6.927} lng={79.861} onClose={() => {}} onSent={() => {}} />
    </QueryClientProvider>,
  )
}

afterEach(cleanup)

describe('ReportForm', () => {
  it('cannot be submitted until a type is chosen', () => {
    renderForm()
    const submit = screen.getByRole<HTMLButtonElement>('button', { name: 'Report' })

    expect(submit.disabled).toBe(true)
    fireEvent.click(submit)
    expect(createReport).not.toHaveBeenCalled()
  })

  it('limits the note to 140 characters with a live counter', () => {
    renderForm()
    const note = screen.getByPlaceholderText<HTMLTextAreaElement>('Optional note')

    fireEvent.change(note, { target: { value: 'No power' } })

    expect(note.maxLength).toBe(140)
    expect(screen.getByText('8/140')).toBeTruthy()
  })
})
