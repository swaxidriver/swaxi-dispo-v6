import { render, screen } from '@testing-library/react'

// Force flag evaluation before component import (guard for environments without process)
if (typeof process !== 'undefined') {
  // eslint-disable-next-line no-undef
  process.env.VITE_ENABLE_SHAREPOINT = 'false'
}

jest.mock('../contexts/useShifts', () => ({
  useShifts: () => ({
    state: {
      dataSource: 'localStorage',
      isOnline: false,
      lastSync: null,
    }
  })
}))

import ConnectionStatus from '../components/ConnectionStatus'

describe('ConnectionStatus feature flag badge', () => {
  it('renders SP deaktiviert badge when sharepoint flag off', () => {
    render(<ConnectionStatus />)
    expect(screen.getByTestId('sharepoint-flag-off')).toHaveTextContent(/SP deaktiviert/i)
  })
})
