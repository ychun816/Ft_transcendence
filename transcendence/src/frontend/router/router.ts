export class Router {
  private routes: Map<string, () => HTMLElement> = new Map();
  private currentPath: string = '';
  
  constructor() {
    window.addEventListener('popstate', () => this.handleRoute());
  }
  
  addRoute(path: string, component: () => HTMLElement) {
    this.routes.set(path, component);
    return this;
  }
  
  navigate(path: string) {
    if (this.currentPath !== path) {
      this.currentPath = path;
      window.history.pushState({}, '', path);
      this.handleRoute();
    }
  }
  
  private handleRoute() {
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
    this.handleRoute();
  }
}

export const router = new Router();
