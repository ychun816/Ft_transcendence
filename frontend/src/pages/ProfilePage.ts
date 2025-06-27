export function createProfilePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-cyan-100";

	page.innerHTML = `
    <div class="card max-w-2xl w-full bg-white flex flex-col items-center">
      <header class="w-full flex items-center gap-4 mb-6">
        <button class="btn" data-route="/home">← Retour</button>
        <h2 class="text-2xl font-bold text-gray-900">Mon Profil</h2>
      </header>
      <main class="w-full flex flex-col items-center">
        <div class="flex items-center gap-6 mb-8">
          <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            <img src="/default-avatar.png" alt="Avatar" id="user-avatar" class="w-full h-full object-cover">
          </div>
          <div>
            <h3 id="username" class="text-2xl font-bold text-gray-900 mb-2">Nom d'utilisateur</h3>
            <p id="user-stats" class="text-gray-600">Parties jouées: 0 | Victoires: 0</p>
          </div>
        </div>
        <div class="flex gap-4">
          <button id="edit-profile" class="btn">Modifier le profil</button>
          <button id="change-avatar" class="btn bg-gray-500 hover:bg-gray-600">Changer l'avatar</button>
        </div>
      </main>
    </div>
  `;

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
