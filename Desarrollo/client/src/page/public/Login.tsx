import React from "react";
import { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, resetPassword } = useUser();
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/home");
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message ||
            "Error en el inicio de sesión. Por favor, intente de nuevo."
        );
      } else {
        setError("Ocurrió un error inesperado. Por favor, intente de nuevo.");
      }
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, ingrese su correo electrónico primero");
      return;
    }

    try {
      await resetPassword(email);
      setResetSent(true);
      setError("");
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message ||
            "Error al enviar el correo de recuperación. Por favor, intente de nuevo."
        );
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg">
        <h3 className="text-2xl font-bold text-center text-gray-800">
          Iniciar sesión
        </h3>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="mt-4">
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="email"
              >
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your Email"
                required
                className="w-full px-4 py-2 mt-2 border rounded-md
              focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                required
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-baseline justify-between">
              <button
                type="submit"
                className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Login
              </button>
              <button
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            {resetSent && (
              <p className="text-green-500 text-sm mt-2">
                Se ha enviado un correo de recuperación. Por favor, revise su
                bandeja de entrada.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
