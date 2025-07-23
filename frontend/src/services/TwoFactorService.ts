// Service for calling backend 2FA endpoints
// Usage: import { send2FACode, verifyEmail2FA, setupTOTP, verifyTOTP, disable2FA } from './twoFactorService';

const API_BASE = '/api/2fa';

export async function get2FAStatus(userId: number) {
  const res = await fetch(`/api/profile/${userId}/2fa-status`);
  return await res.json();
}

export async function send2FACode(userId: number) {
  return fetch(`${API_BASE}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  }).then(res => res.json());
}

export async function verifyEmail2FA(userId: number, code: string) {
  return fetch(`${API_BASE}/email/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code })
  }).then(res => res.json());
}

export async function setupTOTP(userId: number) {
  return fetch(`${API_BASE}/totp/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  }).then(res => res.json());
}

export async function verifyTOTP(userId: number, code: string) {
  return fetch(`${API_BASE}/totp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code })
  }).then(res => res.json());
}

export async function disable2FA(userId: number, password: string) {
  return fetch(`${API_BASE}/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password })
  }).then(res => res.json());
}
