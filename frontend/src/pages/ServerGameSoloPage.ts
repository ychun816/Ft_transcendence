import { Page } from "../router/router.js";
import { ServerGame_solo } from "../components/game/ServerPongGame.js";
import { classes } from "../styles/retroStyles.js";
import { i18n } from "../services/i18n.js";

export function createServerGameSoloPage(): HTMLElement {
	const serverGameSoloPage = new ServerGameSoloPage();
	const container = document.createElement("div");
	container.innerHTML = serverGameSoloPage.render();

	// Appeler onMount après que le DOM soit créé
	requestAnimationFrame(() => {
		serverGameSoloPage.onMount();
	});

	return container;
}

export class ServerGameSoloPage implements Page {
	private currentGame: ServerGame_solo | null = null;
	private static isInstanceActive: boolean = false;
	private navigationListener: ((e: Event) => void) | null = null;
	private restartListener: (() => void) | null = null;

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

					<!-- Bouton restart -->
					<button id="restartBtn" class="mb-6 mx-auto ${classes.actionButton} block">
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
									IA : 0
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

                .scan-lines::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        transparent 0%,
                        #9d4edd10 50%,
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

                .scoreboard-panel {
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a0d1a 50%, #0a0a0a 100%);
                    border: 2px solid #9d4edd;
                    box-shadow:
                        0 0 20px #9d4edd60,
                        inset 0 0 20px #9d4edd30;
                }

                .game-canvas-frame {
                    background: #050505;
                    border: 3px solid #9d4edd;
                    box-shadow:
                        0 0 30px #9d4edd80,
                        inset 0 0 30px #9d4edd40;
                }

                .corner-indicator {
                    width: 20px;
                    height: 20px;
                    border: 3px solid #9d4edd;
                    box-shadow: 0 0 10px #9d4edd;
                }
            </style>

            <!-- Champ d'étoiles -->
            <div class="starfield"></div>

            <div class="min-h-screen bg-gray-900 text-white font-mono overflow-hidden scan-lines relative">
                <div class="min-h-screen flex flex-col items-center justify-center p-4">

                    <!-- Bouton retour -->
                    <div class="absolute top-4 left-4">
                        <button class="retro-button text-white font-bold py-2 px-6 rounded-lg transition-all duration-300" data-route="/game">
                            ← RETOUR
                        </button>
                    </div>

                    <!-- Titre du mode -->
                    <h1 class="text-4xl font-bold neon-text mb-8 text-center">
                        🤖 SERVER-SIDE SOLO (VS IA)
                    </h1>

                    <!-- Zone de jeu principale -->
                    <div class="retro-panel rounded-lg p-6 shadow-2xl w-full max-w-4xl">
                        <!-- Scores -->
                        <div class="scoreboard-panel rounded-xl p-4 mb-4">
                            <div class="flex justify-between items-center">
                                <div id="scoreP1" class="text-2xl font-bold neon-text">Joueur 1 : 0</div>
                                <div id="gameInfo" class="text-center">
                                    <div id="countdowndisplay" class="text-3xl font-bold text-yellow-400 mb-2"></div>
                                    <div class="text-sm text-purple-300">
                                        <span id="connectionStatus">🔴 Déconnecté</span>
                                        <span id="gameId" class="ml-4"></span>
                                    </div>
                                </div>
                                <div id="scoreP2" class="text-2xl font-bold neon-text">IA : 0</div>
                            </div>
                        </div>

                        <!-- Canvas de jeu -->
                        <div class="flex justify-center">
                            <div class="game-canvas-frame rounded-lg p-2 relative">
                                <!-- Indicateurs de coin -->
                                <div class="corner-indicator absolute top-0 left-0"></div>
                                <div class="corner-indicator absolute top-0 right-0"></div>
                                <div class="corner-indicator absolute bottom-0 left-0"></div>
                                <div class="corner-indicator absolute bottom-0 right-0"></div>

                                <canvas
                                    id="gameCanvas"
                                    width="800"
                                    height="600"
                                    class="rounded-lg bg-black"
                                ></canvas>
                            </div>
                        </div>

                        <!-- Contrôles -->
                        <div class="mt-6 text-center">
                            <div class="retro-panel rounded-lg p-4 inline-block">
                                <h4 class="text-lg font-semibold neon-text mb-2">🎮 Contrôles</h4>
                                <div class="text-sm text-purple-300">
                                    <strong class="text-cyan-400">Joueur 1:</strong><br>
                                    W = Haut | S = Bas
                                </div>
                            </div>
                        </div>

                        <!-- Boutons de contrôle -->
                        <div class="mt-6 text-center">
                            <button id="restartBtn" class="retro-button text-yellow-300 font-bold py-3 px-6 rounded-lg transition-all duration-300 mr-4">
                                <span class="relative z-10">🔄 REDÉMARRER</span>
                            </button>
                        </div>

                        <!-- Message de fin -->
                        <div id="endMessage" class="text-center text-3xl font-bold text-yellow-400 mt-6 hidden"></div>
                    </div>
                </div>
            </div>
        `;
	}

	async onMount(): Promise<void> {
		console.log("🤖 Server Game Solo Page mounted");

		// ✅ PROTECTION CONTRE LES INSTANCES MULTIPLES
		if (ServerGameSoloPage.isInstanceActive) {
			console.log(
				"⚠️ Instance already active, preventing duplicate creation"
			);
			return; // Sortir immédiatement si une instance est déjà active
		}

		ServerGameSoloPage.isInstanceActive = true;

		// ✅ PROTECTION CONTRE LES APPELS MULTIPLES
		if (this.currentGame) {
			console.log("⚠️ Game already exists, cleaning up first");
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
			await this.startSoloGame();
		} catch (error) {
			console.error("Failed to start game:", error);
			ServerGameSoloPage.isInstanceActive = false; // Libérer le verrou en cas d'erreur
		}

		// Event listener pour le bouton restart
		const restartBtn = document.getElementById("restartBtn");
		if (restartBtn) {
			this.restartListener = () => this.restartGame();
			restartBtn.addEventListener("click", this.restartListener);
		}
	}

	private async startSoloGame(): Promise<void> {
		// ✅ VÉRIFICATION SUPPLÉMENTAIRE
		if (this.currentGame) {
			console.log("⚠️ Game already running, skipping creation");
			return;
		}

		try {
			console.log("🚀 Auto-starting server-side SOLO game...");

			const connectionStatus =
				document.getElementById("connectionStatus");
			if (connectionStatus) {
				connectionStatus.textContent = "🟡 Connexion au serveur...";
			}

			// Créer et démarrer le jeu SERVER-SIDE SOLO
			this.currentGame = new ServerGame_solo("solo");
			await this.currentGame.start_game_loop();

			// ✅ SUCCÈS
			if (connectionStatus) {
				connectionStatus.textContent = "🟢 Connecté au serveur";
			}

			const gameIdElement = document.getElementById("gameId");
			if (gameIdElement && this.currentGame.currentGameId) {
				gameIdElement.textContent = `ID: ${this.currentGame.currentGameId}`;
			}

			console.log("✅ SERVER-SIDE SOLO GAME LAUNCHED!");
		} catch (error) {
			console.error("❌ Failed to start server-side solo game:", error);

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
		}
	}

	private restartGame(): void {
		if (this.currentGame) {
			console.log("🔄 Restarting server-side solo game...");
			this.currentGame.restart();
		} else {
			console.log("⚠️ No active game to restart, creating new one...");
			this.startSoloGame();
		}
	}

	onUnmount(): void {
		console.log("🤖 Server Game Solo Page unmounting");

		// Supprimer les event listeners
		if (this.navigationListener) {
			document.removeEventListener("click", this.navigationListener);
			this.navigationListener = null;
		}

		if (this.restartListener) {
			const restartBtn = document.getElementById("restartBtn");
			if (restartBtn) {
				restartBtn.removeEventListener("click", this.restartListener);
			}
			this.restartListener = null;
		}

		if (this.currentGame) {
			this.currentGame.disconnect();
			this.currentGame = null;
		}

		// Réinitialiser le flag pour permettre de nouvelles instances
		ServerGameSoloPage.isInstanceActive = false;
	}
}