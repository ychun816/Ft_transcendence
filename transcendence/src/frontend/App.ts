import "./style.css";
import { router } from "./router/router.ts";
import { createLoginPage } from "./pages/LoginPage.ts";
import { createHomePage } from "./pages/HomePage.ts";
import { createGamePage } from "./pages/GamePage.ts";
import { createProfilePage } from "./pages/ProfilePage.ts";
import { createChatPage } from "./pages/ChatPage.ts";
import { createNotFoundPage } from "./pages/NotFoundPage.ts";

// Configuration des routes
router
  .addRoute('/', createLoginPage)
  .addRoute('/login', createLoginPage)
  .addRoute('/home', createHomePage)
  .addRoute('/game', createGamePage)
  .addRoute('/profile', createProfilePage)
  .addRoute('/chat', createChatPage)
  .addRoute('/404', createNotFoundPage);

// Démarrage de l'application
router.start();