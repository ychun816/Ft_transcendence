import { AuthService } from "../middleware/auth.js";
import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

// Créer une instance locale (pas de singleton)
const authService = new AuthService();

export function createLoginPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "page-centered fade-in";

	const renderContent = () => {
		page.innerHTML = `
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="card max-w-md w-full slide-up">
				<h1 class="page-title text-4xl text-center mb-8">${i18n.t('auth.login_title')}</h1>
				<form class="space-y-4">
					<input type="text" placeholder="${i18n.t('auth.username')}" id="username" required class="input">
					<input type="password" placeholder="${i18n.t('auth.password')}" id="password" required class="input">
					<button type="submit" id="login-btn" class="btn-primary w-full">${i18n.t('common.login')}</button>
				</form>
				<button type="button" id="register-btn" class="btn-secondary w-full mt-4">${i18n.t('common.register')}</button>
			</div>
		`;
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
		
		// Re-attach event listeners after re-render
		attachEventListeners();
	};
	
	const attachEventListeners = () => {
		const form = page.querySelector('.space-y-4') as HTMLFormElement;
		const signupBtn = page.querySelector('#register-btn') as HTMLButtonElement;
		
		if (form) {
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				sendLogInInfo(page);
			});
		}
		
		if (signupBtn) {
			signupBtn.addEventListener("click", () => {
				import("../router/router.js").then(({ router }) => {
					router.navigate("/signup");
				});
			});
		}
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);
	return page;
}

export async function requireAuth(): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) {
        import("../router/router.js").then(({ router }) => {
            router.navigate('/login');
        });
        return false;
    }
    return true;
}

async function sendLogInInfo(page: HTMLDivElement): Promise<void> {
    const usernameInput = page.querySelector("#username") as HTMLInputElement;
    const passwordInput = page.querySelector("#password") as HTMLInputElement;
    const twoFactorInput = page.querySelector("#two-factor-token") as HTMLInputElement;

    const UserInfo = {
        username: usernameInput.value,
        password: passwordInput.value,
        twoFactorToken: twoFactorInput?.value || undefined,
    };

    try {
        console.log("🔍 Sending login request with:", UserInfo);
        
        const response = await fetch("/api/login", {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(UserInfo),
        });
        
        console.log("🔍 Login response status:", response.status);
        console.log("🔍 Login response headers:", response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("🔍 Login response data:", data);
        
        if (data.success) {
            // Store the JWT token in sessionStorage
            sessionStorage.setItem('authToken', data.token);
            // Store username for convenience
            sessionStorage.setItem('username', data.user.username);
            
            console.log("🔑 Login success - Stored token:", data.token);
            console.log("🔑 Login success - Stored username:", data.user.username);
            
            await authService.getCurrentUser();
            import("../router/router.js").then(({ router }) => {
                router.navigate('/home');
            });
        } else if (data.requires2FA) {
            // Show 2FA input
            show2FAInput(page);
            alert(data.message || i18n.t('auth.2fa_required'));
        } else {
            alert(i18n.t('auth.login_error') + ": " + (data.message || i18n.t('auth.invalid_credentials')));
        }
    } catch (error) {
        console.error("Login error:", error);
        alert(i18n.t('auth.login_error') + ": " + (error || "Please try again."));
    }
}

function show2FAInput(page: HTMLDivElement): void {
    const form = page.querySelector('.space-y-4') as HTMLFormElement;
    
    // Check if 2FA input already exists
    if (form.querySelector('#two-factor-token')) {
        return;
    }

    // Create 2FA input field
    const twoFactorInput = document.createElement('input');
    twoFactorInput.type = 'text';
    twoFactorInput.id = 'two-factor-token';
    twoFactorInput.placeholder = i18n.t('auth.2fa_code') || '6-digit code';
    twoFactorInput.maxLength = 6;
    twoFactorInput.className = 'input text-center font-mono';
    twoFactorInput.required = true;

    // Format input (digits only)
    twoFactorInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = target.value.replace(/\D/g, '').slice(0, 6);
    });

    // Insert before the submit button
    const submitButton = form.querySelector('#login-btn');
    if (submitButton) {
        form.insertBefore(twoFactorInput, submitButton);
        
        // Update button text
        submitButton.textContent = i18n.t('auth.verify_and_login') || 'Verify & Login';
    }

    // Focus on the 2FA input
    twoFactorInput.focus();
}
