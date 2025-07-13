import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createHomePage(): HTMLElement {
	// Debug: vérifier les tokens de sessionStorage
	console.log("🏠 HomePage - authToken:", sessionStorage.getItem('authToken'));
	console.log("🏠 HomePage - username:", sessionStorage.getItem('username'));
	console.log("🏠 HomePage - currentUser:", sessionStorage.getItem('currentUser'));

	const page = document.createElement("div");
	page.className = "page-container fade-in";

	const renderContent = () => {
		page.innerHTML = `
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="card max-w-2xl w-full flex flex-col items-center slide-up">
				<h1 class="page-title text-4xl mb-8 text-center">Transcendence</h1>
				<nav class="flex flex-wrap justify-center gap-3 mb-8">
					<button class="btn-primary" data-route="/game">${i18n.t('navigation.game')}</button>
					<button class="btn-secondary" data-route="/profile">${i18n.t('navigation.profile')}</button>
					<button class="btn-secondary" data-route="/chat">${i18n.t('navigation.chat')}</button>
					<button class="btn-secondary" data-route="/leaderboard">${i18n.t('navigation.leaderboard')}</button>
				</nav>
				<h2 class="section-title text-center">${i18n.t('home.welcome')}</h2>
				<p class="text-muted mb-8 text-center">${i18n.t('home.subtitle')}</p>
				<button class="btn-primary btn-large w-full max-w-xs" data-route="/game">${i18n.t('home.start_game')}</button>
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

	// Navigation - attached once, works for all renders
	page.addEventListener("click", (e) => {
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
