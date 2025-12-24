local inVehicle = false
local currentVehicle = nil
local displayHud = true
local isMenuOpen = false

-- Helper to get saved theme or default
local function GetUserTheme()
    -- Lade gespeichertes Theme (KVP)
    local savedTheme = GetResourceKvpString('nui_speedometer_theme')
    if savedTheme and savedTheme ~= "" then
        return savedTheme
    end
    return Config.Theme -- Fallback auf Config
end

local function getSpeedMultiplier()
    if Config.DefaultUnit == 'mph' then return 2.236936 else return 3.6 end
end

local function getMaxSpeed(veh)
    if not Config.DynamicMaxSpeed then return Config.GlobalMaxSpeed end
    local class = GetVehicleClass(veh)
    local limitData = Config.MaxSpeedPerClass[class]
    if not limitData then return Config.GlobalMaxSpeed end
    if Config.DefaultUnit == 'mph' then return limitData.mph else return limitData.kmh end
end

local function SendInitMessage()
    -- Sende das GESPEICHERTE Theme, nicht nur das Config-Theme
    SendNUIMessage({
        action = 'init',
        theme = GetUserTheme(), 
        unit = Config.DefaultUnit
    })
end

-- ==============================================================================
--                               COMMAND & MENU
-- ==============================================================================

RegisterCommand('nui_speedometer', function()
    local ped = PlayerPedId()
    if IsPedInAnyVehicle(ped, false) then
        isMenuOpen = true
        SetNuiFocus(true, true)
        SendNUIMessage({ action = 'openSettings' })
    end
end)

RegisterNUICallback('closeMenu', function(data, cb)
    isMenuOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

-- NEU: Theme speichern
RegisterNUICallback('saveTheme', function(data, cb)
    local theme = data.theme
    if theme then
        SetResourceKvp('nui_speedometer_theme', theme)
        -- Optional: Debug print
        -- print('NUI LABS: Theme saved -> ' .. theme)
    end
    cb('ok')
end)

RegisterNUICallback('playSound', function(data, cb)
    local theme = data.theme
    if theme == 'cyberpunk' or theme == 'neon' then
        PlaySoundFrontend(-1, "Hack_Success", "DLC_HEIST_BIOLAB_PREP_HACKING_SOUNDS", 1)
    elseif theme == 'retro' or theme == 'minimal' then
        PlaySoundFrontend(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET", 1)
    elseif theme == 'sport' or theme == 'nfs' then
        PlaySoundFrontend(-1, "Race_Delivered", "DLC_ALM_Delivery_Sounds", 1)
    elseif theme == 'military' or theme == 'drift' then
        PlaySoundFrontend(-1, "FocusIn", "HintCamSounds", 1)
    elseif theme == 'luxury' or theme == 'clean' then
        PlaySoundFrontend(-1, "Highlight_Accept", "DLC_HEIST_PLANNING_BOARD_SOUNDS", 1)
    else
        PlaySoundFrontend(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET", 1)
    end
    cb('ok')
end)

-- ==============================================================================
--                               MAIN LOOP
-- ==============================================================================

CreateThread(function()
    Wait(1000) 
    SendInitMessage()

    while true do
        local sleep = 1000
        local ped = PlayerPedId()

        if IsPedInAnyVehicle(ped, false) and not inVehicle then
            inVehicle = true
            currentVehicle = GetVehiclePedIsIn(ped, false)
            
            SendInitMessage() -- Lädt das gespeicherte Theme beim Einsteigen
            if not isMenuOpen then
                SendNUIMessage({ action = 'toggle', state = true })
            end
            
            StartDataLoop()
            sleep = 500
        elseif not IsPedInAnyVehicle(ped, false) and inVehicle then
            inVehicle = false
            currentVehicle = nil
            SendNUIMessage({ action = 'toggle', state = false })
            
            if isMenuOpen then
                isMenuOpen = false
                SetNuiFocus(false, false)
                SendNUIMessage({ action = 'forceClose' })
            end
        end
        Wait(sleep)
    end
end)

function StartDataLoop()
    CreateThread(function()
        local currentMaxSpeed = getMaxSpeed(currentVehicle)
        
        while inVehicle do
            if not displayHud then 
                Wait(500) 
            else
                if currentVehicle then
                    local speedRaw = GetEntitySpeed(currentVehicle)
                    local speed = speedRaw * getSpeedMultiplier()
                    local rpm = GetVehicleCurrentRpm(currentVehicle)
                    local gear = GetVehicleCurrentGear(currentVehicle)
                    
                    local fuel = 100
                    if GetFuel then fuel = GetFuel(currentVehicle) else fuel = GetVehicleFuelLevel(currentVehicle) end
                    
                    local _, lightsOn, highbeamsOn = GetVehicleLightsState(currentVehicle)
                    local lightStatus = 'off'
                    if lightsOn == 1 then lightStatus = 'normal' end
                    if highbeamsOn == 1 then lightStatus = 'high' end

                    local engine = GetVehicleEngineHealth(currentVehicle)
                    local seatbeltOn = true 

                    SendNUIMessage({
                        action = 'update',
                        data = {
                            speed = speed,
                            rpm = rpm,
                            gear = gear,
                            fuel = fuel,
                            lights = lightStatus,
                            engine = engine,
                            seatbelt = seatbeltOn,
                            maxSpeed = currentMaxSpeed
                        }
                    })
                end
                Wait(50) 
            end
        end
    end)
end

RegisterCommand(Config.ToggleCommand, function()
    displayHud = not displayHud
    if inVehicle then SendNUIMessage({ action = 'toggle', state = displayHud }) end
end)