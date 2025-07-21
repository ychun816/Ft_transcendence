
// -------------------------- INTERFACES ------------------------------------

//import { selected_game_mode } from "./menu.js";


interface game_config
{
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

interface game_state
{
    left_score: number;
    right_score: number;
    is_paused: boolean;
    game_running: boolean;
    count_down_active: boolean;
    restart_active: boolean;
}

interface ball_interface
{
    ball_x: number;
    ball_y: number;
    prev_x: number;
    prev_y: number;
    ball_dir_x: number;
    ball_dir_y: number;
    angle: number;
    current_rebond: number;
}

interface paddle_interface
{
    left_paddle_y: number;
    right_paddle_y: number;
    marge: number;
    current_shot: number;
}

interface data_score
{
    ia_mode: boolean;
    winner: boolean;
    score: number;
    score_adv: number;
    point_marque_moitie_up: number;
    point_marque_moitie_down: number;
    point_perdu_moitie_up: number;
    point_perdu_moitie_down: number;
}



// ------------------------ FONCTIONS UTILES -----------------------


function get_random_playable_angle(): number
{
    let angle = 0;
    while (true)
    {
        angle = Math.random() * 2 * Math.PI;

        const is_too_vertical = (
        (angle >= 1 && angle <= 2.1) ||   // proche de π/2
        (angle >= 4.4 && angle <= 5.1)      // proche de 3π/2
        );

        const is_too_horizontal = (
        (angle >= 0 && angle <= 0.4) ||                   // proche de 0
        (angle >= 2 * Math.PI - 0.4 && angle <= 2 * Math.PI) ||  // proche de 2π
        (angle >= Math.PI - 0.4 && angle <= Math.PI + 0.4)       // proche de π
        );

        if (is_too_vertical || is_too_horizontal) 
            continue;
    
        return angle;
    }
}

function random_number(min: number, max: number): number
{
    let num = 0;
    
    while(true)
    {
        num = Math.random();

        const to_max = (num > max);
        const to_min = (num < min);

        if(to_max || to_min)
            continue;

        return num;
    }
}

function calculate_ball_speed(ball: ball_interface): number
{
    return Math.sqrt(ball.ball_dir_x * ball.ball_dir_x + ball.ball_dir_y * ball.ball_dir_y);
}


function get_time(start_time: DOMHighResTimeStamp): number
{
  return performance.now() - start_time;
}


function random_bool(): boolean
{
    return Math.random() < 0.5;
}


// --------------------------- CLASSES -----------------------------


class Pong
{
    private player_a: string;
    private player_b: string;
    private vainqueur: number;
    private final: number;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private start_time: DOMHighResTimeStamp;
    private config: game_config;
    private state: game_state;
    private paddle: paddle_interface;
    private ball: ball_interface;
    private keys_pressed: Record<string, boolean> = {};
    private count_down: HTMLDivElement;
    private animation_id: number;
    private countdown_interval: number | null = null;
    private restart_timeout: number | null = null;
    private goal_timeout: number | null = null;
    private start_timeout: number | null = null;
    private end_message: HTMLElement | null = null;
    private accumulator: number = 0;
    private fixed_timestep: number = 16.67;
    private last_frame_time: number = 0;
    private data: data_score;


    constructor(canvas : HTMLCanvasElement, player_a: string, player_b: string, final: number)
    {
        this.player_a = player_a;
        this.player_b = player_b;
        this.vainqueur = 0;
        this.final = final;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.start_time = performance.now();
        this.count_down = document.getElementById("countdowndisplay") as HTMLDivElement;
        this.animation_id = 0;
        this.end_message = document.getElementById('endMessage');

        this.config =
        {
            canvas_width: 800,
            canvas_height: 600,
            paddle_width: 10,
            paddle_height: 100,
            ball_real_speed: 8 * (3/2),
            ball_speed: 4.5 * (3/2),
            ball_max_speed: 12 * (3/2),
            paddle_speed: 7.5 * (3/2),
            score_to_win: 1,
            increase_vitesse: 175, //250,
            time_before_new_ball: 3000
        }

        this.state =
        {
            left_score: 0,
            right_score: 0,
            is_paused: false,
            game_running: true,
            count_down_active: false,
            restart_active: false
        }

        this.ball =
        {
            ball_x: this.config.canvas_width / 2,
            ball_y: this.config.canvas_height / 2,
            prev_x: 0,
            prev_y: 0,
            ball_dir_x: 0,
            ball_dir_y: 0,
            angle: 0,
            current_rebond: 0
        }

        this.paddle =
        {
            left_paddle_y:  (this.config.canvas_height - this.config.paddle_height) / 2,
            right_paddle_y:  (this.config.canvas_height - this.config.paddle_height) / 2,
            marge: 5,
            current_shot: 0
        }

        this.data = 
        {
            ia_mode: false,
            winner: false,
            score: 0,
            score_adv: 0,
            point_marque_moitie_up: 0,
            point_marque_moitie_down: 0,
            point_perdu_moitie_up: 0,
            point_perdu_moitie_down: 0,
        }

        this.setup_event();
        this.init_ball_direction();
    }

    public get gameState() { return this.state; }
    public get gameConfig() { return this.config; }

    setup_event(): void
    {
        document.addEventListener("keydown", this.handle_keydown);
        document.addEventListener("keyup", this.handle_keyup);
    }

    handle_keydown = (e: KeyboardEvent) =>
    {
        if (e.code === "Space")
            this.state.is_paused = !this.state.is_paused;
        else if (e.key === "b")
            console.log("Ball_dir_x = ", this.ball.ball_dir_x, ", Ball_dir_y = ", this.ball.ball_dir_y)
        else
            this.keys_pressed[e.key] = true;
    };

    handle_keyup = (e: KeyboardEvent) =>
    {
        this.keys_pressed[e.key] = false;
    };

    start(): void
    {
        this.draw(1);
        //console.log("ca demarre");
        let countdown = 3;
        this.count_down.innerText = `Debut de partie dans`;
        setTimeout(() => 
        {
            this.state.count_down_active = true;

            if (!this.count_down)
            {
                //console.error("Element countdown non trouve");
                return;
            }

            this.count_down.innerText = `${countdown}`;

            let count_down_interval = setInterval(() =>
            {
                countdown--;

                if (countdown > 0)
                    this.count_down.innerText = `${countdown}`;
                else
                {
                    clearInterval(count_down_interval);
                    this.count_down.innerText = "";
                    this.state.count_down_active = false;
                    this.start_time = performance.now();
                    this.last_frame_time = performance.now();
                    this.game_loop();
                }
            }, 1000);
        }, 1000);
    }


    game_loop(): void
    {
        const current_time = performance.now()

        // protection spirale de la mort
        const raw_delta_time = current_time - this.last_frame_time;
        let delta_time;
        if (raw_delta_time > 1000)
        {
            console.log("Très long délai détecté, réinitialisation du timing");
            delta_time = this.fixed_timestep; // Traiter comme un frame normal
        }
        else
            delta_time = Math.min(raw_delta_time, 250); // Protection normale

        if (raw_delta_time > 250)
            console.warn(`Spirale de la mort évitée ! Temps réel: ${raw_delta_time.toFixed(2)}ms, temps traité: ${delta_time}ms`);
        

        this.last_frame_time = current_time;
        this.accumulator += delta_time;

        while(this.accumulator >= this.fixed_timestep)
        {
            if (!this.state.is_paused)
            {
                this.update_paddle();
                this.update_ball();
                //this.draw();
            }
            this.accumulator -= this.fixed_timestep;
            //frame_fois++;
        }
        //console.log(`fois frame = ${frame_fois}`)

        const interpolation = this.accumulator / this.fixed_timestep;

        if (!this.state.is_paused)
            this.draw(interpolation);


        if (this.state.game_running == true)
            this.animation_id = requestAnimationFrame(() => this.game_loop());
    }

    end_game(): void
    {
        let message = '';
        this.handle_data();
        setTimeout(() =>
        {
            if (this.state.left_score == this.config.score_to_win)
            {
                if (this.final == 0)
                    message = `🏆 ${this.player_a} gagne la partie !`;
                else
                    message = `🏆 ${this.player_a} gagne le tournoi !`;
                this.vainqueur = 1;
            }
            else
            {
                if (this.final == 0)
                    message = `🏆 ${this.player_b} gagne la partie !`;
                else
                    message = `🏆 ${this.player_b} gagne le tournoi !`;
                this.vainqueur = 2;
            }

            if (this.end_message)
            {
                this.end_message.textContent = message;
                this.end_message.style.display = 'block';
            }
        }, 1000);
        this.state.game_running = false;
    }   

    is_it_finish(): number
    {
        return this.vainqueur;
    }

    handle_data()
    {
        this.data.ia_mode = false;
        this.data.score = this.state.left_score;
        this.data.score_adv = this.state.right_score;
        if (this.data.score > this.data.score_adv)
            this.data.winner = true;

        //APPEL DE L'API et lui envoyer l'interface data !
        // if joueur est connecte !
    }


    cleanup(): void
    {
        console.log("🧹 Nettoyage des ressources du jeu...");
        
        // Nettoyer tous les timers et animations
        this.clear_all_timers();
        
        // Arrêter le jeu
        this.state.game_running = false;
        this.state.is_paused = true;
        this.state.count_down_active = false;
        
        // Réinitialiser les positions des éléments de jeu
        this.ball.ball_x = this.config.canvas_width / 2;
        this.ball.ball_y = this.config.canvas_height / 2;
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        
        this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
        this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
        
        // Réinitialiser les scores
        this.update_score(0);
        
        // Nettoyer l'affichage
        if (this.count_down) {
            this.count_down.innerText = "";
        }
        
        if (this.end_message) {
            this.end_message.style.display = 'none';
            this.end_message.textContent = '';
        }
        
        // Nettoyer le canvas
        this.ctx.clearRect(0, 0, this.config.canvas_width, this.config.canvas_height);
        
        console.log("✅ Nettoyage terminé");
    }

    back_to_menu(): void
    {
        console.log("🏠 Retour au menu principal...");
        
        // D'abord nettoyer les ressources
        this.cleanup();
        
        // Réinitialiser les paramètres spécifiques au menu
        this.state.restart_active = false;
        
        // Réinitialiser les données de jeu
        this.data.ia_mode = false;
        this.data.winner = false;
        this.data.score = 0;
        this.data.score_adv = 0;
        this.data.point_marque_moitie_up = 0;
        this.data.point_marque_moitie_down = 0;
        this.data.point_perdu_moitie_up = 0;
        this.data.point_perdu_moitie_down = 0;
        
        // Réinitialiser les vitesses par défaut
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 7.5 * (3/2);
        
        console.log("✅ Retour au menu préparé");
    }

    destroy(): void
    {
        console.log("💥 Destruction de l'instance de jeu...");
        
        // D'abord effectuer le nettoyage standard
        this.cleanup();
        
        // Supprimer tous les event listeners pour éviter les fuites mémoire
        document.removeEventListener("keydown", this.handle_keydown);
        document.removeEventListener("keyup", this.handle_keyup);
        
        // Nettoyer le canvas une dernière fois
        this.ctx.clearRect(0, 0, this.config.canvas_width, this.config.canvas_height);
        
        // Réinitialiser les références aux éléments DOM
        this.count_down = null as any;
        this.end_message = null;
        
        // Vider l'objet keys_pressed
        this.keys_pressed = {};
        
        // Marquer l'instance comme détruite (utile pour le debugging)
        this.state.game_running = false;
        
        console.log("✅ Instance détruite");
    }

    restart(): void
    {
        console.log("🔄 RESTART demandé");
        
        this.clear_all_timers();
        
        this.state.restart_active = true;
        if (this.end_message)
            this.end_message.style.display = 'none';
        this.state.is_paused = true;
        this.state.count_down_active = false;
        this.state.game_running = true; // Important : garder le jeu actif
        this.last_frame_time = performance.now();
        
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        
        this.update_score(0);
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 8.5 * (3/2);
        
        this.count_down.innerText = "Nouvelle partie...";
        
        this.restart_timeout = setTimeout(() =>
        {
            console.log("🚀 Nouvelle partie");
            
            // Repositionner tous les éléments
            this.last_frame_time = performance.now();
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.draw(1);
            this.start_count_down_for_restart();
            this.state.restart_active = false;

        }, 1500);
    }

    // Fonction améliorée pour nettoyer TOUS les timers
    clear_all_timers(): void
    {        
        if (this.countdown_interval)
        {
            clearInterval(this.countdown_interval);
            this.countdown_interval = null;
            //console.log("✅ Countdown interval nettoyé");
        }
        
        if (this.restart_timeout)
        {
            clearTimeout(this.restart_timeout);
            this.restart_timeout = null;
            //console.log("✅ Restart timeout nettoyé");
        }
        
        if (this.goal_timeout)
        {
            clearTimeout(this.goal_timeout);
            this.goal_timeout = null;
            //console.log("✅ Goal timeout nettoyé");
        }
        
        if (this.start_timeout)
        {
            clearTimeout(this.start_timeout);
            this.start_timeout = null;
            //console.log("✅ Start timeout nettoyé");
        }
        
        // Annule aussi l'animation frame si nécessaire
        if (this.animation_id)
        {
            cancelAnimationFrame(this.animation_id);
            this.animation_id = 0;
            //console.log("✅ Animation frame annulée");
        }
    }

    start_count_down_for_restart(): void
    {
        let countdown = 3;
        this.count_down.innerText = `Reprise dans : ${countdown}`;
        this.state.count_down_active = true;
        
        this.countdown_interval = setInterval(() => {
            countdown--;
            
            // Vérifier si le restart est toujours valide
            if (this.state.restart_active)
            {
                //console.log("⚠️ Restart annulé pendant le countdown");
                return;
            }
            
            if (countdown > 0)
            {
                this.count_down.innerText = `Reprise dans : ${countdown}`;
                //console.log(`⏰ Countdown : ${countdown}`);
            }
            else
            {
                //console.log("🎮 Fin du countdown, reprise du jeu");
                
                clearInterval(this.countdown_interval!);
                this.countdown_interval = null;
                this.count_down.innerText = "";
                this.state.count_down_active = false;
                
                this.init_ball_direction();
                this.start_time = performance.now();
                this.state.is_paused = false;
                
                if (this.state.game_running)
                {
                    this.last_frame_time = performance.now();
                    this.game_loop();
                }
            }
        }, 1000);
    }

    update_paddle(): void
    {
        if (this.state.count_down_active)
            return ;
        if (this.keys_pressed["w"] && this.paddle.left_paddle_y > 0)
            this.paddle.left_paddle_y -= this.config.paddle_speed;
        if (this.keys_pressed["s"] && this.paddle.left_paddle_y < this.config.canvas_height - this.config.paddle_height - 0)
            this.paddle.left_paddle_y += this.config.paddle_speed;

        if (this.keys_pressed["ArrowUp"] && this.paddle.right_paddle_y > 0)
            this.paddle.right_paddle_y -= this.config.paddle_speed;
        if (this.keys_pressed["ArrowDown"] && this.paddle.right_paddle_y < this.config.canvas_height - this.config.paddle_height - 0)
            this.paddle.right_paddle_y += this.config.paddle_speed;
    }

    // Fonction utilitaire pour la détection continue de collision
    // Cette fonction vérifie si un segment de droite (trajectoire de la balle) 
    // intersecte avec un rectangle (paddle)
    private checkLineRectCollision(
        lineStart: { x: number; y: number },
        lineEnd: { x: number; y: number },
        rect: { x: number; y: number; width: number; height: number }
    ): { collision: boolean; intersectionPoint?: { x: number; y: number } } {
        
        // Vérifier d'abord si le point de fin est déjà dans le rectangle
        // (cas où la balle est déjà en collision)
        if (lineEnd.x >= rect.x && lineEnd.x <= rect.x + rect.width &&
            lineEnd.y >= rect.y && lineEnd.y <= rect.y + rect.height) {
            return { collision: true, intersectionPoint: lineEnd };
        }
        
        // Calculer les 4 côtés du rectangle
        const rectLines = [
            // Côté gauche
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x, y: rect.y + rect.height } },
            // Côté droit  
            { start: { x: rect.x + rect.width, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y + rect.height } },
            // Côté haut
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y } },
            // Côté bas
            { start: { x: rect.x, y: rect.y + rect.height }, end: { x: rect.x + rect.width, y: rect.y + rect.height } }
        ];
        
        // Vérifier l'intersection avec chaque côté du rectangle
        for (const rectLine of rectLines) {
            const intersection = this.getLineIntersection(lineStart, lineEnd, rectLine.start, rectLine.end);
            if (intersection) {
                return { collision: true, intersectionPoint: intersection };
            }
        }
        
        return { collision: false };
    }

    // Fonction pour calculer l'intersection entre deux segments de droite
    private getLineIntersection(
        p1: { x: number; y: number }, p2: { x: number; y: number },
        p3: { x: number; y: number }, p4: { x: number; y: number }
    ): { x: number; y: number } | null {
        
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;
        
        // Calculer les dénominateurs pour éviter la division par zéro
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return null; // Lignes parallèles
        
        // Calculer les paramètres t et u
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        // Vérifier si l'intersection est dans les deux segments
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }
        
        return null;
    }

    update_ball(): void
    {
        if (this.state.is_paused || this.state.count_down_active)
            return;

        // garder en memoire les positions differentes pour l'interpolation
        this.ball.prev_x = this.ball.ball_x;
        this.ball.prev_y = this.ball.ball_y;

        // Sauvegarder la position précédente pour la détection continue
        const previousX = this.ball.ball_x;
        const previousY = this.ball.ball_y;

        // Calculer la nouvelle position
        const newX = this.ball.ball_x + this.ball.ball_dir_x;
        const newY = this.ball.ball_y + this.ball.ball_dir_y;

        if (performance.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < this.config.ball_max_speed)
        {
            this.config.ball_speed += 0.1;
            this.config.paddle_speed += 0.05;
            this.start_time = performance.now();
        }

        // Vérifier les collisions avec les paddles AVANT de mettre à jour la position
        // Cela évite que la balle traverse les paddles même à haute vitesse
        
        // Collision avec le paddle gauche
        if (this.ball.ball_dir_x < 0)
        { 
            const leftPaddleRect =
            {
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
            
            if (leftCollision.collision)
            {
                console.log(`🏓 Rebond raquette gauche détecté par collision continue`);
                
                // Positionner la balle au point d'intersection pour éviter qu'elle reste dans le paddle
                if (leftCollision.intersectionPoint)
                {
                    this.ball.ball_x = leftCollision.intersectionPoint.x;
                    this.ball.ball_y = leftCollision.intersectionPoint.y;
                }
                
                // Appliquer la logique de rebond
                if (this.config.ball_speed < this.config.ball_real_speed)
                {
                    this.config.ball_speed = this.config.ball_real_speed;
                }
                this.update_ball_dir(0);
                this.normalize_ball_speed();
                
                return; // Sortir de la fonction pour éviter d'autres collisions cette frame
            }
        }

        // Collision avec le paddle droit
        if (this.ball.ball_dir_x > 0) 
        {
            const rightPaddleRect =
            {
                x: this.config.canvas_width - 40,
                y: this.paddle.right_paddle_y - this.paddle.marge,
                width: 15, // De canvas_width-40 à canvas_width-25
                height: this.config.paddle_height + (this.paddle.marge * 2)
            };
            
            const rightCollision = this.checkLineRectCollision(
                { x: previousX, y: previousY },
                { x: newX, y: newY },
                rightPaddleRect
            );
            
            if (rightCollision.collision)
            {
                console.log(`🏓 Rebond raquette droite détecté par collision continue`);
                
                // Positionner la balle au point d'intersection
                if (rightCollision.intersectionPoint)
                {
                    this.ball.ball_x = rightCollision.intersectionPoint.x;
                    this.ball.ball_y = rightCollision.intersectionPoint.y;
                }
                
                // Appliquer la logique de rebond
                if (this.config.ball_speed < this.config.ball_real_speed)
                {
                    this.config.ball_speed = this.config.ball_real_speed;
                }
                this.update_ball_dir(1);
                this.normalize_ball_speed();
                
                return; // Sortir de la fonction pour éviter d'autres collisions cette frame
            }
        }

        // Si aucune collision avec les paddles, mettre à jour la position normalement
        this.ball.ball_x = newX;
        this.ball.ball_y = newY;

        // Vérifier les buts (logique inchangée)
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width)
        {
            this.state.is_paused = true;
            console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed} et rebond = ${this.ball.current_rebond}`);
            this.handle_goal();
            return;
        }

        // Rebonds sur les murs haut et bas (logique inchangée)
        if (this.ball.ball_y <= 5 || this.ball.ball_y >= this.config.canvas_height - 5)
        {
            console.log(`AVANT rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);

            if (this.ball.ball_x <= 70 )
            {
                if (this.ball.ball_y <= 5)
                    this.ball.ball_y = 6;
                else
                    this.ball.ball_y = this.config.canvas_height - 6;
                console.log("ca passe ici zeubi")
            }
            if (this.ball.ball_x >= this.config.canvas_width - 70)
            {
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

    handle_goal(): void
    {
        // mettre a jour data
        if (this.ball.ball_x < 0)
        {
            if (this.ball.ball_y <= this.config.canvas_height)
                this.data.point_perdu_moitie_up++;
            else
                this.data.point_perdu_moitie_down++;
        }
        else
        {
            if (this.ball.ball_y <= this.config.canvas_height)
                this.data.point_marque_moitie_up++;
            else
                this.data.point_marque_moitie_down++;
        }


        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.update_score(1);
        if (this.state.left_score == this.config.score_to_win || this.state.right_score == this.config.score_to_win)
        {
            this.end_game();
            return ;
        }
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 8.5 * (3/2);

        this.goal_timeout = setTimeout(() =>
        {
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.draw(1);
            this.start_count_down();
        }, 1500);

        return;
    }

    update_ball_dir(side: number): void
    {
        let paddle_y = side === 0 ? this.paddle.left_paddle_y : this.paddle.right_paddle_y;
        let relative_impact = (this.ball.ball_y - paddle_y) / this.config.paddle_height;
        let max_bounce_angle = Math.PI / 4;

        // Convertit l'impact en angle [-max, +max]
        let bounce_angle = (relative_impact - 0.5) * 2 * max_bounce_angle;

        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(bounce_angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(bounce_angle);

        if (side === 1) this.ball.ball_dir_x = -this.ball.ball_dir_x;
    }

    update_score(flag: number): void
    {
        const score_P1 = document.getElementById('scoreP1');
        const score_P2 = document.getElementById('scoreP2');

        if (this.ball.ball_x < 45)
            this.state.right_score++;
        else
            this.state.left_score++;

        if (flag == 0)
        {
            this.state.right_score = 0;
            this.state.left_score = 0;
        }

        if (score_P1)
            score_P1.textContent = `${this.player_a} : ${this.state.left_score}`;
        if (score_P2)
            score_P2.textContent = `${this.player_b} : ${this.state.right_score}`;
    }

    // Fonction start_count_down corrigée (après un but)
    start_count_down(): void
    {        
        let countdown = 3;
        
        // Vérifier qu'on n'est pas en train de redémarrer
        if (this.state.restart_active)
        {
            //console.log("⚠️ Countdown annulé car restart actif");
            return;
        }
        
        this.goal_timeout = setTimeout(() =>
        {
            // Double vérification
            if (this.state.restart_active)
            {
                //console.log("⚠️ Timeout de but annulé car restart actif");
                return;
            }
            
            this.state.count_down_active = true;
            this.count_down.innerText = `Reprise dans : ${countdown}`;
            
            // Utiliser this.countdown_interval
            this.countdown_interval = setInterval(() => {
                countdown--;
                
                if (this.state.restart_active)
                {
                    //console.log("⚠️ Countdown de but interrompu par restart");
                    return;
                }
                
                if (countdown > 0)
                {
                    this.count_down.innerText = `Reprise dans : ${countdown}`;
                } else
                {
                    clearInterval(this.countdown_interval!);
                    this.countdown_interval = null;
                    this.count_down.innerText = "";
                    this.state.count_down_active = false;
                    this.init_ball_direction();
                    this.start_time = performance.now();
                    this.state.is_paused = false;
                }
            }, 1000);
        }, 1000);
    }

    init_ball_direction(): void
    {
        this.ball.angle = get_random_playable_angle();
        //this.ball.angle = 0;
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);
    }

    normalize_ball_speed(): void
    {
        const current_speed = Math.sqrt(this.ball.ball_dir_x * this.ball.ball_dir_x + this.ball.ball_dir_y * this.ball.ball_dir_y);
        
        if (current_speed !== 0)
        {
            this.ball.ball_dir_x = (this.ball.ball_dir_x / current_speed) * this.config.ball_speed;
            this.ball.ball_dir_y = (this.ball.ball_dir_y / current_speed) * this.config.ball_speed;
        }
    }

    draw(interpolation: number): void
    {
        if (!this.ctx)
            return;

        // calcul des coordonnees interpoles
        const interpolated_x = this.ball.prev_x + (this.ball.ball_x - this.ball.prev_x) * interpolation;
        const interpolated_y = this.ball.prev_y + (this.ball.ball_y - this.ball.prev_y) * interpolation;

        // === 1. FOND NOIR AVEC DÉGRADÉ ===
        let bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.config.canvas_height);
        bgGradient.addColorStop(0, "#0f0f0f");
        bgGradient.addColorStop(1, "#1a1a1a");
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.config.canvas_width, this.config.canvas_height);

        // === 4. LIGNES DU MILIEU EN POINTILLÉS (optionnel mais rétro) ===
        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([10, 15]);
        this.ctx.strokeStyle = "#444";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.canvas_width / 2, 0);
        this.ctx.lineTo(this.config.canvas_width / 2, this.config.canvas_height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // === 2. RAQUETTES STYLE NÉON ===
        // Effet glow : couleur + ombre
        this.ctx.shadowColor = "#00ffff";
        this.ctx.shadowBlur = 20;

        let paddleGradientLeft = this.ctx.createLinearGradient(0, this.paddle.left_paddle_y, 0, this.paddle.left_paddle_y + this.config.paddle_height);
        paddleGradientLeft.addColorStop(0, "#00ffff");
        paddleGradientLeft.addColorStop(1, "#005f5f");
        this.ctx.fillStyle = paddleGradientLeft;
        this.ctx.fillRect(30, this.paddle.left_paddle_y, this.config.paddle_width, this.config.paddle_height);

        this.ctx.shadowColor = "#ff00ff";
        this.ctx.shadowBlur = 20;

        let paddleGradientRight = this.ctx.createLinearGradient(0, this.paddle.right_paddle_y, 0, this.paddle.right_paddle_y + this.config.paddle_height);
        paddleGradientRight.addColorStop(0, "#ff00ff");
        paddleGradientRight.addColorStop(1, "#5f005f");
        this.ctx.fillStyle = paddleGradientRight;
        this.ctx.fillRect(this.config.canvas_width - 30 - this.config.paddle_width, this.paddle.right_paddle_y, this.config.paddle_width, this.config.paddle_height);

        // === 3. BALLE PULSANTE ET CLIGNOTANTE ===
        const pulse = 10 + Math.sin(Date.now() / 100) * 2;
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        this.ctx.shadowColor = blink ? "#ffff00" : "#ff00ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = blink ? "#ffff00" : "#ff00ff";
        this.ctx.beginPath();
        //this.ctx.arc(this.ball.ball_x, this.ball.ball_y, pulse, 0, Math.PI * 2);
        this.ctx.arc(interpolated_x, interpolated_y, pulse, 0, Math.PI * 2);
        this.ctx.fill();

        // === 5. HUD (score, vitesse) AVEC POLICE PIXEL ===
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "#00ffcc";
        this.ctx.font = "bold 18px 'Courier New', monospace";
        const currentSpeed = calculate_ball_speed(this.ball);
        this.ctx.fillText(`🎯 Vitesse: ${currentSpeed.toFixed(2)}`, 20, 30);

        this.ctx.fillStyle = "#ff66cc";
        this.ctx.font = "14px 'Courier New', monospace";
        this.ctx.fillText(`⏱️ Temps: ${get_time(this.start_time).toFixed(0)} ms`, 20, 55);
    }
}

class GamePong
{
    static create_game(canvas : HTMLCanvasElement, player_a: string, player_b: string, final: number): Pong
    {
        return new Pong(canvas, player_a, player_b, final);
    }
}


export class Game_tournoi
{
    private current_game: Pong | null = null;
    private player_a: string;
    private player_b: string;
    //private restart_btn: HTMLButtonElement;
    private canvas: HTMLCanvasElement; 
    //private back_to_menu_btn: HTMLButtonElement;


    constructor(player_a: string, player_b: string, final: number)
    {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        this.player_a = player_a;
        this.player_b = player_b;
        //this.restart_btn = document.getElementById("restartBtn") as HTMLButtonElement;
        //this.restart_btn.addEventListener('click', () => this.restart());
        this.current_game = GamePong.create_game(this.canvas, player_a, player_b, final);
        //this.back_to_menu_btn = document.getElementById("#backToMenuBtn") as HTMLButtonElement;
        //this.back_to_menu_btn.addEventListener('click', () => this.back_to_menu());
    }

    getPlayer1Name(): string {
        return this.player_a; // ou votre propriété équivalente
    }

    getPlayer2Name(): string {
        return this.player_b; // ou votre propriété équivalente
    }

    start_game_loop(): void
    {
        if (this.current_game)
        {
            this.current_game.start();
        }
    }

    check_end_game(): number | undefined
    {
        if (this.current_game)
        {
            return this.current_game.is_it_finish();
        }
    }

    restart()
    {
        if (this.current_game)
        {
            this.current_game.restart();
        }
    }

    cleanup()
    {
        if (this.current_game)
        {
            this.current_game.cleanup();
        }
    }    
    
    back_to_menu()
    {
        if (this.current_game)
        {
            this.current_game.back_to_menu();
        }
    }    
    
    destroy()
    {
        if (this.current_game)
        {
            this.current_game.destroy();
        }
    }
}

// export class Game_tournoi
// {
//     private current_game: Pong | null = null;
//     private canvas: HTMLCanvasElement; 
//     private onGameEnd?: (leftPlayerName: string, rightPlayerName: string, winner: 'left' | 'right') => void;
// 	private tournoiState = {
// 		isActive: false,
// 		currentMatch: 1, // 1 pour demi-finale 1, 2 pour demi-finale 2, 3 pour finale
// 		players: [] as string[],
// 		winners: [] as string[],
// 		currentPlayers: [] as string[]
// 	};

//     constructor(onGameEnd?: (leftPlayerName: string, rightPlayerName: string, winner: 'left' | 'right') => void)
//     {
//         this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
//         this.current_game = GamePong.create_game(this.canvas);
//         this.onGameEnd = onGameEnd;
        
//         // Surveiller la fin du jeu
//         this.setupGameEndListener();
//     }

//     private setupGameEndListener(): void
//     {
//         // Vous devrez modifier légèrement votre classe Pong pour exposer cette information
//         // ou utiliser un observer pattern. Voici une approche simple :
//         let currentState = this.current_game?.gameState;
//         let currentConfig = this.current_game?.gameConfig;
//         const checkGameEnd = () => {
//             if (currentState && currentConfig)
//             { 
//             if (this.current_game && !currentState.game_running && 
//                 (currentState.left_score >= currentConfig.score_to_win || 
//                  currentState.right_score >= currentConfig.score_to_win))
//                 {
                
//                 const winner = currentState.left_score >= currentConfig.score_to_win ? 'left' : 'right';
                
//                 if (this.onGameEnd) {
//                     this.onGameEnd(this.tournoiState.currentPlayers[0], this.tournoiState.currentPlayers[1], winner);
//                 }
//                 }
//             }
//         };

//         // Vérifier périodiquement (ou utilisez un event listener plus sophistiqué)
//         setInterval(checkGameEnd, 1000);
//     }

//     start_game_loop(): void
//     {
//         if (this.current_game)
//         {
//             this.current_game.start();
//         }
//     }

//     restart()
//     {
//         if (this.current_game)
//         {
//             this.current_game.restart();
//         }
//     }

//     cleanup()
//     {
//         if (this.current_game)
//         {
//             this.current_game.cleanup();
//         }
//     }    
    
//     back_to_menu()
//     {
//         if (this.current_game)
//         {
//             this.current_game.back_to_menu();
//         }
//     }    
    
//     destroy()
//     {
//         if (this.current_game)
//         {
//             this.current_game.destroy();
//         }
//     }
// }

