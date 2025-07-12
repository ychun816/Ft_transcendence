import { authService } from '../middleware/auth.js';

class Router {
    private routes: Map<string, () => HTMLElement> = new Map();
    private dynamicRoutes: Array<{pattern: string, handler: () => HTMLElement}> = [];
    private protectedRoutes: Set<string> = new Set();
    private currentRoute: string = '/';

    constructor() {
        //this.setupRoutes();
        this.setupProtectedRoutes();
        this.handlePopState();
    }

    private setupProtectedRoutes() {
        // Définir les routes qui nécessitent une authentification
        this.protectedRoutes.add('/home');
        this.protectedRoutes.add('/profile');
        this.protectedRoutes.add('/game');
        this.protectedRoutes.add('/chat');
        this.protectedRoutes.add('/leaderboard');
    }

    private isProtectedRoute(route: string): boolean {
        // Check exact matches
        if (this.protectedRoutes.has(route)) {
            return true;
        }
        
        // Check pattern matches for dynamic routes like /profile/:username
        if (route.startsWith('/profile/') && route.length > '/profile/'.length) {
            return true;
        }
        
        return false;
    }
    
    addRoute(path: string, component: () => HTMLElement) {
      /*
      This function is called when the user adds a new route to the router.
      It adds the route to the routes map.
      */
      this.routes.set(path, component);
      return this;
    }

    addDynamicRoute(pattern: string, handler: () => HTMLElement) {
        this.dynamicRoutes.push({ pattern, handler });
        return this;
    }
    
    private handleRoute() {
      /*
      This function is called when the user navigates to a new page.
      It finds the component for the current path and renders it in the app.
      If the path is not found, it renders the 404 page.
      */
      const path = window.location.pathname;
      const component = this.routes.get(path) || this.routes.get('/404');
    
      if (component) {
        const app = document.querySelector('#app');
        if (app) {
          app.innerHTML = '';
          app.appendChild(component());
        }
      }
    }
    
    start() {
      /*
      This function is called when the app starts.
      It handles the initial route.
      */
      this.handleRoute();
    }

//   navigate(path: string) {
//     /*
//     This function is called when the user navigates to a new page.
//     It updates the current path and navigates to the new page.
//     */
//     if (this.currentPath !== path) {
//       this.currentPath = path;
//       window.history.pushState({}, '', path);
//       this.handleRoute();
//     }
//   }

    async navigate(route: string): Promise<void> {
        // Vérifier l'authentification pour les routes protégées
        if (this.isProtectedRoute(route)) {
            const user = await authService.getCurrentUser();
            if (!user) {
                this.navigate('/login');
                return;
            }
        }

        // Permettre l'accès à login/signup même si connecté (pour permettre logout et nouveau compte)
        // Commenté pour permettre à un utilisateur connecté d'accéder à signup/login
        /*
        if (route === '/login' || route === '/signup') {
            const user = await authService.getCurrentUser();
            if (user) {
                this.navigate('/home');
                return;
            }
        }
        */

        this.currentRoute = route;
        this.renderRoute(route);
        history.pushState({}, '', route);
    }

    private async renderRoute(route: string): Promise<void> {
        // Check exact routes first
        let routeHandler = this.routes.get(route);
        
        // If no exact match, check dynamic routes
        if (!routeHandler) {
            for (const dynamicRoute of this.dynamicRoutes) {
                if (this.matchesPattern(route, dynamicRoute.pattern)) {
                    routeHandler = dynamicRoute.handler;
                    break;
                }
            }
        }
        
        if (!routeHandler) {
            this.navigate('/404');
            return;
        }

        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '';
            app.appendChild(routeHandler());
        }
    }

    private matchesPattern(route: string, pattern: string): boolean {
        // Convert pattern like "/profile/:username" to regex
        const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(route);
    }

    private handlePopState(): void {
        window.addEventListener('popstate', async () => {
            await this.navigate(window.location.pathname);
        });
    }

    // Méthode pour vérifier périodiquement l'état d'authentification
    startAuthCheck(): void {
        setInterval(async () => {
            if (this.isProtectedRoute(this.currentRoute)) {
                const user = await authService.getCurrentUser();
                if (!user) {
                    this.navigate('/login');
                }
            }
        }, 60000); // Vérifier toutes les minutes
    }
}

export const router = new Router();
