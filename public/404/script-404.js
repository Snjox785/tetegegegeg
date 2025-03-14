document.addEventListener("DOMContentLoaded", function () {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay');
    
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (loggedInUser) {
        usernameDisplay.innerText = "Gebruiker: " + loggedInUser.usernameshow;
        balanceDisplay.innerText = "Saldo: €" + loggedInUser.solde.toFixed(2);
    } else {
        usernameDisplay.innerText = "Je bent niet ingelogd!";
        balanceDisplay.innerText = "";
    }
});

function navigateTo(page) {
    window.location.href = page;
}

function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
}
