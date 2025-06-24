//import { UserSignUpCheck } from '../../backend/src/signup/signUpCheck.ts';
import { UserSignUpCheck } from '@shared/signUpCheck';

export function createSignUpPage(): HTMLElement{
	const page = document.createElement('div');
	page.className = "signup-page";

	page.innerHTML = `
		<div class="signup-container">
			<h1> Create your account </h1>
			<form class="signup-form">
				<input type="text" placeholder="Username" id="username" required>
				<input type="text" placeholder="Password" id="password" required>
				<br>
				<label for="avatar">Choose a profile picture:</label>
				<input type="file" id="avatar" name="avatar" accept="image/png, image/jpeg" />
				<p><img id="avatar" width="200" /></p>
				<br>
				<button type="submit">Sign up</button>
			</form>
		</div>
		`;

	console.log("LOADING SIGNUP PAGE");
	const form = page.querySelector(".signup-form") as HTMLFormElement;
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

		const response = await fetch("/api/signup", {
			method: "POST",
			body: formData,
		});
		console.log(response);
		if (response.ok){
			import("../router/router.js").then(({ router }) => {
				router.navigate('/login');
			});
		} else {
			alert("Issue while registering");
		}
	// }
	// else {
	// 	alert("Wrong user input");
	// }
}
