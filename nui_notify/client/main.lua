-- NUI LABS - Advanced Notification System
-- Client Side Logic

local isNuiReady = false

-- Function to send the configuration to the NUI (JS) side
local function SendConfigToNUI()
    SendNUIMessage({
        action = 'init',
        config = Config
    })
    isNuiReady = true
end

-- Wait a moment on resource start to ensure NUI is loaded, then send config
CreateThread(function()
    Wait(1000) -- Small buffer to ensure HTML is rendered
    SendConfigToNUI()
end)

-- Also resend config if the resource is restarted (development quality of life)
AddEventHandler('onResourceStart', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then
      return
    end
    Wait(1000)
    SendConfigToNUI()
end)

-- -------------------------------------------------------------------------
-- CORE FUNCTION: ShowNotification
-- -------------------------------------------------------------------------
-- Usage: 
-- exports.nuilabs_notify:Notify({
--     type = 'success', -- success, error, info, warning, police, ambulance, nuilabs
--     title = 'My Title', -- Optional
--     message = 'This is the message content',
--     duration = 5000, -- Optional (in ms)
--     theme = 'glass' -- Optional (overrides config default)
-- })
-- -------------------------------------------------------------------------
local function ShowNotification(data)
    if not data then return end
    
    -- Handle String input (backward compatibility for simple calls)
    if type(data) == 'string' then
        data = { message = data, type = 'info' }
    end

    SendNUIMessage({
        action = 'notify',
        type = data.type,
        title = data.title,
        message = data.message,
        duration = data.duration,
        theme = data.theme
    })
end

-- -------------------------------------------------------------------------
-- EXPORTS & EVENTS
-- -------------------------------------------------------------------------

-- Export for other client scripts to use
exports('Notify', ShowNotification)

-- Event for Server-Side scripts to trigger notifications
RegisterNetEvent('nuilabs:notify', function(data)
    ShowNotification(data)
end)

-- -------------------------------------------------------------------------
-- TESTING / DEBUGGING
-- -------------------------------------------------------------------------
-- Command: /testnotify [type]
-- Example: /testnotify error
RegisterCommand('testnotify', function(source, args)
    local type = args[1] or 'success'
    -- Wir haben Themes entfernt, also entfernen wir sie auch hier aus der Logik

    ShowNotification({
        type = type,
        title = 'System Test',
        message = 'This is a NUI LABS System Test. Status: Operational.',
        duration = 5000
    })
end, false)

RegisterCommand('testnotify', function(source, args)
    local type = args[1] or 'success'
    local theme = args[2] -- Optional: Theme direkt angeben

    ShowNotification({
        type = type,
        title = 'THEME TEST: ' .. (theme or 'Config Default'),
        message = 'This is a NUI LABS System Test to check the visual style.',
        duration = 5000,
        theme = theme -- Wenn nil, nutzt JS das Config Theme
    })
end, false)

-- -------------------------------------------------------------------------
-- FRAMEWORK INTEGRATION (ESX / QB-CORE)
-- -------------------------------------------------------------------------

if Config.FrameworkIntegration then
    
    print("^2[NUI LABS] Framework Integration ACTIVE - Listening for Events...^7")

    -- 1. ESX INTEGRATION
    RegisterNetEvent('esx:showNotification', function(msg, type, length)
        print("^3[DEBUG] ESX Event received: " .. tostring(msg) .. "^7") -- DEBUG
        local finalMsg = msg
        local finalType = type or 'info'
        
        if type(msg) == 'table' then
            finalMsg = msg.msg or msg.message or "Notification"
            finalType = msg.type or 'info'
        end

        ShowNotification({
            message = finalMsg,
            type = finalType,
            duration = length
        })
    end)

    -- 2. QB-CORE INTEGRATION
    RegisterNetEvent('QBCore:Notify', function(msg, type, length)
        print("^3[DEBUG] QB-Core Event received! Msg: " .. tostring(msg) .. "^7") -- DEBUG
        
        local finalType = type or 'info'
        
        -- Mapping korrigieren
        if finalType == 'primary' then finalType = 'info' end
        if finalType == 'error' then finalType = 'error' end
        if finalType == 'success' then finalType = 'success' end

        ShowNotification({
            message = msg,
            type = finalType,
            duration = length
        })
    end)
    
else
    print("^1[NUI LABS] Framework Integration is DISABLED in Config.^7")
end

-- 3. TEST BEFEHL (Sicherer als F8 Trigger)
RegisterCommand('testqb', function()
    print("Testing QBCore Trigger manually...")
    TriggerEvent('QBCore:Notify', 'Dies ist ein QBCore Test', 'success', 5000)
end, false)