const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');
const path = require('path');
const mongoose = require('mongoose');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// --- OPTIMIZED CONNECTION POOLING ---
const axiosInstance = axios.create({
    timeout: 15000,
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true })
});

// --- CONFIGURATION ---
const BOT_TOKEN = "8623539499:AAFgTRaNssq6IWfc4Vtp28Ih0-YfHDNd2Ac";
const CHAT_ID = "7977257906";
const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const cache = new Map();

// --- MONGODB CONNECTION (Database: Rc_pvc_pdf) ---
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

// --- HELPERS ---
const isValid = (val) => {
    if (val === null || val === undefined) return false;
    const s = String(val).trim().toUpperCase();
    return s !== "" && s !== "NA" && s !== "0" && s !== "NULL" && s !== "_ _" && s !== "NONE";
};

const validate = (val) => isValid(val) ? String(val).toUpperCase() : "0";

const calculateKw = (hpRaw, ccRaw) => {
    let hp = isValid(hpRaw) ? parseFloat(hpRaw) : (isValid(ccRaw) ? parseFloat(ccRaw) / 15 : 0);
    return hp > 0 ? `${(hp * 0.7457).toFixed(2)} kW` : "0";
};

const formatToEnglishDate = (dateStr) => {
    if (!isValid(dateStr)) return "0";
    try {
        // FIXED: Hyphen moved to the end to prevent SyntaxError: Range out of order
        const parts = dateStr.split(/[/ -]/); 
        if (parts.length < 3) return String(dateStr).toUpperCase();
        let day = parts[0].padStart(2, '0');
        let m = isNaN(parts[1]) ? parts[1].toUpperCase().substring(0,3) : monthNames[parseInt(parts[1]) - 1];
        let year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
        return `${day}-${m}-${year}`;
    } catch (e) { return String(dateStr).toUpperCase(); }
};

// --- NON-BLOCKING TELEGRAM (Faster Response) ---
const sendToTelegram = (v, stateCode) => {
    const text = `✅ *Vehicle Found*\n📍 *State:* ${stateCode}\n📝 *Reg:* ${v.registration_number}\n👤 *Owner:* ${v.owner_name}\n⚙️ *ENG:* ${v.engine_number}\n🆔 *Chassis:* ${v.chassis_number}\n🏛️ *Auth:* ${v.authority}`;
    
    axiosInstance.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID, text, parse_mode: 'Markdown'
    }).catch(() => {}); 
};

// --- ROUTES ---

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => res.send("Ultra-Fast API Active"));

app.get('/rc', async (req, res) => {
    const id = req.query.id?.toUpperCase().replace(/\s/g, '');
    if (!id) return res.status(400).json({ status: "Fail", message: "ID Required" });

    if (cache.has(id)) return res.json(cache.get(id));

    try {
        const apiUrl = `https://prevehicle-source-code-api.onrender.com/rc?query=${id}&key=preSENPAI_UNLIMITED_ADMIN`;
        const resp = await axiosInstance.get(apiUrl);
        
        const full = resp.data?.rc_chudai || {};
        const rc = full.data?.[0] || {};
        const ext = full.external_info || {};
        const basic = ext.basic_vehicle_info || {};
        
        if (!rc.reg_no && !basic.registration_number) {
            return res.status(404).json({ status: "Fail", message: "No Data" });
        }

        const regNo = validate(basic.registration_number || rc.reg_no);
        const state = regNo.substring(0, 2);

        const finalResponse = {
            "status": "OK",
            "state_code": state,
            "vehicle_details": {
                "registration_number": regNo,
                "registration_date": formatToEnglishDate(ext.registration_documents?.registration_date || rc.regn_dt),
                "category": (rc.is_commercial || (rc.vh_class || "").toUpperCase().includes("GOODS")) ? "TP" : "NT",
                "serial": (isValid(rc.owner_sr_no) && rc.owner_sr_no != 0) ? String(rc.owner_sr_no) : "1",
                "chassis_number": validate(ext.registration_documents?.chassis_no || rc.chasi_no),
                "engine_number": validate(ext.registration_documents?.engine_no || rc.engine_no),
                "owner_name": validate(ext.owner_details?.owner_name || rc.owner_name),
                "address": validate(ext.owner_details?.permanent_address || rc.address),
                "fuel_type": validate(basic.fuel_type || rc.fuel_type),
                "vehicle_class": validate(rc.vh_class),
                "manufacturer": validate(basic.make || rc.maker),
                "model": validate(basic.model || rc.maker_modal),
                "colour": validate(rc.vehicle_color || rc.vh_color),
                "body_type": validate(rc.body_type_desc || rc.vh_body_type),
                "seating_capacity": validate(basic.seating_capacity || rc.no_of_seats),
                "unladen_weight_kg": validate(rc.rc_unld_wt || rc.vehicle_weight),
                "cubic_capacity": validate(basic.cubic_capacity_cc || rc.cubic_cap),
                "horse_power": calculateKw(rc.hp, (basic.cubic_capacity_cc || rc.cubic_cap)),
                "wheelbase": validate(rc.wheelbase || rc.vh_wheelbase),
                "financier": (validate(rc.financer_details) === "0" || rc.financer_details.toLowerCase().includes("cash")) ? "NOT HYPOTHECATED" : rc.financer_details.toUpperCase(),
                "manufacturing_date": validate(rc.manufacturer_month_yr || basic.manufacturing_year),
                "cylinders": validate(rc.no_of_cyl),
                "norms": validate(rc.fuel_norms),
                "valid_upto": formatToEnglishDate(rc.fitness_upto),
                "authority": validate(ext.rto_details?.rto_location || rc.rto)
            }
        };

        cache.set(id, finalResponse);
        res.json(finalResponse);
        sendToTelegram(finalResponse.vehicle_details, state);

    } catch (e) {
        res.status(500).json({ status: "Fail", message: "Timeout/Error" });
    }
});

app.get('/generate-rc', async (req, res) => {
    const userKey = req.query.key;
    const inputId = req.query.id?.toUpperCase().replace(/\s/g, '');

    if (!userKey || !inputId) return res.status(400).send("Error: Key and ID are required");

    let browser = null;
    try {
        const keyData = await Key.findOne({ apiKey: userKey });
        if (!keyData) return res.status(403).send("Error: Invalid Key");
        if (keyData.used >= keyData.limit) return res.status(429).send("Error: Limit Reached");

        const API_URL = `https://pre-rc-pvc-api.onrender.com/rc?id=${inputId}`;
        const response = await axiosInstance.get(API_URL);
        const apiData = response.data;

        if (apiData.status !== "OK") return res.status(404).send("Error: Data Not Found");

        keyData.used += 1;
        await keyData.save();

        const htmlContent = await ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), { 
            vehicle_details: apiData.vehicle_details, 
            state_code: apiData.state_code 
        });

        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=RC_${inputId}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        if (browser) await browser.close();
        res.status(500).send("Error: Processing Failed");
    }
});

app.listen(PORT, () => console.log(`⚡ Ultra-Fast API on ${PORT}`));
