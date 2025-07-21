import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { Game_solo } from "../components/game/game_solo.js";
import { Game_ligne } from "../components/game/game_ligne.js";

export function createGamePage(): HTMLElement {
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
		
		<!-- Conteneur principal avec effet scan -->
		<div class="min-h-screen flex flex-col items-center justify-center p-4 scan-lines relative">
			
			<!-- Titre principal avec effet néon -->
			<h1 class="text-6xl font-bold text-green-400 neon-text mb-8">
				🏓 PONG
			</h1>
			
			<!-- Menu principal -->
			<div id="menu" class="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-green-400 border-opacity-30 neon-border">
				<button class="mb-4 bg-gradient-to-r from-gray-500 from-opacity-30 to-gray-600 to-opacity-30 hover:from-gray-500 hover:from-opacity-50 hover:to-gray-600 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-gray-500 border-opacity-50 transition-all duration-300 transform hover:scale-105" data-route="/home">
					← Retour à l'accueil
				</button>
				<h2 class="text-3xl font-bold text-blue-400 mb-8 text-center">Mode de Jeu</h2>
				<div class="flex flex-col gap-4">
					<button id="localBtn" class="group relative bg-gradient-to-r from-green-400 from-opacity-20 to-blue-400 to-opacity-20 hover:from-green-400 hover:from-opacity-40 hover:to-blue-400 hover:to-opacity-40 text-white font-bold py-4 px-8 rounded-xl border border-green-400 border-opacity-50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
						<span class="relative z-10">🎮 Jouer en local</span>
					</button>
					<button id="ligneBtn" class="group relative bg-gradient-to-r from-purple-400 from-opacity-20 to-pink-400 to-opacity-20 hover:from-purple-400 hover:from-opacity-40 hover:to-pink-400 hover:to-opacity-40 text-white font-bold py-4 px-8 rounded-xl border border-purple-400 border-opacity-50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
						<span class="relative z-10">🌐 Jouer en ligne</span>
					</button>
				</div>
			</div>
			
			<!-- Menu local -->
			<div id="menu_local" class="hidden bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-blue-400 border-opacity-30">
				<button id="backToMainBtn" class="mb-4 bg-gradient-to-r from-gray-500 from-opacity-30 to-gray-600 to-opacity-30 hover:from-gray-500 hover:from-opacity-50 hover:to-gray-600 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-gray-500 border-opacity-50 transition-all duration-300 transform hover:scale-105">
					← Retour au menu principal
				</button>
				<h2 class="text-3xl font-bold text-green-400 mb-8 text-center">En Local</h2>
				<div class="flex flex-col gap-4">
					<button id="soloBtn" class="bg-gradient-to-r from-orange-500 from-opacity-20 to-red-500 to-opacity-20 hover:from-orange-500 hover:from-opacity-40 hover:to-red-500 hover:to-opacity-40 text-white font-bold py-4 px-8 rounded-xl border border-orange-500 border-opacity-50 transition-all duration-300 transform hover:scale-105">
						🤖 Solo (vs IA)
					</button>
					<button id="versusBtn" class="bg-gradient-to-r from-green-500 from-opacity-20 to-teal-500 to-opacity-20 hover:from-green-500 hover:from-opacity-40 hover:to-teal-500 hover:to-opacity-40 text-white font-bold py-4 px-8 rounded-xl border border-green-500 border-opacity-50 transition-all duration-300 transform hover:scale-105">
						👥 Versus (2 joueurs)
					</button>
				</div>
			</div>
			
			<!-- Menu en ligne -->
			<div id="menu_ligne" class="hidden bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-8 border border-purple-400 border-opacity-30">
				<button id="backToMainBtn2" class="mb-4 bg-gradient-to-r from-gray-500 from-opacity-30 to-gray-600 to-opacity-30 hover:from-gray-500 hover:from-opacity-50 hover:to-gray-600 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-gray-500 border-opacity-50 transition-all duration-300 transform hover:scale-105">
					← Retour au menu principal
				</button>
				<h2 class="text-3xl font-bold text-purple-400 mb-8 text-center">En Ligne</h2>
				<div class="flex flex-col gap-4">
					<button id="solo_ligneBtn" class="bg-gradient-to-r from-blue-500 from-opacity-20 to-cyan-500 to-opacity-20 hover:from-blue-500 hover:from-opacity-40 hover:to-cyan-500 hover:to-opacity-40 text-white font-bold py-4 px-8 rounded-xl border border-blue-500 border-opacity-50 transition-all duration-300 transform hover:scale-105">
						⚔️ 1v1
					</button>
					<button id="multiBtn" class="bg-gradient-to-r from-purple-500 from-opacity-20 to-pink-500 to-opacity-20 hover:from-purple-500 hover:from-opacity-40 hover:to-pink-500 hover:to-opacity-40 text-white font-bold py-4 px-8 rounded-xl border border-purple-500 border-opacity-50 transition-all duration-300 transform hover:scale-105">
						🎯 Multijoueur
					</button>
					<button id="tournoiBtn" class="bg-gradient-to-r from-yellow-500 from-opacity-20 to-orange-500 to-opacity-20 hover:from-yellow-500 hover:from-opacity-40 hover:to-orange-500 hover:to-opacity-40 text-white font-bold py-4 px-8 rounded-xl border border-yellow-500 border-opacity-50 transition-all duration-300 transform hover:scale-105">
						🏆 Tournoi
					</button>
				</div>
			</div>
			
			<!-- Zone de jeu -->
			<div id="game" class="hidden w-full max-w-6xl">
				<!-- Bouton retour -->
				<button id="backToMenuBtn" class="mb-6 bg-gradient-to-r from-gray-500 from-opacity-30 to-gray-600 to-opacity-30 hover:from-gray-500 hover:from-opacity-50 hover:to-gray-600 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-gray-500 border-opacity-50 transition-all duration-300 transform hover:scale-105">
					← Retour au menu
				</button>
				
				<!-- Bouton restart stylisé -->
				<button id="restartBtn" class="hidden mb-6 mx-auto bg-gradient-to-r from-green-400 from-opacity-30 to-blue-400 to-opacity-30 hover:from-green-400 hover:from-opacity-50 hover:to-blue-400 hover:to-opacity-50 text-white font-bold py-2 px-4 rounded-lg border border-green-400 border-opacity-50 transition-all duration-300 transform hover:scale-105">
					New Game
				</button>
				
				<!-- Tableau de score moderne -->
				<div id="scoreboard" class="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-blue-400 border-opacity-20">
					<div class="grid grid-cols-2 gap-8 text-center">
						<div class="bg-gradient-to-r from-blue-500 from-opacity-20 to-cyan-500 to-opacity-20 rounded-xl p-4 border border-blue-500 border-opacity-30">
							<p id="scoreP1" class="text-2xl font-bold text-blue-400">Joueur 1 : 0</p>
						</div>
						<div class="bg-gradient-to-r from-red-500 from-opacity-20 to-orange-500 to-opacity-20 rounded-xl p-4 border border-red-500 border-opacity-30">
							<p id="scoreP2" class="text-2xl font-bold text-pink-400">Joueur 2 : 0</p>
						</div>
					</div>
				</div>
				
				<!-- Canvas avec cadre futuriste -->
				<div class="relative bg-gray-800 bg-opacity-30 rounded-2xl p-4 border border-green-400 border-opacity-30 neon-border">
					<canvas id="gameCanvas" width="800" height="600" class="rounded-xl bg-gray-700 bg-opacity-50 border border-green-400 border-opacity-20 shadow-2xl"></canvas>
					
					<!-- Indicateurs de coin décoratifs -->
					<div class="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-green-400"></div>
					<div class="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-green-400"></div>
					<div class="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-green-400"></div>
					<div class="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-green-400"></div>
				</div>
				
				<!-- Compte à rebours stylisé -->
				<div id="countdowndisplay" class="text-5xl font-bold text-green-400 neon-text mt-6 text-center"></div>
				
				<!-- Message de fin de partie -->
				<div id="endMessage" class="text-2xl font-bold text-green-400 neon-text mt-6 text-center">
				</div>
				
				<!-- Contrôles avec design moderne -->
				<div id="control_1" class="hidden bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 mt-6 border border-blue-400 border-opacity-20">
					<h3 class="text-xl font-bold text-blue-400 mb-4 text-center">🎮 Contrôles</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
						<div class="bg-blue-500 bg-opacity-10 rounded-lg p-3 border border-blue-500 border-opacity-30">
							<p id="control_player_1" class="text-blue-400 font-semibold">Joueur 1</p>
							<p id="control_player_1_command" class="text-sm text-gray-300">W / S</p>
						</div>
						<div class="bg-pink-500 bg-opacity-10 rounded-lg p-3 border border-pink-500 border-opacity-30">
							<p id="control_player_2" class="text-pink-400 font-semibold">Joueur 2</p>
							<p id="control_player_2_command" class="text-sm text-gray-300">ARROW UP / ARROW DOWN</p>
						</div>
					</div>
				</div>
				
				<div id="control_2" class="hidden bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 mt-6 border border-blue-400 border-opacity-20">
					<h3 class="text-xl font-bold text-blue-400 mb-4 text-center">🎮 Contrôles</h3>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
						<div class="bg-blue-500 bg-opacity-10 rounded-lg p-3 border border-blue-500 border-opacity-30">
							<p class="text-blue-400 font-semibold">Joueur 1</p>
							<p class="text-sm text-gray-300">W / S</p>
						</div>
						<div class="bg-blue-500 bg-opacity-10 rounded-lg p-3 border border-blue-500 border-opacity-30">
							<p class="text-blue-400 font-semibold">Joueur 2</p>
							<p class="text-sm text-gray-300">J / M</p>
						</div>
						<div class="bg-pink-500 bg-opacity-10 rounded-lg p-3 border border-pink-500 border-opacity-30">
							<p class="text-pink-400 font-semibold">Joueur 3</p>
							<p class="text-sm text-gray-300">9 / 6</p>
						</div>
						<div class="bg-pink-500 bg-opacity-10 rounded-lg p-3 border border-pink-500 border-opacity-30">
							<p class="text-pink-400 font-semibold">Joueur 4</p>
							<p class="text-sm text-gray-300">ARROW UP / ARROW DOWN</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<div class="absolute top-4 right-4" id="language-switcher-container"></div>
		`;
		
		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
		
		// Initialize game logic
		initializeGameLogic();
	};
	
	renderContent();
	
	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

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

	function initializeGameLogic() {
		const menu = page.querySelector("#menu") as HTMLElement;
		const localBtn = page.querySelector('#localBtn') as HTMLButtonElement;
		const ligneBtn = page.querySelector('#ligneBtn') as HTMLButtonElement;
		
		const menuLocal = page.querySelector("#menu_local") as HTMLElement;
		const soloBtn = page.querySelector('#soloBtn') as HTMLButtonElement;
		const versusBtn = page.querySelector('#versusBtn') as HTMLButtonElement;
		const backToMainBtn = page.querySelector('#backToMainBtn') as HTMLButtonElement;
		
		const menuLigne = page.querySelector("#menu_ligne") as HTMLElement;
		const soloLigneBtn = page.querySelector('#solo_ligneBtn') as HTMLButtonElement;
		const multiBtn = page.querySelector('#multiBtn') as HTMLButtonElement;
		const tournoiBtn = page.querySelector('#tournoiBtn') as HTMLButtonElement;
		const backToMainBtn2 = page.querySelector('#backToMainBtn2') as HTMLButtonElement;
		
		const game = page.querySelector("#game") as HTMLElement;
		const restart = page.querySelector("#restartBtn") as HTMLButtonElement;
		const backToMenuBtn = page.querySelector("#backToMenuBtn") as HTMLButtonElement;
		const control1 = page.querySelector("#control_1") as HTMLElement;
		const control2 = page.querySelector("#control_2") as HTMLElement;
		const controlPlayer2 = page.querySelector("#control_player_2") as HTMLElement;
		const controlPlayer2Command = page.querySelector("#control_player_2_command") as HTMLElement;
		
		function chooseMode(mode: 'local' | 'ligne'): void {
			menu.style.display = "none";
			if (mode === 'local') {
				menuLocal.style.display = "block";
			} else {
				menuLigne.style.display = "block";
			}
		}
		
		function backToMainMenu(): void {
			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			game.style.display = "none";
			menu.style.display = "block";
		}
		
		function startGameSolo(mode: 'solo' | 'versus'): void {
			const gameSolo = new Game_solo(mode);
			
			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			game.style.display = "block";
			restart.style.display = "block";
			
			if (mode === "solo") {
				controlPlayer2.textContent = 'IA';
				controlPlayer2Command.textContent = "";
			}
			control1.style.display = 'block';
			
			gameSolo.start_game_loop();
		}
		
		function startGameMulti(): void {
			const gameLigne = new Game_ligne();
			
			menuLigne.style.display = "none";
			game.style.display = "block";
			
			control2.style.display = 'block';
			gameLigne.start_game_loop();
		}
		
		function startGameLigneSolo(): void {
			const gameSolo = new Game_solo('solo');
			
			menuLocal.style.display = "none";
			menuLigne.style.display = "none";
			game.style.display = "block";
			restart.style.display = "block";
			
			gameSolo.start_game_loop();
		}
		
		localBtn.addEventListener('click', () => chooseMode('local'));
		ligneBtn.addEventListener('click', () => chooseMode('ligne'));
		
		backToMainBtn.addEventListener('click', () => backToMainMenu());
		backToMainBtn2.addEventListener('click', () => backToMainMenu());
		backToMenuBtn.addEventListener('click', () => backToMainMenu());
		
		soloBtn.addEventListener('click', () => startGameSolo('solo'));
		versusBtn.addEventListener('click', () => startGameSolo('versus'));
		
		soloLigneBtn.addEventListener('click', () => startGameLigneSolo());
		multiBtn.addEventListener('click', () => startGameMulti());
	}

	return page;
}
