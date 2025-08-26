// Removed unused global eslint-disable
import { render, screen, fireEvent } from '@testing-library/react'
import { ShiftProvider } from '../contexts/ShiftContext'
import AuthContext from '../contexts/AuthContext'
import NotificationMenu from '../components/NotificationMenu'

describe('NotificationMenu', () => {
  const authValue = { user: { name: 'Tester', role: 'admin' } }
  const wrapper = (children) => render(
    <AuthContext.Provider value={authValue}>
      <ShiftProvider>
        {children}
      </ShiftProvider>
    </AuthContext.Provider>
  )

  it('marks single notification read', () => {
    localStorage.setItem('shifts', JSON.stringify([]))
    localStorage.setItem('notifications', JSON.stringify([
      { id: 'n1', title: 'Test', message: 'Message', timestamp: 'now', isRead: false }
    ]))
    wrapper(<NotificationMenu />)
    fireEvent.click(screen.getByRole('button', { name: /view notifications/i }))
    const markBtn = screen.getByText('Gelesen')
    fireEvent.click(markBtn)
    // button should disappear after marking read
    expect(screen.queryByText('Gelesen')).toBeNull()
  })

  it('marks all notifications read', () => {
    localStorage.setItem('shifts', JSON.stringify([]))
    localStorage.setItem('notifications', JSON.stringify([
      { id: 'n1', title: 'Test1', message: 'Message', timestamp: 'now', isRead: false },
      { id: 'n2', title: 'Test2', message: 'Message', timestamp: 'now', isRead: false }
    ]))
    wrapper(<NotificationMenu />)
    fireEvent.click(screen.getByRole('button', { name: /view notifications/i }))
    fireEvent.click(screen.getByText('Alle gelesen'))
    expect(screen.queryAllByText('Gelesen').length).toBe(0)
  })
})
