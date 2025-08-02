import { Page } from "../router/router.js";
import { i18n } from "../services/i18n.js";
import { ServerGame_solo } from "../components/game/ServerPongGame.js";
import { classes } from "../styles/retroStyles.js";

export function createServerGamePage(): HTMLElement {
	const serverGamePage = new ServerGamePage();
	const container = document.createElement("div");
	container.innerHTML = serverGamePage.render();

	// Appeler onMount après que le DOM soit créé
	requestAnimationFrame(() => {
		serverGamePage.onMount();
	});

	return container;
}

export class ServerGamePage implements Page {
	private statusInterval: number | null = null;
	private currentGame: ServerGame_solo | null = null;
	private navigationListener: ((e: Event) => void) | null = null;
	private handleVisibilityChange: (() => void) | null = null;

	render(): string {
		return `
		<style>
			/* Import de la police Orbitron pour le thème rétro */
			@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

			* {
				font-family: 'Orbitron', monospace;
			}
		</style>

		<!-- Conteneur principal avec effet scan -->
		<div class="min-h-screen bg-gray-900 text-white font-mono overflow-hidden ${classes.scanLinesContainer}">
			<div class="min-h-screen flex flex-col items-center justify-center p-4">
				
				<!-- Titre principal avec effet néon -->
				<h1 class="${classes.retroTitle} mb-12">
					🎮 RETRO PONG SERVER
				</h1>
				
				<!-- Menu principal -->
				<div id="menu" class="${classes.retroPanel} rounded-2xl p-8 max-w-2xl w-full">
					<button class="mb-6 ${classes.backButton}" data-route="/game">
						${i18n.t('chat.back')}
					</button>
					<h2 class="${classes.sectionTitle}">
						MODE DE JEU SERVER-SIDE
					</h2>
					
					<div class="flex flex-col gap-6">
						<button class="${classes.gameModeButton}" data-route="/server-game/solo">
							<span class="relative z-10">🤖 SOLO (VS IA)</span>
						</button>
						<button class="${classes.gameModeButton}" data-route="/server-game/versus">
							<span class="relative z-10">👥 VERSUS (2 JOUEURS)</span>
						</button>
						<button class="${classes.gameModeButton}" data-route="/server-game/multi">
							<span class="relative z-10">🎯 MULTIJOUEUR (2v2)</span>
						</button>
					</div>
				</div>

				<!-- Informations API -->
				<div class="api-panel rounded-lg p-4 mb-6">
					<h3 class="text-lg font-semibold neon-text mb-2">📡 API Endpoints disponibles</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-300">
						<div><code class="text-green-400">GET /api/games</code> - Lister les parties</div>
						<div><code class="text-green-400">POST /api/game/create</code> - Créer une partie</div>
						<div><code class="text-blue-400">GET /api/game/:id/state</code> - État complet</div>
						<div><code class="text-blue-400">GET /api/game/:id/ball</code> - Position balle</div>
						<div><code class="text-blue-400">GET /api/game/:id/paddles</code> - Position raquettes</div>
						<div><code class="text-blue-400">GET /api/game/:id/score</code> - Score actuel</div>
					</div>
				</div>

				<!-- Zone de jeu (cachée par défaut) -->
				<div id="game" class="hidden w-full max-w-6xl">
					<!-- Bouton retour -->
					<button id="backToMenuBtn" class="mb-6 ${classes.backButton}">
						${i18n.t('chat.back')}
					</button>

					<!-- Statut de connexion -->
					<div class="${classes.retroPanel} rounded-xl p-4 mb-6">
						<div class="text-center">
							<p id="connectionStatus" class="${classes.neonText}">🟡 Initialisation...</p>
							<p id="gameId" class="text-purple-300 text-sm mt-2">ID: -</p>
						</div>
					</div>

					<!-- Bouton restart -->
					<button id="restartBtn" class="hidden mb-6 mx-auto ${classes.actionButton}">
						${i18n.t('game.new_game')}
					</button>

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
					<div id="endMessage" class="text-3xl font-bold ${classes.neonText} mt-8 text-center"></div>

					<!-- Contrôles pour 2 joueurs -->
					<div id="controls2Players" class="hidden ${classes.controlPanel} mt-8">
						<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
							${i18n.t('game.control')}
						</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
							<div class="${classes.controlItem}">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p1')}</p>
								<p class="text-sm text-gray-300">W / S</p>
							</div>
							<div class="${classes.controlItem}">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p2')}</p>
								<p class="text-sm text-gray-300">↑ / ↓</p>
							</div>
						</div>
					</div>

					<!-- Contrôles pour 4 joueurs -->
					<div id="controls4Players" class="hidden ${classes.controlPanel} mt-8">
						<h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
							${i18n.t('game.control')}
						</h3>
						<div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
							<div class="${classes.controlItem}">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p1')}</p>
								<p class="text-sm text-gray-300">W / S</p>
							</div>
							<div class="${classes.controlItem}">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p2')}</p>
								<p class="text-sm text-gray-300">J / M</p>
							</div>
							<div class="${classes.controlItem}">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p3')}</p>
								<p class="text-sm text-gray-300">9 / 6</p>
							</div>
							<div class="${classes.controlItem}">
								<p class="text-purple-300 font-semibold">${i18n.t('game.p4')}</p>
								<p class="text-sm text-gray-300">↑ / ↓</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		`;
	}

	async onMount(): Promise<void> {
		//console.log("🎮 Server Game Page mounted");

		// Vérifier l'état du serveur
		await this.checkServerStatus();

		// ✅ OPTIMISATION : polling moins agressif et intelligent
		if (!this.statusInterval) {
			// Démarrer avec un délai plus long et seulement si la page est visible
			this.setupIntelligentPolling();
		}

		// Gérer les clics sur les boutons avec data-route
		this.navigationListener = (e: Event) => {
			const target = e.target as HTMLElement;
			const route = target.getAttribute("data-route");
			if (route) {
				//console.log("🔄 Navigating to:", route);

				// Empêcher la propagation pour éviter les conflits
				e.preventDefault();
				e.stopPropagation();

				import("../router/router.js")
					.then(({ router }) =>
					{
						//console.log("🚀 Router imported, navigating to:", route);
						router.navigate(route).catch((error) => {
							console.error("❌ Navigation failed:", error);
						});
					})
					.catch((error) => {
						console.error("❌ Failed to import router:", error);
					});
			}
		};

		document.addEventListener("click", this.navigationListener);
		//console.log("🎯 Navigation event listener added to document");
	}

	private async startGame(mode: "solo" | "versus" | "multi"): Promise<void> {
		try {
			//console.log(`🚀 LAUNCHING SERVER-SIDE ${mode.toUpperCase()} GAME...`);

			const connectionStatus = document.getElementById("connectionStatus");
			const gameIdElement = document.getElementById("gameId");
			const restartBtn = document.getElementById("restartBtn") as HTMLButtonElement;

			if (connectionStatus) {
				connectionStatus.textContent = "🟡 Connexion au serveur...";
			}

			// Arrêter le jeu actuel s'il existe
			if (this.currentGame) {
				this.currentGame.disconnect();
			}

			// Créer et démarrer le nouveau jeu SERVER-SIDE
			//console.log("🎮 Creating server-side game instance...");
			this.currentGame = new ServerGame_solo(mode);

			//console.log("🔌 Connecting to game server...");
			await this.currentGame.start_game_loop();

			// ✅ SUCCÈS - Mettre à jour l'interface
			if (connectionStatus) {
				connectionStatus.textContent = "🟢 Connecté au serveur";
			}

			if (gameIdElement && this.currentGame.currentGameId) {
				gameIdElement.textContent = `ID: ${this.currentGame.currentGameId}`;
			}

			// Activer le bouton restart
			if (restartBtn) {
				restartBtn.disabled = false;
				restartBtn.classList.remove("hidden");
			}

			// Basculer l'affichage des contrôles selon le mode
			this.showControlsForMode(mode);

			//console.log(`✅ ${mode.toUpperCase()} SERVER GAME LAUNCHED SUCCESSFULLY!`);
			//console.log(`🎮 Game ID: ${this.currentGame.currentGameId}`);
			//console.log(`🎯 Use W/S (Player 1) and ↑/↓ (Player 2) to control paddles`);
		} catch (error) {
			//console.error(`❌ Failed to start server-side ${mode} game:`, error);

			const connectionStatus = document.getElementById("connectionStatus");

			if (connectionStatus) {
				connectionStatus.textContent = "🔴 Erreur de connexion";
			}

			alert(
				`❌ Impossible de démarrer la partie server-side ${mode}.\n\nVérifiez que :\n• Le serveur backend est démarré\n• Les WebSockets sont activés\n• L'API est accessible sur /api/game/create`
			);
		}
	}

	private showControlsForMode(mode: "solo" | "versus" | "multi"): void {
		const controls2Players = document.getElementById("controls2Players");
		const controls4Players = document.getElementById("controls4Players");

		if (mode === "multi") {
			// Mode 2v2 - Afficher les contrôles pour 4 joueurs
			if (controls2Players) controls2Players.classList.add("hidden");
			if (controls4Players) controls4Players.classList.remove("hidden");
		} else {
			// Mode solo/versus - Afficher les contrôles pour 2 joueurs
			if (controls2Players) controls2Players.classList.remove("hidden");
			if (controls4Players) controls4Players.classList.add("hidden");
		}
	}

	private restartGame(): void {
		if (this.currentGame) {
			console.log("🔄 Restarting game...");
			this.currentGame.restart();
		} else {
			console.log("⚠️ No active game to restart");
		}
	}

	// ✅ NOUVEAU : polling intelligent basé sur la visibilité de l'onglet
	private setupIntelligentPolling(): void {
		const startPolling = (interval: number) => {
			if (this.statusInterval) {
				clearInterval(this.statusInterval);
			}
			this.statusInterval = setInterval(() => {
				if (!document.hidden) {
					// Seulement si l'onglet est visible
					this.checkServerStatus();
				}
			}, interval) as unknown as number;
		};

		// Polling adaptatif : plus lent si l'onglet n'est pas visible
		this.handleVisibilityChange = () => {
			if (document.hidden) {
				// Onglet en arrière-plan : polling très lent (60 secondes)
				startPolling(60000);
			} else {
				// Onglet actif : polling normal (30 secondes au lieu de 10)
				startPolling(30000);
			}
		};

		// Écouter les changements de visibilité
		document.addEventListener("visibilitychange", this.handleVisibilityChange);

		// Démarrer avec la fréquence appropriée
		this.handleVisibilityChange();
	}

	private async checkServerStatus(): Promise<void> {
		try {
			// ✅ OPTIMISATION : une seule requête combinée au lieu de deux
			const gamesResponse = await fetch("/api/games");
			const gamesData = await gamesResponse.json();

			// Mettre à jour l'interface
			const serverState = document.getElementById("serverState");
			const activeGames = document.getElementById("activeGames");

			if (serverState) {
				// Utiliser les données de /api/games pour déterminer l'état du serveur
				serverState.textContent = gamesData.success ? "🟢 En ligne" : "🔴 Erreur";
			}

			if (activeGames && gamesData.success) {
				activeGames.textContent = gamesData.totalGames.toString();
			}
		} catch (error) {
			//console.error("Failed to check server status:", error);

			const serverState = document.getElementById("serverState");
			if (serverState) {
				serverState.textContent = "🔴 Hors ligne";
			}
		}
	}

	onUnmount(): void {
		//console.log("🎮 Server Game Page unmounting");

		// ✅ AMÉLIORATION : nettoyer l'interval
		if (this.statusInterval) {
			clearInterval(this.statusInterval);
			this.statusInterval = null;
		}

		// ✅ NOUVEAU : supprimer l'event listener de visibilité
		if (this.handleVisibilityChange) {
			document.removeEventListener("visibilitychange", this.handleVisibilityChange);
		}

		// Supprimer l'event listener de navigation
		if (this.navigationListener) {
			document.removeEventListener("click", this.navigationListener);
			this.navigationListener = null;
		}

		// Déconnecter et nettoyer le jeu actuel
		if (this.currentGame) {
			//console.log("🔌 Disconnecting current game before unmounting...");
			this.currentGame.disconnect();
			this.currentGame = null;
		}
	}
}