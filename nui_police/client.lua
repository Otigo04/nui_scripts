local uiOpen = false
local QBCore = exports['qb-core']:GetCoreObject()
local uiOpen = false

-- Function to toggle NUI visibility
local function toggleUI(status)
    uiOpen = status
    SetNuiFocus(status, status)
    
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)

    SendNUIMessage({
        action = "setVisible",
        status = status,
        coords = {
            x = coords.x,
            y = coords.y
        }
    })
end

-- Command to open dispatch
RegisterCommand(Config.Command, function()
    -- Hier kommt später die Job-Abfrage rein
    toggleUI(not uiOpen)
end, false)

-- NUI Callback to close
RegisterNUICallback('closeUI', function(data, cb)
    toggleUI(false)
    cb('ok')
end)

-- Receive synced unit data from server
RegisterNetEvent('nui_police:client:syncUnits', function(units)
    SendNUIMessage({
        action = "updateUnits",
        units = units
    })
end)



-- Thread to hide NUI when Pause Menu (Esc) is opened
CreateThread(function()
    while true do
        Wait(500)
        if uiOpen and IsPauseMenuActive() then
            toggleUI(false)
        end
    end
end)

-- Callback um die Beamtenliste vom Server zu holen
RegisterNUICallback('getOfficers', function(data, cb)
    QBCore.Functions.TriggerCallback('nui_police:server:getOfficers', function(officers)
        if officers then
            cb(officers)
        else
            cb({})
        end
    end)
end)

-- Callback zum Speichern eines Beamten
RegisterNUICallback('updateOfficer', function(data, cb)
    if data then
        TriggerServerEvent('nui_police:server:updateOfficer', data)
    end
    cb('ok')
end)

-- NUIPolice/client.lua

RegisterNUICallback('fireOfficer', function(data, cb)
    TriggerServerEvent('nui_police:server:fireOfficer', data)
    cb('ok')
end)

-- NUIPolice/client.lua

-- UI schließen wenn man den Job verliert
RegisterNetEvent('nui_police:client:jobUpdate', function(JobInfo)
    if JobInfo.name ~= Config.JobName and uiOpen then
        toggleUI(false)
    end
end)

-- Callback: Personen im Umkreis finden und in Server-IDs umwandeln
RegisterNUICallback('getNearbyPlayers', function(data, cb)
    local playerIdx = GetActivePlayers()
    local coords = GetEntityCoords(PlayerPedId())
    local nearbyServerIds = {}
    
    for _, player in ipairs(playerIdx) do
        local targetPed = GetPlayerPed(player)
        local targetCoords = GetEntityCoords(targetPed)
        local distance = #(coords - targetCoords)
        
        -- Wenn Spieler innerhalb von 10m ist und nicht man selbst
        if distance <= 10.0 and player ~= PlayerId() then
            table.insert(nearbyServerIds, GetPlayerServerId(player))
        end
    end
    
    -- Jetzt schicken wir die echten Server-IDs zum Namens-Check
    QBCore.Functions.TriggerCallback('nui_police:server:getNearbyNames', function(playerNames)
        cb(playerNames)
    end, nearbyServerIds)
end)

RegisterNUICallback('hirePlayer', function(data, cb)
    TriggerServerEvent('nui_police:server:hirePlayer', data.playerId)
    cb('ok')
end)

-- Automatisches Schließen bei Jobverlust
RegisterNetEvent('QBCore:Client:OnJobUpdate', function(JobInfo)
    if JobInfo.name ~= Config.JobName and uiOpen then
        toggleUI(false)
    end
end)

RegisterNUICallback('createUnit', function(data, cb)
    TriggerServerEvent('nui_police:server:createUnit', data)
    cb('ok')
end)

RegisterNUICallback('assignOfficer', function(data, cb)
    TriggerServerEvent('nui_police:server:assignToUnit', data.citizenid, data.unitId)
    cb('ok')
end)

RegisterNUICallback('getUnits', function(data, cb)
    QBCore.Functions.TriggerCallback('nui_police:server:getUnits', function(units)
        cb(units)
    end)
end)

RegisterNetEvent('nui_police:client:syncCreatedUnits', function(units)
    SendNUIMessage({ action = "updateUnitsList", units = units })
end)

RegisterNUICallback('updateUnitData', function(data, cb)
    TriggerServerEvent('nui_police:server:updateUnitData', data)
    cb('ok')
end)

RegisterNUICallback('deleteUnit', function(data, cb)
    TriggerServerEvent('nui_police:server:deleteUnit', data)
    cb('ok')
end)

-- DATEI: client.lua
RegisterNUICallback('removeFromUnit', function(data, cb)
    TriggerServerEvent('nui_police:server:removeFromUnit', data.citizenid)
    cb('ok')
end)

-- DATEI: client.lua
-- Hilfsfunktion für den Straßennamen
RegisterNUICallback('getStreetName', function(data, cb)
    local streetHash = GetStreetNameAtCoord(data.x, data.y, data.z)
    cb(GetStreetNameFromHashKey(streetHash))
end)

-- DATEI: client.lua
RegisterNUICallback('refreshLocations', function(data, cb)
    TriggerServerEvent('nui_police:server:updateAllUnitLocations')
    cb('ok')
end)

-- DATEI: client.lua

RegisterNetEvent('nui_police:client:requestStreetUpdate', function(unitId)
    local coords = GetEntityCoords(PlayerPedId())
    local s1, s2 = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local street = GetStreetNameFromHashKey(s1)
    if s2 ~= 0 then street = street .. " / " .. GetStreetNameFromHashKey(s2) end
    
    TriggerServerEvent('nui_police:server:receiveStreetName', unitId, street)
end)