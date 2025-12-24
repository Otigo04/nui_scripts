const app = document.getElementById('app');
const navContainer = document.getElementById('nav-container');
const tabsContainer = document.getElementById('tabs-container');
const contentDisplay = document.getElementById('content-display');

let currentData = []; // Store the config data here

// 1. Listener for Lua Messages
window.addEventListener('message', function(event) {
    let item = event.data;

    if (item.type === "ui") {
        if (item.status == true) {
            // Apply Colors from Config
            setupColors(item.colors);
            
            // Render the sidebar
            currentData = item.categories;
            renderSidebar(currentData);
            
            // Show the UI
            app.classList.add('show');
        } else {
            app.classList.remove('show');
        }
    }
});

// 2. Setup Dynamic Colors
function setupColors(colors) {
    if(!colors) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--bg-glass', colors.background);
}

function renderSidebar(categories) {
    navContainer.innerHTML = ''; 
    contentDisplay.innerHTML = `<div class="placeholder"><i class="fa-solid fa-server"></i><h2>Willkommen</h2></div>`;

    // Safety Check: Falls categories undefined ist
    if (!categories || !Array.isArray(categories)) {
        console.error("Config.Categories ist kein Array!");
        return;
    }

    categories.forEach((cat, index) => {
        // 1. Create Wrapper
        let wrapper = document.createElement('div');
        wrapper.classList.add('category-wrapper');

        // 2. Create Header
        let header = document.createElement('div');
        header.classList.add('nav-item');
        // Fallback Icon falls keins angegeben ist
        let iconClass = cat.icon ? cat.icon : 'fa-solid fa-circle';
        header.innerHTML = `<i class="${iconClass}"></i> ${cat.label}`;

        // 3. Create Submenu Container
        let submenu = document.createElement('div');
        submenu.classList.add('submenu');

        // --- DER FIX IST HIER ---
        // Wir prüfen explizit auf Array.isArray()
        if(cat.subcategories && Array.isArray(cat.subcategories)) {
            cat.subcategories.forEach((sub, subIndex) => {
                let subItem = document.createElement('div');
                subItem.classList.add('sub-item');
                subItem.innerText = sub.title;
                
                subItem.onclick = (e) => {
                    e.stopPropagation(); 
                    document.querySelectorAll('.sub-item').forEach(el => el.classList.remove('active-sub'));
                    subItem.classList.add('active-sub');
                    renderContent(sub.content);
                };

                submenu.appendChild(subItem);
            });
        }
        // ------------------------

        // 4. Click Logic
        header.onclick = () => {
            const isOpen = header.classList.contains('active');

            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.submenu').forEach(el => el.classList.remove('open'));

            if (!isOpen) {
                header.classList.add('active');
                submenu.classList.add('open');
                
                if(submenu.firstChild) {
                    submenu.firstChild.click();
                } else {
                    // Fallback, falls keine Subkategorien da sind
                    renderContent("<h1>" + cat.label + "</h1><p>Keine Unterkategorien gefunden.</p>");
                }
            }
        };

        wrapper.appendChild(header);
        wrapper.appendChild(submenu);
        navContainer.appendChild(wrapper);
    });
}

// 5. Render Final Content
function renderContent(htmlContent) {
    // Add a small fade animation
    contentDisplay.style.opacity = '0';
    setTimeout(() => {
        contentDisplay.innerHTML = htmlContent;
        contentDisplay.style.opacity = '1';
    }, 150);
}

// 6. Close Key (ESC)
document.onkeyup = function (data) {
    if (data.key == "Escape") {
        fetch(`https://${GetParentResourceName()}/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({})
        });
    }
};