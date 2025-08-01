import { i18n } from "../services/i18n.js";
import { AuthService } from "../middleware/auth.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { classes } from "../styles/retroStyles.js";

const authService = new AuthService();

export function createTwoFactorVerifyPage(): HTMLElement {
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

		<!-- Champ d'étoiles en arrière-plan -->
		<div class="${classes.starfield}"></div>

		<!-- Container principal avec effet scan -->
		<div class="min-h-screen flex items-center justify-center p-4 ${classes.scanLinesContainer} relative">
			
			<!-- Sélecteur de langue en haut à droite -->
			<div class="absolute top-4 right-4 z-50" id="language-switcher-container"></div>

			<!-- Interface principale -->
			<div class="${classes.retroPanel} rounded-2xl p-8 max-w-md w-full flex flex-col items-center">
				
				<!-- Titre principal avec effet néon -->
				<h1 class="${classes.sectionTitle} mb-8">
					<span class="relative z-10 ${classes.neonText}">
						${i18n.t("auth.twofa_title")}
					</span>
				</h1>
				
				<!-- Formulaire de vérification -->
				<form class="w-full space-y-6">
					<div class="flex flex-col items-center">
						<input 
							type="text" 
							placeholder="${i18n.t("auth.twofa_code")}" 
							id="two-factor-token" 
							maxlength="6"
							required 
							class="${classes.tournamentInput} text-xl tracking-widest"
							autocomplete="one-time-code"
						>
					</div>
					
					<!-- Bouton de vérification avec style rétro -->
					<button type="submit" id="verify-btn" class="${classes.gameModeButton} w-full relative overflow-hidden group">
						<span class="relative z-10 ${classes.neonText}">
							${i18n.t("auth.verify_and_login")}
						</span>
						<div class="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-purple-400/20 to-purple-400/10 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
					</button>
				</form>
				
				<!-- Message d'erreur avec style rétro -->
				<div id="twofa-error" class="${classes.errorMessage} mt-4 text-center" style="display:none"></div>
				
				<!-- Instructions optionnelles -->
				<p class="text-gray-400 mt-6 text-center text-sm font-medium">
					${i18n.t("auth.twofa_instruction")}
				</p>
			</div>
		</div>
		`;
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
		
		// Re-attach event listeners
		attachEventListeners();
	};

	const attachEventListeners = () => {
		console.log("🔧 2FA DEBUG - Attaching event listeners");

		const form = page.querySelector("form") as HTMLFormElement;
		const codeInput = page.querySelector("#two-factor-token") as HTMLInputElement;

		console.log("🔧 2FA DEBUG - Form found:", !!form);
		console.log("🔧 2FA DEBUG - Code input found:", !!codeInput);

		if (codeInput) {
			// Format l'input pour n'accepter que les chiffres et limiter à 6 caractères
			codeInput.addEventListener("input", (e) => {
				const target = e.target as HTMLInputElement;
				target.value = target.value.replace(/\D/g, "").slice(0, 6);
			});
			console.log("🔧 2FA DEBUG - Input event listener attached");
		}

		if (form) {
			form.addEventListener("submit", (e) => {
				console.log("🔧 2FA DEBUG - Form submit event triggered!");
				e.preventDefault();
				send2FACode(page);
			});
			console.log("🔧 2FA DEBUG - Submit event listener attached");
		} else {
			console.log("❌ 2FA DEBUG - Form not found!");
		}
	};

	renderContent();
	
	// Re-render when language changes
	window.addEventListener("languageChanged", renderContent);

	return page;
}

async function send2FACode(page: HTMLDivElement): Promise<void> {
	console.log("🔧 2FA DEBUG - send2FACode function called!");

	const codeInput = page.querySelector("#two-factor-token") as HTMLInputElement;
	const errorDiv = page.querySelector("#twofa-error") as HTMLDivElement;
	const verifyBtn = page.querySelector("#verify-btn") as HTMLButtonElement;
	const username = sessionStorage.getItem("pending2FAUser");

	const code = codeInput.value.trim();

	console.log(`🔍 2FA FRONTEND - Username: ${username}, Code: ${code}`);

	if (!code || code.length !== 6) {
		console.log(`❌ 2FA FRONTEND - Invalid code length: ${code.length}`);
		if (errorDiv) {
			errorDiv.textContent = i18n.t("auth.invalid_2fa_code") || "Invalid code";
			errorDiv.style.display = "block";
		}
		return;
	}

	if (!username) {
		console.log(`❌ 2FA FRONTEND - No username found in pending2FAUser`);
		if (errorDiv) {
			errorDiv.textContent = "Session expired, please login again";
			errorDiv.style.display = "block";
		}
		return;
	}

	try {
		// Désactiver le bouton pendant la vérification
		verifyBtn.disabled = true;
		verifyBtn.innerHTML = `
			<span class="relative z-10 ${classes.neonText}">
				${i18n.t("auth.verifying") || "Verifying..."}
			</span>
		`;

		console.log(`📤 2FA FRONTEND - Sending request to /api/2fa/verify`);
		const response = await fetch("/api/2fa/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, code }),
			credentials: "include",
		});

		console.log(`📥 2FA FRONTEND - Response status: ${response.status}`);
		const data = await response.json();
		console.log(`📥 2FA FRONTEND - Response data:`, data);

		if (data.success && data.token) {
			// Succès - stockage des données d'authentification
			sessionStorage.setItem("authToken", data.token);
			sessionStorage.setItem("username", username || "");
			sessionStorage.removeItem("pending2FAUser");
			await authService.getCurrentUser();
			
			// Redirection vers la page d'accueil
			import("../router/router.js").then(({ router }) => {
				router.navigate("/home");
			});
		} else {
			// Erreur de vérification
			if (errorDiv) {
				errorDiv.textContent = data.message || i18n.t("auth.invalid_2fa_code") || "Invalid code";
				errorDiv.style.display = "block";
			}
		}
	} catch (error) {
		console.error("2FA verify error:", error);
		if (errorDiv) {
			errorDiv.textContent = i18n.t("auth.login_error") + ": " + (error || "Please try again.");
			errorDiv.style.display = "block";
		}
	} finally {
		// Réactiver le bouton
		verifyBtn.disabled = false;
		verifyBtn.innerHTML = `
			<span class="relative z-10 ${classes.neonText}">
				${i18n.t("auth.verify_and_login") || "Verify & Login"}
			</span>
			<div class="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-purple-400/20 to-purple-400/10 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
		`;
	}
}