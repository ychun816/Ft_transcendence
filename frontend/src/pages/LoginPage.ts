export function createLoginPage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center';

  page.innerHTML = `
    <div class="card max-w-md w-full bg-white">
      <h1 class="text-3xl font-bold text-center text-gray-900 mb-8">Transcendence</h1>
      <form class="space-y-4">
        <input type="text" placeholder="Username" id="username" required class="input">
        <input type="password" placeholder="Password" id="password" required class="input">
        <button type="submit" class="btn w-full">Log in</button>
      </form>
      <button type="button" id="register-btn" class="btn w-full mt-4 bg-gray-500 hover:bg-gray-600">Sign up</button>
    </div>
  `;

  const signupBtn = page.querySelector('#register-btn') as HTMLButtonElement;
  signupBtn.addEventListener("click", () => {
    import("../router/router.js").then(({ router }) => {
      router.navigate("/signup");
    });
  });

  const form = page.querySelector('form') as HTMLFormElement;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    /*
    This function is called when the user clicks on a button.
    It finds the targeted route and navigates to it.
    */
    import('../router/router.js').then(({ router }) => {
      router.navigate('/home');
    });
  });

  return page;
}