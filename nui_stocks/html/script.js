// --- GLOBAL VARIABLES ---
let currentStock = null;
let allStocks = [];
let tradeMode = 'buy';
let mainChart = null;
let portfolioChart = null;
let chartTimeframe = 'LIVE';

// --- SCALING LOGIC ---
function adjustResolution() {
    const app = document.querySelector('.app-container');
    if (!app) return;

    // Wir designen für 1080p Standard
    const baseWidth = 1920; 
    const baseHeight = 1080;
    
    const widthRatio = window.innerWidth / baseWidth;
    const heightRatio = window.innerHeight / baseHeight;
    
    // Wir nehmen den kleineren Ratio, damit nichts abgeschnitten wird
    const scale = Math.min(widthRatio, heightRatio);

    // Zoom setzen (Funktioniert besser als Transform für Layouts)
    document.body.style.zoom = scale; 
}

window.addEventListener('resize', adjustResolution);

// --- INITIAL SETUP (ONCE) ---
// Wir setzen die Listener SOFORT, wenn das Skript geladen wird.
document.addEventListener("DOMContentLoaded", function() {
    console.log("NUI TRADER: DOM Loaded");

    const allViews = ['view-market', 'view-portfolio', 'view-my-company', 'view-wallet', 'view-shareholders'];
    allViews.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    
    // 1. Sidebar Navigation
    const navItems = document.querySelectorAll('.nav li');
    navItems.forEach((item, index) => {
        item.onclick = function() {
            // ... UI Active Toggle ...
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            if (index === 0) switchView('market');
            if (index === 1) switchView('portfolio');
            if (index === 2) switchView('company');       // 3. Reiter
            if (index === 3) switchView('wallet');        // 4. Reiter
            if (index === 4) switchView('shareholders'); // War vorher News
        };
    });

    // 2. Trading Button
    const btn = document.getElementById('btn-execute');
    if(btn) {
        btn.onclick = function() { executeTrade(); };
    }
    // IPO Button
    const btnIpo = document.getElementById('btn-start-ipo');
    if(btnIpo) {
        btnIpo.onclick = function() {
            const name = document.getElementById('ipo-name').value;
            const price = document.getElementById('ipo-price').value;
            const category = document.getElementById('ipo-category').value;
            
            if(!name) return showNotification('error', 'Enter a name');
            
            fetch(`https://${GetParentResourceName()}/launchIPO`, {
                method: 'POST',
                body: JSON.stringify({ name, price, category })
            });
        };
    }
});

// --- LUA MESSAGE LISTENER ---
window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === 'open') {
        document.body.style.display = 'flex';
        
        // 1. Process Data
        if (data.companies) {
            processStockData(data.companies);
        }

        // 2. Update Cash
        if (data.player) {
            // Broker Balance (Dein Depot-Guthaben) holen
            const brokerBal = parseFloat(data.player.brokerBalance) || 0;
            
            // 1. Sidebar Update (Unten Links)
            // Wir suchen nach der ID 'sidebar-broker-balance' (die wir im HTML geändert haben)
            const sidebarBal = document.getElementById('sidebar-broker-balance');
            if(sidebarBal) {
                sidebarBal.innerText = brokerBal.toLocaleString('en-US', {minimumFractionDigits: 2});
            } else {
                // Fallback: Falls du die ID im HTML noch 'user-cash' nennst, überschreiben wir es trotzdem mit Broker Balance
                const oldSidebar = document.getElementById('user-cash');
                if(oldSidebar) oldSidebar.innerText = brokerBal.toLocaleString('en-US', {minimumFractionDigits: 2});
            }

            // 2. Wallet Page Update (Die große Anzeige in der Mitte)
            // ID aus dem neuen "Clean Wallet" Design
            const walletDisplay = document.getElementById('broker-balance-display');
            if(walletDisplay) {
                walletDisplay.innerText = brokerBal.toLocaleString('en-US', {minimumFractionDigits: 2});
            }

            // Fallback für Legacy ID (falls noch vorhanden)
            const walletLargeOld = document.getElementById('broker-balance-large');
            if(walletLargeOld) {
                walletLargeOld.innerText = brokerBal.toLocaleString('en-US', {minimumFractionDigits: 2});
            }
        }

        // 3. Initial View Logic (Nur beim ersten Mal oder Refresh)
        // Wir resetten NICHT die View, damit man da bleibt, wo man war (z.B. im Portfolio)
        // Außer es ist der erste Start.
        if (document.getElementById('view-market').classList.contains('hidden') && 
            document.getElementById('view-portfolio').classList.contains('hidden')) {
            switchView('market');
        } else {
            // Wenn wir schon wo sind, updaten wir nur die Daten im Hintergrund
            if (!document.getElementById('view-market').classList.contains('hidden')) {
                renderMarketList();
                if (currentStock) {
                    const updated = allStocks.find(s => s.id === currentStock.id);
                    if (updated) loadStock(updated);
                } else if (allStocks.length > 0) {
                    loadStock(allStocks[0]);
                }
            } else if (!document.getElementById('view-portfolio').classList.contains('hidden')) {
                renderPortfolio();
            }
        }
    } 
    
    else if (data.action === 'close') {
        document.body.style.display = 'none';
    }


    else if (data.action === 'update_prices') {
        handleLiveUpdate(data.companies);
    }
});


// ESC Taste zum Schließen
document.onkeyup = function(data) {
    if (data.key == "Escape") {
        fetch(`https://${GetParentResourceName()}/closeUI`, { method: 'POST', body: JSON.stringify({}) });
        document.body.style.display = 'none';
    }
};

function initApp() {
    console.log("NUI TRADER: App Initializing...");

    // 1. Trading Button Logic
    const btn = document.getElementById('btn-execute');
    if(btn) {
        btn.onclick = function() {
            executeTrade();
        };
    }

    // 2. Sidebar Navigation (Robuster)
    const navItems = document.querySelectorAll('.nav li');
    
    // Wir entfernen erst alle 'active' Klassen und setzen den ersten (Market) aktiv
    navItems.forEach(n => n.classList.remove('active'));
    if(navItems.length > 0) navItems[0].classList.add('active');

    navItems.forEach((item, index) => {
        // Direkte Zuweisung ohne vorheriges null-setzen (ist sauberer)
        item.onclick = function() {
            console.log("Nav clicked: Index " + index);
            
            // Visual Update
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            // Logic Switch
            if (index === 0) switchView('market');
            if (index === 1) switchView('portfolio');
            // index 2 = My Company
            // index 3 = News
        };
    });

    // 3. Start Views
    // Standardmäßig Market zeigen
    switchView('market'); 

    // 4. Data Check
    if (allStocks && allStocks.length > 0) {
        renderMarketList();
        if(!currentStock) loadStock(allStocks[0]);
    } else {
        console.log("Waiting for stock data...");
    }

}



function executeTrade() {
    const amount = parseInt(document.getElementById('trade-amount').value);
    
    if (!amount || amount <= 0) {
        // Simple error feedback (shake input?)
        return;
    }

    if (tradeMode === 'buy') {
        // Trigger Lua
        fetch(`https://${GetParentResourceName()}/buyStock`, {
            method: 'POST',
            body: JSON.stringify({
                id: currentStock.id, // DB ID
                symbol: currentStock.symbol,
                amount: amount,
                price: currentStock.price
            })
        });
    } else {
        // Sell Logic
        fetch(`https://${GetParentResourceName()}/sellStock`, {
            method: 'POST',
            body: JSON.stringify({
                id: currentStock.id,
                symbol: currentStock.symbol,
                amount: amount,
                price: currentStock.price
            })
        });
    }
}

function renderMarketList() {
    const list = document.getElementById('market-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!allStocks || allStocks.length === 0) {
        list.innerHTML = '<div style="padding:20px; color:#555; text-align:center;">No active companies found.</div>';
        return;
    }

    // Kategorien sammeln
    const categories = [...new Set(allStocks.map(s => s.category))];

    categories.forEach(catKey => {
        // Header (Optional, wenn du Category Header willst)
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `<i class="fas fa-layer-group"></i> ${catKey.toUpperCase()}`;
        list.appendChild(header);

        const stocksInCat = allStocks.filter(s => s.category === catKey);

        stocksInCat.forEach(stock => {
            const colorClass = stock.change >= 0 ? 'text-green' : 'text-red';
            const icon = stock.change >= 0 ? 'fa-caret-up' : 'fa-caret-down';
            
            const div = document.createElement('div');
            div.className = 'market-item';
            div.setAttribute('data-id', stock.id);

            if (currentStock && currentStock.id === stock.id) {
                div.classList.add('active-stock');
            }

            div.onclick = () => loadStock(stock);
            
            // NEUES LAYOUT: Wir zwingen "left-align" beim Namen und "center" bei Shares
            // NEUES LAYOUT: Mit Klassen für perfektes Alignment
            div.innerHTML = `
                <div class="col-name">
                    <strong style="color:white; font-size:15px; margin-bottom:2px;">${stock.symbol}</strong>
                    <span style="color:#787b86; font-size:11px; font-weight:500;">${stock.name}</span>
                </div>
                
                <div class="col-shares">
                    <div style="background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; font-family:'JetBrains Mono'; font-size:11px;">
                        <span style="color:#fff;">${stock.sharesAvailable}</span>
                        <span style="color:#555;"> / ${stock.totalShares}</span>
                    </div>
                </div>

                <div class="col-price mono">$${stock.price.toFixed(2)}</div>
                
                <div class="col-change">
                    <span class="${colorClass} mono" style="font-weight:600;">
                        ${stock.change}% <i class="fas ${icon}" style="font-size:10px; margin-left:3px;"></i>
                    </span>
                </div>
                
                <div class="col-trend">
                    <i class="fas fa-chart-line" style="color:#444; font-size:14px;"></i>
                </div>
            `;
            list.appendChild(div);
        });
    });
}

function loadStock(stock) {
    currentStock = stock;
    
    // 1. Header Update (Symbol, Name, Preis, %)
    document.getElementById('selected-stock-symbol').innerText = stock.symbol;
    document.getElementById('selected-stock-name').innerText = stock.name;
    document.getElementById('current-price').innerText = '$' + stock.price.toFixed(2);
    
    // --- UPDATE: Pill Design (Icon & Text getrennt) ---
    const changeEl = document.getElementById('price-change');
    const isUp = stock.change >= 0;
    
    // Nutze Trend-Pfeile statt einfacher Carets für besseren Look
    // Falls deine FontAwesome Version älter ist, nutze 'fa-arrow-up' / 'fa-arrow-down'
    const iconClass = isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';

    // Wir trennen Text und Icon in separate Tags, damit CSS 'gap' greift
    changeEl.innerHTML = `
        <span>${stock.change}%</span>
        <i class="fas ${iconClass}"></i>
    `;
    
    // Setzt die Klasse für Farbe und Style
    changeEl.className = `price-change ${isUp ? 'positive' : 'negative'}`;
    // --- END UPDATE ---

    // 2. Highlighting in der Liste
    document.querySelectorAll('.market-item').forEach(el => el.classList.remove('active-stock'));

    const activeItem = document.querySelector(`.market-item[data-id="${stock.id}"]`);
    if (activeItem) {
        activeItem.classList.add('active-stock');
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 3. Update Trade Input (Preis pro Aktie)
    const tradePriceInput = document.getElementById('trade-price');
    if (tradePriceInput) {
        tradePriceInput.value = '$' + stock.price.toFixed(2);
        calculateTotal(); // Aktualisiert die "Total" Summe
    }

    // 4. Portfolio Anzeige (Unten Rechts) aktualisieren
    // WICHTIG: Wir holen die aktuellsten Daten aus allStocks (wegen shares update)
    const freshData = allStocks.find(s => s.id === stock.id) || stock;
    updatePortfolioDisplay(freshData);

    // 5. Chart Rendern (WICHTIG: Im Timeout, damit Canvas sicher sichtbar ist)
    setTimeout(() => {
        renderChart(stock);
    }, 50);
}

function getChartColor(stock) {
    const isPositive = stock.change >= 0;
    return {
        border: isPositive ? '#00e396' : '#ff4560',
        backgroundStart: isPositive ? 'rgba(0, 227, 150, 0.5)' : 'rgba(255, 69, 96, 0.5)',
        backgroundEnd: isPositive ? 'rgba(0, 227, 150, 0.0)' : 'rgba(255, 69, 96, 0.0)'
    };
}


function renderChart(stock) {
    const canvas = document.getElementById('mainChart');
    if (!canvas || canvas.offsetParent === null) return;
    
    const ctx = canvas.getContext('2d');
    
    if (mainChart) {
        mainChart.destroy();
        mainChart = null;
    }

    const colors = getChartColor(stock);
    
    // 1. DATA PREPARATION
    let rawData = (stock.history && Array.isArray(stock.history)) ? stock.history : [];
    
    // Safety: If empty, push current price
    if (rawData.length === 0) {
        rawData.push({ price: stock.price, time: new Date() });
    }

    // Sync Check: Ensure last point matches current price
    const lastHistoryPoint = rawData[rawData.length - 1];
    if (lastHistoryPoint.price !== stock.price) {
        rawData.push({ price: stock.price, time: new Date() });
    }

    // 2. FILTER DATA BASED ON TIMEFRAME
    let displayData = [];
    const now = new Date();

    if (chartTimeframe === 'LIVE') {
        // Last 10 Updates
        displayData = rawData.slice(-10);
    
    } else if (chartTimeframe === '1D') {
        // Last 24 Hours
        // Filter: Point Time > (Now - 24 hours)
        const oneDayAgo = now.getTime() - (24 * 60 * 60 * 1000);
        displayData = rawData.filter(d => {
            const t = new Date(d.time).getTime();
            return t > oneDayAgo;
        });
        // Fallback: If 24h is empty (new stock), show at least last 10
        if (displayData.length < 2) displayData = rawData.slice(-10);

    } else {
        // MAX (Since Start)
        // Show everything we got from DB
        displayData = rawData;
    }

    // 3. Extract Labels and Prices
    const displayLabels = displayData.map(d => {
        const date = new Date(d.time || new Date());
        
        // Format label based on timeframe
        if (chartTimeframe === 'MAX') {
            // Show Date (DD/MM) for long history
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month}`;
        } else {
            // Show Time (HH:MM) for short history
            const hours = date.getHours().toString().padStart(2, '0');
            const mins = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${mins}`;
        }
    });

    const displayPrices = displayData.map(d => d.price);

    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight);
    gradient.addColorStop(0, colors.backgroundStart);
    gradient.addColorStop(1, colors.backgroundEnd);

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: displayLabels,
            datasets: [{
                label: 'Price',
                data: displayPrices,
                borderColor: colors.border,
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.2, 
                pointRadius: 0, 
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            interaction: {
                mode: 'index',
                intersect: false, // WICHTIG: Erlaubt Hover überall auf der Linie
            },
            plugins: { 
                legend: { display: false },
                // HIER IST DAS NEUE DESIGN FÜR DEN TOOLTIP:
                tooltip: {
                    enabled: true,
                    backgroundColor: '#1e222d', // Dunkler Hintergrund passend zum Theme
                    titleColor: '#787b86',
                    bodyColor: '#fff',
                    borderColor: '#2a2e39',
                    borderWidth: 1,
                    displayColors: false, // Keine Farbbox neben dem Text
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                // Formatiert die Zahl als Währung (z.B. $152.93)
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    display: true, 
                    grid: { display: false },
                    ticks: { 
                        color: '#555', 
                        font: {size: 10, family: 'JetBrains Mono'}, 
                        maxTicksLimit: 6 
                    } 
                }, 
                y: { 
                    position: 'right',
                    grid: { color: '#2a2e39', borderDash: [5, 5] }, 
                    ticks: { 
                        color: '#787b86',
                        font: { family: 'JetBrains Mono', size: 11 },
                        callback: function(value) { return '$' + parseFloat(value).toFixed(2); } 
                    } 
                }
            }
        }
    });
}

function setTradeMode(mode) {
    tradeMode = mode;
    
    // Buttons toggeln
    document.querySelectorAll('.trade-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const btn = document.getElementById('btn-execute');
    if (mode === 'buy') {
        btn.innerText = 'PLACE BUY ORDER';
        btn.className = 'execute-btn buy-btn';
    } else {
        btn.innerText = 'PLACE SELL ORDER';
        btn.className = 'execute-btn sell-btn';
    }
}

function calculateTotal() {
    const amount = parseInt(document.getElementById('trade-amount').value) || 0;
    const total = amount * currentStock.price;
    document.getElementById('trade-total').innerText = '$' + total.toFixed(2);
}

// --- NOTIFICATION SYSTEM ---
function showNotification(type, message) {
    const container = document.getElementById('notification-area');
    
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    
    const icon = type === 'success' ? '<i class="fas fa-check-circle" style="color:var(--color-up)"></i>' : '<i class="fas fa-exclamation-circle" style="color:var(--color-down)"></i>';
    
    div.innerHTML = `${icon} <span>${message}</span>`;
    
    container.appendChild(div);

    // Auto remove
    setTimeout(() => {
        div.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(() => div.remove(), 300);
    }, 4000);
}

// Listener erweitern
window.addEventListener('message', function(event) {
    const data = event.data;
    // ... (dein open/close Code von oben) ...
    
    // NEU: HIER EINFÜGEN
    if (data.action === 'notify') {
        showNotification(data.type, data.message);
    }
});

function handleLiveUpdate(rawCompanies) {
    const newStocksData = rawCompanies.map(c => {
        // Alte Daten finden (um History & Shares zu retten, falls der Server sie nicht mitsendet)
        const oldData = allStocks.find(old => old.id === c.id);
        
        const changeVal = c.current_price - c.previous_price;
        const changePercent = (changeVal / c.previous_price) * 100;
        
        // --- HISTORY MERGE ---
        let historyData = [];
        if (c.history && c.history.length > 0) {
            historyData = c.history;
        } else if (oldData && oldData.history) {
            historyData = [...oldData.history]; 
            historyData.push({
                price: parseFloat(c.current_price),
                time: new Date() 
            });
            if (historyData.length > 40) historyData.shift(); // Limit history size
        } else {
            historyData = [{ price: parseFloat(c.current_price), time: new Date() }];
        }

        // --- SHARES LOGIC FIX ---
        // Prüfe ob Server neue Share-Daten schickt, sonst nimm alte (Fallback)
        let sAvail = 1000;
        let sTotal = 1000;
        
        if (c.shares_available !== undefined) sAvail = parseInt(c.shares_available);
        else if (oldData && oldData.sharesAvailable !== undefined) sAvail = oldData.sharesAvailable;

        if (c.total_shares !== undefined) sTotal = parseInt(c.total_shares);
        else if (oldData && oldData.totalShares !== undefined) sTotal = oldData.totalShares;
        // ------------------------

        return {
            id: c.id,
            symbol: (c.ticker || (oldData ? oldData.symbol : c.job_name.toUpperCase().substring(0, 4))),
            name: c.label || (oldData ? oldData.name : 'Unknown'),
            category: c.category || (oldData ? oldData.category : 'auto'), 
            
            price: parseFloat(c.current_price),
            change: parseFloat(changePercent.toFixed(2)),
            history: historyData, 
            
            // NEU: Shares korrekt setzen
            sharesAvailable: sAvail,
            totalShares: sTotal,

            myShares: (oldData ? oldData.myShares : 0),
            myAvgPrice: (oldData ? oldData.myAvgPrice : 0)
        };
    });
    
    // Update global array
    allStocks = newStocksData;

    // Refresh Views
    if (document.getElementById('view-market') && !document.getElementById('view-market').classList.contains('hidden')) {
        renderMarketList();
    }
    
    // Update Chart & Sidebar if open
    if (currentStock) {
        const updatedCurrent = allStocks.find(s => s.id === currentStock.id);
        if (updatedCurrent) {
            updateCurrentViewLive(updatedCurrent);
        }
    }
}

function updateCurrentViewLive(newStock) {
    const oldPrice = currentStock.price;
    const newPrice = newStock.price;
    
    // Alte Portfolio-Daten behalten, falls der Server sie beim Broadcast nicht mitsendet!
    // (Das Broadcast-Event schickt oft nur Marktdaten ohne User-Portfolio)
    newStock.myShares = currentStock.myShares;
    newStock.myAvgPrice = currentStock.myAvgPrice;

    currentStock = newStock; // Update reference

    // 1. HEADER UPDATE
    const priceEl = document.getElementById('current-price');
    priceEl.innerText = '$' + newPrice.toFixed(2);
    
    // Flash Animation
    priceEl.classList.remove('flash-up', 'flash-down');
    void priceEl.offsetWidth; 
    if (newPrice > oldPrice) priceEl.classList.add('flash-up');
    if (newPrice < oldPrice) priceEl.classList.add('flash-down');

    // Change % Update
    const changeEl = document.getElementById('price-change');
    changeEl.innerHTML = `${newStock.change}% <i class="fas ${newStock.change >= 0 ? 'fa-caret-up' : 'fa-caret-down'}"></i>`;
    changeEl.className = `price-change ${newStock.change >= 0 ? 'positive' : 'negative'}`;

    // 2. TRADING BOX UPDATE (Price / Share)
    const tradePriceInput = document.getElementById('trade-price');
    if(tradePriceInput) {
        tradePriceInput.value = '$' + newPrice.toFixed(2);
        calculateTotal(); // Recalculate Total if amount is entered
    }

    // 3. PORTFOLIO UPDATE (Bottom Right)
    // Wir rufen einfach die Logik auf, die wir auch beim Laden nutzen
    updatePortfolioDisplay(newStock);

    // 4. CHART UPDATE (Smart & Smooth)
        // 4. CHART UPDATE (Smart & Smooth)
    if (mainChart) {
        // Newest data point
        const newDataPoint = newStock.history[newStock.history.length - 1]; 
        
        // Colors
        const colors = getChartColor(newStock);
        
        // Gradient update (required because canvas size might change)
        const ctx = document.getElementById('mainChart').getContext('2d');
        const newGradient = ctx.createLinearGradient(0, 0, 0, document.getElementById('mainChart').clientHeight);
        newGradient.addColorStop(0, colors.backgroundStart);
        newGradient.addColorStop(1, colors.backgroundEnd);

        // Slide Data: Remove first, Add last
        if (mainChart.data.datasets[0].data.length > 30) {
            mainChart.data.datasets[0].data.shift();
            mainChart.data.labels.shift();
        }

        // Push new Price
        mainChart.data.datasets[0].data.push(newStock.price); // Use direct price to ensure sync
        
        // Push new Label
        const date = new Date(newDataPoint.time || new Date());
        const newLabel = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
        mainChart.data.labels.push(newLabel);
        
        // Apply Colors
        mainChart.data.datasets[0].borderColor = colors.border;
        mainChart.data.datasets[0].backgroundColor = newGradient;
        
        mainChart.update('none'); // Update without animation
    }
}

function updatePortfolioDisplay(stock) {
    const myShares = stock.myShares || 0;
    const avgPrice = stock.myAvgPrice || 0;
    
    // Selektoren für die 3 Zeilen unten rechts
    // Wir gehen davon aus, dass die Reihenfolge im HTML fix ist: Shares, Avg, P/L
    const positionRows = document.querySelectorAll('.position-row .mono'); 
    
    if (positionRows.length >= 3) {
        // Zeile 1: Shares
        positionRows[0].innerText = myShares;
        
        // Zeile 2: Avg Price
        positionRows[1].innerText = '$' + avgPrice.toFixed(2);
        
        // Zeile 3: P/L (Unrealized)
        if (myShares > 0) {
            // Aktueller Wert - Kaufwert
            const diffPerShare = stock.price - avgPrice;
            const totalDiff = diffPerShare * myShares;
            
            const pnlClass = totalDiff >= 0 ? 'text-green' : 'text-red';
            const prefix = totalDiff >= 0 ? '+' : '';
            
            positionRows[2].innerText = prefix + '$' + totalDiff.toFixed(2);
            // Klasse resetten und neu setzen
            positionRows[2].className = 'mono ' + pnlClass;
        } else {
            positionRows[2].innerText = '--';
            positionRows[2].className = 'mono text-gray';
        }
    }
}

function processStockData(companies) {
    console.log("Processing Data:", companies); // DEBUGGING: Schau in die F8 Konsole

    allStocks = companies.map(c => {
        const changeVal = c.current_price - c.previous_price;
        const changePercent = (changeVal / c.previous_price) * 100;
        let historyData = c.history || [c.current_price];
        while (historyData.length < 10) historyData.unshift(historyData[0]);

        // SHARES LOGIC: Priorisiere DB Werte
        let sAvail = 1000;
        let sTotal = 1000;

        // DB sendet oft Strings, daher parseInt
        if (c.shares_available !== undefined && c.shares_available !== null) sAvail = parseInt(c.shares_available);
        else if (c.sharesAvailable !== undefined) sAvail = parseInt(c.sharesAvailable);

        if (c.total_shares !== undefined && c.total_shares !== null) sTotal = parseInt(c.total_shares);
        else if (c.totalShares !== undefined) sTotal = parseInt(c.totalShares);

        return {
            id: c.id,
            symbol: (c.ticker || c.job_name.toUpperCase().substring(0, 4)),
            name: c.label,
            category: c.category || 'auto',
            price: parseFloat(c.current_price),
            change: parseFloat(changePercent.toFixed(2)),
            history: historyData,
            sharesAvailable: sAvail, 
            totalShares: sTotal,
            myShares: parseInt(c.myShares) || 0,
            myAvgPrice: parseFloat(c.myAvgPrice) || 0
        };
    });
}

function switchView(viewName) {
    // 1. Alle Elemente definieren (Hier fehlte shareholders)
    const marketView = document.getElementById('view-market');
    const portfolioView = document.getElementById('view-portfolio');
    const companyView = document.getElementById('view-my-company');
    const walletView = document.getElementById('view-wallet');
    const shareholderView = document.getElementById('view-shareholders'); // NEU: Das hat gefehlt!
    
    const tradePanel = document.querySelector('.trading-panel');

    // 2. Alles verstecken (Reset)
    if(marketView) marketView.classList.add('hidden');
    if(portfolioView) portfolioView.classList.add('hidden');
    if(companyView) companyView.classList.add('hidden');
    if(walletView) walletView.classList.add('hidden');
    if(shareholderView) shareholderView.classList.add('hidden'); // NEU: Das hat gefehlt!

    // Trading Panel standardmäßig ausblenden
    if(tradePanel) tradePanel.style.display = 'none';

    // 3. Den gewünschten Tab anzeigen
    if (viewName === 'market') {
        if(marketView) marketView.classList.remove('hidden');
        if(tradePanel) tradePanel.style.display = 'flex';
    } 
    else if (viewName === 'portfolio') {
        if(portfolioView) portfolioView.classList.remove('hidden');
        renderPortfolio();
    }
    else if (viewName === 'company') {
        if(companyView) companyView.classList.remove('hidden');
        
        // CEO Status Check + Render Logic
        fetch(`https://${GetParentResourceName()}/checkCeoStatus`, { method: 'POST', body: JSON.stringify({}) })
            .then(resp => resp.json())
            .then(status => renderCompanyView(status));
    }
    else if (viewName === 'wallet') {
        if(walletView) walletView.classList.remove('hidden');
    }
    // --- HIER WAR DER FEHLER: Dieser ganze Block fehlte ---
    else if (viewName === 'shareholders') {
        document.getElementById('view-shareholders').classList.remove('hidden');
        populateShareholderDropdown(); // <--- Das muss hier stehen!
    }

    else if (viewName === 'company') {
        const el = document.getElementById('view-my-company');
        if(el) el.classList.remove('hidden');

        // Reset auf IPO Screen (verhindert Glitches beim Wechseln)
        document.getElementById('company-ipo-screen').classList.remove('hidden');
        document.getElementById('company-dashboard').classList.add('hidden');

        // Daten abrufen
        fetch(`https://${GetParentResourceName()}/checkCeoStatus`, { 
            method: 'POST', 
            body: JSON.stringify({}) 
        })
        .then(resp => resp.json())
        .then(status => {
            renderCompanyView(status);
        })
        .catch(err => {
            console.error("Error checking CEO status:", err);
            // Fallback: Sicherstellen, dass man nicht vor leerem Screen steht
            document.getElementById('company-ipo-screen').classList.remove('hidden');
        });
    }
}

function renderPortfolio() {
    console.log("RENDERING PORTFOLIO..."); // Debug Log

    const list = document.getElementById('portfolio-list');
    if (!list) return;
    list.innerHTML = '';

    // Sicherheits-Check: Sind Daten da?
    if (!allStocks || !Array.isArray(allStocks)) {
        console.warn("No stocks data available yet.");
        list.innerHTML = '<div style="padding:40px; text-align:center; color:#555;">Loading data...</div>';
        return;
    }

    // 1. Filter owned stocks
    const myStocks = allStocks.filter(s => s.myShares > 0);
    console.log("Owned Stocks found:", myStocks.length); // Debug Log

    if (myStocks.length === 0) {
        list.innerHTML = '<div style="padding:40px; text-align:center; color:#555;">You do not own any stocks yet.<br>Go to the Market to invest.</div>';
        updatePortfolioStats(0, 0, []);
        return;
    }

    let totalVal = 0;
    let totalInvested = 0;
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];
    const palette = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#3F51B5', '#546E7A'];

    myStocks.forEach((stock, index) => {
        const currentVal = stock.price * stock.myShares;
        const investedVal = stock.myAvgPrice * stock.myShares;
        const pnl = currentVal - investedVal;
        
        // Division durch Null verhindern
        let pnlPercent = 0;
        if (investedVal > 0) {
            pnlPercent = ((pnl / investedVal) * 100);
        }

        totalVal += currentVal;
        totalInvested += investedVal;

        chartLabels.push(stock.symbol);
        chartData.push(currentVal);
        chartColors.push(palette[index % palette.length]);

        const pnlClass = pnl >= 0 ? 'text-green' : 'text-red';
        const pnlPrefix = pnl >= 0 ? '+' : '';

        const div = document.createElement('div');
        div.className = 'asset-item';
        div.onclick = () => {
            console.log("Asset clicked:", stock.symbol);
            
            // 1. Navigation visuell updaten
            document.querySelectorAll('.nav li').forEach(n => n.classList.remove('active'));
            const firstNav = document.querySelector('.nav li'); 
            if(firstNav) firstNav.classList.add('active');
            
            // 2. WICHTIG: Erst View wechseln (damit Canvas sichtbar wird)
            switchView('market');

            // 3. Kurze Verzögerung, damit der Browser das Rendering checkt, dann Aktie laden
            setTimeout(() => {
                loadStock(stock); 
            }, 50);
        };

        div.innerHTML = `
            <div class="asset-info">
                <div class="asset-icon"><i class="fas fa-chart-pie"></i></div>
                <div>
                    <div style="font-weight:700; color:white;">${stock.symbol}</div>
                    <div style="font-size:11px; color:#787b86;">${stock.name}</div>
                </div>
            </div>
            <div class="asset-stats">
                <div class="stat-group">
                    <span class="stat-label">Shares</span>
                    <span class="stat-val">${stock.myShares}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">Value</span>
                    <span class="stat-val">$${currentVal.toFixed(2)}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">Return</span>
                    <span class="stat-val ${pnlClass}">
                        ${pnlPrefix}$${pnl.toFixed(2)} (${pnlPrefix}${pnlPercent.toFixed(2)}%)
                    </span>
                </div>
            </div>
            <div style="color:var(--text-muted);"><i class="fas fa-chevron-right"></i></div>
        `;
        list.appendChild(div);
    });

    updatePortfolioStats(totalVal, totalVal - totalInvested, {labels: chartLabels, data: chartData, colors: chartColors});
}

function updatePortfolioStats(total, pnl, chartInfo) {
    // 1. Total Value Update
    document.getElementById('portfolio-total').innerText = '$' + total.toFixed(2);
    
    // 2. Profit / Loss Update (Color Logic)
    const pnlEl = document.getElementById('portfolio-pnl');
    const pnlPrefix = pnl >= 0 ? '+' : ''; // Pluszeichen bei Gewinn
    
    // Icon hinzufügen für extra Style
    const icon = pnl >= 0 ? '<i class="fas fa-caret-up"></i>' : '<i class="fas fa-caret-down"></i>';
    
    pnlEl.innerHTML = `${pnlPrefix}$${pnl.toFixed(2)} ${icon}`;
    
    // WICHTIG: Klassen komplett resetten bevor wir neue setzen
    pnlEl.className = 'p-value'; 
    
    if (pnl > 0) {
        pnlEl.classList.add('text-green');
    } else if (pnl < 0) {
        pnlEl.classList.add('text-red');
    } else {
        pnlEl.style.color = 'white'; // Neutral bei 0
    }

    // 3. Chart Update (Nur wenn nötig, um Flackern zu vermeiden)
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    
    if (portfolioChart) {
        // Update data only
        portfolioChart.data.datasets[0].data = chartInfo.data;
        portfolioChart.data.datasets[0].backgroundColor = chartInfo.colors;
        portfolioChart.data.labels = chartInfo.labels;
        portfolioChart.update();
    } else {
        // Create new
        if (chartInfo && chartInfo.data.length > 0) {
            portfolioChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartInfo.labels,
                    datasets: [{
                        data: chartInfo.data,
                        backgroundColor: chartInfo.colors,
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%', 
                    animation: false, // WICHTIG für Live Update
                    plugins: { legend: { display: false } }
                }
            });
        }
    }
}

let myCompanyData = null; 

function renderCompanyView(status) {
    // SECURITY CHECK: Wenn status undefined ist, brechen wir ab (verhindert den Crash)
    if (!status) {
        console.warn("renderCompanyView called with no data");
        return;
    }

    const ipoScreen = document.getElementById('company-ipo-screen');
    const dashboard = document.getElementById('company-dashboard');
    const listContainer = document.getElementById('my-companies-list');
    
    // 1. RESET
    if(ipoScreen) ipoScreen.classList.add('hidden');
    if(dashboard) dashboard.classList.add('hidden');

    // 2. Default: IPO Screen anzeigen
    if(ipoScreen) ipoScreen.classList.remove('hidden'); 

    // 3. Render Owned Companies List
    if (listContainer) {
        listContainer.innerHTML = '';
        if (status.ownedCompanies && Array.isArray(status.ownedCompanies) && status.ownedCompanies.length > 0) {
            status.ownedCompanies.forEach(comp => {
                const div = document.createElement('div');
                div.className = 'asset-item';
                div.onclick = () => openCeoDashboard(comp); 
                
                // Job Name Fallback
                const jobDisplay = comp.job_name ? comp.job_name.toUpperCase() : 'PRIVATE';
                const balanceDisplay = comp.balance ? comp.balance.toLocaleString() : '0';

                div.innerHTML = `
                    <div class="asset-info">
                        <div class="asset-icon"><i class="fas fa-building"></i></div>
                        <div>
                            <div style="font-weight:700; color:white;">${comp.label}</div>
                            <div style="font-size:11px; color:#787b86;">${jobDisplay}</div>
                        </div>
                    </div>
                    <div class="asset-stats">
                        <div class="stat-group">
                            <span class="stat-label">Balance</span>
                            <span class="stat-val">$${balanceDisplay}</span>
                        </div>
                    </div>
                    <div style="color:var(--text-muted);"><i class="fas fa-chevron-right"></i></div>
                `;
                listContainer.appendChild(div);
            });
        } else {
            listContainer.innerHTML = '<div style="padding:10px; color:#555;">You do not own any companies yet.</div>';
        }
    }

    // 4. Requirements Update (Visuals)
    const reqMoney = document.getElementById('req-money');
    const reqJob = document.getElementById('req-job');
    
    if (reqMoney) {
        if ((status.bankBalance || 0) >= 100000) {
            reqMoney.classList.add('valid'); reqMoney.classList.remove('invalid');
        } else {
            reqMoney.classList.add('invalid'); reqMoney.classList.remove('valid');
        }
    }

    if (reqJob) {
        if (status.isBoss) {
            reqJob.classList.add('valid'); reqJob.classList.remove('invalid');
        } else {
            reqJob.classList.add('invalid'); reqJob.classList.remove('valid');
        }
    }

    // 5. Dropdown füllen
    const catSelect = document.getElementById('ipo-category');
    if(catSelect && catSelect.children.length === 0) {
        const cats = ['tech', 'auto', 'finance', 'gov', 'food', 'industrial', 'transport'];
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.innerText = c.toUpperCase();
            catSelect.appendChild(opt);
        });
    }
}

function openCeoDashboard(companyData) {
    myCompanyData = companyData;
    
    // View Switch: Liste WEG, Dashboard DA
    document.getElementById('company-ipo-screen').classList.add('hidden');
    document.getElementById('company-dashboard').classList.remove('hidden');
    
    // Daten füllen
    document.getElementById('ceo-comp-name').innerText = companyData.label;
    document.getElementById('ceo-comp-ticker').innerText = companyData.job_name.toUpperCase().substring(0, 4);
    document.getElementById('ceo-comp-balance').innerText = '$' + companyData.balance.toLocaleString();

    // HIER IST DER AUFRUF, DEN DU GESUCHT HAST:
    // Wir laden jetzt die Liste der Anteilseigner für diese Firma
    loadShareholders(companyData.id);
}

function handleCeoAction(action) {
    if (!myCompanyData) return;

    let amount = 0;
    if (action === 'dividend') {
        amount = document.getElementById('ceo-div-amount').value;
    } else {
        amount = document.getElementById('ceo-bank-amount').value;
    }

    if (!amount || amount <= 0) return showNotification('error', 'Invalid amount');

    fetch(`https://${GetParentResourceName()}/ceoAction`, {
        method: 'POST',
        body: JSON.stringify({
            id: myCompanyData.id,
            action: action,
            amount: amount
        })
    });
    
    // UI sofort clearen und notification zeigen
    document.getElementById('ceo-bank-amount').value = '';
    
    // Nach kurzer Zeit Daten neu laden, um Balance zu aktualisieren
    setTimeout(() => {
        // Wir simulieren ein erneutes Öffnen des Dashboards
        fetch(`https://${GetParentResourceName()}/checkCeoStatus`, { method: 'POST', body: JSON.stringify({}) })
        .then(resp => resp.json())
        .then(status => {
             // Finde die aktuelle Firma in den neuen Daten
             const updatedComp = status.ownedCompanies.find(c => c.id === myCompanyData.id);
             if(updatedComp) {
                 openCeoDashboard(updatedComp); // Refresh UI values
             }
        });
    }, 500);

    loadShareholders(companyData.id);
}

function startIPO() {
    const name = document.getElementById('ipo-name').value;
    const price = document.getElementById('ipo-price').value;
    const shares = document.getElementById('ipo-shares').value; // NEU
    const category = document.getElementById('ipo-category').value;
    const ticker = document.getElementById('ipo-ticker').value;
    
    if(!name) return showNotification('error', 'Enter a company name');
    
    fetch(`https://${GetParentResourceName()}/launchIPO`, {
        method: 'POST',
        body: JSON.stringify({ name, price, shares, category, ticker }) // Shares added
    });
}

// Binden wir den Button:
document.addEventListener("DOMContentLoaded", function() {
    const btnIpo = document.getElementById('btn-start-ipo');
    if(btnIpo) {
        btnIpo.onclick = startIPO;
    }
});


function handleCeoAction(action) {
    if (!myCompanyData) return;

    let amount = 0;
    if (action === 'dividend') {
        amount = document.getElementById('ceo-div-amount').value;
    } else {
        amount = document.getElementById('ceo-bank-amount').value;
    }

    if (!amount || amount <= 0) return showNotification('error', 'Invalid amount');

    fetch(`https://${GetParentResourceName()}/ceoAction`, {
        method: 'POST',
        body: JSON.stringify({
            id: myCompanyData.id,
            action: action,
            amount: amount
        })
    });
}

function closeCeoDashboard() {
    // Dashboard weg, IPO/Liste wieder her
    document.getElementById('company-dashboard').classList.add('hidden');
    document.getElementById('company-ipo-screen').classList.remove('hidden');
    myCompanyData = null; // Daten resetten
}

function setChartTimeframe(tf) {
    chartTimeframe = tf;
    
    // Update visual button state
    document.querySelectorAll('.time-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText === tf) b.classList.add('active');
    });

    // Re-render chart with new filter
    if (currentStock) renderChart(currentStock);
}

function handleWallet(action) {
    const amountInput = document.getElementById('wallet-amount');
    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
        return showNotification('error', 'Please enter a valid amount.');
    }

    if (action === 'deposit') {
        fetch(`https://${GetParentResourceName()}/depositMoney`, {
            method: 'POST',
            body: JSON.stringify({ amount: amount })
        });
    } else {
        // Withdraw
        fetch(`https://${GetParentResourceName()}/withdrawMoney`, {
            method: 'POST',
            body: JSON.stringify({ amount: amount })
        });
    }

    // Input clearen
    amountInput.value = '';
}

function loadShareholders(companyId) {
    const container = document.getElementById('shareholder-list');
    if(!container) return;

    container.innerHTML = '<div style="padding:15px; text-align:center; color:#555;"><i class="fas fa-spinner fa-spin"></i> Loading Shareholders...</div>';

    // Request an Lua Client -> Server
    fetch(`https://${GetParentResourceName()}/getShareholders`, {
        method: 'POST',
        body: JSON.stringify({ id: companyId })
    })
    .then(resp => resp.json())
    .then(data => {
        container.innerHTML = '';
        
        if(data && data.length > 0) {
            // Gesamtanzahl berechnen
            const total = data.reduce((sum, h) => sum + h.amount, 0);
            
            data.forEach(holder => {
                const percent = ((holder.amount / total) * 100).toFixed(1);
                
                const div = document.createElement('div');
                div.className = 'market-item'; // Wir nutzen existierende CSS Klasse
                div.style.cursor = 'default';
                div.style.height = 'auto';
                div.style.padding = '10px 0';
                
                div.innerHTML = `
                    <span style="flex: 2; text-align: left; padding-left:10px; font-weight:600; color:white;">
                        ${holder.name}
                    </span>
                    <span style="flex: 1; text-align: right; font-family:'JetBrains Mono'; color:#ccc;">
                        ${holder.amount}
                    </span>
                    <span style="flex: 1; text-align: right; padding-right:10px; font-family:'JetBrains Mono'; color:var(--accent);">
                        ${percent}%
                    </span>
                `;
                container.appendChild(div);
            });
        } else {
            container.innerHTML = '<div style="padding:15px; text-align:center; color:#555;">No shareholders found.</div>';
        }
    });
}


// --- SAUBERE SHAREHOLDER LOGIK (Einfügen am Ende von script.js) ---

function populateShareholderDropdown() {
    const list = document.getElementById('sh-dropdown-list');
    if(!list) return;
    
    list.innerHTML = '';

    if(allStocks && allStocks.length > 0) {
        allStocks.forEach(stock => {
            const item = document.createElement('div');
            item.className = 'dd-item';
            
            // Stylishes Item: [TICKER] Name
            item.innerHTML = `<strong>${stock.symbol}</strong> <span>${stock.name}</span>`;
            
            // Klick-Event
            item.onclick = () => {
                selectCompanyForShareholder(stock.id, stock.symbol, stock.name);
            };
            
            list.appendChild(item);
        });
    } else {
        list.innerHTML = '<div style="padding:15px; text-align:center; color:#555;">No market data.</div>';
    }
}

function selectCompanyForShareholder(id, symbol, name) {
    // 1. Wert setzen (verstecktes Input)
    document.getElementById('sh-company-select-value').value = id;
    
    // 2. UI Label updaten
    document.getElementById('sh-selected-label').innerHTML = `<strong>${symbol}</strong> ${name}`;
    document.getElementById('sh-selected-label').style.color = "white";
    
    // 3. Dropdown schließen
    toggleShareholderDropdown();
    
    // 4. Daten laden
    fetchShareholdersForSelected(id);
}

function fetchShareholdersForSelected(companyId) {
    // Falls keine ID übergeben wurde, hole sie aus dem hidden Input
    if (!companyId) {
        companyId = document.getElementById('sh-company-select-value').value;
    }
    
    const container = document.getElementById('sh-list-content');
    if(!companyId || !container) return;

    container.innerHTML = '<div style="text-align:center; padding:40px; color:#ccc;"><i class="fas fa-circle-notch fa-spin"></i> Loading...</div>';

    fetch(`https://${GetParentResourceName()}/getShareholders`, {
        method: 'POST',
        body: JSON.stringify({ id: parseInt(companyId) })
    })
    .then(resp => resp.json())
    .then(data => {
        container.innerHTML = '';
        if(data && data.length > 0) {
            
            // Wir brauchen die echten Total Shares für die % Rechnung
            const stockInfo = allStocks.find(s => s.id == companyId);
            const totalShares = stockInfo ? stockInfo.totalShares : 1000;

            data.forEach(holder => {
                const percent = ((holder.amount / totalShares) * 100).toFixed(1);
                
                const row = document.createElement('div');
                row.className = 'sh-item';
                
                // Animation für jede Zeile (Stagger Effect)
                row.style.animation = "slideIn 0.3s ease forwards";
                
                row.innerHTML = `
                    <div class="sh-col-name">${holder.name}</div>
                    
                    <div class="sh-col-shares">
                        <span class="sh-badge">${holder.amount}</span>
                    </div>
                    
                    <div class="sh-col-percent">${percent}%</div>
                `;
                container.appendChild(row);
            });
        } else {
            container.innerHTML = '<div class="sh-empty-state">No public shareholders found.</div>';
        }
    })
    .catch(err => {
        console.error(err);
        container.innerHTML = '<div class="sh-empty-state" style="color:#ff4560;">Error loading data.</div>';
    });
}

function toggleShareholderDropdown() {
    const list = document.getElementById('sh-dropdown-list');
    const trigger = document.getElementById('sh-dropdown-trigger');
    
    if (list.classList.contains('hidden')) {
        list.classList.remove('hidden');
        trigger.classList.add('open');
    } else {
        list.classList.add('hidden');
        trigger.classList.remove('open');
    }
}

window.onclick = function(event) {
    if (!event.target.closest('.custom-dropdown-wrapper')) {
        const list = document.getElementById('sh-dropdown-list');
        const trigger = document.getElementById('sh-dropdown-trigger');
        if (list && !list.classList.contains('hidden')) {
            list.classList.add('hidden');
            if(trigger) trigger.classList.remove('open');
        }
    }
}

