document.addEventListener("DOMContentLoaded", function () {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        alert("Je bent niet ingelogd!");
        window.location.href = '/';
        return;
    }

    // Gebruikersinfo direct weergeven
    document.getElementById('usernameDisplay').innerText = "Gebruiker: " + loggedInUser.usernameshow;
    document.getElementById('balanceDisplay').innerText = "Saldo: €" + loggedInUser.solde.toFixed(2);
});

async function generateExcel() {
    try {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

        if (!loggedInUser) {
            alert("Je bent niet ingelogd!");
            return;
        }

        const usersResponse = await fetch('/users/users.json');
        const oldDataResponse = await fetch('/data/olddata.json');

        if (!usersResponse.ok || !oldDataResponse.ok) {
            throw new Error("Kan de JSON bestanden niet laden.");
        }

        const usersData = await usersResponse.json();
        const oldData = await oldDataResponse.json();

        let user = usersData.users.find(u => u.username === loggedInUser.username);
        if (!user) {
            alert("Gebruiker niet gevonden in database!");
            return;
        }

        let activeAssets = user.portfolio ? user.portfolio.map(p => ({
            "Aankoop Datum": new Date(p.date).toLocaleString(),
            "Activa": p.name,
            "Currency": p.currency,
            "ISIN": p.isin || "Niet opgegeven",
            "Aantal Aangekocht": p.amount,
            "Koers bij Aankoop": p.price,
            "Totale Aankoopwaarde": p.amount * p.price,
            "Reden": "" 
        })) : [];

        let soldAssets = oldData.filter(trx => trx.username === loggedInUser.username).map(trx => ({
            "Aankoop Datum": new Date(trx.buyDate).toLocaleString(),
            "Verkoop Datum": new Date(trx.sellDate).toLocaleString(),
            "Activa": trx.name,
            "Currency": trx.currency,
            "ISIN": "Niet opgegeven",
            "Aantal Aangekocht": trx.amount,
            "Koers bij Aankoop": trx.buyPrice,
            "Totale Aankoopwaarde": trx.amount * trx.buyPrice,
            "Koers bij Verkoop": trx.sellPrice,
            "Totale Verkoopwaarde": trx.amount * trx.sellPrice,
            "Winst/Verlies": "", 
            "Percentage Winst/Verlies (%)": trx.profitLoss,
            "Reden": ""
        }));

        let wb = XLSX.utils.book_new();
        let ws1 = XLSX.utils.json_to_sheet(activeAssets);
        let ws2 = XLSX.utils.json_to_sheet(soldAssets);

        let boldStyle = { font: { bold: true } };

        XLSX.utils.book_append_sheet(wb, ws1, "Actieve Activa");
        XLSX.utils.book_append_sheet(wb, ws2, "Verkochte Activa");

        for (let i = 2; i <= soldAssets.length + 1; i++) {
            ws2[`J${i}`] = { f: `H${i}-I${i}` };
            ws2[`K${i}`] = { f: `(J${i}/H${i})*100` };
        }

        Object.keys(ws1).forEach(cell => {
            if (cell.match(/^[A-Z]1$/)) ws1[cell].s = boldStyle;
        });

        Object.keys(ws2).forEach(cell => {
            if (cell.match(/^[A-Z]1$/)) ws2[cell].s = boldStyle;
        });

        XLSX.writeFile(wb, "Beursspel_Overzicht.xlsx");
    } catch (error) {
        console.error("Fout bij genereren van Excel:", error);
    }
}

function navigateTo(page) {
    window.location.href = page;
}

function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
}
