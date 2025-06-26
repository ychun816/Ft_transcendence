export function createHomePage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'home-page';

  const username = localStorage.getItem('username');

  page.innerHTML = `
	<button
		class="profile-btn"
		data-route="/profile"
		style="margin-left:auto; background:#444; color:#fff; border:none; padding:0.5em 1em; border-radius:4px; cursor:pointer;">
		My profile
	</button>
	<div class="user-banner" style="padding:1em; display:flex; justify-content:space-between; align-items:center;">
		<span>Welcome <strong>${username}</strong><span>
	</div>
	<header class="app-header">
	  <h1>Transcendence</h1>
	  <nav>
		<button class="nav-btn" data-route="/game">Jouer</button>
		<button class="nav-btn" data-route="/profile">Profil</button>
		<button class="nav-btn" data-route="/chat">Chat</button>
		<button class="nav-btn" data-route="/leaderboard">Classement</button>
	  </nav>
	</header>
	<main class="home-content">
	  <h2>Bienvenue sur Transcendence</h2>
	  <p>Le jeu de Pong ultime !</p>
	  <button class="play-btn" data-route="/game">Commencer une partie</button>
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