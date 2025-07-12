export function createUserProfilePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-cyan-100";

	// Get username from URL path
	const pathParts = window.location.pathname.split('/');
	const targetUsername = pathParts[2]; // /profile/username

	if (!targetUsername) {
		page.innerHTML = `
			<div class="card max-w-md w-full bg-white text-center p-8">
				<h2 class="text-xl font-bold text-red-600 mb-4">Erreur</h2>
				<p class="text-gray-600">Nom d'utilisateur manquant.</p>
				<button class="btn mt-4" data-route="/home">Retour à l'accueil</button>
			</div>
		`;
		setupNavigation(page);
		return page;
	}

	page.innerHTML = `
		<div class="card max-w-2xl w-full bg-white flex flex-col items-center">
			<header class="w-full flex items-center gap-4 mb-6">
				<button class="btn" data-route="/chat">← Retour au chat</button>
				<h2 class="text-2xl font-bold text-gray-900">Profil de <span id="profile-username">${targetUsername}</span></h2>
			</header>
			<main class="w-full flex flex-col items-center">
				<div class="flex items-center gap-6 mb-8">
					<div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
						<img src="/default-avatar.png" alt="Avatar" id="user-avatar" class="w-full h-full object-cover">
					</div>
					<div class="mb-8">
						<h3 id="username-display" class="text-2xl font-bold text-gray-900 mb-2">${targetUsername}</h3>
						<p id="join-date" class="text-sm text-gray-600">Membre depuis: -</p>
					</div>
				</div>
				
				<div class="w-full grid grid-cols-3 gap-4 mb-8">
					<div class="text-center p-4 bg-green-50 rounded-lg">
						<div id="games-played" class="text-2xl font-bold text-green-600">-</div>
						<div class="text-sm text-gray-600">Parties jouées</div>
					</div>
					<div class="text-center p-4 bg-blue-50 rounded-lg">
						<div id="wins" class="text-2xl font-bold text-blue-600">-</div>
						<div class="text-sm text-gray-600">Victoires</div>
					</div>
					<div class="text-center p-4 bg-red-50 rounded-lg">
						<div id="losses" class="text-2xl font-bold text-red-600">-</div>
						<div class="text-sm text-gray-600">Défaites</div>
					</div>
				</div>

				<div class="w-full">
					<h4 class="text-lg font-semibold text-gray-800 mb-4">Historique des matches</h4>
					<div id="matches-history" class="space-y-2">
						<div class="text-center text-gray-500 py-4">
							<div class="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mb-2"></div>
							<div>Chargement...</div>
						</div>
					</div>
				</div>

				<div class="w-full mt-6 flex gap-4 justify-center">
					<button id="send-message-btn" class="btn bg-blue-500 hover:bg-blue-600">
						💬 Envoyer un message
					</button>
					<button id="invite-game-btn" class="btn bg-green-500 hover:bg-green-600">
						🎮 Inviter à jouer
					</button>
				</div>
			</main>
		</div>
	`;

	// Load user data
	loadUserProfile(page, targetUsername);
	setupNavigation(page);
	setupActions(page, targetUsername);

	return page;
}

async function loadUserProfile(page: HTMLElement, username: string) {
	try {
		// Get user profile data
		const profileResponse = await fetch(`/api/profile?username=${encodeURIComponent(username)}`, {
			method: 'GET',
			credentials: 'include'
		});

		if (!profileResponse.ok) {
			throw new Error(`HTTP ${profileResponse.status}`);
		}

		const userData = await profileResponse.json();
		
		// Update UI with user data
		const usernameDisplay = page.querySelector('#username-display');
		const userAvatar = page.querySelector('#user-avatar') as HTMLImageElement;
		const joinDate = page.querySelector('#join-date');
		const gamesPlayed = page.querySelector('#games-played');
		const wins = page.querySelector('#wins');
		const losses = page.querySelector('#losses');

		if (usernameDisplay) usernameDisplay.textContent = userData.username;
		if (userAvatar && userData.avatarUrl) {
			userAvatar.src = userData.avatarUrl;
		}
		if (joinDate) {
			const date = new Date(userData.createdAt).toLocaleDateString('fr-FR');
			joinDate.textContent = `Membre depuis: ${date}`;
		}
		if (gamesPlayed) gamesPlayed.textContent = userData.gamesPlayed?.toString() || '0';
		if (wins) wins.textContent = userData.wins?.toString() || '0';
		if (losses) losses.textContent = userData.losses?.toString() || '0';

		// Load match history
		loadMatchHistory(page, username);

	} catch (error) {
		console.error('Error loading user profile:', error);
		const main = page.querySelector('main');
		if (main) {
			main.innerHTML = `
				<div class="text-center p-8">
					<h3 class="text-xl font-bold text-red-600 mb-2">Erreur</h3>
					<p class="text-gray-600">Impossible de charger le profil de ${username}</p>
					<button class="btn mt-4" data-route="/chat">Retour au chat</button>
				</div>
			`;
		}
	}
}

async function loadMatchHistory(page: HTMLElement, username: string) {
	try {
		const matchesResponse = await fetch(`/api/profile/matches?username=${encodeURIComponent(username)}`, {
			method: 'GET',
			credentials: 'include'
		});

		if (!matchesResponse.ok) {
			throw new Error(`HTTP ${matchesResponse.status}`);
		}

		const matches = await matchesResponse.json();
		const matchesHistory = page.querySelector('#matches-history');

		if (matchesHistory) {
			if (matches.length === 0) {
				matchesHistory.innerHTML = `
					<div class="text-center text-gray-500 py-4">
						Aucun match joué pour le moment
					</div>
				`;
			} else {
				matchesHistory.innerHTML = matches.map((match: any) => `
					<div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
						<div>
							<span class="font-medium">${match.player1.username}</span>
							<span class="text-gray-500">vs</span>
							<span class="font-medium">${match.player2.username}</span>
						</div>
						<div class="text-right">
							<div class="font-bold ${match.winnerId === match.player1.id ? 'text-green-600' : 'text-red-600'}">
								${match.score1} - ${match.score2}
							</div>
							<div class="text-xs text-gray-500">
								${new Date(match.playedAt).toLocaleDateString('fr-FR')}
							</div>
						</div>
					</div>
				`).join('');
			}
		}
	} catch (error) {
		console.error('Error loading match history:', error);
		const matchesHistory = page.querySelector('#matches-history');
		if (matchesHistory) {
			matchesHistory.innerHTML = `
				<div class="text-center text-red-500 py-4">
					Erreur lors du chargement de l'historique
				</div>
			`;
		}
	}
}

function setupNavigation(page: HTMLElement) {
	page.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute('data-route');
		if (route) {
			import('../router/router.js').then(({ router }) => {
				router.navigate(route);
			});
		}
	});
}

function setupActions(page: HTMLElement, targetUsername: string) {
	const sendMessageBtn = page.querySelector('#send-message-btn');
	const inviteGameBtn = page.querySelector('#invite-game-btn');

	sendMessageBtn?.addEventListener('click', () => {
		// Retourner au chat et ouvrir la conversation avec cet utilisateur
		import('../router/router.js').then(({ router }) => {
			// Store the username to open conversation in chat
			sessionStorage.setItem('openConversationWith', targetUsername);
			router.navigate('/chat');
		});
	});

	inviteGameBtn?.addEventListener('click', () => {
		// TODO: Implement game invitation
		alert(`Invitation de jeu pour ${targetUsername} (à implémenter)`);
	});
}