import { Page } from "../router/router.js";
import { ServerGame_solo } from "../components/game/ServerPongGame.js";
import { classes } from "../styles/retroStyles.js";
import { i18n } from "../services/i18n.js";

export function createServerGameVersusPage(): HTMLElement {
	const serverGameVersusPage = new ServerGameVersusPage();
	const container = document.createElement("div");
	container.innerHTML = serverGameVersusPage.render();

	// Attach page instance for cleanup
	(container as any).__pageInstance = serverGameVersusPage;

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
	private restartListener: (() => void) | null = null;

	render(): string {
		return `
            <style>
                /* Styles rétro gaming noir et violet - identiques au jeu normal */
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
                
                * {
                    font-family: 'Orbitron', monospace;
                }
                
                .neon-text {
                    color: #bb86fc;
                    text-shadow:
                        0 0 3px #bb86fc,
                        0 0 6px #bb86fc,
                        0 0 9px #bb86fc;
                    animation: neonFlicker 2s infinite alternate;
                }
                
                @keyframes neonFlicker {
                    0%, 100% {
                        text-shadow: 
                            0 0 5px #9d4edd,
                            0 0 10px #9d4edd,
                            0 0 15px #9d4edd,
                            0 0 20px #9d4edd,
                            0 0 35px #9d4edd;
                    }
                    50% {
                        text-shadow: 
                            0 0 2px #9d4edd,
                            0 0 5px #9d4edd,
                            0 0 8px #9d4edd,
                            0 0 12px #9d4edd,
                            0 0 25px #9d4edd;
                    }
                }
                
                .retro-button {
                    background: linear-gradient(135deg, #1a0d1a 0%, #0a0a0a 50%, #1a0d1a 100%);
                    border: 2px solid #9d4edd;
                    box-shadow: 
                        0 0 10px #9d4edd40,
                        inset 0 0 10px #9d4edd20;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .retro-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, #9d4edd40, transparent);
                    transition: left 0.5s;
                }
                
                .retro-button:hover {
                    border-color: #c77dff;
                    box-shadow: 
                        0 0 20px #9d4edd,
                        inset 0 0 20px #9d4edd30;
                    transform: scale(1.05);
                }
                
                .retro-button:hover::before {
                    left: 100%;
                }
                
                .starfield {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: -1;
                    background: radial-gradient(2px 2px at 20px 30px, #9d4edd, transparent),
                                radial-gradient(2px 2px at 40px 70px, #c77dff, transparent),
                                radial-gradient(1px 1px at 90px 40px, #9d4edd, transparent),
                                radial-gradient(1px 1px at 130px 80px, #c77dff, transparent),
                                radial-gradient(2px 2px at 160px 30px, #9d4edd, transparent),
                                radial-gradient(1px 1px at 200px 90px, #c77dff, transparent),
                                radial-gradient(2px 2px at 240px 20px, #9d4edd, transparent);
                    background-size: 250px 150px;
                    animation: twinkle 4s ease-in-out infinite alternate;
                }
                
                @keyframes twinkle {
                    0% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .retro-panel {
                    background: #050505;
                    border: 2px solid #9d4edd;
                    box-shadow: 
                        0 0 15px #9d4edd40,
                        inset 0 0 15px #9d4edd20;
                    backdrop-filter: blur(5px);
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
                        👥 SERVER-SIDE VERSUS (2 JOUEURS)
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
                                <div id="scoreP2" class="text-2xl font-bold neon-text">Joueur 2 : 0</div>
                            </div>
                        </div>

                        
                        <!-- Canvas avec cadre futuriste -->
                        <div class="relative game-canvas-frame rounded-2xl mx-auto" style="width: 800px; height: 600px;">
                            <canvas id="gameCanvas" width="800" height="600" class="rounded-xl bg-black w-full h-full"></canvas>
                        </div>
                        
                        <!-- Compte à rebours -->
                        <div id="countdowndisplay" class="text-6xl font-bold neon-text mt-8 text-center"></div>
                        
                        <!-- Message de fin de partie -->
                        <div id="endMessage" class="text-3xl font-bold neon-text mt-8 text-center"></div>
                        
                        <!-- Contrôles -->
                        <div class="retro-panel rounded-lg p-4 mt-8">
                            <h3 class="text-xl font-bold text-purple-300 mb-4 text-center">
                                ${i18n.t('game.control')}
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                                <div>
                                    <p class="text-purple-300 font-semibold">${i18n.t('game.p1')}</p>
                                    <p class="text-sm text-gray-300">W / S</p>
                                </div>
                                <div>
                                    <p class="text-purple-300 font-semibold">${i18n.t('game.p2')}</p>
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
		console.log("👥 Server Game Versus Page mounted");

		// ✅ PROTECTION CONTRE LES INSTANCES MULTIPLES
		if (ServerGameVersusPage.isInstanceActive) {
			console.log(
				"⚠️ Instance already active, preventing duplicate creation"
			);
			return; // Sortir immédiatement si une instance est déjà active
		}

		ServerGameVersusPage.isInstanceActive = true;

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
			await this.startVersusGame();
		} catch (error) {
			console.error("Failed to start game:", error);
			ServerGameVersusPage.isInstanceActive = false; // Libérer le verrou en cas d'erreur
		}

		// Event listener pour le bouton restart
		const restartBtn = document.getElementById("restartBtn");
		if (restartBtn) {
			this.restartListener = () => this.restartGame();
			restartBtn.addEventListener("click", this.restartListener);
		}
	}

	private async startVersusGame(): Promise<void> {
		// ✅ VÉRIFICATION SUPPLÉMENTAIRE
		if (this.currentGame) {
			console.log("⚠️ Game already running, skipping creation");
			return;
		}

		if (this.isGameStarting) {
			console.log("⚠️ Game already starting, ignoring...");
			return;
		}

		this.isGameStarting = true;

		try {
			console.log("🚀 Auto-starting server-side VERSUS game...");

			const connectionStatus =
				document.getElementById("connectionStatus");
			if (connectionStatus) {
				connectionStatus.textContent = "🟡 Connexion au serveur...";
			}

			// Créer et démarrer le jeu SERVER-SIDE VERSUS
			console.log("🎮 Creating new versus game...");
			this.currentGame = new ServerGame_solo("versus");

			console.log("🔌 Connecting to game server...");
			await this.currentGame.start_game_loop();

			// ✅ SUCCÈS
			if (connectionStatus) {
				connectionStatus.textContent = "🟢 Connecté au serveur";
			}

			const gameIdElement = document.getElementById("gameId");
			if (gameIdElement && this.currentGame.currentGameId) {
				gameIdElement.textContent = `ID: ${this.currentGame.currentGameId}`;
			}

			console.log("✅ SERVER-SIDE VERSUS GAME LAUNCHED!");
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
			console.log("🔄 Restarting versus game...");
			this.currentGame.restart();
		}
	}

	onUnmount(): void {
		console.log("👥 Server Game Versus Page unmounting");

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

		// Déconnecter et nettoyer le jeu actuel
		if (this.currentGame) {
			console.log("🔌 Disconnecting current game before unmounting...");
			this.currentGame.disconnect();
			this.currentGame = null;
		}

		// Marquer qu'on n'est plus en train de démarrer
		this.isGameStarting = false;

		// Réinitialiser le flag pour permettre de nouvelles instances
		ServerGameVersusPage.isInstanceActive = false;
	}
}