const express = require('express');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION & DATABASE ---
const MONGO_URL = "mongodb+srv://shivamdrive1234_db_user:sBdRvWk8cRyiDzj7@cluster0.ixk2kuh.mongodb.net/Rc_pvc_pdf?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Database Connected: Rc_pvc_pdf"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// --- API KEY SCHEMA ---
const keySchema = new mongoose.Schema({
    apiKey: { type: String, required: true, unique: true },
    limit: { type: Number, required: true },
    used: { type: Number, default: 0 }
});
const Key = mongoose.model('Key', keySchema);

// --- SEEDING & CLEANUP (Strict 5 Keys) ---
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
        console.log("🧹 Cleanup Done: High-Speed Mode Active.");
    } catch (err) { console.error("Seed Error:", err); }
};
seedKeys();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- ROUTES ---

app.get('/', (req, res) => {
    res.send("🚀 Fast PDF Server: Online | Status: 24/7 Monitoring");
});

app.get('/generate-rc', async (req, res) => {
    const userKey = req.query.key; 
    const inputId = req.query.id; 

    if (!userKey || !inputId) return res.status(400).send("Error: No Data Found");

    let browser = null;
    try {
        const keyData = await Key.findOne({ apiKey: userKey });
        if (!keyData) return res.status(403).send("Error: No Data Found");

        // Status Check Feature
        if (inputId === userKey) {
            return res.json({
                status: "Success",
                api_key: keyData.apiKey,
                remaining: keyData.limit - keyData.used
            });
        }

        if (keyData.used >= keyData.limit) return res.status(429).send("Error: Limit Reached");

        // Fetch Data from Source
        const API_URL = `https://pre-rc-pvc-api.onrender.com/rc?id=${inputId}`;
        const response = await axios.get(API_URL, { timeout: 15000 });
        const apiData = response.data;

        if (apiData.status !== "OK" || !apiData.vehicle_details) {
            return res.status(404).send("Error: No Data Found");
        }

        const data = apiData.vehicle_details;

        // Strict validation for missing/zero data
        const isInvalid = (val) => !val || ["0", "", "null", "undefined"].includes(val.toString().toLowerCase().trim());
        if (isInvalid(data.owner_name) || isInvalid(data.engine_number) || isInvalid(data.chassis_number)) {
            return res.status(422).send("Error: No Data Found");
        }

        // Increment Hit Count
        keyData.used += 1;
        await keyData.save();

        // Render HTML for PDF
        const htmlContent = await ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), { 
            vehicle_details: data, 
            state_code: apiData.state_code 
        });

        // --- OPTIMIZED FAST PDF GENERATION ---
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage', 
                '--disable-accelerated-2d-canvas', 
                '--no-first-run', 
                '--no-zygote', 
                '--single-process',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Speed Hack: Set content and wait only for network idle
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
            preferCSSPageSize: true
        });

        await browser.close();

        const fileName = `RC_REPORT_${inputId.toUpperCase()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(pdfBuffer);

    } catch (error) {
        if (browser) await browser.close();
        console.error("Critical Error:", error.message);
        res.status(500).send("Error: No Data Found");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Fast Engine running on Port ${PORT}`);
});
