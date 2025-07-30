import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { ServerGame_solo } from "../components/game/PongClient.js"; // ← CHANGEMENT ICI
import { classes } from "../styles/retroStyles.js";

export function createServerGamePage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	let currentClient: ServerGame_solo | null = null; // ← Client WebSocket, pas de logique de jeu
	let gameMode: 'solo' | 'versus' | 'multi' | null = null;

	const renderContent = () => {
		page.innerHTML = `
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
			* {
				font-family: 'Orbitron', monospace;
			}
		</style>

		<div class="min-h-screen flex flex-col items-center justify-center p-4 ${classes.scanLinesContainer}">
			<!-- Bouton LOG-IN en haut à gauche -->
			<div class="absolute top-4 left-4 z-50">
				<div class="login-dropdown">
					<button id="loginBtn" class="${classes.backButton}">
						<span class="relative z-10">
						${i18n.t('game.connexion')}
						</span>
					</button>
					<button id="logoutBtn" class="${classes.backButton} text-red-300">
						<span class="relative z-10">
						${i18n.t('game.deco')}
						</span>
					</button>
				</div>
			</div>
			
			<!-- TITRE tout en haut, centré -->
			<h2 id="nameId" class="${classes.nametitle} absolute top-4 left-1/2 transform -translate-x-1/2 z-40"></h2>
			
			<!-- BOUTONS profil/chat centrés -->
			<div class="absolute top-0 flex flex-col items-center justify-center gap-4 mt-20">
				<div class="flex gap-4">
					<button class="${classes.backButton}" id="profilBtn">
						${i18n.t('game.profile')}
					</button>
					<button class="${classes.backButton}" id="chatBtn">
						CHAT
					</button>
				</div>
			</div>

			<!-- Titre principal avec effet néon -->
			<h1 class="${classes.retroTitle} mb-12">
				🎮 RETRO PONG SERVER
			</h1>

			<!-- Menu principal -->
			<div id="menu" class="${classes.retroPanel} rounded-2xl p-8">
				<button class="mb-6 ${classes.backButton}" data-route="/game">
					← ${i18n.t('chat.back')} ACCUEIL
				</button>
				<h2 class="${classes.sectionTitle}">
				${i18n.t('game.game_mode')}
				</h2>
				<div class="flex flex-col gap-6">
					<button id="soloBtn" class="${classes.gameModeButton}">
						<span class="relative z-10">
						🤖 SOLO (VS IA)
						</span>
					</button>
					<button id="versusBtn" class="${classes.gameModeButton}">
						<span class="relative z-10">
						👥 VERSUS (1v1)
						</span>
					</button>
					<button id="multiBtn" class="${classes.gameModeButton}">
						<span class="relative z-10">
						${i18n.t('game.multi')}
						</span>
					</button>
				</div>
			</div>

			<!-- Zone de jeu -->
			<div id="game" class="hidden w-full max-w-6xl">
				<!-- Bouton retour -->
				<button id="backToMenuBtn" class="mb-6 ${classes.backButton}">
					${i18n.t('chat.back')}
				</button>

				<!-- Bouton restart -->
				<button id="restartBtn" class="hidden mb-6 mx-auto ${classes.actionButton}">
					${i18n.t('game.new_game')}
				</button>

				<!-- Informations de connexion SERVER-SIDE -->
				<div class="${classes.retroPanel} rounded-xl p-4 mb-4">
					<div class="flex justify-center items-center gap-4 text-sm">
						<span id="connectionStatus">🔴 Déconnecté du serveur</span>
						<span id="gameId"></span>
						<span class="text-green-400">⚡ 100% Server-Side</span>
					</div>
				</div>

				<!-- Tableau de score -->
				<div id="scoreboard" class="${classes.scoreboardPanel} rounded-2xl p-6 mb-6">
					<div class="grid grid-cols-2 gap-8 text-center">
						<div class="${classes.retroPanel} rounded-xl p-4">
							<p id="scoreP1" class="text-2xl font-bold text-purple-300">
							${i18n.t('game.player_1')} : 0
							</p>
						</div>
						<div class="${classes.retroPanel} rounded-xl p-4">
							<p id="scoreP2" class="text-2xl font-bold text-purple-300">
							${i18n.t('game.player_2')} : 0
							</p>
						</div>
					</div>
				</div>

				<!-- Canvas avec cadre futuriste -->
				<div class="relative ${classes.gameCanvasFrame} rounded-2xl mx-auto" style="width: 800px; height: 600px;">
					<canvas id="gameCanvas" width="800" height="600" class="rounded-xl bg-black w-full h-full"></canvas>
					<!-- Indicateurs de coin -->
					<div class="absolute top-2 left-2 ${classes.cornerIndicator} border-l-2 border-t-2"></div>
					<div class="absolute top-2 right-2 ${classes.cornerIndicator} border-r-2 border-t-2"></div>
					<div class="absolute bottom-2 left-2 ${classes.cornerIndicator} border-l-2 border-b-2"></div>
					<div class="absolute bottom-2 right-2 ${classes.cornerIndicator} border-r-2 border-b-2"></div>
				</div>

				<!-- Compte à rebours -->
				<div id="countdowndisplay" class="text-6xl font-bold ${classes.neonText} mt-8 text-center"></div>

				<!-- Message de fin de partie -->
				<div id="endMessage" class="text-3xl font-bold ${classes.neonText} mt-8 text-center hidden">
				</div>

				<!-- Contrôles -->
				<div id="control_solo" class="hidden ${classes.controlPanel} mt-8">
					<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
					${i18n.t('game.control')}
					</h3>
					<div class="grid grid-cols-1 gap-4 text-center">
						<div class="${classes.controlItem}">
							<p class="text-purple-300 font-semibold">
							${i18n.t('game.p1')}
							</p>
							<p class="text-sm text-gray-300">W / S</p>
						</div>
					</div>
				</div>

				<div id="control_versus" class="hidden ${classes.controlPanel} mt-8">
					<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
					${i18n.t('game.control')}
					</h3>
					<div class="grid grid-cols-2 gap-4 text-center">
						<div class="${classes.controlItem}">
							<p class="text-purple-300 font-semibold">
							${i18n.t('game.p1')}
							</p>
							<p class="text-sm text-gray-300">W / S</p>
						</div>
						<div class="${classes.controlItem}">
							<p class="text-purple-300 font-semibold">
							${i18n.t('game.p2')}
							</p>
							<p class="text-sm text-gray-300">↑ / ↓</p>
						</div>
					</div>
				</div>

				<div id="control_multi" class="hidden ${classes.controlPanel} mt-8">
					<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
					${i18n.t('game.control')} (4 joueurs - 2v2)
					</h3>
					<div class="grid grid-cols-2 gap-6 text-center">
						<div>
							<strong class="text-cyan-400">👥 ÉQUIPE 1 (Gauche)</strong><br>
							<div class="mt-2">
								<div class="${classes.controlItem}">
									<p class="text-purple-300 font-semibold">P1 (Haut)</p>
									<p class="text-sm text-gray-300">W / S</p>
								</div>
								<div class="${classes.controlItem} mt-2">
									<p class="text-purple-300 font-semibold">P2 (Bas)</p>
									<p class="text-sm text-gray-300">J / M</p>
								</div>
							</div>
						</div>
						<div>
							<strong class="text-pink-400">👥 ÉQUIPE 2 (Droite)</strong><br>
							<div class="mt-2">
								<div class="${classes.controlItem}">
									<p class="text-purple-300 font-semibold">P3 (Haut)</p>
									<p class="text-sm text-gray-300">9 / 6</p>
								</div>
								<div class="${classes.controlItem} mt-2">
									<p class="text-purple-300 font-semibold">P4 (Bas)</p>
									<p class="text-sm text-gray-300">↑ / ↓</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		`;

		// Add language switcher
		const languageSwitcherContainer = page.querySelector("#language-switcher-container");
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}

		// Initialize game logic
		initializeGameLogic();
	};

	renderContent();

	// Re-render when language changes
	window.addEventListener("languageChanged", renderContent);

	page.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute("data-route");
		if (route) {
			cleanupCurrentClient();

			import("../router/router.js").then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	function cleanupCurrentClient(): void {
		if (currentClient) {
			console.log("🧹 Nettoyage du client WebSocket en cours...");

			if (typeof currentClient.cleanup === "function") {
				currentClient.cleanup();
			}

			if (typeof currentClient.back_to_menu === "function") {
				currentClient.back_to_menu();
			}

			if (typeof currentClient.destroy === "function") {
				currentClient.destroy();
			}

			currentClient = null;
			gameMode = null;
		}
	}

	// Réinitialiser l'interface
	function resetUIState(): void {
		const menu = page.querySelector("#menu") as HTMLElement;
		const game = page.querySelector("#game") as HTMLElement;
		const restart = page.querySelector("#restartBtn") as HTMLButtonElement;
		const controlSolo = page.querySelector("#control_solo") as HTMLElement;
		const controlVersus = page.querySelector("#control_versus") as HTMLElement;
		const controlMulti = page.querySelector("#control_multi") as HTMLElement;

		const loginBtn = page.querySelector("#loginBtn") as HTMLButtonElement;
		const logoutBtn = page.querySelector("#logoutBtn") as HTMLButtonElement;
		const chatBtn = page.querySelector("#chatBtn") as HTMLButtonElement;
		const profilBtn = page.querySelector("#profilBtn") as HTMLButtonElement;
		const nameId = page.querySelector("#nameId") as HTMLElement;

		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		languageSwitcherContainer?.classList.remove("hidden");

		// Cacher tous les menus sauf le menu principal
		game.style.display = "none";
		menu.style.display = "block";

		// Cacher les contrôles et le bouton restart
		restart.style.display = "none";
		controlSolo.style.display = "none";
		controlVersus.style.display = "none";
		controlMulti.style.display = "none";

		// Gérer le log-in
		const token = sessionStorage.getItem("authToken");
		if (!token) {
			loginBtn.classList.remove("hidden");
			chatBtn.classList.add("hidden");
			profilBtn.classList.add("hidden");
			logoutBtn.classList.add("hidden");
		} else {
			loginBtn.classList.add("hidden");
			chatBtn.classList.remove("hidden");
			profilBtn.classList.remove("hidden");
			logoutBtn.classList.remove("hidden");
			nameId.classList.remove("hidden");
			const userId = sessionStorage.getItem("username");
			nameId.innerText = `${userId}`;
		}
	}

	function initializeGameLogic() {
		const menu = page.querySelector("#menu") as HTMLElement;
		const soloBtn = page.querySelector("#soloBtn") as HTMLButtonElement;
		const versusBtn = page.querySelector("#versusBtn") as HTMLButtonElement;
		const multiBtn = page.querySelector("#multiBtn") as HTMLButtonElement;

		const game = page.querySelector("#game") as HTMLElement;
		const restart = page.querySelector("#restartBtn") as HTMLButtonElement;
		const backToMenuBtn = page.querySelector("#backToMenuBtn") as HTMLButtonElement;
		const controlSolo = page.querySelector("#control_solo") as HTMLElement;
		const controlVersus = page.querySelector("#control_versus") as HTMLElement;
		const controlMulti = page.querySelector("#control_multi") as HTMLElement;
		const scoreP1 = page.querySelector("#scoreP1") as HTMLElement;
		const scoreP2 = page.querySelector("#scoreP2") as HTMLElement;

		const loginBtn = page.querySelector("#loginBtn") as HTMLButtonElement;
		const logoutBtn = page.querySelector("#logoutBtn") as HTMLButtonElement;
		const chatBtn = page.querySelector("#chatBtn") as HTMLButtonElement;
		const profilBtn = page.querySelector("#profilBtn") as HTMLButtonElement;
		const nameId = page.querySelector("#nameId") as HTMLElement;

		// Connecté ou non
		const token = sessionStorage.getItem("authToken");
		if (!token) {
			loginBtn.classList.remove("hidden");
			chatBtn.classList.add("hidden");
			profilBtn.classList.add("hidden");
			logoutBtn.classList.add("hidden");
		} else {
			loginBtn.classList.add("hidden");
			logoutBtn.classList.remove("hidden");
			chatBtn.classList.remove("hidden");
			profilBtn.classList.remove("hidden");
			nameId.classList.remove("hidden");
			const userId = sessionStorage.getItem("username");
			nameId.innerText = `${userId}`;
		}

		function backToMainMenu(): void {
			cleanupCurrentClient();
			resetUIState();
		}

		// ⚡ FONCTION 100% SERVER-SIDE - Aucun calcul côté client
		async function startServerGame(mode: 'solo' | 'versus' | 'multi'): Promise<void> {
			cleanupCurrentClient();
			gameMode = mode;
			
			const languageSwitcherContainer = page.querySelector('#language-switcher-container');
			languageSwitcherContainer?.classList.add("hidden");

			try {
				console.log(`🚀 Connexion au serveur ${mode.toUpperCase()} (100% server-side)...`);

				const connectionStatus = page.querySelector("#connectionStatus");
				if (connectionStatus) {
					connectionStatus.textContent = "🟡 Connexion au serveur de jeu...";
				}

				// ⚡ CRÉATION DU CLIENT WEBSOCKET (PAS DE LOGIQUE DE JEU)
				currentClient = new ServerGame_solo(mode);
				await currentClient.start_game_loop();

				// Interface
				menu.style.display = "none";
				game.style.display = "block";
				restart.style.display = "block";
				loginBtn.classList.add("hidden");
				logoutBtn.classList.add("hidden");
				profilBtn.classList.add("hidden");
				chatBtn.classList.add("hidden");
				nameId.classList.add("hidden");

				// Afficher les bons contrôles
				showControlsForMode(mode);

				// Mettre à jour les scores
				updateScoreLabels(mode);

				// Succès de connexion
				if (connectionStatus) {
					connectionStatus.textContent = "🟢 Connecté au serveur de jeu";
				}

				const gameIdElement = page.querySelector("#gameId");
				if (gameIdElement && currentClient.currentGameId) {
					gameIdElement.textContent = `ID: ${currentClient.currentGameId}`;
				}

				console.log(`✅ ${mode.toUpperCase()} SERVER-SIDE GAME CONNECTED!`);

			} catch (error) {
				console.error(`❌ Échec de la connexion au serveur ${mode}:`, error);

				const connectionStatus = page.querySelector("#connectionStatus");
				if (connectionStatus) {
					connectionStatus.textContent = "🔴 Erreur de connexion serveur";
				}

				// Nettoyage en cas d'erreur
				if (currentClient) {
					currentClient.disconnect();
					currentClient = null;
				}

				alert(`❌ Impossible de se connecter au serveur de jeu ${mode}.\n\nVérifiez que :\n• Le serveur backend est démarré\n• Les WebSockets sont activés\n• L'API est accessible sur /api/game/create\n\n⚡ Le jeu fonctionne 100% côté serveur !`);
			}
		}

		function showControlsForMode(mode: 'solo' | 'versus' | 'multi'): void {
			controlSolo.style.display = "none";
			controlVersus.style.display = "none";
			controlMulti.style.display = "none";

			if (mode === 'solo') {
				controlSolo.style.display = "block";
			} else if (mode === 'versus') {
				controlVersus.style.display = "block";
			} else if (mode === 'multi') {
				controlMulti.style.display = "block";
			}
		}

		function updateScoreLabels(mode: 'solo' | 'versus' | 'multi'): void {
			const token = sessionStorage.getItem("authToken");
			const userName = token ? sessionStorage.getItem("username") : null;

			if (mode === 'solo') {
				scoreP1.textContent = `${userName || 'Joueur 1'} : 0`;
				scoreP2.textContent = 'IA : 0';
			} else if (mode === 'versus') {
				scoreP1.textContent = `${userName || 'Joueur 1'} : 0`;
				scoreP2.textContent = 'Joueur 2 : 0';
			} else if (mode === 'multi') {
				scoreP1.textContent = 'Équipe 1 : 0';
				scoreP2.textContent = 'Équipe 2 : 0';
			}
		}

		function restartGame(): void {
			if (currentClient) {
				console.log("🔄 Demande de redémarrage au serveur...");
				currentClient.restart();
			}
		}

		function login() {
			import("../router/router.js").then(({ router }) => {
				router.navigate("/login");
			});
		}

		function go_profil() {
			import("../router/router.js").then(({ router }) => {
				router.navigate("/profile");
			});
		}

		function go_chat() {
			import("../router/router.js").then(({ router }) => {
				router.navigate("/chat");
			});
		}

		// ✅ PROTECTION CONTRE LES CLICS MULTIPLES
		let isButtonClickInProgress = false;

		function createProtectedClickHandler(handler: Function, buttonName: string) {
			return (...args: unknown[]) => {
				if (isButtonClickInProgress) {
					console.log(`⚠️ ${buttonName} click ignored - operation in progress`);
					return;
				}

				isButtonClickInProgress = true;
				console.log(`🎯 ${buttonName} clicked - connecting to server...`);

				try {
					handler(...args);
				} finally {
					setTimeout(() => {
						isButtonClickInProgress = false;
					}, 500);
				}
			};
		}

		// Event Listeners
		backToMenuBtn.addEventListener('click', () => backToMainMenu());

		soloBtn.addEventListener('click', createProtectedClickHandler(
			() => startServerGame('solo'), "Solo Server Game"
		));
		versusBtn.addEventListener('click', createProtectedClickHandler(
			() => startServerGame('versus'), "Versus Server Game"
		));
		multiBtn.addEventListener('click', createProtectedClickHandler(
			() => startServerGame('multi'), "Multi Server Game"
		));

		restart.addEventListener('click', () => restartGame());

		loginBtn.addEventListener("click", () => login());
		logoutBtn.addEventListener("click", async () => {
			try {
				const response = await fetch("/api/logout", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
					},
				});

				if (response.ok) {
					console.log("Logout successful on backend.");
				} else {
					console.error("Backend logout failed.");
				}
			} catch (error) {
				console.error("Error during logout fetch:", error);
			} finally {
				sessionStorage.clear();
				import("../router/router.js").then(({ router }) => {
					router.navigate("/game");
				});
			}
		});

		profilBtn.addEventListener("click", () => go_profil());
		chatBtn.addEventListener("click", () => go_chat());
	}

	window.addEventListener("beforeunload", () => {
		cleanupCurrentClient();
	});

	return page;
}