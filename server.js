const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'ejs');

app.get('/rc/:vno', async (req, res) => {
    try {
        const vno = req.params.vno;
        const response = await axios.get(`https://rc-pvc-api.vercel.app/?number=${vno}`);
        
        if (!response.data.status) return res.status(404).send("Vehicle Not Found");

        const raw = response.data.formatted_data;
        const extract = (regex) => {
            const match = raw.match(regex);
            return match ? match[1].trim() : "--";
        };

        // Complete Mapping as per your API & Format
        const d = {
            regNo: response.data.vehicle_no,
            regDate: extract(/REGISTRATION DATE: (.*)/),
            validity: extract(/REGISTRATION VALIDITY: (.*)/),
            stateCode: extract(/STATE CODE: (.*)/),
            rto: extract(/RTO AUTHORITY: (.*)/),
            owner: extract(/OWNER NAME: (.*)/),
            serial: extract(/OWNER SERIAL: (.*)/),
            address: extract(/PERMANENT ADDRESS: (.*)/),
            chassis: extract(/CHASSIS NUMBER: (.*)/),
            engine: extract(/ENGINE \/ MOTOR NUMBER: (.*)/),
            vClass: extract(/VEHICLE CLASS: (.*)/),
            vCat: extract(/VEHICLE CATEGORY: (.*)/),
            maker: extract(/MAKER NAME: (.*)/),
            model: extract(/MODEL NAME: (.*)/),
            body: extract(/BODY TYPE: (.*)/),
            fuel: extract(/FUEL TYPE: (.*)/),
            mfg: extract(/MANUFACTURING YEAR: (.*)/),
            seating: extract(/SEATING CAPACITY: (.*)/),
            weight: extract(/UNLADEN WEIGHT: (.*)/),
            cc: extract(/CUBIC CAPACITY \(CC\): (.*)/),
            wheelbase: extract(/WHEEL BASE: (.*)/),
            color: extract(/COLOR: (.*)/),
            norms: extract(/EMISSION NORMS: (.*)/),
            financier: extract(/FINANCIER NAME: (.*)/),
            swd: extract(/SON \/ WIFE \/ DAUGHTER OF: (.*)/) || "--" // Agar API mein ho
        };

        res.render('index', { d });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.listen(process.env.PORT || 3000);
