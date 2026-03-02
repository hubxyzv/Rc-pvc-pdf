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
    .then(() => console.log("✅ MongoDB Connected to Rc_pvc_pdf"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- API KEY SCHEMA & MODEL ---
const keySchema = new mongoose.Schema({
    apiKey: { type: String, required: true, unique: true },
    limit: { type: Number, required: true },
    used: { type: Number, default: 0 }
});
const Key = mongoose.model('Key', keySchema);

// --- STRICT CLEANUP & SEED KEYS (New 5-Key System) ---
const seedKeys = async () => {
    const validKeys = [
        { apiKey: "premium_x1", limit: 100 },
        { apiKey: "gold_y2", limit: 90 },
        { apiKey: "silver_z3", limit: 80 },
        { apiKey: "bronze_a4", limit: 99 },
        { apiKey: "admin_unlimited", limit: 999999 }
    ];
    try {
        const keyNames = validKeys.map(k => k.apiKey);
        // Delete any key not in the new valid list
        await Key.deleteMany({ apiKey: { $nin: keyNames } });
        for (const k of validKeys) {
            await Key.findOneAndUpdate({ apiKey: k.apiKey }, k, { upsert: true });
        }
        console.log("✨ API Keys Synced & Old Keys Cleaned");
    } catch (err) {
        console.error("Seed Error:", err);
    }
};
seedKeys();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Health Check
app.get('/', (req, res) => {
    res.send("Server is running 24/7 on Database: Rc_pvc_pdf");
});

app.get('/generate-rc', async (req, res) => {
    const userKey = req.query.key; 
    const inputId = req.query.id; 

    // Basic Validations
    if (!userKey) return res.status(401).send("API Key is required (?key=YOUR_KEY)");
    if (!inputId) return res.status(400).send("Input ID is required (?id=VEHICLE_OR_KEY)");

    try {
        const keyData = await Key.findOne({ apiKey: userKey });
        if (!keyData) return res.status(403).send("Invalid API Key. Access Denied.");

        // --- FEATURE: API STATUS CHECK ---
        if (inputId === userKey) {
            return res.json({
                status: "Success",
                api_key: keyData.apiKey,
                total_limit: keyData.limit,
                used_hits: keyData.used,
                remaining_hits: keyData.limit - keyData.used
            });
        }

        // Check Hit Limit
        if (keyData.used >= keyData.limit) return res.status(429).send("Limit reached for this API Key");

        // --- FETCH DATA FROM SOURCE API ---
        const API_URL = `https://pre-rc-pvc-api.onrender.com/rc?id=${inputId}`;
        const response = await axios.get(API_URL);
        const apiData = response.data;

        // Validation 1: API Status
        if (apiData.status !== "OK" || !apiData.vehicle_details) {
            return res.status(404).send("Error: No Data Found");
        }

        const data = apiData.vehicle_details;

        // --- STRICT VALIDATION 2: OWNER, ENGINE, CHASSIS ---
        // Agar teeno mein se ek bhi missing hai, toh PDF block aur Error show hoga
        const hasRequiredDetails = data.owner_name && data.engine_number && data.chassis_number;

        if (!hasRequiredDetails) {
            return res.status(422).send("Error: No Data Found");
        }

        // --- HIT COUNT (Tabhi jab valid data hai) ---
        keyData.used += 1;
        await keyData.save();

        // Mapping API data (Strictly matching your index.ejs placeholders)
        const vehicle_details = {
            registration_date: data.registration_date,
            category: data.category,
            serial: data.serial,
            chassis_number: data.chassis_number,
            engine_number: data.engine_number,
            owner_name: data.owner_name,
            swd: "_ _", // Strict restriction preserved
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
            // UPDATED: vehicle no (registration_number) at the very last
            registration_number: data.registration_number 
        };

        // Step 1: Render the EJS file to an HTML string
        const htmlContent = await ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), { 
            vehicle_details, 
            state_code: apiData.state_code 
        });

        // Step 2: Generate PDF using html-pdf-node
        let options = { 
            format: 'A4', 
            printBackground: true,
            margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" }
        };
        let file = { content: htmlContent };

        html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
            // Step 3: Send Final PDF using the vehicle ID for the filename
            const finalFilename = `RC_REPORT_${inputId.toUpperCase()}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${finalFilename}`);
            res.send(pdfBuffer);
        });

    } catch (error) {
        console.error("Critical Error:", error);
        res.status(500).send("Error: No Data Found");
    }
});

// Port configuration for Render Hosting
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure Server running on Port ${PORT}`);
});
