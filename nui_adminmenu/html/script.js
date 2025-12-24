// --- STATE MANAGEMENT ---
const app = document.getElementById('app');
let isVisible = false;


// [[ NUI LABS: PERMISSION SYSTEM ]]
let permConfig = {};
let myRank = 'user';

let isTuningSessionActive = false; // [[ NUI LABS: SECURITY LOCK ]]

// [[ NUI LABS: SMART PERMISSION RESOLVER ]]
function getRequiredRank(item) {
    let checkAction = item.action;
    let requiredRank = 'user'; // Standard: Offen für alle

    // 1. Manuelle Permission im Item (aus menuData.js) hat Vorrang
    if (item.perm) {
        checkAction = item.perm;
    } 
    // 2. Automatische Übersetzung (Action Name -> Config Name)
    else if (item.action) {
        const act = item.action; // Kur schreibweise
        
        if (act.startsWith('weather_')) checkAction = 'weather';
        else if (act.startsWith('time_')) checkAction = 'time';
        
        // Vehicle & Weapons
        else if (act === 'spawn_vehicle_click') checkAction = 'spawn_vehicle';
        else if (act === 'give_weapon_click') checkAction = 'give_weapon';
        else if (act === 'repair_vehicle' || act === 'fix_vehicle') checkAction = 'repair_vehicle';
        else if (act === 'del_vehicle') checkAction = 'delete_vehicle';
        else if (act === 'full_tune') checkAction = 'tuning';
        
        // Player Management
        else if (act === 'kill_all') checkAction = 'kill';
        else if (act === 'revive_all') checkAction = 'revive';
        else if (act === 'heal_all') checkAction = 'revive'; // Heilen oft wie Revive
        
        // World
        else if (act === 'clear_peds' || act === 'clear_cars') checkAction = 'clear_area';
        else if (act === 'blackout') checkAction = 'blackout';
        
        // Admin Tools
        else if (act === 'open_announce_menu') checkAction = 'open_menu'; // Oder eigene Perm
        else if (act === 'req_banlist') checkAction = 'ban';
        
        // Case Sensitivity Fixes (Wichtig für Config Match!)
        else if (act === 'infinite_Ammo') checkAction = 'infinite_ammo'; // Config ist klein
        else if (act === 'vehicle_godmode') checkAction = 'vehicle_godmode';
    }

    // 3. Prüfen gegen die Config vom Server (permConfig)
    // Wir suchen in der Config nach dem ermittelten 'checkAction' Key
    if (checkAction && permConfig[checkAction]) {
        requiredRank = permConfig[checkAction];
    }

    return requiredRank;
}
// Hier definieren wir die Hierarchie: User=0, Admin=1, God=2
const rankValue = { 'user': 0, 'admin': 1, 'god': 2 };
let currentColumn = 'sidebar'; // 'sidebar' or 'content'
let sidebarIndex = 0;
let itemIndex = 0;
let sidebarKeys = Object.keys(menuData); // ['self', 'vehicle', 'world']
let isActionCooldown = false;
let globalPlayerCount = { active: 0, max: 0 }; // [[ NUI LABS: CACHE ]]
let isSearchActive = false;

let playerStates = {};

let isInputModalOpen = false;
let currentInputCallback = null;

// [[ NUI LABS: SUBMENU LOGIC ]]
let menuStack = []; 
let currentItemList = []; 
let currentTitle = "";
let isPanelUserEnabled = true; 


// --- AUDIO SYSTEM ---
// Wir laden die Sounds vor, damit es keine Verzögerung gibt
const audioSwitch = new Audio('sounds/button_switch.mp3');
const audioBack   = new Audio('sounds/button_back.mp3');
const audioEnter = new Audio('sounds/button_enter.mp3');

// Lautstärke anpassen (0.0 bis 1.0) - 0.2 ist meist angenehm, nicht zu laut
audioSwitch.volume = 0.2; 
audioBack.volume   = 0.2;

function playSound(type) {
    // [[ GATEKEEPER CHECK ]]
    // Wenn in den Settings "OFF" ist, brechen wir sofort ab.
    if (!userSettings.sounds) return; 

    let soundToPlay = null;

    if (type === 'switch') soundToPlay = audioSwitch;
    if (type === 'back')   soundToPlay = audioBack;
    if (type === 'enter')  soundToPlay = audioEnter;
    
    if (soundToPlay) {
        soundToPlay.currentTime = 0; // Reset für schnelles Abspielen
        soundToPlay.volume = 0.2;    // Angenehme Lautstärke festlegen
        soundToPlay.play().catch(e => {/* Ignorieren falls Browser blockt */});
    }
}

// [[ NUI LABS: SETTINGS MANAGER ]]
const defaultSettings = {
    theme: 'default',
    scale: '100',
    sounds: true,
    pref_godmode: false
};

let userSettings = JSON.parse(localStorage.getItem('nui_admin_settings')) || defaultSettings;

function applySettings() {
    // 1. Theme
    document.body.className = ""; 
    if (userSettings.theme !== 'default') {
        document.body.classList.add(`theme-${userSettings.theme}`);
    }
    
    // 2. Scale
    document.body.classList.add(`scale-${userSettings.scale}`);
    
    // 3. Sync Menu Items (Das hier ist neu/wichtig!)
    if (menuData.settings) {
        // Suche das Item in der Datenstruktur
        const soundItem = menuData.settings.items.find(i => i.action === 'toggle_sounds');
        
        // Wenn gefunden, setze den State auf das, was wir gespeichert haben
        if (soundItem) {
            soundItem.state = userSettings.sounds;
        }
        
        // Auch andere Prefs syncen
        const godItem = menuData.settings.items.find(i => i.action === 'pref_godmode');
        if (godItem) godItem.state = userSettings.pref_godmode;
    }
}

// Speichern
function saveSettings() {
    localStorage.setItem('nui_admin_settings', JSON.stringify(userSettings));
}

// Beim Start ausführen
applySettings();

// [[ NUI LABS: MAIN CENTRAL EVENT LISTENER (FIXED) ]]
window.addEventListener('message', function(event) {
    
    const item = event.data;

    if (item.type === "keepAlive") {
        // TRICK: Wir lesen eine Layout-Eigenschaft. 
        // Das zwingt die Rendering-Engine, sofort alles neu zu berechnen.
        // Das ist wie ein Eimer kaltes Wasser für den Browser.
        const wakeUp = document.body.offsetHeight; 
        
        // Optional: Ein unsichtbares Element minimal bewegen (Sub-Pixel)
        // um "Aktivität" vorzutäuschen, falls der Reflow allein nicht reicht.
        if (!isVisible) {
            document.body.style.transform = document.body.style.transform === "translateZ(0px)" ? "translateZ(0.1px)" : "translateZ(0px)";
        }
        return;
    }

    if (item.type === "open_tuner") {
        // Generiere das Menü Objekt
        const tunerMenu = buildTuningMenu(item.data);
        
        // Zwinge das UI in den Submenü Modus mit diesem Objekt
        currentItemList = tunerMenu.items;
        currentTitle = tunerMenu.label;
        
        // Stack leeren und Vehicle Root pushen, damit man mit Backspace rauskommt
        menuStack = [];
        menuStack.push({
            items: menuData.vehicle.items, // Back = Vehicle Menu
            title: "VEHICLE OPTIONS",
            index: 0
        });
        
        currentColumn = 'content';
        itemIndex = 0;
        renderContent();
    }

    // 1. UI Visibility Logic
    if (item.type === "ui") {
        isVisible = item.display;
        
        if (item.permissions) permConfig = item.permissions;
        if (item.rank) myRank = item.rank;

        // Hotkey Update
        if (item.hotkeys && menuData.settings) {
            const noclipItem = menuData.settings.items
                .find(cat => cat.label === "⌨️ HOTKEY MANAGER")?.items
                .find(i => i.command === "nui_toggle_noclip"); 
            
            if (noclipItem) noclipItem.rightLabel = item.hotkeys.noclip;
        }

        // [[ NUI LABS: STATE SYNC INSERTION START ]]
        if (item.states) {
            // Helper Funktion, um Items in Kategorien zu finden und zu updaten
            const updateItemState = (category, actionName, newState) => {
                if (menuData[category] && menuData[category].items) {
                    const foundItem = menuData[category].items.find(i => i.action === actionName);
                    if (foundItem) foundItem.state = newState;
                }
            };

            // 1. SELF OPTIONS
            updateItemState('self', 'godmode', item.states.godmode);
            updateItemState('self', 'noclip', item.states.noclip);
            updateItemState('self', 'ghost_mode', item.states.ghost_mode);
            updateItemState('self', 'super_jump', item.states.super_jump);
            updateItemState('self', 'fast_run', item.states.fast_run);
            updateItemState('self', 'toggle_names', item.states.toggle_names);
            updateItemState('self', 'toggle_blips', item.states.toggle_blips);
            updateItemState('self', 'superPunch', item.states.superPunch);

            // 2. VEHICLE OPTIONS
            updateItemState('vehicle', 'vehicle_godmode', item.states.vehicle_godmode);
            updateItemState('vehicle', 'speed_boost', item.states.speed_boost);
            updateItemState('vehicle', 'rainbow_paint', item.states.rainbow_paint);

            // 3. WEAPON OPTIONS
            updateItemState('weapons', 'infinite_Ammo', item.states.infinite_Ammo);
            updateItemState('weapons', 'exp_ammo', item.states.exp_ammo);

            // 4. WORLD OPTIONS
            updateItemState('world', 'freeze_time', item.states.freeze_time);
            updateItemState('world', 'blackout', item.states.blackout);
        }

        if (isVisible) {
            app.classList.remove('closing'); 
            app.classList.add('open');
            app.style.visibility = "visible";
            app.style.opacity = "1";
            resetMenu();
        } else {
            app.classList.remove('open');
            app.style.visibility = "hidden";
            app.style.opacity = "0";
            
            const panel = document.getElementById('player-info-panel');
            const helperFooter = document.getElementById('context-helper');
            if(panel) {
                panel.classList.remove('visible');
                panel.style.visibility = "hidden"; 
                panel.style.opacity = "0";         
            }
            if(helperFooter) helperFooter.classList.remove('active');
            isSearchActive = false;
        }
    }

    // 2. Data Updates
    if (item.type === "updatePlayerCount") {
        globalPlayerCount.active = item.active;
        globalPlayerCount.max = item.max;
        renderSidebar(); 
    }

    if (item.type === "updatePlayerList") updatePlayerMenu(item.players);
    if (item.type === "updatePlayerStats") updateInfoPanel(item.data);

    // 3. Ban List
    if (item.type === "updateBanList") {
        updateBanListMenu(item.bans);
        if (currentColumn === 'content' && currentTitle === "BAN LIST") {
             const banListObj = menuData.server.items.find(i => i.label === "BAN LIST");
             currentItemList = banListObj.items;
             renderContent();
        }
    }

    // 4. Tools
    if (item.type === "copyToClipboard") {
        const el = document.createElement('textarea');
        el.value = item.text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showNotification("COPIED: " + item.text, "success");
    }

    if (item.type === "updateNametags") renderNametags(item.tags);
    if (item.type === "clearNametags") { nametagsContainer.innerHTML = ''; currentTags = {}; }
    
    if (item.type === "notify") showNotification(item.message, item.style);

    // [[ FIX: ANNOUNCEMENT LOGIK EINFÜGEN ]]
    if (item.type === "show_announcement") {
        if (item.announceType === "private") {
            showPrivateMessage(item);
        } else {
            showAnnouncementUI(item);
        }
    }
});

function updatePlayerMenu(players) {
    const playerCategory = menuData.players.items;
    const playerListObj = playerCategory.find(item => item.label === "PLAYER LIST");

    if (!playerListObj) return; 

    playerListObj.items = [];

    players.forEach(p => {
        // Safe-ID für Zugriff auf playerStates
        const pIdStr = String(p.id);
        const pState = playerStates[pIdStr] || {};

        playerListObj.items.push({
            label: `[${p.id}] ${p.name}`, 
            targetId: p.id,
            customHeader: `${p.name} <span class="player-count-badge" style="float: none; vertical-align: middle; margin-left: 15px; color: #f5d6d6ff; border-color: var(--primary);">ID: ${p.id}</span>`,            
            type: "submenu",
            items: [
                {
                    label: "🤡 TROLL OPTIONS",
                    type: "submenu",
                    items: [
                        // STATE wird jetzt über 'trollType' geladen, nicht mehr über 'action'
                        { label: "🥴 DRUNK MODE", action: "troll_action", type: "toggle", targetId: p.id, trollType: "drunk", state: pState["drunk"] || false },
                        { label: "🔥 SET ON FIRE", action: "troll_action", type: "toggle", targetId: p.id, trollType: "fire", state: pState["fire"] || false },
                        { label: "🍌 SLIPPERY CAR", action: "troll_action", type: "toggle", targetId: p.id, trollType: "slippery", state: pState["slippery"] || false },
                        
                        // Buttons bleiben Buttons
                        { label: "🚀 CATAPULT PLAYER", action: "troll_action", type: "button", targetId: p.id, trollType: "catapult" },
                        { label: "🐆 WILD ATTACK (RANDOM)", action: "troll_action", type: "button", targetId: p.id, trollType: "wild_attack" },
                        { label: "💥 FAKE EXPLOSION", action: "troll_action", type: "button", targetId: p.id, trollType: "explosion" },
                        { label: "💡 FLASHBANG", action: "troll_action", type: "button", targetId: p.id, trollType: "flashbang" },
                        { label: "🚐 KIDNAP PLAYER", action: "troll_action", type: "button", targetId: p.id, trollType: "kidnap" },
                    ]
                },

                { label: "📨 SEND ADMIN MESSAGE", action: "open_announce_target", type: "button", targetId: p.id },
                { label: "💀 KILL PLAYER", action: "kill_player", type: "button", targetId: p.id },
                { label: "⚡ REVIVE", action: "revive_player", type: "button", targetId: p.id },
                { label: "❄️ FREEZE", action: "freeze_player", type: "toggle", targetId: p.id, state: pState['freeze_player'] || false },
                { label: "👁️ SPECTATE", action: "spectate_player", type: "toggle", targetId: p.id, state: pState['spectate_player'] || false },
                { label: "📍 GO TO", action: "goto_player", type: "button", targetId: p.id },
                { label: "🧲 BRING", action: "bring_player", type: "button", targetId: p.id },
                {
                    label: "💵 GIVE / REMOVE MONEY",
                    type: "submenu",
                    items: [
                        { label: "💵 CASH (+/-)", action: "manage_money", type: "button", targetId: p.id, moneyType: "cash" },
                        { label: "🏦 BANK (+/-)", action: "manage_money", type: "button", targetId: p.id, moneyType: "bank" },
                        { label: "🕶️ BLACK MONEY (+/-)", action: "manage_money", type: "button", targetId: p.id, moneyType: "crypto" }
                    ]
                },
                { label: "🚗 SIT IN VEHICLE", action: "sit_in_vehicle", type: "button", targetId: p.id },
                { label: "🎒 OPEN INVENTORY", action: "open_inventory", type: "button", targetId: p.id },
                { label: "👕 GIVE CLOTHING MENU", action: "give_clothing_menu", type: "button", targetId: p.id },
                { label: "👢 KICK", action: "open_kick_menu", type: "button", targetId: p.id },
                { label: "🔨 BAN HAMMER", action: "open_ban_menu", type: "button", targetId: p.id },
                { label: "🔐 PERMISSIONS", action: "perms_player", type: "button", targetId: p.id }
            ]
        });
    });
    
    if (currentColumn === 'content' && currentTitle.includes("PLAYER LIST")) {
        renderContent();
    }
}

// [[ NUI LABS: DURATION FORMATTER ]]
function formatBanDuration(expireDate) {
    if (expireDate === 0) return "PERM";
    
    const now = Math.floor(Date.now() / 1000);
    const diff = expireDate - now;
    
    if (diff < 0) return "EXPIRED";
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    
    if (days > 0) return days + "D " + hours + "H";
    return hours + "H";
}

// [[ NUI LABS: BAN LIST RENDERER V2 ]]
function updateBanListMenu(bans) {
    console.log("[NUI LABS] updateBanListMenu called with:", bans); // <--- DEBUG

    if (!menuData.server) return;
    const banListObj = menuData.server.items.find(item => item.label === "BAN LIST");
    if (!banListObj) return;

    banListObj.items = [];

    if (bans.length === 0) {
        banListObj.items.push({ label: "NO ACTIVE BANS", type: "button" });
    } else {
        bans.forEach(ban => {
            let durationText = formatBanDuration(ban.expire_date);
            let badgeClass = (ban.expire_date === 0) ? "badge-perm" : "badge-temp";

            banListObj.items.push({
                label: `[${ban.ban_id}] ${ban.name}`,
                rightLabel: durationText, // Das zeigen wir rechts an
                rightClass: badgeClass,   // CSS Klasse für Farbe
                type: "submenu",
                action: "show_ban_context", // Dummy Action für Context Check
                banData: ban, // WICHTIG: Die ganzen Daten für das Panel!
                items: [
                    { 
                        label: "🔓 UNBAN PLAYER", 
                        action: "unban_player", 
                        type: "button", 
                        targetId: ban.id, 
                        needsConfirm: true 
                    }
                ]
            });
        });
    }

    // Refresh Live
    if (currentColumn === 'content' && currentTitle === "BAN LIST") {
        currentItemList = banListObj.items;
        renderContent();
    }
}

    // 3. Refresh, falls wir gerade im Menü sind
    if (currentColumn === 'content' && (currentTitle === "BAN LIST" || currentTitle.includes("BAN INFO"))) {
        // Falls wir im Submenü sind, müssen wir clever refreshen oder user zurückwerfen
        // Einfachste Lösung: Zurück zur Ban Liste springen
        if (currentTitle.includes("BAN INFO")) {
             goBackOneLevel();
        }
        
        // Liste neu laden (wir müssen die aktuellen Items setzen)
        currentItemList = banListObj.items;
        renderContent();
    }


function renderSidebar() {
    const list = document.getElementById('category-list');
    list.innerHTML = '';

    const catCounter = document.getElementById('cat-counter');
    if (catCounter) catCounter.innerText = `${sidebarIndex + 1}/${sidebarKeys.length}`;

    sidebarKeys.forEach((key, index) => {
        const div = document.createElement('div');
        div.classList.add('cat-item');
        
        let labelContent = menuData[key].label;
        if (key === 'players') {
            labelContent += ` <span class="player-count-badge">${globalPlayerCount.active}/${globalPlayerCount.max}</span>`;
        }
        div.innerHTML = labelContent; 

        if (index === sidebarIndex) {
            if (currentColumn === 'sidebar') div.classList.add('active'); 
            else div.classList.add('dimmed-active'); 
        }
        list.appendChild(div);
    });

    // [[ PRO SCROLL CALCULATION ]]
    // Kein scrollIntoView mehr, wir rechnen selbst!
    // [[ PRO AUTO SCROLL ]]
        setTimeout(() => {
        const activeItem = list.children[sidebarIndex];
        if (activeItem) {
            // Berechne die exakte Mitte
            const listHeight = list.clientHeight;
            const itemTop = activeItem.offsetTop;
            const itemHeight = activeItem.clientHeight;
            
            // Scrollposition setzen
            list.scrollTop = itemTop - (listHeight / 2) + (itemHeight / 2);
        }
    }, 20);
}

function renderContent() {
    // 1. Daten laden (Sidebar vs. Submenü)
    if (menuStack.length === 0 && currentColumn === 'sidebar') {
        const currentCategoryKey = sidebarKeys[sidebarIndex];
        currentItemList = menuData[currentCategoryKey].items;
        currentTitle = menuData[currentCategoryKey].label;
    }

    let fullTitle = currentTitle;
    document.getElementById('current-category-title').innerHTML = fullTitle;

    // [[ SEARCHBAR LOGIC ]] 
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('player-search-input');

    // Logic for showing search bar
    if (currentTitle === "PLAYER LIST") {
        searchContainer.classList.add('active');
        searchInput.placeholder = "SEARCH ID OR NAME... (SPACEBAR)";
    } 
    else if (currentTitle === "SPAWN VEHICLE") {
        searchContainer.classList.add('active');
        searchInput.placeholder = "SEARCH VEHICLE MODEL... (SPACEBAR)";
    }
    else if (currentTitle === "BAN LIST") {
        searchContainer.classList.add('active');
        searchInput.placeholder = "*PRESS SPACE* TO SEARCH BAN ID OR NAME...";
    } 
    else {
        searchContainer.classList.remove('active');
        if (typeof isSearchActive !== 'undefined' && isSearchActive) {
            searchInput.value = "";
            isSearchActive = false;
        }
    }

    // 2. Liste bauen
    const list = document.getElementById('item-list');
    list.innerHTML = '';

    currentItemList.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('menu-item');

        const label = document.createElement('span');
        label.innerText = item.label;

        // [[ NUI LABS: PERMISSION CHECK ]]
        // Wir nutzen unsere neue schlaue Funktion
        const requiredRank = getRequiredRank(item);
        
        // Prüfen: Ist mein Rang niedriger als nötig?
        let isLocked = false;
        if (rankValue[myRank] < rankValue[requiredRank]) {
            isLocked = true;
            div.classList.add('locked-item'); // Macht es grau & zeigt Verbot-Cursor
        }

        if (currentColumn === 'content' && index === itemIndex) {
            div.classList.remove('selected');
            void div.offsetWidth; 
            div.classList.add('selected');
        }

        const status = document.createElement('span');
        status.classList.add('status');

        // [[ STATUS ANZEIGE LOGIK ]]
        if (isLocked) {
            // WICHTIG: Hier kommt das Schloss hin!
            status.innerHTML = "🔒 <span class='locked-text'>NO PERMS</span>"; 
            status.classList.add('status-locked');
        }
        else if (item.type === 'toggle') {
            // ... (Hier bleibt dein normaler Toggle Code) ...
            status.innerText = item.state ? "ON" : "OFF";
            if (item.state) {
                status.classList.add('status-on');
                if (!item.state) status.classList.remove('status-on');
            } else {
                status.classList.add('status-off');
            }
        } 
        else if (item.type === 'submenu') {
            status.innerText = "OPEN >";
            status.classList.add('status-open');
        } 
        else {
            status.innerText = ">>>";
            status.style.color = "#444"; 
        }
        
        // ... (Rest der Funktion wie appendChild etc.) ...

        div.appendChild(label);

        div.appendChild(label);

        // [[ NUI LABS: RIGHT LABEL SUPPORT ]]
        if (item.rightLabel) {
            const rightSpan = document.createElement('span');
            rightSpan.innerText = item.rightLabel;
            rightSpan.classList.add('menu-item-right');
            if (item.rightClass) rightSpan.classList.add(item.rightClass);
            
            // Layout Trick: Label links, Status ganz rechts, RightLabel dazwischen/rechts
            // Wir nutzen margin-left auto beim labelContainer oder float
            // Einfachste Lösung: Absolut positionieren oder Flexbox nutzen
            rightSpan.style.marginLeft = "auto";
            rightSpan.style.marginRight = "10px";
            div.appendChild(rightSpan);
        }

        div.appendChild(status);
        div.addEventListener('click', function(e) {
            e.stopPropagation(); // Verhindert Bubbling
            
            // Submenü Logik
            if (item.type === 'submenu') {
                // [[ DATA REQUEST ON CLICK ]]
                if (item.action) {
                    console.log("[NUI LABS] Requesting Action via Click:", item.action);
                    postData(item.action, {});
                }

                menuStack.push({
                    items: currentItemList,
                    title: currentTitle,
                    index: index
                });
                currentItemList = item.items;

                // Custom Header & Target ID Logik
                if (item.customHeader) {
                    currentTitle = item.customHeader;
                    if (item.items && item.items[0] && item.items[0].targetId) {
                        postData('reqPlayerDetails', { targetId: item.items[0].targetId });
                    }
                } else {
                    currentTitle = item.label;
                }

                itemIndex = 0;
                renderContent();
            } else {
                // Normale Action
                itemIndex = index;
                renderContent(); // Visuelles Feedback (Selected)
                triggerAction(item);
            }
        });
        list.appendChild(div);
    });

    setTimeout(() => {
        if (list.children[itemIndex]) {
            list.children[itemIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 10);

    // [[ NUI LABS: VISIBILITY MANAGER FINAL ]]
    // [[ NUI LABS: VISIBILITY MANAGER FINAL ]]
    const isInPlayerList = currentTitle === "PLAYER LIST";
    const isDeepInPlayerContext = menuStack.some(m => m.title === "PLAYER LIST");
    const isInBanList = currentTitle === "BAN LIST";

    // Only show for Players List or Ban List. NOT for Self.
    const shouldShowPanel = (isInPlayerList || isDeepInPlayerContext || isInBanList) && isPanelUserEnabled;

    const panel = document.getElementById('player-info-panel');
    const helperFooter = document.getElementById('context-helper');

    if (shouldShowPanel) {
        panel.style.removeProperty('visibility');
        panel.style.removeProperty('opacity');
        panel.classList.add('visible');
        
        // Only trigger update if we are in Player List context
        if (isInPlayerList || isInBanList) {
            triggerLiveUpdate();
        }
    } else {
        panel.classList.remove('visible');
    }

    if (shouldShowPanel) {
        helperFooter.classList.add('active');
    } else {
        helperFooter.classList.remove('active');
    }

    updateCounterUI();
}

// [[ NUI LABS: INPUT HANDLER V3 (FOCUS SAFE) ]]
let lastNavTime = 0;

document.addEventListener('keydown', function(e) {
    if (!isVisible) return;
    if (isInputModalOpen) return;

    // [[ FIX: EINGABE PRÜFUNG ]]
    // Wenn irgendein Input-Feld (Search, Announce, Reason) Fokus hat -> STOPP HIER!
    const activeEl = document.activeElement;
    const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

    if (isInputActive) {
        // Ausnahme: Search Bar Navigation
        if (activeEl.id === 'player-search-input') {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                playSound('enter');
                activeEl.blur(); 
                itemIndex = 0;
                renderContent();
                return;
            }
            if (e.key === 'Escape') {
                playSound('back');
                toggleSearch();
                return;
            }
        }
        // WICHTIG: Hier brechen wir ab, damit Backspace den Text löscht und NICHT das Menü schließt!
        return; 
    }

    // --- AB HIER NORMALE MENÜ STEUERUNG (Nur wenn kein Input aktiv ist) ---
    
    if (e.key === 'PageUp') {
        isPanelUserEnabled = false;
        hideInfoPanel();
        return;
    }
    // ... (restlicher Code bleibt gleich)
    if (e.key === 'PageDown') {
        isPanelUserEnabled = true;
        renderContent(); 
        return;
    }

    const searchInput = document.getElementById('player-search-input');
    const isTyping = document.activeElement === searchInput;

    if (e.code === 'Space' && !isTyping && (currentTitle === "PLAYER LIST" || currentTitle === "SPAWN VEHICLE" || currentTitle === "BAN LIST")) {
        e.preventDefault(); 
        playSound('switch');
        const input = document.getElementById('player-search-input');
        input.focus();
        return;
    }

    if (isTyping) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
            searchInput.blur(); // Fokus wegnehmen -> Zurück zur Liste
            // Item 0 auswählen
            itemIndex = 0;
            renderContent();
            return;
        }
        if (e.key === 'Escape') {
            toggleSearch(); // Suche schließen
            return;
        }
        return;
    }
    
    // 1. Filter: Wir reagieren NUR auf Menü-Tasten.
    // Alles andere (W, A, S, D, Leertaste etc.) wird ignoriert und geht ans Spiel durch.
    const menuKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Backspace'];
    if (!menuKeys.includes(e.key)) return;

    // 2. Speed-Control: Verhindert, dass das Menü bei 144FPS durchscrollt wie verrückt,
    // erlaubt aber gleichzeitiges Drücken von W (Laufen) und Pfeiltasten.
    const now = Date.now();
    if (now - lastNavTime < 100) return; // 100ms Delay zwischen Aktionen
    lastNavTime = now;

    // [[ LOGIC FLOW ]]
    if (currentColumn === 'sidebar') {
        // --- SIDEBAR LOGIC ---
        if (e.key === 'ArrowDown') {
            playSound('switch');
            sidebarIndex = (sidebarIndex + 1) % sidebarKeys.length;
            forceClearSearch(); // <--- NEU: Text löschen beim Wechseln
            renderSidebar();
            renderContent();
        } else if (e.key === 'ArrowUp') {
            playSound('switch');
            sidebarIndex = (sidebarIndex - 1 + sidebarKeys.length) % sidebarKeys.length;
            forceClearSearch(); // <--- NEU: Text löschen beim Wechseln
            renderSidebar();
            renderContent();
        } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            playSound('switch');
            currentColumn = 'content';
            itemIndex = 0;
            renderSidebar();
            renderContent();
        } else if (e.key === 'Backspace') {
            closeMenu();
        }

    } else {
        // --- CONTENT LOGIC ---
        if (e.key === 'ArrowDown') {
            playSound('switch');
            itemIndex = (itemIndex + 1) % currentItemList.length;
            renderContent();
        } else if (e.key === 'ArrowUp') {
            playSound('switch');
            itemIndex = (itemIndex - 1 + currentItemList.length) % currentItemList.length;
            renderContent();
        } else if (e.key === 'Enter') {
            const selectedItem = currentItemList[itemIndex];
            

            if (selectedItem.type === 'submenu')
        
        // [[ NUI LABS FIX: SAFETY CHECK ]]
        // Verhindert Crash, wenn Liste leer ist oder Index falsch
        if (!selectedItem) return; 

        if (selectedItem.type === 'submenu') {
            playSound('switch');
            if (selectedItem.action) {
                postData(selectedItem.action, {});
            }
            menuStack.push({
                items: currentItemList,
                title: currentTitle,
                index: itemIndex
            });

            currentItemList = selectedItem.items;

            // Custom Header Logik
            if (selectedItem.customHeader) {
                currentTitle = selectedItem.customHeader;
                if (selectedItem.items && selectedItem.items[0] && selectedItem.items[0].targetId) {
                    postData('reqPlayerDetails', { targetId: selectedItem.items[0].targetId });
                }
            } else {
                currentTitle = selectedItem.label;
            }

            itemIndex = 0; 

            renderContent();
        } else {
            triggerAction(selectedItem);
        }
    } else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
            // [[ INTELLIGENT BACK NAVIGATION ]]
            if (menuStack.length > 0) {
                playSound('back');
                // ... (Submenü Logik bleibt gleich) ...
                const previousLevel = menuStack.pop();
                currentItemList = previousLevel.items;
                currentTitle = previousLevel.title;
                itemIndex = previousLevel.index;
                renderContent();
            } else {
                playSound('back');
                // 2. Wir sind auf oberster Ebene -> Zurück zur Sidebar
                currentColumn = 'sidebar';
                
                // [[ NUI LABS FIX ]]
                hideInfoPanel(); 
                forceClearSearch(); // <--- NEU: Text löschen beim Verlassen
                
                renderSidebar();
                renderContent();
                
                // Falls Suche noch aktiv war, toggleSearch resetten
                if(isSearchActive) toggleSearch();
            }
        }
    }
});

// [[ NUI LABS: SIDEBAR INPUT HANDLER (CLEANUP FIX) ]]
function handleSidebarInput(key) {
    if (key === 'ArrowDown') {
        playSound('switch');
        sidebarIndex = (sidebarIndex + 1) % sidebarKeys.length;
        resetSearchOnCategoryChange(); // <--- NEW: Clean Input
        renderSidebar();
        renderContent(); 
    } else if (key === 'ArrowUp') {
        playSound('switch');
        sidebarIndex = (sidebarIndex - 1 + sidebarKeys.length) % sidebarKeys.length;
        resetSearchOnCategoryChange(); // <--- NEW: Clean Input
        renderSidebar();
        renderContent();
    } else if (key === 'ArrowRight' || key === 'Enter') {
        currentColumn = 'content';
        itemIndex = 0; 
        renderSidebar(); 
        renderContent(); 
    }
}

// [[ NUI LABS: HELPER - RESET SEARCH ]]
function resetSearchOnCategoryChange() {
    const searchInput = document.getElementById('player-search-input');
    if (searchInput) {
        searchInput.value = ""; // Clear text
        isSearchActive = false; // Reset logical state
    }
    // Remove active class visually
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        searchContainer.classList.remove('active');
    }
}

function resetMenu() {
    currentColumn = 'sidebar';
    sidebarIndex = 0;
    itemIndex = 0;
    menuStack = []; // Reset Stack

    // [[ NUI LABS: RESET STATES ]]
    isSearchActive = false;
    isPanelUserEnabled = true; // WICHTIG: Panel wieder aktivieren!
    
    // UI Bereinigen
    document.getElementById('search-container').classList.remove('active');
    document.getElementById('player-search-input').value = "";
    document.getElementById('app').classList.remove('mini-mode');
    
    // Panel Logik neu berechnen (das macht renderContent gleich)
    renderSidebar();
    renderContent();
}


// [[ NUI LABS: OPTIMIZED INPUT HANDLER (FIXED) ]]
let fetchTimeout = null; 

function handleContentInput(key) {
    if (key === 'ArrowDown') {
        if (isTuningSessionActive && (menuStack.length === 0 || currentTitle === "💎 NUI CUSTOMS")) {

            showNotification("⚠️ TUNING ACTIVE! PLEASE PRESS 'FINISH TUNING' TO SAVE & EXIT!", "error");
            
            // Visueller Alarm
            const wrapper = document.querySelector('.menu-wrapper');
            wrapper.classList.remove('tuning-lock-active');
            void wrapper.offsetWidth; // Trigger Reflow
            wrapper.classList.add('tuning-lock-active');
            return; // STOPPT HIER! Kein Zurückgehen erlaubt.
        }
        playSound('switch');
        itemIndex = (itemIndex + 1) % currentItemList.length;
        renderContent();
        triggerLiveUpdate(); 
    } else if (key === 'ArrowUp') {
        playSound('switch');
        itemIndex = (itemIndex - 1 + currentItemList.length) % currentItemList.length;
        renderContent();
        triggerLiveUpdate(); 
   } else if (key === 'ArrowLeft' || key === 'Backspace') {
        
        // [[ NUI LABS FIX: SECURITY LOCK (HARD CHECK) ]]
        // Wir prüfen nur auf den Titel. Wenn der Titel "NUI CUSTOMS" ist, 
        // ist man auf der obersten Ebene des Tuners. Hier darf man NICHT raus.
        if (isTuningSessionActive && currentTitle === "NUI CUSTOMS") {
            playSound('error');
            showNotification("⚠️ TUNING ACTIVE! PLEASE PRESS 'FINISH TUNING' TO SAVE & EXIT!", "error");
            
            // Visueller Alarm (Rotes Aufleuchten)
            const wrapper = document.querySelector('.menu-wrapper');
            // Reset Animation Trick
            wrapper.classList.remove('tuning-lock-active');
            void wrapper.offsetWidth; // Trigger Reflow
            wrapper.classList.add('tuning-lock-active');
            
            return; // HIER IST ENDE! Der Code bricht ab. Backspace wird ignoriert.
        }

        playSound('back');
        if (menuStack.length > 0) {
            const previousLevel = menuStack.pop();
            currentItemList = previousLevel.items;
            currentTitle = previousLevel.title;
            itemIndex = previousLevel.index; 
            renderContent();
            if (currentTitle === "PLAYER LIST") triggerLiveUpdate();
        } else {
            // Normale Logik wenn nicht im Tuner
            currentColumn = 'sidebar';
            hideInfoPanel(); 
            renderSidebar();
            renderContent();
            if(isSearchActive) toggleSearch();
        }
    } else if (key === 'Enter') {
        playSound('switch');
        const selectedItem = currentItemList[itemIndex];
        
        // [[ SAFETY CHECK ]]
        if (!selectedItem) return;

        if (selectedItem.type === 'submenu') {
            if (selectedItem.action) postData(selectedItem.action, {});
            
            menuStack.push({
                items: currentItemList,
                title: currentTitle,
                index: itemIndex
            });

            currentItemList = selectedItem.items;

            if (selectedItem.customHeader) {
                currentTitle = selectedItem.customHeader;
                if (selectedItem.items && selectedItem.items[0] && selectedItem.items[0].targetId) {
                    postData('reqPlayerDetails', { targetId: selectedItem.items[0].targetId });
                }
            } else {
                currentTitle = selectedItem.label;
            }

            itemIndex = 0; 
            
            // Animation
            const list = document.getElementById('item-list');
            if (list) {
                list.style.transform = "translateX(10px)";
                setTimeout(() => list.style.transform = "translateX(0)", 100);
            }

            renderContent();
        } else {
            triggerAction(selectedItem);
        }
    }
}

/// --- ACTIONS ---
// [[ NUI LABS: ACTION HANDLER WITH ERROR FEEDBACK ]] //
// [[ NUI LABS: ACTION HANDLER FIXED ]] //
function triggerAction(item) {
    if (isActionCooldown) return;

    // [[ NUI LABS: SMART SECURITY CHECK ]]
    const requiredRank = getRequiredRank(item);
    
    // Check: Habe ich den Rang?
    if (rankValue[myRank] < rankValue[requiredRank]) {
        // ZUGRIFF VERWEIGERT!
        postData('play_error_sound'); // Optional, falls Sound existiert
        showNotification("ACCESS DENIED: " + requiredRank.toUpperCase() + " RANK REQUIRED", "error");
        
        // Visuelles "Schütteln" als Feedback
        const list = document.getElementById('item-list');
        if(list.children[itemIndex]) {
             list.children[itemIndex].classList.add('input-error');
             setTimeout(() => list.children[itemIndex].classList.remove('input-error'), 400);
        }
        return; // HIER IST STOPP! Der Code bricht ab.
    }

    playSound('switch'); // Sound erst spielen, wenn erlaubt

    // [[ SAFETY CHECK ]]
    if (item.needsConfirm) {
        openConfirmModal("WARNING: ARE YOU SURE?", () => {
            // Dieser Code wird nur ausgeführt, wenn "YES" geklickt wird
            performAction(item);
        });
        return; // Stoppe hier, bis bestätigt wurde
    }

    performAction(item);
}


function performAction(item) {

    if (item.action === 'close_tuner_menu') {
        closeTunerMenu();
        return;
    }
    
    

    if (item.action === 'open_ban_menu') {
        openBanMenu(item.targetId);
        return;
    }
    isActionCooldown = true;
    setTimeout(() => { isActionCooldown = false; }, 250);

    const list = document.getElementById('item-list');
    const currentItemEl = list.children[itemIndex];

    // Für die neuen Tuning Actions (Apply Mod, Color, etc.)
    // Für die neuen Tuning Actions
    if (item.action && item.action.startsWith('tune_')) {
        
        // [FIX] Wenn es ein Toggle ist, müssen wir den Status HIER ändern
        if (item.type === 'toggle') {
            item.state = !item.state; // Flip: true -> false, false -> true
            
            // UI Update sofort (Animation)
            if (currentItemEl) {
                const statusEl = currentItemEl.querySelector('.status');
                if (statusEl) {
                    statusEl.innerText = item.state ? "ON" : "OFF";
                    statusEl.className = "status " + (item.state ? "status-on" : "status-off");
                }
            }
        }

        // Daten vorbereiten
        const payload = {
            modType: item.modType,
            modIndex: item.modIndex,
            state: item.state, // Jetzt ist der State korrekt gedreht!
            type: item.type,   
            color: item.color,
            paintType: item.paintType,
            index: item.index,
            label: item.modLabel // [FIX] Wir nutzen ein separates Feld für den Namen
        };
        postData(item.action, payload);
        
        // Button Feedback
        if(currentItemEl && item.type === 'button') {
            currentItemEl.style.transform = "scale(0.98)";
            setTimeout(() => currentItemEl.style.transform = "scale(1.01)", 100);
        }
        return;
    }

    if (item.type === 'toggle') {
        item.state = !item.state;

        // [[ NUI LABS FIX: SOUND SETTING UPDATE ]]
        // Wir fangen das HIER ab, weil es ein Toggle ist!
        if (item.action === 'toggle_sounds') {
            userSettings.sounds = item.state;
            saveSettings();
            // Feedback Sound nur wenn AN
            if (item.state) setTimeout(() => playSound('enter'), 50);
            showNotification("Sound Effects: " + (item.state ? "ON" : "OFF"), item.state ? "success" : "error");
        }

        if (currentItemEl) {
            const statusEl = currentItemEl.querySelector('.status');
            if (statusEl) statusEl.classList.add('flipping');
        }

        setTimeout(() => {
            renderContent(); 

            // Payload vorbereiten
            const payload = { 
                state: item.state,
                targetId: item.targetId || null,
                trollType: item.trollType || null,
                model: item.model || null,
                weapon: item.weapon || null 
            };

            // State Saving Fix
            if (item.targetId) {
                const safeId = String(item.targetId); 
                if (!playerStates[safeId]) playerStates[safeId] = {};
                const saveKey = item.trollType ? item.trollType : item.action;
                playerStates[safeId][saveKey] = item.state;
            }

            // Normaler Post Request (außer bei Settings, da haben wir schon gespeichert)
            if (item.action !== 'toggle_sounds') {
                postData(item.action, payload, (response) => {
                    if (response === 'error') {
                        item.state = !item.state;
                        renderContent();
                    }
                });
            }
        }, 100);

    } else {
        if (item.action === 'req_banlist') {
            postData('req_banlist', {});
            return; 
        }
        if (item.action === 'manage_money') {
            openInputModal("ENTER AMOUNT (" + item.moneyType.toUpperCase() + ")", (amount) => {
                const payload = { amount: amount, moneyType: item.moneyType, targetId: item.targetId || null };
                postData('manage_money', payload);
            });
            return; 
        }

            // [[ NEW: OPEN KICK MENU ]]
        if (item.action === 'open_kick_menu') {
            openKickMenu(item.targetId);
            return;
        }

        const payload = {
            targetId: item.targetId || null,
            trollType: item.trollType || null,
            model: item.model || null,   // Für Autos
            weapon: item.weapon || null  // [NEU] Für Waffen
        };

        // [[ NUI LABS: SETTINGS ACTIONS ]]
    
    // [[ NUI LABS: SETTINGS ACTIONS ]]
    
    // 1. THEME CHANGER
    if (item.action === 'set_theme') {
        userSettings.theme = item.theme;
        applySettings();
        saveSettings();
        showNotification("Theme applied: " + item.theme.toUpperCase(), "success"); // <-- NOTIFY
        return; 
    }

    // 2. SCALE CHANGER
    if (item.action === 'set_scale') {
        userSettings.scale = item.scale;
        applySettings();
        saveSettings();
        showNotification("Scale set to: " + item.scale + "%", "success"); // <-- NOTIFY
        return;
    }


    // 3. SOUND TOGGLE
    if (item.action === 'toggle_sounds') {
        // 1. Wert SOFORT im Speicherobjekt aktualisieren
        userSettings.sounds = item.state;
        
        // 2. Permanent speichern
        saveSettings();
        
        // 3. Feedback geben
        // ACHTUNG: Hier nutzen wir den neuen Wert. Wenn item.state jetzt false (OFF) ist, 
        // wird playSound() durch den Gatekeeper geblockt -> Stille. Korrekt!
        if (item.state) {
            // Nur wenn AN: Sound abspielen
            setTimeout(() => playSound('enter'), 50);
        }
        
        showNotification("Sound Effects: " + (item.state ? "ON" : "OFF"), item.state ? "success" : "error"); 
        return;
    }

    

    

    // 4. FACTORY RESET (FIX: NO RELOAD)
    if (item.action === 'factory_reset') {
        localStorage.removeItem('nui_admin_settings');
        
        // Standardwerte setzen (WICHTIG: Nicht null lassen!)
        userSettings = {
            theme: 'default',
            scale: '100',
            sounds: true
        };
        
        applySettings(); // Wendet Standard sofort an
        saveSettings();  // Speichert Standard wieder in LocalStorage
        
        showNotification("Menu reset complete.", "success");
        return;
    }

    // [[ NEW: OPEN TARGET ANNOUNCE ]]
    if (item.action === 'open_announce_target') {
        openAnnounceModal(item.targetId);
        return;
    }

    // [[ EXISTING: OPEN GLOBAL ANNOUNCE ]]
    if (item.action === 'open_announce_menu') {
        openAnnounceModal(null); // Null = Global
        return;
    }

    // 5. KEYBIND OPENER (FIX)
    if (item.action === 'bind_hotkey') {
        // Wir speichern temporär, welches Item wir bearbeiten, um das Label zu updaten
        window.currentBindItemIndex = itemIndex;
        window.currentBindList = currentItemList;
        
        openKeybindModal(item.command);
        return; 
    }

        postData(item.action, payload);
        
        if(currentItemEl) {
            currentItemEl.style.transform = "scale(0.98)";
            setTimeout(() => currentItemEl.style.transform = "scale(1.01)", 100);
        }
    }
}


// [[ NUI LABS: NETWORK HANDLER WITH CALLBACK ]] //
function postData(endpoint, data, cb) {
    fetch(`https://${GetParentResourceName()}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data)
    })
    .then(resp => resp.json()) 
    .then(respData => {
        if (cb) cb(respData); 
    })
    .catch(error => {

    });
}

function closeMenu() {
    playSound('back');

    postData('nui_typing_focus', { state: false });

    // 1. Trigger CSS exit animation
    app.classList.remove('open');
    app.classList.add('closing');

    setTimeout(() => {
        fetch(`https://${GetParentResourceName()}/closeMenu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({})
        });

        setTimeout(() => {
            app.classList.remove('closing');
            app.style.visibility = "hidden";
        }, 100);

    }, 250);
}

function showNotification(text, style) {
    const container = document.getElementById('notify-container');
    const div = document.createElement('div');
    div.classList.add('notify-item');

    if (style === 'success') div.classList.add('success');
    if (style === 'error') div.classList.add('error');

    div.innerText = text;
    container.appendChild(div);

    // Sound effect (optional)
    // playSound('notify'); 

    // Remove after 3 seconds
    setTimeout(() => {
        div.style.animation = "notifyExit 0.3s forwards";
        setTimeout(() => {
            if (div.parentNode) div.parentNode.removeChild(div);
        }, 300);
    }, 3000);
}

// [[ NUI LABS: REAL-TIME SEARCH LOGIC ]]
// [[ NUI LABS: REAL-TIME SEARCH LOGIC (UNIVERSAL) ]]
document.getElementById('player-search-input').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();

    // 1. PLAYER SEARCH CONTEXT
    if (currentTitle === "PLAYER LIST") {
        const fullPlayerList = menuData.players.items.find(item => item.label === "PLAYER LIST").items;

        if (!fullPlayerList) return;

        if (query === "") {
            currentItemList = fullPlayerList;
        } else {
            currentItemList = fullPlayerList.filter(item => {
                const rawText = item.label.toLowerCase(); 
                return rawText.includes(query);
            });
        }
    } 
    // 2. VEHICLE SEARCH CONTEXT
    else if (currentTitle === "SPAWN VEHICLE") {
        // Flatten all categories to search everything
        const allVehicles = getAllVehicles();
        
        if (query === "") {
            // Reset to Categories View (The default items of Spawn Vehicle menu)
            const spawnMenu = menuData.vehicle.items.find(i => i.label === "SPAWN VEHICLE");
            currentItemList = spawnMenu.items;
        } else {
            // Filter the flattened car list
            currentItemList = allVehicles.filter(item => {
                const rawText = item.label.toLowerCase();
                // We search in the label (Name) AND the action (Model often in action name like 'spawn_t20')
                return rawText.includes(query) || item.action.toLowerCase().includes(query);
            });
        }
    }

    else if (currentTitle === "BAN LIST") {
        const fullBanList = menuData.server.items.find(i => i.label === "BAN LIST").items;
        
        if (query === "") {
            currentItemList = fullBanList;
        } else {
            currentItemList = fullBanList.filter(item => {
                // Suche in Label (Name + BanID) oder im versteckten Grund
                const labelMatch = item.label.toLowerCase().includes(query);
                // Optional: Auch im Grund suchen?
                const reasonMatch = item.banData && item.banData.reason.toLowerCase().includes(query);
                
                return labelMatch || reasonMatch;
            });
        }
    }

    itemIndex = 0; 
    renderContent();
    triggerLiveUpdate(); // Update Panel sofort beim Suchen
});

    // [[ NUI LABS: INPUT FOCUS HANDLER ]]
    const searchInputEl = document.getElementById('player-search-input');

    searchInputEl.addEventListener('focus', function() {
        postData('nui_typing_focus', { state: true });
    });

    searchInputEl.addEventListener('blur', function() {
        postData('nui_typing_focus', { state: false });
    });

function toggleSearch() {
    const container = document.getElementById('search-container');
    const input = document.getElementById('player-search-input');
    
    isSearchActive = !isSearchActive;

    if (isSearchActive) {
        container.classList.add('active');
        setTimeout(() => input.focus(), 100);
    } else {
        container.classList.remove('active');
        input.value = ""; // Reset Text
        input.blur();
        
        // [[ NUI LABS FIX: ROBUST LIST RESET ]]
        // If we close search in Player List, restore all players
        if (currentTitle === "PLAYER LIST") {
            const fullPlayerList = menuData.players.items.find(item => item.label === "PLAYER LIST").items;
            if(fullPlayerList) currentItemList = fullPlayerList;
        } 
        // If we close search in Vehicle Menu, restore Categories
        else if (currentTitle === "SPAWN VEHICLE") {
             const spawnMenu = menuData.vehicle.items.find(i => i.label === "SPAWN VEHICLE");
             if(spawnMenu) currentItemList = spawnMenu.items;
        }

        renderContent();
    }
}

// [[ NUI LABS: CONTEXT PANEL MANAGER ]]
function updateInfoPanel(data, mode = 'player') {
    const p = document.getElementById('player-info-panel');
    
    // Helper zum Setzen von Text
    const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || "N/A";
    };
    
    // Helper zum Resetten von Klassen (Farben entfernen)
    const resetColor = (id) => {
        const el = document.getElementById(id);
        if (el) el.className = "";
    };

    if (mode === 'ban') {
        // --- BAN MODE LAYOUT ---
        
        // 1. Spalte: GENERAL INFO
        set('ph-1', "BAN OVERVIEW");
        set('lbl-1', "TARGET:");      set('p-name', data.name); // Name aus DB
        set('lbl-2', "BAN ID:");      set('p-dob', data.ban_id);
        set('lbl-3', "ADMIN:");       set('p-nationality', data.banned_by);
        set('lbl-4', "STATUS:");      set('p-job', data.active ? "ACTIVE" : "INACTIVE");
        set('lbl-5', "DB-REF:");      set('p-gang', "#" + data.id);

        // 2. Spalte: REASONING (ehemals Accounts)
        set('ph-2', "BAN REASONING");
        set('lbl-6', "REASON:");      set('p-cash', data.reason);
        set('lbl-7', "DATE:");        set('p-bank', new Date(data.ban_date * 1000).toLocaleDateString());
        set('lbl-8', "TIME:");        set('p-black', new Date(data.ban_date * 1000).toLocaleTimeString());
        
        // Farben entfernen (Geld-Farben weg)
        resetColor('p-cash');
        resetColor('p-bank');
        resetColor('p-black');

        // 3. Spalte: DURATION / IDS (ehemals Conditions)
        set('ph-3', "DURATION & EXPIRY");
        set('lbl-9', "REMAINING:");   set('p-health', formatBanDuration(data.expire_date));
        set('lbl-10', "EXPIRES:");    set('p-armor', data.expire_date === 0 ? "NEVER (PERM)" : new Date(data.expire_date * 1000).toLocaleDateString());
        set('lbl-11', "LIVE ID:");    set('p-food', data.liveid ? data.liveid : "N/A");
        set('lbl-12', "XBOX:");       set('p-water', data.xbox ? data.xbox : "N/A");

        // 4. Spalte: TECHNICAL IDS (ehemals Account Info)
        set('ph-4', "TECHNICAL IDENTIFIERS");
        set('lbl-13', "LICENSE:");    set('p-steam', data.license ? data.license.substring(0, 25)+"..." : "N/A"); // Gekürzt
        set('lbl-14', "DISCORD:");    set('p-ping', data.discord ? data.discord.replace('discord:', '') : "N/A");
        set('lbl-15', "IP ADDR:");    set('p-discord', data.ip ? data.ip : "HIDDEN"); 
        set('lbl-16', "SOURCE:");     set('p-id', "NUI-DB");

    } else {
        // --- PLAYER MODE LAYOUT (Standard) ---
        set('ph-1', "CHARACTER INFORMATION");
        set('lbl-1', "NAME:");        set('p-name', data.name);
        set('lbl-2', "BIRTHDAY:");    set('p-dob', data.dob);
        set('lbl-3', "NATIONALITY:"); set('p-nationality', data.nationality);
        set('lbl-4', "JOB:");         set('p-job', data.job);
        set('lbl-5', "GANG:");        set('p-gang', data.gang);
        
        set('ph-2', "ACCOUNTS");
        set('lbl-6', "CASH:");        set('p-cash', "$" + (data.cash ? data.cash.toLocaleString() : "0"));
        document.getElementById('p-cash').className = "money-green";
        
        set('lbl-7', "BANK:");        set('p-bank', "$" + (data.bank ? data.bank.toLocaleString() : "0"));
        document.getElementById('p-bank').className = "money-blue";
        
        set('lbl-8', "BLACK MONEY:"); set('p-black', "$" + (data.black ? data.black.toLocaleString() : "0"));
        document.getElementById('p-black').className = "money-red";
        
        set('ph-3', "CONDITIONS");
        set('lbl-9', "HEALTH:");      set('p-health', data.health + "%");
        set('lbl-10', "ARMOR:");      set('p-armor', data.armor + "%");
        set('lbl-11', "FOOD:");       set('p-food', data.food + "%");
        set('lbl-12', "WATER:");      set('p-water', data.water + "%");
        
        set('ph-4', "ACCOUNT INFORMATION");
        set('lbl-13', "NAME:");       set('p-steam', data.fivem_name);
        set('lbl-14', "PING:");       set('p-ping', data.ping + "ms");
        set('lbl-15', "DISCORD:");    set('p-discord', data.discord);
        set('lbl-16', "ID:");         set('p-id', data.id);
    }
}

// [[ NUI LABS: SMART LIVE DATA FETCHER V3 ]]
// [[ NUI LABS: SMART LIVE DATA FETCHER V3 ]]
function triggerLiveUpdate() {
    if (!isPanelUserEnabled) return;

    // Safety Check: Liste oder Item könnte undefined sein beim schnellen Wechsel
    if (!currentItemList || !currentItemList[itemIndex]) return;

    const selectedItem = currentItemList[itemIndex];

    // A: BAN LIST LOGIC (Lokale Daten nutzen!)
    if (currentTitle === "BAN LIST") {
        if (selectedItem.banData) {
            updateInfoPanel(selectedItem.banData, 'ban');
        }
        return;
    }

    // B: PLAYER LIST LOGIK (Server Request nötig)
    if (currentTitle === "PLAYER LIST" || (menuStack.length > 0 && menuStack[0].title === "PLAYER LIST")) {
        let targetId = null;
        if (selectedItem.targetId) targetId = selectedItem.targetId;
        else if (selectedItem.items && selectedItem.items[0] && selectedItem.items[0].targetId) {
            targetId = selectedItem.items[0].targetId;
        }

        if (fetchTimeout) clearTimeout(fetchTimeout);
        fetchTimeout = setTimeout(() => {
             if(targetId) postData('reqPlayerDetails', { targetId: targetId });
        }, 50);
        return;
    }
    
    // C: SELF
    if (sidebarKeys[sidebarIndex] === 'self') {
        // Self Panel ist per Design deaktiviert in renderContent, aber falls aktiv:
        if (fetchTimeout) clearTimeout(fetchTimeout);
        fetchTimeout = setTimeout(() => {
             postData('reqPlayerDetails', { targetId: undefined });
        }, 50); 
    }
}

function hideInfoPanel() {
    document.getElementById('player-info-panel').classList.remove('visible');
}

// [[ NUI LABS: INPUT MODAL SYSTEM ]]

function openInputModal(title, cb) {
    isInputModalOpen = true;
    currentInputCallback = cb;
    
    // [[ FIX: BLOCKIEREN ]]
    postData('nui_typing_focus', { state: true });

    document.getElementById('input-title').innerText = title;
    const input = document.getElementById('input-value');
    input.value = "";
    input.className = ""; 
    
    document.getElementById('input-modal').classList.add('active');
    
    setTimeout(() => input.focus(), 100);
}

function closeInputModal() {
    isInputModalOpen = false;
    currentInputCallback = null;
    
    // [[ FIX: FREIGEBEN ]]
    postData('nui_typing_focus', { state: false });

    document.getElementById('input-modal').classList.remove('active');
    document.getElementById('input-value').blur();
}

// Input Listener für das Modal
document.getElementById('input-value').addEventListener('input', function(e) {
    const val = parseInt(e.target.value) || 0;
    if (val >= 0) {
        e.target.className = "positive";
    } else {
        e.target.className = "negative";
    }
});


// Listener für Tasten im Modal
document.getElementById('input-value').addEventListener('keydown', function(e) {
    if (!isInputModalOpen) return;

    if (e.key === 'Enter') {
        const val = parseInt(this.value);
        
        // Input validieren
        if (!isNaN(val) && val !== 0 && currentInputCallback) {
            

            currentInputCallback(val);
            

            closeInputModal();

            goBackOneLevel(); 
            
        } else {
            // Bei 0 oder Ungültig nur schließen
            closeInputModal();
        }
    } else if (e.key === 'Escape') {
        closeInputModal();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        let val = parseInt(this.value) || 0;
        this.value = val + 100;
        this.dispatchEvent(new Event('input')); // Trigger color update
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        let val = parseInt(this.value) || 0;
        this.value = val - 100;
        this.dispatchEvent(new Event('input'));
    }
});


// [[ NUI LABS: NAVIGATION HELPER ROBUST ]]
function goBackOneLevel() {
    playSound('back');
    if (menuStack.length > 0) {
        const previousLevel = menuStack.pop();
        currentItemList = previousLevel.items;
        currentTitle = previousLevel.title;
        itemIndex = previousLevel.index; 
        
        requestAnimationFrame(() => {
            renderContent();
        });
    }
}

// [[ NUI LABS: CONFIRMATION LOGIC ]]
let currentConfirmCallback = null;

function openConfirmModal(text, cb) {
    // Mauszeiger freigeben, da wir klicken wollen
    postData('nui_typing_focus', { state: true });
    
    document.getElementById('confirm-text').innerText = text;
    document.getElementById('confirm-modal').classList.add('active');
    
    currentConfirmCallback = cb;
}

function closeConfirmModal() {

    postData('nui_typing_focus', { state: false });

    document.getElementById('confirm-modal').classList.remove('active');
    currentConfirmCallback = null;
}

// Event Listeners für die Buttons
document.getElementById('btn-confirm-yes').addEventListener('click', function() {
    if(currentConfirmCallback) currentConfirmCallback();
    closeConfirmModal();
});

document.getElementById('btn-confirm-no').addEventListener('click', function() {
    closeConfirmModal();
});

// [[ NUI LABS: COUNTER LOGIC - NO ANIMATION ]]
function updateCounterUI() {
    const currentEl = document.getElementById('cnt-current');
    const totalEl = document.getElementById('cnt-total');
    const wrapper = document.getElementById('item-counter-wrapper');

    // Sidebar Check
    if (currentColumn === 'sidebar') {
        wrapper.style.opacity = "0";
        return;
    } else {
        wrapper.style.opacity = "1";
    }

    // Werte berechnen
    const currentVal = itemIndex + 1;
    const totalVal = currentItemList.length;

    // Einfaches Update ohne Animation
    currentEl.innerText = currentVal;
    totalEl.innerText = totalVal;
}

// [[ NUI LABS: NAMETAG RENDERER ]] //
const nametagsContainer = document.getElementById('nametags-container');
let currentTags = {}; // Cache um DOM Elemente wiederzuverwenden



function renderNametags(tagsData) {
    // Set mit aktuellen IDs erstellen für Cleanup Check
    let newIds = new Set();

    tagsData.forEach(data => {
        newIds.add(data.id);
        
        let tagElement = currentTags[data.id];

        // 1. Element erstellen, falls nicht existent
        if (!tagElement) {
            tagElement = document.createElement('div');
            tagElement.className = 'nametag';
            tagElement.id = `tag-${data.id}`;
            
            // HTML Template Aufbau
            tagElement.innerHTML = `
                <div class="tag-header">
                    <span class="tag-id">${data.id}</span>
                    <span class="tag-name">${data.name}</span>
                    <span class="tag-voice">🎤</span>
                </div>
                <div class="tag-bars">
                    <div class="bar-bg"><div class="bar-fill hp-fill" style="width: 100%"></div></div>
                    <div class="bar-bg armor-wrapper"><div class="bar-fill arm-fill" style="width: 0%"></div></div>
                </div>
            `;
            
            nametagsContainer.appendChild(tagElement);
            currentTags[data.id] = tagElement;
        }

        // 2. Position Updaten (Lua sendet 0.0 bis 1.0)
        // Wir multiplizieren mit der Fenstergröße
        tagElement.style.left = (data.x * 100) + '%';
        tagElement.style.top = (data.y * 100) + '%';

        // 3. Skalierung basierend auf Distanz (Optional für Tiefe)
        // Je weiter weg (data.dist), desto kleiner (scale)
        let scale = Math.max(0.6, 1.0 - (data.dist / 60)); 
        tagElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
        tagElement.style.opacity = scale; // Ausblenden auf Distanz

        // 4. Daten Updates
        // Health
        tagElement.querySelector('.hp-fill').style.width = data.health + '%';
        
        // Armor (Ausblenden wenn 0)
        const armorBar = tagElement.querySelector('.arm-fill');
        const armorWrapper = tagElement.querySelector('.armor-wrapper');
        
        if (data.armor > 0) {
            armorWrapper.style.display = 'block';
            armorBar.style.width = data.armor + '%';
        } else {
            armorWrapper.style.display = 'none';
        }

        // Voice Status
        const voiceIcon = tagElement.querySelector('.tag-voice');
        if (data.talking) {
            voiceIcon.classList.add('talking');
        } else {
            voiceIcon.classList.remove('talking');
        }
    });

    // 5. Cleanup: Alte Tags entfernen, die nicht mehr in der Liste sind
    for (let id in currentTags) {
        if (!newIds.has(parseInt(id))) {
            const el = currentTags[id];
            if(el) el.remove();
            delete currentTags[id];
        }
    }
}

// [[ NUI LABS: HELPER - FLATTEN VEHICLE LIST ]]
function getAllVehicles() {
    const vehicleMenu = menuData.vehicle.items.find(i => i.label === "SPAWN VEHICLE");
    if (!vehicleMenu || !vehicleMenu.items) return [];

    let allCars = [];
    
    // Loop through categories (Compacts, Sedans, etc.)
    vehicleMenu.items.forEach(category => {
        if (category.items) {
            // Loop through cars in that category
            category.items.forEach(car => {
                // Add category name to label for better UX (optional, helps user know what it is)
                // We clone the object to avoid modifying the original menuData
                let carClone = { ...car }; 
                // We keep the original action and label
                allCars.push(carClone);
            });
        }
    });

    return allCars;
}

// [[ NUI LABS: HELPER - FORCE CLEAR SEARCH ]]
function forceClearSearch() {
    const input = document.getElementById('player-search-input');
    const container = document.getElementById('search-container');
    
    if (input) input.value = ""; // Text löschen
    if (container) container.classList.remove('active'); // Leiste verstecken
    
    isSearchActive = false; // Status resetten
}

// [[ NUI LABS: BAN MODAL LOGIC ]]
let currentBanTarget = null;
let selectedDuration = 0;

function openBanMenu(targetId) {
    currentBanTarget = targetId;
    
    // UI Reset
    document.getElementById('ban-reason').value = "";
    document.getElementById('ban-target-name').innerText = "TARGET ID: " + targetId;
    
    // Standard auf 1 Stunde setzen
    const firstBtn = document.querySelector('.dur-btn');
    if(firstBtn) selectBanDuration(1, firstBtn);
    
    // [[ FIX: INPUTS SOFORT BLOCKIEREN ]]
    // Sagt dem Lua-Skript: "Mach alles dicht, starte den Blocker-Loop"
    postData('nui_typing_focus', { state: true });
    
    document.getElementById('ban-modal').classList.add('active');
}

function closeBanMenu() {
    // [[ FIX: INPUTS WIEDER FREIGEBEN ]]
    postData('nui_typing_focus', { state: false });
    
    document.getElementById('ban-modal').classList.remove('active');
    currentBanTarget = null;
}

// Dauer auswählen & Animation steuern
function selectBanDuration(hours, btn) {
    selectedDuration = hours;
    
    // 1. Visuelle Button-Auswahl
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 2. "Reason" Feld Logik (Perma = Weg)
    const reasonWrapper = document.getElementById('ban-reason-wrapper');
    const reasonInput = document.getElementById('ban-reason');
    
    if (hours === -1) {
        // Perma -> Feld verschwindet "stylish"
        reasonWrapper.classList.add('collapsed');
        // Wir setzen intern einen festen Grund, da das Feld weg ist
        reasonInput.value = "PERMANENTLY BANNED BY ADMINISTRATION"; 
    } else {
        // Zeitbann -> Feld erscheint
        reasonWrapper.classList.remove('collapsed');
        if(reasonInput.value === "PERMANENTLY BANNED BY ADMINISTRATION") reasonInput.value = "";
    }
}

// Execute Button Listener
document.getElementById('btn-execute-ban').addEventListener('click', function() {
    const reason = document.getElementById('ban-reason').value.trim();
    
    // Validierung: Wenn nicht Perma, muss ein Grund da sein
    if (selectedDuration !== -1 && reason.length < 3) {
        showNotification("Please enter a valid reason!", "error");
        return;
    }
    
    // Daten an Lua senden
    postData('execute_ban', {
        targetId: currentBanTarget,
        duration: selectedDuration,
        reason: reason || "No Reason Specified"
    });
    
    closeBanMenu();
});

// [[ NUI LABS: KEYBIND SYSTEM (FIXED) ]]
let isKeybindActive = false;
let keybindCommand = null;

function openKeybindModal(command) {
    keybindCommand = command;
    
    const modal = document.getElementById('keybind-modal');
    modal.classList.add('active');
    
    document.getElementById('keybind-desc').innerText = "PRESS KEY FOR: " + command.toUpperCase();
    document.getElementById('key-display-text').innerText = "...";
    
    postData('nui_typing_focus', { state: true });

    // [[ FIX: DELAY ERHÖHT ]] 
    // 400ms warten, damit das 'Enter' vom Öffnen nicht registriert wird
    isKeybindActive = false; 
    setTimeout(() => {
        isKeybindActive = true;
    }, 400);
}

function closeKeybindModal() {
    isKeybindActive = false;
    document.getElementById('keybind-modal').classList.remove('active');
    postData('nui_typing_focus', { state: false });
}

// Globaler Listener für Tasten
// Globaler Listener für Tasten
window.addEventListener('keydown', function(e) {
    if (!isKeybindActive) return;
    
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
        closeKeybindModal();
        return;
    }

    // Taste erfassen (Wir nehmen e.code für F-Tasten sauberer)
    let keyName = e.key.toUpperCase();
    
    // Mapping für Spezialtasten schöner machen
    if (e.code === 'Space') keyName = 'SPACE';
    if (e.key === 'Control') keyName = 'LCONTROL'; 
    if (e.key === 'Shift') keyName = 'LSHIFT'; 
    if (e.key === 'Alt') keyName = 'LALT'; 
    if (e.key === 'ArrowUp') keyName = 'UP';
    if (e.key === 'ArrowDown') keyName = 'DOWN';
    if (e.key === 'ArrowLeft') keyName = 'LEFT';
    if (e.key === 'ArrowRight') keyName = 'RIGHT';
    if (e.key === 'Enter') keyName = 'RETURN';
    if (e.key === 'PageUp') keyName = 'PAGEUP';
    if (e.key === 'PageDown') keyName = 'PAGEDOWN';

    // Visual Feedback
    const display = document.getElementById('key-display-text');
    display.innerText = keyName;
    display.classList.add('key-press-anim');

    // Speichern verhindern im Delay
    isKeybindActive = false;

    setTimeout(() => {
        // An Lua senden
        postData('save_hotkey', {
            key: keyName,
            command: keybindCommand
        });

        // UI Update
        if (window.currentBindList && window.currentBindList[window.currentBindItemIndex]) {
            window.currentBindList[window.currentBindItemIndex].rightLabel = keyName;
            renderContent(); 
        }

        closeKeybindModal();
        display.classList.remove('key-press-anim');
    }, 300);
});

// [[ FIX: CLOSE BUTTONS (X) ]]
// Damit die X-Buttons oben rechts auch funktionieren

const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function() {
        closeInputModal();
    });
}

const closeBanBtn = document.getElementById('close-ban-btn');
if (closeBanBtn) {
    closeBanBtn.addEventListener('click', function() {
        closeBanMenu();
    });
}

// [[ NUI LABS: ANNOUNCEMENT SYSTEM (GLOBAL & PRIVATE) ]]
// [[ NUI LABS: ANNOUNCEMENT SYSTEM (SAFE FOCUS) ]]
let currentAnnounceTarget = null;

function openAnnounceModal(targetId = null) {
    currentAnnounceTarget = targetId;
    
    // Inputs leeren
    document.getElementById('announce-title').value = "";
    document.getElementById('announce-msg').value = "";
    document.getElementById('announce-show-name').checked = true;

    const modalTitle = document.querySelector('#announce-modal .input-title');
    const titleInput = document.getElementById('announce-title');

    if (targetId) {
        modalTitle.innerText = `📨 PRIVATE MESSAGE (ID: ${targetId})`;
        titleInput.placeholder = "e.g. WARNING / INFO";
    } else {
        modalTitle.innerText = "📢 BROADCAST (GLOBAL)";
        titleInput.placeholder = "e.g. SERVER RESTART";
    }

    // [[ WICHTIG: BLOCKIEREN AKTIVIEREN ]]
    postData('nui_typing_focus', { state: true });
    
    document.getElementById('announce-modal').classList.add('active');
    
    // Fokus setzen (aber kein Listener drauf!)
    setTimeout(() => titleInput.focus(), 100);
}

function closeAnnounceModal() {
    // [[ WICHTIG: BLOCKIEREN AUFHEBEN ]]
    postData('nui_typing_focus', { state: false });
    
    document.getElementById('announce-modal').classList.remove('active');
    currentAnnounceTarget = null;
}

// Handler für den neuen Button in der Spielerliste
// Muss in performAction oder triggerAction eingebaut werden? Nein, wir fangen es hier ab:
// FÜGE DAS IN DEINE 'performAction' oder 'triggerAction' ein (siehe unten Punkt C)

// Event Listener
document.getElementById('btn-cancel-announce').addEventListener('click', closeAnnounceModal);

document.getElementById('btn-send-announce').addEventListener('click', function() {
    const title = document.getElementById('announce-title').value.trim();
    const msg = document.getElementById('announce-msg').value.trim();
    const showName = document.getElementById('announce-show-name').checked;

    if (!title || !msg) {
        showNotification("Please fill out Title and Message!", "error");
        return;
    }

    // Senden an Lua (mit TargetID falls vorhanden)
    postData('trigger_announcement', {
        title: title,
        message: msg,
        showName: showName,
        targetId: currentAnnounceTarget // Kann null sein (Global) oder Zahl (Privat)
    });

    closeAnnounceModal();
});

// [[ DISPLAY LOGIC (Empfänger Seite) ]]
let announceTimeout = null;

function showAnnouncementUI(data) {
    const banner = document.getElementById('announcement-banner');
    const titleEl = document.getElementById('disp-ann-title');
    const msgEl = document.getElementById('disp-ann-msg');
    const authorSpan = document.getElementById('disp-ann-author');
    const footerDiv = document.getElementById('disp-ann-footer');
    const progress = document.querySelector('.announce-progress');

    // Inhalt setzen
    titleEl.innerText = data.title;
    msgEl.innerText = data.message;
    
    // Author Logic Update
    if (data.author) {
        footerDiv.style.display = 'block';
        authorSpan.innerText = data.author.toUpperCase();
    } else {
        footerDiv.style.display = 'none';
    }

    // Animation Hard Reset (Wichtig für erneutes Abspielen)
    progress.style.animation = 'none';
    progress.offsetHeight; /* trigger reflow (Magie, damit Animation neu startet) */
    
    // CSS Variable für Duration setzen (optional) oder inline style
    progress.style.animation = `progressShrink ${data.duration / 1000}s linear forwards`;

    // Zeigen
    banner.classList.add('active');

    // Auto Hide Timer Reset
    if (announceTimeout) clearTimeout(announceTimeout);
    announceTimeout = setTimeout(() => {
        banner.classList.remove('active');
    }, data.duration);
}

// [[ FIX: TEXTAREA NEWLINE SUPPORT ]]
const announceMsgArea = document.getElementById('announce-msg');

if (announceMsgArea) {
    announceMsgArea.addEventListener('keydown', function(e) {
        // Verhindert, dass das Menü auf Pfeiltasten/Enter reagiert während man schreibt
        e.stopPropagation(); 
        
        // Enter = Zeilenumbruch erlauben (Standardverhalten), aber Submit verhindern
        if (e.key === 'Enter') {
            // Kein preventDefault(), damit der Umbruch passiert
        }
    });
}

// [[ NUI LABS: PRIVATE MESSAGE HUD ]]
let pmTimeout = null;

function showPrivateMessage(data) {
    const box = document.getElementById('private-message-box');
    const titleEl = document.getElementById('pm-title');
    const msgEl = document.getElementById('pm-content');
    const authorEl = document.getElementById('pm-author');
    const progress = document.querySelector('.pm-progress');

    // Daten setzen
    titleEl.innerText = data.title || "ADMIN MESSAGE";
    msgEl.innerText = data.message;
    
    if (data.author) {
        authorEl.style.display = 'block';
        authorEl.innerText = "FROM: " + data.author.toUpperCase();
    } else {
        authorEl.style.display = 'none';
    }

    // Animation Reset
    progress.style.animation = 'none';
    progress.offsetHeight; 
    progress.style.animation = `progressShrink ${data.duration / 1000}s linear forwards`;

    // Anzeigen
    box.classList.add('active');

    // Auto Hide
    if (pmTimeout) clearTimeout(pmTimeout);
    pmTimeout = setTimeout(() => {
        box.classList.remove('active');
    }, data.duration);
}

// [[ NUI LABS: KICK MODAL SYSTEM ]]
let currentKickTarget = null;

function openKickMenu(targetId) {
    currentKickTarget = targetId;
    
    // UI Reset
    document.getElementById('kick-reason').value = "";
    document.getElementById('kick-target-name').innerText = "TARGET ID: " + targetId;
    
    // Block Inputs
    postData('nui_typing_focus', { state: true });
    
    document.getElementById('kick-modal').classList.add('active');
    
    // Auto Focus Input
    setTimeout(() => document.getElementById('kick-reason').focus(), 100);
}

function closeKickMenu() {
    postData('nui_typing_focus', { state: false });
    document.getElementById('kick-modal').classList.remove('active');
    currentKickTarget = null;
}

// Close Button Listener
const closeKickBtn = document.getElementById('close-kick-btn');
if (closeKickBtn) {
    closeKickBtn.addEventListener('click', closeKickMenu);
}

// Execute Kick Listener
document.getElementById('btn-execute-kick').addEventListener('click', function() {
    const reason = document.getElementById('kick-reason').value.trim();
    
    if (reason.length < 3) {
        showNotification("Please enter a valid reason!", "error");
        return;
    }
    
    postData('execute_kick', {
        targetId: currentKickTarget,
        reason: reason
    });
    
    showNotification("Kick request sent.", "success");
    closeKickMenu();
});

// [[ NUI LABS: NUI CUSTOMS LOGIC ]] //
// [[ NUI LABS: ULTIMATE COLOR DATABASE ]]
// [[ NUI LABS: VERIFIED COLOR DATABASE ]]
// [[ NUI LABS: VERIFIED GTA V COLORS ]]
const gtaColors = {
    // CLASSIC & METALLIC (Standard Glanz)
    classic: [
        { id: 0, name: "Black" }, { id: 147, name: "Carbon Black" }, { id: 1, name: "Graphite" }, 
        { id: 4, name: "Silver" }, { id: 5, name: "Blue Silver" }, { id: 6, name: "Steel Gray" }, 
        { id: 111, name: "Fluorescent White" }, { id: 112, name: "White" }, { id: 27, name: "Red" }, 
        { id: 28, name: "Torino Red" }, { id: 29, name: "Formula Red" }, { id: 35, name: "Candy Red" }, 
        { id: 135, name: "Hot Pink" }, { id: 137, name: "Salmon Pink" }, { id: 64, name: "Blue" }, 
        { id: 70, name: "Bright Blue" }, { id: 73, name: "Ultra Blue" }, { id: 88, name: "Yellow" }, 
        { id: 89, name: "Race Yellow" }, { id: 55, name: "Lime Green" }, { id: 92, name: "Lime Green" }, 
        { id: 145, name: "Purple" }, { id: 106, name: "Vanilla" }
    ],
    // MATTE (Kein Glanz)
    matte: [
        { id: 12, name: "Matte Black" }, { id: 13, name: "Matte Gray" }, { id: 14, name: "Matte Light Gray" }, 
        { id: 131, name: "Matte White" }, { id: 39, name: "Matte Red" }, { id: 40, name: "Matte Dark Red" }, 
        { id: 41, name: "Matte Orange" }, { id: 42, name: "Matte Yellow" }, { id: 128, name: "Matte Green" }, 
        { id: 83, name: "Matte Blue" }, { id: 82, name: "Matte Dark Blue" }, { id: 84, name: "Matte Midnight Blue" }, 
        { id: 149, name: "Matte Purple" }, { id: 148, name: "Matte Violet" }
    ],
    // METALS (Gold, Chrome, etc.)
    metals: [
        { id: 117, name: "Brushed Steel" }, { id: 118, name: "Brushed Black Steel" }, { id: 119, name: "Brushed Aluminum" }, 
        { id: 120, name: "Chrome" }, { id: 158, name: "Pure Gold" }, { id: 159, name: "Brushed Gold" }
    ]
};

// [[ NUI LABS: ADVANCED MENU BUILDER ]]
// [[ NUI LABS: CLEAN TUNING MENU (NO EMOJIS, FIXED LABELS) ]]
function buildTuningMenu(data) {
    isTuningSessionActive = true; 

    const rootMenu = {
        label: "NUI CUSTOMS",
        items: []
    };

    // 1. PERFORMANCE
    const perfCat = { label: "PERFORMANCE", type: "submenu", items: [] };
    
    // Toggles
    data.toggles.forEach(tog => {
        if (tog.id === 18) { // Turbo
            perfCat.items.push({ 
                label: "TURBO TUNING", // Clean Label
                type: "toggle", 
                state: tog.state, 
                action: "tune_apply_toggle", 
                modType: tog.id 
            });
        }
    });

    // Helper für Performance Levels
    const addPerfMod = (mod) => {
        const levels = [];
        // Stock Option
        levels.push({ 
            label: "FACTORY STOCK", 
            type: "button", 
            action: "tune_apply_mod", 
            modType: mod.id, 
            modIndex: -1, 
            modLabel: mod.label // [FIX] modLabel statt label nutzen für Callback!
        });

        for (let i = 0; i < mod.count; i++) {
            let lvlName = `LEVEL ${i + 1}`;
            if (i === mod.count - 1) lvlName += " (MAX)";
            
            levels.push({ 
                label: lvlName, // [FIX] Hier stand vorher das Problem!
                type: "button", 
                action: "tune_apply_mod", 
                modType: mod.id, 
                modIndex: i,
                modLabel: mod.label // Name für Notify (z.B. "Engine")
            });
        }
        // Kategorie Eintrag
        perfCat.items.push({ 
            label: mod.label.toUpperCase(), 
            type: "submenu", 
            items: levels, 
            rightLabel: `${mod.count} LVLS` 
        });
    };

    // Filter Performance Mods
    const perfMods = data.mods.filter(m => m.category === "performance");
    perfMods.forEach(m => addPerfMod(m));
    rootMenu.items.push(perfCat);

// 2. PAINTS & RESPRAY
    const paintCat = { label: "PAINTS & RESPRAY", type: "submenu", items: [] };

    // Helper für Farb-Kategorien
    const createColorSelector = (targetType) => {
        const catMenu = [];
        
        catMenu.push({ 
            label: "CLASSIC / METALLIC", 
            type: "submenu", 
            items: gtaColors.classic.map(c => ({
                label: c.name, type: "button", action: "tune_apply_color", 
                type: targetType, color: c.id, colorName: c.name
            }))
        });

        catMenu.push({ 
            label: "MATTE FINISH", 
            type: "submenu", 
            items: gtaColors.matte.map(c => ({
                label: c.name, type: "button", action: "tune_apply_color", 
                type: targetType, color: c.id, colorName: c.name
            }))
        });

        catMenu.push({ 
            label: "METALS & CHROME", 
            type: "submenu", 
            items: gtaColors.metals.map(c => ({
                label: c.name, type: "button", action: "tune_apply_color", 
                type: targetType, color: c.id, colorName: c.name
            }))
        });

        return catMenu;
    };

    paintCat.items.push({ label: "PRIMARY COLOR", type: "submenu", items: createColorSelector('primary') });
    paintCat.items.push({ label: "SECONDARY COLOR", type: "submenu", items: createColorSelector('secondary') });
    
    // [FIX] Contextual Interior Colors
    // Wir zeigen das nur an, wenn der Client sagt "hat Interior Mods"
    if (data.extras && data.extras.hasInterior) {
        paintCat.items.push({ label: "INTERIOR COLOR", type: "submenu", items: createColorSelector('interior') });
        paintCat.items.push({ label: "DASHBOARD COLOR", type: "submenu", items: createColorSelector('dashboard') });
    }
    
    // Pearls & Wheels (immer da)
    const pearlItems = gtaColors.classic.map(c => ({
        label: c.name, type: "button", action: "tune_apply_color", type: 'pearl', color: c.id, paintType: 0, colorName: c.name
    }));
    paintCat.items.push({ label: "PEARLESCENT", type: "submenu", items: pearlItems });

    const wheelColItems = gtaColors.classic.map(c => ({
        label: c.name, type: "button", action: "tune_apply_color", type: 'wheels', color: c.id, paintType: 0, colorName: c.name
    }));
    paintCat.items.push({ label: "WHEEL PAINT", type: "submenu", items: wheelColItems });

    rootMenu.items.push(paintCat);

    // 3. COSMETICS (Clean)
    const cosCat = { label: "BODYWORK & COSMETICS", type: "submenu", items: [] };
    
    data.toggles.forEach(tog => {
        if (tog.id === 22) cosCat.items.push({ 
            label: "XENON LIGHTS", 
            type: "toggle", 
            state: tog.state, 
            action: "tune_apply_toggle", 
            modType: tog.id 
        });
    });

    const liveries = data.mods.find(m => m.id === 48);
    if(liveries) {
        const livItems = [];
        livItems.push({ label: "NO LIVERY", type: "button", action: "tune_apply_extra", type: "livery", index: -1 });
        for(let i=0; i<liveries.count; i++) {
            livItems.push({ label: `LIVERY STYLE ${i+1}`, type: "button", action: "tune_apply_extra", type: "livery", index: i });
        }
        cosCat.items.push({ label: "LIVERY / DECALS", type: "submenu", items: livItems });
    }

    const tints = ["None", "Pure Black", "Dark Smoke", "Light Smoke", "Stock", "Limo"];
    const tintItems = tints.map((t, i) => ({ label: t, type: "button", action: "tune_apply_extra", type: "window", index: i }));
    cosCat.items.push({ label: "WINDOW TINT", type: "submenu", items: tintItems });

    const plates = ["Blue/White", "Yellow/Black", "Yellow/Blue", "Blue/White 2", "Blue/White 3", "Yankton"];
    const plateItems = plates.map((p, i) => ({ label: p, type: "button", action: "tune_apply_extra", type: "plate", index: i }));
    cosCat.items.push({ label: "LICENSE PLATE STYLE", type: "submenu", items: plateItems });

    // Restliche Mods
    data.mods.filter(m => m.category === "cosmetics" && m.id !== 48).forEach(mod => {
        const parts = [];
        parts.push({ 
            label: "STOCK / REMOVE", 
            type: "button", 
            action: "tune_apply_mod", 
            modType: mod.id, 
            modIndex: -1, 
            modLabel: mod.label 
        });
        for (let i = 0; i < mod.count; i++) {
            parts.push({ 
                label: `OPTION ${i + 1}`, 
                type: "button", 
                action: "tune_apply_mod", 
                modType: mod.id, 
                modIndex: i,
                modLabel: mod.label
            });
        }
        cosCat.items.push({ label: mod.label.toUpperCase(), type: "submenu", items: parts, rightLabel: `${mod.count} OPTS` });
    });
    rootMenu.items.push(cosCat);

    // 4. EXIT
    rootMenu.items.push({ 
        label: "FINISH TUNING (SAVE & EXIT)", 
        action: "close_tuner_menu", 
        type: "button",
        needsConfirm: false 
    });

    return rootMenu;
}

// Handler für den speziellen Close Button im Tuner
// Handler für den speziellen Close Button im Tuner
function closeTunerMenu() {
    postData('close_tuner', {});
    
    isTuningSessionActive = false; // Lock aufheben
    
    // Zurück zum Hauptmenü (Vehicle Tab)
    currentColumn = 'sidebar';
    
    // [FIX] Wir suchen dynamisch, wo "vehicle" ist, statt fest "2" zu nehmen
    const vehicleIndex = sidebarKeys.indexOf('vehicle');
    sidebarIndex = (vehicleIndex !== -1) ? vehicleIndex : 0; 
    
    menuStack = []; // Stack leeren
    
    renderSidebar();
    renderContent();
}


