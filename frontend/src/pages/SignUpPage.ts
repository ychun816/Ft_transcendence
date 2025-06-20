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

	const form = page.querySelector(".signup-form") as HTMLFormElement;
	form.addEventListener("submit", (e) => {
		e.preventDefault();

		import("../router/router.js").then(({ router }) => {
			router.navigate('/login');
		});
	});
	return page;
}