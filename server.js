const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const stateMap = { AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CG: "Chhattisgarh", CH: "Chandigarh", DD: "Daman and Diu", DL: "Delhi", GA: "Goa", GJ: "Gujarat", HR: "Haryana", HP: "Himachal Pradesh", JH: "Jharkhand", JK: "Jammu and Kashmir", KA: "Karnataka", KL: "Kerala", LA: "Ladakh", LD: "Lakshadweep", MH: "Maharashtra", ML: "Meghalaya", MN: "Manipur", MP: "Madhya Pradesh", MZ: "Mizoram", NL: "Nagaland", OD: "Odisha", PB: "Punjab", PY: "Puducherry", RJ: "Rajasthan", SK: "Sikkim", TN: "Tamil Nadu", TR: "Tripura", TS: "Telangana", UK: "Uttarakhand", UP: "Uttar Pradesh", WB: "West Bengal" };

app.get('/rc/:vno', async (req, res) => {
    try {
        const vno = req.params.vno.toUpperCase();
        // Calling your NEW Render API
        const response = await axios.get(`https://prerc-pvc-api.onrender.com/rc?id=${vno}`);
        const data = response.data;

        // Creating the master object for the EJS template
        const v = {
            regNo: data.regNo || vno,
            regDate: data.regDate || "_",
            cat: data.cat || "NT",
            serial: data.serial || "1",
            chassis: data.chassis || "_",
            engine: data.engine || "_",
            name: data.name || "_",
            swd: "_ _", // Strict privacy constraint
            address: data.address || "_",
            fuel: data.fuel || "_",
            vClass: data.vClass || "_",
            maker: data.maker || "_",
            model: data.model || "_",
            colour: data.colour || "_",
            bodyType: data.bodyType || "_",
            seatCap: data.seatCap || "_",
            weight: data.weight || "_",
            cubicCap: data.cubicCap || "_",
            hp: data.hp || "_",
            wheelBase: data.wheelBase || "_",
            financier: data.financier || "NONE",
            mfgDate: data.mfgDate || "_",
            cylinders: data.cylinders || "_",
            auth: data.auth || "_",
            norms: data.norms || "_",
            validity: data.validity || "_"
        };

        res.render('index', { v });
    } catch (err) {
        console.error("API Error:", err.message);
        res.status(500).send("API Error or Invalid Vehicle Number.");
    }
});

app.get('/', (req, res) => res.send("Server Running. Use /rc/[VEHICLE_NUMBER]"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
