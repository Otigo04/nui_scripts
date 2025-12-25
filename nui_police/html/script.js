let map;
let playerBlip;
let CUSTOM_CRS;
let unitMarkers = {};

const center_x = 117.3;
const center_y = 172.8;
const scale_x = 0.02072;
const scale_y = 0.0205;



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

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const target = item.getAttribute('data-page');
        
        // 1. Alle Nav-Buttons zurücksetzen und den geklickten aktivieren
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // 2. Alle Inhalts-Seiten verstecken
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        
        // 3. Die Zielseite anhand der ID finden
        const activePage = document.getElementById(target);
        
        // 4. Wenn die Seite existiert, anzeigen und Daten laden
        if (activePage) {
            activePage.classList.add('active');
            console.log("NUI LABS | Tab switch to: " + target); 
            
            // Logik je nach gewählter Seite
            if (target === 'officers-page') {
                loadOfficersPage();
            } else if (target === 'units-page') {
                // Lädt die Streifen-Übersicht und den Officer-Pool
                loadUnitsTab();
                // Aktualisiert die rechte Sidebar-Liste
                renderUnitList(); 
            } else if (target === 'map-page' && map) {
                // Karte neu berechnen, falls sich die Container-Größe geändert hat
                setTimeout(() => { map.invalidateSize(); }, 100);
            }
        }
    });
});


// NUIPolice/html/script.js UPDATE

function loadOfficersPage() {
    fetch(`https://${GetParentResourceName()}/getOfficers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    })
    .then(res => res.json())
    .then(officers => {
        const list = document.getElementById('officer-list');
        const countTag = document.getElementById('officer-count');
        if (!list) return;
        
        list.innerHTML = ''; 
        let activeCount = 0;

        officers.sort((a, b) => b.rank - a.rank);

        officers.forEach(off => {
            if (off.onduty) activeCount++; // Zählt aktive Beamte

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

        // Update der x/x Anzeige
        if (countTag) {
            countTag.innerText = `${activeCount} / ${officers.length} Aktiv`;
        }
    });
}

// 2. UNIT UPDATES (MAP & SIDEBAR)
function updateUnitMarkers(units) {
    if (!map) return;
    const currentUnitIds = units.map(u => u.source.toString());

    units.forEach(unit => {
        const unitId = unit.source.toString();
        const pos = [unit.coords.y, unit.coords.x];

        // Beamter mit Hut Icon (Clean Look)
        const policeIcon = L.divIcon({
            className: 'custom-unit-blip',
            html: `<div class="blip-icon-wrapper"><i class="fas fa-user-tie"></i></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const tooltipHTML = `
            <div style="text-align: center;">
                <span style="color: var(--primary); font-weight: 800;">${unit.callsign}</span><br>
                <strong>${unit.name}</strong><br>
                <small style="opacity: 0.7;">${unit.grade}</small>
            </div>
        `;

        if (unitMarkers[unitId]) {
            unitMarkers[unitId].setLatLng(pos);
            unitMarkers[unitId].setTooltipContent(tooltipHTML);
        } else {
            unitMarkers[unitId] = L.marker(pos, { icon: policeIcon, zIndexOffset: 1000 })
                .addTo(map)
                .bindTooltip(tooltipHTML, { permanent: false, direction: 'top', className: 'map-tooltip', offset: [0, -10] });
        }
    });

    for (let id in unitMarkers) {
        if (!currentUnitIds.includes(id)) {
            map.removeLayer(unitMarkers[id]);
            delete unitMarkers[id];
        }
    }
}

function renderUnitList(units) {
    const listElement = document.getElementById('unit-list');
    if (!listElement) return;
    listElement.innerHTML = '';
    units.forEach(unit => {
        const div = document.createElement('div');
        div.className = 'unit-item';
        div.innerHTML = `
            <div class="unit-info">
                <span class="callsign">${unit.callsign}</span>
                <span class="name">${unit.name}</span>
            </div>
            <span class="badge">${unit.grade}</span>
        `;
        listElement.appendChild(div);
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
    if (data.action === "updateUnitsList") {
        // Wenn der Server neue Units schickt, laden wir die Seite neu
        loadUnitsTab();
    }
    if (data.action === "setVisible") {
        document.getElementById('app-container').style.display = data.status ? 'flex' : 'none';
        if (data.status) {
            setTimeout(() => {
                initMap();
                if (data.coords) {
                    const pos = [data.coords.y, data.coords.x];
                    if (!playerBlip) {
                        playerBlip = L.marker(pos, { icon: L.icon({ iconUrl: 'blips/1.png', iconSize: [24, 24] }) }).addTo(map);
                    } else {
                        playerBlip.setLatLng(pos);
                    }
                    map.panTo(pos);
                }
                map.invalidateSize();
            }, 200);
        }
    } else if (data.action === "updateUnits") {
        renderUnitList(data.units);
        updateUnitMarkers(data.units);
    }
});

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
    if (document.getElementById('app-container').style.display !== 'none' && 
        document.getElementById('units-page').classList.contains('active')) {
        // Triggert die Standort-Abfrage auf dem Server
        fetch(`https://${GetParentResourceName()}/refreshLocations`, { method: 'POST', body: '{}' })
        .then(() => loadUnitsTab());
    }
}, 10000);

// DATEI: html/script.js
// KLASSE: Unit Management Core

// Wir definieren die Fahrzeugliste global (sollte eigentlich aus Config kommen)
const availableVehicles = [
    { label: "Kein Fahrzeug", model: "none", plate: "N/A" },
    { label: "Victoria Crown", model: "police", plate: "LSPD-01" },
    { label: "Dodge Charger", model: "police2", plate: "LSPD-02" },
    { label: "Ford Explorer", model: "police3", plate: "LSPD-03" }
];

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

        // 2. KORREKTUR: Innerhalb von window.renderUnitsPage -> unitsInCategory.forEach
            // DATEI: html/script.js
// FUNKTION: renderUnitsPage (Den gesamten Block in der Schleife ersetzen)

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
                            <i class="fas fa-pencil-alt edit-unit-icon" onclick="openUnitEdit('${unit.id}')"></i>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.4rem;">
                            <div class="btn-add-minimal-header" onclick="openAddOfficerModal('${unit.id}')">
                                <i class="fas fa-plus"></i>
                            </div>
                            <select class="inline-select ${codeClass}" onchange="updateUnitData('${unit.id}', 'code', this.value)">
                                <option value="Code 1" ${unit.code === 'Code 1' ? 'selected' : ''}>CODE 1</option>
                                <option value="Code 2" ${unit.code === 'Code 2' ? 'selected' : ''}>CODE 2</option>
                                <option value="Code 3" ${unit.code === 'Code 3' ? 'selected' : ''}>CODE 3</option>
                                <option value="Code 4" ${unit.code === 'Code 4' ? 'selected' : ''}>CODE 4</option>
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
                            <select class="inline-select" style="width:100%; border:none; background:transparent !important; padding-left:0;" onchange="updateUnitData('${unit.id}', 'vehicle', JSON.parse(this.value))">
                                <option value='{"label":"KEIN KFZ","plate":"N/A"}' ${!unit.vehicle ? 'selected' : ''}>KEIN KFZ</option>
                                ${availableVehicles.map(v => `
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

function deleteUnit(id) {
    showConfirm("Möchten Sie diese Streife wirklich auflösen?", () => {
        fetch(`https://${GetParentResourceName()}/deleteUnit`, {
            method: 'POST',
            body: JSON.stringify({ id: id })
        }).then(() => loadUnitsTab());
    });
}

function loadUnitsTab() {
    fetch(`https://${GetParentResourceName()}/getOfficers`, { method: 'POST', body: '{}' })
    .then(res => res.json())
    .then(officers => {
        fetch(`https://${GetParentResourceName()}/getUnits`, { method: 'POST', body: '{}' })
        .then(res => res.json())
        .then(units => {
            currentUnits = units;
            renderUnitsPage(officers, units);
        }).catch(e => console.error("Fehler bei getUnits:", e));
    }).catch(e => console.error("Fehler bei getOfficers:", e));
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
