// Ophalen van gebruikersinformatie
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

if (!loggedInUser) {
    // Als er geen gebruiker is ingelogd, wordt de gebruiker teruggestuurd naar de inlogpagina
    window.location.href = '/'; 
} else {
    // Toon gebruikersnaam en saldo
    document.getElementById('usernameDisplay').innerText = "Gebruikersnaam: " + loggedInUser.usernameshow;
    document.getElementById('balanceDisplay').innerText = "Saldo: €" + loggedInUser.solde.toFixed(2);
}

// Navigatiefuncties
function navigateTo(page) {
    window.location.href = page;
}

// Uitlogfunctionaliteit
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
}

document.addEventListener("DOMContentLoaded", function () {
    if (loggedInUser) {
        document.getElementById("popupUsername").innerText = loggedInUser.usernameshow;
        document.getElementById("welcomePopup").style.display = "flex";
    }
});

// Functie om pop-up te sluiten
function closeWelcomePopup() {
    document.getElementById("welcomePopup").style.display = "none";
}

// ESC toets om pop-up te sluiten
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeWelcomePopup();
    }
});