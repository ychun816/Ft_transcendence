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
                router.navigate('/game');
            });
        } else {
            alert(i18n.t('auth.login_error') + ": " + (data.message || i18n.t('auth.invalid_credentials')));
        }
    } catch (error) {
        console.error("Login error:", error);
        alert(i18n.t('auth.login_error') + ": " + (error || "Please try again."));
    }
}