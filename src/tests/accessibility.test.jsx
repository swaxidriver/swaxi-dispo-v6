import { axe, toHaveNoViolations } from 'jest-axe'

import App from '../App'

import { renderWithProviders } from './testUtils'

expect.extend(toHaveNoViolations)

describe('Accessibility smoke test', () => {
  it('has no obvious a11y violations on dashboard route', async () => {
    // Ensure location matches Router basename to avoid warning
    window.history.pushState({}, '', '/swaxi-dispo-v6/')
    const { container } = renderWithProviders(<App />)
    // Wait a tick for skeleton to swap out
    await new Promise(r => setTimeout(r, 70))
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
