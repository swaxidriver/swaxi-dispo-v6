import { useAuth } from '../contexts/useAuth'

function Login() {
  const { login, logout, user, mockUsers } = useAuth()

  if (user) {
    return (
      <div className="p-4">
        <p>Welcome, {user.name} ({user.role})</p>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded mt-2">
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Select a role to login:</h2>
      <div className="flex space-x-2">
        {Object.keys(mockUsers).map((role) => (
          <button
            key={role}
            onClick={() => login(role)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Login as {mockUsers[role].role}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Login
