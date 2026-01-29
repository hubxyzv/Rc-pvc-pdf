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
        const response = await axios.get(`https://rc-pvc-api.vercel.app/?number=${vno}`);
        const raw = response.data.formatted_data;
        const extract = (regex) => (raw.match(regex) ? raw.match(regex)[1].trim() : "--");

        // NT vs TP Logic
        const isTransport = raw.includes("TRANSPORT") && !raw.includes("NON-TRANSPORT");
        const statusType = isTransport ? "TP" : "NT";

        const sc = extract(/STATE CODE: (.*)/) || vno.substring(0, 2);
        const v = {
            regNo: response.data.vehicle_no || vno,
            regDate: extract(/REGISTRATION DATE: (.*)/),
            validity: extract(/REGISTRATION VALIDITY: (.*)/),
            stateCode: sc,
            fullState: stateMap[sc] || sc,
            owner: extract(/OWNER NAME: (.*)/),
            serial: extract(/OWNER SERIAL: (.*)/),
            address: extract(/PERMANENT ADDRESS: (.*)/),
            chassis: extract(/CHASSIS NUMBER: (.*)/),
            engine: extract(/ENGINE \/ MOTOR NUMBER: (.*)/),
            vClass: extract(/VEHICLE CLASS: (.*)/),
            vCat: statusType, // Strictly NT or TP
            maker: extract(/MAKER NAME: (.*)/),
            model: extract(/MODEL NAME: (.*)/),
            body: extract(/BODY TYPE: (.*)/),
            fuel: extract(/FUEL TYPE: (.*)/),
            norms: extract(/EMISSION NORMS: (.*)/),
            mfg: extract(/MANUFACTURING YEAR: (.*)/),
            seating: extract(/SEATING CAPACITY: (.*)/),
            weight: extract(/UNLADEN WEIGHT: (.*)/),
            cc: extract(/CUBIC CAPACITY \(CC\): (.*)/),
            wheelbase: extract(/WHEEL BASE: (.*)/),
            color: extract(/COLOR: (.*)/),
            financier: extract(/FINANCIER NAME: (.*)/),
            rto: extract(/RTO AUTHORITY: (.*)/).split(',')[0],
            swd: extract(/SON \/ WIFE \/ DAUGHTER OF: (.*)/)
        };

        res.render('index', { v });
    } catch (err) {
        res.status(500).send("API Error or Invalid Vehicle Number.");
    }
});

app.get('/', (req, res) => res.send("Server Running. Use /rc/[VEHICLE_NUMBER]"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
