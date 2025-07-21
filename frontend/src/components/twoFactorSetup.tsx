import React, { useState } from 'react';
import TwoFactorCodeInput from './twoFactorCodeInput';
import {
  send2FACode,
  verifyEmail2FA,
  setupTOTP,
  verifyTOTP,
  disable2FA
} from '../services/twoFactorService';

interface TwoFactorSetupProps {
  userId: number;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ userId }) => {
  const [method, setMethod] = useState<'email' | 'totp' | null>(null);
  const [step, setStep] = useState<'choose' | 'code' | 'totp-setup' | 'done'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totpInfo, setTotpInfo] = useState<{ otpauth_url: string; secret: string } | null>(null);

  // Step 1: Choose method
  if (step === 'choose') {
    return (
      <div className="flex flex-col gap-4">
        <h2>Enable Two-Factor Authentication</h2>
        <button className="btn" onClick={() => { setMethod('email'); setStep('code'); }}>Email 2FA</button>
        <button className="btn" onClick={async () => {
          setLoading(true);
          setMethod('totp');
          try {
            const info = await setupTOTP(userId);
            setTotpInfo(info);
            setStep('totp-setup');
          } catch (e) {
            setError('Failed to setup TOTP');
          } finally {
            setLoading(false);
          }
        }}>Authenticator App (TOTP)</button>
        {error && <div className="text-red-500">{error}</div>}
      </div>
    );
  }

  // Step 2: Email code entry
  if (step === 'code' && method === 'email') {
    return (
      <div className="flex flex-col gap-2">
        <button className="btn" onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            await send2FACode(userId);
          } catch (e) {
            setError('Failed to send code');
          } finally {
            setLoading(false);
          }
        }}>Send Code</button>
        <TwoFactorCodeInput
          onSubmit={async (code) => {
            setLoading(true);
            setError(null);
            const res = await verifyEmail2FA(userId, code);
            if (res.error) {
              setError(res.error);
            } else {
              setStep('done');
            }
            setLoading(false);
          }}
          loading={loading}
          error={error || undefined}
        />
      </div>
    );
  }

  // Step 3: TOTP setup
  if (step === 'totp-setup' && totpInfo) {
    return (
      <div className="flex flex-col gap-2">
        <h3>Scan this QR code with your authenticator app:</h3>
        <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(totpInfo.otpauth_url)}&size=200x200`} alt="TOTP QR" />
        <div>Or enter this secret: <b>{totpInfo.secret}</b></div>
        <TwoFactorCodeInput
          onSubmit={async (code) => {
            setLoading(true);
            setError(null);
            const res = await verifyTOTP(userId, code);
            if (res.error) {
              setError(res.error);
            } else {
              setStep('done');
            }
            setLoading(false);
          }}
          loading={loading}
          error={error || undefined}
        />
      </div>
    );
  }

  // Step 4: Done
  if (step === 'done') {
    return <div className="text-green-600">Two-Factor Authentication enabled!</div>;
  }

  return null;
};

export default TwoFactorSetup;
