export function createProfilePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-cyan-100";

	page.innerHTML = `
	<div class="card max-w-2xl w-full bg-white flex flex-col items-center">
	  <header class="w-full flex items-center gap-4 mb-6">
		<button class="btn" data-route="/home">← Retour</button>
		<h2 class="text-2xl font-bold text-gray-900">Mon Profil</h2>
	  </header>
	  <main class="w-full flex flex-col items-center">
		<div class="flex items-center gap-6 mb-8">
			<div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200 avatar-container" style="position:relative;">
				<img src="/default-avatar.png" alt="Avatar" id="user-avatar" class="w-full h-full object-cover">
				<button id="edit-avatar" title="Edit avatar" class="edit-avatar-btn"
					style="
						background:rgba(255,255,255,0.8);
						border:none;
						position:absolute;
						top:50%;
						left:50%;
						transform:translate(-50%,-50%);
						cursor:pointer;
						z-index:10;
						border-radius:50%;
						padding:8px;
						display:flex;
						align-items:center;
						justify-content:center;
						opacity:0;
						pointer-events:none;
						transition: opacity 0.2s;
						">
				<img src="../assets/edit.svg" alt="Edit" style="width:20px; height:20px;">
				</button>
				<input type="file" id="avatar-file-input" accept="image/png, image/jpeg" style="display:none;" />
			</div>
			<div style="display: flex; align-items: center; gap: 8px;">
				<h3 id="username" class="text-2xl font-bold text-gray-900 mb-2">Nom d'utilisateur</h3>
				<button id="edit-profile" title="Edit username" style="background:none; border:none; cursor:pointer; margin-bottom: 8px;">
					<img src="../assets/edit.svg" alt="Edit" style="width:18px; height:18px;">
				</button>
			</div>
			<p id="user-stats" class="text-gray-600">Parties jouées: 0 | Victoires: 0</p>
		</div>
	  </main>
	</div>
  `;

	getUserInfo().then(data =>{
		if (data){
			const usernameElem = page.querySelector('#username');
			console.log(data.username);
			if (usernameElem) usernameElem.textContent = data.username;
			const avatarElem = page.querySelector('#user-avatar')
			if (avatarElem && data.avatarUrl) avatarElem.setAttribute('src', data.avatarUrl);
		}
	});

	page.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute('data-route');
		if (route) {
		import('../router/router.js').then(({ router }) => {
			router.navigate(route);
		});
		}
	});

	page.addEventListener("edit-avatar", (e) => {
		e.preventDefault();
		editAvatar(page);
	});

	page.addEventListener("edit-profile", (e) => {
		e.preventDefault();
		editAvatar(page);
	});
	return page;
}

async function getUserInfo(){
	const username = localStorage.getItem('username');
	if (username){
		const response = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
		const data = await response.json();
		return data;
	} else {
		console.error("Cant find user");
		return null;
	}
}

//ADD EDIT PROFIL FUNCTION

//ADD CHANGE AVATAR FUNCTION
async function editAvatar(page: HTMLDivElement){
	const editAvatarBtn = page.querySelector("#edit-avatar") as HTMLButtonElement;
	const fileInput = page.querySelector("#avatar-file-input") as HTMLInputElement;
	const avatarImg = page.querySelector("#user-avatar") as HTMLImageElement;

	if (editAvatarBtn && fileInput && avatarImg){
		editAvatarBtn.addEventListener("click", (e) => {
			//e.preventDefault();
			fileInput.click();
		});
		fileInput.addEventListener("Edit", (e) => {
			const file = fileInput.files?.[0];
			if (file){
				const reader = new FileReader;
				reader.onload = function(evt){
					if (evt.target && typeof evt.target.result === "string")
						avatarImg.src = evt.target.result;
						updateDbAvatar(file);
				}
				reader.readAsDataURL(file);
			}
		});
	}
}

async function updateDbAvatar(file: File){
	const formData = new FormData;
	const username = localStorage.getItem("username");
	formData.append('avatar', file);
	formData.append('username', username || '');

	const response = await fetch('/api/profile/avatar', {
		method: 'POST',
		body: formData,
	});
	if (response.ok){
		console.log('Avatar updated!');
	} else {
		console.error('Failed to update avatar');
	}
}
