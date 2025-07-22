import React, { useState } from "react";

const TwoFactorVerifyPage: React.FC = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const username = sessionStorage.getItem("pending2FAUser");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const response = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, code }),
    });
    const data = await response.json();

    if (data.success && data.token) {
      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("username", username || "");
      window.location.href = "/home"; // or use your router
    } else {
      setError(data.message || "Invalid code");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
        <h2 className="mb-4">Enter your 2FA code</h2>
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="neon-input text-center font-mono mb-4"
          placeholder="6-digit code"
          required
        />
        <button type="submit" className="neon-btn neon-btn-primary w-full mb-2">
          Verify & Login
        </button>
        {error && <div className="text-red-500">{error}</div>}
      </form>
    </div>
  );
};

export default TwoFactorVerifyPage;