import { Page } from "../router/router.js";
import { ServerGame_solo } from "../components/game/ServerPongGame.js";
import { classes } from "../styles/retroStyles.js";
import { i18n } from "../services/i18n.js";

export function createServerGameVersusPage(): HTMLElement {
	const serverGameVersusPage = new ServerGameVersusPage();
	const container = document.createElement("div");
	container.innerHTML = serverGameVersusPage.render();

	requestAnimationFrame(() => {
		serverGameVersusPage.onMount();
	});

	return container;
}

export class ServerGameVersusPage implements Page {
	private currentGame: ServerGame_solo | null = null;
	private isGameStarting: boolean = false;
	private static isInstanceActive: boolean = false;
	private navigationListener: ((e: Event) => void) | null = null;
	//private restartListener: (() => void) | null = null;

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
					🏓 RETRO PONG SERVER
				</h1>

				<!-- Zone de jeu -->
				<div id="game" class="w-full max-w-6xl">
					<!-- Bouton retour -->
					<button id="backToMenuBtn" class="mb-6 ${classes.backButton}" data-route="/server-game">
						${i18n.t('chat.back')}
					</button>

					<!-- Statut de connexion -->
					<div class="${classes.retroPanel} rounded-xl p-4 mb-6">
						<div class="text-center">
							<p id="connectionStatus" class="${classes.neonText}">🟡 Initialisation...</p>
							<p id="gameId" class="text-purple-300 text-sm mt-2">ID: -</p>
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
					</div>

					<!-- Compte à rebours -->
					<div id="countdowndisplay" class="text-6xl font-bold ${classes.neonText} mt-8 text-center"></div>

					<!-- Message de fin de partie -->
					<div id="endMessage" class="text-3xl font-bold ${classes.neonText} mt-8 text-center"></div>

					<!-- Contrôles -->
					<div class="${classes.controlPanel} mt-8">
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
								<p class="text-sm text-gray-300">9 / 6</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		`;
	}

	async onMount(): Promise<void> {
		////console.log("👥 Server Game Versus Page mounted");

		// ✅ PROTECTION CONTRE LES INSTANCES MULTIPLES
		if (ServerGameVersusPage.isInstanceActive)
		{
			//console.log("⚠️ Instance already active, preventing duplicate creation");
			return; // Sortir immédiatement si une instance est déjà active
		}

		ServerGameVersusPage.isInstanceActive = true;

		// ✅ PROTECTION CONTRE LES APPELS MULTIPLES
		if (this.currentGame) {
			//console.log("⚠️ Game already exists, cleaning up first");
			this.currentGame.disconnect();
			this.currentGame = null;
		}

		// Gérer les clics sur les boutons avec data-route
		this.navigationListener = (e: Event) => {
			const target = e.target as HTMLElement;
			const route = target.getAttribute("data-route");
			if (route) {
				// Nettoyer avant de naviguer
				this.onUnmount();
				import("../router/router.js").then(({ router }) => {
					router.navigate(route);
				});
			}
		};
		document.addEventListener("click", this.navigationListener);

		// ✅ DÉMARRAGE SÉCURISÉ
		try {
			await this.startVersusGame();
		} catch (error) {
			console.error("Failed to start game:", error);
			ServerGameVersusPage.isInstanceActive = false; // Libérer le verrou en cas d'erreur
		}

		// Event listener pour le bouton restart
		// const restartBtn = document.getElementById("restartBtn");
		// if (restartBtn) {
		// 	this.restartListener = () => this.restartGame();
		// 	restartBtn.addEventListener("click", this.restartListener);
		// }
	}

	private async startVersusGame(): Promise<void> {
		// ✅ VÉRIFICATION SUPPLÉMENTAIRE
		if (this.currentGame) {
			//console.log("⚠️ Game already running, skipping creation");
			return;
		}

		if (this.isGameStarting) {
			//console.log("⚠️ Game already starting, ignoring...");
			return;
		}

		this.isGameStarting = true;

		try {
			//console.log("🚀 Auto-starting server-side VERSUS game...");

			const connectionStatus =
				document.getElementById("connectionStatus");
			if (connectionStatus) {
				connectionStatus.textContent = "🟡 Connexion au serveur...";
			}

			// Créer et démarrer le jeu SERVER-SIDE VERSUS
			//console.log("🎮 Creating new versus game...");
			this.currentGame = new ServerGame_solo("versus");

			//console.log("🔌 Connecting to game server...");
			await this.currentGame.start_game_loop();

			// ✅ SUCCÈS
			if (connectionStatus) {
				connectionStatus.textContent = "🟢 Connecté au serveur";
			}

			const gameIdElement = document.getElementById("gameId");
			if (gameIdElement && this.currentGame.currentGameId) {
				gameIdElement.textContent = `ID: ${this.currentGame.currentGameId}`;
			}

			//console.log("✅ SERVER-SIDE VERSUS GAME LAUNCHED!");
		} catch (error) {
			console.error("❌ Failed to start server-side versus game:", error);

			// ✅ NETTOYAGE EN CAS D'ERREUR
			if (this.currentGame) {
				this.currentGame.disconnect();
				this.currentGame = null;
			}

			const connectionStatus =
				document.getElementById("connectionStatus");
			if (connectionStatus) {
				connectionStatus.textContent = "🔴 Erreur de connexion";
			}

			// Relancer l'erreur pour que onMount() puisse libérer le verrou
			throw error;
		} finally {
			this.isGameStarting = false;
		}
	}

	private restartGame(): void {
		if (this.currentGame) {
			//console.log("🔄 Restarting versus game...");
			this.currentGame.restart();
		}
	}

	onUnmount(): void {
		//console.log("👥 Server Game Versus Page unmounting");

		// Supprimer les event listeners
		if (this.navigationListener) {
			document.removeEventListener("click", this.navigationListener);
			this.navigationListener = null;
		}

		// if (this.restartListener) {
		// 	const restartBtn = document.getElementById("restartBtn");
		// 	if (restartBtn) {
		// 		restartBtn.removeEventListener("click", this.restartListener);
		// 	}
		// 	this.restartListener = null;
		// }

		// Déconnecter et nettoyer le jeu actuel
		if (this.currentGame) {
			//console.log("🔌 Disconnecting current game before unmounting...");
			this.currentGame.disconnect();
			this.currentGame = null;
		}

		// Marquer qu'on n'est plus en train de démarrer
		this.isGameStarting = false;

		// Réinitialiser le flag pour permettre de nouvelles instances
		ServerGameVersusPage.isInstanceActive = false;
	}
}