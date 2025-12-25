local QBCore = exports['qb-core']:GetCoreObject()
local ActiveUnits = {}

-- Zentrale Sync-Funktion
local function UpdateUnits()
    ActiveUnits = {}
    local players = QBCore.Functions.GetQBPlayers()
    for _, v in pairs(players) do
        if v.PlayerData.job.name == Config.JobName and v.PlayerData.job.onduty then
            local ped = GetPlayerPed(v.PlayerData.source)
            local coords = GetEntityCoords(ped)
            table.insert(ActiveUnits, {
                source = v.PlayerData.source,
                name = v.PlayerData.charinfo.firstname .. " " .. v.PlayerData.charinfo.lastname,
                callsign = v.PlayerData.metadata["callsign"] or "N/A",
                grade = v.PlayerData.job.grade.name,
                coords = { x = coords.x, y = coords.y }
            })
        end
    end
    TriggerClientEvent('nui_police:client:syncUnits', -1, ActiveUnits)
end

CreateThread(function()
    while true do
        UpdateUnits()
        Wait(3000)
    end
end)

RegisterNetEvent('nui_police:server:updateOfficer', function(data)
    local src = source
    local TargetPlayer = QBCore.Functions.GetPlayerByCitizenId(data.citizenid)
    if TargetPlayer then
        TargetPlayer.Functions.SetMetaData("callsign", data.callsign)
        TargetPlayer.Functions.SetJob(Config.JobName, tonumber(data.rank))
        TriggerClientEvent('QBCore:Notify', src, "Daten aktualisiert.", "success")
        UpdateUnits()
    end
end)

-- NUIPolice/server.lua UPDATE

QBCore.Functions.CreateCallback('nui_police:server:getOfficers', function(source, cb)
    local officers = {}
    local players = QBCore.Functions.GetQBPlayers()
    for _, v in pairs(players) do
        if v.PlayerData.job.name == Config.JobName then
            table.insert(officers, {
                citizenid = v.PlayerData.citizenid,
                name = v.PlayerData.charinfo.firstname .. " " .. v.PlayerData.charinfo.lastname,
                callsign = v.PlayerData.metadata["callsign"] or "N/A",
                rank = v.PlayerData.job.grade.level,
                rankName = v.PlayerData.job.grade.name,
                onduty = v.PlayerData.job.onduty -- WICHTIG FÜR DAS NUI
            })
        end
    end
    cb(officers)
end)

-- NUIPolice/server.lua

-- NUIPolice/server.lua

RegisterNetEvent('nui_police:server:fireOfficer', function(data)
    local src = source
    local TargetPlayer = QBCore.Functions.GetPlayerByCitizenId(data.citizenid)
    
    if TargetPlayer then
        -- Job auf arbeitslos setzen
        TargetPlayer.Functions.SetJob("unemployed", 0)
        TriggerClientEvent('QBCore:Notify', src, "Der Beamte wurde entlassen.", "error")
        TriggerClientEvent('QBCore:Notify', TargetPlayer.PlayerData.source, "Du wurdest aus dem Polizeidienst entlassen.", "error")
        
        -- Map-Update für alle erzwingen
        UpdateUnits() -- Nutzt deine bestehende Funktion
    else
        -- DB-Fallback (Optional: falls der Spieler offline ist, müsste hier ein SQL-Query hin)
        TriggerClientEvent('QBCore:Notify', src, "Spieler muss online sein, um ihn zu entlassen.", "warning")
    end
end)

-- NUIPolice/server.lua

-- Callback um Namen zu den Server-IDs zu bekommen
QBCore.Functions.CreateCallback('nui_police:server:getNearbyNames', function(source, cb, playerList)
    local nearbyData = {}
    for _, src in pairs(playerList) do
        if src ~= source then -- Sich selbst ignorieren
            local TPlayer = QBCore.Functions.GetPlayer(src)
            if TPlayer then
                table.insert(nearbyData, {
                    id = src,
                    name = TPlayer.PlayerData.charinfo.firstname .. " " .. TPlayer.PlayerData.charinfo.lastname
                })
            end
        end
    end
    cb(nearbyData)
end)

-- Jemandem den Polizei-Job geben
RegisterNetEvent('nui_police:server:hirePlayer', function(playerId)
    local src = source
    local TPlayer = QBCore.Functions.GetPlayer(tonumber(playerId))
    if TPlayer then
        TPlayer.Functions.SetJob(Config.JobName, 1) -- Als Rang 1 einstellen
        TriggerClientEvent('QBCore:Notify', TPlayer.PlayerData.source, "Du wurdest als Polizist eingestellt!", "success")
        UpdateUnits() -- Sync
    end
end)

-- NUIPolice/server.lua

local CreatedUnits = {} 

RegisterNetEvent('nui_police:server:createUnit', function(data)
    local unitId = os.time()
    CreatedUnits[unitId] = {
        id = unitId,
        name = data.name or "NEUE EINHEIT",
        category = data.category or "Streife",
        code = data.code or "10-8", -- FIX: Nutzt jetzt den gewählten Code
        officers = {}
    }
    TriggerClientEvent('nui_police:client:syncCreatedUnits', -1, CreatedUnits)
end)

-- NUIPolice/server.lua

RegisterNetEvent('nui_police:server:assignToUnit', function(citizenid, unitId)
    local id = tonumber(unitId) -- FIX: Sicherstellen, dass ID eine Nummer ist
    
    -- Aus allen alten Einheiten entfernen
    for _, unit in pairs(CreatedUnits) do
        for i, cid in ipairs(unit.officers) do
            if cid == citizenid then table.remove(unit.officers, i) end
        end
    end

    -- In neue Einheit einfügen
    if id and CreatedUnits[id] then
        table.insert(CreatedUnits[id].officers, citizenid)
    end
    TriggerClientEvent('nui_police:client:syncCreatedUnits', -1, CreatedUnits)
end)

-- Initialer Abruf beim Öffnen
QBCore.Functions.CreateCallback('nui_police:server:getUnits', function(source, cb)
    cb(CreatedUnits)
end)

-- Streife löschen
RegisterNetEvent('nui_police:server:deleteUnit', function(data)
    if CreatedUnits[data.id] then
        -- Erst Beamte befreien (optional, sie landen durch sync eh im Pool)
        CreatedUnits[data.id] = nil
        TriggerClientEvent('nui_police:client:syncCreatedUnits', -1, CreatedUnits)
    end
end)

-- DATEI: server.lua

RegisterNetEvent('nui_police:server:removeFromUnit', function(citizenid)
    for _, unit in pairs(CreatedUnits) do
        for i, cid in ipairs(unit.officers) do
            if cid == citizenid then 
                table.remove(unit.officers, i) 
            end
        end
    end
    TriggerClientEvent('nui_police:client:syncCreatedUnits', -1, CreatedUnits)
end)

-- DATEI: server.lua (In der Update-Schleife oder getUnits Callback)
-- Wir erweitern die Unit-Daten um den Standort des ersten Beamten in der Liste

local function GetUnitLocation(officerCids)
    if #officerCids == 0 then return "Basis" end
    local firstOfficer = QBCore.Functions.GetPlayerByCitizenId(officerCids[1])
    if firstOfficer then
        local coords = GetEntityCoords(GetPlayerPed(firstOfficer.PlayerData.source))
        -- Hier nutzen wir ein Client-Event/Callback um den Straßennamen zu holen
        return "Berechne..." -- Der reale Name kommt via Client-Update
    end
    return "Offline"
end



-- DATEI: server.lua

-- Funktion um Straßennamen vom Client zu holen
local function RequestStreetName(source, coords, callback)
    -- Da wir den Straßennamen nicht direkt auf dem Server haben,
    -- triggern wir ein Client-Event am Beamten
    TriggerClientEvent('nui_police:client:getStreetNameForServer', source, coords, callback)
end

-- Die Update-Schleife für Standorte
RegisterNetEvent('nui_police:server:updateAllUnitLocations', function()
    for id, unit in pairs(CreatedUnits) do
        if unit.officers and #unit.officers > 0 then
            local firstOfficer = QBCore.Functions.GetPlayerByCitizenId(unit.officers[1])
            if firstOfficer then
                -- Wir fragen den Standort beim Client ab
                TriggerClientEvent('nui_police:client:requestStreetUpdate', firstOfficer.PlayerData.source, id)
            end
        else
            unit.location = "Außer Dienst"
        end
    end
end)

-- DATEI: server.lua

-- Empfange Straßennamen vom Client und speichere ihn permanent in der Unit
-- Standort-Event korrigieren
RegisterNetEvent('nui_police:server:receiveStreetName', function(unitId, streetName)
    local id = tonumber(unitId) -- SICHERSTELLEN, DASS ES EINE ZAHL IST
    if id and CreatedUnits[id] then
        CreatedUnits[id].location = streetName
        -- Sync an alle Clients mit den NEUEN Daten
        TriggerClientEvent('nui_police:client:syncCreatedUnits', -1, CreatedUnits)
    end
end)
-- DATEI: server.lua

RegisterNetEvent('nui_police:server:updateUnitData', function(data)
    -- ERZWINGT NUMERISCHE ID (os.time() Fix)
    local id = tonumber(data.id)
    if id and CreatedUnits[id] then
        CreatedUnits[id][data.field] = data.value
        -- Sync an alle für sofortiges Update
        TriggerClientEvent('nui_police:client:syncCreatedUnits', -1, CreatedUnits)
    end
end)
