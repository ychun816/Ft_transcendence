import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createNotFoundPage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300";

	const renderContent = () => {
		page.innerHTML = `
		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		<div class="card max-w-md w-full bg-white flex flex-col items-center">
		  <h1 class="text-6xl font-bold text-blue-500 mb-8">${i18n.t('not_found.title')}</h1>
		  <p class="text-gray-700 mb-8 text-center">${i18n.t('not_found.message')}</p>
		  <button class="btn w-full" id="back-home">${i18n.t('not_found.back_home')}</button>
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
				router.navigate("/");
			});
		});
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	return page;
}
