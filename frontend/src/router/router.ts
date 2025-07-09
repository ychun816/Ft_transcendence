import { authService } from '../middleware/auth.js';

class Router {
    private routes: Map<string, () => HTMLElement> = new Map();
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
    
    addRoute(path: string, component: () => HTMLElement) {
      /*
      This function is called when the user adds a new route to the router.
      It adds the route to the routes map.
      */
      this.routes.set(path, component);
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
        if (this.protectedRoutes.has(route)) {
            const user = await authService.getCurrentUser();
            if (!user) {
                this.navigate('/login');
                return;
            }
        }

        // Rediriger vers /home si déjà authentifié et tentative d'accès à login/signup
        if (route === '/login' || route === '/signup') {
            const user = await authService.getCurrentUser();
            if (user) {
                this.navigate('/home');
                return;
            }
        }

        this.currentRoute = route;
        this.renderRoute(route);
        history.pushState({}, '', route);
    }

    private async renderRoute(route: string): Promise<void> {
        const routeHandler = this.routes.get(route);
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

    private handlePopState(): void {
        window.addEventListener('popstate', async () => {
            await this.navigate(window.location.pathname);
        });
    }

    // Méthode pour vérifier périodiquement l'état d'authentification
    startAuthCheck(): void {
        setInterval(async () => {
            if (this.protectedRoutes.has(this.currentRoute)) {
                const user = await authService.getCurrentUser();
                if (!user) {
                    this.navigate('/login');
                }
            }
        }, 60000); // Vérifier toutes les minutes
    }
}

export const router = new Router();
