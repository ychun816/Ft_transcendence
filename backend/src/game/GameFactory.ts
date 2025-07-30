// =============== FACTORY POUR CRÉER LES JEUX CÔTÉ SERVEUR ===============
// Ce fichier remplace l'ancien ServerPongGame.ts pour éviter la confusion

import { ServerPong } from './ServerGame_solo.js';
import { ServerPongMulti } from './ServerGame_ligne.js';
import { ServerPongTournoi } from './ServerGame_tournoi.js';

// Types communs pour les messages
export interface GameStateMessage {
    type: 'gameState';
    ball: any;
    paddle: any;
    state: any;
    config: any;
    timestamp: number;
}

export interface GameEndMessage {
    type: 'gameEnd';
    winner: 'left' | 'right';
    timestamp: number;
}

// Union type pour tous les types de jeux
export type GameEngine = ServerPong | ServerPongMulti | ServerPongTournoi;

/**
 * Factory pour créer les différents types de jeux server-side
 */
export class GameFactory {
    /**
     * Crée un moteur de jeu selon le mode spécifié
     */
    static createGame(
        gameId: string, 
        mode: 'solo' | 'versus' | 'multi' | 'tournoi',
        player1Name?: string,
        player2Name?: string,
        isFinal: number = 0
    ): GameEngine {
        
        console.log(`🏭 GameFactory: Creating ${mode} game with ID ${gameId}`);
        
        switch (mode) {
            case 'solo':
                console.log(`🤖 Creating SOLO game (Player vs IA)`);
                return new ServerPong(gameId, 'solo');
                
            case 'versus':
                console.log(`👥 Creating VERSUS game (Player vs Player)`);
                return new ServerPong(gameId, 'versus');
                
            case 'multi':
                console.log(`🎯 Creating MULTI game (2v2 - 4 players)`);
                return new ServerPongMulti(gameId);
                
            case 'tournoi':
                console.log(`🏆 Creating TOURNAMENT game`);
                const p1 = player1Name || 'Player1';
                const p2 = player2Name || 'Player2';
                return new ServerPongTournoi(gameId, p1, p2, isFinal);
                
            default:
                throw new Error(`❌ Unknown game mode: ${mode}`);
        }
    }

    /**
     * Valide si un mode de jeu est supporté
     */
    static isValidMode(mode: string): mode is 'solo' | 'versus' | 'multi' | 'tournoi' {
        return ['solo', 'versus', 'multi', 'tournoi'].includes(mode);
    }

    /**
     * Retourne les informations sur un mode de jeu
     */
    static getModeInfo(mode: 'solo' | 'versus' | 'multi' | 'tournoi') {
        const modeInfos = {
            solo: {
                name: 'Solo',
                description: 'Joueur contre IA',
                players: 1,
                hasAI: true,
                scoreToWin: 5
            },
            versus: {
                name: 'Versus',
                description: 'Joueur contre Joueur',
                players: 2,
                hasAI: false,
                scoreToWin: 5
            },
            multi: {
                name: 'Multi',
                description: 'Équipe contre Équipe (2v2)',
                players: 4,
                hasAI: false,
                scoreToWin: 5
            },
            tournoi: {
                name: 'Tournoi',
                description: 'Match de tournoi',
                players: 2,
                hasAI: false,
                scoreToWin: 3
            }
        };

        return modeInfos[mode];
    }

    /**
     * Crée un jeu de tournoi avec des paramètres spécifiques
     */
    static createTournamentGame(
        gameId: string,
        player1Name: string,
        player2Name: string,
        isFinal: number = 0
    ): ServerPongTournoi {
        console.log(`🏆 Creating Tournament: ${player1Name} vs ${player2Name} ${isFinal ? '(FINAL)' : ''}`);
        return new ServerPongTournoi(gameId, player1Name, player2Name, isFinal);
    }

    /**
     * Obtient les statistiques d'un jeu
     */
    static getGameStats(game: GameEngine): any {
        const baseStats = {
            gameId: (game as any).gameId || 'unknown',
            mode: 'unknown',
            isRunning: false,
            scores: { left: 0, right: 0 }
        };

        try {
            const gameState = game.getGameState();
            
            baseStats.isRunning = gameState.state.game_running;
            baseStats.scores = {
                left: gameState.state.left_score,
                right: gameState.state.right_score
            };

            // Déterminer le mode selon le type de jeu
            if (game instanceof ServerPong) {
                baseStats.mode = (game as any).state?.game_mode || 'versus';
            } else if (game instanceof ServerPongMulti) {
                baseStats.mode = 'multi';
            } else if (game instanceof ServerPongTournoi) {
                baseStats.mode = 'tournoi';
            }

        } catch (error) {
            console.error('Error getting game stats:', error);
        }

        return baseStats;
    }

    /**
     * Vérifie si un jeu est terminé
     */
    static isGameFinished(game: GameEngine): boolean {
        try {
            const gameState = game.getGameState();
            return !gameState.state.game_running;
        } catch (error) {
            console.error('Error checking if game is finished:', error);
            return true; // Considérer comme terminé en cas d'erreur
        }
    }

    /**
     * Obtient le gagnant d'un jeu (si terminé)
     */
    static getWinner(game: GameEngine): 'left' | 'right' | null {
        try {
            const gameState = game.getGameState();
            
            if (gameState.state.game_running) {
                return null; // Jeu en cours
            }

            const { left_score, right_score } = gameState.state;
            const { score_to_win } = gameState.config;

            if (left_score >= score_to_win) {
                return 'left';
            } else if (right_score >= score_to_win) {
                return 'right';
            }

            return null; // Pas encore de gagnant
        } catch (error) {
            console.error('Error getting winner:', error);
            return null;
        }
    }

    /**
     * Nettoie les ressources d'un jeu
     */
    static cleanupGame(game: GameEngine): void {
        try {
            console.log(`🧹 GameFactory: Cleaning up game...`);
            
            if (typeof game.cleanup === 'function') {
                game.cleanup();
            }

            console.log(`✅ GameFactory: Game cleaned up successfully`);
        } catch (error) {
            console.error('❌ Error during game cleanup:', error);
        }
    }
}

/**
 * Classe utilitaire pour la gestion des configurations de jeu
 */
export class GameConfigManager {
    /**
     * Configuration par défaut pour chaque mode
     */
    static getDefaultConfig(mode: 'solo' | 'versus' | 'multi' | 'tournoi') {
        const baseConfig = {
            canvas_width: 800,
            canvas_height: 600,
            paddle_width: 10,
            ball_real_speed: 8 * (3/2),
            ball_speed: 4.5 * (3/2),
            ball_max_speed: 12 * (3/2),
            increase_vitesse: 175,
            time_before_new_ball: 3000
        };

        const modeConfigs = {
            solo: {
                ...baseConfig,
                paddle_height: 100,
                paddle_speed: 7.5 * (3/2),
                score_to_win: 5
            },
            versus: {
                ...baseConfig,
                paddle_height: 100,
                paddle_speed: 7.5 * (3/2),
                score_to_win: 5
            },
            multi: {
                ...baseConfig,
                paddle_height: 78,
                paddle_speed: 5.25 * (3/2),
                score_to_win: 5,
                increase_vitesse: 250
            },
            tournoi: {
                ...baseConfig,
                paddle_height: 100,
                paddle_speed: 7.5 * (3/2),
                score_to_win: 3 // Plus court pour les tournois
            }
        };

        return modeConfigs[mode];
    }

    /**
     * Valide une configuration de jeu
     */
    static validateConfig(config: any): boolean {
        const requiredFields = [
            'canvas_width', 'canvas_height', 'paddle_width', 'paddle_height',
            'ball_speed', 'paddle_speed', 'score_to_win'
        ];

        return requiredFields.every(field => 
            config.hasOwnProperty(field) && 
            typeof config[field] === 'number' && 
            config[field] > 0
        );
    }
}

// Export par défaut de la factory
export default GameFactory;