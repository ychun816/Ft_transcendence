export function createChatPage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'min-h-screen bg-gradient-to-br from-purple-100 to-pink-100';
  
  page.innerHTML = `
    <header class="bg-white shadow-sm p-4 flex items-center gap-4">
      <button class="btn" data-route="/home">← Retour</button>
      <h2 class="text-2xl font-bold text-gray-900">Chat</h2>
    </header>
    <main class="flex flex-col h-[calc(100vh-80px)]">
      <div class="flex-1 p-4 overflow-y-auto" id="chat-messages">
        <!-- Messages apparaîtront ici -->
      </div>
      <div class="bg-white border-t p-4 flex gap-2">
        <input type="text" placeholder="Tapez votre message..." id="message-input" class="input flex-1">
        <button id="send-message" class="btn">Envoyer</button>
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