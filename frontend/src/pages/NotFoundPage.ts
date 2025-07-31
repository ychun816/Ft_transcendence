import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { classes } from "../styles/retroStyles.js";

export function createNotFoundPage(): HTMLElement {
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
				
				<!-- Titre principal avec effet glitch -->
				<h1 class="text-8xl font-bold text-red-400 ${classes.neonText} mb-8 relative">
					<span class="relative z-10 text-red-400 drop-shadow-[0_0_10px_rgb(239,68,68)] drop-shadow-[0_0_20px_rgb(239,68,68)] animate-pulse">
						${i18n.t('not_found.title')}
					</span>
				</h1>
				
				<!-- Message d'erreur -->
				<p class="text-gray-300 mb-8 text-center text-lg font-medium">
					${i18n.t('not_found.message')}
				</p>
				
				<!-- Bouton de retour avec style rétro -->
				<button class="${classes.gameModeButton} w-full relative overflow-hidden group" id="back-home">
					<span class="relative z-10 text-red-400 drop-shadow-[0_0_5px_rgb(239,68,68)]">
						${i18n.t('not_found.back_home')}
					</span>
					<div class="absolute inset-0 bg-gradient-to-r from-red-400/10 via-red-400/20 to-red-400/10 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
				</button>
			</div>
		</div>
		`;
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
		
		// Re-attach event listener
		const btn = page.querySelector("#back-home") as HTMLButtonElement;
		btn.addEventListener("click", () => {
			import("../router/router.js").then(({ router }) => {
				router.navigate("/game");
			});
		});
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	return page;
}