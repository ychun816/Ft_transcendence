export function createChatPage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'chat-page';
  
  page.innerHTML = `
    <header class="page-header">
      <button classname="text-blue-500 font-bold text-lg mb-4" data-route="/home">← Retour</button>
      <h2>Chat</h2>
    </header>
    <main class="chat-container">
      <div class="chat-messages" id="chat-messages">
        <!-- Messages apparaîtront ici -->
      </div>
      <div classname="">
        <input type="text" placeholder="Tapez votre message..." id="message-input">
        <button id="send-message">Envoyer</button>
      </div>
    </main>
  `;
  
  page.addEventListener('click', (e) => {
    /*
    This function is called when the user clicks on a button.
    It finds the targeted route and navigates to it.
    */
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