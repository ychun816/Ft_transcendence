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
    game_mode: 'solo' | 'versus';
    count_down_active: boolean;
    ia_mode: boolean;
    restart_active: boolean;
}

interface ball_interface {
    ball_x: number;
    ball_y: number;
    ball_dir_x: number;
    ball_dir_y: number;
    angle: number;
    ia_x: number;
    ia_y: number;
    time_ia_in_frame: number;
    distance_ia: number;
    current_rebond: number;
}

interface paddle_interface {
    left_paddle_y: number;
    right_paddle_y: number;
    marge: number;
    time_ia_in_frame: number;
    current_shot: number;
}

interface ia_interface {
    depart: number;
    move_1: number;
    move_2: number;
    counter: number;
    rebond: number;
    random_move_1: boolean;
    random_move_2: boolean;
    move_flag: boolean;
    continue_flag: boolean;
    distance_with_marge: number;
    super_flag: boolean;
    random_paddle_move: boolean;
    ia_debug: boolean;
    ia_debug_2: boolean;
    close_rebond: boolean;
    far_rebond: boolean;
    far_far_rebond: boolean;
    service: boolean;
    delta_paddle: number;
    delta_error: number;
    error_percent: number;
    data: number;
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

export class ServerPong {
    private gameId: string;
    private start_time: number;
    private config: game_config;
    private state: game_state;
    private paddle: paddle_interface;
    private ball: ball_interface;
    private keys_pressed: Record<string, boolean> = {};
    private ia: ia_interface;
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

    constructor(gameId: string, mode: 'solo' | 'versus') {
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
            game_mode: mode,
            count_down_active: false,
            ia_mode: mode === 'solo',
            restart_active: false
        };

        this.ball = {
            ball_x: this.config.canvas_width / 2,
            ball_y: this.config.canvas_height / 2,
            ball_dir_x: 0,
            ball_dir_y: 0,
            angle: 0,
            ia_x: 0,
            ia_y: 0,
            time_ia_in_frame: 0,
            distance_ia: 0,
            current_rebond: 0
        };

        this.paddle = {
            left_paddle_y: (this.config.canvas_height - this.config.paddle_height) / 2,
            right_paddle_y: (this.config.canvas_height - this.config.paddle_height) / 2,
            marge: 5,
            time_ia_in_frame: 0,
            current_shot: 0
        };

        this.ia = {
            depart: 0,
            move_1: 0,
            move_2: 0,
            counter: 0,
            rebond: 0,
            random_move_1: false,
            random_move_2: false,
            move_flag: false,
            continue_flag: true,
            distance_with_marge: 0,
            super_flag: true,
            random_paddle_move: false,
            ia_debug: true,
            ia_debug_2: true,
            close_rebond: false,
            far_rebond: false,
            far_far_rebond: false,
            service: true,
            delta_paddle: 0,
            delta_error: 0,
            error_percent: 0.2,
            data: 0,
        };

        this.init_ball_direction();
    }

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
        console.log("🎮 Server Solo/Versus game starting...");
        
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
                if (this.state.game_mode === "solo" && this.state.ia_mode === false && this.ball.ball_dir_x > 0) {
                    if (this.ia.service === true) {
                        this.ia_detection();
                        this.ia.continue_flag = true;
                        this.ia.service = false;
                    }
                    this.ia_ajustement(15, false);
                }
                if (this.state.game_mode === "solo" && this.state.ia_mode === true) {
                    this.ia.counter++;
                    this.handle_paddle_move();
                }
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
        console.log(`🏆 Solo/Versus Game ended! Winner: ${winner}`);
        
        this.state.game_running = false;
        
        if (this.onGameEnd) {
            this.onGameEnd(winner);
        }
    }

    cleanup(): void {
        console.log("🧹 Nettoyage des ressources du jeu solo/versus...");
        
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
        
        console.log("✅ Nettoyage terminé");
    }

    restart(): void {
        console.log("🔄 RESTART Solo/Versus demandé");
        
        this.clear_all_timers();
        
        this.state.restart_active = true;
        this.state.is_paused = true;
        this.state.count_down_active = false;
        this.state.game_running = true;
        
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        
        this.update_score(0);
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 7.5 * (3/2);
        
        this.restart_timeout = setTimeout(() => {
            console.log("🚀 Nouvelle partie solo/versus");
            
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

        if (this.state.game_mode !== "solo") {
            if (this.keys_pressed["ArrowUp"] && this.paddle.right_paddle_y > 0)
                this.paddle.right_paddle_y -= this.config.paddle_speed;
            if (this.keys_pressed["ArrowDown"] && this.paddle.right_paddle_y < this.config.canvas_height - this.config.paddle_height)
                this.paddle.right_paddle_y += this.config.paddle_speed;
        }
    }

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
                width: 15,
                height: this.config.paddle_height + (this.paddle.marge * 2)
            };
            
            const leftCollision = this.checkLineRectCollision(
                { x: previousX, y: previousY },
                { x: newX, y: newY },
                leftPaddleRect
            );
            
            if (leftCollision.collision) {
                console.log(`🏓 Rebond raquette gauche détecté`);
                
                if (leftCollision.intersectionPoint) {
                    this.ball.ball_x = leftCollision.intersectionPoint.x;
                    this.ball.ball_y = leftCollision.intersectionPoint.y;
                }
                
                if (this.config.ball_speed < this.config.ball_real_speed) {
                    this.config.ball_speed = this.config.ball_real_speed;
                }
                this.update_ball_dir(0);
                this.normalize_ball_speed();

                if (this.state.game_mode === "solo") {
                    this.state.ia_mode = true;
                    this.ia_init();
                    this.ia_detection();
                    this.ia_init_difficulty();
                    this.ia.counter = 0;
                    this.ball.current_rebond = 0;
                    this.paddle.current_shot++;
                }
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
                console.log(`🏓 Rebond raquette droite détecté`);
                
                if (rightCollision.intersectionPoint) {
                    this.ball.ball_x = rightCollision.intersectionPoint.x;
                    this.ball.ball_y = rightCollision.intersectionPoint.y;
                }
                
                if (this.config.ball_speed < this.config.ball_real_speed) {
                    this.config.ball_speed = this.config.ball_real_speed;
                }
                this.update_ball_dir(1);
                this.normalize_ball_speed();

                if (this.state.game_mode === "solo") {
                    this.state.ia_mode = false;
                    this.ball.current_rebond = 0;
                }
                return;
            }
        }

        // Vérifier les buts
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width) {
            this.state.is_paused = true;
            console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed} et rebond = ${this.ball.current_rebond} et delta error = ${this.ia.delta_error} et delta_paddle = ${this.ia.delta_paddle}`);
            this.handle_goal();
            if (this.state.game_mode === "solo") {
                this.state.ia_mode = false;
                this.ia.service = true;
                this.paddle.current_shot = 0;
                this.ia.delta_error = 0;
                this.ia.delta_paddle = 0;
            }
            return;
        }

        this.ball.ball_x = newX;
        this.ball.ball_y = newY;

        // Rebonds sur les murs haut et bas
        if (this.ball.ball_y <= 5 || this.ball.ball_y >= this.config.canvas_height - 5) {
            if (this.ball.ball_x <= 70) {
                this.ball.ball_y = this.ball.ball_y <= 5 ? 6 : this.config.canvas_height - 6;
            }
            if (this.ball.ball_x >= this.config.canvas_width - 70) {
                this.ball.ball_y = this.ball.ball_y <= 5 ? 6 : this.config.canvas_height - 6;
            }
            
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

    // ========================= LOGIQUE IA COMPLÈTE =========================
    
    ia_init() {
        this.ia.random_move_1 = random_bool();
        this.ia.random_move_2 = random_bool();
        this.ia.random_paddle_move = random_bool();
        this.ia.continue_flag = true;
        this.ia.move_flag = false;
        this.ia.super_flag = true;
        this.ia.rebond = 0;
        this.ball.distance_ia = 0;
        this.ia.ia_debug = true;
        this.ia.close_rebond = false;
        this.ia.far_rebond = false;
        this.ia.far_far_rebond = false;
        this.ia.data = 0;
        this.ia.delta_paddle = this.ia_delta_paddle();
        if (this.paddle.current_shot >= 4)
            this.handle_ia_error();
    }

    ia_detection(): void {
        let x = this.ball.ball_x;
        let y = this.ball.ball_y;
        let dir_x = this.ball.ball_dir_x;
        let dir_y = this.ball.ball_dir_y;
        let prev_x = x;
        let prev_y = y;

        while (x < this.config.canvas_width - 40) {
            if (y <= 0 || y >= this.config.canvas_height) {
                let distance = Math.sqrt(Math.pow(x - prev_x, 2) + Math.pow(y - prev_y, 2));
                this.ball.distance_ia += distance;
                dir_y *= -1;
                this.ia.rebond++;
                prev_x = x;
                prev_y = y;
                if (x <= this.config.canvas_width / 2)
                    this.ia.close_rebond = true;
                else if (x > this.config.canvas_width / 2)
                    this.ia.far_rebond = true;
                else if (x > (3 * this.config.canvas_width / 4))
                    this.ia.far_far_rebond = true;
            }
            x += dir_x;
            y += dir_y;
        }

        this.ball.ia_x = x;
        this.ball.ia_y = y;

        if (this.ia.rebond == 0)
           this.ball.distance_ia = Math.sqrt(Math.pow(this.ball.ball_x - x, 2) + Math.pow(this.ball.ball_y - y, 2));
        else {
            let final_distance = Math.sqrt(Math.pow(x - prev_x, 2) + Math.pow(y - prev_y, 2));
            this.ball.distance_ia += final_distance;
        }

        this.ball.time_ia_in_frame = this.ball.distance_ia / this.config.ball_speed;
    }

    ia_init_difficulty() {
        let random_depart = random_number(0.1, 0.2);
        this.ia.depart = random_depart * this.ball.time_ia_in_frame;

        let random_move_2 = random_number(0.1, 0.25);
        this.ia.move_2 = random_move_2 * this.ball.time_ia_in_frame;

        let random_move_1 = 1 - random_move_2 - random_depart;
        this.ia.move_1 = random_move_1 * this.ball.time_ia_in_frame;

        console.log(`TIME IN FRAME = ${this.ball.time_ia_in_frame}`);
        console.log(`random_depart = ${random_depart}`);
        console.log(`random_move_1 = ${random_move_1}`);
        console.log(`random_move_2 = ${random_move_2}`);

        // supression de l'erreur si paddle deja sur la trajectoire
        if (this.ball.ia_y >= this.paddle.right_paddle_y && this.ball.ia_y <= this.paddle.right_paddle_y + this.config.paddle_height)
            this.ia.delta_error = 0;
    }

    handle_paddle_move() {
        if (this.ia.rebond == 0) {
            if (this.ia.delta_error != 0)
                this.ia.random_move_1 = false;
            this.update_paddle_ia_with_time();
        }
        else if (this.ia.rebond == 1 && this.ia.close_rebond == true)
            this.update_paddle_ia_with_1_close_rebond();
        else if (this.ia.rebond == 1 && this.ia.far_rebond == true)
            this.update_paddle_ia_with_1_far_rebond();
        else if (this.ia.rebond == 2)
            this.update_paddle_ia_with_2_rebonds();
    }

    update_paddle_ia_with_time() {
        if (this.ia.depart >= this.ia.counter)
            return ;

        if (this.ia.move_1 >= this.ia.counter - this.ia.depart) {
            if (this.ia.ia_debug == true) {
                console.log("****** TIME move 1 *********");
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                if (Math.abs(distance) > 250)
                    this.ia.random_move_1 = false;
                this.ia.ia_debug = false;
            }
            this.ia_ajustement(80, this.ia.random_move_1);
            return ;
        }
        if (this.ia.super_flag == true) {
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
        }
        if (this.ia.move_2 >= (this.ia.counter - this.ia.move_1 - this.ia.depart)) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** TIME move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 13)
                this.ia_ajustement(12, this.ia.random_move_2);
            else
                this.ia_ajustement(8, this.ia.random_move_2);
            return ;
        }
    }

    update_paddle_ia_with_1_close_rebond() {
        if (this.ball.current_rebond < 1 && this.ia.depart >= this.ia.counter)
            return ;
        if (this.ia.move_1 >= this.ia.counter) {
            if (this.ia.ia_debug == true) {
                console.log("****** 1 CLOSE move 1 *********");
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                if (Math.abs(distance) > 250)
                    this.ia.random_move_1 = false;
                this.ia.ia_debug = false;
            }            
            this.ia_ajustement(120, this.ia.random_move_1);
            return ;
        }
        if (this.ia.super_flag == true) {
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
        }
        if (this.ia.move_2 >= (this.ia.counter - this.ia.move_1 - this.ia.depart)) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 1 CLOSE move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 13)
                this.ia_ajustement(12, this.ia.random_move_2);
            else
                this.ia_ajustement(10, this.ia.random_move_2);
            return ;
        }
    }

    update_paddle_ia_with_1_far_rebond() {
        if (this.ia.depart >= this.ia.counter)
            return ;
        if (this.ball.current_rebond < 1) {
            if (this.ia.ia_debug == true) {
                console.log("****** 1 FAR move 1 *********");
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                this.ia.data = distance;
                this.ia.ia_debug = false;
            }  
            if (this.ia.data > 250)
                this.ia_ajustement(120, false);
            else  
                this.ia_ajustement_rebond(120);
            return ;
        }
        if (this.ia.super_flag == true) {
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
        }
        if (this.ball.current_rebond >= 1) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 1 FAR move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 13)
                this.ia_ajustement(12, false);
            else
                this.ia_ajustement(10, false);
            return ;
        }
    }

    update_paddle_ia_with_2_rebonds() {
        if (this.ball.current_rebond < 1 && this.ia.depart >= this.ia.counter)
            return ;
        if (this.ball.current_rebond < 2) {
            if (this.ia.ia_debug == true) {
                console.log("****** 2 REBONDS move 1 *********");
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                this.ia.data = distance;
                this.ia.ia_debug = false;
            }  
            if (this.ia.data > 250)
                this.ia_ajustement(120, false);
            else  
                this.ia_ajustement_rebond(120);
            return ;
        }
        if (this.ia.super_flag == true) {
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
        }
        if (this.ball.current_rebond >= 2) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 2 REBONDS move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 13)
                this.ia_ajustement(12, false);
            else
                this.ia_ajustement(10, false);
            return ;
        }
    }

    ia_ajustement(marge: number, random: boolean) {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;

        if (Math.abs(distance) <= marge && random == false) {
            console.log("FIN DE MOVE avec random = false");
            return ;
        }

        if (Math.abs(distance) <= marge && random == true && this.ia.move_flag == true) {
            if (this.ia.continue_flag == true) {
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement();
            console.log("FIN DE MOVE continue");
            return ;
        }

        if (Math.abs(distance) <= marge) {
            console.log("FIN DE MOVE");
            return ;
        }

        if (distance > 0 && this.ia.continue_flag == true) {
            console.log(`ajust 1 et marge = ${marge}`);
            this.paddle.right_paddle_y += this.config.paddle_speed;
            this.ia.move_flag = true;
        }
        else if (distance < 0 && this.ia.continue_flag == true) {
            console.log(`ajust 2 et marge = ${marge}`);
            this.paddle.right_paddle_y -= this.config.paddle_speed;
            this.ia.move_flag = true;
        }

        this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
    }

    ia_ajustement_rebond(marge: number) {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;

        if (Math.abs(distance) <= marge) {
            if (this.ia.continue_flag == true) {
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement_rebond();
            console.log("FIN DE MOVE continue");
            return ;
        }

        if (distance > 0 && this.ia.continue_flag == true) {
            console.log(`ajust 1 et marge = ${marge}`);
            this.paddle.right_paddle_y += this.config.paddle_speed;
        }
        else if (distance < 0 && this.ia.continue_flag == true) {
            console.log(`ajust 2 et marge = ${marge}`);
            this.paddle.right_paddle_y -= this.config.paddle_speed;
        }

        this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
    }

    continue_movement() {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;

        if (this.ia.distance_with_marge < 0 && (this.config.canvas_height - target_y) >= (this.config.paddle_height / 2)) {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return ;
        }
        else if (this.ia.distance_with_marge >= 0 && target_y >= (this.config.paddle_height / 2)) {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return ;
        }
        return ;
    }

    continue_movement_rebond() {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;

        if (this.ia.distance_with_marge < 0) {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
            return ;
        }
        else if (this.ia.distance_with_marge >= 0) {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
            return ;
        }
        return ;
    }

    ia_delta_paddle(): number {
        let random = random_number(0, 0.38);
        let random_sign = random_bool();

        if (random_sign == true)
            random *= -1;

        return (random * 100);
    }

    handle_ia_error() {
        let random = random_number(0, 1);
        let ajust_percent_lose = 0;

        if (this.state.right_score - this.state.left_score >= 2)
            ajust_percent_lose = 0.15;

        if (this.state.right_score - this.state.left_score >= 3)
            ajust_percent_lose = 0.20;

        if (this.state.right_score - this.state.left_score >= 4)
            ajust_percent_lose = 0.25;

        if (this.paddle.current_shot < 9) {
            if (random < 0.15 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 70 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (70 + this.ia.delta_paddle) * -1;
            }
        }
        else if (this.paddle.current_shot < 12) {
            if (random < 0.20 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 70 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (70 + this.ia.delta_paddle) * -1;
            }
        }
        else {
            if (random < 0.30 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 70 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (70 + this.ia.delta_paddle) * -1;
            }
        }

        if (this.ia.delta_error != 0)
            console.log(`! ERROR ! avec cou = ${this.paddle.current_shot} avec delta = ${this.ia.delta_error}`);
    }
}

// Classe wrapper comme dans votre architecture
export class ServerGame_solo {
    private current_game: ServerPong | null = null;
    public currentGameId: string | null = null;
    private ws: WebSocket | null = null;
    private mode: 'solo' | 'versus';

    constructor(mode: 'solo' | 'versus') {
        this.mode = mode;
        this.currentGameId = null;
    }

    async start_game_loop(): Promise<void> {
        try {
            // Créer une partie côté serveur
            const response = await fetch('/api/game/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mode: this.mode })
            });

            if (!response.ok) {
                throw new Error(`Failed to create game: ${response.statusText}`);
            }

            const data = await response.json();
            this.currentGameId = data.gameId;

            console.log(`🎮 Created server game: ${this.currentGameId}`);

            // Se connecter via WebSocket
            const wsUrl = `ws://localhost:3000/ws/game/${this.currentGameId}?playerId=player1&mode=${this.mode}`;
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
            console.error('Failed to start server game:', error);
            throw error;
        }
    }

    private handleServerMessage(data: any): void {
        if (data.type === 'gameState') {
            this.updateClientFromServer(data);
        } else if (data.type === 'gameEnd') {
            console.log(`🏆 Game ended! Winner: ${data.winner}`);
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

        // Fond noir dégradé
        let bgGradient = ctx.createLinearGradient(0, 0, 0, config.canvas_height);
        bgGradient.addColorStop(0, "#0f0f0f");
        bgGradient.addColorStop(1, "#1a1a1a");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, config.canvas_width, config.canvas_height);

        // Ligne centrale de pointillés
        ctx.shadowBlur = 0;
        ctx.setLineDash([10, 15]);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(config.canvas_width / 2, 0);
        ctx.lineTo(config.canvas_width / 2, config.canvas_height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Raquettes avec effet glow
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

        // Balle avec effet blink
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
            scoreP1.textContent = `Joueur 1 : ${gameState.left_score}`;
        }
        if (scoreP2) {
            if (this.mode === 'solo') {
                scoreP2.textContent = `IA : ${gameState.right_score}`;
            } else {
                scoreP2.textContent = `Joueur 2 : ${gameState.right_score}`;
            }
        }
    }

    private showEndMessage(winner: 'left' | 'right'): void {
        const endMessage = document.getElementById('endMessage');
        if (endMessage) {
            let message = '';
            if (winner === 'left') {
                message = '🏆 Joueur 1 gagne la partie !';
            } else {
                if (this.mode === 'solo') {
                    message = '🏆 IA gagne la partie !';
                } else {
                    message = '🏆 Joueur 2 gagne la partie !';
                }
            }
            endMessage.textContent = message;
            endMessage.classList.remove('hidden');
        }
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
        console.log("🧹 Nettoyage ServerGame_solo...");
        if (this.current_game) {
            this.current_game.cleanup();
            this.current_game = null;
        }
    }

    back_to_menu(): void {
        console.log("🏠 Retour au menu ServerGame_solo...");
        this.cleanup();
    }

    destroy(): void {
        console.log("💥 Destruction ServerGame_solo...");
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