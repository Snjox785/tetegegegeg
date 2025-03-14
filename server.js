const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8080;

// Middleware voor JSON-parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische bestanden serveren
app.use(express.static(path.join(__dirname, 'public')));
app.use('/users', express.static(path.join(__dirname, 'users')));
app.use('/data', express.static(path.join(__dirname, 'data')));

const conversionRates = {
    EUR: 1,
    USD: 1.03,
    CHF: 0.95
};


// **ROUTES VOOR PAGINA'S**
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'index.html'));
});
app.get('/beurs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'beurs', 'beurs.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'dashboard.html'));
});
app.get('/instellingen', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'instellingen', 'instellingen.html'));
});
app.get('/rondes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rondes', 'rondes.html'));
});
app.get('/excel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'excel', 'excel.html'));
});
app.get('/users/users.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'users', 'users.json'));
});

app.get('/data/olddata.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'data', 'olddata.json'));
});
app.get('/404', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '404', '404.html'));
});

// **Aankooproute**
app.post('/buy', (req, res) => {
    const { username, name, isin, amount, price, currency } = req.body;
    const timestamp = new Date().toISOString();

    if (!username || !name || isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) {
        return res.status(400).json({ error: "Ongeldige invoer." });
    }

    let usersFile = path.join(__dirname, 'users', 'users.json');
    let usersData = JSON.parse(fs.readFileSync(usersFile));
    let user = usersData.users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden." });

    let totalCost = amount * price * (conversionRates[currency] || 1);
    let fee = totalCost < 10 ? 5 : totalCost < 100 ? 4 : totalCost < 1000 ? 3 : 2;
    totalCost += fee;

    if (user.solde < totalCost) {
        return res.status(400).json({ error: "Onvoldoende saldo." });
    }

    user.solde -= totalCost;
    user.portfolio = user.portfolio || [];
    let item = user.portfolio.find(i => i.name === name);
    if (item) {
        item.amount += amount;
    } else {
        user.portfolio.push({ id: Date.now(), name, isin, amount, price, currency, date: timestamp });
    }

    fs.writeFileSync(usersFile, JSON.stringify(usersData, null, 2));
    res.status(200).json({ message: "Aankoop succesvol!", newBalance: user.solde });
});

// **Verkooproute**
app.post('/sell', (req, res) => {
    const { username, name, amount, sellPrice, buyPrice, currency } = req.body;
    const timestamp = new Date().toISOString();

    let usersFile = path.join(__dirname, 'users', 'users.json');
    let oldDataFile = path.join(__dirname, 'data', 'olddata.json');

    let usersData = JSON.parse(fs.readFileSync(usersFile));
    let oldData = JSON.parse(fs.readFileSync(oldDataFile));

    let user = usersData.users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden." });

    let item = user.portfolio.find(i => i.name === name);
    if (!item || item.amount < amount) {
        return res.status(400).json({ error: "Onvoldoende aandelen." });
    }

    let profitLoss = ((sellPrice - buyPrice) / buyPrice) * 100;

    if (!conversionRates[currency]) {
        return res.status(400).json({ error: `Ongeldige valuta: ${currency}` });
    }
    let totalSaleValue = amount * sellPrice * (1 / conversionRates[currency]); // ✅ Correcte conversie naar EUR     
    user.solde += totalSaleValue;

    item.amount -= amount;
    if (item.amount === 0) {
        user.portfolio = user.portfolio.filter(i => i.name !== name);
    }

    const uniqueTransactionID = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    oldData.push({
        username, 
        name, 
        amount, 
        buyPrice, 
        sellPrice,
        currency,
        id: uniqueTransactionID, // Unieke ID voor de transactie
        buyDate: item.date, // Opslaan van originele aankoopdatum
        profitLoss: profitLoss.toFixed(2) + "%",
        sellDate: timestamp 
    });
    

    fs.writeFileSync(usersFile, JSON.stringify(usersData, null, 2));
    fs.writeFileSync(oldDataFile, JSON.stringify(oldData, null, 2));

    res.status(200).json({ message: "Verkoop succesvol!", newBalance: user.solde });
});


app.post('/update-price', (req, res) => {
    const { username, name, newPrice } = req.body;

    console.log(`✅ Prijsupdate ontvangen voor ${name}: €${newPrice}, maar aankoopprijs blijft gelijk!`);

    res.json({ success: true });
});

app.post('/change-password', (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Alle velden zijn verplicht" });
    }

    const usersFile = path.join(__dirname, 'users', 'users.json');
    let usersData = JSON.parse(fs.readFileSync(usersFile));
    let users = usersData.users;

    let user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ error: "Gebruiker niet gevonden" });
    }

    if (user.password !== currentPassword) {
        return res.status(400).json({ error: "Huidig wachtwoord is onjuist" });
    }

    user.password = newPassword;

    fs.writeFileSync(usersFile, JSON.stringify(usersData, null, 2));

    console.log(`🔐 Wachtwoord gewijzigd voor ${username}`);
    res.json({ message: "Wachtwoord succesvol gewijzigd!" });
});

// Endpoint om users.json te bekijken
app.get('/view-users543', (req, res) => {
    const filePath = path.join(__dirname, 'users', 'users.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users.json:', err);
            return res.status(500).send('Error reading users.json');
        }
        res.json(JSON.parse(data));
    });
});

// Endpoint om data.json te bekijken
app.get('/view-data', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'data.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data.json:', err);
            return res.status(500).send('Error reading data.json');
        }
        res.json(JSON.parse(data));
    });
});

// Endpoint om olddata.json te bekijken
app.get('/view-olddata798', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'olddata.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading olddata.json:', err);
            return res.status(500).send('Error reading olddata.json');
        }
        res.json(JSON.parse(data));
    });
});

// Zorg dat de server de CSS en JS voor de 404-pagina correct serveert
app.use('/404', express.static(path.join(__dirname, 'public', '404')));


// **404 Fallback**
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404', '404.html'));
});

// **Start server**
app.listen(port, () => {
    console.log(`YES HET WERKT, website is hier: http://localhost:${port}`);
});