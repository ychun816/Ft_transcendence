export function createChatPage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'chat-page';
  
  page.innerHTML = `
    <header class="page-header">
      <button class="back-btn" data-route="/home">← Retour</button>
      <h2>Chat</h2>
    </header>
    <main class="chat-container">
      <div class="chat-messages" id="chat-messages">
        <!-- Messages apparaîtront ici -->
      </div>
      <div class="chat-input">
        <input type="text" placeholder="Tapez votre message..." id="message-input">
        <button id="send-message">Envoyer</button>
      </div>
    </main>
  `;
  
  // Navigation et logique de chat
  page.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const route = target.getAttribute('data-route');
    if (route) {
      import('../router/router.js').then(({ router }) => {
        router.navigate(route);
      });
    }
  });
  
  return page;
} 