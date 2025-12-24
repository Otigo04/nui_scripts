console.log('NUI LABS Tablet: Script loaded! (V3)');

let clockInterval; // Variable to store the timer
let userTimezone = 'UTC'; // Default fallback
let userLocale = 'en-US';

let availableWallpapers = []; // Wird von Lua gefüllt
let currentSettings = {
    wallpaper: 'linear-gradient(135deg, #1c1c1c 0%, #2a2a2a 100%)',
    scale: 1.0,
    accentColor: '#0078d4',
    textColor: '#ffffff', // NEU: Text Color
    font: 'font-inter',
    airplaneMode: false,
    wifi: true
};

window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === 'open') {
        // Save settings from config
        if (data.timezone) userTimezone = data.timezone;
        if (data.locale) userLocale = data.locale;
        if (data.wallpapers) {
            availableWallpapers = data.wallpapers;
        }
        loadSettings();

        openTablet(data.apps);
    } else if (data.action === 'close') {
        closeTablet();
    }
});

function openTablet(apps) {
    console.log('Opening Tablet UI...');
    
    if (apps) renderApps(apps);

    // Start the clock
    startClock();

    const container = document.getElementById('tablet-container');
    if (container) {
        container.classList.add('show-tablet');
    }
}

function closeTablet() {
    console.log('Closing Tablet UI...');
    
    // Stop the clock to save performance when closed
    stopClock();

    const container = document.getElementById('tablet-container');
    if (container) {
        container.classList.remove('show-tablet');
    }

    setTimeout(() => {
        fetch(`https://${GetParentResourceName()}/closeUI`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    }, 400);
}

// --- CLOCK FUNCTIONS ---

function startClock() {
    // Update immediately so we don't wait 1 second
    updateTime();
    // Update every second
    clockInterval = setInterval(updateTime, 1000);
}

function stopClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
}

function updateTime() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    
    // Format the time based on Config settings
    const timeString = now.toLocaleTimeString(userLocale, {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit'
    });

    if (clockElement) {
        clockElement.innerText = timeString;
    }
}

document.onkeyup = function(data) {
    if (data.key === "Escape") {
        closeTablet();
    }
};

function renderApps(appList) {
    const grid = document.getElementById('app-grid');
    grid.innerHTML = ''; // Clear previous apps to avoid duplicates

    appList.forEach(app => {
        // Create the HTML structure for one app
        const appDiv = document.createElement('div');
        appDiv.classList.add('app-item');
        // We store the resource name in a data attribute for later usage
        appDiv.dataset.resource = app.resourceName;
        appDiv.dataset.name = app.name;

        appDiv.innerHTML = `
            <div class="app-icon">
                <i class="${app.icon}"></i>
            </div>
            <div class="app-label">${app.label}</div>
        `;

        // IN renderApps Loop:
        appDiv.onclick = function() {
            this.style.transform = "scale(0.95)";
            setTimeout(() => this.style.transform = "", 100);
            
            // Call the new function
            launchApp(app);
        };

        grid.appendChild(appDiv);
    });
}

function launchApp(appData) {
    // Kurzes visuelles Feedback (Icon wird kleiner)
    const icon = document.querySelector(`.app-item[data-name="${appData.name}"]`);
    if (icon) {
        icon.style.transform = "scale(0.9)";
        setTimeout(() => icon.style.transform = "scale(1)", 100);
    }

    // Unterscheidung: Interne Apps vs. Externe Apps
    if (appData.name === 'settings') {
        // --- INTERNE APP: SETTINGS (Bleibt im Tablet) ---
        openInternalApp('settings');
    } else {
        // --- EXTERNE APP: (E-Mail etc.) ---
        // Wir senden an Lua: "Bitte Tablet schließen und diese App starten"
        console.log(`Launcher: Starting external app ${appData.name}`);
        
        fetch(`https://${GetParentResourceName()}/launchExternalApp`, {
            method: 'POST',
            body: JSON.stringify({ 
                app: appData.name,
                resource: appData.resourceName
            })
        });
    }
}

function openInternalApp(appName) {
    const window = document.getElementById('app-window');
    const grid = document.getElementById('app-grid');
    const content = document.getElementById('app-content');

    // UI Switch
    grid.classList.remove('fade-in');
    grid.classList.add('hide-grid');
    window.classList.remove('fade-out');
    window.classList.add('show-window');

    if (appName === 'settings') {
        renderSettingsApp(content);
    }
}

// 3. Go Home Function (Back to Grid)
function goHome() {
    const grid = document.getElementById('app-grid');
    const window = document.getElementById('app-window');

    // Only go home if we are NOT already on grid
    if (window.classList.contains('show-window')) {
        console.log('Going Home...');

        // Hide Window
        window.classList.remove('show-window');
        window.classList.add('fade-out');

        // Show Grid
        setTimeout(() => {
            grid.classList.remove('hide-grid');
            grid.classList.add('fade-in');
        }, 100); // Short delay for smooth transition
    }
}

// Event Listener for the Home Bar
document.getElementById('home-bar-container').addEventListener('click', goHome);

function renderSettingsApp(container) {
    // Wallpapers HTML
    let wallpaperHTML = availableWallpapers.map(wp => 
        `<div class="wallpaper-option ${currentSettings.wallpaper === wp.value ? 'active' : ''}" 
              style="background: ${wp.value}" 
              onclick="changeWallpaper('${wp.value}')"></div>`
    ).join('');

    // Colors HTML
    const colors = ['#0078d4', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f', '#ecf0f1', '#ff0055'];
    let colorHTML = colors.map(col => 
        `<div class="color-circle" 
              style="background: ${col}; border: ${currentSettings.accentColor === col ? '2px solid white' : '2px solid transparent'}" 
              onclick="changeAccentColor('${col}')"></div>`
    ).join('');

    // Fonts HTML
    const fonts = [
        {name: 'Inter', class: 'font-inter'},
        {name: 'Roboto', class: 'font-roboto'},
        {name: 'Lato', class: 'font-lato'},
        {name: 'Code', class: 'font-mono'}
    ];
    let fontHTML = fonts.map(f => 
        `<button class="font-btn ${currentSettings.font === f.class ? 'active' : ''}" 
                 style="font-family: ${f.name === 'Code' ? 'Courier Prime' : f.name}"
                 onclick="changeFont('${f.class}')">${f.name}</button>`
    ).join('');

    container.innerHTML = `
        <div class="settings-container">
            <h1 style="margin-top:0; margin-bottom: 20px;">Settings</h1>

            <div class="settings-section">
                <div class="settings-title">Appearance</div>
                
                <div class="settings-row">
                    <span>Accent Color</span>
                    <div class="color-grid">${colorHTML}</div>
                </div>

                <div class="settings-row">
                    <span>Text Color</span>
                    <div class="color-grid">${textColorHTML}</div>
                </div>

                <div class="settings-row">
                    <span>System Font</span>
                    <div style="display:flex; gap:5px;">${fontHTML}</div>
                </div>

                <div class="settings-title" style="margin-top: 20px;">Wallpaper</div>
                <div class="wallpaper-grid">
                    ${wallpaperHTML}
                </div>
                <input type="text" class="custom-input" placeholder="Paste Image URL..." 
                       onchange="changeWallpaper('url(' + this.value + ')')">
            </div>

            <div class="settings-section">
                <div class="settings-title">Display</div>
                <div class="settings-row">
                    <span>Tablet Size</span>
                    <span id="scale-val">${Math.round(currentSettings.scale * 100)}%</span>
                </div>
                <input type="range" min="0.7" max="1.3" step="0.05" value="${currentSettings.scale}" 
                       style="width: 100%; margin-bottom: 10px;"
                       oninput="changeScale(this.value)">
            </div>

            <div class="settings-section">
                <div class="settings-title">Connectivity</div>
                
                <div class="settings-row">
                    <span><i class="fas fa-plane"></i> Airplane Mode</span>
                    <label class="switch">
                        <input type="checkbox" onchange="toggleAirplane(this.checked)" ${currentSettings.airplaneMode ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="settings-row">
                    <span><i class="fas fa-wifi"></i> Wi-Fi</span>
                    <label class="switch">
                        <input type="checkbox" onchange="toggleWifi(this.checked)" ${currentSettings.wifi ? 'checked' : ''} id="wifi-toggle" ${currentSettings.airplaneMode ? 'disabled' : ''}>
                        <span class="slider" style="${currentSettings.airplaneMode ? 'opacity: 0.5' : ''}"></span>
                    </label>
                </div>
            </div>

             <div style="text-align:center; opacity: 0.5; font-size: 10px; margin-top: 20px;">
                NUI TABLET OS v1.5<br>NUI LABS ORIGINAL
            </div>
        </div>
    `;
}

// --- SETTINGS ACTIONS ---

function changeWallpaper(value) {
    currentSettings.wallpaper = value;
    applySettings();
    saveSettings();
}

function changeAccentColor(color) {
    currentSettings.accentColor = color;
    applySettings();
    saveSettings();
}

const textColors = ['#e0e0e0', '#0f0f0fff', '#9e9e9eff', '#ffeb3b', '#00ffcc', '#ff99cc'];
    let textColorHTML = textColors.map(col => 
        `<div class="color-circle" 
              style="background: ${col}; border: ${currentSettings.textColor === col ? '2px solid var(--accent-color)' : '1px solid #555'}" 
              onclick="changeTextColor('${col}')"></div>`
    ).join('');

function changeScale(value) {
    currentSettings.scale = parseFloat(value);
    document.getElementById('scale-val').innerText = Math.round(value * 100) + '%';
    applySettings();
    saveSettings();
}

// --- NEW LOGIC FUNCTIONS ---

function changeFont(fontClass) {
    currentSettings.font = fontClass;
    applySettings(); // Wendet es sofort an
    saveSettings();
    // Refresh Settings UI to show active button
    const content = document.getElementById('app-content');
    if (content.innerHTML !== "") renderSettingsApp(content);
}

function toggleAirplane(isActive) {
    currentSettings.airplaneMode = isActive;
    
    // Logik: Wenn Flugmodus an -> Wifi aus
    if (isActive) {
        currentSettings.wifi = false;
        // Checkbox im UI updaten falls sichtbar
        const wifiToggle = document.getElementById('wifi-toggle');
        if(wifiToggle) {
            wifiToggle.checked = false;
            wifiToggle.disabled = true;
            wifiToggle.nextElementSibling.style.opacity = "0.5";
        }
    } else {
        // Flugmodus aus -> Wifi wieder erlauben (aber nicht automatisch an)
        const wifiToggle = document.getElementById('wifi-toggle');
        if(wifiToggle) {
            wifiToggle.disabled = false;
            wifiToggle.nextElementSibling.style.opacity = "1";
        }
    }
    
    applySettings();
    saveSettings();
}

function toggleWifi(isActive) {
    currentSettings.wifi = isActive;
    applySettings();
    saveSettings();
}

// --- CORE SETTINGS FUNCTIONS (SAVE/LOAD) ---

function applySettings() {
    const r = document.querySelector(':root');
    const frame = document.getElementById('tablet-frame');
    const container = document.getElementById('tablet-container');

    // 1. Wallpaper
    if (frame) frame.style.background = currentSettings.wallpaper;
    if (frame && currentSettings.wallpaper.startsWith('url')) {
        frame.style.backgroundSize = 'cover';
        frame.style.backgroundPosition = 'center';
    }

    // 2. Accent Color (Wichtig: Root Update)
    r.style.setProperty('--accent-color', currentSettings.accentColor);

    r.style.setProperty('--text-color', currentSettings.textColor);

    // 3. Scale
    if (container) container.style.zoom = currentSettings.scale;

    // 4. Fonts (Global auf Body anwenden)
    document.body.className = ''; // Alte Klassen löschen
    document.body.classList.add(currentSettings.font || 'font-inter');

    // 5. Status Bar Logic (Icons Update)
    const iconPlane = document.getElementById('status-plane');
    const iconWifi = document.getElementById('status-wifi');

    if (iconPlane && iconWifi) {
        if (currentSettings.airplaneMode) {
            // Flugmodus AN: Flugzeug zeigen, WLAN verstecken
            iconPlane.style.display = 'inline-block';
            iconWifi.style.display = 'none';
        } else {
            // Flugmodus AUS: Flugzeug weg
            iconPlane.style.display = 'none';
            
            // WLAN je nach Setting
            if (currentSettings.wifi) {
                iconWifi.style.display = 'inline-block';
                iconWifi.className = 'fas fa-wifi'; // Starkes Signal
            } else {
                // Entweder ganz weg oder durchgestrichen
                iconWifi.style.display = 'inline-block';
                iconWifi.className = 'fas fa-ban'; // Oder fa-wifi mit opacity
                iconWifi.style.opacity = '0.5';
            }
            if(currentSettings.wifi) iconWifi.style.opacity = '1';
        }
    }
}

function saveSettings() {
    localStorage.setItem('nui_tablet_config', JSON.stringify(currentSettings));
}

function loadSettings() {
    const saved = localStorage.getItem('nui_tablet_config');
    if (saved) {
        currentSettings = JSON.parse(saved);
        applySettings();
    }
}

function changeTextColor(color) {
    currentSettings.textColor = color;
    applySettings();
    saveSettings();
    // UI Refresh to show border
    const content = document.getElementById('app-content');
    if (content.innerHTML !== "") {
        renderSettingsApp(content);
    }
}