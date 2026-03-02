const express = require('express');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const ejs = require('ejs');
const html_to_pdf = require('html-pdf-node'); 
const app = express();

// --- MONGODB CONNECTION (Database: Rc_pvc_pdf) ---
const MONGO_URL = "mongodb+srv://shivamdrive1234_db_user:sBdRvWk8cRyiDzj7@cluster0.ixk2kuh.mongodb.net/Rc_pvc_pdf?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Connected to Database: Rc_pvc_pdf"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// --- API KEY SCHEMA ---
const keySchema = new mongoose.Schema({
    apiKey: { type: String, required: true, unique: true },
    limit: { type: Number, required: true },
    used: { type: Number, default: 0 }
});
const Key = mongoose.model('Key', keySchema);

// --- SEED KEYS & CLEANUP ---
const seedKeys = async () => {
    const validKeys = [
        { apiKey: "premium_x1", limit: 100 },
        { apiKey: "gold_y2", limit: 90 },
        { apiKey: "silver_z3", limit: 150 },
        { apiKey: "bronze_a4", limit: 99 },
        { apiKey: "admin_unlimited", limit: 999999 }
    ];
    try {
        const keyNames = validKeys.map(k => k.apiKey);
        await Key.deleteMany({ apiKey: { $nin: keyNames } });
        for (const k of validKeys) {
            await Key.findOneAndUpdate({ apiKey: k.apiKey }, k, { upsert: true });
        }
        console.log("Sweep Done: Keys Synced.");
    } catch (err) {
        console.error("Seed Error:", err);
    }
};
seedKeys();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.send("Server Status: Active | Database: Rc_pvc_pdf");
});

app.get('/generate-rc', async (req, res) => {
    const userKey = req.query.key; 
    const inputId = req.query.id; 

    if (!userKey || !inputId) return res.status(400).send("Error: No Data Found");

    try {
        const keyData = await Key.findOne({ apiKey: userKey });
        if (!keyData) return res.status(403).send("Error: No Data Found");

        if (inputId === userKey) {
            return res.json({
                status: "Success",
                api_key: keyData.apiKey,
                total_limit: keyData.limit,
                used_hits: keyData.used,
                remaining: keyData.limit - keyData.used
            });
        }

        if (keyData.used >= keyData.limit) return res.status(429).send("Error: Limit Reached");

        const API_URL = `https://pre-rc-pvc-api.onrender.com/rc?id=${inputId}`;
        const response = await axios.get(API_URL);
        const apiData = response.data;

        if (apiData.status !== "OK" || !apiData.vehicle_details) {
            return res.status(404).send("Error: No Data Found");
        }

        const data = apiData.vehicle_details;

        const isInvalid = (val) => {
            if (!val) return true;
            const str = val.toString().trim();
            return str === "0" || str === "" || str.toLowerCase() === "null";
        };

        if (isInvalid(data.owner_name) || isInvalid(data.engine_number) || isInvalid(data.chassis_number)) {
            return res.status(422).send("Error: No Data Found");
        }

        keyData.used += 1;
        await keyData.save();

        const vehicle_details = {
            registration_date: data.registration_date,
            category: data.category,
            serial: data.serial,
            chassis_number: data.chassis_number,
            engine_number: data.engine_number,
            owner_name: data.owner_name,
            swd: "_ _", 
            address: data.address,
            fuel_type: data.fuel_type,
            vehicle_class: data.vehicle_class,
            manufacturer: data.manufacturer,
            model: data.model,
            colour: data.colour,
            body_type: data.body_type,
            seating_capacity: data.seating_capacity,
            unladen_weight_kg: data.unladen_weight_kg,
            cubic_capacity: data.cubic_capacity,
            horse_power: data.horse_power,
            wheelbase: data.wheelbase,
            financier: data.financier,
            manufacturing_date: data.manufacturing_date,
            cylinders: data.cylinders,
            authority: data.authority,
            norms: data.norms,
            valid_upto: data.valid_upto,
            registration_number: data.registration_number 
        };

        const htmlContent = await ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), { 
            vehicle_details, 
            state_code: apiData.state_code 
        });

        // --- PERFORMANCE OPTIMIZATION HERE ---
        let options = { 
            format: 'A4', 
            printBackground: true,
            margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Use disk instead of memory for temp files
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu' // Skip GPU rendering for faster PDF generation
            ]
        };
        let file = { content: htmlContent };

        html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
            const fileName = `RC_REPORT_${inputId.toUpperCase()}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.send(pdfBuffer);
        }).catch(err => {
            res.status(500).send("Error: No Data Found");
        });

    } catch (error) {
        res.status(500).send("Error: No Data Found");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure Server running on Port ${PORT}`);
});
