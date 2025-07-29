import { AuthService } from "../middleware/auth.js";
import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { classes } from "../styles/retroStyles.js";

// Créer une instance locale (pas de singleton)
const authService = new AuthService();

export function createLoginPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const renderContent = () => {
		page.innerHTML = `
		<style>
			/* Import de la police Orbitron pour le thème rétro */
			@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
			
			* {
				font-family: 'Orbitron', monospace;
			}
		</style>
		
		<!-- Champ d'étoiles -->
		<div class="${classes.starfield}"></div>
		<div class="absolute top-4 left-4 z-50">
			<div class="login-dropdown">
				<button class="${classes.backButton}" id="backToGame" data-route="/game">
					← ${i18n.t('game.back')}
				</button>
			</div>
		</div>
		<!-- Conteneur principal avec effet scan -->
		<div class="min-h-screen flex flex-col items-center justify-center p-4 ${classes.scanLinesContainer}">
			
			<!-- Titre principal avec effet néon -->
			<h1 class="${classes.retroTitle} mb-12">
				🔐 ${i18n.t('auth.login_title')}
			</h1>
			
			<!-- Panneau de connexion -->
			<div class="${classes.retroPanel} rounded-2xl p-8 max-w-md w-full">
				<form class="space-y-6">
					<div>
						<input 
							type="text" 
							placeholder="${i18n.t('auth.username')}" 
							id="username" 
							required 
							class="${classes.tournamentInput}"
						>
					</div>
					<div>
						<input 
							type="password" 
							placeholder="${i18n.t('auth.password')}" 
							id="password" 
							required 
							class="${classes.tournamentInput}"
						>
					</div>
					<button type="submit" id="login-btn" class="${classes.actionButton} w-full text-xl py-4">
						<span class="relative z-10">✨ ${i18n.t('common.login')}</span>
					</button>
				</form>
				<button type="button" id="register-btn" class="${classes.gameModeButton} w-full mt-6">
					<span class="relative z-10">📝 ${i18n.t('common.register')}</span>
				</button>
			</div>
		</div>
		
		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		`;
		
		//page.innerHTML = createNeonContainer(content);
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
		
		// Re-attach event listeners after re-render
		attachEventListeners();
	};
	
	const attachEventListeners = () => {
		const form = page.querySelector('form') as HTMLFormElement;
		const signupBtn = page.querySelector('#register-btn') as HTMLButtonElement;
		const backToGame = page.querySelector('#backToGame')

		if (backToGame) {
			backToGame.addEventListener("click", () => {
				import("../router/router.js").then(({ router }) => {
					router.navigate("/game");
				});
			});
		}
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
                router.navigate('/game');
            });
        } else if (data.requires2FA) {
            // Save username for 2FA verification step
            sessionStorage.setItem('pending2FAUser', UserInfo.username);
            // Redirect to 2FA verification page
            import("../router/router.js").then(({ router }) => {
                router.navigate('/2fa-verify');
            // // Show 2FA input
            // show2FAInput(page);
            // alert(data.message || i18n.t('auth.2fa_required'));
            });
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

    function show2FAInput(page: HTMLDivElement): void {
    // Find the login form
    const form = page.querySelector('form.space-y-6') as HTMLFormElement;
    if (!form) return;

    // Prevent duplicate 2FA input
    if (form.querySelector('#two-factor-token')) return;

    // Create 2FA input field
    const twoFactorDiv = document.createElement('div');
    twoFactorDiv.className = "mt-2";
    const twoFactorInput = document.createElement('input');
    twoFactorInput.type = 'text';
    twoFactorInput.id = 'two-factor-token';
    twoFactorInput.placeholder = i18n.t('auth.2fa_code') || '6-digit code';
    twoFactorInput.maxLength = 6;
    twoFactorInput.className = 'neon-input text-center font-mono';
    twoFactorInput.required = true;

    // Only allow digits
    twoFactorInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = target.value.replace(/\D/g, '').slice(0, 6);
    });

    twoFactorDiv.appendChild(twoFactorInput);

    // Insert 2FA input before the submit button
    const submitButton = form.querySelector('#login-btn');
    if (submitButton) {
        form.insertBefore(twoFactorDiv, submitButton);

        // Change button text for clarity
        submitButton.textContent = i18n.t('auth.verify_and_login') || 'Verify & Login';
    }

    // Focus on the 2FA input
    twoFactorInput.focus();
}
    // Check if 2FA input already exists
    // if (form.querySelector('#two-factor-token')) {
    //     return;
    // }

    // // Create 2FA input field
    // const twoFactorInput = document.createElement('input');
    // twoFactorInput.type = 'text';
    // twoFactorInput.id = 'two-factor-token';
    // twoFactorInput.placeholder = i18n.t('auth.2fa_code') || '6-digit code';
    // twoFactorInput.maxLength = 6;
    // twoFactorInput.className = 'input text-center font-mono';
    // twoFactorInput.required = true;

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
