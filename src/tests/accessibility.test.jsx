import { renderWithProviders } from './testUtils'
import App from '../App'
import { axe, toHaveNoViolations } from 'jest-axe'
import { BrowserRouter } from 'react-router-dom'

expect.extend(toHaveNoViolations)

describe('Accessibility smoke test', () => {
  it('has no obvious a11y violations on dashboard route', async () => {
    const { container } = renderWithProviders(
      <BrowserRouter basename="/swaxi-dispo-v6">
        <App />
      </BrowserRouter>
    )
    // Wait a tick for skeleton to swap out
    await new Promise(r => setTimeout(r, 70))
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
