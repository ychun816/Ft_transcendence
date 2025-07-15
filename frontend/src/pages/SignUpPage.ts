import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createSignUpPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "page-centered fade-in";

	const renderContent = () => {
		page.innerHTML = `
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="card max-w-md w-full flex flex-col items-center slide-up">
				<header class="nav-header w-full">
					<button class="btn-ghost" data-route="/login">${i18n.t('signup.back_to_login')}</button>
				</header>
				<h1 class="page-title text-center mb-8">${i18n.t('signup.title')}</h1>
				<form class="space-y-4 w-full">
					<input type="text" placeholder="${i18n.t('signup.username')}" id="username" required class="input">
					<input type="password" placeholder="${i18n.t('signup.password')}" id="password" required class="input">
					<label for="avatar" class="block text-sm font-medium text-muted">${i18n.t('signup.avatar_label')}</label>
					<input type="file" id="avatar" name="avatar" accept="image/png, image/jpeg" class="input" />
					<div class="flex justify-center">
						<img id="avatar-preview" width="200" class="border-accent rounded-modern shadow-soft" style="display: none;" />
					</div>
					<button type="submit" class="btn-primary w-full">${i18n.t('signup.create_account')}</button>
				</form>
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
		const form = page.querySelector(".space-y-4") as HTMLFormElement;
		if (form) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				sendSignUpInfo(page);
			});
		}
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	page.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute('data-route');
		if (route) {
			import('../router/router.js').then(({ router }) => {
				router.navigate(route);
		});
		}
	});

	console.log("LOADING SIGNUP PAGE");
	const form = page.querySelector(".space-y-4") as HTMLFormElement;
	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		console.log("SUBMIT SIGNUP FORM");
		sendSignUpInfo(page)
	});
	return page;
}

export async function sendSignUpInfo(page: HTMLDivElement): Promise<void> {
	const usernameInput = page.querySelector("#username") as HTMLInputElement;
	const passwordInput = page.querySelector("#password") as HTMLInputElement;
	const avatarInput = page.querySelector("#avatar") as HTMLInputElement;
	const avatar = avatarInput.files?.[0];

	const UserInfo = {
		username: usernameInput.value,
		password: passwordInput.value,
		avatar: avatar,
	};

	//if (UserSignUpCheck(UserInfo)){
		const user = UserInfo;
		const formData = new FormData();

		// PRINT DEBUG SIGNUP FORM
		console.log(`USERNAME: ${user.username}`);
		console.log(`PASSWORD: ${user.password}`);
		// END PRINT DEBUG SIGNUP FORM

		formData.append("username", user.username);
		formData.append("password", user.password);
		if (user.avatar) formData.append("avatar", user.avatar);

		for (const [key, value] of formData.entries()){
			console.log(key, value);
		}
		console.log("About to send response");
		const response = await fetch("/api/signup", {
			method: "POST",                            
			body: formData,
		});
		console.log(formData.get("username"));
		console.log(formData.get("password"));
		console.log(response);
		if (response.ok){
			console.log("Signup successfull");
			import("../router/router.js").then(({ router }) => {
				router.navigate('/login');
			});
		} else {
			const errorText = await response.text();
			console.error("Signup error response:", errorText);
			const data = JSON.parse(errorText);
			alert(data.error || i18n.t('signup.signup_error'));
		}
	// }
	// else {
	// 	alert("Wrong user input");
	// }
}
