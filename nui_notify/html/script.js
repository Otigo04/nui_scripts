// NUI LABS CORE LOGIC
// High Performance Notification Handler

let Config = {}; // Wird beim Start von Lua gefüllt
let soundCache = {}; // Cache für Sounds um Performance zu sparen

window.addEventListener('message', function(event) {
    const data = event.data;

    switch (data.action) {
        case 'init':
            Config = data.config;
            
            // --- NEU: SKALIERUNG ANWENDEN ---
            if (Config.UIScale) {
                const container = document.getElementById('notification-container');
                // Setzt die Größe basierend auf der Config
                container.style.transform = `scale(${Config.UIScale})`;
                // WICHTIG: 'left center' sorgt dafür, dass es nach Rechts wächst 
                // und vertikal zentriert bleibt. Nichts rutscht aus dem Bild.
                container.style.transformOrigin = 'left center'; 
            }
            // --------------------------------
            
            break;
        case 'notify':
            createNewNotification(data);
            break;
    }
});

function createNewNotification(data) {
    const container = document.getElementById('notification-container');
    
    const type = data.type || 'info';
    const title = data.title || type.toUpperCase();
    const message = data.message || '';
    const duration = data.duration || Config.DefaultDuration || 5000;
    
    // Theme & Config
    const theme = data.theme || Config.DefaultTheme || 'industrial';
    const color = (Config.Types && Config.Types[type]) ? Config.Types[type] : '#00E5FF';
    const iconClass = (Config.Icons && Config.Icons[type]) ? Config.Icons[type] : 'fa-solid fa-circle-info';

    // Element erstellen
    const notifyDiv = document.createElement('div');
    notifyDiv.classList.add('notification');
    notifyDiv.classList.add('theme-' + theme);

    // CSS Variablen setzen
    notifyDiv.style.setProperty('--color', color);
    notifyDiv.style.setProperty('--color-dim', color + '40'); // Transparenz für Glow

    playSound(type);

    // HTML Struktur MIT Progress Bar
    notifyDiv.innerHTML = `
        <div class="accent-strip"></div>
        <div class="bg-layer"></div>
        <div class="icon-box">
            <i class="${iconClass}"></i>
        </div>
        <div class="content-box">
            <div class="title">${title}</div>
            <div class="message">${message}</div>
        </div>
        <div class="progress-bar"></div>
    `;

    container.appendChild(notifyDiv);

    // --- ANIMATION STARTEN ---
    // Wir brauchen einen kleinen Timeout (50ms), damit der Browser das Element 
    // erst "malt" (width: 0%), bevor wir es auf 100% setzen. 
    // Sonst "springt" der Balken sofort auf voll ohne Animation.
    setTimeout(() => {
        const bar = notifyDiv.querySelector('.progress-bar');
        if (bar) {
            bar.style.width = '100%';
            // Die Transition Zeit entspricht exakt der Duration der Notification
            bar.style.transition = `width ${duration}ms linear`;
        }
    }, 50);

    // Entfernen nach Ablauf der Zeit
    setTimeout(() => {
        removeNotification(notifyDiv);
    }, duration);
}

function createNewNotification(data) {
    const container = document.getElementById('notification-container');
    
    // Data Handling
    const type = data.type || 'info';
    const title = data.title || type.toUpperCase();
    const message = data.message || '';
    const duration = data.duration || Config.DefaultDuration || 5000;
    
    // Theme & Color Logic
    const theme = data.theme || Config.DefaultTheme || 'industrial';
    const color = (Config.Types && Config.Types[type]) ? Config.Types[type] : '#00E5FF';
    const iconClass = (Config.Icons && Config.Icons[type]) ? Config.Icons[type] : 'fa-solid fa-circle-info';

    // Create Element
    const notifyDiv = document.createElement('div');
    notifyDiv.classList.add('notification');
    notifyDiv.classList.add('theme-' + theme); // Apply theme class

    // Inject CSS Variables
    notifyDiv.style.setProperty('--color', color);
    notifyDiv.style.setProperty('--color-dim', color + '40'); 

    playSound(type);

    // HTML Structure
    notifyDiv.innerHTML = `
        <div class="accent-strip"></div>
        <div class="bg-layer"></div>
        <div class="icon-box">
            <i class="${iconClass}"></i>
        </div>
        <div class="content-box">
            <div class="title">${title}</div>
            <div class="message">${message}</div>
        </div>
        <div class="progress-bar"></div>
    `;

    container.appendChild(notifyDiv);

    // --- ANIMATION LOGIC ---
    // 1. Force the browser to recognize width: 0%
    const bar = notifyDiv.querySelector('.progress-bar');
    
    // 2. Small Delay to trigger CSS Transition
    setTimeout(() => {
        if (bar) {
            // Set width to 100% to trigger animation
            bar.style.width = '100%';
            // Apply transition duration dynamically based on notify duration
            // 'linear' is standard, but you can change to 'ease-in' if preferred
            bar.style.transition = `width ${duration}ms linear`;
        }
    }, 100); // 100ms buffer to ensure DOM is ready

    // 3. Remove Logic
    setTimeout(() => {
        removeNotification(notifyDiv);
    }, duration + 100); // Add slight buffer to match bar finish
}

function removeNotification(element) {
    // Slide-Out Animation Klasse hinzufügen
    element.classList.add('hide');
    
    // Warten bis Animation fertig ist, dann aus DOM entfernen
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 500); // Entspricht der CSS Animation Zeit
}

// Simple Sound Engine (OGG Fix)
function playSound(type) {
    if (!Config.EnableSounds) return;

    // ÄNDERUNG: .ogg statt .mp3
    const audioFile = 'sounds/notify.ogg'; 
    
    const audio = new Audio(audioFile);
    audio.volume = Config.SoundVolume || 0.1; 
    audio.currentTime = 0; 
    
    // Wir geben jetzt e.message aus, das sagt uns MEHR als nur [object]
    audio.play().catch(e => {
        console.log("SOUND ERROR DETAILS: ", e.message); 
    });
}