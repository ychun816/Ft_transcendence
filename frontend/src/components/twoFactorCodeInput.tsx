//TRYING TO START
//TO UNDERSTAND TSX SYNTAXXXXXXXX!!!!!

import React, { useState } from 'react';

interface TwoFactorCodeInputProps {
  onSubmit: (code: string) => void;
  loading?: boolean;
  error?: string;
}

const TwoFactorCodeInput: React.FC<TwoFactorCodeInputProps> = ({ onSubmit, loading, error }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
      <label htmlFor="twoFactorCode">Enter 2FA Code</label>
      <input
        id="twoFactorCode"
        type="text"
        maxLength={6}
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
        pattern="[0-9]{6}"
        autoComplete="one-time-code"
        className="border rounded px-2 py-1 text-center text-lg tracking-widest"
        disabled={loading}
        required
      />
      <button type="submit" className="btn btn-primary w-full" disabled={loading || code.length !== 6}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </form>
  );
};

export default TwoFactorCodeInput;