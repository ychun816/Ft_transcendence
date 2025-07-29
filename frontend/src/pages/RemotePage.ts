import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { Game_solo } from "../components/game/game_solo.js";
import { classes } from "../styles/retroStyles.js";

/**
 * ÉTAPE 2 : Introduction de la connexion WebSocket basique
 * 
 * Cette étape ajoute une vraie connexion WebSocket à notre interface existante.
 * Nous conservons les données fictives pour l'affichage, mais nous établissons
 * une connexion réseau réelle avec le serveur pour valider l'infrastructure.
 * 
 * Nouveautés de cette étape :
 * - Connexion WebSocket authentifiée avec votre token JWT
 * - Messages de statut de connexion visibles dans l'interface
 * - Gestion des erreurs de connexion et reconnexion automatique
 * - Préparation de la structure pour recevoir des données serveur
 * - Logging détaillé pour le debugging
 */
export function createRemotePage(): HTMLElement {
    const page = document.createElement("div");
    page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

    // Variables d'état pour cette étape
    let currentGame: Game_solo | null = null;
    let gameWebSocket: WebSocket | null = null;
    let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let realPlayersData: any[] = [];

    /**
     * Établir la connexion WebSocket avec authentification JWT
     * 
     * Cette fonction crée une connexion sécurisée vers votre serveur Fastify
     * en utilisant le token d'authentification stocké dans sessionStorage.
     * Elle suit le même pattern que votre système de chat existant.
     */
    const establishWebSocketConnection = () => {
        // Vérification de l'authentification avant la connexion
        const authToken = sessionStorage.getItem("authToken");
        const username = sessionStorage.getItem("username");
        
        if (!authToken || !username) {
            console.error("🎮 Impossible de se connecter : utilisateur non authentifié");
            updateConnectionStatus('error');
            showNotification("Vous devez être connecté pour jouer en ligne", 'error');
            return;
        }


        console.log("🎮 Tentative de connexion WebSocket pour:", username);
        updateConnectionStatus('connecting');

        // TEST TEMPORAIRE : Utilisation de WS au lieu de WSS pour contourner les problèmes SSL
        const protocol = 'ws:'; // Temporairement non-sécurisé pour le test
        const host = window.location.hostname;
        const port = '3002'; // Port HTTP temporaire que nous allons configurer
        const wsUrl = `${protocol}//${host}:${port}/ws/pong-matchmaking?token=${encodeURIComponent(authToken)}`;
        
        console.log("🎮 URL de connexion WebSocket de test:", wsUrl);


        // console.log("🎮 Tentative de connexion WebSocket pour:", username);
        // updateConnectionStatus('connecting');

        // // CORRECTION : Construction de l'URL avec le bon port et protocole
        // // Nous nous connectons explicitement au serveur Fastify HTTPS (port 3444)
        // // au lieu du serveur de développement frontend (port 5175)
        // const protocol = 'wss:'; // Toujours WSS car votre serveur Fastify utilise HTTPS
        // const host = window.location.hostname; // Récupère seulement le hostname (localhost)
        // const port = '3444'; // Port explicite de votre serveur Fastify HTTPS
        // const wsUrl = `${protocol}//${host}:${port}/ws/pong-matchmaking?token=${encodeURIComponent(authToken)}`;
        
        // console.log("🎮 URL de connexion WebSocket corrigée:", wsUrl);

        try {
            // Création de la connexion WebSocket vers le bon serveur
            gameWebSocket = new WebSocket(wsUrl);
            
            // Configuration des gestionnaires d'événements WebSocket
            gameWebSocket.onopen = handleWebSocketOpen;
            gameWebSocket.onmessage = handleWebSocketMessage;
            gameWebSocket.onclose = handleWebSocketClose;
            gameWebSocket.onerror = handleWebSocketError;
            
        } catch (error) {
            console.error("🎮 Erreur lors de la création de la connexion WebSocket:", error);
            updateConnectionStatus('error');
            showNotification("Erreur de connexion au serveur de jeu", 'error');
        }
    };

    /**
     * Gestionnaire d'ouverture de connexion WebSocket
     * 
     * Cette fonction est appelée quand la connexion WebSocket s'établit avec succès.
     * Elle confirme que l'authentification a fonctionné et que le serveur a accepté la connexion.
     */
    const handleWebSocketOpen = () => {
        console.log("🎮 Connexion WebSocket établie avec succès");
        updateConnectionStatus('connected');
        reconnectAttempts = 0; // Réinitialiser le compteur de reconnexion
        
        showNotification("Connecté au serveur de jeu !", 'success');
        
        // Envoyer un message de test pour vérifier la communication bidirectionnelle
        sendWebSocketMessage({
            type: 'connection_test',
            message: 'Connexion WebSocket fonctionnelle',
            timestamp: Date.now()
        });
    };

    const handleWebSocketMessage = (event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);
            console.log("🎮 Message reçu du serveur:", data);
            
            switch (data.type) {
                case 'connection_established':
                    console.log("🎮 Serveur confirme la connexion pour:", data.username);
                    showNotification(`Connexion confirmée pour ${data.username}`, 'success');
                    sendWebSocketMessage({ type: 'get_available_players' });
                    break;
                    
                case 'available_players_list':
                    console.log("🎮 Liste des joueurs reçue du serveur:", data.players);
                    realPlayersData = data.players;
                    renderPlayersList();
                    break;
                    
                case 'players_list_update':
                    console.log("🎮 Mise à jour de la liste des joueurs reçue");
                    sendWebSocketMessage({ type: 'get_available_players' });
                    break;
                    
                // NOUVEAU : Traiter une invitation reçue
                case 'game_invitation_received':
                    console.log("🎮 🎯 Invitation reçue de:", data.from_user);
                    showGameInvitationModal(data.from_user, data.room_id);
                    break;
                    
                // NOUVEAU : Confirmation d'envoi d'invitation
                case 'game_invitation_sent':
                    console.log("🎮 ✅ Invitation envoyée à:", data.to_user);
                    showNotification(`Invitation envoyée à ${data.to_user}`, 'success');
                    break;
                    
                // NOUVEAU : Invitation acceptée
                case 'game_invitation_accepted':
                    console.log("🎮 🎉 Invitation acceptée par:", data.opponent.username);
                    showNotification(`${data.opponent.username} a accepté votre invitation !`, 'success');
                    // Pour l'instant, juste montrer le message, la partie sera dans l'étape suivante
                    break;
                    
                // NOUVEAU : Invitation refusée
                case 'game_invitation_declined':
                    console.log("🎮 ❌ Invitation refusée par:", data.from_user);
                    showNotification(`${data.from_user} a refusé votre invitation`, 'warning');
                    break;
                    
                // NOUVEAU : Invitation expirée
                case 'game_invitation_expired':
                    console.log("🎮 ⏰ Invitation expirée pour:", data.to_user);
                    showNotification(`Invitation à ${data.to_user} expirée`, 'warning');
                    break;
                    
                case 'test_response':
                    console.log("🎮 Test response reçu:", data.message);
                    break;
                    
                case 'invitation_test_response':
                    console.log("🎮 Test invitation response:", data.message);
                    break;
                    
                case 'refresh_response':
                    console.log("🎮 Refresh response:", data.message);
                    break;
                    
                case 'error':
                    console.error("🎮 Erreur serveur:", data.message);
                    showNotification(`Erreur serveur: ${data.message}`, 'error');
                    break;
                    
                default:
                    console.log("🎮 Message non traité dans cette étape:", data.type);
            }
            
        } catch (error) {
            console.error("🎮 Erreur lors du parsing du message WebSocket:", error);
            showNotification("Erreur de communication avec le serveur", 'error');
        }
    };

    /**
     * Gestionnaire de fermeture de connexion WebSocket
     * 
     * Cette fonction gère les déconnexions et tente une reconnexion automatique
     * si la déconnexion n'était pas intentionnelle.
     */
    const handleWebSocketClose = (event: CloseEvent) => {
        console.log("🎮 Connexion WebSocket fermée:", event.code, event.reason);
        updateConnectionStatus('disconnected');
        
        // Analyser la raison de la fermeture pour déterminer si une reconnexion est appropriée
        if (event.code !== 1000 && event.code !== 1001) { // Codes de fermeture normale
            // Tentative de reconnexion automatique
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = Math.pow(2, reconnectAttempts) * 1000; // Délai exponentiel
                
                console.log(`🎮 Tentative de reconnexion ${reconnectAttempts}/${maxReconnectAttempts} dans ${delay}ms`);
                showNotification(`Reconnexion... (${reconnectAttempts}/${maxReconnectAttempts})`, 'warning');
                
                setTimeout(() => {
                    establishWebSocketConnection();
                }, delay);
            } else {
                console.error("🎮 Nombre maximum de tentatives de reconnexion atteint");
                showNotification("Impossible de se reconnecter au serveur", 'error');
            }
        } else {
            console.log("🎮 Déconnexion normale");
            showNotification("Déconnecté du serveur de jeu", 'info');
        }
    };

    /**
     * Gestionnaire d'erreur WebSocket
     * 
     * Cette fonction capture et traite les erreurs de connexion WebSocket.
     */
    const handleWebSocketError = (error: Event) => {
        console.error("🎮 Erreur WebSocket:", error);
        updateConnectionStatus('error');
        showNotification("Erreur de connexion WebSocket", 'error');
    };

    /**
     * Envoyer un message via WebSocket avec vérification de l'état de connexion
     * 
     * Cette fonction garantit que nous n'essayons d'envoyer des messages
     * que lorsque la connexion est active et stable.
     */
    const sendWebSocketMessage = (data: any) => {
        if (gameWebSocket && gameWebSocket.readyState === WebSocket.OPEN) {
            try {
                const message = JSON.stringify(data);
                console.log("🎮 Envoi de message au serveur:", data);
                gameWebSocket.send(message);
                return true;
            } catch (error) {
                console.error("🎮 Erreur lors de l'envoi du message:", error);
                showNotification("Erreur d'envoi de message", 'error');
                return false;
            }
        } else {
            console.warn("🎮 Impossible d'envoyer le message : WebSocket non connecté");
            showNotification("Connexion au serveur perdue", 'warning');
            return false;
        }
    };

    /**
     * Mettre à jour le statut de connexion dans l'interface
     * 
     * Cette fonction met à jour visuellement l'état de la connexion
     * pour que l'utilisateur comprenne ce qui se passe.
     */
    const updateConnectionStatus = (status: typeof connectionStatus) => {
        connectionStatus = status;
        
        const statusElement = page.querySelector('#connectionStatus');
        const statusText = page.querySelector('#connectionStatusText');
        
        if (statusElement && statusText) {
            // Mise à jour visuelle selon le statut
            switch (status) {
                case 'connected':
                    statusElement.className = 'w-3 h-3 bg-green-400 rounded-full animate-pulse';
                    statusText.textContent = 'Connecté';
                    break;
                case 'connecting':
                    statusElement.className = 'w-3 h-3 bg-yellow-400 rounded-full animate-spin';
                    statusText.textContent = 'Connexion...';
                    break;
                case 'error':
                    statusElement.className = 'w-3 h-3 bg-red-400 rounded-full animate-pulse';
                    statusText.textContent = 'Erreur';
                    break;
                default:
                    statusElement.className = 'w-3 h-3 bg-gray-400 rounded-full';
                    statusText.textContent = 'Déconnecté';
            }
        }
    };

    /**
     * Fermer proprement la connexion WebSocket
     * 
     * Cette fonction assure une déconnexion propre quand l'utilisateur
     * quitte la page ou se déconnecte intentionnellement.
     */
    const closeWebSocketConnection = () => {
        if (gameWebSocket) {
            console.log("🎮 Fermeture intentionnelle de la connexion WebSocket");
            gameWebSocket.close(1000, 'User initiated disconnect');
            gameWebSocket = null;
        }
    };

    // Les fonctions utilitaires et de rendu restent identiques à l'étape 1
    const getPlayerStatusClass = (status: string) => {
        switch (status) {
            case 'available':
                return 'border-green-400 bg-green-400';
            case 'in_game':
                return 'border-red-400 bg-red-400';
            case 'waiting':
                return 'border-yellow-400 bg-yellow-400';
            default:
                return 'border-gray-400 bg-gray-400';
        }
    };

    const getPlayerStatusText = (status: string) => {
        switch (status) {
            case 'available':
                return 'Disponible';
            case 'in_game':
                return 'En jeu';
            case 'waiting':
                return 'En attente';
            default:
                return 'Indisponible';
        }
    };

    /**
     * Rendu de la liste des joueurs avec indicateur de source de données
     * 
     * Pour cette étape, nous gardons les données fictives mais nous ajoutons
     * un indicateur visuel pour montrer qu'elles sont simulées.
     */
    // ÉTAPE 3 : Modifications dans RemotePage.ts


    // 2. Modifier renderPlayersList pour changer le bouton "Test" en "Inviter"
    const renderPlayersList = () => {
        const playersContainer = page.querySelector('.available-players-container');
        if (!playersContainer) return;

        let playersHTML = '';

        // Indicateur de source des données
        if (realPlayersData.length > 0) {
            playersHTML += `
                <div class="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                    <div class="flex items-center space-x-2">
                        <span class="text-green-400 text-sm">✅</span>
                        <p class="text-green-400 text-xs font-medium">
                            Joueurs en ligne - Invitations réelles activées (${realPlayersData.length})
                        </p>
                    </div>
                </div>
            `;
        } else {
            playersHTML += `
                <div class="mb-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                    <div class="flex items-center space-x-2">
                        <span class="text-blue-400 text-sm">🔄</span>
                        <p class="text-blue-400 text-xs font-medium">
                            Chargement des joueurs... ou aucun autre joueur connecté
                        </p>
                    </div>
                </div>
            `;
        }

        const playersToShow = realPlayersData.length > 0 ? realPlayersData : [];

        if (playersToShow.length === 0) {
            playersHTML += `
                <div class="text-center text-gray-400 py-8">
                    <p class="text-sm">Aucun autre joueur en ligne</p>
                    <p class="text-xs mt-1">Connectez-vous depuis une autre machine/onglet pour tester</p>
                </div>
            `;
        } else {
            playersToShow.forEach(player => {
                const statusClass = getPlayerStatusClass(player.status);
                const statusText = getPlayerStatusText(player.status);
                const canInvite = player.status === 'available';
                
                const winRate = player.stats && player.stats.gamesPlayed > 0 
                    ? Math.round((player.stats.wins / player.stats.gamesPlayed) * 100) 
                    : 0;
                
                playersHTML += `
                    <div class="${classes.friendItem} mb-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 border-2 border-purple-400/30">
                                    ${player.avatarUrl 
                                        ? `<img src="${player.avatarUrl}" alt="${player.username}" class="w-full h-full object-cover">`
                                        : `<div class="w-full h-full flex items-center justify-center">
                                            <span class="text-purple-300 text-sm font-bold">${player.username.charAt(0).toUpperCase()}</span>
                                        </div>`
                                    }
                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 ${statusClass} rounded-full border-2 border-gray-900 shadow-sm"></div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-green-400 font-semibold text-sm truncate">${player.username}</h4>
                                    <p class="text-xs text-gray-400">
                                        ${player.stats ? `${player.stats.gamesPlayed} parties • ${winRate}% victoires` : 'Nouveau joueur'}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3 flex-shrink-0">
                                ${canInvite 
                                    ? `<button class="invite-player-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors font-medium" 
                                            data-username="${player.username}">
                                        Inviter
                                    </button>`
                                    : `<span class="text-gray-500 text-xs font-medium">${statusText}</span>`
                                }
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        playersContainer.innerHTML = playersHTML;

        // NOUVEAU : Gestionnaires pour les vraies invitations
        const inviteButtons = playersContainer.querySelectorAll('.invite-player-btn');
        inviteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const username = target.getAttribute('data-username');
                if (username) {
                    sendRealGameInvitation(username); // NOUVELLE FONCTION
                }
            });
        });
    };

    // 3. NOUVELLES FONCTIONS à ajouter

    /**
     * Envoyer une vraie invitation de jeu
     */
    const sendRealGameInvitation = (targetUsername: string) => {
        console.log("🎮 🎯 Envoi d'invitation réelle à:", targetUsername);
        
        const invitationMessage = {
            type: 'send_game_invitation',
            to_user: targetUsername
        };
        
        if (sendWebSocketMessage(invitationMessage)) {
            showNotification(`Invitation envoyée à ${targetUsername}...`, 'info');
        } else {
            showNotification(`Échec de l'envoi de l'invitation à ${targetUsername}`, 'error');
        }
    };

    /**
     * Afficher le modal d'invitation reçue
     */
    const showGameInvitationModal = (fromUser: string, roomId: string) => {
        // Vérifier qu'il n'y a pas déjà un modal
        const existingModal = page.querySelector('#gameInvitationModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'gameInvitationModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 border-2 border-cyan-400 rounded-lg p-6 max-w-md w-full mx-4 ${classes.neonBorder}">
                <div class="text-center">
                    <div class="mb-4">
                        <h3 class="text-2xl font-bold text-cyan-400 ${classes.neonText} mb-2">
                            🎮 INVITATION DE JEU
                        </h3>
                        <div class="w-16 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto rounded"></div>
                    </div>
                    
                    <div class="mb-6">
                        <p class="text-gray-300 mb-2">
                            <span class="text-green-400 font-bold text-lg">${fromUser}</span>
                        </p>
                        <p class="text-cyan-400 font-semibold">
                            vous invite à jouer au Pong !
                        </p>
                    </div>
                    
                    <div class="flex space-x-4">
                        <button id="acceptInvitation" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 ${classes.neonBorder}">
                            ✅ ACCEPTER
                        </button>
                        <button id="declineInvitation" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105">
                            ❌ REFUSER
                        </button>
                    </div>
                    
                    <p class="text-xs text-gray-500 mt-4">
                        Cette invitation expire dans 30 secondes
                    </p>
                </div>
            </div>
        `;
        
        page.appendChild(modal);
        
        // Son de notification (optionnel)
        showNotification(`🎮 Invitation reçue de ${fromUser} !`, 'info');
        
        // Gestionnaires pour les boutons de réponse
        const acceptBtn = modal.querySelector('#acceptInvitation');
        const declineBtn = modal.querySelector('#declineInvitation');
        
        acceptBtn?.addEventListener('click', () => {
            console.log("🎮 ✅ Acceptation de l'invitation de:", fromUser);
            sendWebSocketMessage({
                type: 'accept_game_invitation',
                room_id: roomId,
                from_user: fromUser
            });
            modal.remove();
            showNotification(`Invitation de ${fromUser} acceptée !`, 'success');
        });
        
        declineBtn?.addEventListener('click', () => {
            console.log("🎮 ❌ Refus de l'invitation de:", fromUser);
            sendWebSocketMessage({
                type: 'decline_game_invitation',
                room_id: roomId,
                from_user: fromUser
            });
            modal.remove();
            showNotification(`Invitation de ${fromUser} refusée`, 'warning');
        });
        
        // Auto-fermeture après 30 secondes
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
                showNotification(`Invitation de ${fromUser} expirée`, 'warning');
            }
        }, 30000);
    };

    // 4. Remplacer handleTestInvitation par une fonction qui ne fait plus rien
    // (ou la supprimer si elle n'est plus utilisée)
    const handleTestInvitation = (username: string) => {
        // Cette fonction n'est plus utilisée, remplacée par sendRealGameInvitation
        console.log("🎮 ⚠️ handleTestInvitation appelée mais plus utilisée pour:", username);
    };

    // const handleTestInvitation = (username: string) => {
    //     console.log("🎮 Test d'invitation pour:", username);
        
    //     // Tentative d'envoi d'un message de test via WebSocket
    //     const testMessage = {
    //         type: 'test_invitation',
    //         target_username: username,
    //         from_username: sessionStorage.getItem("username"),
    //         timestamp: Date.now()
    //     };
        
    //     if (sendWebSocketMessage(testMessage)) {
    //         showNotification(`Message de test envoyé pour ${username}`, 'info');
    //     } else {
    //         showNotification(`Échec de l'envoi du test pour ${username}`, 'error');
    //     }
        
    //     // Continuer avec la simulation pour cette étape
    //     setTimeout(() => {
    //         const responses = [
    //             'Test WebSocket réussi !',
    //             'Communication bidirectionnelle validée.',
    //             'Serveur accessible et réactif.'
    //         ];
    //         const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    //         showNotification(`${username}: ${randomResponse}`, 'success');
    //     }, 1500);
    // };

    const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        const notification = document.createElement('div');
        let bgColor = 'bg-blue-500';
        let textColor = 'text-blue-100';
        let icon = '🎮';
        
        switch (type) {
            case 'success':
                bgColor = 'bg-green-500';
                textColor = 'text-green-100';
                icon = '✅';
                break;
            case 'warning':
                bgColor = 'bg-yellow-500';
                textColor = 'text-yellow-100';
                icon = '⚠️';
                break;
            case 'error':
                bgColor = 'bg-red-500';
                textColor = 'text-red-100';
                icon = '❌';
                break;
        }
        
        notification.className = `fixed top-20 right-4 ${bgColor} ${textColor} rounded-lg p-3 z-40 max-w-sm shadow-lg transition-all duration-300 transform translate-x-full opacity-0`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-base flex-shrink-0">${icon}</span>
                <p class="text-sm font-semibold">${message}</p>
            </div>
        `;
        
        page.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    };

    /**
     * Rendu du contenu avec ajout de l'indicateur de statut de connexion
     * 
     * Cette version ajoute un indicateur visuel du statut de connexion WebSocket
     * dans l'interface utilisateur pour que vous puissiez voir l'état en temps réel.
     */
    const renderContent = () => {
        page.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
            
            * {
                font-family: 'Orbitron', monospace;
            }
        </style>
        
        <div class="min-h-screen flex flex-col items-center justify-center p-4 ${classes.scanLinesContainer}">
            
            <!-- Couche de navigation supérieure -->
            <div class="absolute top-4 left-4 z-50">
                <button id="logoutBtn" class="${classes.backButton} text-red-300">
                    <span class="relative z-10">
                    ${i18n.t('game.deco')}
                    </span>
                </button>            
            </div>
            
            <h2 id="nameId" class="${classes.nametitle} absolute top-4 left-1/2 transform -translate-x-1/2 z-40"></h2>
            
            <div class="absolute top-16 left-1/2 transform -translate-x-1/2 z-40">
                <div class="flex gap-4 mt-6">
                    <button class="${classes.backButton}" id="profilBtn">
                        ${i18n.t('game.profile')}
                    </button>
                    <button class="${classes.backButton}" id="chatBtn">
                        CHAT
                    </button>
                </div>
            </div>
            
            <!-- Interface de matchmaking avec indicateur de connexion -->
            <div id="matchmakingInterface" class="${classes.retroPanel} rounded-2xl p-6 mt-32">
                <div class="w-full max-w-6xl">
                    
                    <!-- En-tête avec indicateur de statut de connexion -->
                    <div class="flex items-center justify-between mb-6">
                        <button id="backToMainBtn" class="${classes.backButton}">
                            ${i18n.t('chat.back')}
                        </button>
                        
                        <div class="text-center">
                            <h1 class="text-3xl font-bold text-cyan-400 ${classes.neonText}">
                                PONG EN LIGNE
                            </h1>
                            <!-- Nouvel indicateur de statut de connexion -->
                            <div class="flex items-center justify-center space-x-2 mt-2">
                                <div id="connectionStatus" class="w-3 h-3 bg-gray-400 rounded-full"></div>
                                <span id="connectionStatusText" class="text-xs text-gray-400">Déconnecté</span>
                            </div>
                        </div>
                        
                        <div class="w-24"></div>
                    </div>
                    
                    <!-- Contenu principal en deux colonnes -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        <!-- Colonne gauche : Liste des joueurs -->
                        <div class="space-y-4">
                            <div class="${classes.friendsPanel} h-96">
                                <header class="flex items-center justify-between mb-4 pb-3 border-b border-green-400/30">
                                    <h2 class="text-xl font-bold text-green-400 ${classes.neonText}">
                                        Joueurs disponibles
                                    </h2>
                                    <button id="refreshPlayersBtn" class="bg-green-400/20 hover:bg-green-400/40 text-green-400 rounded-full p-2 transition-all duration-300 w-8 h-8 flex items-center justify-center">
                                        <span class="text-sm font-bold">↻</span>
                                    </button>
                                </header>
                                
                                <main class="overflow-y-auto h-72 pr-2">
                                    <div class="available-players-container space-y-2">
                                        <!-- Les joueurs seront générés dynamiquement ici -->
                                    </div>
                                </main>
                            </div>
                        </div>

                        <!-- Colonne droite : Interface de préparation -->
                        <div class="space-y-6">
                            
                            <div class="text-center">
                                <p class="text-blue-400 text-base mb-6">
                                    WebSocket activé ! Testez la communication avec le serveur.
                                </p>
                            </div>

                            <div class="${classes.playerCard} p-6">
                                <div class="space-y-6">
                                    <!-- Joueur actuel -->
                                    <div class="flex items-center space-x-4">
                                        <div class="w-14 h-14 rounded-full border-4 border-cyan-400/50 ${classes.neonBorder} overflow-hidden bg-gray-700 flex-shrink-0">
                                            <div class="w-full h-full flex items-center justify-center">
                                                <span class="text-cyan-400 text-base font-bold">VOUS</span>
                                            </div>
                                        </div>
                                        <div class="flex-1">
                                            <h3 id="currentPlayerName" class="text-lg font-bold text-cyan-400 ${classes.neonText}">
                                                Vous
                                            </h3>
                                            <div class="bg-gray-700/50 p-2 rounded border border-cyan-400/30">
                                                <p class="text-cyan-400 text-xs">WebSocket en test</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="text-center">
                                        <div class="inline-block text-2xl font-bold text-purple-400 ${classes.neonText} px-4 py-2 border border-purple-400/30 rounded-lg bg-gray-800/50">
                                            VS
                                        </div>
                                    </div>
                                    
                                    <!-- Adversaire (placeholder) -->
                                    <div class="flex items-center space-x-4 opacity-60">
                                        <div class="w-14 h-14 rounded-full border-4 border-purple-400/30 overflow-hidden bg-gray-700 flex-shrink-0">
                                            <div class="w-full h-full flex items-center justify-center">
                                                <span class="text-purple-400 text-base font-bold">?</span>
                                            </div>
                                        </div>
                                        <div class="flex-1">
                                            <h3 class="text-lg font-bold text-purple-400">Adversaire</h3>
                                            <div class="bg-gray-700/50 p-2 rounded border border-purple-400/30">
                                                <p class="text-purple-400 text-xs">Test de communication</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Informations de statut du système mises à jour -->
                            <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                                <h4 class="text-base font-bold text-gray-300 mb-3 text-center">Statut du système</h4>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div class="text-center">
                                        <div class="text-gray-400 mb-1">Mode</div>
                                        <div class="text-blue-400 font-bold">WEBSOCKET</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-gray-400 mb-1">Étape</div>
                                        <div class="text-blue-400 font-bold">2/5</div>
                                    </div>
                                </div>
                                <div class="mt-3 pt-3 border-t border-gray-700 text-center">
                                    <p class="text-xs text-gray-500">
                                        Connexion WebSocket active - Communication serveur testée
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="gameArea" class="hidden w-full max-w-6xl">
                <div class="text-center text-gray-400 text-lg p-8 ${classes.retroPanel} rounded-xl">
                    <p>Zone de jeu - sera activée dans les prochaines étapes</p>
                </div>
            </div>
        </div>
        
        <div class="absolute top-4 right-4 z-30" id="language-switcher-container"></div>
        `;
        
        const languageSwitcherContainer = page.querySelector('#language-switcher-container');
        if (languageSwitcherContainer) {
            languageSwitcherContainer.appendChild(createLanguageSwitcher());
        }
        
        initializeInterface();
    };

    /**
     * Initialisation de l'interface avec connexion WebSocket automatique
     * 
     * Cette version étend l'initialisation pour établir automatiquement
     * la connexion WebSocket dès que l'interface est prête.
     */
    const initializeInterface = () => {
        const logoutBtn = page.querySelector('#logoutBtn') as HTMLButtonElement;
        const chatBtn = page.querySelector('#chatBtn') as HTMLButtonElement;
        const profilBtn = page.querySelector('#profilBtn') as HTMLButtonElement;
        const nameId = page.querySelector('#nameId') as HTMLElement;
        const backToMainBtn = page.querySelector('#backToMainBtn') as HTMLButtonElement;
        const refreshPlayersBtn = page.querySelector('#refreshPlayersBtn') as HTMLButtonElement;
        const currentPlayerNameEl = page.querySelector('#currentPlayerName') as HTMLElement;

        // Configuration du nom d'utilisateur
        const userId = sessionStorage.getItem("username");
        if (userId) {
            nameId.innerText = userId;
            if (currentPlayerNameEl) {
                currentPlayerNameEl.textContent = userId;
            }
        }

        // Génération de la liste des joueurs
        renderPlayersList();
        
        // Établissement automatique de la connexion WebSocket
        setTimeout(() => {
            console.log("🎮 Démarrage de la connexion WebSocket automatique");
            establishWebSocketConnection();
        }, 1000);

        // Message de bienvenue pour cette étape
        setTimeout(() => {
            showNotification("WebSocket activé ! Observez l'indicateur de connexion.", 'info');
        }, 500);

        // Configuration des gestionnaires d'événements pour la navigation
        logoutBtn.addEventListener('click', async () => {
            // Fermeture propre de la connexion WebSocket avant déconnexion
            closeWebSocketConnection();
            
            try {
                const response = await fetch("/api/logout", {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    console.log("Déconnexion réussie côté serveur.");
                } else {
                    console.error("Échec de la déconnexion côté serveur.");
                }
            } catch (error) {
                console.error("Erreur lors de la déconnexion:", error);
            } finally {
                sessionStorage.clear();
                import('../router/router.js').then(({ router }) => {
                    router.navigate('/game');
                });
            }
        });

        backToMainBtn.addEventListener('click', () => {
            closeWebSocketConnection();
            import("../router/router.js").then(({ router }) => {
                router.navigate("/game");
            });
        });

        profilBtn.addEventListener('click', () => {
            closeWebSocketConnection();
            import("../router/router.js").then(({ router }) => {
                router.navigate("/profile");
            });
        });

        chatBtn.addEventListener('click', () => {
            closeWebSocketConnection();
            import("../router/router.js").then(({ router }) => {
                router.navigate("/chat");
            });
        });

        refreshPlayersBtn.addEventListener('click', () => {
            showNotification("Actualisation de la liste des joueurs...", 'info');
            
            // Demander les vraies données au serveur
            const refreshMessage = {
                type: 'get_available_players',
                timestamp: Date.now()
            };
            
            if (sendWebSocketMessage(refreshMessage)) {
                showNotification("Demande d'actualisation envoyée", 'info');
            } else {
                showNotification("Erreur de communication WebSocket", 'error');
            }
        });
    };

    // Nettoyage des ressources lors de la fermeture de la page
    window.addEventListener('beforeunload', () => {
        console.log("🎮 Nettoyage avant fermeture de page");
        closeWebSocketConnection();
        
        if (currentGame) {
            if (typeof currentGame.cleanup === 'function') {
                currentGame.cleanup();
            }
            currentGame = null;
        }
    });

    // Nettoyage lors du changement de page via le routeur
    window.addEventListener('popstate', () => {
        console.log("🎮 Nettoyage lors du changement de page");
        closeWebSocketConnection();
    });

    // Rendu initial de la page
    renderContent();
    
    // Re-rendu lors du changement de langue avec reconnexion WebSocket
    window.addEventListener('languageChanged', () => {
        renderContent();
        // Rétablir la connexion WebSocket après le re-rendu
        setTimeout(() => {
            if (connectionStatus === 'disconnected') {
                establishWebSocketConnection();
            }
        }, 500);
    });

    return page;
}