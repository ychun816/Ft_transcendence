// -------------------------- INTERFACES ------------------------------------

interface game_config {
    canvas_width: number;
    canvas_height: number;
    paddle_width: number;
    paddle_height: number;
    ball_speed: number;
    ball_real_speed: number;
    ball_max_speed: number;
    paddle_speed: number;
    score_to_win: number;
    increase_vitesse: number;
    time_before_new_ball: number;
}

interface game_state {
    left_score: number;
    right_score: number;
    is_paused: boolean;
    game_running: boolean;
    count_down_active: boolean;
    restart_active: boolean;
}

interface ball_interface {
    ball_x: number;
    ball_y: number;
    ball_dir_x: number;
    ball_dir_y: number;
    angle: number;
    current_rebond: number;
}

interface paddle_interface {
    left_paddle_y: number;
    right_paddle_y: number;
    marge: number;
    current_shot: number;
}

export interface GameStateMessage {
    type: 'gameState';
    ball: ball_interface;
    paddle: paddle_interface;
    state: game_state;
    config: game_config;
    timestamp: number;
}

// ------------------------ FONCTIONS UTILES -----------------------

function get_random_playable_angle(): number {
    let angle = 0;
    while (true) {
        angle = Math.random() * 2 * Math.PI;

        const is_too_vertical = (
        (angle >= 1 && angle <= 2.1) || 
        (angle >= 4.4 && angle <= 5.1)      
        );

        const is_too_horizontal = (
        (angle >= 0 && angle <= 0.4) ||                  
        (angle >= 2 * Math.PI - 0.4 && angle <= 2 * Math.PI) ||  
        (angle >= Math.PI - 0.4 && angle <= Math.PI + 0.4)       
        );

        if (is_too_vertical || is_too_horizontal) 
            continue;
    
        return angle;
    }
}

function random_number(min: number, max: number): number {
    let num = 0;
    
    while(true) {
        num = Math.random();

        const to_max = (num > max);
        const to_min = (num < min);

        if(to_max || to_min)
            continue;

        return num;
    }
}

function calculate_ball_speed(ball: ball_interface): number {
    return Math.sqrt(ball.ball_dir_x * ball.ball_dir_x + ball.ball_dir_y * ball.ball_dir_y);
}

function random_bool(): boolean {
    return Math.random() < 0.5;
}

// --------------------------- CLASSES -----------------------------

export class ServerPongTournoi {
    private player_a: string;
    private player_b: string;
    private vainqueur: number;
    private final: number;
    private gameId: string;
    private start_time: number;
    private config: game_config;
    private state: game_state;
    private paddle: paddle_interface;
    private ball: ball_interface;
    private keys_pressed: Record<string, boolean> = {};
    private countdown_interval: NodeJS.Timeout | null = null;
    private restart_timeout: NodeJS.Timeout | null = null;
    private goal_timeout: NodeJS.Timeout | null = null;
    private start_timeout: NodeJS.Timeout | null = null;
    private animation_id: NodeJS.Timeout | null = null;
    private accumulator: number = 0;
    private fixed_timestep: number = 16.67;
    private last_frame_time: number = 0;

    // Callbacks pour communication avec le serveur
    private onStateUpdate?: (state: GameStateMessage) => void;
    private onGameEnd?: (winner: 'left' | 'right') => void;

    constructor(gameId: string, player_a: string, player_b: string, final: number) {
        this.player_a = player_a;
        this.player_b = player_b;
        this.vainqueur = 0;
        this.final = final;
        this.gameId = gameId;
        this.start_time = Date.now();

        this.config = {
            canvas_width: 800,
            canvas_height: 600,
            paddle_width: 10,
            paddle_height: 100,
            ball_real_speed: 8 * (3/2),
            ball_speed: 4.5 * (3/2),
            ball_max_speed: 12 * (3/2),
            paddle_speed: 7.5 * (3/2),
            score_to_win: 3,
            increase_vitesse: 175,
            time_before_new_ball: 3000
        };

        this.state = {
            left_score: 0,
            right_score: 0,
            is_paused: false,
            game_running: true,
            count_down_active: false,
            restart_active: false
        };

        this.ball = {
            ball_x: this.config.canvas_width / 2,
            ball_y: this.config.canvas_height / 2,
            ball_dir_x: 0,
            ball_dir_y: 0,
            angle: 0,
            current_rebond: 0
        };

        this.paddle = {
            left_paddle_y: (this.config.canvas_height - this.config.paddle_height) / 2,
            right_paddle_y: (this.config.canvas_height - this.config.paddle_height) / 2,
            marge: 5,
            current_shot: 0
        };

        this.init_ball_direction();
    }

    public get gameState() { return this.state; }
    public get gameConfig() { return this.config; }

    // Méthodes publiques pour l'API
    setCallbacks(
        onStateUpdate: (state: GameStateMessage) => void,
        onGameEnd: (winner: 'left' | 'right') => void
    ) {
        this.onStateUpdate = onStateUpdate;
        this.onGameEnd = onGameEnd;
    }

    handlePlayerInput(playerId: string, keys: Record<string, boolean>) {
        // Merger les inputs
        Object.assign(this.keys_pressed, keys);
    }

    getGameState(): GameStateMessage {
        return {
            type: 'gameState',
            ball: { ...this.ball },
            paddle: { ...this.paddle },
            state: { ...this.state },
            config: { ...this.config },
            timestamp: Date.now()
        };
    }

    start(): void {
        console.log("🎮 Server Tournoi game starting...");
        
        // Countdown de 3 secondes
        setTimeout(() => {
            this.state.count_down_active = true;
            let countdown = 3;
            
            const countdownInterval = setInterval(() => {
                countdown--;
                
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    this.state.count_down_active = false;
                    this.start_time = Date.now();
                    this.last_frame_time = Date.now();
                    this.game_loop();
                }
            }, 1000);
        }, 1000);
    }

    game_loop(): void {
        if (!this.state.game_running) return;

        const current_time = Date.now();
        const raw_delta_time = current_time - this.last_frame_time;
        let delta_time;
        
        if (raw_delta_time > 1000) {
            console.log("Très long délai détecté, réinitialisation du timing");
            delta_time = this.fixed_timestep;
        } else {
            delta_time = Math.min(raw_delta_time, 250);
        }

        if (raw_delta_time > 250) {
            console.warn(`Spirale de la mort évitée ! Temps réel: ${raw_delta_time.toFixed(2)}ms, temps traité: ${delta_time}ms`);
        }

        this.last_frame_time = current_time;
        this.accumulator += delta_time;

        while(this.accumulator >= this.fixed_timestep) {
            if (!this.state.is_paused) {
                this.update_paddle();
                this.update_ball();
            }
            this.accumulator -= this.fixed_timestep;
        }

        // Envoyer l'état au client
        if (this.onStateUpdate) {
            this.onStateUpdate(this.getGameState());
        }

        if (this.state.game_running) {
            setTimeout(() => this.game_loop(), this.fixed_timestep);
        }
    }

    end_game(): void {
        const winner = this.state.left_score === this.config.score_to_win ? 'left' : 'right';
        
        if (this.state.left_score === this.config.score_to_win) {
            this.vainqueur = 1;
        } else {
            this.vainqueur = 2;
        }

        console.log(`🏆 Tournoi Game ended! Winner: ${winner} (${this.getWinnerName()})`);
        
        this.state.game_running = false;
        
        if (this.onGameEnd) {
            this.onGameEnd(winner);
        }
    }

    is_it_finish(): number {
        return this.vainqueur;
    }

    getWinnerName(): string {
        if (this.vainqueur === 1) {
            return this.player_a;
        } else if (this.vainqueur === 2) {
            return this.player_b;
        }
        return "";
    }

    getPlayer1Name(): string {
        return this.player_a;
    }

    getPlayer2Name(): string {
        return this.player_b;
    }

    cleanup(): void {
        console.log("🧹 Nettoyage des ressources du jeu tournoi...");
        this.clear_all_timers();
        
        this.state.game_running = false;
        this.state.is_paused = true;
        this.state.count_down_active = false;
        
        this.ball.ball_x = this.config.canvas_width / 2;
        this.ball.ball_y = this.config.canvas_height / 2;
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        
        this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
        this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
        this.update_score(0);
        
        console.log("✅ Nettoyage terminé");
    }

    restart(): void {
        console.log("🔄 RESTART Tournoi demandé");
        
        this.clear_all_timers();
        
        this.state.restart_active = true;
        this.state.is_paused = true;
        this.state.count_down_active = false;
        this.state.game_running = true;
        this.last_frame_time = Date.now();
        
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        
        this.update_score(0);
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 8.5 * (3/2);
        
        this.restart_timeout = setTimeout(() => {
            console.log("🚀 Nouvelle partie tournoi");
            this.last_frame_time = Date.now();
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.start_count_down_for_restart();
            this.state.restart_active = false;
        }, 1500);
    }

    clear_all_timers(): void {        
        if (this.countdown_interval) {
            clearInterval(this.countdown_interval);
            this.countdown_interval = null;
        }
        
        if (this.restart_timeout) {
            clearTimeout(this.restart_timeout);
            this.restart_timeout = null;
        }
        
        if (this.goal_timeout) {
            clearTimeout(this.goal_timeout);
            this.goal_timeout = null;
        }
        
        if (this.start_timeout) {
            clearTimeout(this.start_timeout);
            this.start_timeout = null;
        }
        
        if (this.animation_id) {
            clearTimeout(this.animation_id);
            this.animation_id = null;
        }
    }

    start_count_down_for_restart(): void {
        let countdown = 3;
        this.state.count_down_active = true;
        
        this.countdown_interval = setInterval(() => {
            countdown--;
            
            if (this.state.restart_active) {
                return;
            }
            
            if (countdown > 0) {
                // Countdown continue
            } else {
                clearInterval(this.countdown_interval!);
                this.countdown_interval = null;
                this.state.count_down_active = false;
                
                this.init_ball_direction();
                this.start_time = Date.now();
                this.state.is_paused = false;
                
                if (this.state.game_running) {
                    this.last_frame_time = Date.now();
                    this.game_loop();
                }
            }
        }, 1000);
    }

    update_paddle(): void {
        if (this.state.count_down_active) return;
        
        if (this.keys_pressed["w"] && this.paddle.left_paddle_y > 0)
            this.paddle.left_paddle_y -= this.config.paddle_speed;
        if (this.keys_pressed["s"] && this.paddle.left_paddle_y < this.config.canvas_height - this.config.paddle_height)
            this.paddle.left_paddle_y += this.config.paddle_speed;

        if (this.keys_pressed["ArrowUp"] && this.paddle.right_paddle_y > 0)
            this.paddle.right_paddle_y -= this.config.paddle_speed;
        if (this.keys_pressed["ArrowDown"] && this.paddle.right_paddle_y < this.config.canvas_height - this.config.paddle_height)
            this.paddle.right_paddle_y += this.config.paddle_speed;
    }

    // detection collision
    private checkLineRectCollision(
        lineStart: { x: number; y: number },
        lineEnd: { x: number; y: number },
        rect: { x: number; y: number; width: number; height: number }
    ): { collision: boolean; intersectionPoint?: { x: number; y: number } } {
        
        if (lineEnd.x >= rect.x && lineEnd.x <= rect.x + rect.width &&
            lineEnd.y >= rect.y && lineEnd.y <= rect.y + rect.height) {
            return { collision: true, intersectionPoint: lineEnd };
        }
        
        const rectLines = [
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x, y: rect.y + rect.height } },
            { start: { x: rect.x + rect.width, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y + rect.height } },
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y } },
            { start: { x: rect.x, y: rect.y + rect.height }, end: { x: rect.x + rect.width, y: rect.y + rect.height } }
        ];
        
        for (const rectLine of rectLines) {
            const intersection = this.getLineIntersection(lineStart, lineEnd, rectLine.start, rectLine.end);
            if (intersection) {
                return { collision: true, intersectionPoint: intersection };
            }
        }
        
        return { collision: false };
    }

    // calculer intersections entre 2 segmenst
    private getLineIntersection(
        p1: { x: number; y: number }, p2: { x: number; y: number },
        p3: { x: number; y: number }, p4: { x: number; y: number }
    ): { x: number; y: number } | null {
        
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;
        
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return null;
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }
        
        return null;
    }

    update_ball(): void {
        if (this.state.is_paused || this.state.count_down_active) return;

        const previousX = this.ball.ball_x;
        const previousY = this.ball.ball_y;
        const newX = this.ball.ball_x + this.ball.ball_dir_x;
        const newY = this.ball.ball_y + this.ball.ball_dir_y;

        if (Date.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < this.config.ball_max_speed) {
            this.config.ball_speed += 0.1;
            this.config.paddle_speed += 0.05;
            this.start_time = Date.now();
        }

        // Collision avec la raquette gauche
        if (this.ball.ball_dir_x < 0) { 
            const leftPaddleRect = {
                x: 25,
                y: this.paddle.left_paddle_y - this.paddle.marge,
                width: 15, // De x=25 à x=40
                height: this.config.paddle_height + (this.paddle.marge * 2)
            };
            
            const leftCollision = this.checkLineRectCollision(
                { x: previousX, y: previousY },
                { x: newX, y: newY },
                leftPaddleRect
            );
            
            if (leftCollision.collision) {
                console.log(`🏓 Rebond raquette gauche détecté par collision continue`);
                
                if (leftCollision.intersectionPoint) {
                    this.ball.ball_x = leftCollision.intersectionPoint.x;
                    this.ball.ball_y = leftCollision.intersectionPoint.y;
                }
                
                if (this.config.ball_speed < this.config.ball_real_speed) {
                    this.config.ball_speed = this.config.ball_real_speed;
                }
                this.update_ball_dir(0);
                this.normalize_ball_speed();
                
                return;
            }
        }

        // Collision avec la raquette droite
        if (this.ball.ball_dir_x > 0) {
            const rightPaddleRect = {
                x: this.config.canvas_width - 40,
                y: this.paddle.right_paddle_y - this.paddle.marge,
                width: 15, 
                height: this.config.paddle_height + (this.paddle.marge * 2)
            };
            
            const rightCollision = this.checkLineRectCollision(
                { x: previousX, y: previousY },
                { x: newX, y: newY },
                rightPaddleRect
            );
            
            if (rightCollision.collision) {
                console.log(`🏓 Rebond raquette droite détecté par collision continue`);
                
                if (rightCollision.intersectionPoint) {
                    this.ball.ball_x = rightCollision.intersectionPoint.x;
                    this.ball.ball_y = rightCollision.intersectionPoint.y;
                }
                
                if (this.config.ball_speed < this.config.ball_real_speed) {
                    this.config.ball_speed = this.config.ball_real_speed;
                }
                this.update_ball_dir(1);
                this.normalize_ball_speed();
                return;
            }
        }

        // Vérifier les buts
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width) {
            this.state.is_paused = true;
            console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed} et rebond = ${this.ball.current_rebond}`);
            this.handle_goal();
            return;
        }

        // Si aucune collision avec les paddles, mettre à jour la position normalement
        this.ball.ball_x = newX;
        this.ball.ball_y = newY;

        // Rebonds sur les murs haut et bas
        if (this.ball.ball_y <= 5 || this.ball.ball_y >= this.config.canvas_height - 5) {
            console.log(`AVANT rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);

            if (this.ball.ball_x <= 70 ) {
                if (this.ball.ball_y <= 5)
                    this.ball.ball_y = 6;
                else
                    this.ball.ball_y = this.config.canvas_height - 6;
                console.log("ca passe ici zeubi")
            }
            if (this.ball.ball_x >= this.config.canvas_width - 70) {
                if (this.ball.ball_y <= 5)
                    this.ball.ball_y = 6;
                else
                    this.ball.ball_y = this.config.canvas_height - 6;
                console.log("ca passe ici woula")
            }

            console.log(`APRES rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);
            
            this.ball.ball_dir_y *= -1;
            this.ball.current_rebond++;
            this.normalize_ball_speed();
        }
    }

    handle_goal(): void {
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.update_score(1);
        
        if (this.state.left_score === this.config.score_to_win || this.state.right_score === this.config.score_to_win) {
            this.end_game();
            return;
        }
        
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 8.5 * (3/2);

        this.goal_timeout = setTimeout(() => {
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.start_count_down();
        }, 1500);
    }

    update_ball_dir(side: number): void {
        let paddle_y = side === 0 ? this.paddle.left_paddle_y : this.paddle.right_paddle_y;
        let relative_impact = (this.ball.ball_y - paddle_y) / this.config.paddle_height;
        let max_bounce_angle = Math.PI / 4;

        let bounce_angle = (relative_impact - 0.5) * 2 * max_bounce_angle;

        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(bounce_angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(bounce_angle);

        if (side === 1) this.ball.ball_dir_x = -this.ball.ball_dir_x;
    }

    update_score(flag: number): void {
        if (this.ball.ball_x < 45)
            this.state.right_score++;
        else
            this.state.left_score++;

        if (flag === 0) {
            this.state.right_score = 0;
            this.state.left_score = 0;
        }
    }

    start_count_down(): void {        
        let countdown = 3;
        
        if (this.state.restart_active) {
            return;
        }
        
        this.goal_timeout = setTimeout(() => {
            if (this.state.restart_active) {
                return;
            }
            
            this.state.count_down_active = true;
            
            this.countdown_interval = setInterval(() => {
                countdown--;
                
                if (this.state.restart_active) {
                    return;
                }
                
                if (countdown > 0) {
                    // Countdown continue
                } else {
                    clearInterval(this.countdown_interval!);
                    this.countdown_interval = null;
                    this.state.count_down_active = false;
                    this.init_ball_direction();
                    this.start_time = Date.now();
                    this.state.is_paused = false;
                }
            }, 1000);
        }, 1000);
    }

    init_ball_direction(): void {
        this.ball.angle = get_random_playable_angle();
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);
    }

    normalize_ball_speed(): void {
        const current_speed = Math.sqrt(this.ball.ball_dir_x * this.ball.ball_dir_x + this.ball.ball_dir_y * this.ball.ball_dir_y);
        
        if (current_speed !== 0) {
            this.ball.ball_dir_x = (this.ball.ball_dir_x / current_speed) * this.config.ball_speed;
            this.ball.ball_dir_y = (this.ball.ball_dir_y / current_speed) * this.config.ball_speed;
        }
    }
}

// Classe wrapper comme dans votre architecture
export class ServerGame_tournoi {
    private current_game: ServerPongTournoi | null = null;
    public currentGameId: string | null = null;
    private ws: WebSocket | null = null;
    private player_a: string;
    private player_b: string;

    constructor(player_a: string, player_b: string, final: number) {
        this.player_a = player_a;
        this.player_b = player_b;
        this.currentGameId = null;
    }

    getPlayer1Name(): string {
        return this.player_a;
    }

    getPlayer2Name(): string {
        return this.player_b;
    }

    async start_game_loop(): Promise<void> {
        try {
            // Créer une partie côté serveur
            const response = await fetch('/api/game/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mode: 'versus' }) // Tournoi utilise le mode versus
            });

            if (!response.ok) {
                throw new Error(`Failed to create game: ${response.statusText}`);
            }

            const data = await response.json();
            this.currentGameId = data.gameId;

            console.log(`🎮 Created server tournoi game: ${this.currentGameId}`);

            // Se connecter via WebSocket
            const wsUrl = `ws://localhost:3000/ws/game/${this.currentGameId}?playerId=player1&mode=versus`;
            this.ws = new WebSocket(wsUrl);

            await new Promise<void>((resolve, reject) => {
                if (!this.ws) {
                    reject(new Error('WebSocket not initialized'));
                    return;
                }

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected');
                    resolve();
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    reject(error);
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleServerMessage(data);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = () => {
                    console.log('🔌 WebSocket disconnected');
                };
            });

            // Démarrer la capture des inputs
            this.setupInputCapture();

        } catch (error) {
            console.error('Failed to start server tournoi game:', error);
            throw error;
        }
    }

    private handleServerMessage(data: any): void {
        if (data.type === 'gameState') {
            this.updateClientFromServer(data);
        } else if (data.type === 'gameEnd') {
            console.log(`🏆 Tournoi game ended! Winner: ${data.winner}`);
            this.showEndMessage(data.winner);
        }
    }

    private updateClientFromServer(serverState: GameStateMessage): void {
        // Mettre à jour le canvas avec l'état du serveur
        this.renderGame(serverState);
        
        // Mettre à jour les scores
        this.updateScoreDisplay(serverState.state);
        
        // Mettre à jour le countdown
        if (serverState.state.count_down_active) {
            // Afficher countdown si nécessaire
        }
    }

    private renderGame(state: GameStateMessage): void {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dessiner le jeu basé sur l'état du serveur
        this.draw(ctx, state);
    }

    private draw(ctx: CanvasRenderingContext2D, state: GameStateMessage): void {
        const { ball, paddle, config } = state;

        // fond noir degrade
        let bgGradient = ctx.createLinearGradient(0, 0, 0, config.canvas_height);
        bgGradient.addColorStop(0, "#0f0f0f");
        bgGradient.addColorStop(1, "#1a1a1a");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, config.canvas_width, config.canvas_height);

        // ligne centrale de pointilles
        ctx.shadowBlur = 0;
        ctx.setLineDash([10, 15]);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(config.canvas_width / 2, 0);
        ctx.lineTo(config.canvas_width / 2, config.canvas_height);
        ctx.stroke();
        ctx.setLineDash([]);

        // raquettes
        // effet glow : couleur + ombre
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 20;

        let paddleGradientLeft = ctx.createLinearGradient(0, paddle.left_paddle_y, 0, paddle.left_paddle_y + config.paddle_height);
        paddleGradientLeft.addColorStop(0, "#00ffff");
        paddleGradientLeft.addColorStop(1, "#005f5f");
        ctx.fillStyle = paddleGradientLeft;
        ctx.fillRect(30, paddle.left_paddle_y, config.paddle_width, config.paddle_height);

        ctx.shadowColor = "#ff00ff";
        ctx.shadowBlur = 20;

        let paddleGradientRight = ctx.createLinearGradient(0, paddle.right_paddle_y, 0, paddle.right_paddle_y + config.paddle_height);
        paddleGradientRight.addColorStop(0, "#ff00ff");
        paddleGradientRight.addColorStop(1, "#5f005f");
        ctx.fillStyle = paddleGradientRight;
        ctx.fillRect(config.canvas_width - 30 - config.paddle_width, paddle.right_paddle_y, config.paddle_width, config.paddle_height);

        // balle
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        ctx.shadowColor = blink ? "#ffff00" : "#ff00ff";
        ctx.shadowBlur = 25;
        ctx.fillStyle = blink ? "#ffff00" : "#ff00ff";
        ctx.beginPath();
        ctx.arc(ball.ball_x, ball.ball_y, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    private updateScoreDisplay(gameState: game_state): void {
        const scoreP1 = document.getElementById('scoreP1');
        const scoreP2 = document.getElementById('scoreP2');

        if (scoreP1) {
            scoreP1.textContent = `${this.player_a} : ${gameState.left_score}`;
        }
        if (scoreP2) {
            scoreP2.textContent = `${this.player_b} : ${gameState.right_score}`;
        }
    }

    private showEndMessage(winner: 'left' | 'right'): void {
        const endMessage = document.getElementById('endMessage');
        if (endMessage) {
            let message = '';
            if (winner === 'left') {
                message = `🏆 ${this.player_a} gagne la partie !`;
            } else {
                message = `🏆 ${this.player_b} gagne la partie !`;
            }
            endMessage.textContent = message;
            endMessage.classList.remove('hidden');
        }
    }

    check_end_game(): number | undefined {
        if (this.current_game) {
            return this.current_game.is_it_finish();
        }
        return 0;
    }

    private setupInputCapture(): void {
        const keys_pressed: Record<string, boolean> = {};

        const handleKeyDown = (e: KeyboardEvent) => {
            keys_pressed[e.key] = true;
            this.sendInputToServer(keys_pressed);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keys_pressed[e.key] = false;
            this.sendInputToServer(keys_pressed);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Nettoyer les event listeners lors de la déconnexion
        if (this.ws) {
            this.ws.addEventListener('close', () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('keyup', handleKeyUp);
            });
        }
    }

    private sendInputToServer(keys: Record<string, boolean>): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'playerInput',
                keys: keys
            }));
        }
    }

    restart(): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'restartGame'
            }));
        }
    }

    cleanup(): void {
        console.log("🧹 Nettoyage ServerGame_tournoi...");
        if (this.current_game) {
            this.current_game.cleanup();
            this.current_game = null;
        }
    }

    back_to_menu(): void {
        console.log("🏠 Retour au menu ServerGame_tournoi...");
        this.cleanup();
    }

    destroy(): void {
        console.log("💥 Destruction ServerGame_tournoi...");
        this.disconnect();
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.cleanup();
        this.currentGameId = null;
    }
}