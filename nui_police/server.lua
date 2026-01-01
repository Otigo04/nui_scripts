local QBCore = exports['qb-core']:GetCoreObject()
local ActiveUnits = {}

-- Zentrale Sync-Funktion
-- NUI LABS | Proper Unit Sync Loop
local function UpdateUnits()
    -- Wir schicken jetzt die echten CreatedUnits anstatt nur eine Spielerliste
    TriggerClientEvent('nui_police:client:syncCreatedUnits', -1, CreatedUnits)
end

-- Wir erhöhen den Intervall auf 5 Sekunden für bessere Performance
CreateThread(function()
    while true do
        Wait(5000)
        -- Triggert bei allen Clients ein Standort-Update
        TriggerEvent('nui_police:server:updateAllUnitLocations')
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

-- NUI LABS | Safe Unit Deletion Fix
RegisterNetEvent('nui_police:server:deleteUnit', function(data)
    -- WICHTIG: Die ID muss von String zu Number konvertiert werden
    local id = tonumber(data.id)
    
    if id and CreatedUnits[id] then
        -- Streife aus der Tabelle entfernen
        CreatedUnits[id] = nil
        
        -- Sofortiger Sync an alle Clients, damit die UI und Karte aktualisiert wird
        TriggerClientEvent('nui_police:client:syncCreatedUnits', -1, CreatedUnits)
        
        -- Optional: Debug Info
        if Config.Debug then print("^2[NUI LABS]^7 Streife gelöscht: " .. id) end
    else
        print("^1[NUI LABS ERROR]^7 Versuch eine nicht existierende Streife zu löschen: " .. tostring(data.id))
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
            -- Wir nehmen den ersten Beamten der Unit als GPS-Sender
            local firstOfficer = QBCore.Functions.GetPlayerByCitizenId(unit.officers[1])
            if firstOfficer then
                TriggerClientEvent('nui_police:client:requestStreetUpdate', firstOfficer.PlayerData.source, id)
            end
        end
    end
    -- Die Master-Daten (für Einzelbeamte) werden beim nächsten JS-Fetch automatisch frisch gezogen
end)

-- DATEI: server.lua

-- Updated: Receive detailed unit status
RegisterNetEvent('nui_police:server:receiveStreetName', function(unitId, streetName, coords, inVehicle)
    local id = tonumber(unitId)
    if id and CreatedUnits[id] then
        CreatedUnits[id].location = streetName
        CreatedUnits[id].currentCoords = coords -- Speichere die echten Coords für die Map
        CreatedUnits[id].inVehicle = inVehicle  -- Status für das Icon
        
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

-- NUI LABS | Master Data with Hazard Definitions
QBCore.Functions.CreateCallback('nui_police:server:getDispatchData', function(source, cb)
    local officers = {}
    local players = QBCore.Functions.GetQBPlayers()
    
    for _, v in pairs(players) do
        if v.PlayerData.job.name == Config.JobName then
            local ped = GetPlayerPed(v.PlayerData.source)
            local coords = GetEntityCoords(ped)
            local vehicle = GetVehiclePedIsIn(ped, false)
            
            table.insert(officers, {
                citizenid = v.PlayerData.citizenid,
                name = v.PlayerData.charinfo.firstname .. " " .. v.PlayerData.charinfo.lastname,
                callsign = v.PlayerData.metadata["callsign"] or "N/A",
                rank = v.PlayerData.job.grade.level,
                rankName = v.PlayerData.job.grade.name,
                onduty = v.PlayerData.job.onduty,
                coords = { x = coords.x, y = coords.y, z = coords.z },
                inVehicle = (vehicle ~= 0)
            })
        end
    end
    
        cb({
            officers = officers or {},
            units = CreatedUnits or {},
            config = {
                vehicles = Config.Vehicles or {},
                statusCodes = Config.StatusCodes or {},
                hazardLevels = Config.HazardLevels or {} -- NEU: Hier werden die Levels mitgeschickt
            }
        })
end)

-- NUI LABS | High-Priority Data Callback
QBCore.Functions.CreateCallback('nui_police:server:getDirectivesData', function(source, cb)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    
    -- Holen der Daten aus der DB
    local directives = MySQL.query.await('SELECT * FROM police_directives ORDER BY created_at DESC')
    local hazard = MySQL.query.await('SELECT setting_value FROM police_settings WHERE setting_key = ?', {'hazard_level'})
    
    -- Berechtigung: Wir prüfen gegen Config.DirectivesPermissions
    local canManage = false
    if player and player.PlayerData.job.grade.level >= Config.DirectivesPermissions then
        canManage = true
    end

    cb({
        directives = directives or {},
        hazardLevel = tonumber(hazard[1] and hazard[1].setting_value) or 1,
        canManage = canManage, -- Das steuert den "Hinzufügen"-Button
        config = {
            hazardLevels = Config.HazardLevels -- Wir senden die Config direkt mit
        }
    })
end)


-- NUI LABS | Real-time Directive Sync
RegisterNetEvent('nui_police:server:saveDirective', function(data)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    
    if player.PlayerData.job.grade.level >= Config.DirectivesPermissions then
        MySQL.insert('INSERT INTO police_directives (title, content, author_name, author_rank) VALUES (?, ?, ?, ?)', {
            data.title, 
            data.content, 
            player.PlayerData.charinfo.firstname .. " " .. player.PlayerData.charinfo.lastname,
            player.PlayerData.job.grade.name
        }, function(id)
            if id then
                -- TRIGGER AN ALLE: Aktualisiert die Liste bei jedem Beamten sofort
                TriggerClientEvent('nui_police:client:refreshDirectives', -1)
                TriggerClientEvent('QBCore:Notify', src, "Dienstanweisung veröffentlicht", "success")
            end
        end)
    end
end)

RegisterNetEvent('nui_police:server:updateHazard', function(level)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if player.PlayerData.job.grade.level >= Config.DirectivesPermissions then
        MySQL.update('UPDATE police_settings SET setting_value = ? WHERE setting_key = ?', {tostring(level), 'hazard_level'}, function()
            -- SYNC AN ALLE POLIZISTEN
            TriggerClientEvent('nui_police:client:refreshDirectives', -1)
            local label = Config.HazardLevels[level] and Config.HazardLevels[level].label or "Unbekannt"
            TriggerClientEvent('QBCore:Notify', -1, "Gefahrenstufe geändert: " .. label, "primary")
        end)
    end
end)

RegisterNetEvent('nui_police:server:deleteDirective', function(id)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if player.PlayerData.job.grade.level >= Config.DirectivesPermissions then
        MySQL.query('DELETE FROM police_directives WHERE id = ?', {id}, function()
            TriggerClientEvent('nui_police:client:refreshDirectives', -1)
        end)
    end
end)

-- NUI LABS | Unified Directive Update
RegisterNetEvent('nui_police:server:updateDirective', function(data)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    
    if player and player.PlayerData.job.grade.level >= Config.DirectivesPermissions then
        if data.id and data.title and data.content then
            MySQL.update('UPDATE police_directives SET title = ?, content = ? WHERE id = ?', {
                data.title, 
                data.content, 
                data.id
            }, function(rowsChanged)
                if rowsChanged > 0 then
                    TriggerClientEvent('nui_police:client:refreshDirectives', -1)
                    TriggerClientEvent('QBCore:Notify', src, "Anweisung aktualisiert", "success")
                end
            end)
        end
    end
end)