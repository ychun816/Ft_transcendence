import { AuthService } from "../middleware/auth.js";

const authService = new AuthService();

export function createLoginPage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100";

	page.innerHTML = `
    <div class="card max-w-md w-full bg-white">
      <h1 class="text-6xl text-center text-blue-500 mb-8">Transcendence</h1>
      <form class="space-y-4">
        <input type="text" placeholder="Username" id="username" required class="input">
        <input type="password" placeholder="Password" id="password" required class="input">
        <button type="submit" id="login-btn" class="btn w-full">Log in</button>
      </form>
      <button type="button" id="register-btn" class="btn w-full mt-4 bg-gray-500 hover:bg-gray-600">Sign up</button>
    </div>
  `;
	console.log("DEBUGGING LOGIN");
	navigateToSignUp(page);
	
	
	const form = page.querySelector('.space-y-4') as HTMLFormElement;
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

export async function requireAuth(): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) {
        import("../router/router.js").then(({ router }) => {
            router.navigate('/login');
        });
        return false;
    }
    return true;
}

async function sendLogInInfo(page: HTMLDivElement): Promise<void> {
    const usernameInput = page.querySelector("#username") as HTMLInputElement;
    const passwordInput = page.querySelector("#password") as HTMLInputElement;

    const UserInfo = {
        username: usernameInput.value,
        password: passwordInput.value,
    };

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(UserInfo),
        });

        const data = await response.json();
        if (data.success) {
            await authService.getCurrentUser();
            import("../router/router.js").then(({ router }) => {
                router.navigate('/home');
            });
        } else {
            alert("Error while logging in: " + (data.message || "Credentials are incorrect"));
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Error while logging in: " + (error || "Please try again."));
    }
}
