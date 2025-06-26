export function createProfilePage(): HTMLElement {
	const page = document.createElement('div');
	page.className = 'profile-page';

	page.innerHTML = `
		<header class="page-header">
		<button class="back-btn" data-route="/home">← Retour</button>
		<h2>My profile</h2>
		</header>
		<main class="profile-content">
			<div class="profile-info">
			<div class="avatar" style="position:relative; display:inline-block;">
				<img src="/default-avatar.png" alt="Avatar" id="user-avatar" style="vertical-align:middle;">
				<button id="edit-avatar" title="Edit avatar" style="background:none; border:none; position:absolute; bottom:8px; right:8px; cursor:pointer;">
				<img src="../assets/edit.svg" alt="Edit" style="width:20px; height:20px;">
				</button>
				<input type="file" id="avatar-file-input" accept="image/png, image/jpeg" style="display:none;" />
			</div>
			<div class="user-details" style="display:flex; align-items:center;">
				<h3 id="username" style="margin-right:8px;">Username</h3>
				<button type="" id="edit-profile" title="Edit username" style="background:none; border:none; cursor:pointer;">
				<img src="../assets/edit.svg" alt="Edit" style="width:18px; height:18px;">
				</button>
			</div>
			<p id="user-stats">Parties jouées: 0 | Victoires: 0</p>
			</div>
		</main>
	`;

	getUserInfo().then(data =>{
	  if (data){
		const usernameElem = page.querySelector('#username');
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