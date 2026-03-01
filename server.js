const express = require('express');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const ejs = require('ejs');
const html_to_pdf = require('html-pdf-node'); 
const app = express();

// --- MONGODB CONNECTION ---
const MONGO_URL = "mongodb+srv://shivamdrive1234_db_user:sBdRvWk8cRyiDzj7@cluster0.ixk2kuh.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- API KEY SCHEMA & MODEL ---
const keySchema = new mongoose.Schema({
    apiKey: { type: String, required: true, unique: true },
    limit: { type: Number, required: true },
    used: { type: Number, default: 0 }
});
const Key = mongoose.model('Key', keySchema);

// --- SEED KEYS (Strictly Preserved 5-Key System) ---
const seedKeys = async () => {
    const keys = [
        { apiKey: "xxc", limit: 100 },
        { apiKey: "Hejdj", limit: 90 },
        { apiKey: "Jesn", limit: 80 },
        { apiKey: "Nsnsj", limit: 99 },
        { apiKey: "unlimitedx", limit: 999 }
    ];
    for (const k of keys) {
        await Key.findOneAndUpdate({ apiKey: k.apiKey }, k, { upsert: true });
    }
};
seedKeys();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ping route for Uptime Robot / Render Health Check
app.get('/', (req, res) => {
    res.send("Server is running 24/7");
});

app.get('/generate-rc', async (req, res) => {
    const vehicleId = req.query.id || "up62bz1861";
    const userKey = req.query.key; 
    const API_URL = `https://pre-rc-pvc-api.onrender.com/rc?id=${vehicleId}`;

    // --- KEY VALIDATION LOGIC ---
    if (!userKey) return res.status(401).send("API Key is required (?key=YOUR_KEY)");
    
    try {
        const keyData = await Key.findOne({ apiKey: userKey });
        
        if (!keyData) return res.status(403).send("Invalid API Key");
        if (keyData.used >= keyData.limit) return res.status(429).send("Limit reached for this API Key");

        // --- FETCH DATA FROM SOURCE API ---
        const response = await axios.get(API_URL);
        const apiData = response.data;

        if (apiData.status === "OK") {
            // Increment usage in MongoDB
            keyData.used += 1;
            await keyData.save();

            const data = apiData.vehicle_details;

            // Mapping API data (Strictly matching your index.ejs placeholders)
            const vehicle_details = {
                registration_number: data.registration_number,
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
                valid_upto: data.valid_upto
            };

            // Step 1: Render the EJS file to an HTML string
            const htmlContent = await ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), { 
                vehicle_details, 
                state_code: apiData.state_code 
            });

            // Step 2: Generate PDF using html-pdf-node (Fast & Light)
            let options = { format: 'A4', printBackground: true };
            let file = { content: htmlContent };

            html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
                // Step 3: Send Final PDF as Direct Download (Code Protected)
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=RC_${vehicleId.toUpperCase()}.pdf`);
                res.send(pdfBuffer);
            });

        } else {
            res.status(400).send("API error: Status not OK");
        }
    } catch (error) {
        console.error("Critical Error:", error);
        res.status(500).send("Server Error: Unable to process request.");
    }
});

// Port configuration for Render Hosting
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure Server running: Port ${PORT}`);
});
