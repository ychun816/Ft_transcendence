import "./style.css";
import { router } from "./router/router";
import { createLoginPage } from "./pages/LoginPage";
import { createHomePage } from "./pages/HomePage";
import { createGamePage } from "./pages/GamePage";
import { createProfilePage } from "./pages/ProfilePage";
import { createChatPage } from "./pages/ChatPage";
import { createNotFoundPage } from "./pages/NotFoundPage";
import { createSignUpPage } from "./pages/SignUpPage";
import { createUserProfilePage } from "./pages/UserProfilePage";

// Plus besoin de startAuthCheck - chaque page gère sa propre auth

router
    .addRoute('/', createLoginPage)
    .addRoute('/login', createLoginPage)
	.addRoute('/signup', createSignUpPage)
    .addRoute('/home', createHomePage)
    .addRoute('/game', createGamePage)
    .addRoute('/profile', createProfilePage)
    .addRoute('/chat', createChatPage)
    .addRoute('/404', createNotFoundPage);

// Route dynamique pour les profils utilisateur
router.addDynamicRoute('/profile/:username', createUserProfilePage);

router.start();