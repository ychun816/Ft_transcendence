import { text } from 'stream/consumers';

export function createProfilePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-cyan-100";

	page.innerHTML = `
	<div class="card max-w-2xl w-full bg-white flex flex-col items-center">
	  <header class="w-full flex items-center gap-4 mb-6">
		<button class="btn" data-route="/home">← Retour</button>
		<h2 class="text-2xl font-bold text-gray-900">My profile</h2>
	  </header>
	  <main class="w-full flex flex-col items-center">
		<div class="flex items-center gap-6 mb-8">
			<div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200 avatar-container" style="position:relative;">
				<img src="/default-avatar.png" alt="Avatar" id="user-avatar" class="w-full h-full object-cover">
				<button id="edit-avatar" title="Edit avatar" class="edit-avatar-btn"
					style="
						background:none;
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
						transition: opacity 0.2s;
						">
				<img src="../assets/edit.svg" alt="Edit" style="width:20px; height:20px;">
				</button>
				<input type="file" id="avatar-file-input" accept="image/png, image/jpeg" style="display:none;" />
			</div>
			<div class="mb-8">
				<div style="display: flex; align-items: center; gap: 8px;">
					<h3 id="username" class="text-2xl font-bold text-gray-900 mb-2">Username</h3>
					<button id="edit-username" title="Edit username" style="background:none; border:none; cursor:pointer; margin-bottom: 8px;">
						<img src="../assets/edit.svg" alt="Edit" style="width:18px; height:18px;">
					</button>
				</div>
				<div style="display: flex; align-items: center; gap: 8px;">
					<h3 id="password" class="text-base text-gray-900 mb-2">Password: **********</h3>
					<button id="edit-password" title="Edit password" style="background:none; border:none; cursor:pointer; margin-bottom: 8px;">
						<img src="../assets/edit.svg" alt="Edit" style="width:18px; height:18px;">
					</button>
				</div>
				<div style="display: flex; align-items: center; gap: 8px;">
					<p id="user-stats" class="text-gray-600">Games played: 0 | Wins: 0 | Losses: 0</p>
				</div>
			</div>
		</div>
	  </main>
	</div>
	<div id="match-block" class="card max-w-2xl w-full bg-white flex flex-col items-end h-[80vh] mx-[5%]">
		<header class="w-full flex items-center gap-4 mb-6">
			<h2 class="text-2xl font-bold text-gray-900 justify-center">Match History</h2>
		</header>
		<main class="w-full flex flex-col items-center">

		</main>
	</div>

  `;
  	editAvatar(page);
	editUsername(page);
	editPassword(page);

	getUserInfo().then(data =>{
		if (data){
			const usernameElem = page.querySelector('#username') as HTMLElement;
			if (usernameElem) usernameElem.textContent = data.username;

			const avatarElem = page.querySelector('#user-avatar') as HTMLImageElement;
			console.log("Avatar URL reçue :", data.avatarUrl);
			if (avatarElem && data.avatarUrl) avatarElem.setAttribute('src', data.avatarUrl);

			const statElem = page.querySelector("#user-stats") as HTMLElement;
			console.log("gamesPlayed reçue :", data.gamesPlayed);
			console.log("wins reçue :", data.wins);
			console.log("losses reçue :", data.losses);
			if (statElem && data.gamesPlayed && data.wins &&  data.losses){
				statElem.textContent = `Games played: ${data.gamesPlayed} | Wins: ${data.wins} | Losses: ${data.losses}`
			}
		}
	});

	displayMatchHistory(page);

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

async function getUserInfo(){
	const username = localStorage.getItem('username');
	console.log("username: ", username);
	if (username){
		console.log("encodeURIComponent(username): ", encodeURIComponent(username));
		const response = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
		const data = await response.json();
		if (data)
		{
			console.log("data.avatarUrl: ", data.avatarUrl)
			return data;
		}
	} else {
		console.error("Cant find user");
		return null;
	}
}

//ADD EDIT USERNAME FUNCTION
async function editUsername(page: HTMLDivElement){
	const usernameElem = page.querySelector("#username") as HTMLElement;
	const editUsernameBtn = page.querySelector("#edit-username") as HTMLButtonElement;

	if (usernameElem && editUsernameBtn){
		editUsernameBtn.addEventListener("click", () => {
			enableInlineEdit({
				element: usernameElem,
				initialValue: usernameElem.textContent || "",
				inputType: "string",
				onValidate: async (newValue) => {
					const UserInfo = {
							username: usernameElem.textContent,
							newUsername: newValue,
					};
					const response = await fetch('/api/profile/username', {
						method: "POST",
						headers:{
							"Content-Type": "application/json"
						},
						body: JSON.stringify(UserInfo),
					});
					const data = await response.json();
					if (data.ok || data.success){
						console.log("Username succesfully edited!");
						localStorage.removeItem('username');
						localStorage.setItem('username', newValue);
						usernameElem.textContent = newValue;
					} else {
						alert("Error editing username");
					}
				}
			});
		});
	}
}

async function editPassword(page: HTMLDivElement){
	const passwordElem = page.querySelector('#password') as HTMLElement;
	const editPasswordBtn = page.querySelector('#edit-password') as HTMLButtonElement;
	if (passwordElem && editPasswordBtn) {
		editPasswordBtn.addEventListener("click", () => {
			enableInlineEdit({
				element: passwordElem,
				initialValue: "",
				inputType: "password",
				onValidate: async (newValue) => {
					const UserInfo = {
							username: localStorage.getItem('username'),
							newPassword: newValue,
					};
					const response = await fetch('/api/profile/password', {
						method: "POST",
						headers:{
							"Content-Type": "application/json"
						},
						body: JSON.stringify(UserInfo),
					});
					const data = await response.json();
					if (data.ok || data.success){
						console.log("Password succesfully edited!");
					} else {
						alert("Error editing password");
					}
					passwordElem.textContent = "Password: **********";
				}
			});
		});
	}
}

function enableInlineEdit({element, initialValue, onValidate, inputType = "text"} :
	{
		element: HTMLElement,
		initialValue: string,
		onValidate: (newValue: string) => Promise<void> | void,
		inputType?: string,
	}) {
		const input = document.createElement("input");
		input.type = inputType;
		input.value = initialValue;
		input.className = "input";
		input.style.marginRight = "8px";
		input.style.width = "auto";
		input.style.display = "inline-block";

		const validateBtn = document.createElement("button");
		validateBtn.textContent = "Validate";
		validateBtn.className = "btn";
		validateBtn.type = "button";

		const cancelBtn = document.createElement("button");
		cancelBtn.textContent = "Cancel";
		cancelBtn.className = "btn";
		cancelBtn.type = "button";
		cancelBtn.style.marginLeft = "8px";

		const parent = element.parentElement;
		const oldContent = element.cloneNode(true);

		parent?.replaceChild(input, element);
		parent?.appendChild(validateBtn);
		parent?.appendChild(cancelBtn);

		const cleanup = () => {
			parent?.replaceChild(oldContent, input);
			validateBtn.remove();
			cancelBtn.remove();
		};

		validateBtn.onclick = async () => {
			await onValidate(input.value);
			cleanup();
		};
		cancelBtn.onclick = cleanup;

		input.focus();
		input.onkeydown = (e) => {
			if (e.key === "Escape") cleanup();
			if (e.key === "Enter") validateBtn.click();
		};
}

//CHANGE AVATAR FUNCTION
async function editAvatar(page: HTMLDivElement){
	const editAvatarBtn = page.querySelector("#edit-avatar") as HTMLButtonElement;
	const fileInput = page.querySelector("#avatar-file-input") as HTMLInputElement;
	const avatarImg = page.querySelector("#user-avatar") as HTMLImageElement;

	if (editAvatarBtn && fileInput && avatarImg){
		editAvatarBtn.addEventListener("click", (e) => {
			//e.preventDefault();
			fileInput.click();
		});
		fileInput.addEventListener("change", (e) => {
			const file = fileInput.files?.[0];
			console.log("file: ", file);
			if (file){
				const reader = new FileReader;
				reader.onload = async function(evt){
					if (evt.target && typeof evt.target.result === "string")
					{
						const avatarUrl = await updateDbAvatar(file);
						console.log('avatarUrl: ', avatarUrl);
						if (avatarUrl)
							avatarImg.src = avatarUrl;
					}
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
		const data = await response.json();
		console.log('Avatar updated!', data);
		if (data.avatarPath && typeof data.avatarPath === 'string') {
			// 🔍 Ajout d'un timestamp pour éviter le cache
			const timestampedUrl = `${data.avatarPath}?t=${Date.now()}`;
			console.log('URL avec timestamp:', timestampedUrl);
			return timestampedUrl;
		} else {
			console.error('Failed to update avatar');
			return null;
		}
	}
	return null;
}


async function getMatchHistory(){
	console.log("ENTER IN GET MATCH HISTORY");
	const username = localStorage.getItem("username");
	if (!username) return null;
	const response = await fetch(`/api/profile/matches?username=${encodeURIComponent(username)}`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});
	console.log("Match History Response: ", response);
	if (response.ok)
	{
		const matches = await response.json();
		console.log('Match history retrieved!', matches);
		return matches;
	} else {
		console.error('Failed to retreive match history');
		return null;
	}
}

async function displayMatchHistory(page: HTMLDivElement)
{
	console.log("ENTER IN MATCH HISTORY");
	const username = localStorage.getItem("username");
	console.log("USERNAME RETRIEVED : ", username);
	const history = await getMatchHistory();
	console.log("HISTORY RETRIEVED : ", history);
	const histDiv = page.querySelector("#match-block");
	if (!histDiv) return;

	let html = `
		<table class="min-w-full text-left">
			<thead>
				<tr>
					<th>Date</th>
					<th>Adversary</th>
					<th>Result</th>
				</tr>
			</thead>
			<tbody>
	`;

	for (const match of history){
		const isPlayer1 = match.player1.username === username;
		const opponent = isPlayer1 ? match.player2.username : match.player1.username;
		const result = match.winnerId === (isPlayer1 ? match.player1Id : match.player2Id) ? "Victory" : "Defeat";
		const date = new Date(match.playedAt).toLocaleDateString();


	html += `
			<tr>
				<td>${date}</td>
				<td>${opponent}</td>
				<td>${result}</td>
			</tr>
		`;
	}
	html += `</tbody></table>`;
	histDiv.innerHTML = html;
}