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

// NUI LABS | Unified Navigation Logic
// NUI LABS | Unified Navigation Logic
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const pageId = item.getAttribute('data-page');
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.add('active');
            
            // Kontext-abhängiges Laden der Daten
            if (pageId === 'units-page') {
                loadUnitsTab(); // Die Funktion steht in Zeile 670 deiner Datei!
            } else if (pageId === 'orders-page') {
                loadDirectives(); // Lädt die Dienstanweisungen#
            } else if (pageId === 'map-page' && map) {
                setTimeout(() => { map.invalidateSize(); }, 200);
            } else if (pageId === 'officers-page') {
                loadOfficersPage();
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
    
    if (data.action === "updateUnitsList") {
        // Master-Daten neu laden
        loadUnitsTab();
        // Icons auf der Karte aktualisieren
        if (data.units) {
            updateUnitMarkers(data.units);
        }
    }
    if (data.action === "setVisible") {
        document.getElementById('app-container').style.display = data.status ? 'flex' : 'none';
        if (data.status) {
            // Wir geben der UI 200ms Zeit zum Rendern, bevor wir die Map bewegen
            setTimeout(() => {
                initMap();
                loadUnitsTab(); // Lädt alle Master-Daten (Icons, Ränge etc.)
                
                // SMOOTH CENTERING FIX
                if (data.coords) {
                    // GTA Koordinaten (x,y) müssen für Leaflet zu [y, x] gedreht werden
                    const pos = [data.coords.y, data.coords.x];
                    
                    // setView zentriert die Karte mit Animation (1.5 Sekunden Dauer)
                    // Die "4" ist das Zoom-Level – kannst du nach Wunsch anpassen (1-5)
                    map.setView(pos, 3, {
                        animate: true,
                        pan: { duration: 1 }
                    });
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