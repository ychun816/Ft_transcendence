// import { UserSignUpCheck } from '../../backend/src/signup/signUpCheck.ts';

export function createSignUpPage(): HTMLElement{
	const page = document.createElement('div');
	page.className = "min-h-screen bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center";

	page.innerHTML = `
		<div class="card max-w-md w-full">
			<h1 class="text-3xl font-bold text-center text-gray-900 mb-8">Create your account</h1>
			<form class="space-y-4">
				<input type="text" placeholder="Username" id="username" required class="input">
				<input type="password" placeholder="Password" id="password" required class="input">
				<label for="avatar" class="block text-sm font-medium text-gray-700">Choose a profile picture:</label>
				<input type="file" id="avatar" name="avatar" accept="image/png, image/jpeg" class="input" />
				<div class="flex justify-center">
					<img id="avatar-preview" width="200" class="border border-gray-300 rounded" />
				</div>
				<button type="submit" class="btn w-full">Sign up</button>
			</form>
		</div>
		`;

	const form = page.querySelector("form") as HTMLFormElement;
	form.addEventListener("submit", (e) => {
		e.preventDefault();

		const usernameInput = page.querySelector("#username") as HTMLInputElement;
		const passwordInput = page.querySelector("#password") as HTMLInputElement;
		const avatarInput = page.querySelector("#avatar") as HTMLInputElement;

		const UserInfo = {
			username: usernameInput.value,
			password: passwordInput.value,
			avatar: avatarInput.value,
		};

		if (UserSignUpCheck(UserInfo)){
			//push to backend
		}
		else {
			//error message
		}

		import("../router/router.js").then(({ router }) => {
			router.navigate('/login');
		});
	});
	return page;
}