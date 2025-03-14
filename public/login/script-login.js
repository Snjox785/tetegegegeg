let usersData = [];

// Laadt gebruikersgegevens uit users.json
fetch('users/users.json')
    .then(response => response.json())
    .then(data => {
        usersData = data.users;
    })
    .catch(error => {
        console.error('Fout bij het laden van gebruikersgegevens:', error);
    });

// Controleert of de gebruiker al is ingelogd en stuurt door naar het dashboard
if (localStorage.getItem('loggedInUser')) {
    window.location.href = 'dashboard';
}

// Selecteert de elementen van het formulier en de DOM
const form = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const showPasswordCheckbox = document.getElementById('show-password');

// Behandelt het indienen van het formulier
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = passwordInput.value;

    // Zoekt de overeenkomstige gebruiker in usersData
    const user = usersData.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    // Verkrijgt het IP-adres van de gebruiker via een externe API
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            const userIP = data.ip;

            if (user) {
                // Slaat het volledige gebruikersobject (inclusief usernameshow) op in localStorage
                localStorage.setItem('loggedInUser', JSON.stringify(user));

                // Bereidt de gegevens voor om naar de Discord-webhook te sturen bij een succesvolle login
                const successPayload = {
                    content: `De gebruiker ${user.usernameshow} is succesvol ingelogd.\nIP-adres: ${userIP}\nTijdstip van inloggen: ${new Date().toLocaleString()}`
                };

                fetch('https://discord.com/api/webhooks/1331334272652546190/Sl6nShoKIGHbyzJu9tb8na0K_smDppZwRSCAiCcqMdyGNoizjm6jraJ0C6GL1uEIPHsq', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(successPayload)
                })
                .then(() => {
                    window.location.href = 'dashboard';
                })
                .catch(err => {
                    console.error('Fout bij het verzenden naar de Discord-webhook:', err);
                });

            } else {
                document.getElementById('error-message').innerText = 'Ongeldige gebruikersnaam of wachtwoord';
                passwordInput.value = '';

                // Bereidt de gegevens voor om naar de Discord-webhook te sturen bij een mislukte login
                const failedPayload = {
                    content: `Mislukte inlogpoging.\nGebruikersnaam: ${username}\nIP-adres: ${userIP}\nTijdstip: ${new Date().toLocaleString()}`
                };

                fetch('https://discord.com/api/webhooks/1331352160491012219/Weu1TidI4cLILtzTHaDzil-tULOORVJkIf7GUBTiPyA2PzhYGpaE8ceEtFv5SoNWQTGS', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(failedPayload)
                })
                .catch(err => {
                    console.error('Fout bij het verzenden naar de Discord-webhook:', err);
                });
            }
        })
        .catch(err => {
            console.error('Fout bij het verkrijgen van het IP-adres:', err);
        });
});

// Beheert de weergave van het wachtwoord
showPasswordCheckbox.addEventListener('change', function() {
    passwordInput.type = showPasswordCheckbox.checked ? 'text' : 'password';
});
