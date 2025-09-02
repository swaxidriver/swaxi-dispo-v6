import { useAuth } from "../contexts/useAuth";

function Login() {
  const { login, logout, user, mockUsers } = useAuth();

  if (user) {
    return (
      <div className="p-4" aria-labelledby="login-heading">
        <h1 id="login-heading" className="text-xl font-bold mb-2">
          Benutzer
        </h1>
        <p>
          Angemeldet als: {user.name} ({user.role})
        </p>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded mt-2"
        >
          Abmelden
        </button>
      </div>
    );
  }

  return (
    <div className="p-4" aria-labelledby="login-heading">
      <h1 id="login-heading" className="text-xl font-bold mb-2">
        Rolle wählen zum Anmelden
      </h1>
      <div className="flex space-x-2">
        {Object.keys(mockUsers).map((role) => (
          <button
            key={role}
            onClick={() => login(role)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Anmelden als {mockUsers[role].role}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Login;
