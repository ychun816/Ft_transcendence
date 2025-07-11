export class AuthService {
    private currentUser: any = null;
    private authCheckPromise: Promise<any> | null = null;

    async getCurrentUser(): Promise<any> {
        if (this.authCheckPromise) {
            return this.authCheckPromise;
        }

        this.authCheckPromise = this.checkAuthStatus();
        return this.authCheckPromise;
    }

    private async checkAuthStatus(): Promise<any> {
        try {
            const response = await fetch('/api/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUserInfo(this.currentUser);
                return this.currentUser;
            } else {
                this.clearUserInfo();
                return null;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.clearUserInfo();
            return null;
        } finally {
            this.authCheckPromise = null;
        }
    }

    private updateUserInfo(user: any): void {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }

    private clearUserInfo(): void {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
    }

    async logout(): Promise<boolean> {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            this.clearUserInfo();
            
            if (response.ok) {
                // Rediriger vers la page de login après déconnexion
                import('../router/router.js').then(({ router }) => {
                    router.navigate('/login');
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    getUser() {
        if (!this.currentUser) {
            const stored = sessionStorage.getItem('currentUser');
            if (stored) {
                this.currentUser = JSON.parse(stored);
            }
        }
        return this.currentUser;
    }

    async canAccess(route: string): Promise<boolean> {
        const protectedRoutes = ['/home', '/profile', '/game', '/chat', '/leaderboard'];
        
        if (!protectedRoutes.includes(route)) {
            return true;
        }

        const user = await this.getCurrentUser();
        return user !== null;
    }
}

export const authService = new AuthService();