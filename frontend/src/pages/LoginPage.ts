export function createLoginPage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'login-page';

  page.innerHTML = `
	<div class="login-container">
	  <h1>Transcendence</h1>
	  <form class="login-form">
		<input type="text" placeholder="Username" id="username" required>
		<input type="password" placeholder="Password" id="password" required>
		<button type="submit">Log in</button>
	  </form>
	  <button type="button" id="register-btn">Sign up</button>
	</div>
  `;
	console.log("DEBUGGING LOGIN");
	navigateToSignUp(page);
	const form = page.querySelector('.login-form') as HTMLFormElement;
	console.log("DEBUGGING 1");
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		console.log("DEBUGGING 2");
		sendLogInInfo(page);
	});
	return page;
}

function navigateToSignUp(page: HTMLDivElement){
  const signupBtn = page.querySelector('#register-btn') as HTMLButtonElement;
  signupBtn.addEventListener("click", () => {
	import("../router/router.js").then(({ router }) => {
		router.navigate("/signup");
		});
  	});
}

async function sendLogInInfo(page: HTMLDivElement): Promise<void> {
	const usernameInput = page.querySelector("#username") as HTMLInputElement;
	const passwordInput = page.querySelector("#password") as HTMLInputElement;

	console.log("DEBUGGING 3");
	const UserInfo = {
		username: usernameInput.value,
		password: passwordInput.value,
	};
	console.log("DEBUGGING 5");
	const response = await fetch("/api/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(UserInfo),
	});
	const data = await response.json();
	console.log(response);
	if (response.ok){
		localStorage.setItem("username", data.username);
		localStorage.setItem("jwt", data.token);
		import("../router/router.js").then(({ router }) => {
			router.navigate('/home');
		});
	} else {
		alert("Issue while logging in");
	}
}