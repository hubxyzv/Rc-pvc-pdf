const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// State Mapping for "Government of [State Name]"
const stateMap = { 
    "AP": "Andhra Pradesh", "AR": "Arunachal Pradesh", "AS": "Assam", "BR": "Bihar", "CG": "Chhattisgarh", 
    "CH": "Chandigarh", "DD": "Daman and Diu", "DL": "Delhi", "GA": "Goa", "GJ": "Gujarat", "HR": "Haryana", 
    "HP": "Himachal Pradesh", "JH": "Jharkhand", "JK": "Jammu and Kashmir", "KA": "Karnataka", "KL": "Kerala", 
    "LA": "Ladakh", "LD": "Lakshadweep", "MH": "Maharashtra", "ML": "Meghalaya", "MN": "Manipur", 
    "MP": "Madhya Pradesh", "MZ": "Mizoram", "NL": "Nagaland", "OD": "Odisha", "PB": "Punjab", 
    "PY": "Puducherry", "RJ": "Rajasthan", "SK": "Sikkim", "TN": "Tamil Nadu", "TR": "Tripura", 
    "TS": "Telangana", "UK": "Uttarakhand", "UP": "Uttar Pradesh", "WB": "West Bengal" 
};

// Route to handle dynamic vehicle numbers
app.get('/rc/:vno', async (req, res) => {
    try {
        const vno = req.params.vno.toUpperCase();
        
        // Fetch data from API
        const response = await axios.get(`https://rc-pvc-api.vercel.app/?number=${vno}`);
        
        if (!response.data || !response.data.formatted_data) {
            return res.status(404).send("Vehicle details not found.");
        }

        const raw = response.data.formatted_data;

        // Helper function to extract data using Regex
        const extract = (regex) => {
            const match = raw.match(regex);
            return match && match[1] ? match[1].trim() : "--";
        };

        // Extracting State Code for Header and Circle
        const sc = extract(/STATE CODE: (.*)/) || vno.substring(0, 2);

        // Building the Data Object for EJS
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
            vCat: extract(/VEHICLE CATEGORY: (.*)/),
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
            rto: extract(/RTO AUTHORITY: (.*)/).split(',')[0], // Taking only city name
            swd: extract(/SON \/ WIFE \/ DAUGHTER OF: (.*)/)
        };

        // Render the index.ejs with the vehicle object
        res.render('index', { v });

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).send("Server Error: API is currently unavailable or the link is broken.");
    }
});

// Default Route
app.get('/', (req, res) => {
    res.send("Welcome! Use URL like: /rc/HR26EV0001 to generate RC.");
});

// Port configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
