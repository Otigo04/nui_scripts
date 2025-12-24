Config = {}

-- ==============================================================================
--                               NUI LABS - SETTINGS
-- ==============================================================================

-- General Settings
Config.Debug = false -- Set to true to see print logs for debugging
Config.ToggleCommand = 'hud' -- Command to toggle the HUD on/off
Config.DefaultUnit = 'mph' -- Options: 'kmh' or 'mph'

-- Framework & Fuel Integration
-- Options for Fuel: 'legacyfuel', 'ox_fuel', 'cdn-fuel', 'default' (GTA V Standard)
Config.FuelSystem = 'legacyfuel' 

-- ==============================================================================
--                               VISUAL SETTINGS
-- ==============================================================================

-- Choose the visual theme for the speedometer.
-- changing this value loads a completely different CSS/JS structure.
--
-- Available Themes:
-- 'minimal'    : Clean, white/cyan, digital look, very lightweight (Default)
-- 'cyberpunk'  : Neon pink/blue, glitch effects, futuristic font
-- 'retro'      : Analog dial style, orange/yellow classic look
-- 'sport'      : Carbon fiber background, red accents, aggressive
-- 'nfs'        : Underground street racing style, green/blue glow, heavy contrast
-- 'luxury'     : Gold/Silver, elegant serif fonts, smooth/slow animations
-- 'military'   : Camo green colors, stencil fonts, rugged look
-- 'drift'      : Focused on RPM and angle, smoke effects
-- 'neon'       : Bright, high contrast colors, dark background
-- 'clean'      : No background, just floating numbers and essential bars

Config.Theme = 'minimal'

-- ==============================================================================
--                               HUD ELEMENTS
-- ==============================================================================

Config.Elements = {
    ShowSeatbelt = true,
    ShowFuel = true,
    ShowLights = true, -- High beams / Low beams status
    ShowEngineHealth = true, -- Engine icon coloring based on health
    ShowGear = true, -- Show current gear
    ShowRPM = true -- Show RPM gauge/bar
}

-- ==============================================================================
--                           VEHICLE CLASS LIMITS
-- ==============================================================================

-- Here you define the maximum speed for the speedometer GAUGE visual (not the car actual speed).
-- This makes the speedometer look dynamic. A super car will show 300+, a compact car 180.
-- Class IDs refer to GTA V Vehicle Classes.

Config.DynamicMaxSpeed = true -- If true, uses the table below. If false, uses Config.GlobalMaxSpeed

Config.GlobalMaxSpeed = 260 -- Fallback if dynamic is false

Config.MaxSpeedPerClass = {
    -- Format: [ClassID] = { kmh = value, mph = value }
    [0]  = { kmh = 220, mph = 140 }, -- Compacts
    [1]  = { kmh = 240, mph = 150 }, -- Sedans
    [2]  = { kmh = 260, mph = 160 }, -- SUVs
    [3]  = { kmh = 240, mph = 150 }, -- Coupes
    [4]  = { kmh = 280, mph = 175 }, -- Muscle
    [5]  = { kmh = 260, mph = 160 }, -- Sports Classics
    [6]  = { kmh = 320, mph = 200 }, -- Sports
    [7]  = { kmh = 380, mph = 240 }, -- Super
    [8]  = { kmh = 180, mph = 110 }, -- Motorcycles
    [9]  = { kmh = 160, mph = 100 }, -- Off-road
    [10] = { kmh = 140, mph = 90  }, -- Industrial
    [11] = { kmh = 140, mph = 90  }, -- Utility
    [12] = { kmh = 160, mph = 100 }, -- Vans
    [13] = { kmh = 80,  mph = 50  }, -- Cycles
    [14] = { kmh = 200, mph = 125 }, -- Boats
    [15] = { kmh = 300, mph = 190 }, -- Helicopters
    [16] = { kmh = 400, mph = 250 }, -- Planes
    [17] = { kmh = 160, mph = 100 }, -- Service
    [18] = { kmh = 220, mph = 140 }, -- Emergency
    [19] = { kmh = 180, mph = 110 }, -- Military
    [20] = { kmh = 140, mph = 90  }, -- Commercial
    [21] = { kmh = 200, mph = 125 }  -- Trains
}

-- ==============================================================================
--                               COLORS / ALERTS
-- ==============================================================================

Config.Alerts = {
    LowFuelPercentage = 15, -- When to flash the fuel icon
    EngineDamagePercentage = 400, -- Engine health is usually out of 1000. 400 is getting smoky.
    RedlineRPM = 0.9 -- At what RPM percentage (0.0 to 1.0) should the bar turn red/flash
}