import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createGamePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100";

	const renderContent = () => {
		page.innerHTML = `
		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		<div class="card max-w-2xl w-full bg-white flex flex-col items-center">
		  <header class="w-full flex items-center justify-between mb-6">
			<div class="flex items-center gap-4">
			  <button class="btn" data-route="/home">${i18n.t('game.back')}</button>
			  <h2 class="text-2xl font-bold text-gray-900">${i18n.t('game.title')}</h2>
			</div>
			<div class="text-xl font-bold text-gray-900">
			  <span id="player1-score">0</span> - <span id="player2-score">0</span>
			</div>
		  </header>
		  <main class="flex flex-col items-center w-full">
			<canvas id="pong-canvas" width="800" height="400" class="border border-gray-300 bg-white mb-4"></canvas>
			<div class="flex gap-4">
			  <button id="start-game" class="btn">${i18n.t('game.start')}</button>
			  <button id="pause-game" class="btn bg-gray-500 hover:bg-gray-600">${i18n.t('game.pause')}</button>
			</div>
		  </main>
		</div>
		`;
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	page.addEventListener("click", (e) => {
		/*
    This function is called when the user clicks on a button.
    It finds the targeted route and navigates to it.
    */
		const target = e.target as HTMLElement;
		const route = target.getAttribute("data-route");
		if (route) {
			import("../router/router.js").then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	return page;
}
