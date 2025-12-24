// Data Store & State
const mockData = { inbox: [], trash: [], sent: [] };
let currentFolder = 'inbox';
let currentMailId = null; 
let currentMailObject = null;
let currentUserEmail = null;
let currentUserCitizenId = null;
let isLoggedIn = false;
let Locales = {};
let selectedMails = new Set(); // Stores IDs of selected mails
let myAccounts = []; // Array of account objects from DB
let allMyMails = []; // Store ALL mails to filter locally
let currentUserLabel = "Personal";
let serverDomain = "";
let ClientConfig = null; // Hier speichern wir die Config aus Lua
let accountToDelete = null;
let recipientHistory = [];

// --- NEU: Liste für CC Empfänger ---
let recipientList = [];

// References (Dinge die wir oft brauchen)
const viewList = document.getElementById('view-list');
const viewRead = document.getElementById('view-read');
const viewCompose = document.getElementById('view-compose');
const mailListContainer = document.querySelector('.mail-list');
const searchInput = document.querySelector('.search-bar input');

// --- AUDIO SYSTEM ---
function playSound(soundName) {
    const audio = new Audio('sounds/' + soundName);
    if (soundName === 'click.mp3') {
        audio.volume = 0.3;
    } else {
        audio.volume = 0.1;
    }
    audio.play().catch(err => console.log("Audio error:", err));
}

/**
 * Plays a UI sound file from the ./sounds/ directory.
 * Silently catches DOMExceptions caused by rapid playback or autoplay policies.
* @param {string} filename - The name of the file WITHOUT extension
 * @param {number} volume - Volume between 0.0 and 1.0
 */
function playUiSound(filename, volume = 0.5) {
    // SWITCHED TO MP3 FOR STABILITY
    // We append .mp3 automatically here so you don't have to type it every time
    const audio = new Audio(`./sounds/${filename}.mp3`);
    audio.volume = volume;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.catch((err) => {
            // SILENT MODE: We ignore errors effectively.
            // If sounds don't play, check if files exist and are valid MP3s.
        });
    }
}

// Init
window.onload = () => { 
    loadFolder('inbox'); 
    
    // 1. Opacity laden
    const savedOpacity = localStorage.getItem('nui_mail_opacity');
    if (savedOpacity) {
        document.documentElement.style.setProperty('--glass-opacity', savedOpacity);
        const slider = document.getElementById('inp-opacity');
        if(slider) slider.value = savedOpacity;
    }

    loadSavedTheme();

    // 2. Avatar Logik (HIER WAR DER FEHLER)
    // Wir definieren die Variable ZUERST, bevor wir sie nutzen.
    const avatarInput = document.getElementById('inp-avatar-url'); 
    
    const savedAvatar = localStorage.getItem('nui_mail_avatar_url');
    if (savedAvatar) {
        if(avatarInput) avatarInput.value = savedAvatar;
        updateSidebarAvatar(savedAvatar);
    }
    
    // Listener zum Speichern des Avatars
    if(avatarInput) {
        avatarInput.addEventListener('input', (e) => {
            localStorage.setItem('nui_mail_avatar_url', e.target.value);
            updateSidebarAvatar(e.target.value);
        });
    }

    // --- NEU: Ghost Input Listener (Für CC Chips) ---
    const ghostInput = document.getElementById('inp-recipient-ghost');
    if (ghostInput) {
        ghostInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                e.preventDefault(); // Kein Submit, kein Leerzeichen einfügen
                addRecipient(this.value);
            }
            // Letzten Chip löschen mit Backspace, wenn Input leer ist
            if (e.key === 'Backspace' && this.value === '' && recipientList.length > 0) {
                removeChip(recipientList.length - 1);
            }
        });

        ghostInput.addEventListener('blur', function() {
            // Wenn man woanders hinklickt, den Text als Chip hinzufügen
            if (this.value) addRecipient(this.value);
        });
    }
};

// --- CHIP INPUT LOGIC (NEU) ---
function renderChips() {
    const container = document.getElementById('recipient-container');
    const ghostInput = document.getElementById('inp-recipient-ghost');
    
    if (!container || !ghostInput) return;

    // Alte Chips entfernen (aber Input behalten)
    const oldChips = container.querySelectorAll('.email-chip');
    oldChips.forEach(chip => chip.remove());

    // Neue Chips rendern
    recipientList.forEach((email, index) => {
        const chip = document.createElement('div');
        chip.className = 'email-chip';
        chip.innerHTML = `
            <span>${email}</span>
            <span class="chip-close" onclick="removeChip(${index})"><i class="fa-solid fa-times"></i></span>
        `;
        container.insertBefore(chip, ghostInput);
    });

    // Input leeren
    ghostInput.value = '';
    // Fokus zurück auf Input (optional, wirkt flüssiger)
    ghostInput.focus();
}

function addRecipient(val) {
    // Leerzeichen entfernen
    const cleanVal = val.trim().replace(/\s/g, "");
    
    // Prüfen ob leer oder schon vorhanden
    if (cleanVal && !recipientList.includes(cleanVal)) {
        recipientList.push(cleanVal);
        renderChips();
    } else {
        // Falls leer, input einfach leeren
        const ghost = document.getElementById('inp-recipient-ghost');
        if(ghost) ghost.value = '';
    }
}

// Global machen für HTML Zugriff
window.removeChip = function(index) {
    recipientList.splice(index, 1);
    renderChips();
    playSound('click.mp3');
};


// --- TRANSLATION ---
function updateInterfaceText() {
    if(!Locales) return;

    // Menu
    document.getElementById('lbl-inbox').innerText = Locales.menu_inbox;
    document.getElementById('lbl-sent').innerText = Locales.menu_sent;
    document.getElementById('lbl-trash').innerText = Locales.menu_trash;
    document.getElementById('lbl-refresh').innerText = Locales.menu_refresh;
    document.getElementById('lbl-compose').innerText = Locales.btn_compose;
    
    // Settings Sidebar
    const lblTrans = document.getElementById('lbl-transparency');
    if(lblTrans) lblTrans.innerText = Locales.lbl_transparency;
    
    const lblTheme = document.querySelector('.settings-label'); // Theme Header
    if(lblTheme) lblTheme.innerText = Locales.lbl_settings_header;

    // Search
    if(searchInput) searchInput.placeholder = Locales.placeholder_search;

    // Compose View
    document.getElementById('lbl-new-msg').innerText = Locales.header_new_msg;
    document.getElementById('lbl-cancel').innerText = Locales.btn_cancel;
    document.getElementById('lbl-send').innerText = Locales.btn_send;
    document.getElementById('inp-recipient-ghost').placeholder = Locales.placeholder_recipient;
    document.getElementById('inp-subject').placeholder = Locales.placeholder_subject;
    document.getElementById('inp-message').placeholder = Locales.placeholder_message;

    // Read View (Back Button & Tooltips)
    document.getElementById('lbl-back').innerText = Locales.btn_back;
    document.getElementById('btn-restore').title = Locales.tooltip_restore;
    document.getElementById('btn-trash').title = Locales.tooltip_delete;
    document.getElementById('btn-reply').title = Locales.tooltip_reply;

    // CREATE ACCOUNT MODAL TEXTS (IDs müssen im HTML existieren, siehe Schritt 4)
    document.getElementById('lbl-modal-title').innerText = Locales.modal_title;
    document.getElementById('lbl-modal-desc').innerText = Locales.modal_desc;
    document.getElementById('lbl-modal-label-acc').innerText = Locales.modal_label_acc;
    document.getElementById('new-acc-label').placeholder = Locales.modal_placeholder_acc;
    document.getElementById('lbl-modal-label-mail').innerText = Locales.modal_label_mail;
    document.getElementById('new-acc-prefix').placeholder = Locales.modal_placeholder_mail;
    document.getElementById('btn-modal-create').innerText = Locales.modal_btn_create;
    document.getElementById('btn-modal-cancel').innerText = Locales.modal_btn_cancel;

    // DELETE MODAL
    document.getElementById('lbl-delete-title').innerText = Locales.modal_delete_title;
    document.getElementById('lbl-delete-desc').innerText = Locales.modal_delete_desc;
    document.getElementById('btn-delete-confirm').innerText = Locales.btn_confirm_delete;
    document.getElementById('btn-delete-cancel').innerText = Locales.modal_btn_cancel; // Recyceln wir

    // Add Account Button (Dynamisch im JS generiert, aber wir updaten den Text in der Funktion renderAccountSwitcher)
    // Hinweis: renderAccountSwitcher holt sich den Text direkt aus Locales.lbl_add_account

    updateHeaderTitle();
}

function updateHeaderTitle() {
    if(!Locales) return;
    let title = "Inbox";
    if(currentFolder === 'inbox') title = Locales.header_inbox;
    if(currentFolder === 'sent') title = Locales.header_sent;
    if(currentFolder === 'trash') title = Locales.header_trash;
    document.querySelector('#view-list h2').innerText = title;
}

// --- CORE FUNCTIONS ---
function switchView(viewName) {
    viewList.classList.add('hidden');
    viewRead.classList.add('hidden');
    viewCompose.classList.add('hidden');

    let currentView = null;
    if (viewName === 'list') currentView = viewList;
    if (viewName === 'read') currentView = viewRead;
    if (viewName === 'compose') currentView = viewCompose;

    if (currentView) {
        currentView.classList.remove('hidden');
        currentView.classList.remove('animate-enter');
        void currentView.offsetWidth; 
        currentView.classList.add('animate-enter');
    }
}

function loadFolder(folderName) {
    if (currentFolder !== folderName) playSound('click.mp3');
    currentFolder = folderName;

    selectedMails.clear();
    updateBulkButton();
    
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    const activeNav = document.getElementById('nav-' + folderName);
    if(activeNav) activeNav.classList.add('active');
    
    updateHeaderTitle();

    if(searchInput) searchInput.value = '';
    const mails = mockData[folderName] || [];
    renderMailList(mails);
    switchView('list');
}

function openMail(mailData) {
    currentMailId = mailData.id;
    currentMailObject = mailData;

    document.getElementById('read-subject').innerText = mailData.subject;
    document.getElementById('read-sender').innerText = mailData.sender;
    
    const timeElement = document.querySelector('.read-meta .time');
    if (timeElement) timeElement.innerText = mailData.time; 

    // --- GELESEN STATUS ---
    if (!mailData.isRead) {
        mailData.isRead = 1; 
        fetch(`https://${GetParentResourceName()}/markAsRead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: mailData.id })
        });
    }

    // --- TEXT VERARBEITUNG ---
    let body = mailData.body
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");

    const urlRegex = /(https?:\/\/[^\s<"']+)/gi;
    body = body.replace(urlRegex, (url) => {
        let cleanUrl = url;
        let suffix = "";
        while (['.', ',', '!', '?', ')', ']'].includes(cleanUrl.slice(-1))) {
            suffix = cleanUrl.slice(-1) + suffix;
            cleanUrl = cleanUrl.slice(0, -1);
        }

        const isImage = /\.(jpeg|jpg|gif|png|webp|bmp|tiff)($|\?)/i.test(cleanUrl);

        if (isImage) {
            return `<br>
                    <img src="${cleanUrl}" 
                         class="mail-attachment" 
                         referrerpolicy="no-referrer" 
                         onclick="window.invokeNative('openUrl', '${cleanUrl}')" 
                         onerror="console.log('Bild Fehler:', '${cleanUrl}'); this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                    <a href="#" style="display:none; color: #00d4ff; font-size: 12px;" onclick="window.invokeNative('openUrl', '${cleanUrl}')">Couldn't load pic. Click to Open</a>
                    ${suffix}<br>`;
        } else {
            return `<a href="#" style="color: #00d4ff; text-decoration: underline;" onclick="window.invokeNative('openUrl', '${cleanUrl}')">LINK</a>${suffix}`;
        }
    });

    body = body.replace(/<br>\s*<br>\s*<img/gi, '<img');
    body = body.replace(/<br>\s*<img/gi, '<img');
    body = body.replace(/<\/a>\s*<br>/gi, '</a>');

    document.getElementById('read-body').innerHTML = body;
    const restoreBtn = document.getElementById('btn-restore');
    const trashBtn = document.getElementById('btn-trash');
    const replyBtn = document.getElementById('btn-reply');

    if (currentFolder === 'trash') {
        // Im Papierkorb: Zeige Restore, Verstecke Reply
        if(restoreBtn) restoreBtn.classList.remove('hidden');
        if(replyBtn) replyBtn.classList.add('hidden');
        // Trash Button könnte hier "Endgültig löschen" bedeuten -> lassen wir da
    } else {
        // In Inbox/Sent: Verstecke Restore, Zeige Reply
        if(restoreBtn) restoreBtn.classList.add('hidden');
        if(replyBtn) replyBtn.classList.remove('hidden');
    }

    document.getElementById('read-body').innerHTML = body;
    switchView('read');
}

function showList() { 
    playSound('click.mp3'); 
    renderMailList(mockData[currentFolder] || []);
    switchView('list'); 
}

// --- HELPERS ---
const avatarPalette = ['#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#84cc16'];

function getAvatarColor(name) {
    if (!name) return '#333';
    const n = name.toLowerCase();
    
    if (n.includes('police') || n.includes('lspd') || n.includes('polizei') || n.includes('pd')) return '#3B82F6';
    if (n.includes('medic') || n.includes('lsmd') || n.includes('rettung') || n.includes('ems')) return '#EF4444';
    if (n.includes('gov') || n.includes('state') || n.includes('mayor') || n.includes('city')) return '#F59E0B';
    if (n.includes('weazel') || n.includes('news')) return '#F97316';
    if (n.includes('mechanic') || n.includes('lsc') || n.includes('werkstatt')) return '#64748B';
    
    let hash = 0;
    for (let i = 0; i < n.length; i++) { hash = n.charCodeAt(i) + ((hash << 5) - hash); }
    const index = Math.abs(hash) % avatarPalette.length;
    return avatarPalette[index];
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) return Locales.time_just_now || "Just now";
    if (diffMinutes < 60) return (Locales.time_min_ago || "%d min ago").replace('%d', diffMinutes);
    if (date.toDateString() === now.toDateString()) return Locales.time_today || "Today";
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return Locales.time_yesterday || "Yesterday";
    
    return date.toLocaleDateString();
}

// --- UI RENDERING ---
// REPLACEMENT START: renderMailList
function renderMailList(mails) {
    mailListContainer.innerHTML = ''; 
    
    // Reset selection visualization on re-render
    updateBulkButton();

    if (!mails || mails.length === 0) {
        mailListContainer.innerHTML = `<div style="padding:20px; color:#aaa; text-align:center;">${Locales.no_messages || 'No messages'}</div>`;
        return;
    }

    mails.forEach((mail, index) => {
        const mailDiv = document.createElement('div');
        mailDiv.className = 'mail-item';
        mailDiv.style.animationDelay = `${index * 0.05}s`;

        // Checks
        const isUnread = (currentFolder === 'inbox' && (mail.isRead === 0 || mail.isRead === false));

        // --- DISPLAY LOGIC FIX ---
        // If in 'sent' folder, show Recipient. Otherwise show Sender.
        let displayName = mail.sender;
        if (currentFolder === 'sent') {
            displayName = "To: " + (mail.recipient || "Unknown");
        }

        const senderLower = mail.sender.toLowerCase();
        const isOfficial = /police|lspd|polizei|medic|lsmd|ems|gov|state|mayor|justice|weazel/i.test(senderLower);
        
        // Calculate color based on the Name displayed (so Sent items have varied colors)
        const avatarColor = getAvatarColor(displayName.replace("To: ", ""));

        // --- STYLING LOGIK (CLEAN & NEW) ---
        
        // 1. Offizielle Mails: Besonderer Hintergrund & Border
        if (isOfficial) {
            mailDiv.style.border = `1px solid ${avatarColor}`;
            mailDiv.style.background = `linear-gradient(90deg, ${avatarColor}1A 0%, transparent 100%)`;
        } 
        
        // 2. Ungelesen Status
        if (isUnread) {
            mailDiv.classList.add('unread');
            
            // Ausnahme: Behörden bekommen weiterhin einen dickeren Rand
            if(isOfficial) {
                 mailDiv.style.borderLeft = `3px solid ${avatarColor}`;
            }
        }

        // Click Handler
        mailDiv.onclick = (e) => { 
            if(e.target.type === 'checkbox' || e.target.classList.contains('mail-checkbox')) return;
            playSound('click.mp3'); 
            openMail(mail); 
        };

        // Avatar Logic
        // Use displayName for initials so it matches the text (e.g. Recipient initials in Sent view)
        const nameForAvatar = displayName.replace("To: ", "");
        const avatarText = nameForAvatar ? nameForAvatar.substring(0, 2).toUpperCase() : "??";
        
        let avatarHTML = avatarText; 
        let avatarStyle = `background: ${avatarColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.3); box-shadow: 0 2px 5px rgba(0,0,0,0.2);`;
        
        if (mail.avatar && mail.avatar.length > 5) {
            avatarHTML = `<img src="${mail.avatar}" onerror="this.style.display='none'">`;
            avatarStyle = `background: transparent; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`;
        }

        const isChecked = selectedMails.has(mail.id) ? 'checked' : '';

        // --- HTML ZUSAMMENBAU ---
        mailDiv.innerHTML = `
            <input type="checkbox" class="mail-checkbox" ${isChecked} onchange="toggleMailSelection(${mail.id}, this)">
            
            <div class="avatar" style="${avatarStyle}">${avatarHTML}</div>
            <div class="mail-info">
                <div class="sender">
                    <span style="display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding-right: 5px;">
                        ${displayName} 
                        
                        ${isOfficial ? '<i class="fa-solid fa-circle-check" style="opacity:0.8; font-size:12px; flex-shrink: 0;" title="Verified"></i>' : ''}
                        
                        ${(isOfficial && isUnread) ? '<i class="fa-solid fa-circle-exclamation" style="color: #ef4444; font-size:12px; animation: pulse 1s infinite; flex-shrink: 0;" title="Important"></i>' : ''}

                        ${(!isOfficial && isUnread) ? '<span class="unread-dot" title="Unread"></span>' : ''}
                    </span>
                    <span class="time">${mail.time}</span>
                </div>
                <div class="subject" ${isUnread ? 'style="font-weight:700; color:#fff;"' : ''}>${mail.subject}</div>
                <div class="preview">${mail.preview}</div>
            </div>
        `;
        mailListContainer.appendChild(mailDiv);
    });
}
// REPLACEMENT END

// --- BUTTONS ---
document.querySelector('.compose-btn').addEventListener('click', () => { 
    playSound('click.mp3'); 
    switchView('compose'); 
});

// --- SEND BUTTON (UPDATE FÜR CC FUNKTION) ---
document.querySelector('.send-btn').addEventListener('click', function() {
    const subject = document.getElementById('inp-subject').value;
    const message = document.getElementById('inp-message').value;

    // Check: Ist noch Text im Input, der noch kein Chip ist?
    const ghostInput = document.getElementById('inp-recipient-ghost');
    if (ghostInput && ghostInput.value) {
        addRecipient(ghostInput.value);
    }

    // Validierung: Liste darf nicht leer sein
    if (recipientList.length === 0) {
        // Hier könnte man noch eine UI Meldung anzeigen
        console.log("Keine Empfänger!");
        return;
    }
    if (!message) return;
    
    playSound('click.mp3');

    fetch(`https://${GetParentResourceName()}/sendMail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        // WICHTIG: Hier haben wir 'from: currentUserEmail' hinzugefügt!
        // Damit weiß der Server, von welchem deiner Accounts du sendest.
        body: JSON.stringify({ 
            recipients: recipientList, 
            subject, 
            message,
            from: currentUserEmail // <--- DAS HIER WAR SCHRITT 2
        }) 
    }).then(resp => resp.json()).then(resp => {
        if (resp === 'ok') {
            playSound('woosh_mailsent.mp3');
            
            // Alles zurücksetzen
            recipientList = [];
            renderChips();
            
            document.getElementById('inp-subject').value = '';
            document.getElementById('inp-message').value = '';
            
            showList();
            
            setTimeout(() => {
                fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
            }, 500);
        }
    });
});

const refreshBtn = document.getElementById('nav-refresh');
if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
        playSound('click.mp3');
        const icon = this.querySelector('i');
        if(icon) {
            icon.style.transition = "transform 0.5s";
            icon.style.transform = "rotate(360deg)";
            setTimeout(() => { icon.style.transform = "none"; icon.style.transition = "none"; }, 500);
        }
        fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
    });
}

// TRASH BUTTON (Fixed "Double Delete" & Ghosting)
const trashBtn = document.getElementById('btn-trash');
if (trashBtn) {
    trashBtn.addEventListener('click', function() {
        if(!currentMailId) return;
        playSound('click.mp3');

        // 1. OPTIMISTIC UPDATE: Remove locally immediately
        if (mockData[currentFolder]) {
            // Filter out the deleted mail
            mockData[currentFolder] = mockData[currentFolder].filter(mail => mail.id !== currentMailId);
        }

        // 2. Go back to list immediately (it will use the updated mockData)
        showList();
        
        // 3. Inform Server in background
        fetch(`https://${GetParentResourceName()}/deleteMail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ id: currentMailId, folder: currentFolder }) 
        }).then(() => {
            setTimeout(() => {
                 fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
            }, 1000); // Wait 1 second before syncing with DB
        });
    });
}

// --- REPLY BUTTON (UPDATE FÜR CC) ---
const replyBtn = document.getElementById('btn-reply');
if (replyBtn) {
    replyBtn.addEventListener('click', function() {
        if (!currentMailObject) return;
        playSound('click.mp3');
        switchView('compose');
        
        // Empfänger setzen (als Chip!)
        recipientList = [];
        addRecipient(currentMailObject.sender);
        renderChips();

        let newSubject = currentMailObject.subject;
        if (!newSubject.startsWith("RE:")) newSubject = "RE: " + newSubject;
        document.getElementById('inp-subject').value = newSubject;

        const textArea = document.getElementById('inp-message');
        const separator = "\n\n\n------------------------------------------\n";
        let historyHeader = (Locales.history_header || "From: %s | Sent: %s")
            .replace('%s', currentMailObject.sender)
            .replace('%s', currentMailObject.time);
        const oldMessage = currentMailObject.body;
        textArea.value = separator + historyHeader + "\n\n" + oldMessage;
        textArea.focus();
        textArea.setSelectionRange(0, 0);
    });
}

// Search
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase();
        const allMails = mockData[currentFolder] || [];
        const filteredMails = allMails.filter(mail => {
            const senderMatch = mail.sender && mail.sender.toLowerCase().includes(term);
            const subjectMatch = mail.subject && mail.subject.toLowerCase().includes(term);
            return senderMatch || subjectMatch;
        });
        renderMailList(filteredMails);
    });
}

function processMails(mails) {
    allMyMails = mails; 
    
    mockData.inbox = [];
    mockData.trash = [];
    mockData.sent = []; 
    
    let tempHistory = new Set();
    
    if (!currentUserEmail) return;

    const myEmailLower = currentUserEmail.toLowerCase().trim();

    mails.forEach(mail => {
        let belongsToCurrentAccount = false;

        if (mail.owner) {
            if (mail.owner.toLowerCase().trim() === myEmailLower) {
                belongsToCurrentAccount = true;
            }
        } else {
            const s = mail.sender ? mail.sender.toLowerCase().trim() : "";
            const r = mail.recipient ? mail.recipient.toLowerCase().trim() : "";
            
            if (s === myEmailLower || r === myEmailLower) {
                belongsToCurrentAccount = true;
            }
        }

        if (!belongsToCurrentAccount) return;

        let timeString = "Unknown";
        if(mail.timestamp) timeString = formatRelativeTime(mail.timestamp);

        let mailObj = createMailObject(mail, timeString);

        if (mail.isTrash == 1 || mail.isTrash === true) {
            mockData.trash.push(mailObj);
            return; 
        }

        if (mail.mail_type === 'sent') {
            mockData.sent.push(mailObj);
            
            if(mail.recipient) {
                const recipients = mail.recipient.split(',');
                recipients.forEach(r => {
                    const cleanR = r.trim();
                    if(cleanR.length > 0) tempHistory.add(cleanR);
                });
            }

        } else if (mail.mail_type === 'inbox') {
            mockData.inbox.push(mailObj);

        } else {
            const senderLower = mail.sender ? mail.sender.toLowerCase().trim() : "";
            
            if (senderLower === myEmailLower) {
                mockData.sent.push(mailObj);
                 if(mail.recipient) tempHistory.add(mail.recipient);
            } else {
                mockData.inbox.push(mailObj);
            }
        }
    });

    recipientHistory = Array.from(tempHistory);
}

// Helper (damit nichts fehlt)
function createMailObject(mail, timeString) {
    return {
        id: mail.id,
        sender: mail.sender,
        recipient: mail.recipient,
        subject: mail.subject,
        body: mail.message,
        preview: (mail.message && mail.message.length > 60) ? mail.message.substring(0, 60) + '...' : mail.message,
        time: timeString,
        isRead: mail.isRead,
        mail_type: mail.mail_type,
        owner: mail.owner // Wichtig für Debugging
    };
}

function openCreateAccountModal() {
    document.getElementById('modal-create-account').classList.remove('hidden');
    document.getElementById('account-list-popup').classList.add('hidden');
}
function closeCreateAccountModal() {
    document.getElementById('modal-create-account').classList.add('hidden');
}
function submitNewAccount() {
    const label = document.getElementById('new-acc-label').value;
    let prefix = document.getElementById('new-acc-prefix').value;
    
    if(!prefix || !label) return;

    // SÄUBERUNG: Falls der Nutzer aus Versehen doch "@..." eintippt, entfernen wir es
    if (prefix.includes('@')) {
        prefix = prefix.split('@')[0];
    }
    
    // Automatisch zusammenbauen
    const fullEmail = prefix + "@" + serverDomain; 

    fetch(`https://${GetParentResourceName()}/createAccount`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: fullEmail, label: label })
    });
    
    closeCreateAccountModal();
    // Reset inputs
    document.getElementById('new-acc-label').value = '';
    document.getElementById('new-acc-prefix').value = '';
}

// --- LISTENER ---
// --- LISTENER (FIXED & CLEANED UP) ---
window.addEventListener('message', function(event) {
    let data = event.data;

    // 0. UI SCALING
    if (data.uiScale) {
        // Zoom ist am zuverlässigsten für globales Skalieren
        document.body.style.zoom = data.uiScale; 
        // Optional: CSS Variable setzen (z.B. für Berechnungen)
        document.documentElement.style.setProperty('--ui-scale', data.uiScale);
    }

    // 1. Locales laden
    if (data.locales) {
        Locales = data.locales;
        updateInterfaceText();
    }

    // 2. Domain laden (Dynamisch aus Config)
    if (data.domain) {
        serverDomain = data.domain;
        // Aktualisiere alle Badges im UI sofort
        document.querySelectorAll('.domain-badge').forEach(el => {
            el.innerText = '@' + serverDomain;
        });
    }

    // 3. Force Reload Handler
    if (data.action === 'force_reload') {
        fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
        return; // Hier abbrechen, da wir auf neue Daten warten
    }

    // Config speichern
    if (data.config) {
        ClientConfig = data.config;
    }

    // 4. HAUPTLOGIK: OPEN & UPDATE
    if (data.action === 'update_mails' || data.action === 'open') {

        // FIX: Ensure currentUserEmail is set immediately if provided
        if (data.myEmail) {
            // Only overwrite if we don't have one, or if it's the first load
            if (!currentUserEmail) currentUserEmail = data.myEmail;
        }

        // A) ACCOUNTS & IDENTITÄT SICHERN
        if (data.accounts) {
            myAccounts = data.accounts;
            
            let activeAccountObj = null;
            if (currentUserEmail) {
                activeAccountObj = myAccounts.find(acc => acc.email === currentUserEmail);
            }

            if (activeAccountObj) {
                currentUserLabel = activeAccountObj.label;
            } else {
                if (myAccounts.length > 0) {
                    currentUserEmail = myAccounts[0].email;
                    currentUserLabel = myAccounts[0].label;
                }
            }

            const emailDisplay = document.getElementById('my-email-display');
            if (emailDisplay) emailDisplay.innerText = currentUserEmail;
            
            const labelDisplay = document.getElementById('lbl-account-label');
            if (labelDisplay) labelDisplay.innerText = currentUserLabel;
            
            updateSidebarAvatar(currentUserEmail);
        }

        // B) MAILS VERARBEITEN
        if (data.mails) {
            processMails(data.mails);
        }

        // C) UI ANZEIGEN
        if (data.action === 'open') {
            if (data.myCitizenId) currentUserCitizenId = data.myCitizenId;

            document.body.style.display = 'flex';
            const container = document.querySelector('.container');
            container.classList.remove('closing');
            void container.offsetWidth; 

            if (!isLoggedIn) {
                document.querySelector('.container').style.display = 'none';
                document.getElementById('login-screen').classList.remove('hidden');
                // FIX: Use the variable we just ensured is set
                startLoginAnimation(currentUserEmail || "unknown");
            } else {
                document.getElementById('login-screen').classList.add('hidden');
                document.querySelector('.container').style.display = 'flex';
                container.classList.add('opening');
                playSound('mail_received.mp3');
                loadFolder('inbox');
            }
        } 
        else if (data.action === 'update_mails') {
            loadFolder(currentFolder);
        }
        
        renderAccountSwitcher();
    }
    // 5. SCHLIESSEN
    if (data.action === 'close') {
        const container = document.querySelector('.container');
        container.classList.remove('opening');
        container.classList.add('closing');

        setTimeout(() => {
            document.body.style.display = 'none';
        }, 300);
    }
});

document.onkeyup = function(data) {
    if (data.key == "Escape") {
        const container = document.querySelector('.container');
        container.classList.remove('opening');
        container.classList.add('closing');

        setTimeout(() => {
            fetch(`https://${GetParentResourceName()}/closeUI`, { method: 'POST', body: JSON.stringify({}) })
            .then(() => { 
                document.body.style.display = 'none'; 
            }).catch(() => {});
        }, 300);
    }
};

// --- TRANSPARENCY SLIDER ---
const opacitySlider = document.getElementById('inp-opacity');
if (opacitySlider) {
    opacitySlider.addEventListener('input', function(e) {
        const value = e.target.value;
        document.documentElement.style.setProperty('--glass-opacity', value);
        localStorage.setItem('nui_mail_opacity', value);
    });
}

// --- LOGIN ANIMATION ---
function startLoginAnimation(email) {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-pass');
    const loginBtn = document.getElementById('btn-login');
    
    emailInput.value = "";
    passInput.value = "";
    loginBtn.classList.remove('visible');
    
    typeWriter(email, emailInput, 50, () => {
        setTimeout(() => {
            typeWriter("**********", passInput, 100, () => {
                setTimeout(() => {
                    loginBtn.classList.add('visible');
                    playSound('click.mp3');
                }, 300);
            });
        }, 400);
    });
}

function typeWriter(text, element, speed, callback) {
    let i = 0;
    element.value = "";
    function type() {
        if (i < text.length) {
            element.value += text.charAt(i);
            i++;
            let randomSpeed = speed + (Math.random() * 50 - 25); 
            setTimeout(type, randomSpeed);
        } else {
            if (callback) callback();
        }
    }
    type();
}

document.getElementById('btn-login').addEventListener('click', function() {
    isLoggedIn = true;
    playSound('click.mp3');
    document.getElementById('login-screen').classList.add('hidden');
    const container = document.querySelector('.container');
    container.style.display = 'flex';
    container.classList.remove('closing');
    void container.offsetWidth; 
    container.classList.add('opening');
    playSound('mail_received.mp3');
    loadFolder('inbox');
});

// HELPER: Avatar Anzeige in der Sidebar aktualisieren
// HELPER: Avatar Anzeige (Mit Fail-Safe Schutz)
function updateSidebarAvatar(email) {
    const div = document.getElementById('sidebar-avatar');
    if (!div) return;

    // 1. Erstmal alles sauber machen
    div.innerHTML = '';
    div.style.backgroundImage = 'none';
    
    // 2. Prüfen: Gibt es überhaupt eine URL im Speicher?
    const savedAvatar = localStorage.getItem('nui_mail_avatar_url');
    const hasPotentialUrl = savedAvatar && savedAvatar.startsWith('http');

    if (hasPotentialUrl) {
        // VERSUCH: Bild laden
        const img = document.createElement('img');
        img.src = savedAvatar;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        img.referrerPolicy = 'no-referrer'; // Wichtig für Imgur
        
        // --- DER FIX ---
        // Wenn das Bild NICHT geladen werden kann (Broken Image), feuert dieser Code:
        img.onerror = function() {
            console.log("Avatar Bild konnte nicht geladen werden, zeige Initialen.");
            this.remove(); // Kaputtes Bild entfernen
            renderInitials(div, email); // Fallback auf Buchstaben
        };
        
        div.appendChild(img);
        div.style.background = 'transparent'; 
    } else {
        // KEIN BILD VORHANDEN: Direkt Buchstaben anzeigen
        renderInitials(div, email);
    }
}

// Hilfsfunktion nur für das Malen der Buchstaben
function renderInitials(div, email) {
    if (!email) return;

    const color = getAvatarColor(email);
    
    // Name vor dem @ holen
    let namePart = email.split('@')[0];
    // Punkte durch Leerzeichen ersetzen für getInitials Funktion (jonathan.doe -> jonathan doe)
    // Damit getInitials "JD" daraus macht und nicht nur "JO"
    namePart = namePart.replace('.', ' '); 
    
    const initials = getInitials(namePart);

    div.innerText = initials;
    div.style.backgroundColor = color;
    div.style.color = "#fff";
    div.style.fontWeight = "bold";
    div.style.fontSize = "14px";
    
    // Zentrierung sicherstellen
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
}

// Kleiner Helper um zu prüfen, ob es grob wie eine URL aussieht (http...)
function isValidUrl(string) {
    try {
        return Boolean(new URL(string));
    } catch(e){
        return false;
    }
}

function getInitials(name) {
    if (!name) return "??";
    const parts = name.split('.');
    if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// --- MULTI SELECT LOGIC ---
function toggleMailSelection(id, checkbox) {
    if (checkbox.checked) {
        selectedMails.add(id);
    } else {
        selectedMails.delete(id);
    }
    updateBulkButton();
}

function updateBulkButton() {
    const btn = document.getElementById('btn-bulk-delete');
    if (!btn) return;
    
    if (selectedMails.size > 0) {
        btn.classList.remove('hidden');
        // Update Text to show count? "Delete (3)"
        const span = document.getElementById('lbl-bulk-delete');
        if(span) span.innerText = `Delete (${selectedMails.size})`;
    } else {
        btn.classList.add('hidden');
    }
}

// Global function for the HTML button
window.deleteSelectedMails = function() {
    if (selectedMails.size === 0) return;
    
    playSound('click.mp3');
    
    // Convert Set to Array
    const idsToDelete = Array.from(selectedMails);
    
    // 1. OPTIMISTIC UPDATE (Entferne sie sofort aus der Ansicht)
    if (mockData[currentFolder]) {
        mockData[currentFolder] = mockData[currentFolder].filter(mail => !selectedMails.has(mail.id));
    }
    
    // Reset Selection
    selectedMails.clear();
    updateBulkButton();
    
    // Re-render immediately
    showList();

    // 2. SERVER REQUEST
    fetch(`https://${GetParentResourceName()}/deleteMail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        // Send IDs array
        body: JSON.stringify({ ids: idsToDelete, folder: currentFolder }) 
    }).then(() => {
        // Optional: Background refresh after delay
        // We do NOT refresh immediately to avoid the "ghost mail" bug
        setTimeout(() => {
             fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
        }, 1000);
    });
};

// --- ACCOUNT LOGIC ---
function renderAccountSwitcher() {
    const listContainer = document.getElementById('account-list-popup');
    listContainer.innerHTML = '';
    
    // 1. "Add Account" Button GANZ OBEN einfügen
    const addBtn = document.createElement('div');
    addBtn.className = 'account-add-btn';
    addBtn.innerHTML = `<i class="fa-solid fa-plus"></i> ${Locales.lbl_add_account || 'Add Account'}`;
    addBtn.onclick = () => openCreateAccountModal();
    listContainer.appendChild(addBtn);

    // 2. Die Accounts darunter stapeln
    myAccounts.forEach(acc => {
        // Den aktuell aktiven Account nicht in der Liste anzeigen (optional)
        if (acc.email === currentUserEmail) return;

        // Ungelesen Zähler
        const unreadCount = allMyMails.filter(m => m.recipient === acc.email && (m.isRead === 0 || m.isRead === false) && !m.isTrash).length;
        
        const div = document.createElement('div');
        div.className = 'account-option';
        div.onclick = () => switchAccount(acc.email, acc.label);
        
        div.innerHTML = `
            <div class="acc-details">
                <span class="acc-name">${acc.label} ${acc.is_verified ? '<i class="fa-solid fa-circle-check" style="color:var(--accent-color); margin-left:4px;"></i>' : ''}</span>
                <span class="acc-mail">${acc.email}</span>
            </div>
            
            <div class="acc-actions">
                ${unreadCount > 0 ? `<div class="acc-badge">${unreadCount}</div>` : ''}
                
                <div class="acc-delete-btn" onclick="event.stopPropagation(); requestDelete('${acc.email}')">
                    <i class="fa-solid fa-trash"></i>
                </div>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

function switchAccount(email, label) {
    // 1. Neue Identität setzen
    currentUserEmail = email;
    currentUserLabel = label;
    
    // 2. UI Header aktualisieren (Text)
    document.getElementById('my-email-display').innerText = email;
    document.getElementById('lbl-account-label').innerText = label;
    
    // --- HIER WAR DAS FEHLENDE STÜCK ---
    // 3. Avatar aktualisieren!
    updateSidebarAvatar(email); 
    // ------------------------------------

    document.getElementById('account-list-popup').classList.add('hidden');
    
    // 4. Mails neu filtern
    if (allMyMails.length > 0) {
        processMails(allMyMails);
    } else {
        mockData.inbox = [];
        mockData.sent = [];
        mockData.trash = [];
    }
    
    // 5. Ordner neu laden
    loadFolder('inbox');
    
    // 6. Switcher neu rendern
    renderAccountSwitcher();
}

function toggleAccountList() {
    const list = document.getElementById('account-list-popup');
    list.classList.toggle('hidden');
    if(!list.classList.contains('hidden')) renderAccountSwitcher();
}

function openCreateAccountModal() { document.getElementById('modal-create-account').classList.remove('hidden'); }
function closeCreateAccountModal() { document.getElementById('modal-create-account').classList.add('hidden'); }
function submitNewAccount() {
    const label = document.getElementById('new-acc-label').value;
    let prefix = document.getElementById('new-acc-prefix').value;
    
    // Validierung: Felder dürfen nicht leer sein
    if(!prefix || !label) return;

    // SÄUBERUNG: Falls der Nutzer aus Gewohnheit doch ein "@" tippt, schneiden wir alles danach ab.
    // Beispiel: Nutzer tippt "hans@test.de" -> wir machen daraus "hans"
    if (prefix.includes('@')) {
        prefix = prefix.split('@')[0];
    }
    
    // ZUSAMMENBAU: Hier nutzen wir die Variable aus der Config!
    // Ergebnis: "hans" + "@" + "deine-config-domain.ls"
    const fullEmail = prefix + "@" + serverDomain; 

    // An Server senden
    fetch(`https://${GetParentResourceName()}/createAccount`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: fullEmail, label: label })
    });
    
    closeCreateAccountModal();
    
    // Felder leeren
    document.getElementById('new-acc-label').value = '';
    document.getElementById('new-acc-prefix').value = '';
}

// --- RESTORE MAIL FUNCTION ---
window.restoreCurrentMail = function() {
    if(!currentMailId) return;
    playSound('click.mp3');

    // 1. Optimistic Update (Aus Trash entfernen)
    if (mockData.trash) {
        mockData.trash = mockData.trash.filter(mail => mail.id !== currentMailId);
    }
    // Optional: Zur Inbox hinzufügen (lokal), damit es sofort da ist
    // Wir lassen es aber lieber beim nächsten Refresh sauber laden.

    // 2. Zurück zur Liste
    showList();

    // 3. Server Request
    fetch(`https://${GetParentResourceName()}/restoreMail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ id: currentMailId }) 
    }).then(() => {
        setTimeout(() => {
             fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
        }, 500);
    });
};

// --- THEME ENGINE ---
function setTheme(themeName) {
    // 1. Body Klasse setzen
    document.body.className = ''; // Reset
    if (themeName !== 'dark') {
        document.body.classList.add('theme-' + themeName);
    }
    
    // 2. Buttons aktualisieren (Active State)
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    
    // Kleiner Trick um den richtigen Button aktiv zu machen (basierend auf Index oder Logik)
    // Wir suchen einfach nach dem onclick handler im HTML, das ist am einfachsten
    const btns = document.querySelectorAll('.theme-btn');
    if(themeName === 'dark') btns[0].classList.add('active');
    if(themeName === 'white') btns[1].classList.add('active');
    if(themeName === 'purple') btns[2].classList.add('active');
    if(themeName === 'midnight') btns[3].classList.add('active');

    // 3. Speichern
    localStorage.setItem('nui_mail_theme', themeName);
    
    // 4. Sound Feedback
    playSound('click.mp3');
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('nui_mail_theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }
}

// --- DELETE ACCOUNT LOGIC ---

function requestDelete(email) {
    accountToDelete = email;
    
    // Texte setzen
    document.getElementById('lbl-delete-target').innerText = email;
    
    // Modal öffnen
    document.getElementById('modal-delete-account').classList.remove('hidden');
    document.getElementById('account-list-popup').classList.add('hidden'); // Switcher schließen
}

function closeDeleteModal() {
    document.getElementById('modal-delete-account').classList.add('hidden');
    accountToDelete = null;
}

function confirmDelete() {
    if (!accountToDelete) return;
    
    playSound('click.mp3');
    
    // 1. Server informieren
    fetch(`https://${GetParentResourceName()}/deleteAccount`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: accountToDelete })
    });
    
    // 2. UI FIX: Wenn wir den Account löschen, den wir gerade ansehen -> Reset!
    // Oder sicherheitshalber immer resetten, damit der Listener den Hauptaccount neu lädt.
    if (currentUserEmail === accountToDelete) {
        currentUserEmail = null; // Setzt Variable zurück
        document.getElementById('my-email-display').innerText = "Loading..."; // Visuelles Feedback
        
        // Listen leeren, damit keine alten Mails angezeigt werden
        mockData.inbox = [];
        mockData.sent = [];
        mockData.trash = [];
        renderMailList([]);
    }
    
    closeDeleteModal();
}

// --- AUTOCOMPLETE LOGIC ---
const ghostInput = document.getElementById('inp-recipient-ghost');
if (ghostInput) {
    // Create Suggestion Box dynamically
    const suggestionBox = document.createElement('div');
    suggestionBox.className = 'suggestion-box hidden';
    document.body.appendChild(suggestionBox); 
    // Note: In CSS we must position this absolutely relative to the input

    ghostInput.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        if (val.length < 1) {
            suggestionBox.classList.add('hidden');
            return;
        }

        const matches = recipientHistory.filter(email => email.toLowerCase().includes(val) && !recipientList.includes(email));
        
        if (matches.length > 0) {
            // Position Logic
            const rect = this.getBoundingClientRect();
            suggestionBox.style.top = (rect.bottom + 5) + 'px';
            suggestionBox.style.left = rect.left + 'px';
            suggestionBox.style.width = rect.width + 'px';
            
            suggestionBox.innerHTML = '';
            matches.slice(0, 5).forEach(match => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerText = match;

                div.onmousedown = (e) => {
                    e.preventDefault(); 
                    addRecipient(match);
                    this.value = '';
                    suggestionBox.classList.add('hidden');
                };
                suggestionBox.appendChild(div);
            });
            suggestionBox.classList.remove('hidden');
        } else {
            suggestionBox.classList.add('hidden');
        }
    });

    // Hide on blur (delayed so click registers)
    ghostInput.addEventListener('blur', () => {
        setTimeout(() => suggestionBox.classList.add('hidden'), 200);
    });
}

function closeMainUI() {
    playSound('click.mp3');
    const container = document.querySelector('.container');
    container.classList.remove('opening');
    container.classList.add('closing');

    setTimeout(() => {
        fetch(`https://${GetParentResourceName()}/closeUI`, { method: 'POST', body: JSON.stringify({}) })
        .then(() => { 
            document.body.style.display = 'none'; 
            container.classList.remove('closing');
        }).catch(() => {});
    }, 300);
}

/* ------------------------------------------------------------------------- */
/* 1. TYPING SOUNDS                                                          */
/* ------------------------------------------------------------------------- */

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const ignoreKeys = [
            'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 
            'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
        ];

        if (!ignoreKeys.includes(e.key)) {
            const i = Math.floor(Math.random() * 6) + 1;
            // Notice: No extension needed, function adds .mp3
            playUiSound(`typing0${i}`, 0.5); 
        }
    }
});

/* ------------------------------------------------------------------------- */
/* 2. SLIDER SOUNDS                                                          */
/* ------------------------------------------------------------------------- */

const opacitySliderInput = document.getElementById('inp-opacity');

if (opacitySliderInput) {
    opacitySliderInput.addEventListener('input', () => {
        playUiSound('slider', 0.025); 
    });
}

/* ------------------------------------------------------------------------- */
/* 3. HOVER SOUNDS                                                           */
/* ------------------------------------------------------------------------- */

let lastHoveredElement = null;

document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('.mail-item, .menu li, button, .theme-btn, .account-option, .my-account, .main-close-btn');

    if (target && target !== lastHoveredElement) {
        lastHoveredElement = target;
        playUiSound('hover', 0.05);
    }
    
    if (!target) {
        lastHoveredElement = null;
    }
});