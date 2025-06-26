export function createNotFoundPage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'min-h-screen bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center';
  
  page.innerHTML = `
    <div class="card text-center">
      <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p class="text-xl text-gray-600 mb-8">Page non trouvée</p>
      <button class="btn" data-route="/home">Retour à l'accueil</button>
    </div>
  `;
  

  page.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const route = target.getAttribute('data-route');
    if (route) {
      /*
      This function is called when the user clicks on a button.
      It finds the targeted route and navigates to it.
      */
      import('../router/router.js').then(({ router }) => {
        router.navigate(route);
      });
    }
  });
  
  return page;
} 