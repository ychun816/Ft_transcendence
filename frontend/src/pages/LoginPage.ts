import { AuthService } from "../middleware/auth.js";
import { i18n } from "../services/i18n.js";
import { errorNotif } from "../services/errorNotification.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { classes } from "../styles/retroStyles.js";
import { getUserInfo } from "./ChatPage.js";

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
							class="w-full px-4 py-3 rounded-lg bg-slate-700 border-2 border-slate-500 text-white text-lg font-semibold placeholder-slate-300 focus:bg-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 hover:border-slate-400 transition-all duration-300"
						>
					</div>
					<div>
						<input
							type="password"
							placeholder="${i18n.t('auth.password')}"
							id="password"
							required
							class="w-full px-4 py-3 rounded-lg bg-slate-700 border-2 border-slate-500 text-white text-lg font-semibold placeholder-slate-300 focus:bg-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 hover:border-slate-400 transition-all duration-300"
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
		const googleSigninBtn = page.querySelector('#google-signin-btn') as HTMLButtonElement;
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

		if (googleSigninBtn) {
			googleSigninBtn.addEventListener("click", () => {
				handleGoogleSignIn();
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

async function handleGoogleSignIn(): Promise<void> {
	try {
		// Redirect directly to Google OAuth (no popup)
		window.location.href = '/api/auth/google';
	} catch (error) {
		console.error('Google Sign-In error:', error);
		alert(i18n.t('auth.google_signin_error') || 'Google Sign-In failed');
	}
}

async function registerActiveSessions()
{
	const currentUser = sessionStorage.getItem("currentUser");
	let username = null;

	if (currentUser) {
		try {
			const user = JSON.parse(currentUser);
			username = user.username;
		} catch (e) {
			console.error("Error parsing user data:", e);
		}
	}

	const userId = sessionStorage.getItem("userId");
	if (userId) {
		// Si on a déjà l'userId en cache, on peut démarrer plus vite
		const userData = {
			id: parseInt(userId),
			username: username,
		};
		addActiveSessions(userData);
	} else {
		// Sinon, on récupère les données avec un timeout
		const userInfoPromise = getUserInfo();
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error("User info timeout")), 3000);
		});

		Promise.race([userInfoPromise, timeoutPromise])
			.then((userData) => {
				if (userData && userData.id) {
					sessionStorage.setItem("userId", userData.id.toString());
					addActiveSessions(userData);
				} else {
					throw new Error("Invalid user data");
				}
			})
	}
}

async function addActiveSessions(userData: any)
{
	let ws: WebSocket | null = null;
	function connectWebSocket() {
		ws = new WebSocket(
			`wss://localhost:3002/ws/login?username=${encodeURIComponent(userData.username)}&userId=${userData.id}`
		);

		ws.onopen = () => {
			console.log("🔗 WebSocket connected");
		};

		ws.onclose = () => {
			console.log("🔌 WebSocket disconnected");
		};

		ws.onerror = (error) => {
			console.error("❌ WebSocket error:", error);
		};
	}
	connectWebSocket();
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
		const response = await fetch("/api/login", {
			method: "POST",
			credentials: 'include',
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(UserInfo),
		});

		if (!response.ok) {
			const errorText = await response.text();
			let errorData;

			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { message: errorText };
			}

			// Gérer différents types d'erreurs avec traductions
			switch (response.status) {
				case 400:
					if (errorData.message?.includes('username')) {
						errorNotif.showFieldError('username', 'username_required');
					} else if (errorData.message?.includes('password')) {
						errorNotif.showFieldError('password', 'password_required');
					} else {
						errorNotif.showErrorBanner('check_information', 'warning');
					}
					break;

				case 401:
					if (errorData.message?.includes('User not found')) {
						errorNotif.showFieldError('username', 'user_not_found');
						errorNotif.showErrorBanner('user_not_found_banner');
					} else if (errorData.message?.includes('Wrong password')) {
						errorNotif.showFieldError('password', 'wrong_password');
						errorNotif.showErrorBanner('wrong_password_banner');
					} else if (errorData.message?.includes('Invalid 2FA')) {
						errorNotif.showFieldError('two-factor-token', 'invalid_2fa');
						errorNotif.showErrorBanner('invalid_2fa_banner');
					} else {
						errorNotif.showErrorBanner('invalid_credentials');
					}
					break;

				case 429:
					errorNotif.showErrorBanner('too_many_attempts', 'warning');
					break;

				case 500:
					errorNotif.showErrorBanner('server_error');
					break;

				default:
					errorNotif.showErrorBanner('connection_error', 'error', { status: response.status.toString() });
			}
			return;
		}

		// Succès
		const data = await response.json();

		if (data.success) {
			sessionStorage.setItem('authToken', data.token);
			sessionStorage.setItem('username', data.user.username);

			errorNotif.showSuccessMessage('welcome_message', { username: data.user.username });

			setTimeout(() => {
				import("../router/router.js").then(({ router }) => {
					router.navigate('/game');
				});
			}, 1500);

		} else if (data.requires2FA) {
			sessionStorage.setItem('pending2FAUser', UserInfo.username);

			// Injecter le champ 2FA avec traductions
			const form = page.querySelector('form');
			const submitButton = form?.querySelector('#login-btn');

			if (form && submitButton && !form.querySelector('#two-factor-token')) {
				const twoFAHTML = `
					<div class="mt-4 p-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
						<label class="block text-blue-300 text-sm mb-2">
							🔐 ${i18n.t('auth.2fa_code') || 'Code de vérification (6 chiffres)'}
						</label>
						<input
							type="text"
							id="two-factor-token"
							maxlength="6"
							placeholder="000000"
							class="w-full p-3 bg-gray-800 border border-blue-500 rounded text-center text-lg font-mono text-white focus:ring-2 focus:ring-blue-400"
						/>
						<p class="text-xs text-blue-300 mt-1 text-center">
							${i18n.t('errors.2fa_code_sent')}
						</p>
					</div>
				`;

				form.insertBefore(
					document.createRange().createContextualFragment(twoFAHTML),
					submitButton
				);

				// Formatter automatiquement le code
				const newTwoFAInput = form.querySelector('#two-factor-token') as HTMLInputElement;
				newTwoFAInput?.addEventListener('input', (e) => {
					const target = e.target as HTMLInputElement;
					target.value = target.value.replace(/\D/g, '').slice(0, 6);
				});

				newTwoFAInput?.focus();
			}

			errorNotif.showErrorBanner('2fa_info', 'info');
		}

	} catch (error) {
		console.error("Login error:", error);

		if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
			errorNotif.showErrorBanner('network_error');
		} else {
			errorNotif.showErrorBanner('technical_error');
		}
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
	twoFactorInput.placeholder = i18n.t('auth.two_factor_code') || '6-digit code';
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
//     twoFactorInput.addEventListener('input', (e) => {
//         const target = e.target as HTMLInputElement;
//         target.value = target.value.replace(/\D/g, '').slice(0, 6);
//     });

//     // Insert before the submit button
//     const submitButton = form.querySelector('#login-btn');
//     if (submitButton) {
//         form.insertBefore(twoFactorInput, submitButton);

//         // Update button text
//         submitButton.textContent = i18n.t('auth.verify_and_login') || 'Verify & Login';
//     }

//     // Focus on the 2FA input
//     twoFactorInput.focus();
}