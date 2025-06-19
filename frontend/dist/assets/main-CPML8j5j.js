class f{constructor(){this.routes=new Map,this.currentPath="",window.addEventListener("popstate",()=>this.handleRoute())}addRoute(n,r){return this.routes.set(n,r),this}navigate(n){this.currentPath!==n&&(this.currentPath=n,window.history.pushState({},"",n),this.handleRoute())}handleRoute(){const n=window.location.pathname,r=this.routes.get(n)||this.routes.get("/404");if(r){const t=document.querySelector("#app");t&&(t.innerHTML="",t.appendChild(r()))}}start(){this.handleRoute()}}const m=new f,d=Object.freeze(Object.defineProperty({__proto__:null,Router:f,router:m},Symbol.toStringTag,{value:"Module"})),E="modulepreload",y=function(e){return"/"+e},p={},l=function(n,r,t){let a=Promise.resolve();if(r&&r.length>0){let c=function(s){return Promise.all(s.map(u=>Promise.resolve(u).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),v=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));a=c(r.map(s=>{if(s=y(s),s in p)return;p[s]=!0;const u=s.endsWith(".css"),h=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${s}"]${h}`))return;const i=document.createElement("link");if(i.rel=u?"stylesheet":E,u||(i.as="script"),i.crossOrigin="",i.href=s,v&&i.setAttribute("nonce",v),document.head.appendChild(i),u)return new Promise((P,_)=>{i.addEventListener("load",P),i.addEventListener("error",()=>_(new Error(`Unable to preload CSS for ${s}`)))})}))}function g(c){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=c,window.dispatchEvent(o),!o.defaultPrevented)throw c}return a.then(c=>{for(const o of c||[])o.status==="rejected"&&g(o.reason);return n().catch(g)})};function b(){const e=document.createElement("div");return e.className="login-page",e.innerHTML=`
    <div class="login-container">
      <h1>Transcendence</h1>
      <form class="login-form">
        <input type="text" placeholder="Username" id="username" required>
        <input type="password" placeholder="Password" id="password" required>
        <button type="submit">Se connecter</button>
        <button type="button" id="register-btn">S'inscrire</button>
      </form>
    </div>
  `,e.querySelector(".login-form").addEventListener("submit",r=>{r.preventDefault(),l(async()=>{const{router:t}=await Promise.resolve().then(()=>d);return{router:t}},void 0).then(({router:t})=>{t.navigate("/home")})}),e}function L(){const e=document.createElement("div");return e.className="home-page",e.innerHTML=`
    <header class="app-header">
      <h1>Transcendence</h1>
      <nav>
        <button class="nav-btn" data-route="/game">Jouer</button>
        <button class="nav-btn" data-route="/profile">Profil</button>
        <button class="nav-btn" data-route="/chat">Chat</button>
        <button class="nav-btn" data-route="/leaderboard">Classement</button>
      </nav>
    </header>
    <main class="home-content">
      <h2>Bienvenue sur Transcendence</h2>
      <p>Le jeu de Pong ultime !</p>
      <button class="play-btn" data-route="/game">Commencer une partie</button>
    </main>
  `,e.addEventListener("click",n=>{const t=n.target.getAttribute("data-route");t&&l(async()=>{const{router:a}=await Promise.resolve().then(()=>d);return{router:a}},void 0).then(({router:a})=>{a.navigate(t)})}),e}function R(){const e=document.createElement("div");return e.className="game-page",e.innerHTML=`
    <header class="game-header">
      <button class="back-btn" data-route="/home">← Retour</button>
      <h2>Pong Game</h2>
      <div class="score">
        <span id="player1-score">0</span> - <span id="player2-score">0</span>
      </div>
    </header>
    <main class="game-container">
      <canvas id="pong-canvas" width="800" height="400"></canvas>
      <div class="game-controls">
        <button id="start-game">Démarrer</button>
        <button id="pause-game">Pause</button>
      </div>
    </main>
  `,e.addEventListener("click",n=>{const t=n.target.getAttribute("data-route");t&&l(async()=>{const{router:a}=await Promise.resolve().then(()=>d);return{router:a}},void 0).then(({router:a})=>{a.navigate(t)})}),e}function w(){const e=document.createElement("div");return e.className="profile-page",e.innerHTML=`
    <header class="page-header">
      <button class="back-btn" data-route="/home">← Retour</button>
      <h2>Mon Profil</h2>
    </header>
    <main class="profile-content">
      <div class="profile-info">
        <div class="avatar">
          <img src="/default-avatar.png" alt="Avatar" id="user-avatar">
        </div>
        <div class="user-details">
          <h3 id="username">Nom d'utilisateur</h3>
          <p id="user-stats">Parties jouées: 0 | Victoires: 0</p>
        </div>
      </div>
      <div class="profile-actions">
        <button id="edit-profile">Modifier le profil</button>
        <button id="change-avatar">Changer l'avatar</button>
      </div>
    </main>
  `,e.addEventListener("click",n=>{const t=n.target.getAttribute("data-route");t&&l(async()=>{const{router:a}=await Promise.resolve().then(()=>d);return{router:a}},void 0).then(({router:a})=>{a.navigate(t)})}),e}function T(){const e=document.createElement("div");return e.className="chat-page",e.innerHTML=`
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
  `,e.addEventListener("click",n=>{const t=n.target.getAttribute("data-route");t&&l(async()=>{const{router:a}=await Promise.resolve().then(()=>d);return{router:a}},void 0).then(({router:a})=>{a.navigate(t)})}),e}function A(){const e=document.createElement("div");return e.className="not-found-page",e.innerHTML=`
    <div class="not-found-container">
      <h1>404</h1>
      <p>Page non trouvée</p>
      <button class="home-btn" data-route="/home">Retour à l'accueil</button>
    </div>
  `,e.addEventListener("click",n=>{const t=n.target.getAttribute("data-route");t&&l(async()=>{const{router:a}=await Promise.resolve().then(()=>d);return{router:a}},void 0).then(({router:a})=>{a.navigate(t)})}),e}m.addRoute("/",b).addRoute("/login",b).addRoute("/home",L).addRoute("/game",R).addRoute("/profile",w).addRoute("/chat",T).addRoute("/404",A);m.start();
