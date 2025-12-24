Config = {}

-- [[ NUI LABS: ACCESS SETTINGS ]] --
Config.Access = {
    enableCommand = true,
    commandName = 'nuiadmin', 
    enableKeybind = true,
    defaultKey = 'F6', 
}

-- [[ NUI LABS: FRAMEWORK & PERMISSIONS ]] --
-- WICHTIG: Hier aktivieren wir deine Ränge!
Config.Framework = 'qbcore'  -- 'esx', 'qbcore' oder 'standalone'
Config.UseFrameworkPermissions = true -- Wenn true, werden QBCore/ESX Ränge genutzt.

-- [[ PERMISSION LEVELS (SHOWCASE MODE) ]] --
Config.Permissions = {
    -- 1. GLOBAL ACCESS
    ['open_menu']   = 'user', 

    ['godmode']     = 'user',
    ['noclip']      = 'user',
    ['heal_self']   = 'user',
    ['ghost_mode']  = 'user',
    ['clean_ped']   = 'user',
    ['money']       = 'user', -- KLAPPT NICHT BEI USER
    ['revive_self'] = 'user',
    ['revive']      = 'user',

    -- 3. PLAYER MANAGEMENT
    ['kill']        = 'admin',
    ['revive']      = 'user',
    ['freeze']      = 'admin',
    ['spectate']    = 'user',
    ['goto']        = 'user',
    ['bring']       = 'admin',
    ['kick']        = 'admin',
    ['ban']         = 'admin',
    ['inventory']   = 'admin',
    ['clothing']    = 'admin',
    ['intovehicle'] = 'admin',
    ['perms_player'] = 'admin',
    ['troll_action'] = 'admin',

    -- 4. VEHICLE OPTIONS
    ['spawn_vehicle']  = 'user',
    ['vehicle_godmode'] = 'user',
    ['repair_vehicle'] = 'user',
    ['delete_vehicle'] = 'user',
    ['tuning']         = 'user',
    ['rainbow']        = 'user',
    ['speed_boost']    = 'user',
    ['claim_vehicle']  = 'user',

    -- 5. WEAPON OPTIONS (Spaß erlaubt)
    ['give_weapon']   = 'user',
    ['infinite_ammo'] = 'user',
    ['exp_ammo']      = 'admin', -- Explosive Munition nervt andere -> Admin

    -- 6. WORLD OPTIONS (Alle beeinflussen -> Admin)
    ['weather']     = 'admin',
    ['time']        = 'admin',
    ['blackout']    = 'admin',
    ['clear_area']  = 'admin',

    -- [[ DEVELOPER TOOLS ]]
    ['copy_vector3']   = 'user',
    ['copy_vector4']   = 'user',
    ['copy_heading']   = 'user',
    ['display_coords'] = 'user',
    ['entity_view_mode'] = 'user',
    ['dev_delete_laser'] = 'user',
}

-- [[ NUI LABS: BAN SYSTEM SETTINGS ]] --
Config.BanSystem = {
    -- Maximale Bannzeit in Stunden ( -1 = Permanent erlaubt )
    MaxBanDuration = {
        ['user']       = 0,    -- User darf nicht bannen
        ['supporter']  = 24,   -- Max 1 Tag
        ['moderator']  = 168,  -- Max 1 Woche
        ['admin']      = -1,   -- Permanent erlaubt
        ['god']        = -1    -- Permanent erlaubt
    },
    -- Vorgefertigte Gründe für Dropdown (Optional, wenn wir Textfeld nutzen)
    Reasons = {
        "Trolling / Griefing",
        "Modding / Cheating",
        "Hate Speech / Racism",
        "Combat Logging",
        "Exploiting"
    }
}

-- [[ NUI LABS: ANNOUNCEMENT SYSTEM ]] --
Config.Announcement = {
    UseCustomDesign = true, -- true = Cooles NUI Popup | false = Standard Chat Message
    Duration = 6000,       -- Wie lange das Popup sichtbar bleibt (ms)
    Sound = true            -- Sound abspielen bei Announcement
}

-- Berechtigung für das neue Admin-Tab
Config.Permissions['menu_server_admin'] = 'admin'

-- [[ VEHICLE SETTINGS ]] --
Config.VehicleSettings = {
    RemovePreviousVehicle = true,
    UseRandomPlate = true,
    FixedPlateText = "NUI LABS" 
}

-- [[ NOCLIP SETTINGS ]] --
Config.NoClip = {
    Speed = 1.0,
    MaxSpeed = 16.0,
    Controls = {
        MOVE_FORWARDS = 32, MOVE_BACKWARDS = 33, MOVE_LEFT = 34, MOVE_RIGHT = 35,
        MOVE_UP = 44, MOVE_DOWN = 46,
        SPEED_DECREASE = 14, SPEED_INCREASE = 15, SPEED_RESET = 348,
        SPEED_SLOW_MODIFIER = 36, SPEED_FAST_MODIFIER = 21, SPEED_FASTER_MODIFIER = 19,
    }
}

-- [[ UI SETTINGS ]] --
Config.UISettings = {
    hardcoreMode = true, 
    soundEffects = true, 
    themeColor = '#ff0055' 
}

-- COOLDOWNS
Config.BlackoutCooldown = 5000
Config.WeatherCooldown = 5000

-- TROLLING (Kidnap settings)
Config.TrollSystem = {
    KidnapDestination = vector3(-1586.63, -1035.78, 13.04), 
    KidnapVehicle = "burrito3", 
    KidnapPed = "g_m_y_salvagoon_01"
}