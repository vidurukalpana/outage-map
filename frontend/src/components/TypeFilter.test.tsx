import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TypeFilter from './TypeFilter'

describe('TypeFilter', () => {
  it('hides a type when its chip is tapped', () => {
    const onChange = vi.fn()
    render(<TypeFilter selected={['power', 'water', 'internet', 'road']} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Water/ }))

    expect(onChange).toHaveBeenCalledWith(['power', 'internet', 'road'])
  })
})
