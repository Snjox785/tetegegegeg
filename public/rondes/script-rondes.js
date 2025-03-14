// Ophalen van gebruikersinformatie
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

if (!loggedInUser) {
    // Als er geen gebruiker is ingelogd, terug naar de inlogpagina
    window.location.href = '/'; 
} else {
    // Toon gebruikersnaam en saldo in de sidebar
    document.getElementById('usernameDisplay').innerText = "Gebruiker: " + loggedInUser.usernameshow;
    document.getElementById('balanceDisplay').innerText = "Saldo: €" + loggedInUser.solde.toFixed(2);
}

// Navigatie en logout functies
function navigateTo(page) {
    window.location.href = page;
}

function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
}

// Sluit pop-up met ESC-toets
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closePopup();
    }
});

// Leaderboard data ophalen
fetch('/users/users.json')
    .then(response => response.json())
    .then(usersData => {
        let users = usersData.users.sort((a, b) => b.solde - a.solde).slice(0, 50);
        let leaderboardContainer = document.getElementById('leaderboardContainer');

        users.forEach(user => {
            let div = document.createElement('div');
            div.classList.add('leaderboard-item');
            div.innerHTML = `<span>${user.usernameshow}</span> <span>€${user.solde.toFixed(2)}</span>`;
            div.onclick = () => openUserPopup(user);
            leaderboardContainer.appendChild(div);
        });
    })
    .catch(err => console.error("Fout bij laden klassement:", err));

// Pop-up openen
function openUserPopup(user) {
    document.getElementById('popupUsername').innerText = user.usernameshow;
    document.getElementById('popupBalance').innerText = user.solde.toFixed(2);

    let activePortfolio = document.getElementById('activePortfolio');
    activePortfolio.innerHTML = (user.portfolio && user.portfolio.length > 0) ? user.portfolio.map(item => `
        <div class="info-box">
            <strong>Transactie ID:</strong> ${item.id} <br>
            <strong>Naam:</strong> ${item.name} <br>
            <strong>Aankoop Prijs:</strong> ${item.price.toFixed(2)} <br>
            <strong>Valuta:</strong> ${item.currency} <br>
            <strong>Aantal:</strong> ${item.amount} <br>
            <strong>Datum:</strong> ${new Date(item.date).toLocaleString()}
        </div>
    `).join('') : "<p>Geen actieve activa</p>";    

    fetch('/data/olddata.json')
        .then(response => response.json())
        .then(oldData => {
            let soldItems = oldData.filter(i => i.username === user.username);
            let soldAssets = document.getElementById('soldAssets');

            soldAssets.innerHTML = (soldItems.length > 0) ? soldItems.map(item => `
                <div class="info-box">
                    <strong>Transactie ID:</strong> ${item.id} <br>
                    <strong>Naam:</strong> ${item.name} <br>
                    <strong>Koopdatum:</strong> ${new Date(item.buyDate).toLocaleString()} <br>
                    <strong>Verkoopdatum:</strong> ${new Date(item.sellDate).toLocaleString()} <br>
                    <strong>Koopprijs:</strong> ${item.buyPrice.toFixed(2)} <br>
                    <strong>Verkoopprijs:</strong> ${item.sellPrice.toFixed(2)} <br>
                    <strong>Valuta:</strong> ${item.currency} <br>
                    <strong>Aantal:</strong> ${item.amount} <br>
                    <strong>Winst/Verlies:</strong> <span class="${item.sellPrice > item.buyPrice ? 'profit' : 'loss'}">
                        ${(item.sellPrice > item.buyPrice ? '+' : '') + ((item.sellPrice / item.buyPrice - 1) * 100).toFixed(2)}%
                    </span>
                </div>
            `).join('') : "<p>Geen verkochte activa</p>";            
        });

    document.getElementById('userPopup').style.display = 'flex';
}

document.getElementById('closePopup').onclick = () => {
    document.getElementById('userPopup').style.display = 'none';
};

// Pop-up sluiten met ESC en knop
function closePopup() {
    document.getElementById('userPopup').style.display = 'none';
}