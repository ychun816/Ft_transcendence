import { i18n } from "../services/i18n.js";
import { createLanguageSwitcher } from "../components/LanguageSwitcher.js";
import { classes } from "../styles/retroStyles.js";

export function createChatPage(): HTMLElement {
	const page = document.createElement("div");
	page.className = "min-h-screen bg-gray-900 text-white font-mono overflow-hidden";

	const renderContent = () => {
		page.innerHTML = `
		<style>
			/* Import de la police Orbitron pour le thème rétro */
			@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

			* {
				font-family: 'Orbitron', monospace;
			}

			/* Animation personnalisée pour le spinner */
			@keyframes retro-spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}

			.retro-spinner {
				animation: retro-spin 1s linear infinite;
			}
		</style>

		<!-- Champ d'étoiles en arrière-plan -->
		<div class="${classes.starfield}"></div>

		<!-- Container principal avec effet scan -->
		<div class="min-h-screen flex items-center justify-center p-4 ${classes.scanLinesContainer} relative">
			
			<!-- Sélecteur de langue en haut à droite -->
			<div class="absolute top-4 right-4 z-50" id="language-switcher-container"></div>

			<!-- Interface principale -->
			<div class="${classes.retroPanel} rounded-2xl p-8 max-w-6xl w-full flex flex-col items-center">
				
				<!-- Header avec bouton retour et titre -->
				<header class="w-full flex items-center gap-4 mb-6">
					<button class="${classes.backButton}" data-route="/home">
						<span class="relative z-10">
							${i18n.t('chat.back')}
						</span>
					</button>
					<h2 class="text-3xl font-bold text-cyan-400 ${classes.neonText}">
						${i18n.t('chat.title')}
					</h2>
				</header>

				<!-- Interface de chat principal -->
				<main class="w-full flex flex-col items-center">
					<div class="flex w-full h-96">
						
						<!-- Panneau des utilisateurs en ligne -->
						<div class="w-1/4 border-r-2 border-cyan-400/30 flex flex-col ${classes.retroPanel} rounded-l-xl">
							<div class="p-4 border-b-2 border-cyan-400/30">
								<h3 class="font-semibold text-cyan-400 ${classes.neonText}">
									${i18n.t('chat.online_users')}
								</h3>
							</div>
							<div class="flex-1 overflow-y-auto" id="online-users-list">
								<div class="p-4 text-cyan-400 text-center">
									<div class="inline-block w-4 h-4 border-2 border-cyan-400 border-t-green-400 rounded-full retro-spinner mb-2"></div>
									<div class="text-sm font-medium">${i18n.t('chat.connecting')}</div>
								</div>
							</div>
						</div>

						<!-- Panneau des conversations -->
						<div class="w-1/3 border-r-2 border-cyan-400/30 flex flex-col ${classes.retroPanel}">
							<div class="p-4 border-b-2 border-cyan-400/30">
								<h3 class="font-semibold text-cyan-400 ${classes.neonText}">
									${i18n.t('chat.conversations')}
								</h3>
							</div>
							<div class="flex-1 overflow-y-auto" id="conversations-list">
								<!-- Les conversations apparaîtront ici -->
							</div>
						</div>

						<!-- Zone de chat -->
						<div class="flex-1 flex flex-col ${classes.retroPanel} rounded-r-xl">
							<div class="p-4 border-b-2 border-cyan-400/30" id="chat-header">
								<h3 class="font-semibold text-cyan-400 ${classes.neonText}">
									${i18n.t('chat.select_conversation')}
								</h3>
							</div>
							<div class="flex-1 p-4 overflow-y-auto" id="chat-messages">
								<!-- Les messages apparaîtront ici -->
							</div>
							<div class="bg-gray-800/50 border-t-2 border-cyan-400/30 p-4 flex gap-2">
								<input 
									type="text" 
									placeholder="${i18n.t('chat.type_message')}" 
									id="message-input" 
									class="${classes.retroInput} flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
								>
								<button id="send-message" class="${classes.actionButton}">
									<span class="relative z-10 text-cyan-400 drop-shadow-[0_0_5px_rgb(34,211,238)]">
										${i18n.t('chat.send')}
									</span>
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
		`;

		// Add language switcher
		const languageSwitcherContainer = page.querySelector('#language-switcher-container');
		if (languageSwitcherContainer) {
			languageSwitcherContainer.appendChild(createLanguageSwitcher());
		}
	};

	renderContent();

	// Re-render when language changes
	window.addEventListener('languageChanged', renderContent);

	// Get current user info
	const currentUser = sessionStorage.getItem("currentUser");
	let username = null;

	if (currentUser) {
		try {
			const user = JSON.parse(currentUser);
			username = user.username;
		} catch (e) {
			console.error("Error parsing user data:", e);
		}
	}

	if (!username) {
		page.innerHTML = `
			<style>
				@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
				* { font-family: 'Orbitron', monospace; }
			</style>
			<div class="${classes.starfield}"></div>
			<div class="min-h-screen flex items-center justify-center p-4 ${classes.scanLinesContainer} relative">
				<div class="${classes.retroPanel} rounded-2xl p-8 max-w-md w-full text-center">
					<h2 class="text-xl font-bold text-red-400 ${classes.neonText} mb-4">Erreur</h2>
					<p class="text-gray-300 mb-6">Vous devez être connecté pour accéder au chat.</p>
					<button class="${classes.gameModeButton} w-full" data-route="/login">
						<span class="relative z-10 text-red-400 drop-shadow-[0_0_5px_rgb(239,68,68)]">
							Se connecter
						</span>
					</button>
				</div>
			</div>
		`;

		// Add navigation handler
		page.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			const route = target.getAttribute("data-route");
			if (route) {
				import("../router/router.js").then(({ router }) => {
					router.navigate(route);
				});
			}
		});

		return page;
	}

	// Optimiser le chargement : démarrer la connexion WebSocket immédiatement
	// avec un timeout pour getUserInfo
	const userId = sessionStorage.getItem("userId");
	if (userId) {
		// Si on a déjà l'userId en cache, on peut démarrer plus vite
		const userData = {
			id: parseInt(userId),
			username: username,
		};
		initializeChat(page, userData);
	} else {
		// Sinon, on récupère les données avec un timeout
		const userInfoPromise = getUserInfo();
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error("User info timeout")), 3000);
		});

		Promise.race([userInfoPromise, timeoutPromise])
			.then((userData) => {
				if (userData && userData.id) {
					console.log("✅ User info retrieved:", userData);
					sessionStorage.setItem("userId", userData.id.toString());
					initializeChat(page, userData);
				} else {
					throw new Error("Invalid user data");
				}
			})
			.catch((error) => {
				console.error("❌ Failed to get user info:", error);
				page.innerHTML = `
					<style>
						@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
						* { font-family: 'Orbitron', monospace; }
					</style>
					<div class="${classes.starfield}"></div>
					<div class="min-h-screen flex items-center justify-center p-4 ${classes.scanLinesContainer} relative">
						<div class="${classes.retroPanel} rounded-2xl p-8 max-w-md w-full text-center">
							<h2 class="text-xl font-bold text-red-400 ${classes.neonText} mb-4">Erreur</h2>
							<p class="text-gray-300 mb-6">Impossible de récupérer les informations utilisateur.</p>
							<button class="${classes.gameModeButton} w-full" data-route="/login">
								<span class="relative z-10 text-red-400 drop-shadow-[0_0_5px_rgb(239,68,68)]">
									Se reconnecter
								</span>
							</button>
						</div>
					</div>
				`;
			});
	}

	// Navigation
	page.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute("data-route");
		if (route) {
			import("../router/router.js").then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	return page;
}

/**
 * Get user info from server with timeout
 */
async function getUserInfo() {
	try {
		const token = sessionStorage.getItem('authToken');
		if (!token) {
			throw new Error('No auth token found');
		}

		const response = await fetch('/api/me', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const userData = await response.json();
		console.log("✅ User data from /api/me:", userData);
		return userData;
	} catch (error) {
		console.error("❌ Error fetching user info:", error);
		throw error;
	}
}

/**
 * Initialize chat functionality with user data
 */
function initializeChat(page: HTMLElement, userData: any) {
	// WebSocket connection
	let ws: WebSocket | null = null;
	let currentConversation: string | null = null;
	const onlineUsersList = page.querySelector(
		"#online-users-list"
	) as HTMLElement;
	const conversationsList = page.querySelector(
		"#conversations-list"
	) as HTMLElement;
	const chatHeader = page.querySelector("#chat-header") as HTMLElement;
	const messagesContainer = page.querySelector(
		"#chat-messages"
	) as HTMLElement;
	const messageInput = page.querySelector(
		"#message-input"
	) as HTMLInputElement;
	const sendButton = page.querySelector("#send-message") as HTMLButtonElement;

	// Améliorer la fonction requestOnlineUsers avec debouncing
	let onlineUsersRequestTimeout: NodeJS.Timeout | null = null;

	// Add these variables at the top of initializeChat function
	let blockedUsers: Set<string> = new Set();
	let usersWhoBlockedMe: Set<string> = new Set();
	let pendingInvitations: Set<string> = new Set(); // Track pending invitations

	// Add this variable to store received messages
	let receivedMessages: Map<string, any[]> = new Map();

	function connectWebSocket() {
		// Utiliser l'URL complète du serveur backend
		ws = new WebSocket(
			`wss://localhost:3002/ws/chat?username=${encodeURIComponent(userData.username)}&userId=${userData.id}`
		);

		ws.onopen = () => {
			console.log("🔗 WebSocket connected");
			loadConversations();
			// Les utilisateurs en ligne sont maintenant envoyés automatiquement par le serveur
			// avec un petit délai pour éviter les race conditions
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log("📨 Received:", data);

				switch (data.type) {
					case "connection_established":
						console.log("✅ Connected to chat server");
						break;
					case "conversations":
						displayConversations(data.conversations);
						break;
					case "messages":
						displayMessages(data.messages);
						break;
					case "message_sent":
						// Handle message sent confirmation (optional)
						console.log("✅ Message sent successfully");
						break;
					case "direct_message":
						handleNewMessage(data);
						break;
					case "user_profile":
						displayUserProfile(data.profile);
						break;
					case "online_users":
						console.log("👥 Online users:", data.users);
						displayOnlineUsers(data.users);
						break;
					case "user_offline":
						console.log("👤 User offline:", data.username);
						removeUserFromOnlineList(data.username);
						break;
					case "user_online":
						console.log("👤 User online:", data.user);
						addUserToOnlineList(data.user);
						break;
					case "error":
						showError(data.message);
						break;
					case "user_blocked":
						blockedUsers.add(data.username);
						showBlockedMessage(data.username, true);
						break;
					case "user_unblocked":
						blockedUsers.delete(data.username);
						break;
					case "user_blocked_you":
						usersWhoBlockedMe.add(data.username);
						showBlockedMessage(data.username, false);
						break;
					case "user_unblocked_you":
						usersWhoBlockedMe.delete(data.username);
						break;
					case "game_invite_received":
						handleGameInviteReceived(data);
						break;
					case "game_invite_sent":
						handleGameInviteSent(data);
						break;
					case "game_invite_accepted":
						handleGameInviteAccepted(data);
						break;
					case "game_invite_declined":
						handleGameInviteDeclined(data);
						break;
					case "game_invite_response":
						handleGameInviteResponse(data);
						break;
					case "tournament_notification":
						handleTournamentNotification(data);
						break;
					default:
						console.log("📨 Unknown message type:", data.type);
				}
			} catch (error) {
				console.error("❌ Error parsing message:", error);
			}
		};

		ws.onclose = () => {
			console.log("🔌 WebSocket disconnected");
			// Afficher un message à l'utilisateur avec styles rétro
			onlineUsersList.innerHTML = `
				<div class="p-4 text-red-400 text-center">
					<div class="mb-2 ${classes.neonText}">Connexion perdue</div>
					<button class="${classes.actionButton} text-xs" onclick="location.reload()">
						<span class="relative z-10">Reconnecter</span>
					</button>
				</div>
			`;
		};

		ws.onerror = (error) => {
			console.error("❌ WebSocket error:", error);
			onlineUsersList.innerHTML = `
				<div class="p-4 text-red-400 text-center ${classes.neonText}">
					Erreur de connexion
				</div>
			`;
		};
	}

	function requestOnlineUsers() {
		// Debounce les requêtes multiples
		if (onlineUsersRequestTimeout) {
			clearTimeout(onlineUsersRequestTimeout);
		}

		onlineUsersRequestTimeout = setTimeout(() => {
			// Afficher un indicateur de chargement seulement si la liste est vide
			if (
				onlineUsersList.children.length === 0 ||
				onlineUsersList.querySelector(".text-gray-500")
			) {
				onlineUsersList.innerHTML = `
					<div class="p-4 text-cyan-400 text-center">
						<div class="inline-block w-4 h-4 border-2 border-cyan-400 border-t-green-400 rounded-full retro-spinner mb-2"></div>
						<div class="mt-2 text-sm">Récupération des utilisateurs...</div>
					</div>
				`;
			}

			if (ws && ws.readyState === WebSocket.OPEN) {
				console.log("🔧 Sending get_online_users request");
				ws.send(
					JSON.stringify({
						type: "get_online_users",
					})
				);

				// Réduire le timeout à 3 secondes au lieu de 5
				setTimeout(() => {
					if (onlineUsersList.querySelector(".retro-spinner")) {
						console.log("🔧 Timeout reached for get_online_users");
						onlineUsersList.innerHTML = `
							<div class="p-4 text-red-400 text-center ${classes.neonText}">
								Timeout - Impossible de récupérer les utilisateurs
								<button class="${classes.actionButton} text-xs mt-2" onclick="location.reload()">
									<span class="relative z-10">Recharger</span>
								</button>
							</div>
						`;
					}
				}, 3000); // Timeout après 3 secondes
			} else {
				console.log("🔧 WebSocket not connected");
				// Si WebSocket n'est pas connecté, afficher un message d'erreur immédiatement
				onlineUsersList.innerHTML = `
					<div class="p-4 text-red-400 text-center ${classes.neonText}">
						Erreur de connexion
						<button class="${classes.actionButton} text-xs mt-2" onclick="location.reload()">
							<span class="relative z-10">Reconnecter</span>
						</button>
					</div>
				`;
			}
		}, 100); // Debounce de 100ms
	}

	function displayOnlineUsers(users: any[]) {
		// Solution simple : remplacer complètement la liste
		onlineUsersList.innerHTML = "";

		if (users.length === 0) {
			onlineUsersList.innerHTML = `
				<div class="p-4 text-cyan-400 text-center ${classes.neonText}">
					Aucun utilisateur en ligne
				</div>
			`;
			return;
		}

		// Créer un fragment pour optimiser les performances DOM
		const fragment = document.createDocumentFragment();

		users.forEach((user) => {
			// Skip current user
			if (user.username === userData.username) {
				return;
			}

			const userDiv = document.createElement("div");
			userDiv.className = `${classes.friendItem} hover:bg-gray-700/40 cursor-pointer transition-all duration-300`;
			userDiv.setAttribute("data-username", user.username);
			userDiv.innerHTML = `
				<div class="flex items-center gap-3">
					<img src="${user.avatarUrl || "/public/default-avatar.png"}"
						 alt="${user.username}"
						 class="w-8 h-8 rounded-full border-2 border-cyan-400/30 ${classes.neonBorder}">
					<div class="flex-1">
						<h4 class="font-medium text-cyan-400 text-sm ${classes.neonText}">${user.username}</h4>
						<div class="flex items-center gap-1">
							<div class="${classes.statusOnline}"></div>
							<span class="text-xs text-green-400">En ligne</span>
						</div>
					</div>
				</div>
			`;

			userDiv.addEventListener("click", () => {
				startConversationWithUser(user.username);
			});

			fragment.appendChild(userDiv);
		});

		onlineUsersList.appendChild(fragment);
	}

	function addUserToOnlineList(user: any) {
		// Skip current user
		if (user.username === userData.username) {
			return;
		}

		console.log(`👤 Adding user ${user.username} to online list`);

		// Check if user already exists in the list
		const existingUser = onlineUsersList.querySelector(
			`[data-username="${user.username}"]`
		);
		if (existingUser) {
			return; // User already in list
		}

		const userDiv = document.createElement("div");
		userDiv.className = `${classes.friendItem} hover:bg-gray-700/40 cursor-pointer transition-all duration-300`;
		userDiv.setAttribute("data-username", user.username);
		userDiv.innerHTML = `
			<div class="flex items-center gap-3">
				<img src="${user.avatarUrl || "/public/default-avatar.png"}"
					 alt="${user.username}"
					 class="w-8 h-8 rounded-full border-2 border-cyan-400/30">
				<div class="flex-1">
					<h4 class="font-medium text-cyan-400 text-sm ${classes.neonText}">${user.username}</h4>
					<div class="flex items-center gap-1">
						<div class="${classes.statusOnline}"></div>
						<span class="text-xs text-green-400">En ligne</span>
					</div>
				</div>
				<div class="flex flex-col gap-1">
					<button class="${classes.actionButton} text-xs px-2 py-1" data-action="chat">
						💬
					</button>
					<button class="${classes.actionButton} text-xs px-2 py-1" data-action="profile">
						👤
					</button>
				</div>
			</div>
		`;

		userDiv.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			const action = target.getAttribute('data-action');

			if (action === 'chat') {
				e.stopPropagation();
				startConversationWithUser(user.username);
			} else if (action === 'profile') {
				e.stopPropagation();
				// Navigate to user profile
				import("../router/router.js").then(({ router }) => {
					router.navigate(`/profile/${user.username}`);
				});
			} else if (!action) {
				// Click on the main area starts conversation
				startConversationWithUser(user.username);
			}
		});

		// Remove "Aucun utilisateur en ligne" message if it exists
		const noUsersMessage = onlineUsersList.querySelector(".text-gray-500");
		if (noUsersMessage) {
			noUsersMessage.remove();
		}

		// Add the user to the list
		onlineUsersList.appendChild(userDiv);
	}

	function removeUserFromOnlineList(username: string) {
		const userElement = onlineUsersList.querySelector(
			`[data-username="${username}"]`
		);
		if (userElement) {
			userElement.remove();
		}
	}

	function startConversationWithUser(username: string) {
		// Select the conversation with this user
		selectConversation(username);

		// Also update the conversations list to show this conversation
		loadConversations();
	}

	function loadConversations() {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(
				JSON.stringify({
					type: "get_conversations",
				})
			);
		}
	}

	function displayConversations(conversations: any[]) {
		conversationsList.innerHTML = "";

		if (conversations.length === 0) {
			conversationsList.innerHTML = `
				<div class="p-4 text-cyan-400 text-center ${classes.neonText}">
					Aucune conversation
				</div>
			`;
			return;
		}

		conversations.forEach((conv) => {
			const convDiv = document.createElement("div");
			convDiv.className = `${classes.friendItem} hover:bg-gray-700/40 cursor-pointer transition-all duration-300 ${
				conv.unreadCount > 0 ? "bg-blue-900/30 border-blue-400/50" : ""
			}`;
			convDiv.setAttribute('data-username', conv.partner.username);
			convDiv.innerHTML = `
				<div class="flex items-center gap-3">
					<img src="${conv.partner.avatarUrl || "/public/default-avatar.png"}"
						 alt="${conv.partner.username}"
						 class="w-10 h-10 rounded-full border-2 border-cyan-400/30">
					<div class="flex-1">
						<div class="flex justify-between items-center">
							<h4 class="font-medium text-cyan-400 ${classes.neonText}">${conv.partner.username}</h4>
							${conv.unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1 ${classes.neonBorder}">${conv.unreadCount}</span>` : ""}
						</div>
						<p class="text-sm text-gray-300 truncate">${conv.lastMessage}</p>
						<p class="text-xs text-gray-500">${new Date(conv.timestamp).toLocaleString()}</p>
					</div>
				</div>
			`;

			convDiv.addEventListener("click", () => {
				selectConversation(conv.partner.username);
			});

			conversationsList.appendChild(convDiv);
		});
	}

	function selectConversation(username: string) {
		currentConversation = username;

		// Clear notification badge immediately for this conversation
		clearNotificationBadge(username);

		// Check if there's a pending invitation for this user
		const hasPendingInvite = pendingInvitations.has(username);
		const inviteButtonClass = hasPendingInvite 
			? "text-gray-400 text-sm cursor-not-allowed opacity-50" 
			: "text-green-400 text-sm hover:text-green-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(34,197,94)]";
		const inviteButtonText = hasPendingInvite ? "🎮 Invitation Sent" : "🎮 Invite to Game";

		// Update header
		chatHeader.innerHTML = `
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h3 class="font-semibold text-cyan-400 ${classes.neonText}">${username}</h3>
					<button class="${classes.actionButton} text-xs" id="view-profile-btn">
						<span class="relative z-10">Voir profil</span>
					</button>
				</div>
				<div class="flex gap-2">
					<button class="${inviteButtonClass}" id="invite-game-btn" ${hasPendingInvite ? 'disabled' : ''}>
						${inviteButtonText}
					</button>
					<button class="text-red-400 text-sm hover:text-red-300 transition-colors duration-300 drop-shadow-[0_0_3px_rgb(252,165,165)]" id="block-user-btn">
						🚫 ${i18n.t("chat.block_user")}
					</button>
				</div>
			</div>
		`;

		// Add event listeners
		const viewProfileBtn = chatHeader.querySelector(
			"#view-profile-btn"
		) as HTMLButtonElement;
		const inviteGameBtn = chatHeader.querySelector(
			"#invite-game-btn"
		) as HTMLButtonElement;
		const blockUserBtn = chatHeader.querySelector(
			"#block-user-btn"
		) as HTMLButtonElement;

		viewProfileBtn.addEventListener("click", () => {
			// Navigate directly to user profile page
			import("../router/router.js").then(({ router }) => {
				router.navigate(`/profile/${username}`);
			});
		});

		inviteGameBtn.addEventListener("click", () => {
			sendGameInvite(username);
		});

		blockUserBtn.addEventListener("click", () => {
			blockUser(username);
		});

		// Load messages
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(
				JSON.stringify({
					type: "get_messages",
					otherUsername: username,
				})
			);
		}
	}

	function clearNotificationBadge(username: string) {
		// Find the specific conversation div using data-username attribute
		const conversationElement = conversationsList.querySelector(`[data-username="${username}"]`);
		if (conversationElement) {
			// Remove the blue background indicating unread messages
			conversationElement.classList.remove('bg-blue-900/30', 'border-blue-400/50');
			// Remove the red notification badge
			const badge = conversationElement.querySelector('.bg-red-500');
			if (badge) {
				badge.remove();
			}
		}

		// Clear any cached received messages for this conversation to prevent duplication
		if (receivedMessages.has(username)) {
			receivedMessages.set(username, []);
		}

		// Reload conversations after a short delay to allow server to mark messages as read
		setTimeout(() => {
			loadConversations();
		}, 500);
	}

	function displayMessages(messages: any[]) {
		messagesContainer.innerHTML = "";

		if (messages.length === 0) {
			messagesContainer.innerHTML = `
				<div class="text-center text-cyan-400 py-8 ${classes.neonText}">
					Aucun message dans cette conversation
				</div>
			`;
			return;
		}

		// Check if current conversation is blocked
		const isBlocked = blockedUsers.has(currentConversation!);
		const isBlockedByMe = usersWhoBlockedMe.has(currentConversation!);

		if (isBlocked) {
			messagesContainer.innerHTML = `
				<div class="text-center text-red-400 py-8">
					<div class="mb-4">
						<div class="w-12 h-12 mx-auto text-red-400 mb-4 ${classes.neonText}">🚫</div>
						<h3 class="text-lg font-semibold text-red-400 mb-2 ${classes.neonText}">Utilisateur bloqué</h3>
						<p class="text-gray-300">Vous avez bloqué cet utilisateur. Vous ne pouvez plus voir ses messages.</p>
					</div>
				</div>
			`;
			return;
		}

		if (isBlockedByMe) {
			messagesContainer.innerHTML = `
				<div class="text-center text-red-400 py-8">
					<div class="mb-4">
						<div class="w-12 h-12 mx-auto text-red-400 mb-4 ${classes.neonText}">🚫</div>
						<h3 class="text-lg font-semibold text-red-400 mb-2 ${classes.neonText}">Cet utilisateur vous a bloqué</h3>
						<p class="text-gray-300">Vous ne pouvez plus envoyer de messages à cet utilisateur.</p>
					</div>
				</div>
			`;
			return;
		}

		// Combine database messages with received messages
		const allMessages = [...messages];
		if (currentConversation && receivedMessages.has(currentConversation)) {
			const receivedMsgs = receivedMessages.get(currentConversation)!;
			allMessages.push(...receivedMsgs);
		}

		// Sort messages by timestamp
		allMessages.sort(
			(a, b) =>
				new Date(a.timestamp).getTime() -
				new Date(b.timestamp).getTime()
		);

		allMessages.forEach((msg) => {
			const messageDiv = document.createElement("div");
			messageDiv.className = `mb-4 flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`;

			messageDiv.innerHTML = `
				<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
					msg.sender === "me"
						? `${classes.retroPanel} bg-blue-900/50 text-cyan-400 border-blue-400/30`
						: `${classes.retroPanel} bg-gray-800/50 text-gray-300 border-gray-400/30`
				}">
					<p class="text-sm">${msg.content}</p>
					<p class="text-xs opacity-75 mt-1">${new Date(msg.timestamp).toLocaleString()}</p>
				</div>
			`;

			messagesContainer.appendChild(messageDiv);
		});

		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	function handleNewMessage(data: any) {
		// Check if message is from/to a blocked user
		const isFromBlockedUser = blockedUsers.has(data.sender);
		const isToBlockedUser = blockedUsers.has(data.receiver);
		const isFromUserWhoBlockedMe = usersWhoBlockedMe.has(data.sender);

		// Don't display messages from blocked users or to users who blocked me
		if (isFromBlockedUser || isFromUserWhoBlockedMe) {
			return;
		}

		// Store the message for the conversation
		const conversationKey =
			data.sender === userData.username ? data.receiver : data.sender;
		if (!receivedMessages.has(conversationKey)) {
			receivedMessages.set(conversationKey, []);
		}
		receivedMessages.get(conversationKey)!.push(data);

		// If this message is for the current conversation, display it
		if (
			currentConversation &&
			(data.sender === currentConversation ||
				data.receiver === currentConversation ||
				data.sender === "me")
		) {
			const messageDiv = document.createElement("div");
			messageDiv.className = `mb-4 flex ${data.sender === "me" || data.sender === userData.username ? "justify-end" : "justify-start"}`;

			messageDiv.innerHTML = `
				<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
					data.sender === "me" || data.sender === userData.username
						? `${classes.retroPanel} bg-blue-900/50 text-cyan-400 border-blue-400/30`
						: `${classes.retroPanel} bg-gray-800/50 text-gray-300 border-gray-400/30`
				}">
					<p class="text-sm">${data.content}</p>
					<p class="text-xs opacity-75 mt-1">${new Date(data.timestamp).toLocaleString()}</p>
				</div>
			`;

			messagesContainer.appendChild(messageDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}

		// Only reload conversations if this user is the receiver (not the sender)
		if (data.receiver === userData.username) {
			loadConversations();
		}
	}

	function sendMessage() {
		const message = messageInput.value.trim();
		if (
			message &&
			ws &&
			ws.readyState === WebSocket.OPEN &&
			currentConversation
		) {
			// Check if user is blocked
			if (blockedUsers.has(currentConversation)) {
				showError(
					"Vous ne pouvez pas envoyer de messages à cet utilisateur car vous l'avez bloqué."
				);
				return;
			}

			if (usersWhoBlockedMe.has(currentConversation)) {
				showError(
					"Vous ne pouvez pas envoyer de messages à cet utilisateur car il vous a bloqué."
				);
				return;
			}

			ws.send(
				JSON.stringify({
					type: "direct_message",
					receiverUsername: currentConversation,
					content: message,
				})
			);
			messageInput.value = "";
		}
	}

	function showUserProfile(username: string) {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(
				JSON.stringify({
					type: "get_user_profile",
					username: username,
				})
			);
		}
	}

	function displayUserProfile(profile: any) {
		// For now, just log the profile. In the future, this could open a modal or navigate to profile page
		console.log("📄 User profile received:", profile);

		// You could display this in a modal or navigate to the profile page
		alert(`Profil de ${profile.username}:\nPartites jouées: ${profile.gamesPlayed}\nVictoires: ${profile.wins}\nDéfaites: ${profile.losses}`);
	}

	function blockUser(username: string) {
		if (confirm(`Êtes-vous sûr de vouloir bloquer ${username} ?`)) {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(
					JSON.stringify({
						type: "block_user",
						usernameToBlock: username,
					})
				);
			}
		}
	}

	function showError(message: string) {
		const errorDiv = document.createElement("div");
		errorDiv.className = `fixed top-4 right-4 ${classes.retroPanel} text-red-400 px-4 py-2 rounded shadow-lg ${classes.neonText}`;
		errorDiv.textContent = message;
		document.body.appendChild(errorDiv);

		setTimeout(() => {
			errorDiv.remove();
		}, 5000);
	}

	function showBlockedMessage(username: string, isBlockedByMe: boolean) {
		const message = isBlockedByMe
			? `Vous avez bloqué ${username}. Vous ne recevrez plus ses messages.`
			: `${username} vous a bloqué. Vous ne pouvez plus lui envoyer de messages.`;

		showError(message);
	}

	function sendGameInvite(username: string) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			showError("Not connected to chat server");
			return;
		}

		// Check if there's already a pending invitation
		if (pendingInvitations.has(username)) {
			showError("You already have a pending invitation to this user");
			return;
		}

		ws.send(JSON.stringify({
			type: "send_game_invite",
			receiverUsername: username
		}));
	}

	function handleGameInviteReceived(data: any) {
		showGameInviteNotification(data.senderUsername, data.inviteId);
	}

	function handleGameInviteSent(data: any) {
		// Add to pending invitations
		pendingInvitations.add(data.receiverUsername);
		showSuccessMessage(`Game invitation sent to ${data.receiverUsername}`);
		
		// Update the UI if we're currently chatting with this user
		if (currentConversation === data.receiverUsername) {
			selectConversation(data.receiverUsername);
		}
	}

	function handleGameInviteAccepted(data: any) {
		// Remove from pending invitations
		pendingInvitations.delete(data.receiverUsername);
		showSuccessMessage(`${data.receiverUsername} accepted your game invitation! ${data.message || ''}`);
		
		// Update the UI if we're currently chatting with this user
		if (currentConversation === data.receiverUsername) {
			selectConversation(data.receiverUsername);
		}
	}

	function handleGameInviteDeclined(data: any) {
		// Remove from pending invitations
		pendingInvitations.delete(data.receiverUsername);
		showError(`${data.receiverUsername} declined your game invitation`);
		
		// Update the UI if we're currently chatting with this user
		if (currentConversation === data.receiverUsername) {
			selectConversation(data.receiverUsername);
		}
	}

	function handleGameInviteResponse(data: any) {
		const message = data.status === "accepted" 
			? `Game invitation ${data.status}! ${data.message || ''}`
			: `Game invitation ${data.status}`;
		
		if (data.status === "accepted") {
			showSuccessMessage(message);
		} else {
			showError(message);
		}
	}

	function handleTournamentNotification(data: any) {
		showTournamentNotification(data.message);
	}

	function showGameInviteNotification(senderUsername: string, inviteId: number) {
		const notificationDiv = document.createElement("div");
		notificationDiv.className = "fixed top-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg shadow-[0_0_15px_rgb(34,197,94)] border border-green-400/50 backdrop-blur-sm z-50 max-w-sm";
		notificationDiv.innerHTML = `
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-3">
					<div class="text-green-200">🎮</div>
					<div>
						<div class="font-medium">Game Invitation</div>
						<div class="text-sm text-green-200">${senderUsername} wants to play Pong!</div>
					</div>
				</div>
				<div class="flex gap-2">
					<button class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors" onclick="acceptGameInvite(${inviteId})">
						Accept
					</button>
					<button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors" onclick="declineGameInvite(${inviteId})">
						Decline
					</button>
				</div>
			</div>
		`;
		document.body.appendChild(notificationDiv);

		// Auto-remove after 30 seconds
		setTimeout(() => {
			if (notificationDiv.parentNode) {
				notificationDiv.remove();
			}
		}, 30000);
	}

	function showSuccessMessage(message: string) {
		const successDiv = document.createElement("div");
		successDiv.className = "fixed top-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg shadow-[0_0_15px_rgb(34,197,94)] border border-green-400/50 backdrop-blur-sm z-50";
		successDiv.innerHTML = `
			<div class="flex items-center gap-3">
				<div class="text-green-200">✅</div>
				<div class="font-medium">${message}</div>
			</div>
		`;
		document.body.appendChild(successDiv);

		setTimeout(() => {
			successDiv.remove();
		}, 5000);
	}

	function showTournamentNotification(message: string) {
		const notificationDiv = document.createElement("div");
		notificationDiv.className = "fixed top-4 left-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-lg shadow-[0_0_15px_rgb(147,51,234)] border border-purple-400/50 backdrop-blur-sm z-50 max-w-sm";
		notificationDiv.innerHTML = `
			<div class="flex items-center gap-3">
				<div class="text-purple-200">🏆</div>
				<div>
					<div class="font-medium">Tournament Notification</div>
					<div class="text-sm text-purple-200">${message}</div>
				</div>
			</div>
		`;
		document.body.appendChild(notificationDiv);

		setTimeout(() => {
			notificationDiv.remove();
		}, 8000);
	}

	// Make functions globally available for onclick handlers
	(window as any).acceptGameInvite = (inviteId: number) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: "accept_game_invite",
				inviteId: inviteId
			}));
		}
		// Remove the notification
		const notification = document.querySelector('.fixed.top-4.right-4');
		if (notification) {
			notification.remove();
		}
	};

	(window as any).declineGameInvite = (inviteId: number) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: "decline_game_invite",
				inviteId: inviteId
			}));
		}
		// Remove the notification
		const notification = document.querySelector('.fixed.top-4.right-4');
		if (notification) {
			notification.remove();
		}
	};

	// Event listeners
	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			sendMessage();
		}
	});

	// Connect to WebSocket when page loads
	connectWebSocket();
	addRefreshButton();
}

function refreshOnlineUsersList() {
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(
			JSON.stringify({
				type: "get_online_users",
			})
		);
	}
}

// Ajouter un bouton de rafraîchissement dans l'interface
function addRefreshButton() {
	// Chercher le header des utilisateurs en ligne de manière plus sûre
	const onlineUsersSection =
		document.querySelector("#online-users-list")?.parentElement;
	if (onlineUsersSection) {
		const header = onlineUsersSection.querySelector(".p-4") as HTMLElement;
		if (header) {
			const refreshButton = document.createElement("button");
			refreshButton.className = `ml-2 ${classes.actionButton} text-xs`;
			refreshButton.innerHTML = '<span class="relative z-10">🔄</span>';
			refreshButton.title = "Rafraîchir la liste";
			refreshButton.addEventListener("click", refreshOnlineUsersList);
			header.appendChild(refreshButton);
		}
	}
}