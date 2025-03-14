const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

if (!loggedInUser) {
    window.location.href = '/';
} else {
    updateSidebar();
    loadPortfolio();
}

// ✅ Wisselkoersen voor conversie
const conversionRates = {
    EUR: 1,
    USD: 1.03,
    CHF: 0.94
};

function updateSidebar() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay');
    const pageTitle = document.querySelector('.page-title');

    if (!loggedInUser || loggedInUser.solde === undefined) {
        balanceDisplay.innerText = "Saldo: €0.00";
        pageTitle.innerText = `Ingelogd als ${loggedInUser?.usernameshow || "Onbekend"} • Saldo: €0.00`;
    } else {
        balanceDisplay.innerText = `Saldo: €${loggedInUser.solde.toFixed(2)}`;
        pageTitle.innerText = `Ingelogd als ${loggedInUser.usernameshow} • Saldo: €${loggedInUser.solde.toFixed(2)}`;
    }

    if (usernameDisplay) {
        usernameDisplay.innerText = `Gebruikersnaam: ${loggedInUser?.usernameshow || "Onbekend"}`;
    }
}

function navigateTo(page) {
    window.location.href = page;
}

function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
}

let portfolio = [];
let lastTransactionTime = 0;

// ✅ Laadt de portefeuille
function loadPortfolio() {
    fetch('/users/users.json')
    .then(response => response.json())
    .then(usersData => {
        const user = usersData.users.find(u => u.username === loggedInUser.username);
        if (user) {
            loggedInUser.solde = user.solde;
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
            updateSidebar();

            portfolio = user.portfolio;
            renderPortfolio();
        }
    })
    .catch(err => console.error("Fout bij ophalen van portefeuille:", err));
}

// ✅ Render portefeuille met correcte totale waarde
function renderPortfolio() {
    const portfolioContainer = document.getElementById("portfolioContainer");
    const totalPortfolioValueElement = document.getElementById("totalPortfolioValue");
    portfolioContainer.innerHTML = "";

    let totalPortfolioValue = 0;

    if (!portfolio || portfolio.length === 0) {
        portfolioContainer.innerHTML = "<tr><td colspan='5'>Geen activa in portefeuille</td></tr>";
        totalPortfolioValueElement.innerText = "Totale Portefeuille Waarde: €0.00";
        return;
    }

    portfolio.forEach((item, index) => {
        let itemValueInEUR = item.amount * item.price * (1 / (conversionRates[item.currency] || 1)); // ✅ Omrekening naar EUR
        totalPortfolioValue += itemValueInEUR;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.amount}</td>
            <td>${item.price.toFixed(2)} ${item.currency}</td>
            <td>${item.isin || "Niet opgegeven"}</td>
            <td><button class="sell-btn" onclick="openSellPopup(${index})">Verkoop</button></td>
        `;
        portfolioContainer.appendChild(row);
    });

    // ✅ Update totale portefeuillewaarde correct
    totalPortfolioValueElement.innerText = `Totale Portefeuille Waarde: €${totalPortfolioValue.toFixed(2)}`;
}


// ✅ Open aankoop popup
function openBuyPopup() {
    let name = document.getElementById('buyName').value.trim();
    let isin = document.getElementById('buyISIN').value.trim();
    let amount = parseFloat(document.getElementById('buyAmount').value);
    let price = parseFloat(document.getElementById('buyPrice').value);
    let currency = document.getElementById('buyCurrency').value;

    if (!name || isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) {
        alert("❌ Vul alle velden correct in.");
        return;
    }

    let totalInEUR = amount * price * (1 / conversionRates[currency]); 
    let fee = totalInEUR < 10 ? 2 : totalInEUR < 100 ? 4 : totalInEUR < 1000 ? 8 : 13;
    let totalCost = totalInEUR + fee;

    if (loggedInUser.solde < totalCost) {
        alert("❌ Onvoldoende saldo voor deze aankoop!");
        return;
    }

    document.getElementById('buyDetails').innerHTML = `
        <p>Aankoop van: <strong>${name}</strong></p>
        <p>ISIN-code: ${isin || "Niet opgegeven"}</p>
        <p>Aantal: ${amount}</p>
        <p>Actuele prijs: ${price} ${currency}</p>
        <p>Transactiekosten: ${fee.toFixed(2)} EUR</p>
        <p><strong>Totaal: ${totalCost.toFixed(2)} EUR</strong></p>
    `;

    document.getElementById('buyPopup').style.display = "block";
}

function confirmBuy() {
    let now = Date.now();
    if (now - lastTransactionTime < 30000) {
        alert("❌ Wacht 30 seconden voor een nieuwe aankoop.");
        return;
    }
    lastTransactionTime = now;

    let name = document.getElementById('buyName').value.trim();
    let isin = document.getElementById('buyISIN').value.trim();
    let amount = parseFloat(document.getElementById('buyAmount').value);
    let price = parseFloat(document.getElementById('buyPrice').value);
    let currency = document.getElementById('buyCurrency').value;

    fetch('/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser.username, name, isin, amount, price, currency })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loggedInUser.solde = data.newBalance;
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        updateSidebar();
        loadPortfolio();
        closePopup();
    })
    .catch(err => {
        alert("❌ Fout bij aankoop: " + err.message);
        console.error("Fout bij kopen:", err);
    });
}

// ✅ Open verkoop popup
function openSellPopup(index) {
    const item = portfolio[index];
    if (!item) {
        console.error("❌ Ongeldige index bij verkoop");
        return;
    }

    document.getElementById('sellDetails').innerHTML = `
        <p>Verkoop van: <strong>${item.name}</strong></p>
        <p>Aantal in bezit: ${item.amount}</p>
        <p>Aankoopprijs: ${item.price.toFixed(2)} ${item.currency}</p>
    `;

    document.getElementById('sellAmount').setAttribute("max", item.amount);
    document.getElementById('sellAmount').dataset.index = index; // ✅ Opslaan van index
    document.getElementById('sellPopup').style.display = "block";
}


function confirmSell() {
    let index = document.getElementById('sellAmount').dataset.index;
    if (index === undefined) {
        alert("❌ Er is een fout opgetreden. Probeer opnieuw.");
        return;
    }

    const item = portfolio[index];
    if (!item) {
        console.error("❌ Geen geldig item bij verkoop");
        return;
    }

    let sellAmount = parseFloat(document.getElementById('sellAmount').value);
    let sellPrice = parseFloat(document.getElementById('sellPrice').value);

    if (isNaN(sellAmount) || sellAmount <= 0 || sellAmount > item.amount || isNaN(sellPrice) || sellPrice <= 0) {
        alert("❌ Ongeldige invoer");
        return;
    }

    fetch('/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: loggedInUser.username, 
            name: item.name, 
            amount: sellAmount, 
            buyPrice: item.price, 
            sellPrice: sellPrice,
            currency: item.currency
        })
    })
    .then(response => response.text()) // Eerst als tekst loggen om te zien wat de server terugstuurt
    .then(data => {
        console.log("Server response:", data); // Debugging
        return JSON.parse(data); // Probeer dan pas te parsen als JSON
    })
    .then(data => {
        alert(data.message);
        loggedInUser.solde = data.newBalance;
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        updateSidebar();
        loadPortfolio();
        closePopup();
    })
    .catch(err => console.error("Fout bij verkopen:", err));    
}


// ✅ Popup sluiten
function closePopup() {
    document.getElementById('buyPopup').style.display = "none";
    document.getElementById('sellPopup').style.display = "none";
}
