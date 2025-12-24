// Data Store & State
const mockData = { inbox: [], trash: [], sent: [] };
let currentFolder = 'inbox';
let currentMailId = null; 
let currentMailObject = null;
let currentUserEmail = null;
let currentUserCitizenId = null;
let isLoggedIn = false;
let Locales = {};
let selectedMails = new Set(); 
let myAccounts = []; 
let allMyMails = []; 
let currentUserLabel = "Personal";
let serverDomain = "";
let ClientConfig = null; 
let accountToDelete = null;
let recipientHistory = [];

// --- NEU: Spam Protection & Single Recipient ---
let recipientList = [];
let isSending = false; // Verhindert Doppelklicks

// References
const viewList = document.getElementById('view-list');
const viewRead = document.getElementById('view-read');
const viewCompose = document.getElementById('view-compose');
const mailListContainer = document.querySelector('.mail-list');
const searchInput = document.querySelector('.search-bar input');

// --- AUDIO SYSTEM (DISABLED FOR LITE) ---
function playSound(soundName) {
    // SFX Disabled
}

function playUiSound(filename, volume = 0.5) {
    // SFX Disabled
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

    // 2. Avatar Logik
    const avatarInput = document.getElementById('inp-avatar-url'); 
    
    const savedAvatar = localStorage.getItem('nui_mail_avatar_url');
    if (savedAvatar) {
        if(avatarInput) avatarInput.value = savedAvatar;
        updateSidebarAvatar(savedAvatar);
    }
    
    if(avatarInput) {
        avatarInput.addEventListener('input', (e) => {
            localStorage.setItem('nui_mail_avatar_url', e.target.value);
            updateSidebarAvatar(e.target.value);
        });
    }

    // --- Ghost Input Listener (Für CC Chips) ---
    const ghostInput = document.getElementById('inp-recipient-ghost');
    if (ghostInput) {
        ghostInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                e.preventDefault(); 
                addRecipient(this.value);
            }
            if (e.key === 'Backspace' && this.value === '' && recipientList.length > 0) {
                removeChip(recipientList.length - 1);
            }
        });

        ghostInput.addEventListener('blur', function() {
            if (this.value) addRecipient(this.value);
        });
    }
};

// --- CHIP INPUT LOGIC (LITE: MAX 1 RECIPIENT) ---
function renderChips() {
    const container = document.getElementById('recipient-container');
    const ghostInput = document.getElementById('inp-recipient-ghost');
    
    if (!container || !ghostInput) return;

    const oldChips = container.querySelectorAll('.email-chip');
    oldChips.forEach(chip => chip.remove());

    recipientList.forEach((email, index) => {
        const chip = document.createElement('div');
        chip.className = 'email-chip';
        chip.innerHTML = `
            <span>${email}</span>
            <span class="chip-close" onclick="removeChip(${index})"><i class="fa-solid fa-times"></i></span>
        `;
        container.insertBefore(chip, ghostInput);
    });

    // Wenn 1 Empfänger drin ist, Input verstecken (Kein CC)
    if (recipientList.length >= 1) {
        ghostInput.style.display = 'none';
    } else {
        ghostInput.style.display = 'block';
        ghostInput.value = '';
        ghostInput.focus();
    }
}

function addRecipient(val) {
    const cleanVal = val.trim().replace(/\s/g, "");
    
    // Sofort abbrechen, wenn schon einer drin ist
    if (recipientList.length >= 1) {
        document.getElementById('inp-recipient-ghost').value = '';
        return;
    }
    
    if (cleanVal && !recipientList.includes(cleanVal)) {
        recipientList.push(cleanVal);
        renderChips();
    } else {
        const ghost = document.getElementById('inp-recipient-ghost');
        if(ghost) ghost.value = '';
    }
}

window.removeChip = function(index) {
    recipientList.splice(index, 1);
    renderChips();
    playSound('click.mp3');
};


// --- TRANSLATION (LITE VERSION) ---
function updateInterfaceText() {
    if(!Locales) return;

    const lblInbox = document.getElementById('lbl-inbox');
    if(lblInbox) lblInbox.innerText = Locales.menu_inbox;
    
    const lblSent = document.getElementById('lbl-sent');
    if(lblSent) lblSent.innerText = Locales.menu_sent;
    
    const lblRefresh = document.getElementById('lbl-refresh');
    if(lblRefresh) lblRefresh.innerText = Locales.menu_refresh;
    
    const lblCompose = document.getElementById('lbl-compose');
    if(lblCompose) lblCompose.innerText = Locales.btn_compose;
    
    const lblTrans = document.getElementById('lbl-transparency');
    if(lblTrans) lblTrans.innerText = Locales.lbl_transparency;
    
    const lblTheme = document.querySelector('.settings-label'); 
    if(lblTheme) lblTheme.innerText = Locales.lbl_settings_header;

    if(searchInput) searchInput.placeholder = Locales.placeholder_search;

    document.getElementById('lbl-new-msg').innerText = Locales.header_new_msg;
    document.getElementById('lbl-cancel').innerText = Locales.btn_cancel;
    document.getElementById('lbl-send').innerText = Locales.btn_send;
    
    const ghostInput = document.getElementById('inp-recipient-ghost');
    if(ghostInput) ghostInput.placeholder = Locales.placeholder_recipient;
    
    document.getElementById('inp-subject').placeholder = Locales.placeholder_subject;
    document.getElementById('inp-message').placeholder = Locales.placeholder_message;

    document.getElementById('lbl-back').innerText = Locales.btn_back;
    
    const btnTrash = document.getElementById('btn-trash');
    if(btnTrash) btnTrash.title = Locales.tooltip_delete || "Delete";
    
    const btnReply = document.getElementById('btn-reply');
    if(btnReply) btnReply.title = Locales.tooltip_reply;
    
    updateHeaderTitle();
}

function updateHeaderTitle() {
    if(!Locales) return;
    let title = "Inbox";
    if(currentFolder === 'inbox') title = Locales.header_inbox;
    if(currentFolder === 'sent') title = Locales.header_sent;
    
    const titleEl = document.querySelector('#view-list h2');
    if(titleEl) titleEl.innerText = title;
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

    // --- READ STATUS ---
    if (!mailData.isRead) {
        mailData.isRead = 1; 
        fetch(`https://${GetParentResourceName()}/markAsRead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: mailData.id })
        });
    }

    // --- TEXT PROCESSING (LITE: NO IMAGES) ---
    let body = mailData.body
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");

    const urlRegex = /(https?:\/\/[^\s<"']+)/gi;
    body = body.replace(urlRegex, (url) => {
        return `<a href="#" style="color: #00d4ff; text-decoration: underline;" onclick="window.invokeNative('openUrl', '${url}')">LINK</a>`;
    });

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

function renderMailList(mails) {
    mailListContainer.innerHTML = ''; 

    if (!mails || mails.length === 0) {
        mailListContainer.innerHTML = `<div style="padding:20px; color:#aaa; text-align:center;">${Locales.no_messages || 'No messages'}</div>`;
        return;
    }

    mails.forEach((mail, index) => {
        const mailDiv = document.createElement('div');
        mailDiv.className = 'mail-item';
        mailDiv.style.animationDelay = `${index * 0.05}s`;

        const isUnread = (currentFolder === 'inbox' && (mail.isRead === 0 || mail.isRead === false));

        let displayName = mail.sender;
        if (currentFolder === 'sent') {
            displayName = "To: " + (mail.recipient || "Unknown");
        }

        const senderLower = mail.sender.toLowerCase();
        const isOfficial = /police|lspd|polizei|medic|lsmd|ems|gov|state|mayor|justice|weazel/i.test(senderLower);
        const avatarColor = getAvatarColor(displayName.replace("To: ", ""));

        if (isOfficial) {
            mailDiv.style.border = `1px solid ${avatarColor}`;
            mailDiv.style.background = `linear-gradient(90deg, ${avatarColor}1A 0%, transparent 100%)`;
        } 
        
        if (isUnread) {
            mailDiv.classList.add('unread');
            if(isOfficial) mailDiv.style.borderLeft = `3px solid ${avatarColor}`;
        }

        mailDiv.onclick = (e) => { 
            openMail(mail); 
        };

        const nameForAvatar = displayName.replace("To: ", "");
        const avatarText = nameForAvatar ? nameForAvatar.substring(0, 2).toUpperCase() : "??";
        let avatarHTML = avatarText; 
        let avatarStyle = `background: ${avatarColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.3); box-shadow: 0 2px 5px rgba(0,0,0,0.2);`;

        mailDiv.innerHTML = `
            <div class="avatar" style="${avatarStyle}">${avatarHTML}</div>
            <div class="mail-info">
                <div class="sender">
                    <span style="display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding-right: 5px;">
                        ${displayName} 
                        
                        ${isOfficial ? '<i class="fa-solid fa-circle-check" style="opacity:0.8; font-size:12px; flex-shrink: 0;" title="Verified"></i>' : ''}
                        
                        ${(isOfficial && isUnread) ? '<i class="fa-solid fa-circle-exclamation" style="color: #ef4444; font-size: 12px; flex-shrink: 0;" title="Action Required"></i>' : ''}

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

// --- BUTTONS ---
document.querySelector('.compose-btn').addEventListener('click', () => { 
    playSound('click.mp3'); 
    switchView('compose'); 
});

// --- SEND BUTTON (MIT SPAM SCHUTZ) ---
const sendBtn = document.querySelector('.send-btn');
if (sendBtn) {
    sendBtn.onclick = function() {
        if (isSending) return;

        const subject = document.getElementById('inp-subject').value;
        const message = document.getElementById('inp-message').value;

        const ghostInput = document.getElementById('inp-recipient-ghost');
        if (ghostInput && ghostInput.value) {
            addRecipient(ghostInput.value);
        }

        if (recipientList.length === 0) {
            return;
        }
        if (!message) return;
        
        isSending = true; 
        playSound('click.mp3');
        
        const originalBtnText = document.getElementById('lbl-send').innerText;
        document.getElementById('lbl-send').innerText = "...";
        this.style.opacity = "0.5";
        this.style.cursor = "not-allowed";

        fetch(`https://${GetParentResourceName()}/sendMail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ 
                recipients: recipientList, 
                subject, 
                message,
                from: currentUserEmail 
            }) 
        }).then(resp => resp.json()).then(resp => {
            isSending = false;
            document.getElementById('lbl-send').innerText = originalBtnText;
            this.style.opacity = "1";
            this.style.cursor = "pointer";

            if (resp === 'ok') {
                playSound('woosh_mailsent.mp3');
                
                recipientList = [];
                renderChips();
                
                document.getElementById('inp-subject').value = '';
                document.getElementById('inp-message').value = '';
                
                showList();
                
                setTimeout(() => {
                    fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
                }, 500);
            }
        }).catch(() => {
            isSending = false;
            document.getElementById('lbl-send').innerText = originalBtnText;
            this.style.opacity = "1";
            this.style.cursor = "pointer";
        });
    };
}

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

// TRASH BUTTON (LITE: INSTANT PERMANENT DELETE)
const trashBtn = document.getElementById('btn-trash');
if (trashBtn) {
    trashBtn.addEventListener('click', function() {
        if(!currentMailId) return;
        
        if (mockData[currentFolder]) {
            mockData[currentFolder] = mockData[currentFolder].filter(mail => mail.id !== currentMailId);
        }

        showList();
        
        fetch(`https://${GetParentResourceName()}/deleteMail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ id: currentMailId, folder: 'trash' }) 
        }).then(() => {
            setTimeout(() => {
                 fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
            }, 1000); 
        });
    });
}

// --- REPLY BUTTON ---
const replyBtn = document.getElementById('btn-reply');
if (replyBtn) {
    replyBtn.addEventListener('click', function() {
        if (!currentMailObject) return;
        playSound('click.mp3');
        switchView('compose');
        
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
    
    if (!currentUserEmail) return;

    const myEmailLower = currentUserEmail.toLowerCase().trim();

    mails.forEach(mail => {
        let timeString = "Unknown";
        if(mail.timestamp) timeString = formatRelativeTime(mail.timestamp);

        let mailObj = createMailObject(mail, timeString);

        if (mail.mail_type === 'sent') {
            mockData.sent.push(mailObj);
        }
        else if (mail.mail_type === 'inbox') {
            mockData.inbox.push(mailObj);
        }
        else {
            if (mail.sender && mail.sender.toLowerCase() === myEmailLower && mail.recipient !== myEmailLower) {
                 mockData.sent.push(mailObj);
            }
            else {
                mockData.inbox.push(mailObj);
            }
        }
    });
}

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
        owner: mail.owner 
    };
}

// --- LISTENER (FIXED & CLEANED UP) ---
window.addEventListener('message', function(event) {
    let data = event.data;

    if (data.uiScale) {
        document.body.style.zoom = data.uiScale; 
        document.documentElement.style.setProperty('--ui-scale', data.uiScale);
    }

    if (data.locales) {
        Locales = data.locales;
        updateInterfaceText();
    }

    if (data.domain) {
        serverDomain = data.domain;
        document.querySelectorAll('.domain-badge').forEach(el => {
            el.innerText = '@' + serverDomain;
        });
    }

    if (data.action === 'force_reload') {
        fetch(`https://${GetParentResourceName()}/refreshData`, { method: 'POST', body: JSON.stringify({}) });
        return; 
    }

    if (data.config) {
        ClientConfig = data.config;
    }

    if (data.action === 'update_mails' || data.action === 'open') {

        if (data.myEmail) {
            currentUserEmail = data.myEmail;
            
            const emailDisplay = document.getElementById('my-email-display');
            if (emailDisplay) emailDisplay.innerText = currentUserEmail;
            
            const labelDisplay = document.getElementById('lbl-account-label');
            if (labelDisplay) labelDisplay.innerText = "Personal";
            
            updateSidebarAvatar(currentUserEmail);
        }

        if (data.mails) {
            processMails(data.mails);
        }

        if (data.action === 'open') {
            if (data.myCitizenId) currentUserCitizenId = data.myCitizenId;

            document.body.style.display = 'flex';
            const container = document.querySelector('.container');
            container.classList.remove('closing');
            void container.offsetWidth; 

            if (!isLoggedIn) {
                document.querySelector('.container').style.display = 'none';
                document.getElementById('login-screen').classList.remove('hidden');
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
    }
    
    if (data.action === 'close') {
        closeMainUI();
    }
});

document.onkeyup = function(data) {
    if (data.key == "Escape") {
        closeMainUI();
    }
};

const opacitySlider = document.getElementById('inp-opacity');
if (opacitySlider) {
    opacitySlider.addEventListener('input', function(e) {
        const value = e.target.value;
        document.documentElement.style.setProperty('--glass-opacity', value);
        localStorage.setItem('nui_mail_opacity', value);
    });
}

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

function updateSidebarAvatar(email) {
    const div = document.getElementById('sidebar-avatar');
    if (!div) return;

    div.innerHTML = '';
    div.style.backgroundImage = 'none';
    
    const savedAvatar = localStorage.getItem('nui_mail_avatar_url');
    const hasPotentialUrl = savedAvatar && savedAvatar.startsWith('http');

    if (hasPotentialUrl) {
        const img = document.createElement('img');
        img.src = savedAvatar;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        img.referrerPolicy = 'no-referrer'; 
        
        img.onerror = function() {
            this.remove(); 
            renderInitials(div, email); 
        };
        
        div.appendChild(img);
        div.style.background = 'transparent'; 
    } else {
        renderInitials(div, email);
    }
}

function renderInitials(div, email) {
    if (!email) return;

    const color = getAvatarColor(email);
    let namePart = email.split('@')[0];
    namePart = namePart.replace('.', ' '); 
    const initials = getInitials(namePart);

    div.innerText = initials;
    div.style.backgroundColor = color;
    div.style.color = "#fff";
    div.style.fontWeight = "bold";
    div.style.fontSize = "14px";
    
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
}

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

// --- THEME ENGINE ---
function setTheme(themeName) {
    document.body.className = ''; 
    if (themeName !== 'dark') {
        document.body.classList.add('theme-' + themeName);
    }
    
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    
    const btns = document.querySelectorAll('.theme-btn');
    if(themeName === 'dark' && btns[0]) btns[0].classList.add('active');
    if(themeName === 'white' && btns[1]) btns[1].classList.add('active');

    localStorage.setItem('nui_mail_theme', themeName);
    playSound('click.mp3');
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('nui_mail_theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }
}

// --- AUTOCOMPLETE LOGIC ---
const ghostInput = document.getElementById('inp-recipient-ghost');
if (ghostInput) {
    const suggestionBox = document.createElement('div');
    suggestionBox.className = 'suggestion-box hidden';
    document.body.appendChild(suggestionBox); 

    ghostInput.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        if (val.length < 1) {
            suggestionBox.classList.add('hidden');
            return;
        }

        const matches = recipientHistory.filter(email => email.toLowerCase().includes(val) && !recipientList.includes(email));
        
        if (matches.length > 0) {
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

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // SFX Disabled
    }
});

const opacitySliderInput = document.getElementById('inp-opacity');
if (opacitySliderInput) {
    opacitySliderInput.addEventListener('input', () => {
        playUiSound('slider', 0.025); 
    });
}

let lastHoveredElement = null;
document.addEventListener('mouseover', (e) => {
    // SFX Disabled
});