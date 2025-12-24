Config = {}

-- GLOBAL SETTINGS
Config.Debug = false

-- UI SCALING
-- 1.0 = Normal, 0.8 = Smaller, 1.5 = Bigger
Config.UIScale = 1.4

-- THEME SELECTION
Config.DefaultTheme = 'tech' 

-- POSITION
Config.Position = 'center-left'

-- ANIMATION & TIMING
Config.DefaultDuration = 5000 
Config.AnimationSpeed = 500

-- SOUND SETTINGS
Config.EnableSounds = true
Config.SoundVolume = 0.3

-- COLORS (Für Glow & Icons)
Config.Types = {
    ['success'] = '#00ff88', 
    ['error']   = '#ff0055', 
    ['info']    = '#00ccff', 
    ['warning'] = '#ffcc00', 
    ['police']  = '#3b82f6', 
    ['ambulance']= '#f97316',
    ['nuilabs'] = '#00E5FF', 
    ['team']    = '#a855f7'  
}

Config.Icons = {
    ['success'] = 'fa-solid fa-check',
    ['error']   = 'fa-solid fa-xmark',
    ['info']    = 'fa-solid fa-info',
    ['warning'] = 'fa-solid fa-exclamation',
    ['police']  = 'fa-solid fa-shield-halved',
    ['ambulance']= 'fa-solid fa-suitcase-medical',
    ['nuilabs'] = 'fa-solid fa-code',
    ['team']    = 'fa-solid fa-users'
}

-- FRAMEWORK INTEGRATION
-- TRUE: automatic replace of standard ESX & QB-Core Notifications
-- IMPORTANT: deactivate your old notify resources (esx_notify, qb-notify),
-- else your going to see both notifications at the same time
Config.FrameworkIntegration = true