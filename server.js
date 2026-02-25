const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Strict Update: Uptime Robot ke liye ping route
app.get('/', (req, res) => {
    res.send("Server is running 24/7");
});

app.get('/generate-rc', async (req, res) => {
    const vehicleId = req.query.id || "up62bz1861";
    const API_URL = `https://prerc-pvc-api.onrender.com/rc?id=${vehicleId}`;

    try {
        const response = await axios.get(API_URL);
        const apiData = response.data;

        if (apiData.status === "OK") {
            const data = apiData.vehicle_details;

            // Mapping API data to match your template placeholders
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

            res.render('index', { 
                vehicle_details, 
                state_code: apiData.state_code 
            });
        } else {
            res.status(400).send("API error: Status not OK");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error: API call failed.");
    }
});

// ✅ Update: Port configuration for 24/7 hosting platforms
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running: http://localhost:${PORT}/generate-rc?id=up62bz1861`);
});
