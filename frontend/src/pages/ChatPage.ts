export function createChatPage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100";

	page.innerHTML = `
    <div class="card max-w-2xl w-full bg-white flex flex-col items-center">
      <header class="w-full flex items-center gap-4 mb-6">
        <button class="btn" data-route="/home">← Retour</button>
        <h2 class="text-2xl font-bold text-gray-900">Chat</h2>
      </header>
      <main class="w-full flex flex-col items-center">
        <div class="flex-1 p-4 overflow-y-auto w-full max-h-96 mb-4" id="chat-messages">
          <!-- Messages apparaîtront ici -->
        </div>
        <div class="bg-white border-t p-4 flex gap-2 w-full">
          <input type="text" placeholder="Tapez votre message..." id="message-input" class="input flex-1">
          <button id="send-message" class="btn">Envoyer</button>
        </div>
      </main>
    </div>
  `;

	// WebSocket connection
	let ws: WebSocket | null = null;
	const messagesContainer = page.querySelector(
		"#chat-messages"
	) as HTMLElement;
	const messageInput = page.querySelector(
		"#message-input"
	) as HTMLInputElement;
	const sendButton = page.querySelector("#send-message") as HTMLButtonElement;

	function connectWebSocket() {
		ws = new WebSocket("ws://localhost:3001/ws/chat");

		ws.onopen = () => {
			console.log("🔗 WebSocket connected");
			addMessage("Système", "Connecté au chat", "system");
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log("📨 Received:", data);

				if (data.type === "connection_established") {
					addMessage("Système", data.message, "system");
				} else if (data.type === "chat_message") {
					addMessage("Vous", data.content, "user");
				} else if (data.type === "error") {
					addMessage("Erreur", data.message, "error");
				}
			} catch (error) {
				console.error("❌ Error parsing message:", error);
			}
		};

		ws.onclose = () => {
			console.log("🔌 WebSocket disconnected");
			addMessage("Système", "Déconnecté du chat", "system");
		};

		ws.onerror = (error) => {
			console.error("❌ WebSocket error:", error);
			addMessage("Erreur", "Erreur de connexion", "error");
		};
	}

	function addMessage(
		sender: string,
		content: string,
		type: "user" | "system" | "error"
	) {
		const messageDiv = document.createElement("div");
		messageDiv.className = `mb-2 p-2 rounded ${
			type === "system"
				? "bg-blue-100 text-blue-800"
				: type === "error"
					? "bg-red-100 text-red-800"
					: "bg-gray-100 text-gray-800"
		}`;
		messageDiv.innerHTML = `<strong>${sender}:</strong> ${content}`;
		messagesContainer.appendChild(messageDiv);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	function sendMessage() {
		const message = messageInput.value.trim();
		if (message && ws && ws.readyState === WebSocket.OPEN) {
			const data = {
				type: "chat_message",
				content: message,
				timestamp: new Date().toISOString(),
			};
			ws.send(JSON.stringify(data));
			messageInput.value = "";
		}
	}

	// Event listeners
	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			sendMessage();
		}
	});

	// Navigation
	page.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute("data-route");
		if (route) {
			if (ws) {
				ws.close();
			}
			import("../router/router.js").then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	// Connect to WebSocket when page loads
	connectWebSocket();

	return page;
}
