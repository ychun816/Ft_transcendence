// =============== CLIENT WEBSOCKET SIMPLIFIÉ - AUCUN CALCUL ===============

interface GameStateMessage {
    type: 'gameState';
    ball: any;
    paddle: any;
    state: any;
    config: any;
    timestamp: number;
}

interface GameEndMessage {
    type: 'gameEnd';
    winner: 'left' | 'right';
    timestamp: number;
}

export class PongClient {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ws: WebSocket | null = null;
    private gameId: string | undefined | null = null;
    private gameMode: 'solo' | 'versus' | 'multi' = 'versus';
    private isConnecting: boolean = false;
    
    // Input seulement - aucun état de jeu local
    private keys_pressed: Record<string, boolean> = {};
    
    // Éléments DOM
    private count_down: HTMLDivElement;
    private end_message: HTMLElement | null = null;
    
    // Animation
    private animationId: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.count_down = document.getElementById("countdowndisplay") as HTMLDivElement;
        this.end_message = document.getElementById('endMessage');
        
        this.setupInput();
        
        // Nettoyer automatiquement quand la page se ferme
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    // =============== CONNEXION AU SERVEUR ===============
    
    async connectToGame(gameId?: string, mode: 'solo' | 'versus' | 'multi' = 'versus'): Promise<void> {
        if (this.isConnecting) {
            console.log("⚠️ Connection already in progress, ignoring...");
            return Promise.reject(new Error('Connection already in progress'));
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.gameId) {
            console.log("⚠️ Already connected to game:", this.gameId);
            return Promise.reject(new Error('Already connected to a game'));
        }
        
        if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
            console.log("🔌 Closing existing WebSocket connection...");
            this.ws.close();
            this.ws = null;
        }
        
        this.isConnecting = true;
        
        try {
            // Créer une nouvelle partie si aucun gameId fourni
            if (!gameId) {
                console.log("🎮 Creating new game...");
                const response = await fetch('/api/game/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode })
                });
                
                const result = await response.json();
                if (result.success) {
                    gameId = result.gameId;
                    console.log("✅ Game created:", gameId);
                } else {
                    throw new Error('Failed to create game');
                }
            }
            
            this.gameId = gameId;
            this.gameMode = mode;
            await this.connectWebSocket();
            
        } catch (error) {
            console.error("❌ Failed to connect to game:", error);
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    private async connectWebSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.gameId) {
                reject(new Error('No game ID'));
                return;
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const playerId = `player_${Date.now()}`;
            const wsUrl = `${protocol}//${window.location.host}/ws/game/${this.gameId}?playerId=${playerId}&mode=${this.gameMode}`;
            
            console.log("🔌 Connecting to WebSocket:", wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log("✅ WebSocket connected");
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (error) {
                    console.error("Error parsing server message:", error);
                }
            };
            
            this.ws.onclose = (event) => {
                console.log("👋 WebSocket disconnected");
                this.handleDisconnection();
            };
            
            this.ws.onerror = (error) => {
                console.error("❌ WebSocket error:", error);
                reject(error);
            };
        });
    }

    // =============== GESTION DES MESSAGES SERVEUR ===============
    
    private handleServerMessage(data: any) {
        switch (data.type) {
            case 'gameState':
                this.renderFromServer(data as GameStateMessage);
                break;
                
            case 'gameEnd':
                this.handleGameEnd(data as GameEndMessage);
                break;
                
            default:
                console.log("Unknown server message:", data);
        }
    }

    private handleGameEnd(data: GameEndMessage) {
        console.log(`🏆 Game ended! Winner: ${data.winner}`);
        
        let message = '';
        if (data.winner === 'left') {
            message = '🏆 Joueur 1 gagne la partie !';
        } else {
            message = '🏆 Joueur 2 gagne la partie !';
        }

        if (this.end_message) {
            this.end_message.textContent = message;
            this.end_message.style.display = 'block';
        }
    }

    private handleDisconnection() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
        
        if (this.count_down) {
            this.count_down.innerText = "Connexion perdue...";
        }
    }

    // =============== GESTION DES INPUTS ===============
    
    private setupInput(): void {
        document.addEventListener("keydown", this.handleKeydown);
        document.addEventListener("keyup", this.handleKeyup);
    }

    private handleKeydown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        
        this.keys_pressed[e.key] = true;
        this.sendInputToServer();
    };

    private handleKeyup = (e: KeyboardEvent) => {
        this.keys_pressed[e.key] = false;
        this.sendInputToServer();
    };

    private sendInputToServer() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const inputMessage = {
                type: 'playerInput',
                keys: { ...this.keys_pressed },
                timestamp: Date.now()
            };
            
            this.ws.send(JSON.stringify(inputMessage));
        }
    }

    // =============== RENDU UNIQUEMENT ===============
    
    start(): void {
        console.log("🎮 Starting client-side rendering...");
        this.renderLoop();
    }

    private renderLoop(): void {
        // Pas de logique ici, juste l'animation continue
        this.animationId = requestAnimationFrame(() => this.renderLoop());
    }

    private renderFromServer(gameState: GameStateMessage): void {
        if (!this.ctx) {
            this.drawLoadingScreen();
            return;
        }

        const { ball, paddle, state, config } = gameState;

        // === FOND ===
        let bgGradient = this.ctx.createLinearGradient(0, 0, 0, config.canvas_height);
        bgGradient.addColorStop(0, "#0f0f0f");
        bgGradient.addColorStop(1, "#1a1a1a");
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, config.canvas_width, config.canvas_height);

        // === LIGNE CENTRALE ===
        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([10, 15]);
        this.ctx.strokeStyle = "#444";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(config.canvas_width / 2, 0);
        this.ctx.lineTo(config.canvas_width / 2, config.canvas_height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // === RAQUETTES ===
        this.drawPaddles(paddle, config);

        // === BALLE ===
        //const pulse = 10 + Math.sin(Date.now() / 100) * 2;
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        this.ctx.shadowColor = blink ? "#ffff00" : "#ff00ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = blink ? "#ffff00" : "#ff00ff";
        this.ctx.beginPath();
        this.ctx.arc(ball.ball_x, ball.ball_y, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // === INTERFACE ===
        this.updateScoreDisplay(state.left_score, state.right_score);
        
        if (state.count_down_active && this.count_down) {
            this.count_down.style.display = 'block';
        } else if (this.count_down) {
            this.count_down.style.display = 'none';
        }
    }

    private drawPaddles(paddle: any, config: any): void {
        if (paddle.paddles) {
            // Mode multi (4 raquettes)
            this.ctx.shadowColor = "#00ffff";
            this.ctx.shadowBlur = 20;
            
            // Raquettes gauches
            let paddleGradientP1 = this.ctx.createLinearGradient(0, paddle.paddles.p1_y, 0, paddle.paddles.p1_y + config.paddle_height);
            paddleGradientP1.addColorStop(0, "#00ffff");
            paddleGradientP1.addColorStop(1, "#005f5f");
            this.ctx.fillStyle = paddleGradientP1;
            this.ctx.fillRect(30, paddle.paddles.p1_y, config.paddle_width, config.paddle_height);

            let paddleGradientP2 = this.ctx.createLinearGradient(0, paddle.paddles.p2_y, 0, paddle.paddles.p2_y + config.paddle_height);
            paddleGradientP2.addColorStop(0, "#00ffff");
            paddleGradientP2.addColorStop(1, "#005f5f");
            this.ctx.fillStyle = paddleGradientP2;
            this.ctx.fillRect(30, paddle.paddles.p2_y, config.paddle_width, config.paddle_height);

            // Raquettes droites
            this.ctx.shadowColor = "#ff00ff";
            this.ctx.shadowBlur = 20;

            let paddleGradientP3 = this.ctx.createLinearGradient(0, paddle.paddles.p3_y, 0, paddle.paddles.p3_y + config.paddle_height);
            paddleGradientP3.addColorStop(0, "#ff00ff");
            paddleGradientP3.addColorStop(1, "#5f005f");
            this.ctx.fillStyle = paddleGradientP3;
            this.ctx.fillRect(config.canvas_width - 30 - config.paddle_width, paddle.paddles.p3_y, config.paddle_width, config.paddle_height);
            
            let paddleGradientP4 = this.ctx.createLinearGradient(0, paddle.paddles.p4_y, 0, paddle.paddles.p4_y + config.paddle_height);
            paddleGradientP4.addColorStop(0, "#ff00ff");
            paddleGradientP4.addColorStop(1, "#5f005f");
            this.ctx.fillStyle = paddleGradientP4;
            this.ctx.fillRect(config.canvas_width - 30 - config.paddle_width, paddle.paddles.p4_y, config.paddle_width, config.paddle_height);
        } else if (paddle.left_paddle_y !== undefined && paddle.right_paddle_y !== undefined) {
            // Mode solo/versus (2 raquettes)
            this.ctx.shadowColor = "#00ffff";
            this.ctx.shadowBlur = 20;
            let paddleGradientLeft = this.ctx.createLinearGradient(0, paddle.left_paddle_y, 0, paddle.left_paddle_y + config.paddle_height);
            paddleGradientLeft.addColorStop(0, "#00ffff");
            paddleGradientLeft.addColorStop(1, "#005f5f");
            this.ctx.fillStyle = paddleGradientLeft;
            this.ctx.fillRect(30, paddle.left_paddle_y, config.paddle_width, config.paddle_height);

            this.ctx.shadowColor = "#ff00ff";
            this.ctx.shadowBlur = 20;
            let paddleGradientRight = this.ctx.createLinearGradient(0, paddle.right_paddle_y, 0, paddle.right_paddle_y + config.paddle_height);
            paddleGradientRight.addColorStop(0, "#ff00ff");
            paddleGradientRight.addColorStop(1, "#5f005f");
            this.ctx.fillStyle = paddleGradientRight;
            this.ctx.fillRect(config.canvas_width - 30 - config.paddle_width, paddle.right_paddle_y, config.paddle_width, config.paddle_height);
        }
    }

    private drawLoadingScreen(): void {
        if (!this.ctx) return;

        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "#fff";
        this.ctx.font = "24px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Connexion au serveur...", this.canvas.width / 2, this.canvas.height / 2);
        
        const dots = ".".repeat((Math.floor(Date.now() / 500) % 4));
        this.ctx.fillText(dots, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    private updateScoreDisplay(leftScore: number, rightScore: number): void {
        const score_P1 = document.getElementById('scoreP1');
        const score_P2 = document.getElementById('scoreP2');

        if (score_P1) {
            score_P1.textContent = `Joueur 1 : ${leftScore}`;
        }
        if (score_P2) {
            score_P2.textContent = `Joueur 2 : ${rightScore}`;
        }
    }

    // =============== CONTRÔLES PUBLICS ===============
    
    restart(): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'restartGame'
            }));
        }
    }

    pause(): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'pauseGame'
            }));
        }
    }

    disconnect(): void {
        console.log("🔌 Disconnecting from server...");
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
        
        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'disconnect' }));
            }
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }
        
        this.gameId = null;
        this.isConnecting = false;
        
        document.removeEventListener("keydown", this.handleKeydown);
        document.removeEventListener("keyup", this.handleKeyup);
        
        console.log("✅ Client disconnected successfully");
    }

    // =============== GETTERS ===============
    
    get isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    get currentGameId(): string | null {
        return this.gameId;
    }
}

// =============== CLASSE WRAPPER POUR COMPATIBILITÉ ===============

export class ServerGame_solo {
    private client: PongClient;
    private mode: 'solo' | 'versus' | 'multi';
    private canvas: HTMLCanvasElement;

    constructor(mode: 'solo' | 'versus' | 'multi') {
        this.mode = mode;
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        this.client = new PongClient(this.canvas);
    }

    async start_game_loop(): Promise<void> {
        await this.client.connectToGame(undefined, this.mode);
        this.client.start();
    }

    restart(): void {
        this.client.restart();
    }

    disconnect(): void {
        this.client.disconnect();
    }
    
    cleanup(): void {
        this.disconnect();
    }
    
    back_to_menu(): void {
        this.disconnect();
    }
    
    destroy(): void {
        this.disconnect();
    }
    
    get currentGameId(): string | null {
        return this.client.currentGameId;
    }
    
    get isConnected(): boolean {
        return this.client.isConnected;
    }
}