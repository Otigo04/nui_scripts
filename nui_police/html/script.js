let map;
let playerBlip;
let CUSTOM_CRS;
let unitMarkers = {};

const center_x = 117.3;
const center_y = 172.8;
const scale_x = 0.02072;
const scale_y = 0.0205;
let currentLevel = null;

window.allDirectives = [];

// Global Storage for Config
let dispatchConfig = { vehicles: [], statusCodes: [] };
let localPlayerInfo = { name: "Unknown", rank: "Officer" };
let terminalPlayedThisSession = false; // Status-Flag für die Sitzung

let activeIntervals = {};


// NUI LABS | DMV Translation Tables
const vehicleClasses = ["Compacts", "Sedans", "SUVs", "Coupes", "Muscle", "Sports Classics", "Sports", "Super", "Motorcycles", "Off-Road", "Industrial", "Utility", "Vans", "Cycles", "Boats", "Helicopters", "Planes", "Service", "Emergency", "Military", "Commercial", "Trains", "Open Wheel"];

const vehicleColors = {
    0: "Metallic Black", 1: "Metallic Graphite Black", 2: "Metallic Black Steel", 12: "Matte Black", 
    27: "Metallic Red", 28: "Metallic Torino Red", 29: "Metallic Formula Red", 39: "Matte Red",
    55: "Metallic Lime Green", 88: "Metallic Taxi Yellow", 89: "Metallic Race Yellow", 
    111: "Metallic White", 112: "Metallic Frost White", 131: "Matte White"
    // Dies sind Beispiele. GTA hat viele IDs, 0-160.
};



// 1. KARTEN INITIALISIERUNG
function initMap() {
    if (map) {
        map.invalidateSize();
        return;
    }

    CUSTOM_CRS = L.extend({}, L.CRS.Simple, {
        projection: L.Projection.LonLat,
        scale: function(zoom) { return Math.pow(2, zoom); },
        zoom: function(sc) { return Math.log(sc) / 0.6931471805599453; },
        transformation: new L.Transformation(scale_x, center_x, -scale_y, center_y),
        infinite: true
    });

    map = L.map('map', {
        crs: CUSTOM_CRS, 
        minZoom: 1,
        maxZoom: 5,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true
    });

    // MAP-FIX: Bounds verhindern das Laden fehlender Kacheln (Blaue Quadrate)
    L.tileLayer('mapStyles/styleSatelite/{z}/{x}/{y}.jpg', {
        minZoom: 0,
        maxZoom: 5,
        noWrap: true,
        bounds: [[-8000, -8000], [8000, 8000]] 
    }).addTo(map);

    map.setView([0, 0], 3);
}


// DATEI: html/script.js
// KLASSE: Navigation Logic

// NUI LABS | Robust Navigation Controller
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const pageId = item.getAttribute('data-page');
        if (!pageId) return;

        // 1. Alle aktiven Klassen entfernen
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));

        // 2. Ziel-Tab aktivieren
        item.classList.add('active');
        const activePage = document.getElementById(pageId);
        
        if (activePage) {
            activePage.classList.add('active');

            // 3. Kontext-Aktionen (Reset & Cleanup)
            if (pageId === 'person-page') {
                resetPersonRegister(); // Zurück zur Landingpage beim Öffnen
            }

            if (pageId !== 'person-page') {
                const countBadge = document.getElementById('person-result-count');
                if (countBadge) countBadge.classList.add('hidden'); // Badge verstecken
                document.getElementById('person-results').innerHTML = ''; 
            }

            if (pageId !== 'vehicle-page') {
                const vehStatus = document.getElementById('vehicle-search-status');
                if (vehStatus) vehStatus.classList.add('hidden');
            }
            // NUI LABS | Navigation Extension for DMV
            if (pageId === 'vehicle-page') {
                resetVehicleRegister(); // Setzt die Suche beim Öffnen zurück
            } else {
                // Wenn wir den Personen-Tab verlassen: Matrix & Overlays hart stoppen
                const matrix = document.getElementById('matrix-canvas');
                const anim = document.getElementById('search-animation');
                if (matrix) matrix.classList.add('hidden');
                if (anim) anim.classList.add('hidden');
            }

            // Weitere Tab-Initialisierungen
            if (pageId === 'units-page') loadUnitsTab();
            if (pageId === 'orders-page') loadDirectives();
            if (pageId === 'officers-page') loadOfficersPage();
            if (pageId === 'map-page' && map) {
                setTimeout(() => { map.invalidateSize(); }, 200);
            }
        }
    });
});


// NUIPolice/html/script.js UPDATE

// Korrektur der Officers-Page: Nutzt jetzt den Master-Fetch
function loadOfficersPage() {
    fetch(`https://${GetParentResourceName()}/getDispatchData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    })
    .then(res => res.json())
    .then(data => {
        if (!data || !data.officers) return;
        
        const list = document.getElementById('officer-list');
        const countTag = document.getElementById('officer-count');
        if (!list) return;
        
        list.innerHTML = ''; 
        let activeCount = 0;

        // Sortierung nach Rang (Absteigend)
        data.officers.sort((a, b) => b.rank - a.rank);

        data.officers.forEach(off => {
            if (off.onduty) activeCount++;

            const row = document.createElement('div');
            row.className = 'officer-row';
            row.innerHTML = `
                <div class="off-col name-col">
                    <i class="fas fa-id-badge" style="opacity: 0.5; margin-right: 1rem;"></i>
                    ${off.name}
                </div>
                <div class="off-col status-col">
                    <span class="status-badge ${off.onduty ? 'on-duty' : 'off-duty'}">
                        ${off.onduty ? 'On Duty' : 'Off Duty'}
                    </span>
                </div>
                <div class="off-col callsign-col">
                    <span class="callsign-tag">${off.callsign}</span>
                </div>
                <div class="off-col actions-col">
                    <i class="fas fa-user-edit action-icon edit-btn" onclick="openEditModal('${off.citizenid}', '${off.name}', '${off.callsign}', ${off.rank})"></i>
                    <i class="fas fa-user-minus action-icon fire-btn" onclick="fireOfficer('${off.citizenid}', '${off.name}')"></i>
                </div>
            `;
            list.appendChild(row);
        });

        if (countTag) {
            countTag.innerText = `${activeCount} / ${data.officers.length} Aktiv`;
        }
    }).catch(err => console.error("NUI LABS | Officers Load Error:", err));
}

// NUI LABS | Global Officer & Unit Tracking
// NUI LABS | Smart Unit & Officer Tracking Logic
// NUI LABS | Refined Smart Map Tracking
function updateUnitMarkers(units, officers) {
    if (!map || !officers) return;

    const activeMarkerIds = new Set();
    const processedUnits = new Set();

    officers.forEach(off => {
        if (!off.onduty || !off.coords) return;

        // Finde die zugehörige Streife
        const unit = Object.values(units).find(u => u.officers && u.officers.includes(off.citizenid));
        
        if (unit && off.inVehicle) {
            // FALL: In Streife UND im Fahrzeug -> Ein Marker für die ganze Streife
            if (!processedUnits.has(unit.id)) {
                processedUnits.add(unit.id);
                const markerId = `unit_${unit.id}`;
                activeMarkerIds.add(markerId);
                
                const partners = officers.filter(o => unit.officers.includes(o.citizenid));
                // Zeigt im Tooltip den Streifencode und alle Partner
                renderSmartMarker(markerId, off.coords, unit.name, unit.code, partners, true, unit.location);
            }
        } else {
            // FALL: Zu Fuß ODER Einzeldienst
            const markerId = `off_${off.citizenid}`;
            activeMarkerIds.add(markerId);
            
            // Logik für den Status-Text: Zeigt Name + zugeordnete Streife
            const statusText = unit ? `Zugeordnet: ${unit.name}` : "Einzeldienst";
            renderSmartMarker(markerId, off.coords, off.name, statusText, [off], false, off.location);
        }
    });

    // Marker-Cleanup
    Object.keys(unitMarkers).forEach(id => {
        if (!activeMarkerIds.has(id)) {
            map.removeLayer(unitMarkers[id]);
            delete unitMarkers[id];
        }
    });
}

// NUI LABS | Enhanced Marker Rendering
// NUI LABS | Enhanced Marker Rendering with Ranks
function renderSmartMarker(id, coords, title, status, memberList, inVehicle, location) {
    const pos = [coords.y, coords.x];
    
    // Determine icon style based on status
    const iconHtml = inVehicle 
        ? `<div class="blip-icon-wrapper vehicle-blip"><i class="fas fa-car-side"></i></div>`
        : `<div class="blip-icon-wrapper ${memberList.length === 1 && status === "Einzeldienst" ? 'individual-blip' : ''}"><i class="fas fa-user-shield"></i></div>`;

    const customIcon = L.divIcon({
        className: 'custom-unit-blip',
        html: iconHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    });

    // 1. DYNAMIC HEADER: Show rank if it's a single person
    let displayTitle = title;
    if (!inVehicle && memberList.length === 1) {
        displayTitle = `${title} <span class="rank-tag-mini">${memberList[0].rankName}</span>`;
    }

    // 2. MEMBER LIST: Show rank for every person in the unit
    let memberHtml = "";
    if (memberList && memberList.length > 0) {
        memberHtml = `<div class="tooltip-members">
            ${memberList.map(m => `
                <span>
                    <i class="fas fa-id-badge"></i> 
                    ${m.callsign} | ${m.name} 
                    <small class="rank-label-tooltip">${m.rankName}</small>
                </span>
            `).join('')}
        </div>`;
    }

    const tooltipHTML = `
        <div class="map-tooltip-custom">
            <div class="tooltip-header">${displayTitle}</div>
            <div class="tooltip-status">${status}</div>
            ${memberHtml}
            <div class="tooltip-footer">
                <i class="fas fa-map-marker-alt"></i> ${location || 'Auf Streife'}
            </div>
        </div>
    `;

    if (unitMarkers[id]) {
        unitMarkers[id].setLatLng(pos);
        unitMarkers[id].setIcon(customIcon);
        unitMarkers[id].setTooltipContent(tooltipHTML);
    } else {
        unitMarkers[id] = L.marker(pos, { icon: customIcon, zIndexOffset: inVehicle ? 1000 : 500 })
            .addTo(map)
            .bindTooltip(tooltipHTML, { permanent: false, direction: 'top', offset: [0, -20] });
    }
}

// NUI LABS | Unified Sidebar Rendering
function renderUnitList(units) {
    // Wir nutzen hier einfach unsere neue, detaillierte Funktion
    // Da der Server-Sync (updateUnits) ein Array schickt, konvertieren wir es kurz
    const unitsObj = Array.isArray(units) ? Object.assign({}, units) : units;
    
    // Wir holen uns die Officers via Master-Fetch oder nutzen das globale currentUnits
    fetch(`https://${GetParentResourceName()}/getDispatchData`, { method: 'POST', body: '{}' })
    .then(res => res.json())
    .then(data => {
        syncSidebarUnits(data.units, data.officers);
    });
}

// 4. BEAMTEN MANAGEMENT
let currentEditingCitizenId = null;

window.openEditModal = function(citizenid, name, callsign, rank) {
    currentEditingCitizenId = citizenid;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-callsign').value = callsign;
    document.getElementById('edit-rank').value = rank;
    document.getElementById('officer-modal').style.display = 'flex';
};

document.getElementById('close-officer-modal').addEventListener('click', () => {
    document.getElementById('officer-modal').style.display = 'none';
});

document.getElementById('save-officer').addEventListener('click', () => {
    const data = {
        citizenid: currentEditingCitizenId,
        callsign: document.getElementById('edit-callsign').value,
        rank: document.getElementById('edit-rank').value
    };
    fetch(`https://${GetParentResourceName()}/updateOfficer`, {
        method: 'POST',
        body: JSON.stringify(data)
    }).then(() => {
        document.getElementById('officer-modal').style.display = 'none';
        setTimeout(loadOfficersPage, 300);
    });
});

// 5. NUI MESSAGE LISTENER
window.addEventListener('message', function(event) {
    const data = event.data;

    // In den Message-Listener einfügen:
    if (data.action === "refreshDirectives") {
        // Lädt die Liste neu, egal ob man gerade im Tab ist oder nicht
        loadDirectives();
    }

    if (data.action === "refreshVehicle") {
        // Ruft die bereits existierende Smooth-Update Funktion auf
        if (typeof refreshVehicleCard === "function") {
            refreshVehicleCard(data.plate);
        }
    }
    
    if (data.action === "updateUnitsList") {
        // Master-Daten neu laden
        loadUnitsTab();
        // Icons auf der Karte aktualisieren
        if (data.units) {
            updateUnitMarkers(data.units);
        }
    }
    // NUI LABS | Logic Fix: Prevent animation looping
    if (data.action === "setVisible") {
        if (data.playerInfo) localPlayerInfo = data.playerInfo;
        const container = document.getElementById('app-container');
        container.style.display = data.status ? 'flex' : 'none';
        
        if (data.status) {
            setTimeout(() => {
                initMap();
                loadUnitsTab();
                if (data.coords) {
                    const pos = [data.coords.y, data.coords.x];
                    map.setView(pos, 3, { animate: true, pan: { duration: 1 } });
                }
                map.invalidateSize();
            }, 200);
        } else {
            // WICHTIG: NUR hier wird alles für die nächste Sitzung scharf geschaltet
            terminalPlayedThisSession = false; 
            terminalStatus = { person: false, vehicle: false };
            resetPersonRegister(); 
            resetVehicleRegister();
        }
    } else if (data.action === "updateUnits") {
        renderUnitList(data.units);
        updateUnitMarkers(data.units, data.officers);
    }
}); // Ende des Listeners

window.addEventListener('keydown', function(event) {
    if (event.key === "Escape") fetch(`https://${GetParentResourceName()}/closeUI`, { method: 'POST' });
});

// NUIPolice/html/script.js

function openHireModal() {
    fetch(`https://${GetParentResourceName()}/getNearbyPlayers`, {
        method: 'POST',
        body: JSON.stringify({})
    })
    .then(res => res.json())
    .then(players => {
        const list = document.getElementById('nearby-players-list');
        list.innerHTML = '';
        
        if (players.length === 0) {
            list.innerHTML = '<p style="color: grey; text-align: center;">Keine Personen gefunden.</p>';
        }

        players.forEach(p => {
            const div = document.createElement('div');
            div.className = 'nearby-player-item';
            div.innerHTML = `<span>${p.name}</span> <small>ID: ${p.id}</small>`;
            div.onclick = () => hirePlayer(p.id);
            list.appendChild(div);
        });
        document.getElementById('hire-modal').style.display = 'flex';
    });
}

function hirePlayer(id) {
    console.log("Stelle Spieler ein: " + id);
    fetch(`https://${GetParentResourceName()}/hirePlayer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: id })
    }).then(() => {
        closeHireModal();
        // Kurzer Delay damit die DB Zeit zum Speichern hat
        setTimeout(loadOfficersPage, 800); 
    });
}

function closeHireModal() {
    document.getElementById('hire-modal').style.display = 'none';
}

// --- UNIVERSELLE CONFIRM-LOGIK ---
let confirmCallback = null;

function showConfirm(message, onConfirm) {
    document.getElementById('confirm-message').innerText = message;
    document.getElementById('confirm-modal').style.display = 'flex';
    confirmCallback = onConfirm;
}

document.getElementById('confirm-yes').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    document.getElementById('confirm-modal').style.display = 'none';
});

document.getElementById('confirm-no').addEventListener('click', () => {
    document.getElementById('confirm-modal').style.display = 'none';
});

// --- ÜBERARBEITETE FEUERN-FUNKTION (OHNE WINDOW-POPUP) ---
function fireOfficer(citizenid, name) {
    showConfirm(`Möchten Sie den Beamten ${name} wirklich unwiderruflich aus dem Dienst entlassen?`, () => {
        fetch(`https://${GetParentResourceName()}/fireOfficer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ citizenid: citizenid })
        }).then(() => {
            setTimeout(loadOfficersPage, 500);
        });
    });
}

// --- STREIFEN DATEN-STRUKTUR ---
let currentUnits = [];

function createNewUnit() {
    // Modal auf Standard zurücksetzen
    const btn = document.querySelector('#unit-create-modal .btn-hire-premium');
    btn.innerText = "Erstellen";
    btn.onclick = submitNewUnit;
    
    document.getElementById('new-unit-name').value = "";
    document.getElementById('unit-create-modal').style.display = 'flex';
}

function closeUnitModal() {
    document.getElementById('unit-create-modal').style.display = 'none';
}

// NUIPolice/html/script.js
function submitNewUnit() {
    const nameVal = document.getElementById('new-unit-name').value;
    const catVal = document.getElementById('new-unit-category').value;
    const codeVal = document.getElementById('new-unit-code').value; // FIX: Code auslesen

    if (!nameVal) return;

    fetch(`https://${GetParentResourceName()}/createUnit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal, category: catVal, code: codeVal }) // FIX: mitschicken
    }).then(() => {
        closeUnitModal();
        setTimeout(loadUnitsTab, 200);
    });
}

// --- STREIFEN LOGIK V2 ---
// 2. Erlaubnis-Logik (Verhindert das Barrieresymbol)
function allowDrop(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = "move";
    
    // Visuelles Feedback: Card hervorheben
    const card = ev.currentTarget.closest('.unit-card');
    if (card) {
        card.classList.add('drag-over');
    }
    return false;
}
// 1. Drag Start: Initialisiert das Objekt
function drag(ev, citizenid) {
    ev.dataTransfer.setData("text/plain", citizenid.toString());
    ev.dataTransfer.dropEffect = "move";
    // Optional: Transparenz des Elements beim Ziehen verringern
    ev.target.style.opacity = "0.5";
}

// Wenn man die Karte verlässt, Glow entfernen
function dragLeave(ev) {
    const card = ev.target.closest('.unit-card');
    if (card) card.classList.remove('drag-over');
}

function drop(ev, unitId) {
    ev.preventDefault();
    const card = ev.currentTarget;
    if (card) card.classList.remove('drag-over');

    const dragId = ev.dataTransfer.getData("text/plain");
    if (!dragId || !unitId) return;

    fetch(`https://${GetParentResourceName()}/assignOfficer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizenid: dragId, unitId: unitId })
    }).then(() => setTimeout(loadUnitsTab, 200));
}

// --- BEARBEITUNGS-FUNKTION (STIFT) ---
// --- ÜBERARBEITETE MODAL LOGIK ---
function openUnitEdit(unitId) {
    // Finde das Unit-Objekt in deinen aktuellen Daten
    const unit = currentUnits[unitId]; 
    if (!unit) return;

    document.getElementById('modal-unit-title').innerText = "Streife bearbeiten";
    document.getElementById('new-unit-name').value = unit.name;
    document.getElementById('new-unit-category').value = unit.category;
    document.getElementById('new-unit-code').value = unit.code;
    
    const btn = document.getElementById('unit-modal-submit');
    btn.innerText = "Änderungen speichern";
    btn.onclick = () => {
        const data = {
            id: unitId,
            name: document.getElementById('new-unit-name').value,
            category: document.getElementById('new-unit-category').value,
            code: document.getElementById('new-unit-code').value
        };
        
        // Sende alle Updates an den Server
        fetch(`https://${GetParentResourceName()}/updateUnitData`, {
            method: 'POST',
            body: JSON.stringify({ id: data.id, field: 'name', value: data.name })
        });
        fetch(`https://${GetParentResourceName()}/updateUnitData`, {
            method: 'POST',
            body: JSON.stringify({ id: data.id, field: 'category', value: data.category })
        });
        fetch(`https://${GetParentResourceName()}/updateUnitData`, {
            method: 'POST',
            body: JSON.stringify({ id: data.id, field: 'code', value: data.code })
        });

        closeUnitModal();
        setTimeout(loadUnitsTab, 400);
    };

    document.getElementById('unit-create-modal').style.display = 'flex';
}

// DATEI: html/script.js

// DATEI: html/script.js

// Location Update Loop (Alle 10 Sekunden)
setInterval(() => {
    const isVisible = document.getElementById('app-container').style.display !== 'none';
    const isMapActive = document.getElementById('map-page').classList.contains('active');
    const isUnitsActive = document.getElementById('units-page').classList.contains('active');

    // Wir aktualisieren nur, wenn das UI offen ist UND wir auf der Map oder im Streifen-Tab sind
    if (isVisible && (isMapActive || isUnitsActive)) {
        // Triggert die Standort-Abfrage auf dem Server für alle aktiven Einheiten
        fetch(`https://${GetParentResourceName()}/refreshLocations`, { method: 'POST', body: '{}' })
        .then(() => loadUnitsTab()); // Lädt danach alle Master-Daten (Icons, Ränge, Positionen)
    }
}, 5000);

// DATEI: html/script.js
// KLASSE: Unit Management Core

// DATEI: html/script.js
// KLASSE: Unit Management

window.renderUnitsPage = function(officers, units) {
    const container = document.getElementById('units-container');
    const pool = document.getElementById('unassigned-officers');
    if (!container || !pool) return;

    container.innerHTML = '';
    pool.innerHTML = '';

    const assignedIds = Object.values(units).flatMap(u => u.officers || []);

    ["Airship", "SWAT", "Streife"].forEach(cat => {
        const unitsInCategory = Object.values(units).filter(u => u.category === cat);
        if (unitsInCategory.length === 0) return;

        const section = document.createElement('div');
        section.className = 'unit-category-section';
        section.innerHTML = `<div class="unit-category-header">${cat}</div><div class="unit-cards-container"></div>`;
        const cardBox = section.querySelector('.unit-cards-container');

            unitsInCategory.forEach(unit => {
                const card = document.createElement('div');
                card.className = 'unit-card';
                card.setAttribute('data-cat', cat);
                
                // Calculate the class for the status code highlight
                const codeNum = unit.code ? unit.code.split(' ')[1] : '1';
                const codeClass = `select-code-code${codeNum}`;
                
                const offInUnit = officers.filter(o => unit.officers && unit.officers.includes(o.citizenid));
                
                card.innerHTML = `
                    <div class="unit-card-header" style="align-items: center; display: flex; justify-content: space-between; gap: 0.8rem;">
                        <div style="display:flex; align-items:center; gap:0.5rem; flex-grow: 1;">
                            <strong style="color:white; font-size:0.9rem; white-space: nowrap; letter-spacing: 0.05rem;">${unit.name}</strong>
                            <i class="fas fa-pencil-alt edit-unit-icon" onclick="openUnitEdit('${unit.id}')" title="Bearbeiten"></i>
                            <i class="fas fa-trash-alt delete-unit-icon" onclick="deleteUnit('${unit.id}')" title="Streife auflösen"></i>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.4rem;">
                            <div class="btn-add-minimal-header gps-btn" onclick="focusUnitOnMap('${unit.id}')" title="GPS Ortung">
                                <i class="fas fa-location-arrow"></i>
                            </div>
                            <div class="btn-add-minimal-header" onclick="openAddOfficerModal('${unit.id}')" title="Beamten hinzufügen">
                                <i class="fas fa-plus"></i>
                            </div>
                            <select class="inline-select" onchange="updateUnitData('${unit.id}', 'code', this.value)">
                                ${dispatchConfig.statusCodes.map(c => `
                                    <option value="${c.value}" ${unit.code === c.value ? 'selected' : ''} style="color: ${c.color}">
                                        ${c.label}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="unit-officers-area" style="margin: 0.8rem 0;">
                        ${offInUnit.map(o => `
                            <div class="unit-officer-row">
                                <span><i class="fas fa-user-shield"></i>${o.callsign} | ${o.name}</span>
                                <i class="fas fa-times remove-off-icon" onclick="removeFromUnit('${o.citizenid}')"></i>
                            </div>
                        `).join('')}
                        ${offInUnit.length === 0 ? '<div style="font-size:0.7rem; color:rgba(255,255,255,0.05); text-align:center; padding: 1rem; border: 1px dashed rgba(255,255,255,0.05); border-radius: 0.5rem;">STREIFE UNBESETZT</div>' : ''}
                    </div>

                    <div class="unit-card-footer">
                        <div class="footer-item" style="flex: 1;">
                            <i class="fas fa-car"></i>
                            <select class="inline-select" style="width:60%; border:none; background:transparent !important;" onchange="updateUnitData('${unit.id}', 'vehicle', JSON.parse(this.value))">
                                <option value='{"label":"KEIN KFZ","plate":"N/A"}' ${!unit.vehicle || unit.vehicle.plate === 'N/A' ? 'selected' : ''}>KEIN KFZ</option>
                                ${dispatchConfig.vehicles.map(v => `
                                    <option value='${JSON.stringify(v)}' ${unit.vehicle && unit.vehicle.plate === v.plate ? 'selected' : ''}>
                                        ${v.plate}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="footer-item" style="flex: 1.5; justify-content: flex-end;">
                            <i class="fas fa-map-pin"></i>
                            <span>${unit.location || 'SUCHE SIGNAL...'}</span>
                        </div>
                    </div>
                `;
                cardBox.appendChild(card);
            });
        container.appendChild(section);
    });

    // Pool Rendering...
    const available = officers.filter(o => o.onduty && !assignedIds.includes(o.citizenid));
    available.forEach(off => {
        const el = document.createElement('div');
        el.className = 'officer-tag';
        el.innerHTML = `<i class="fas fa-user"></i> ${off.callsign} | ${off.name}`;
        pool.appendChild(el);
    });
};

// FIX: Globale Speicher-Funktion mit Refresh
window.updateUnitData = function(id, field, value) {
    fetch(`https://${GetParentResourceName()}/updateUnitData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, field: field, value: value })
    }).then(() => {
        // Sofortiger Sync-Refresh
        setTimeout(loadUnitsTab, 200);
    });
};


// Funktionen für Interaktivität
function updateUnitData(id, field, value) {
    fetch(`https://${GetParentResourceName()}/updateUnitData`, {
        method: 'POST',
        body: JSON.stringify({ id: id, field: field, value: value })
    });
}

function cycleUnitStatus(id, current) {
    // Definierte Reihenfolge der Codes
    const codes = ["Code 1", "Code 2", "Code 3", "Code 4", "Code 5", "Code 6", "Code 7", "Code 8", "Code 9", "Code 10"];
    
    let currentIndex = codes.indexOf(current);
    // Fallback falls ein ungültiger oder alter Status vorhanden ist
    if (currentIndex === -1) currentIndex = 0; 
    
    const next = codes[(currentIndex + 1) % codes.length];
    
    // Server-Update
    updateUnitData(id, 'code', next);
    
    // UI Refresh mit Delay für DB-Schreibvorgang
    setTimeout(loadUnitsTab, 200); 
}

// NUI LABS | Reliable Unit Deletion
function deleteUnit(id) {
    showConfirm("Möchten Sie diese Streife wirklich auflösen? Alle Beamten werden automatisch in den Pool verschoben.", () => {
        fetch(`https://${GetParentResourceName()}/deleteUnit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ id: id })
        }).then(() => {
            // Wir geben dem Server 200ms Zeit für den Sync, bevor wir lokal refreshen
            setTimeout(loadUnitsTab, 200);
        }).catch(err => console.error("NUI LABS | Deletion Fetch failed:", err));
    });
}

// Master loading function for NUI LABS
// NUI LABS | Robust Master Loading with Retry-Logic
let fetchRetries = 0;

// NUI LABS | Robust Master Loading with Localized Retry-Logic
function loadUnitsTab(retryCount = 0) {
    const resourceName = GetParentResourceName();
    
    fetch(`https://${resourceName}/getDispatchData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    })
    .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
    })
    .then(data => {
        if (!data) return;
        
        // Success: Sync data to UI components
        dispatchConfig = data.config;
        currentUnits = data.units;

        renderUnitsPage(data.officers, data.units);
        syncSidebarUnits(data.units, data.officers);
        updateUnitMarkers(data.units, data.officers); 
        updateOfficerManagementList(data.officers);
        
    })
    .catch(err => {
        // Silent retry logic to handle script restarts gracefully
        if (retryCount < 3) {
            const nextRetry = retryCount + 1;
            // Wait 2.5 seconds before next attempt to give the client script time to register callbacks
            setTimeout(() => loadUnitsTab(nextRetry), 2500);
        } else {
            // Only log after 3 failed attempts (total ~7.5 seconds)
            console.error("NUI LABS | Connection to client lost. If you just restarted the script, wait a moment.");
        }
    });
}

// Hilfsfunktion für die Sidebar (ersetzt das alte renderUnitList ohne Fetch!)
// NUI LABS | Enhanced Sidebar
function syncSidebarUnits(units, officers) {
    const listElement = document.getElementById('unit-list');
    if (!listElement) return;
    listElement.innerHTML = '';

    Object.values(units).forEach(unit => {
        const offInUnit = officers.filter(o => unit.officers && unit.officers.includes(o.citizenid));
        if (offInUnit.length === 0) return;

        const div = document.createElement('div');
        div.className = 'sidebar-unit-item';
        
        const vehLabel = unit.vehicle ? `${unit.vehicle.label} [${unit.vehicle.plate}]` : "KEIN KFZ";
        
        div.innerHTML = `
            <div class="sidebar-unit-header">
                <span>${unit.name}</span>
                <span class="sidebar-code-badge">${unit.code}</span>
            </div>
            <div class="sidebar-unit-officers">
                ${offInUnit.map(o => `<span><i class="fas fa-user-shield"></i> ${o.callsign} | ${o.name}</span>`).join('')}
            </div>
            <div class="sidebar-extra-info">
                <div class="info-row"><i class="fas fa-car"></i> ${vehLabel}</div>
                <div class="info-row"><i class="fas fa-map-marker-alt"></i> ${unit.location || 'Suche...'}</div>
            </div>
        `;
        listElement.appendChild(div);
    });
}

// DATEI: html/script.js

let currentTargetUnit = null;

window.openAddOfficerModal = function(unitId) {
    currentTargetUnit = unitId;
    fetch(`https://${GetParentResourceName()}/getOfficers`, { method: 'POST', body: '{}' })
    .then(res => res.json())
    .then(officers => {
        const select = document.getElementById('available-officer-select');
        select.innerHTML = '';
        
        // Finde alle aktiven Beamten, die noch keiner Streife zugewiesen sind
        fetch(`https://${GetParentResourceName()}/getUnits`, { method: 'POST', body: '{}' })
        .then(res => res.json())
        .then(units => {
            const assignedIds = Object.values(units).flatMap(u => u.officers);
            const available = officers.filter(o => o.onduty && !assignedIds.includes(o.citizenid));

            if (available.length === 0) {
                select.innerHTML = '<option disabled>Keine verfügbaren Beamten</option>';
            } else {
                available.forEach(off => {
                    select.innerHTML += `<option value="${off.citizenid}">${off.callsign} - ${off.name}</option>`;
                });
            }
            document.getElementById('add-officer-modal').style.display = 'flex';
        });
    });
};

window.closeAddOfficerModal = () => { document.getElementById('add-officer-modal').style.display = 'none'; };

document.getElementById('confirm-add-officer').onclick = function() {
    const cid = document.getElementById('available-officer-select').value;
    if (!cid || !currentTargetUnit) return;

    fetch(`https://${GetParentResourceName()}/assignOfficer`, {
        method: 'POST',
        body: JSON.stringify({ citizenid: cid, unitId: currentTargetUnit })
    }).then(() => {
        closeAddOfficerModal();
        setTimeout(loadUnitsTab, 200);
    });
};

// ÜBERSCHREIBEN DER RECHTEN SIDEBAR FUNKTION
function renderUnitList() {
    fetch(`https://${GetParentResourceName()}/getUnits`, { method: 'POST', body: '{}' })
    .then(res => res.json())
    .then(units => {
        fetch(`https://${GetParentResourceName()}/getOfficers`, { method: 'POST', body: '{}' })
        .then(res => res.json())
        .then(officers => {
            const listElement = document.getElementById('unit-list');
            if (!listElement) return;
            listElement.innerHTML = '';

            Object.values(units).forEach(unit => {
                const offInUnit = officers.filter(o => unit.officers.includes(o.citizenid));
                if (offInUnit.length === 0) return; // Leere Streifen nicht anzeigen (optional)

                const div = document.createElement('div');
                div.className = 'sidebar-unit-item';
                
                let offRows = offInUnit.map(o => `
                    <div class="sidebar-off-row">
                        <i class="fas fa-user-shield" style="font-size:0.7rem; opacity:0.5;"></i>
                        <span>${o.callsign} | ${o.name}</span>
                    </div>
                `).join('');

                div.innerHTML = `
                    <div class="sidebar-unit-header">
                        <span>${unit.name}</span>
                        <span style="font-size:0.7rem; opacity:0.6;">${unit.code}</span>
                    </div>
                    <div class="sidebar-unit-officers">${offRows}</div>
                `;
                listElement.appendChild(div);
            });
        });
    });
}

// DATEI: html/script.js

window.removeFromUnit = function(cid) {
    fetch(`https://${GetParentResourceName()}/removeFromUnit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizenid: cid }) // Sicherstellen, dass Key und Value stimmen
    }).then(() => setTimeout(loadUnitsTab, 200));
};

// DATEI: html/script.js
let vehicleTargetUnit = null;

window.openVehicleModal = function(unitId) {
    vehicleTargetUnit = unitId;
    const select = document.getElementById('vehicle-dropdown');
    select.innerHTML = '<option value="" disabled selected>Fahrzeug auswählen...</option>';

    // Wir holen die Fahrzeugliste aus der Config (via NUI Callback oder direkt)
    // In diesem Fall simulieren wir den Zugriff auf die Config-Daten
    const vehicles = [
        { label: "LSPD Crown Vic", plate: "LSPD-01" },
        { label: "LSPD Interceptor", plate: "LSPD-02" }
        // ... Hier ziehen wir später die echten Daten via fetch
    ];

    vehicles.forEach(veh => {
        select.innerHTML += `<option value='${JSON.stringify(veh)}'>${veh.label} [${veh.plate}]</option>`;
    });

    document.getElementById('vehicle-selection-modal').style.display = 'flex';
};

window.closeVehicleModal = () => { 
    document.getElementById('vehicle-selection-modal').style.display = 'none'; 
};

document.getElementById('confirm-vehicle').onclick = function() {
    const vehData = document.getElementById('vehicle-dropdown').value;
    if (!vehData || !vehicleTargetUnit) return;

    fetch(`https://${GetParentResourceName()}/updateUnitData`, {
        method: 'POST',
        body: JSON.stringify({ 
            id: vehicleTargetUnit, 
            field: 'vehicle', 
            value: JSON.parse(vehData) 
        })
    }).then(() => {
        closeVehicleModal();
        setTimeout(loadUnitsTab, 200);
    });
};


// DATEI: html/script.js
// KLASSE: Global UI Actions

window.openAddOfficerModal = function(unitId) {
    currentTargetUnit = unitId;
    fetch(`https://${GetParentResourceName()}/getOfficers`, { method: 'POST', body: '{}' })
    .then(res => res.json())
    .then(officers => {
        const select = document.getElementById('available-officer-select');
        select.innerHTML = '';
        
        fetch(`https://${GetParentResourceName()}/getUnits`, { method: 'POST', body: '{}' })
        .then(res => res.json())
        .then(units => {
            const assignedIds = Object.values(units).flatMap(u => u.officers || []);
            const available = officers.filter(o => o.onduty && !assignedIds.includes(o.citizenid));

            if (available.length === 0) {
                select.innerHTML = '<option disabled>Kein Personal im Dienst</option>';
            } else {
                available.forEach(off => {
                    select.innerHTML += `<option value="${off.citizenid}">${off.callsign} - ${off.name}</option>`;
                });
            }
            document.getElementById('add-officer-modal').style.display = 'flex';
        });
    });
};

window.openVehicleModal = function(unitId) {
    vehicleTargetUnit = unitId;
    const select = document.getElementById('vehicle-dropdown');
    select.innerHTML = '<option value="" disabled selected>Fahrzeug wählen...</option>';

    // Hier ziehen wir die Fahrzeuge nun sauber aus dem NUI-Kontext (Placeholder für Config)
    const mockVehicles = [
        { label: "LSPD Crown Vic", plate: "LSPD-01" },
        { label: "LSPD Interceptor", plate: "LSPD-02" },
        { label: "LSPD Explorer", plate: "LSPD-03" }
    ];

    mockVehicles.forEach(veh => {
        select.innerHTML += `<option value='${JSON.stringify(veh)}'>${veh.label} [${veh.plate}]</option>`;
    });

    document.getElementById('vehicle-selection-modal').style.display = 'flex';
};

// NUI LABS | Focus Map on Unit
window.focusUnitOnMap = function(unitId) {
    const unit = currentUnits[unitId];
    if (unit && unit.currentCoords) {
        const pos = [unit.currentCoords.y, unit.currentCoords.x];
        
        // Wechsel zum Map Tab
        document.querySelector('[data-page="map-page"]').click();
        
        setTimeout(() => {
            map.panTo(pos, { animate: true, duration: 1.0 });
            if (unitMarkers[unitId]) {
                unitMarkers[unitId].openTooltip();
            }
        }, 200);
    }
};

// NUI LABS | Fix: Missing Function updateOfficerManagementList
function updateOfficerManagementList(officers) {
    const list = document.getElementById('officer-list');
    const countTag = document.getElementById('officer-count');
    if (!list) return;

    list.innerHTML = '';
    let activeCount = 0;

    // Sortierung nach Rang
    officers.sort((a, b) => b.rank - a.rank);

    officers.forEach(off => {
        if (off.onduty) activeCount++;

        const row = document.createElement('div');
        row.className = 'officer-row';
        row.innerHTML = `
            <div class="off-col name-col">
                <i class="fas fa-id-badge" style="opacity: 0.5; margin-right: 1rem;"></i>
                ${off.name}
            </div>
            <div class="off-col status-col">
                <span class="status-badge ${off.onduty ? 'on-duty' : 'off-duty'}">
                    ${off.onduty ? 'On Duty' : 'Off Duty'}
                </span>
            </div>
            <div class="off-col callsign-col">
                <span class="callsign-tag">${off.callsign}</span>
            </div>
            <div class="off-col actions-col">
                <i class="fas fa-user-edit action-icon edit-btn" onclick="openEditModal('${off.citizenid}', '${off.name}', '${off.callsign}', ${off.rank})"></i>
                <i class="fas fa-user-minus action-icon fire-btn" onclick="fireOfficer('${off.citizenid}', '${off.name}')"></i>
            </div>
        `;
        list.appendChild(row);
    });

    if (countTag) {
        countTag.innerText = `${activeCount} / ${officers.length} Aktiv`;
    }
}

// ==========================================
// NUI LABS | CONSOLIDATED DIRECTIVES LOGIC
// ==========================================
let editingDirectiveId = null;
window.allDirectives = [];

// 1. Daten vom Server laden
function loadDirectives() {
    fetch(`https://${GetParentResourceName()}/getDirectivesData`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({}) 
    })
    .then(res => res.json())
    .then(data => {
        if (data && data.directives) {
            window.allDirectives = data.directives; // Cache für Bearbeitung
            renderDirectivesPage(data);
        }
    }).catch(err => console.error("NUI LABS | Directives Load Error:", err));
}

// 2. Die Seite rendern
function renderDirectivesPage(data) {
    const hazardContainer = document.getElementById('hazard-selector');
    const list = document.getElementById('directives-list');
    const addBtn = document.getElementById('add-directive-btn');
    const descText = document.getElementById('hazard-description');

    if (addBtn) addBtn.style.display = data.canManage ? 'flex' : 'none';

    // Hazard Selector
    if (hazardContainer && data.config && data.config.hazardLevels) {
        hazardContainer.innerHTML = '';
        const currentLevel = data.config.hazardLevels.find(l => l.id === parseInt(data.hazardLevel));
        if (descText && currentLevel) descText.innerText = currentLevel.description;

        data.config.hazardLevels.forEach(level => {
            const btn = document.createElement('div');
            const isActive = parseInt(data.hazardLevel) === level.id;
            btn.className = `hazard-btn ${isActive ? 'active' : ''}`;
            btn.style.backgroundColor = level.color;
            btn.style.setProperty('--glow-color', level.color);
            btn.innerHTML = `<span>${level.label}</span>`;
            if (data.canManage) btn.onclick = () => updateHazardLevel(level.id);
            hazardContainer.appendChild(btn);
        });
    }

    // Liste rendern
    if (list) {
        list.innerHTML = '';
        if (data.directives && data.directives.length > 0) {
            data.directives.forEach(dir => {
                const card = document.createElement('div');
                card.className = 'directive-card';
                
                const date = new Date(dir.created_at);
                const dateStr = date.toLocaleDateString('de-DE');
                const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

                card.innerHTML = `
                    <div class="dir-header">
                        <div>
                            <div class="dir-title">${dir.title}</div>
                            <div class="dir-author">${dir.author_rank} ${dir.author_name}</div>
                        </div>
                        ${data.canManage ? `
                            <div class="dir-actions">
                                <i class="fas fa-edit" onclick="prepareEditDirective(${dir.id})" title="Bearbeiten"></i>
                                <i class="fas fa-trash-alt" onclick="deleteDirective(${dir.id})" title="Löschen"></i>
                            </div>
                        ` : ''}
                    </div>
                    <div class="dir-content">${dir.content}</div>
                    <div class="dir-timestamp">${dateStr} - ${timeStr} Uhr</div>
                `;
                list.appendChild(card);
            });
        } else {
            list.innerHTML = '<div style="text-align:center; opacity:0.3; padding:2rem;">Keine Dienstanweisungen vorhanden.</div>';
        }
    }
}

// 3. Modal für Bearbeitung vorbereiten
window.prepareEditDirective = function(id) {
    const dir = window.allDirectives.find(d => d.id == id);
    if (!dir) return;

    editingDirectiveId = dir.id; // WICHTIG: ID setzen
    
    document.getElementById('dir-title').value = dir.title;
    document.getElementById('dir-editor').innerHTML = dir.content;
    document.querySelector('#directive-modal h3').innerText = "Anweisung bearbeiten";
    document.getElementById('directive-submit-btn').innerText = "Änderungen speichern";
    
    document.getElementById('directive-modal').style.display = 'flex';
};

// 4. Modal für NEUE Anweisung öffnen
window.openDirectiveModal = function() {
    editingDirectiveId = null; // Reset
    document.getElementById('dir-title').value = '';
    document.getElementById('dir-editor').innerHTML = '';
    document.querySelector('#directive-modal h3').innerText = "Neue Dienstanweisung";
    document.getElementById('directive-submit-btn').innerText = "Veröffentlichen";
    document.getElementById('directive-modal').style.display = 'flex';
    loadDirectiveDraft();
};

// 5. Daten absenden (Save oder Update)
window.submitDirective = function() {
    const title = document.getElementById('dir-title').value;
    const content = document.getElementById('dir-editor').innerHTML;

    if (!title || content === "" || content === "<br>") return;

    const endpoint = editingDirectiveId ? 'updateDirective' : 'saveDirective';
    const payload = editingDirectiveId 
        ? { id: editingDirectiveId, title: title, content: content } 
        : { title: title, content: content };

    fetch(`https://${GetParentResourceName()}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(payload)
    }).then(() => {
        document.getElementById('directive-modal').style.display = 'none';
        editingDirectiveId = null;
        setTimeout(loadDirectives, 300);
        clearDirectiveDraft();
    });
};

window.closeDirectiveModal = () => { document.getElementById('directive-modal').style.display = 'none'; editingDirectiveId = null; };
function deleteDirective(id) { showConfirm("Anweisung löschen?", () => { fetch(`https://${GetParentResourceName()}/deleteDirective`, { method: 'POST', body: JSON.stringify({ id: id }) }).then(() => setTimeout(loadDirectives, 300)); }); }
window.updateHazardLevel = (l) => { fetch(`https://${GetParentResourceName()}/updateHazard`, { method: 'POST', body: JSON.stringify({ level: l }) }).then(() => setTimeout(loadDirectives, 200)); };


// NUI LABS | Directive Draft Recovery System
window.autoSaveDraft = function() {
    const title = document.getElementById('dir-title').value;
    const content = document.getElementById('dir-editor').innerHTML;
    
    const draft = {
        title: title,
        content: content,
        timestamp: Date.now()
    };
    
    // Wir speichern es lokal im Browser-Cache
    localStorage.setItem('nui_police_dir_draft', JSON.stringify(draft));
};

// Hilfsfunktion zum Laden des Drafts (wird beim Öffnen des Modals gerufen)
window.loadDirectiveDraft = function() {
    const savedDraft = localStorage.getItem('nui_police_dir_draft');
    if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        // Wir füllen die Felder nur, wenn sie aktuell leer sind
        if (document.getElementById('dir-title').value === "") {
            document.getElementById('dir-title').value = draft.title;
            document.getElementById('dir-editor').innerHTML = draft.content;
        }
    }
};

// Hilfsfunktion zum Löschen nach Erfolg
window.clearDirectiveDraft = function() {
    localStorage.removeItem('nui_police_dir_draft');
};


const searchSequences = [
    ["> INITIALIZING DEEP SCAN...", "> BYPASSING FIREWALLS...", "> ACCESSING STATE ARCHIVES...", "> DECRYPTING BIOMETRIC DATA...", "> SUBJECT LOCATED."],
    ["> CONNECTING TO HUB-01...", "> SCANNING NEURAL LINK...", "> RETRIEVING CITIZEN FILE...", "> CROSS-REFERENCING DNA...", "> ANALYSIS COMPLETE."],
    ["> UPLOADING CREDENTIALS...", "> PINGING CENTRAL DATABASE...", "> FILTERING METADATA...", "> VALIDATING IDENTITY...", "> HANDSHAKE SUCCESSFUL."]
];

// NUI LABS | Ultra-Cinematic Terminal Bootstrapper with Layout-Fix
function playAccessSequence(type) {
    const screenId = type === 'person' ? 'terminal-access-screen' : 'vehicle-terminal-screen';
    const contentId = type === 'person' ? 'terminal-content' : 'vehicle-terminal-content';
    const hubId = type === 'person' ? 'registry-landing-hub' : 'vehicle-landing-hub';
    
    const screen = document.getElementById(screenId);
    const body = document.getElementById(contentId);
    const hub = document.getElementById(hubId);
    
    if (!screen || !body || activeIntervals[type]) return;

    // Reset UI State
    screen.classList.remove('hidden', 'terminal-exit-active');
    screen.style.opacity = "1";
    body.innerHTML = '';
    if(hub) {
        hub.classList.remove('hub-reveal-animation');
        hub.style.opacity = "0";
    }

    // Erweiterte Befehlsliste für maximales Feeling
    const lines = [
        { t: `> BOOTING NUI_OS v0.50_BETA...`, d: 100 },
        { t: `> LOADING KERNEL MODULES [OK]`, d: 50 },
        { t: `> ESTABLISHING SECURE GATEWAY TO SAN ANDREAS DATA HUB...`, d: 400 },
        { t: `> UPLOADING OPERATOR_CREDENTIALS: ${localPlayerInfo.name.toUpperCase()}`, d: 200 },
        { t: `> RANK_CLEARANCE: ${localPlayerInfo.rank.toUpperCase()}`, d: 100 },
        { t: `> BYPASSING STATE FIREWALL [#####-----] 50%`, d: 600 },
        { t: `> BYPASSING STATE FIREWALL [##########] 100%`, d: 200 },
        { t: `> HANDSHAKE WITH CENTRAL_DB... DONE.`, d: 300 },
        { t: `> INJECTING AUTHENTICATION_TOKEN...`, d: 400 },
        { t: `> DECRYPTING BIOMETRIC_RECORDS...`, d: 500 },
        { t: `> ACCESS GRANTED. WELCOME BACK, OFFICER.`, d: 300 }
    ];

    let lineIndex = 0;

    function printNextLine() {
        if (lineIndex < lines.length) {
            const line = lines[lineIndex];
            const p = document.createElement('div');
            p.innerHTML = line.t;
            body.appendChild(p);
            
            screen.scrollTop = screen.scrollHeight;
            
            if(Math.random() > 0.85) {
                screen.style.filter = "contrast(2) brightness(1.5) hue-rotate(20deg)";
                setTimeout(() => screen.style.filter = "none", 50);
            }

            lineIndex++;
            setTimeout(printNextLine, line.d); 
        } else {
            // SEQUENZ ENDE -> ÜBERGANG STARTEN
            setTimeout(() => {
                screen.classList.add('terminal-exit-active');
                setTimeout(() => {
                    screen.classList.add('hidden');
                    
                    if(hub) {
                        // REVEAL LOGIC
                        const page = document.getElementById(type === 'person' ? 'person-page' : 'vehicle-page');
                        
                        // Wir bleiben im Landing-Modus (Zentriert), bis eine Suche erfolgt
                        hub.classList.add('hub-reveal-animation');
                        hub.style.opacity = "1";
                    }
                    delete activeIntervals[type];
                }, 800);
            }, 1200);
        }
    }

    activeIntervals[type] = true; 
    printNextLine();
}





// NUI LABS | Sharp Cinematic Matrix Effect
function startMatrixEffect(duration) {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    
    canvas.classList.remove('hidden');
    canvas.classList.add('visible');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const chars = "010182736459ABCDEF"; 
    const fontSize = 18;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = "rgba(10, 20, 30, 0.1)"; // Langsames Verblassen für Schweif-Effekt
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = `bold ${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            
            // Zufälliges Aufleuchten von Zeichen
            ctx.fillStyle = (Math.random() > 0.98) ? "#ffffff" : "rgba(0, 209, 255, 0.4)"; 
            
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }

    const inst = setInterval(draw, 40);
    setTimeout(() => { 
        clearInterval(inst); 
        canvas.classList.remove('visible');
        setTimeout(() => canvas.classList.add('hidden'), 1000);
    }, duration);
}

// NUI LABS | Tactical Terminal Controller - Search Execution
document.getElementById('person-search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const val = this.value.trim();
        if (val.length < 2) return;

        const results = document.getElementById('person-results');
        const statusBox = document.getElementById('search-status-display');
        const anim = document.getElementById('search-animation');
        const statusTxt = document.getElementById('scanning-message-text');
        const progressBar = document.getElementById('scan-progress');

        // 1. Initial UI Reset
        results.innerHTML = '';
        statusBox.classList.add('hidden');
        anim.classList.remove('hidden');

        // 2. START MATRIX EFFECT (Sync with 5s search time)
        startMatrixEffect(5000); 

        // 3. Progress Bar & Matrix Sync (5 Seconds)
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        setTimeout(() => { 
            progressBar.style.transition = 'width 5.0s linear'; 
            progressBar.style.width = '100%'; 
        }, 50);

        // 4. Message Loop (Visual feedback)
        const sequence = searchSequences[Math.floor(Math.random() * searchSequences.length)];
        let msgIndex = 0;
        statusTxt.innerText = sequence[0];
        const msgInterval = setInterval(() => {
            msgIndex++;
            if (msgIndex < sequence.length) statusTxt.innerText = sequence[msgIndex];
        }, 1000);

        // 5. Database Fetch after 5s
        setTimeout(() => {
            clearInterval(msgInterval);
            fetch(`https://${GetParentResourceName()}/searchPerson`, { method: 'POST', body: JSON.stringify({ name: val }) })
            .then(res => res.json())
            .then(data => {
                anim.classList.add('hidden');
                // WICHTIG: Landing-Klasse entfernen, damit der Content nach oben rückt
                const page = document.getElementById('person-page');
                page.classList.remove('person-page-landing'); 
                page.classList.add('person-page-searching');
                page.style.padding = "3rem 4rem"; // Normales Padding für Ergebnisse

                const hasData = data && data.length > 0;
                statusBox.innerHTML = hasData ? "SUCCESSFUL: SUBJECT(S) LOCATED" : "ERROR: NO DATABASE ENTRY";
                statusBox.className = `status-box-premium ${hasData ? 'status-success' : 'status-error'}`;
                statusBox.classList.remove('hidden');

                setTimeout(() => {
                    statusBox.classList.add('hidden');
                    renderPersonResults(data);
                }, 2000);
            });
        }, 5000);
    }
});


// Die bereinigte Render-Funktion ohne Avatar
function renderPersonResults(data) {
    const container = document.getElementById('person-results');
    const countBadge = document.getElementById('person-result-count');
    
    container.innerHTML = ''; // WICHTIG: Löscht alte Chips vor dem Neuzeichnen
    
    if (!data || data.length === 0) {
        countBadge.classList.add('hidden');
        container.innerHTML = `<div class="status-box-premium status-error">KEIN EINTRAG GEFUNDEN</div>`;
        return;
    }

    countBadge.innerText = `${data.length} PERSONEN IM SYSTEM GEFUNDEN (BEREIT FÜR EINGABE...)`;
    countBadge.classList.remove('hidden');

    data.forEach(p => {
        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = `
            <div class="name-header" style="font-size: 1.4rem; color: #fff; font-weight: 900; border-bottom: 2px solid var(--accent); padding-bottom: 0.5rem; margin-bottom: 1rem;">
                ${p.firstname.toUpperCase()} ${p.lastname.toUpperCase()}
            </div>

            <div class="card-info-grid">
                <div class="info-item"><span class="info-label">Geschlecht</span><span class="info-value">${p.sex}</span></div>
                <div class="info-item"><span class="info-label">Geburtstag</span><span class="info-value">${p.dob}</span></div>
                <div class="info-item"><span class="info-label">Einreise</span><span class="info-value">${p.entryDate || 'Unbekannt'}</span></div>
                <div class="info-item"><span class="info-label">Job</span><span class="info-value">${p.job}</span></div>
                <div class="info-item">
                    <span class="info-label">Fahndung</span>
                    <span class="info-value" style="color: ${p.wanted ? '#ff4d4d' : '#44ff44'}">${p.wanted ? 'GESUCHT' : 'NEIN'}</span>
                </div>
            

                <div class="license-container" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <div class="license-badge ${p.licenses.driver ? 'license-valid' : 'license-invalid'}" style="flex:1; text-align:center; font-size:0.6rem; padding: 0.4rem;">FÜHRERSCHEIN</div>
                    <div class="license-badge ${p.licenses.weapon ? 'license-valid' : 'license-invalid'}" style="flex:1; text-align:center; font-size:0.6rem; padding: 0.4rem;">WAFFENSCHEIN</div>
                </div>
            </div>

            <button class="btn-small" onclick="openDossier('${p.citizenid}')">
                <i class="fas fa-folder-open"></i> > AKTE ÖFFNEN
            </button>
        `;
        container.appendChild(card);
    });
}

// NUI LABS | Unified Reset & Trigger Logic
// NUI LABS | Clean Reset Logic
function resetPersonRegister() {
    const page = document.getElementById('person-page');
    if (!page) return;

    page.classList.add('person-page-landing');
    page.classList.remove('person-page-searching');
    page.style.padding = "0"; // Erzwingt Zentrierung durch CSS

    if (!terminalStatus.person) {
        playAccessSequence('person');
        terminalStatus.person = true;
    } else {
        const hub = document.getElementById('registry-landing-hub');
        if(hub) { hub.style.opacity = "1"; hub.classList.remove('hub-reveal-animation'); }
    }
}

// NUI LABS | Fixed Vehicle Register Reset
function resetVehicleRegister() {
    const page = document.getElementById('vehicle-page');
    const hub = document.getElementById('vehicle-landing-hub');
    const results = document.getElementById('vehicle-results');
    const staticHeader = document.getElementById('vehicle-header-static');

    if (!page) return;

    // 1. UI-Klassen zurücksetzen
    page.classList.add('vehicle-page-landing');
    page.classList.remove('vehicle-page-searching');
    
    // 2. Elemente ein/ausblenden
    if (results) results.innerHTML = '';
    if (staticHeader) staticHeader.style.display = 'none';
    if (hub) {
        hub.style.display = 'flex';
        hub.style.opacity = "1";
    }

    // 3. Terminal Sequenz nur beim ersten Mal abspielen
    if (!terminalStatus.vehicle) {
        playAccessSequence('vehicle');
        terminalStatus.vehicle = true;
    } else {
        if(hub) hub.classList.remove('hub-reveal-animation');
    }
}

let terminalStatus = { person: false, vehicle: false };

// NUI LABS | Dossier Logic
// Diese Funktion behebt den ReferenceError
function openDossier(citizenid) {
    console.log("Öffne Dossier für CitizenID: " + citizenid);

    // Hier wird die Anfrage an den FiveM-Client gesendet
    fetch(`https://${GetParentResourceName()}/getPersonDossier`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
            citizenid: citizenid
        })
    }).then(resp => resp.json()).then(resp => {
        if (resp && resp.data) {
            // Hier kommt später die Logik zum Anzeigen der Akte hin
            console.log("Dossier-Daten empfangen:", resp.data);
        }
    });
}

// ==========================================
// NUI LABS | DMV VEHICLE SEARCH LOGIC
// ==========================================

const vehicleSearchSequences = [
    ["> CONNECTING TO DMV CENTRAL...", "> SCANNING REGISTRY...", "> RETRIEVING VEHICLE DATA...", "> UPLOADING PLATE METADATA...", "> ACCESS GRANTED."],
    ["> PINGING STATE DATABASE...", "> DECRYPTING OWNER INFO...", "> CHECKING REGISTRATION STATUS...", "> CROSS-REFERENCING VIN...", "> DATA RETRIEVED."]
];

document.getElementById('vehicle-search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const val = this.value.trim();
        if (val.length < 2) return;

        const results = document.getElementById('vehicle-results');
        const statusBox = document.getElementById('vehicle-search-status');
        const anim = document.getElementById('vehicle-search-animation');
        const statusTxt = document.getElementById('vehicle-scanning-text');

        // Reset UI
        results.innerHTML = '';
        statusBox.classList.add('hidden');
        anim.classList.remove('hidden');

        // Message Sequence (ca. 4 Sekunden für das DMV Feeling)
        const sequence = vehicleSearchSequences[Math.floor(Math.random() * vehicleSearchSequences.length)];
        let msgIndex = 0;
        statusTxt.innerText = sequence[0];
        
        const msgInterval = setInterval(() => {
            msgIndex++;
            if (msgIndex < sequence.length) statusTxt.innerText = sequence[msgIndex];
        }, 800);

        // Server Request
        // Server Request & Cinematic Transition
        setTimeout(() => {
            clearInterval(msgInterval);
            fetch(`https://${GetParentResourceName()}/searchVehicle`, { 
                method: 'POST', 
                body: JSON.stringify({ search: val }) 
            })
            .then(res => res.json())
            .then(data => {
                anim.classList.add('hidden');
                const page = document.getElementById('vehicle-page');
                page.classList.remove('vehicle-page-landing');
                page.classList.add('vehicle-page-searching');
                page.style.padding = "3rem 4rem";
                
                if (data && data.length > 0) {
                    statusBox.innerHTML = "DMV SEARCH SUCCESSFUL";
                    statusBox.className = "status-box-premium status-success";
                    statusBox.classList.remove('hidden');

                    setTimeout(() => {
                        statusBox.classList.add('hidden');
                        
                        // WICHTIG: Hier wird das Layout umgeschaltet
                        const page = document.getElementById('vehicle-page');
                        page.classList.remove('vehicle-page-landing');
                        page.classList.add('vehicle-page-searching');
                        
                        // Header zeigen, Hub verstecken
                        document.getElementById('vehicle-header-static').style.display = 'flex';
                        document.getElementById('vehicle-landing-hub').style.display = "none"; 
                        
                        renderVehicleResults(data);
                    }, 1500);
                } else {
                    statusBox.innerHTML = "CRITICAL ERROR: NO DATABASE RECORDS FOUND";
                    statusBox.className = "status-box-premium status-error";
                    statusBox.classList.remove('hidden');
                    statusBox.style.opacity = "1";
                }
            });
        }, 4000);
    }
});

function renderVehicleResults(data) {
    const container = document.getElementById('vehicle-results');
    container.innerHTML = '';
    container.style.opacity = "1";
    container.style.display = "grid";

    data.forEach(veh => {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.setAttribute('data-plate', veh.plate);
        
        const isWanted = veh.policeData && veh.policeData.isWanted;
        const notesCount = (veh.policeData && veh.policeData.notes) ? veh.policeData.notes.length : 0;
        
        const statusText = isWanted ? 'SYSTEM-WARNUNG: FAHNDUNG AKTIV' : 'STATUS: REGULÄR / OK';
        const statusClass = isWanted ? 'status-wanted-yes' : 'status-wanted-no';
        
        const btnText = isWanted ? 'LÖSCHEN' : 'MELDEN';
        const btnColor = isWanted ? '#44ff44' : '#ff4d4d';

        card.innerHTML = `
            <div class="model-title">${veh.modelName.toUpperCase()}</div>
            <div class="card-info-grid">
                <div class="info-item"><span class="info-label">KENNZEICHEN</span><span class="info-value" style="color: var(--accent); font-weight: 800;">${veh.plate}</span></div>
                <div class="info-item"><span class="info-label">BESITZER</span><span class="info-value">${veh.ownerName}</span></div>
            </div>
            <div class="status-tag ${statusClass}">${statusText}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: auto;">
                <button class="btn-small" style="grid-column: span 2;" onclick="openDossier('${veh.citizenid}')"><i class="fas fa-id-card"></i> PERSONEN-AKTE</button>
                
                <div class="note-btn-wrapper">
                    ${notesCount > 0 ? `<span class="note-badge">${notesCount}</span>` : ''}
                    <button class="btn-small" style="width:100%" onclick="openVehicleNotes('${veh.plate}')">
                        <i class="fas fa-clipboard-list"></i> NOTIZEN
                    </button>
                </div>

                <button class="btn-small" style="border-color: ${btnColor}; color: ${btnColor};" onclick="toggleVehicleWanted('${veh.plate}', ${!isWanted})">
                    <i class="fas ${isWanted ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${btnText}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// NUI LABS | DMV Interaction: Toggle Wanted
window.toggleVehicleWanted = function(plate, wantedStatus) {
    fetch(`https://${GetParentResourceName()}/toggleVehicleWanted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: plate, wanted: wantedStatus })
    }).then(() => {
        refreshVehicleCard(plate); // Instant Update statt Suche
    });
};

// NUI LABS | Vehicle Intelligence Controller
let currentVehiclePlate = null;

// NUI LABS | Vehicle Intelligence: Open & Render Notes with Delete Option
window.openVehicleNotes = function(plate) {
    currentVehiclePlate = plate;
    document.getElementById('notes-plate-display').innerText = plate;
    
    fetch(`https://${GetParentResourceName()}/searchVehicle`, { method: 'POST', body: JSON.stringify({ search: plate }) })
    .then(res => res.json())
    .then(data => {
        const veh = data[0];
        const list = document.getElementById('vehicle-notes-list');
        list.innerHTML = '';

        if (veh.policeData && veh.policeData.notes && veh.policeData.notes.length > 0) {
            veh.policeData.notes.sort((a, b) => b.id - a.id).forEach(note => {
                const item = document.createElement('div');
                item.className = 'directive-card'; 
                item.style.marginBottom = "0.8rem";
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div class="dir-content" style="font-size: 0.9rem; flex: 1;">${note.content}</div>
                        <i class="fas fa-trash-alt note-delete-btn" onclick="deleteVehicleNote('${veh.plate}', ${note.id})"></i>
                    </div>
                    <div class="dir-timestamp" style="font-size: 0.65rem; margin-top: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.4rem;">
                        ${note.rank} ${note.author} | ${note.date}
                    </div>
                `;
                list.appendChild(item);
            });
        } else {
            list.innerHTML = '<div class="empty-notes-msg">KEINE DATENSÄTZE VORHANDEN</div>';
        }
        document.getElementById('vehicle-notes-modal').style.display = 'flex';
    });
};

// NUI LABS | Delete Note Action
window.deleteVehicleNote = function(plate, noteId) {
    showConfirm("Eintrag entfernen?", () => {
        fetch(`https://${GetParentResourceName()}/deleteVehicleNote`, {
            method: 'POST',
            body: JSON.stringify({ plate: plate, id: noteId })
        }).then(() => {
            openVehicleNotes(plate);
            refreshVehicleCard(plate); // Badge auf der Karte refresh
        });
    });
};

window.saveVehicleNote = function() {
    const content = document.getElementById('new-vehicle-note').value.trim();
    if (!content || !currentVehiclePlate) return;

    fetch(`https://${GetParentResourceName()}/saveVehicleNote`, {
        method: 'POST',
        body: JSON.stringify({ plate: currentVehiclePlate, content: content })
    }).then(() => {
        document.getElementById('new-vehicle-note').value = '';
        openVehicleNotes(currentVehiclePlate); // Modal-Inhalt refresh
        refreshVehicleCard(currentVehiclePlate); // Badge auf der Karte refresh
    });
};

window.closeVehicleNotes = () => { document.getElementById('vehicle-notes-modal').style.display = 'none'; };

// NUI LABS | Smooth UI Update for Single Vehicle Chip
window.refreshVehicleCard = function(plate) {
    fetch(`https://${GetParentResourceName()}/searchVehicle`, { 
        method: 'POST', 
        body: JSON.stringify({ search: plate }) 
    })
    .then(res => res.json())
    .then(data => {
        const veh = data.find(v => v.plate === plate);
        if (!veh) return;

        const card = document.querySelector(`.vehicle-card[data-plate="${plate}"]`);
        if (!card) return;

        // Wir berechnen nur die variablen Teile neu
        const isWanted = veh.policeData && veh.policeData.isWanted;
        const notesCount = (veh.policeData && veh.policeData.notes) ? veh.policeData.notes.length : 0;
        
        // 1. Status Tag aktualisieren
        const statusTag = card.querySelector('.status-tag');
        statusTag.className = `status-tag ${isWanted ? 'status-wanted-yes' : 'status-wanted-no'}`;
        statusTag.innerText = isWanted ? 'SYSTEM-WARNUNG: FAHNDUNG AKTIV' : 'STATUS: REGULÄR / OK';

        // 2. Notiz-Badge aktualisieren
        const btnWrapper = card.querySelector('.note-btn-wrapper');
        let badge = btnWrapper.querySelector('.note-badge');
        
        if (notesCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'note-badge';
                btnWrapper.prepend(badge);
            }
            badge.innerText = notesCount;
        } else if (badge) {
            badge.remove();
        }

        // 3. Fahndungs-Button aktualisieren
        const wantedBtn = card.querySelectorAll('.btn-small')[2]; // Der dritte Button
        const btnColor = isWanted ? '#44ff44' : '#ff4d4d';
        wantedBtn.style.borderColor = btnColor;
        wantedBtn.style.color = btnColor;
        wantedBtn.innerHTML = `<i class="fas ${isWanted ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${isWanted ? 'LÖSCHEN' : 'MELDEN'}`;
        wantedBtn.setAttribute('onclick', `toggleVehicleWanted('${veh.plate}', ${!isWanted})`);
    });
};