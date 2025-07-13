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

    const UserInfo = {
        username: usernameInput.value,
        password: passwordInput.value,
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
        } else {
            alert(i18n.t('auth.login_error') + ": " + (data.message || i18n.t('auth.invalid_credentials')));
        }
    } catch (error) {
        console.error("Login error:", error);
        alert(i18n.t('auth.login_error') + ": " + (error || "Please try again."));
    }
}
