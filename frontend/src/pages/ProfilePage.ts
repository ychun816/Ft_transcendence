import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";

export function createProfilePage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const renderContent = () => {
		page.innerHTML = `
			<style>
				/* Styles personnalisés pour les effets néon */
				.neon-text {
					text-shadow: 
						0 0 5px currentColor,
						0 0 10px currentColor,
						0 0 15px currentColor,
						0 0 20px currentColor;
				}
				
				.neon-border {
					box-shadow: 
						0 0 10px currentColor,
						inset 0 0 10px currentColor;
				}
				
				.particles {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					pointer-events: none;
					z-index: -1;
				}
				
				.particle {
					position: absolute;
					width: 2px;
					height: 2px;
					background: #00ff41;
					border-radius: 50%;
					animation: float 6s ease-in-out infinite;
				}
				
				@keyframes float {
					0%, 100% { transform: translateY(0px) rotate(0deg); }
					50% { transform: translateY(-20px) rotate(180deg); }
				}
				
				.scan-lines::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: linear-gradient(
						transparent 0%,
						rgba(0, 255, 65, 0.03) 50%,
						transparent 100%
					);
					background-size: 100% 4px;
					animation: scan 0.1s linear infinite;
					pointer-events: none;
				}
				
				@keyframes scan {
					0% { background-position: 0 0; }
					100% { background-position: 0 4px; }
				}
			</style>
			
			<!-- Particules d'arrière-plan -->
			<div class="particles">
				<div class="particle" style="left: 10%; animation-delay: 0s;"></div>
				<div class="particle" style="left: 20%; animation-delay: 1s;"></div>
				<div class="particle" style="left: 30%; animation-delay: 2s;"></div>
				<div class="particle" style="left: 40%; animation-delay: 3s;"></div>
				<div class="particle" style="left: 50%; animation-delay: 4s;"></div>
				<div class="particle" style="left: 60%; animation-delay: 5s;"></div>
				<div class="particle" style="left: 70%; animation-delay: 2s;"></div>
				<div class="particle" style="left: 80%; animation-delay: 1s;"></div>
				<div class="particle" style="left: 90%; animation-delay: 3s;"></div>
			</div>
			
			<div class="absolute top-4 right-4" id="language-switcher-container"></div>
			<div class="min-h-screen flex items-center justify-center p-4 scan-lines relative">

			<!-- Conteneur principal avec disposition côte à côte - centré -->
			<div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-blue-400 border-opacity-30 neon-border flex gap-10 items-start" style="height: 80vh; max-width: 1300px; width: 95%;">
				<!-- Colonne de gauche : Profile + Friends - largeur fixe (moitié du match history) -->
				<div class="flex flex-col gap-6 h-full" style="width: 600px;">
					<!-- Bloc Profile Principal -->
					<div class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400 border-opacity-30 neon-border w-full flex flex-col items-center flex-shrink-0">
						<header class="w-full mb-6">
							<button class="bg-gradient-to-r from-gray-500 from-opacity-30 to-gray-600 to-opacity-30 hover:from-gray-500 hover:from-opacity-50 hover:to-gray-600 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-gray-500 border-opacity-50 transition-all duration-300 transform hover:scale-105" data-route="/home">${i18n.t('profile.back')}</button>
							<h2 class="text-3xl font-bold text-cyan-400 neon-text text-center mt-4">${i18n.t('profile.my_profile')}</h2>
						</header>
						<main class="w-full flex flex-col items-center">
							<div class="flex items-center gap-8 mb-8">
								<div class="relative w-32 h-32 rounded-full border-4 border-cyan-400 border-opacity-50 neon-border overflow-hidden">
									<img src="/default-avatar.png" id="user-avatar" class="w-full h-full object-cover">
									<button id="edit-avatar" title="${i18n.t('profile.edit_avatar')}" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-400 bg-opacity-20 hover:bg-opacity-40 text-cyan-400 rounded-full p-2 transition-all duration-300">
										<img src="../assets/edit.svg" alt="Edit" style="width:20px; height:20px;">
									</button>
									<input type="file" id="avatar-file-input" accept="image/png, image/jpeg" style="display:none;" />
								</div>
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-3">
										<h3 id="username" class="text-2xl font-bold text-cyan-400 neon-text">Username</h3>
										<button id="edit-username" title="${i18n.t('profile.edit_username')}" class="bg-gradient-to-r from-cyan-400 from-opacity-20 to-blue-400 to-opacity-20 hover:from-cyan-400 hover:from-opacity-40 hover:to-blue-400 hover:to-opacity-40 text-cyan-400 font-bold py-1 px-2 rounded-lg border border-cyan-400 border-opacity-50 transition-all duration-300 transform hover:scale-105">
											<img src="../assets/edit.svg" alt="Edit" style="width:16px; height:16px;">
										</button>
									</div>
									<div class="flex items-center gap-3 mb-3">
										<span id="password" class="text-gray-300">${i18n.t('profile.password_display')}</span>
										<button id="edit-password" title="${i18n.t('profile.edit_password')}" class="bg-gradient-to-r from-cyan-400 from-opacity-20 to-blue-400 to-opacity-20 hover:from-cyan-400 hover:from-opacity-40 hover:to-blue-400 hover:to-opacity-40 text-cyan-400 font-bold py-1 px-2 rounded-lg border border-cyan-400 border-opacity-50 transition-all duration-300 transform hover:scale-105">
											<img src="../assets/edit.svg" alt="Edit" style="width:16px; height:16px;">
										</button>
									</div>
									<div class="bg-gray-700 bg-opacity-50 p-4 rounded-xl border border-blue-400 border-opacity-30">
										<p id="user-stats" class="text-blue-400 text-sm">${i18n.t('profile.games_played_stats', {games: '0', wins: '0', losses: '0'})}</p>
									</div>
								</div>
							</div>
						</main>
					</div>

					<!-- Bloc Friends List - occupe le reste de l'espace -->
					<div id="friends-block" class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-green-400 border-opacity-30 neon-border w-full flex flex-col flex-1">
						<header class="w-full flex-shrink-0 mb-4">
							<h2 class="text-2xl font-bold text-green-400 neon-text">${i18n.t('profile.friends_list')}</h2>
						</header>
						<main class="w-full flex-1 overflow-y-auto">
							<!-- Le contenu de la liste d'amis sera ajouté ici -->
							<!-- Plus d'amis peuvent être ajoutés ici -->
						</main>
					</div>
				</div>

				<!-- Colonne de droite : Match History - largeur fixe -->
				<div class="h-full" style="width: 800px;">
					<div id="match-block" class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-purple-400 border-opacity-30 neon-border w-full flex flex-col h-full">
						<header class="w-full mb-4">
							<h2 class="text-2xl font-bold text-purple-400 neon-text">${i18n.t('profile.match_history')}</h2>
						</header>
						<main class="w-full flex-1 overflow-y-auto">
							<!-- Le contenu de l'historique des matchs sera ajouté ici -->
						</main>
					</div>
				</div>
			</div>
		</div>
		`;
	};

	renderContent();

	// Insérer le commutateur de langue
	const languageSwitcherContainer = page.querySelector('#language-switcher-container');
	if (languageSwitcherContainer) {
		languageSwitcherContainer.appendChild(createLanguageSwitcher());
	}

	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);
  	editAvatar(page);
	editUsername(page);
	editPassword(page);

	getUserInfo().then(data =>{
		if (data){
			const usernameElem = page.querySelector('#username') as HTMLElement;
			if (usernameElem) usernameElem.textContent = data.username;

			const avatarElem = page.querySelector('#user-avatar') as HTMLImageElement;
			console.log("Avatar URL reçue :", data.avatarUrl);
			if (avatarElem && data.avatarUrl) avatarElem.setAttribute('src', data.avatarUrl);

			const statElem = page.querySelector("#user-stats") as HTMLElement;
			console.log("gamesPlayed reçue :", data.gamesPlayed);
			console.log("wins reçue :", data.wins);
			console.log("losses reçue :", data.losses);
			if (statElem && data.gamesPlayed && data.wins &&  data.losses){
				statElem.textContent = i18n.t('profile.games_played_stats', {
					games: data.gamesPlayed.toString(),
					wins: data.wins.toString(),
					losses: data.losses.toString()
				});
			}
		}
	});

	displayMatchHistory(page);
	displayFriendsList(page);

	page.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute('data-route');
		if (route) {
			import('../router/router.js').then(({ router }) => {
				router.navigate(route);
		});
		}
	});

	return page;
}

async function getUserInfo() {
	try {
		const token = sessionStorage.getItem('authToken');
		if (!token) {
			throw new Error('No auth token found');
		}

		const response = await fetch('/api/me', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		});

		if (response.ok) {
			const userData = await response.json();
			console.log("User data retrieved:", userData);
			return userData;
		} else {
			console.error("Failed to get user info");
			import('../router/router.js').then(({ router }) => {
				router.navigate('/login');
			});
			return null;
		}
	} catch (error) {
		console.error("Error fetching user info:", error);
		return null;
	}
}

//ADD EDIT USERNAME FUNCTION
async function editUsername(page: HTMLDivElement){
	const token = sessionStorage.getItem('authToken');
	if (!token) {
		throw new Error('No auth token found');
	}
	const usernameElem = page.querySelector("#username") as HTMLElement;
	const editUsernameBtn = page.querySelector("#edit-username") as HTMLButtonElement;

	if (usernameElem && editUsernameBtn){
		editUsernameBtn.addEventListener("click", () => {
			enableInlineEdit({
				element: usernameElem,
				initialValue: usernameElem.textContent || "",
				inputType: "string",
				onValidate: async (newValue) => {
					const UserInfo = {
							username: usernameElem.textContent,
							newUsername: newValue,
					};
					const response = await fetch('/api/profile/username', {
						method: "POST",
						headers:{
							"Content-Type": "application/json",
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify(UserInfo),
					});
					const data = await response.json();
					if (data.ok || data.success){
						console.log("Username succesfully edited!");
						sessionStorage.removeItem('username');
						sessionStorage.setItem('username', newValue);
						usernameElem.textContent = newValue;
					} else {
						alert(i18n.t('profile.username_error'));
					}
				}
			});
		});
	}
}

async function editPassword(page: HTMLDivElement){
	const token = sessionStorage.getItem('authToken');
	if (!token) {
		throw new Error('No auth token found');
	}
	const passwordElem = page.querySelector('#password') as HTMLElement;
	const editPasswordBtn = page.querySelector('#edit-password') as HTMLButtonElement;
	if (passwordElem && editPasswordBtn) {
		editPasswordBtn.addEventListener("click", () => {
			enableInlineEdit({
				element: passwordElem,
				initialValue: "",
				inputType: "password",
				onValidate: async (newValue) => {
					const UserInfo = {
							username: sessionStorage.getItem('username'),
							newPassword: newValue,
					};
					const response = await fetch('/api/profile/password', {
						method: "POST",
						headers:{
							"Content-Type": "application/json",
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify(UserInfo),
					});
					const data = await response.json();
					if (data.ok || data.success){
						console.log("Password succesfully edited!");
					} else {
						alert(i18n.t('profile.password_error'));
					}
					passwordElem.textContent = i18n.t('profile.password_display');
				}
			});
		});
	}
}

function enableInlineEdit({element, initialValue, onValidate, inputType = "text"} :
	{
		element: HTMLElement,
		initialValue: string,
		onValidate: (newValue: string) => Promise<void> | void,
		inputType?: string,
	}) {
		const input = document.createElement("input");
		input.type = inputType;
		input.value = initialValue;
		input.className = "input";
		input.style.marginRight = "8px";
		input.style.width = "auto";
		input.style.display = "inline-block";

		const validateBtn = document.createElement("button");
		validateBtn.textContent = i18n.t('profile.validate');
		validateBtn.className = "btn";
		validateBtn.type = "button";

		const cancelBtn = document.createElement("button");
		cancelBtn.textContent = i18n.t('profile.cancel');
		cancelBtn.className = "btn";
		cancelBtn.type = "button";
		cancelBtn.style.marginLeft = "8px";

		const parent = element.parentElement;
		const oldContent = element.cloneNode(true);

		parent?.replaceChild(input, element);
		parent?.appendChild(validateBtn);
		parent?.appendChild(cancelBtn);

		const cleanup = () => {
			parent?.replaceChild(oldContent, input);
			validateBtn.remove();
			cancelBtn.remove();
		};

		validateBtn.onclick = async () => {
			await onValidate(input.value);
			cleanup();
		};
		cancelBtn.onclick = cleanup;

		input.focus();
		input.onkeydown = (e) => {
			if (e.key === "Escape") cleanup();
			if (e.key === "Enter") validateBtn.click();
		};
}

//CHANGE AVATAR FUNCTION
async function editAvatar(page: HTMLDivElement){
	const editAvatarBtn = page.querySelector("#edit-avatar") as HTMLButtonElement;
	const fileInput = page.querySelector("#avatar-file-input") as HTMLInputElement;
	const avatarImg = page.querySelector("#user-avatar") as HTMLImageElement;

	if (editAvatarBtn && fileInput && avatarImg){
		editAvatarBtn.addEventListener("click", (e) => {
			//e.preventDefault();
			fileInput.click();
		});
		fileInput.addEventListener("change", (e) => {
			const file = fileInput.files?.[0];
			console.log("file: ", file);
			if (file){
				const reader = new FileReader;
				reader.onload = async function(evt){
					if (evt.target && typeof evt.target.result === "string")
					{
						const avatarUrl = await updateDbAvatar(file);
						console.log('avatarUrl: ', avatarUrl);
						if (avatarUrl)
							avatarImg.src = avatarUrl;
					}
				}
				reader.readAsDataURL(file);
			}
		});
	}
}

async function updateDbAvatar(file: File){
	const token = sessionStorage.getItem('authToken');
	if (!token) {
		throw new Error('No auth token found');
	}
	const formData = new FormData;
	const username = sessionStorage.getItem("username");
	formData.append('avatar', file);
	formData.append('username', username || '');

	const response = await fetch('/api/profile/avatar', {
		method: 'POST',
		headers:{
			'Authorization': `Bearer ${token}`
		},
		body: formData,
	});
	if (response.ok){
		const data = await response.json();
		console.log('Avatar updated!', data);
		if (data.avatarPath && typeof data.avatarPath === 'string') {
/* 			// 🔍 Ajout d'un timestamp pour éviter le cache
			const timestampedUrl = `${data.avatarPath}?t=${Date.now()}`;
			console.log('URL avec timestamp:', timestampedUrl); */
			return data.avatarPath;
		} else {
			console.error('Failed to update avatar');
			return null;
		}
	}
	return null;
}


async function getMatchHistory() {
	try {
		const user = await getUserInfo();
		if (!user) return null;

		const token = sessionStorage.getItem('authToken');
		if (!token) {
			throw new Error('No auth token found');
		}

		const response = await fetch(`/api/profile/matches?username=${encodeURIComponent(user.username)}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
		});

		if (response.ok) {
			const matches = await response.json();
			console.log('Match history retrieved!', matches);
			return matches;
		} else {
			console.error('Failed to retrieve match history');
			return null;
		}
	} catch (error) {
		console.error('Error fetching match history:', error);
		return null;
	}
}

async function displayMatchHistory(page: HTMLDivElement)
{
	console.log("ENTER IN MATCH HISTORY");
	const username = sessionStorage.getItem("username");
	console.log("USERNAME RETRIEVED : ", username);
	const history = await getMatchHistory();
	console.log("HISTORY RETRIEVED : ", history);
	const histDiv = page.querySelector("#match-block");
	if (!histDiv) return;

	let html = `
		<table class="data-table">
			<thead>
				<tr>
					<th>${i18n.t('profile.date')}</th>
					<th>${i18n.t('profile.opponent')}</th>
					<th>${i18n.t('profile.result')}</th>
				</tr>
			</thead>
			<tbody>
	`;

	for (const match of history){
		const isPlayer1 = match.player1.username === username;
		const opponent = isPlayer1 ? match.player2.username : match.player1.username;
		const result = match.winnerId === (isPlayer1 ? match.player1Id : match.player2Id) ? i18n.t('profile.victory') : i18n.t('profile.defeat');
		const date = new Date(match.playedAt).toLocaleDateString();
		const statusClass = result === i18n.t('profile.victory') ? "status-victory" : "status-defeat";

	html += `
			<tr>
				<td>${date}</td>
				<td>${opponent}</td>
				<td><span class="${statusClass}">${result}</span></td>
			</tr>
		`;
	}
	html += `</tbody></table>`;
	histDiv.innerHTML = html;
}

async function getFriendsList() {
	try {
		const user = await getUserInfo();
		if (!user) return null;

		const token = sessionStorage.getItem('authToken');
		if (!token) {
			throw new Error('No auth token found');
		}

		const response = await fetch(`/api/profile/friends?username=${encodeURIComponent(user.username)}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
		});

		if (response.ok) {
			const friends = await response.json();
			console.log('Friends list retrieved!', friends);
			return friends;
		} else {
			console.error('Failed to retrieve friends list');
			return null;
		}
	} catch (error) {
		console.error('Error fetching friends list:', error);
		return null;
	}
}


async function displayFriendsList(page: HTMLDivElement)
{
	console.log("ENTER IN FRIENDS LIST");
	const username = sessionStorage.getItem("username");
	console.log("USERNAME RETRIEVED : ", username);
	const friendsList = await getFriendsList();
	if (!friendsList) return ;
	console.log("FRIENDS LIST RETRIEVED : ", friendsList);
	const friendsDiv = page.querySelector("#friends-block");
	if (!friendsDiv) return;

	let html = `
		<table class="data-table">
			<thead>
				<tr>
					<th>${i18n.t('id')}</th>
					<th>${i18n.t('avatar')}</th>
					<th>${i18n.t('name')}</th>
					<th>${i18n.t('Games_played')}</th>
				</tr>
			</thead>
			<tbody>
	`;

	for (const friend of friendsList){
		const avatar = friend.getItem("avatarUrl")
		const id = friend.getItem("id");
		const name = friend.getItem("username");
		const played = friend.getItem("gamesPlayed");

	html += `
			<tr>
				<td>${id}</td>
				<td>${avatar}</td>
				<td>${name}</td>
				<td>${played}</td>
			</tr>
		`;
	}
	html += `</tbody></table>`;
	friendsDiv.innerHTML = html;
}