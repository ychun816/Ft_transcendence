export function createHomePage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'min-h-screen bg-gradient-to-br from-blue-100 to-purple-100';
  
  page.innerHTML = `
    <header class="bg-white shadow-sm p-4">
      <h1 class="text-2xl font-bold text-center text-gray-900">Transcendence</h1>
      <nav class="flex justify-center gap-4 mt-4">
        <button class="btn" data-route="/game">Jouer</button>
        <button class="btn" data-route="/profile">Profil</button>
        <button class="btn" data-route="/chat">Chat</button>
        <button class="btn" data-route="/leaderboard">Classement</button>
      </nav>
    </header>
    <main class="flex flex-col items-center justify-center p-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">Bienvenue sur Transcendence</h2>
      <p class="text-gray-600 mb-8">Le jeu de Pong ultime !</p>
      <button class="btn text-lg px-8 py-3" data-route="/game">Commencer une partie</button>
    </main>
  `;
  
  // Navigation
  page.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const route = target.getAttribute('data-route');
    if (route) {
      // Find the targeted route and navigate to it
      import('../router/router.js').then(({ router }) => {
        router.navigate(route);
      });
    }
  });
  
  return page;
} 