async function fetchLiveData() {
    const vNo = document.getElementById('vNoInput').value.toUpperCase().trim();
    if(!vNo) return alert("Enter Vehicle Number!");

    const btn = document.getElementById('submitBtn');
    btn.innerText = "Fetching Data...";
    btn.disabled = true;

    try {
        const response = await fetch(`/api/vahan?number=${vNo}`);
        const api = await response.json();

        if(!api.status) {
            alert("Vehicle Not Found!");
            btn.disabled = false;
            btn.innerText = "GENERATE RC CARD";
            return;
        }

        const raw = api.formatted_data;
        const getVal = (key) => {
            const regex = new RegExp(`• ${key}: (.*)`, "i");
            const match = raw.match(regex);
            return (match) ? match[1].trim() : "--";
        };

        // Map Data to UI
        document.getElementById('view-regNo').innerText = api.vehicle_no;
        document.getElementById('f-regNo').innerText = api.vehicle_no;
        document.getElementById('view-regDate').innerText = getVal("REGISTRATION DATE");
        document.getElementById('view-valid').innerText = getVal("REGISTRATION VALIDITY");
        document.getElementById('view-chassis').innerText = getVal("CHASSIS NUMBER");
        document.getElementById('view-engine').innerText = getVal("ENGINE / MOTOR NUMBER");
        document.getElementById('view-name').innerText = getVal("OWNER NAME");
        document.getElementById('view-address').innerText = getVal("PERMANENT ADDRESS");
        document.getElementById('view-fuel').innerText = getVal("FUEL TYPE");
        document.getElementById('view-norms').innerText = getVal("EMISSION NORMS");
        document.getElementById('view-serial').innerText = getVal("OWNER SERIAL");
        document.getElementById('view-state').innerText = getVal("STATE CODE");

        document.getElementById('f-maker').innerText = getVal("MAKER NAME");
        document.getElementById('f-model').innerText = getVal("MODEL NAME");
        document.getElementById('f-color').innerText = getVal("COLOR");
        document.getElementById('f-body').innerText = getVal("BODY TYPE");
        document.getElementById('f-cap').innerText = getVal("SEATING CAPACITY");
        document.getElementById('f-weight').innerText = getVal("UNLADEN WEIGHT");
        document.getElementById('f-cc').innerText = getVal("CUBIC CAPACITY \\(CC\\)");
        document.getElementById('f-wheel').innerText = getVal("WHEEL BASE");
        document.getElementById('f-finance').innerText = getVal("FINANCIER NAME");
        document.getElementById('f-rto').innerText = getVal("RTO AUTHORITY").split(',')[0];

        document.getElementById('qrCodeImg').src = `https://api.qrserver.com/v1/create-qr-code/?data=https://vahan.parivahan.gov.in/rcdetails/?regno=${api.vehicle_no}`;

        document.getElementById('searchBox').style.display = "none";
        document.getElementById('printArea').style.display = "flex";

    } catch (e) {
        alert("Server Error!");
        btn.disabled = false;
    }
}
