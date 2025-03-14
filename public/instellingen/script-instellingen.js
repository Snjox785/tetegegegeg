// Haal de ingelogde gebruiker op uit localStorage
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

if (!loggedInUser) {
    // Als er geen gebruiker is ingelogd, terug naar inlogpagina
    window.location.href = '/';
} else {
    // Toon de gebruikersinformatie op de instellingenpagina
    document.getElementById('usernameshow').innerText = loggedInUser.usernameshow;
    document.getElementById('username').innerText = loggedInUser.username;
    document.getElementById('permissions').innerText = loggedInUser.grade;
}

// Terug naar dashboard
document.getElementById('backBtn').onclick = () => {
    window.location.href = '../dashboard';
};

// Uitloggen functionaliteit
document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
};

// Wachtwoord pop-up openen/sluiten
// Pop-up openen en sluiten
const passwordPopup = document.getElementById('passwordPopup');
document.getElementById('changePasswordBtn').onclick = () => {
    passwordPopup.style.display = 'flex';
};
document.getElementById('closePopupBtn').onclick = () => {
    passwordPopup.style.display = 'none';
};


// Wachtwoord wijzigen
document.getElementById('savePasswordBtn').onclick = () => {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const passwordError = document.getElementById('passwordError');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        passwordError.innerText = "Alle velden zijn verplicht!";
        return;
    }

    if (newPassword !== confirmNewPassword) {
        passwordError.innerText = "Nieuwe wachtwoorden komen niet overeen!";
        return;
    }

    fetch('/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: loggedInUser.username, 
            currentPassword, 
            newPassword 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            passwordError.innerText = data.error;
        } else {
            alert("✅ Wachtwoord succesvol gewijzigd!");
            document.getElementById('passwordPopup').style.display = 'none';
        }
    })
    .catch(err => {
        console.error("Fout bij wachtwoord wijzigen:", err);
        passwordError.innerText = "Er is een fout opgetreden.";
    });
};
