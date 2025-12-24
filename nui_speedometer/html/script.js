$(document).ready(function () {
    console.log("NUI LABS: Script loaded successfully."); // Debug

    const app = $('#app');
    
    // Menu Elements
    const menu = $('#settings-menu');
    const themeList = $('#theme-list');
    const closeBtn = $('#close-btn');

    // ==========================================================================
    //                           GEOMETRY & PHYSICS
    // ==========================================================================
    
    const GEOMETRY = {
        rpm: { start: 135, end: 405, min: 0, max: 8 },
        speed: { start: 135, end: 405 },
        fuel: { start: 45, end: -45 }
    };

    const PHYSICS = {
        speed: 0.05, 
        rpm: 0.08,
        fuel: 0.01
    };

    // ==========================================================================
    //                        PREMIUM THEME LIBRARY
    // ==========================================================================

    const THEME_LIBRARY = {
        'minimal': {
            icon: 'fa-minus', // Icon für Menü
            font: "'Share Tech Mono', monospace",
            renderType: 'flat_modern',
            colors: { bg: '#181818', accent: '#ff4400', needle: '#ff4400', text: '#eeeeee', tick: '#555555' },
            needleShape: 'line', lineWidth: 2, shadows: false
        },
        'cyberpunk': {
            icon: 'fa-microchip',
            font: "'Orbitron', sans-serif",
            renderType: 'tech_grid',
            colors: { bg: '#0a0a0a', accent: '#e0c060', needle: '#e0c060', text: '#a0a0a0', tick: '#333333' },
            needleShape: 'block', lineWidth: 2, glow: '0 0 5px rgba(224, 192, 96, 0.4)'
        },
        'retro': { 
            icon: 'fa-stopwatch',
            font: "'Saira', sans-serif",
            renderType: 'classic_analog',
            colors: { bg: '#111111', accent: '#ff9d00', needle: '#ff3300', text: '#e0e0e0', tick: '#dddddd' },
            needleShape: 'tapered', lineWidth: 3, shadows: true
        },
        'sport': {
            icon: 'fa-flag-checkered',
            font: "'Saira', sans-serif",
            renderType: 'carbon_modern',
            colors: { bg: '#1c1c1c', accent: '#cc0000', needle: '#d91e1e', text: '#ffffff', tick: '#aaaaaa' },
            needleShape: 'sharp', lineWidth: 4, shadows: true
        },
        'nfs': {
            icon: 'fa-fire-flame-curved',
            font: "'Racing Sans One', cursive",
            renderType: 'street_dark',
            colors: { bg: '#080a14', accent: '#00cc66', needle: '#ffcc00', text: '#ffffff', tick: '#00cc66' },
            needleShape: 'triangle', lineWidth: 3, glow: '0 0 8px rgba(0, 204, 102, 0.3)'
        },
        'luxury': {
            icon: 'fa-gem',
            font: "'Cinzel', serif",
            renderType: 'chronograph',
            colors: { bg: '#f0f0f0', accent: '#111111', needle: '#222222', text: '#111111', tick: '#666666' },
            needleShape: 'fancy', lineWidth: 1, shadows: false
        },
        'military': {
            icon: 'fa-jet-fighter',
            font: "'Black Ops One', cursive",
            renderType: 'tactical',
            colors: { bg: '#2b3028', accent: '#ffffff', needle: '#ffffff', text: '#bccbb3', tick: '#6b7a5e' },
            needleShape: 'rect', lineWidth: 3, shadows: true
        },
        'drift': {
            icon: 'fa-car-side',
            font: "'Permanent Marker', cursive",
            renderType: 'street_dark',
            colors: { bg: '#150517', accent: '#bd00ff', needle: '#fff000', text: '#e0e0e0', tick: '#bd00ff' },
            needleShape: 'sharp', lineWidth: 3
        },
        'neon': {
            icon: 'fa-bolt',
            font: "'Saira', sans-serif",
            renderType: 'outline_dark',
            colors: { bg: '#050505', accent: '#d600ff', needle: '#00f7ff', text: '#ffffff', tick: '#d600ff' },
            needleShape: 'line', lineWidth: 2, glow: '0 0 4px rgba(214, 0, 255, 0.5)'
        },
        'clean': {
            icon: 'fa-ghost',
            font: "'Saira', sans-serif",
            renderType: 'invisible',
            colors: { bg: 'transparent', accent: '#ffffff', needle: '#ff3300', text: '#ffffff', tick: '#ffffff' },
            needleShape: 'modern', drawFace: false
        }
    };

    let currentTheme = THEME_LIBRARY['minimal'];
    let carData = { speed: 0, rpm: 0, fuel: 100, gear: 0, maxSpeed: 260 };
    let targets = { speed: 0, rpm: 0, fuel: 100 };

    // DOM Elements
    const elSpeed = $('.digital-speed');
    const elUnit = $('.unit');
    const elGear = $('.gear-box');
    const elRpmLabel = $('.label-rpm');
    const iconHigh = $('#icon-highbeam');
    const iconLow = $('#icon-lowbeam');
    const iconBelt = $('#icon-seatbelt');
    const iconEngine = $('#icon-engine');
    const iconFuel = $('#icon-fuel');

    // ==========================================================================
    //                           CANVAS CLASS
    // ==========================================================================

    class Gauge {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.centerX = this.width / 2;
            this.centerY = this.height / 2;
        }

        clear() {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }

        degToRad(deg) { return (deg * Math.PI) / 180; }

        createCarbonPattern() {
            const pCanvas = document.createElement('canvas');
            pCanvas.width = 8; pCanvas.height = 8;
            const pCtx = pCanvas.getContext('2d');
            pCtx.fillStyle = '#181818'; pCtx.fillRect(0,0,8,8);
            pCtx.fillStyle = '#222'; pCtx.fillRect(0,0,4,4); pCtx.fillRect(4,4,4,4);
            return this.ctx.createPattern(pCanvas, 'repeat');
        }

        drawFace(radius) {
            if (!currentTheme.drawFace && currentTheme.renderType === 'invisible') return;

            const ctx = this.ctx;
            const c = currentTheme.colors;
            const type = currentTheme.renderType;

            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, radius, 0, 2 * Math.PI);

            if (type === 'carbon_modern') {
                ctx.fillStyle = this.createCarbonPattern();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, radius * 0.85, 0, 2*Math.PI);
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 20;
                ctx.stroke();
            } else if (type === 'chronograph') {
                let grad = ctx.createLinearGradient(0, 0, 0, this.height);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(1, '#d0d0d0');
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#aaaaaa';
                ctx.stroke();
            } else if (type === 'tech_grid') {
                ctx.fillStyle = '#080808';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, radius*0.9, 0, 2*Math.PI);
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (type === 'classic_analog') {
                let grad = ctx.createRadialGradient(this.centerX, this.centerY, radius*0.5, this.centerX, this.centerY, radius);
                grad.addColorStop(0, '#222');
                grad.addColorStop(1, '#000');
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#333';
                ctx.stroke();
            } else {
                ctx.fillStyle = c.bg;
                ctx.fill();
            }

            if(currentTheme.glow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = c.accent;
                ctx.strokeStyle = c.accent;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        drawTicks(radius, startAngle, endAngle, totalTicks, majorInterval) {
            const ctx = this.ctx;
            const range = endAngle - startAngle;
            const step = range / totalTicks;
            const c = currentTheme.colors;
            let drawRadius = radius - 5; 

            for (let i = 0; i <= totalTicks; i++) {
                const angle = startAngle + (step * i);
                const isMajor = (i % majorInterval === 0);
                const rad = this.degToRad(angle);
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                let innerR, outerR;

                if (currentTheme.renderType === 'chronograph') {
                    outerR = drawRadius;
                    innerR = isMajor ? drawRadius - 8 : drawRadius - 4;
                    ctx.lineWidth = isMajor ? 2 : 1;
                } else if (currentTheme.renderType === 'street_dark') {
                    outerR = drawRadius - 2;
                    innerR = isMajor ? drawRadius - 12 : drawRadius - 6;
                    ctx.lineWidth = isMajor ? 3 : 2;
                } else {
                    outerR = drawRadius;
                    innerR = isMajor ? drawRadius - 10 : drawRadius - 5;
                    ctx.lineWidth = isMajor ? 2 : 1;
                }

                ctx.beginPath();
                ctx.moveTo(this.centerX + cos * innerR, this.centerY + sin * innerR);
                ctx.lineTo(this.centerX + cos * outerR, this.centerY + sin * outerR);
                
                ctx.strokeStyle = isMajor ? c.tick : c.tick; 
                ctx.globalAlpha = isMajor ? 1.0 : 0.4;
                
                if(currentTheme.glow && isMajor) {
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = c.accent;
                }

                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1.0;
            }
        }

        drawNumbers(radius, startAngle, endAngle, minVal, maxVal, stepVal) {
            const ctx = this.ctx;
            const rangeAngle = endAngle - startAngle;
            const rangeVal = maxVal - minVal;
            const c = currentTheme.colors;
            
            ctx.font = `bold 16px ${currentTheme.font}`;
            ctx.fillStyle = c.text;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            let numRadius = radius - 30;
            if (currentTheme.renderType === 'chronograph') numRadius = radius - 25;

            for (let val = minVal; val <= maxVal; val += stepVal) {
                const pct = (val - minVal) / rangeVal;
                const angle = startAngle + (pct * rangeAngle);
                const rad = this.degToRad(angle);
                
                const x = this.centerX + Math.cos(rad) * numRadius;
                const y = this.centerY + Math.sin(rad) * numRadius;

                if (currentTheme.renderType === 'carbon_modern' || currentTheme.renderType === 'street_dark') {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(rad + Math.PI / 2);
                    ctx.fillText(val.toString(), 0, 0);
                    ctx.restore();
                } else {
                    ctx.fillText(val.toString(), x, y);
                }
            }
        }

        drawNeedle(radius, angle) {
            const ctx = this.ctx;
            const rad = this.degToRad(angle);
            const c = currentTheme.colors;
            const shape = currentTheme.needleShape;

            ctx.save();
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(rad); 

            ctx.beginPath();
            ctx.fillStyle = c.needle;

            if (shape === 'block') {
                ctx.fillRect(10, -2, radius-15, 4);
            } else if (shape === 'triangle') {
                ctx.moveTo(0, -5);
                ctx.lineTo(radius - 5, 0);
                ctx.lineTo(0, 5);
                ctx.fill();
            } else if (shape === 'fancy') {
                ctx.moveTo(0, -1.5);
                ctx.lineTo(radius * 0.9, 0);
                ctx.lineTo(0, 1.5);
                ctx.fill();
            } else if (shape === 'tapered') {
                ctx.moveTo(-10, -3);
                ctx.lineTo(radius - 2, 0);
                ctx.lineTo(-10, 3);
                ctx.fill();
            } else {
                ctx.fillRect(0, -1, radius, 2);
            }

            if (currentTheme.glow) {
                 ctx.shadowBlur = 10; ctx.shadowColor = c.needle;
            } else if (currentTheme.shadows) {
                 ctx.shadowColor = 'rgba(0,0,0,0.6)';
                 ctx.shadowBlur = 4;
                 ctx.shadowOffsetY = 2;
            }
            ctx.fill();
            ctx.restore();

            if (currentTheme.drawFace && shape !== 'block') {
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, 8, 0, 2 * Math.PI);
                if (currentTheme.renderType === 'chronograph') {
                    ctx.fillStyle = '#333';
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.fill(); ctx.stroke();
                } else {
                    ctx.fillStyle = '#111';
                    ctx.fill();
                }
            }
        }
    }

    // ==========================================================================
    //                           INIT & LOOP
    // ==========================================================================
    
    let gaugeRPM = new Gauge('canvas-rpm');
    let gaugeSpeed = new Gauge('canvas-speed');
    let gaugeInfo = new Gauge('canvas-info');

    const lerp = (f, t, a) => f * (1 - a) + t * a;

    function renderLoop() {
        carData.speed = lerp(carData.speed, targets.speed, PHYSICS.speed);
        carData.rpm   = lerp(carData.rpm, targets.rpm, PHYSICS.rpm);
        carData.fuel  = lerp(carData.fuel, targets.fuel, PHYSICS.fuel);

        // RPM
        gaugeRPM.clear();
        gaugeRPM.drawFace(130);
        gaugeRPM.drawTicks(130, GEOMETRY.rpm.start, GEOMETRY.rpm.end, 40, 5); 
        gaugeRPM.drawNumbers(130, GEOMETRY.rpm.start, GEOMETRY.rpm.end, 0, 8, 1);
        const currentRpmAngle = GEOMETRY.rpm.start + (carData.rpm * (GEOMETRY.rpm.end - GEOMETRY.rpm.start));
        gaugeRPM.drawNeedle(120, currentRpmAngle);

        // SPEED
        gaugeSpeed.clear();
        gaugeSpeed.drawFace(180);
        const displayMax = Math.ceil(carData.maxSpeed / 20) * 20; 
        gaugeSpeed.drawTicks(180, GEOMETRY.speed.start, GEOMETRY.speed.end, 60, 5);
        gaugeSpeed.drawNumbers(180, GEOMETRY.speed.start, GEOMETRY.speed.end, 0, displayMax, 20);
        const speedPct = carData.speed / displayMax;
        const currentSpeedAngle = GEOMETRY.speed.start + (speedPct * (GEOMETRY.speed.end - GEOMETRY.speed.start));
        gaugeSpeed.drawNeedle(170, currentSpeedAngle);
        
        elSpeed.text(Math.floor(carData.speed));

        // FUEL
        gaugeInfo.clear();
        gaugeInfo.drawFace(130);
        gaugeInfo.drawTicks(100, GEOMETRY.fuel.start, GEOMETRY.fuel.end, 10, 5);
        const ctxF = gaugeInfo.ctx;
        ctxF.fillStyle = currentTheme.colors.text;
        ctxF.font = `bold 16px ${currentTheme.font}`;
        ctxF.textAlign = "center";
        ctxF.fillText("F", 220, 100); 
        ctxF.fillText("E", 220, 200);
        const fuelPct = carData.fuel / 100;
        const fuelAngle = GEOMETRY.fuel.start + (fuelPct * (GEOMETRY.fuel.end - GEOMETRY.fuel.start));
        gaugeInfo.drawNeedle(90, fuelAngle);

        requestAnimationFrame(renderLoop);
    }
    
    requestAnimationFrame(renderLoop);

    // ==========================================================================
    //                           THEME LOADER
    // ==========================================================================

    function loadTheme(themeName) {
        if (THEME_LIBRARY[themeName]) {
            currentTheme = THEME_LIBRARY[themeName];
            container.css('font-family', currentTheme.font);
            elSpeed.css('color', currentTheme.colors.text);
            elUnit.css('color', currentTheme.colors.accent);
            elSpeed.css('text-shadow', 'none'); 
            iconFuel.css('color', currentTheme.colors.accent);
        }
    }

    function setUnit(unit) { elUnit.text(unit.toUpperCase()); }

    function toggleIcon(el, state) {
        state ? el.addClass('active') : el.removeClass('active');
    }

    // ==========================================================================
    //                           MENU LOGIC (FIXED)
    // ==========================================================================

    function initMenu() {
        console.log("NUI LABS: Creating Pro Menu...");
        themeList.empty();
        
        Object.keys(THEME_LIBRARY).forEach(themeKey => {
            const theme = THEME_LIBRARY[themeKey];
            
            const btn = $(`
                <div class="theme-btn" data-theme="${themeKey}" style="--theme-color: ${theme.colors.accent}">
                    <i class="fa-solid ${theme.icon}"></i>
                    <span>${themeKey}</span>
                </div>
            `);
            
            if (currentTheme === theme) {
                btn.addClass('active');
            }

            btn.click(function() {
                const selected = $(this).data('theme');
                $('.theme-btn').removeClass('active');
                $(this).addClass('active');
                
                loadTheme(selected);
                showNotification(`Theme Loaded: ${selected.toUpperCase()}`);
                
                // Sound Trigger
                $.post('https://nui_speedometer/playSound', JSON.stringify({ theme: selected }));
                
                // NEU: Speichern Trigger
                $.post('https://nui_speedometer/saveTheme', JSON.stringify({ theme: selected }));
            });

            themeList.append(btn);
        });
    }

    function showNotification(msg) {
        const id = Date.now();
        const html = `
            <div id="toast-${id}" class="notify-toast" style="border-color: ${currentTheme.colors.accent}">
                <i class="fa-solid fa-circle-check" style="color: ${currentTheme.colors.accent}"></i>
                <span>${msg}</span>
            </div>
        `;
        $('#notify-container').append(html);
        setTimeout(() => { $(`#toast-${id}`).fadeOut(300, function() { $(this).remove(); }); }, 3000);
    }

    // ==========================================================================
    //                           GLOBAL LISTENER
    // ==========================================================================

    window.addEventListener('message', function (event) {
        const item = event.data;

        if(event.data.action === 'forceClose') {
             menu.fadeOut(200);
        }

        // Init Data
        if (item.action === 'init') {
            if (item.theme) loadTheme(item.theme);
            if (item.unit) setUnit(item.unit);
        }

        // Toggle HUD
        if (item.action === 'toggle') {
            item.state ? app.fadeIn(200) : app.fadeOut(200);
        }

        // Open Menu - FIXED VISIBILITY LOGIC
        if (item.action === 'openSettings') {
            console.log("NUI LABS: Open Settings Event Received");
            initMenu();
            // Force Flex display explicitly, then fade in
            menu.css('display', 'flex').hide().fadeIn(200);
        }

        // Data Update
        if (item.action === 'update') {
            const d = item.data;
            targets.speed = d.speed;
            targets.rpm = d.rpm; 
            targets.fuel = d.fuel;
            
            let gear = d.gear;
            if (gear === 0) gear = 'R';
            if (d.speed === 0 && d.rpm < 0.1 && gear !== 'R') gear = 'N'; 
            elGear.text(gear);
            elGear.css('color', currentTheme.colors.text);
            elGear.css('border-color', currentTheme.colors.tick);

            if(d.maxSpeed && d.maxSpeed > 0) carData.maxSpeed = d.maxSpeed;

            toggleIcon(iconLow, d.lights === 'normal');
            toggleIcon(iconHigh, d.lights === 'high');
            toggleIcon(iconBelt, !d.seatbelt);
            toggleIcon(iconEngine, d.engine < 400);
        }
    });

    // Close Menu Click
    closeBtn.click(function() {
        console.log("NUI LABS: Closing Menu");
        menu.fadeOut(200);
        $.post('https://nui_speedometer/closeMenu', JSON.stringify({}));
    });
});