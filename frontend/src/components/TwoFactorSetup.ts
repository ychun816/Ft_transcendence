import { setupTOTP, send2FACode, verifyEmail2FA, verifyTOTP } from '../services/twoFactorService.js';

export function createTwoFactorSetup(userId: number): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex flex-col gap-4';

    let method: 'email' | 'totp' | null = null;
    let step: 'choose' | 'code' | 'totp-setup' | 'done' = 'choose';
    let totpInfo: { otpauth_url: string; secret: string } | null = null;
    let error: string | null = null;

    function render() {
        container.innerHTML = '';

        if (step === 'choose') {
            const title = document.createElement('h2');
            title.textContent = 'Enable Two-Factor Authentication';
            container.appendChild(title);

            const emailBtn = document.createElement('button');
            emailBtn.className = 'btn';
            emailBtn.textContent = 'Email 2FA';
            emailBtn.onclick = () => {
                method = 'email';
                step = 'code';
                render();
            };
            container.appendChild(emailBtn);

            const totpBtn = document.createElement('button');
            totpBtn.className = 'btn';
            totpBtn.textContent = 'Authenticator App (TOTP)';
            totpBtn.onclick = async () => {
                totpBtn.disabled = true;
                try {
                    totpInfo = await setupTOTP(userId);
                    method = 'totp';
                    step = 'totp-setup';
                } catch {
                    error = 'Failed to setup TOTP';
                }
                totpBtn.disabled = false;
                render();
            };
            container.appendChild(totpBtn);

            if (error) {
                const errDiv = document.createElement('div');
                errDiv.className = 'text-red-500';
                errDiv.textContent = error;
                container.appendChild(errDiv);
            }
        }

        if (step === 'code' && method === 'email') {
            const sendBtn = document.createElement('button');
            sendBtn.className = 'btn';
            sendBtn.textContent = 'Send Code';
            sendBtn.onclick = async () => {
                sendBtn.disabled = true;
                try {
                    await send2FACode(userId);
                } catch {
                    error = 'Failed to send code';
                }
                sendBtn.disabled = false;
                render();
            };
            container.appendChild(sendBtn);

            container.appendChild(createTwoFactorCodeInput(async (code) => {
                const res = await verifyEmail2FA(userId, code);
                if (res.error) {
                    error = res.error;
                } else {
                    step = 'done';
                }
                render();
            }, error || undefined));
        }

        if (step === 'totp-setup' && totpInfo) {
            const qrTitle = document.createElement('h3');
            qrTitle.textContent = 'Scan this QR code with your authenticator app:';
            container.appendChild(qrTitle);

            const qrImg = document.createElement('img');
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(totpInfo.otpauth_url)}&size=200x200`;
            qrImg.alt = 'TOTP QR';
            container.appendChild(qrImg);

            const secretDiv = document.createElement('div');
            secretDiv.innerHTML = `Or enter this secret: <b>${totpInfo.secret}</b>`;
            container.appendChild(secretDiv);

            container.appendChild(createTwoFactorCodeInput(async (code) => {
                const res = await verifyTOTP(userId, code);
                if (res.error) {
                    error = res.error;
                } else {
                    step = 'done';
                }
                render();
            }, error || undefined));
        }

        if (step === 'done') {
            const doneDiv = document.createElement('div');
            doneDiv.className = 'text-green-600';
            doneDiv.textContent = 'Two-Factor Authentication enabled!';
            container.appendChild(doneDiv);
        }
    }

    render();
    return container;
}

// Helper: import this from the next file or place below
import { createTwoFactorCodeInput } from './TwoFactorCodeInput.js';