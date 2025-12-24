-- [[ NUI LABS: SERVER SIDE - HYBRID SYNC ]] --

-- [[ NUI LABS: PLAYER MANAGEMENT ACTIONS ]] --

local QBCore = exports['qb-core']:GetCoreObject()

-- [[ NUI LABS: PERMISSION SYSTEM V2 ]] --

local QBCore = nil
local ESX = nil

-- [[ DEBUG INIT ]] --
-- Versuch 1: Standard Export
pcall(function() 
    QBCore = exports['qb-core']:GetCoreObject() 
end)

if QBCore then
    print("^2[NUI LABS DEBUG] ^7QBCore successfully loaded via Export.")
else
    print("^1[NUI LABS DEBUG] ^7QBCore Export failed / is NIL. Trying Legacy Trigger...")
    -- Versuch 2: Legacy Event (für ältere Server)
    TriggerEvent('QBCore:GetObject', function(obj) QBCore = obj end)
end

if GetResourceState('es_extended') == 'started' then
    TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
end

-- [[ NUI LABS: PERMISSION SYSTEM (FIXED V3) ]] --
local function HasPerms(src, actionName)
    -- Sicherheits-Check: Config muss da sein
    if not Config then return false end

    -- Welcher Rang wird benötigt? (Standard: god)
    local requiredGroup = Config.Permissions[actionName] or 'god'
    
    -- [[ 0. LOGIC: USER ACCESS ]]
    -- Wenn nur 'user' verlangt wird, lassen wir JEDEN durch.
    if requiredGroup == 'user' then return true end

    -- [[ 1. MASTER ACE OVERRIDE (Server Console / God) ]]
    -- Wenn du in der server.cfg "add_ace group.admin command allow" hast, kommst du immer rein.
    if IsPlayerAceAllowed(src, 'command') or IsPlayerAceAllowed(src, 'all') then return true end

    -- [[ 2. QBCore LOGIC ]]
    if QBCore then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then
            -- A: Master Key (God darf alles)
            if QBCore.Functions.HasPermission(src, 'god') then return true end
            if QBCore.Functions.HasPermission(src, 'admin') then return true end
            
            -- B: Spezifischer Check
            if QBCore.Functions.HasPermission(src, requiredGroup) then return true end
        end
    end

    -- [[ 3. ESX LOGIC ]]
    if ESX then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            local g = xPlayer.getGroup()
            -- Master Keys
            if g == 'god' or g == '_dev' or g == 'superadmin' then return true end
            -- Admin darf meistens auch alles
            if g == 'admin' and requiredGroup ~= 'god' then return true end
            -- Exakter Match
            if g == requiredGroup then return true end
        end
    end

    -- [[ 4. STANDALONE / ACE FALLBACK ]]
    if IsPlayerAceAllowed(src, requiredGroup) or IsPlayerAceAllowed(src, 'command.'..requiredGroup) then return true end
    if IsPlayerAceAllowed(src, 'god') or IsPlayerAceAllowed(src, 'admin') then return true end

    -- [[ 5. ACCESS DENIED DEBUG ]]
    -- Nur printen, wenn es NICHT 'open_menu' ist, um Spam zu vermeiden, 
    -- aber hier sehen wir, warum es scheitert.
    if actionName == 'open_menu' then
        print("^1[NUI LABS PERM DEBUG] ID: "..src.." hat KEINE Rechte für: "..requiredGroup)
    end
    
    return false
end

-- [[ NUI LABS: GET USER RANK HELPER ]]
-- [[ NUI LABS: SMART RANK DETECTION ]]
local function GetUserRank(src)
    local rank = 'user' -- Default Start
    local name = GetPlayerName(src)

    -- [[ 1. QBCORE CHECK ]]
    if QBCore then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then
            -- A: Permission Function Check
            if QBCore.Functions.HasPermission(src, 'god') then rank = 'god'
            elseif QBCore.Functions.HasPermission(src, 'admin') then rank = 'admin'
            end

            -- B: String Fallback (Falls Function versagt) - oft sicherer!
            local pGroup = Player.PlayerData.permission
            if type(pGroup) == 'string' then
                if pGroup == 'god' or pGroup == 'superadmin' then rank = 'god'
                elseif pGroup == 'admin' and rank ~= 'god' then rank = 'admin'
                end
            end
            
            -- C: Job Check (Manche Server nutzen Jobs als Admin)
            -- if Player.PlayerData.job.name == 'admin' then rank = 'admin' end
        end
    end

    -- [[ 2. ESX CHECK ]]
    if ESX and rank == 'user' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            local g = xPlayer.getGroup()
            if g == 'god' or g == 'superadmin' or g == '_dev' then rank = 'god'
            elseif g == 'admin' then rank = 'admin'
            end
        end
    end

    -- [[ 3. ACE / NATIVE FALLBACK (Rettungsanker) ]]
    if rank == 'user' then
        if IsPlayerAceAllowed(src, 'command') or IsPlayerAceAllowed(src, 'command.god') then 
            rank = 'god'
        elseif IsPlayerAceAllowed(src, 'command.admin') or IsPlayerAceAllowed(src, 'group.admin') then 
            rank = 'admin'
        end
    end

    -- [[ DEBUG AUSGABE ]]
    -- Schau in deine Konsole, was hier steht!
    print("^5[NUI LABS RANK] ^7ID: " .. src .. " | Name: " .. name .. " | Rank detected: " .. string.upper(rank))

    return rank
end

RegisterNetEvent('nui_funmenu:checkOpenAccess', function()
    local src = source
    local name = GetPlayerName(src)
    
    if HasPerms(src, 'open_menu') then
        -- Wir holen den Rang und schicken ihn mit der Config zum Client
        local myRank = GetUserRank(src)
        TriggerClientEvent('nui_funmenu:openMenuAllowed', src, Config.Permissions, myRank)
    else
        TriggerClientEvent('nui_funmenu:notify', src, "NUI ADMINMENU: ACCESS DENIED (Server Console Check)", "error")
    end
end)

local function BanPlayer(src)
    MySQL.insert('INSERT INTO bans (name, license, discord, ip, reason, expire, bannedby) VALUES (?, ?, ?, ?, ?, ?, ?)', {
        GetPlayerName(src),
        QBCore.Functions.GetIdentifier(src, 'license'),
        QBCore.Functions.GetIdentifier(src, 'discord'),
        QBCore.Functions.GetIdentifier(src, 'ip'),
        'Trying to revive theirselves or other players',
        2147483647,
        'qb-adminmenu'
    })
    TriggerEvent('qb-log:server:CreateLog', 'adminmenu', 'Player Banned', 'red', string.format('%s was banned by %s for %s', GetPlayerName(src), 'qb-adminmenu', 'Trying to trigger admin options which they dont have permission for'), true)
    DropPlayer(src, 'You were permanently banned by the server for: Exploiting')
end

-- 1. KICK PLAYER
RegisterNetEvent('nui_funmenu:killPlayer', function(targetId)
    local src = source
    if not HasPerms(src, 'kill') then return end

    TriggerClientEvent('hospital:client:KillPlayer', targetId)
end)

-- 2. REVIVE PLAYER
RegisterNetEvent('nui_funmenu:revivePlayer', function(targetId)
    local src = source
    if not HasPerms(src, 'revive') then return end

    -- Trigger Client Event beim Ziel
    TriggerClientEvent('hospital:client:Revive', targetId) -- QBCore Standard
    TriggerClientEvent('esx_ambulancejob:revive', targetId) -- ESX Standard
end)

-- 4. GO TO PLAYER
RegisterNetEvent('nui_funmenu:gotoPlayer', function(targetId)
    local src = source
    
    local targetPed = GetPlayerPed(targetId)
    if not DoesEntityExist(targetPed) then return end
    
    local coords = GetEntityCoords(targetPed)
    local srcPed = GetPlayerPed(src)
    SetEntityCoords(srcPed, coords.x, coords.y, coords.z)
end)

-- 5. BRING PLAYER
RegisterNetEvent('nui_funmenu:bringPlayer', function(targetId)
    local src = source
    if not HasPerms(src, 'bring') then return end
    
    local srcPed = GetPlayerPed(src)
    local coords = GetEntityCoords(srcPed)
    local targetPed = GetPlayerPed(targetId)
    
    SetEntityCoords(targetPed, coords.x, coords.y, coords.z)
end)

-- 11. SIT IN VEHICLE (SERVER FIX)
RegisterNetEvent('nui_funmenu:sitInVehicle', function(targetId)
    local src = source
    local target = tonumber(targetId)

    if not HasPerms(src, 'intovehicle') then return end

    local adminPed = GetPlayerPed(src)
    local targetPed = GetPlayerPed(target)
    
    -- Prüfen ob Ziel im Fahrzeug ist
    local vehicle = GetVehiclePedIsIn(targetPed, false)
    
    if vehicle ~= 0 then
        -- Suche freien Sitzplatz (Server-Side Logic)
        local seat = -1
        for i = -1, 6 do -- -1 = Driver, 0 = Passenger, etc.
            -- GetPedInVehicleSeat gibt 0 zurück, wenn der Sitz leer ist
            if GetPedInVehicleSeat(vehicle, i) == 0 then
                seat = i
                break
            end
        end
        
        if seat ~= -1 then
            SetPedIntoVehicle(adminPed, vehicle, seat)
        else
            print("^1[NUI LABS] Kein freier Sitzplatz gefunden.")
        end
    end
end)

-- 7. OPEN INVENTORY (CRASH PROOF)
RegisterNetEvent('nui_funmenu:openInventory', function(targetId)
    local src = source
    local target = tonumber(targetId)

    if not HasPerms(src, 'inventory') then 
        print("^1[NUI LABS] Keine Rechte für Inventory")
        return 
    end
    
    print("^3[NUI LABS] Versuche Inventar zu öffnen für Target: " .. tostring(target))

    -- Helper Funktion für sicheren Export-Aufruf
    local function TryExport(resName, exportName, ...)
        if GetResourceState(resName) ~= 'started' then return false end
        
        -- pcall fängt den Crash ab, falls der Export nicht existiert
        local success, result = pcall(function(...) 
            return exports[resName][exportName](...) 
        end, ...)
        
        if success then
            print("^2[NUI LABS] Erfolg mit " .. resName .. ":" .. exportName)
            return true
        else
            print("^3[NUI LABS] Export fehlgeschlagen ("..resName.."): " .. tostring(result))
            return false
        end
    end

    if TryExport('ox_inventory', 'forceOpenInventory', src, 'player', target) then return end


    if TryExport('qb-inventory', 'OpenInventoryById', src, target) then return end
    if TryExport('qb-inventory', 'OpenInventory', src, target) then return end

    -- [[ METHODE 3: PS / LJ INVENTORY (Forks) ]]
    if TryExport('ps-inventory', 'OpenInventoryById', src, target) then return end
    if TryExport('lj-inventory', 'OpenInventoryById', src, target) then return end
    if TryExport('lj-inventory', 'OpenInventory', src, target) then return end


    print("^3[NUI LABS] Versuche Command Fallback...")
    if QBCore then
        -- Versuche den Standard Admin Befehl
        ExecuteCommand("inventory " .. target)
    end
end)

RegisterNetEvent('nui_funmenu:spectatePlayer', function(targetId)
    local src = source
    -- Berechtigungs-Check
    if not HasPerms(src, 'spectate') then return end

    local targetped = GetPlayerPed(targetId)
    local coords = GetEntityCoords(targetped)
    
    -- FIX: Der Event-Name muss mit deinem Client-Event übereinstimmen!
    -- Vorher stand hier 'qb-admin:client:spectate', das war falsch.
    TriggerClientEvent('nui_funmenu:client:spectate', src, targetId, coords)
end)

-- 10. FREEZE PLAYER
local frozen = false

-- 10. FREEZE PLAYER (CLIENT TRIGGER FIX)

RegisterNetEvent('nui_funmenu:freezePlayer', function(targetId, state)
    local src = source
    local target = tonumber(targetId)
    
    if not HasPerms(src, 'freeze') then return end

    
    TriggerClientEvent('nui_funmenu:client:freeze', target, state)
    
    -- Debug Print
    local statusText = state and "FROZEN" or "UNFROZEN"
    print("^2[NUI LABS] Player " .. target .. " was " .. statusText .. " by ID " .. src)
end)

RegisterNetEvent('nui_funmenu:openInventory', function(targetId)
    local src = source
    local target = tonumber(targetId)

    if not HasPerms(src, 'inventory') then return end

    exports['qb-inventory']:OpenInventoryById(src, target)
end)

-- 8. CLOTHING MENU
RegisterNetEvent('nui_funmenu:openClothing', function(targetId)
    local src = source
    if not HasPerms(src, 'clothing') then return end
    
    TriggerClientEvent('qb-clothing:client:openMenu', targetId) -- QBCore
    TriggerClientEvent('esx_skin:openSaveableMenu', targetId) -- ESX
end)

RegisterNetEvent("nui_funmenu:requestBlackout", function(state)
    local src = source
    print('^5[NUI LABS] ^7Processing Blackout Request: ' .. tostring(state))


    GlobalState.Blackout = state

    if GetResourceState('qb-weathersync') == 'started' then
        
        -- Versuche Export (Neuer Standard)
        if exports['qb-weathersync'] and exports['qb-weathersync'].setBlackout then
            exports['qb-weathersync']:setBlackout(state)
        else

            TriggerEvent('qb-weathersync:server:toggleBlackout')
        end
        print('^5[NUI LABS] ^7Synced with qb-weathersync')
    end

    if GetResourceState('vSync') == 'started' then
        TriggerEvent('vSync:requestBlackout', state)
    end
    TriggerClientEvent("nui_funmenu:setBlackoutState", -1, state)
end)

-- [[ NUI LABS: PLAYER COUNT SYNC DEBUG ]] --
RegisterNetEvent('nui_funmenu:reqPlayerCount', function()
    local src = source
    local activePlayers = GetNumPlayerIndices()
    local maxPlayers = GetConvarInt('sv_maxclients', 36)
    
    -- Fallback
    if maxPlayers == 0 then maxPlayers = 36 end

    -- DEBUG PRINT: Das erscheint in deiner Server-Konsole (CMD)
    print('^5[NUI LABS DEBUG] ^7Server sending stats to ID '..src..': '..activePlayers..' / '..maxPlayers)
    
    TriggerClientEvent('nui_funmenu:receivePlayerCount', src, activePlayers, maxPlayers)
end)

-- [[ NUI LABS: PLAYER LIST FETCH ]] --
RegisterNetEvent('nui_funmenu:reqPlayerList', function()
    local src = source
    local playerList = {}
    local players = GetPlayers()

    for _, playerId in ipairs(players) do
        local id = tonumber(playerId)
        local name = GetPlayerName(playerId)
        
        table.insert(playerList, {
            id = id,
            name = name
        })
    end

    -- Sort by ID (Ascending: 1, 2, 3...)
    table.sort(playerList, function(a, b) return a.id < b.id end)

    TriggerClientEvent('nui_funmenu:receivePlayerList', src, playerList)
end)

-- Updated Give Weapon Event
RegisterServerEvent('nui_funmenu:giveWeapon', function(weapon)
    local src = source

    if not HasPerms(src, 'give_weapon') then 

        print("^1[NUI LABS SECURITY] User " .. src .. " tried to spawn weapon without perms.^7")
        return
    end

    exports['qb-inventory']:AddItem(src, weapon, 1, false, false, 'nui_funmenu:giveWeapon')
end)

-- [[ NUI LABS: SMART DATA FETCHER ]] --

-- Versuch Framework zu laden (Auto-Detect)
local ESX = nil
local QBCore = nil

if GetResourceState('es_extended') == 'started' then
    TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
end
if GetResourceState('qb-core') == 'started' then
    QBCore = exports['qb-core']:GetCoreObject()
end

RegisterNetEvent('nui_funmenu:reqPlayerDetails', function(targetId)
    local src = source
    
    -- [[ NUI LABS FIX: HANDLE NIL TARGET ]]
    -- If targetId is nil, 0, or invalid, default to src (Self)
    local target = tonumber(targetId)
    if not target or target == 0 then
        target = src
    end
    
    -- Ensure target exists before calling GetPlayerName
    if not GetPlayerName(target) then
        -- Fallback if target disconnected
        return 
    end

    -- [[ NUI LABS: DEFAULT DATA ]]
    local fivemName = GetPlayerName(target) or "Unknown"
    
    local data = {
        name = fivemName,        
        fivem_name = fivemName,  
        dob = "N/A",
        nationality = "N/A",
        job = "N/A",
        gang = "N/A",
        cash = 0,
        bank = 0,
        black = 0,
        health = 0,
        armor = 0,
        food = 100,
        water = 100,
        ping = GetPlayerPing(target),
        discord = "N/A",
        id = target
    }

    -- PED Data (Live GTA Data)
    local ped = GetPlayerPed(target)
    if DoesEntityExist(ped) then
        data.health = math.floor((GetEntityHealth(ped) - 100) / (GetEntityMaxHealth(ped) - 100) * 100)
        if data.health < 0 then data.health = 0 end
        data.armor = GetPedArmour(ped)
    end
    
    -- Identifier Fetch (Discord)
    for _, id in ipairs(GetPlayerIdentifiers(target)) do
        if string.find(id, "discord:") then
            data.discord = string.sub(id, 9) -- Remove 'discord:' prefix
            break
        end
    end

    -- [[ FRAMEWORK INTEGRATION ]] --
    
    -- ESX LOGIC
    if ESX then
        local xPlayer = ESX.GetPlayerFromId(target)
        if xPlayer then
            data.name = xPlayer.getName() -- RP Name
            data.dob = xPlayer.get('dateofbirth') or "N/A"
            data.job = xPlayer.job.label .. " - " .. xPlayer.job.grade_label
            data.nationality = xPlayer.getNationality()
            data.money = xPlayer.getMoney()
            data.bank = xPlayer.getAccount('bank').money
            local black = xPlayer.getAccount('black_money')
            if black then data.black = black.money end
        end
    end

    -- QBCORE LOGIC
    if QBCore then
        local Player = QBCore.Functions.GetPlayer(target)
        if Player then
            data.name = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname -- RP Name
            data.dob = Player.PlayerData.charinfo.birthdate
            data.nationality = Player.PlayerData.charinfo.nationality
            data.job = Player.PlayerData.job.label .. " (" .. Player.PlayerData.job.grade.name .. ")"
            data.gang = Player.PlayerData.gang.label
            data.cash = Player.PlayerData.money['cash']
            data.bank = Player.PlayerData.money['bank']
            data.black = Player.PlayerData.money['crypto'] or 0
            data.food = Player.PlayerData.metadata['hunger']
            data.water = Player.PlayerData.metadata['thirst']
        end
    end

    TriggerClientEvent('nui_funmenu:receivePlayerDetails', src, data)
end)

-- [[ NUI LABS: MONEY MANAGEMENT ]] --
RegisterNetEvent('nui_funmenu:manageMoney', function(data)
    local src = source
    if not HasPerms(src, 'admin') then return end -- Oder 'money' permission

    local amount = tonumber(data.amount)
    local mType = data.moneyType -- 'cash', 'bank', 'crypto'/'black_money'
    local targetId = src
    
    if data.targetId then
        targetId = tonumber(data.targetId)
    end

    local Player = nil
    if QBCore then
        Player = QBCore.Functions.GetPlayer(targetId)
        if Player then
            if amount > 0 then
                Player.Functions.AddMoney(mType, amount, "NUI LABS Admin")
                TriggerClientEvent('QBCore:Notify', src, "Added $"..amount.." ("..mType..") to ID "..targetId, "success")
            else
                Player.Functions.RemoveMoney(mType, math.abs(amount), "NUI LABS Admin")
                TriggerClientEvent('QBCore:Notify', src, "Removed $"..math.abs(amount).." ("..mType..") from ID "..targetId, "error")
            end
        end
    elseif ESX then
        local xPlayer = ESX.GetPlayerFromId(targetId)
        if xPlayer then
            -- ESX Mapping
            if mType == 'crypto' then mType = 'black_money' end
            if mType == 'cash' then mType = 'money' end
            
            if amount > 0 then
                xPlayer.addAccountMoney(mType, amount)
            else
                xPlayer.removeAccountMoney(mType, math.abs(amount))
            end
        end
    end
end)

-- [[ NUI LABS: GLOBAL SERVER ACTIONS ]] --

-- KILL ALL
RegisterNetEvent('nui_funmenu:kill_all', function()
    local src = source
    -- Security Check
    if not HasPerms(src, 'kill') then 
        print('^1[NUI LABS SECURITY] ^7Player '..src..' tried execute KILL ALL without perms.')
        return 
    end

    local players = GetPlayers()
    for _, playerId in ipairs(players) do
        local targetId = tonumber(playerId)
        -- Don't kill the admin who pressed the button (optional, currently kills everyone)
        if targetId ~= src then
            TriggerClientEvent('hospital:client:KillPlayer', targetId) -- QBCore
            TriggerClientEvent('esx_ambulancejob:kill', targetId)      -- ESX Fallback
        end
    end
    print('^1[NUI LABS ADMIN] ^7Player '..GetPlayerName(src)..' executed KILL ALL.')
end)

-- REVIVE ALL
RegisterNetEvent('nui_funmenu:revive_all', function()
    local src = source
    if not HasPerms(src, 'revive') then return end

    local players = GetPlayers()
    for _, playerId in ipairs(players) do
        local targetId = tonumber(playerId)
        
        -- Trigger Revive Logic
        TriggerClientEvent('hospital:client:Revive', targetId)       -- QBCore
        TriggerClientEvent('esx_ambulancejob:revive', targetId)      -- ESX Fallback
    end
    print('^2[NUI LABS ADMIN] ^7Player '..GetPlayerName(src)..' executed REVIVE ALL.')
end)

-- HEAL ALL
RegisterNetEvent('nui_funmenu:heal_all', function()
    local src = source
    if not HasPerms(src, 'revive') then return end 

    local players = GetPlayers()
    for _, playerId in ipairs(players) do
        local targetId = tonumber(playerId)
        
        -- Trigger Heal Logic
        TriggerClientEvent('hospital:client:HealInjuries', targetId, "full") -- QBCore
        TriggerClientEvent('esx_basicneeds:healPlayer', targetId)            -- ESX Fallback
    end
    print('^2[NUI LABS ADMIN] ^7Player '..GetPlayerName(src)..' executed HEAL ALL.')
end)

-- [[ NUI LABS: TIME SYNC ]]
RegisterNetEvent('nui_funmenu:setTime', function(hour, minute)
    local src = source
    if not HasPerms(src, 'weather') then return end -- 'weather' or 'admin' perm

    print('^5[NUI LABS] ^7Setting Time to ' .. hour .. ':' .. minute)

    -- 1. Try QB-Weathersync Export (Modern Way)
    if GetResourceState('qb-weathersync') == 'started' then
        if exports['qb-weathersync'] and exports['qb-weathersync'].setTime then
            exports['qb-weathersync']:setTime(hour, minute)
        else
            -- Fallback Event for older QB versions
            TriggerEvent('qb-weathersync:server:setTime', hour, minute)
        end
    
    -- 2. Try vSync or cd_easytime (Common Alternatives)
    elseif GetResourceState('vSync') == 'started' then
        TriggerEvent('vSync:time', hour, minute)
        
    -- 3. Native / Standalone Fallback
    else
        -- Note: Without a sync script, this might desync quickly or only work locally per client
        -- We trigger a client event to force it for everyone currently connected
        TriggerClientEvent('nui_funmenu:client:forceTime', -1, hour, minute)
    end
end)

-- [[ PHASE 7: DATABASE VEHICLE SAVING ]] --
-- [[ PHASE 7: DATABASE VEHICLE SAVING (DEBUG VERSION) ]] --
-- [[ PHASE 7: DATABASE VEHICLE SAVING (GARAGE FIX) ]] --
RegisterNetEvent('nui_funmenu:claimVehicle', function(vehicleProps, modelName)
    local src = source
    local plate = vehicleProps.plate
    
    -- Fallback falls Client keinen Namen gesendet hat
    local vehicleName = modelName or "unknown"

    print("^3[NUI LABS DEBUG] Claim Vehicle: " .. tostring(plate) .. " | Model: " .. vehicleName .. "^7")

    if not HasPerms(src, 'claim_vehicle') then return end

    local Player = nil
    local citizenId = nil
    local license = nil

    -- [[ 1. QBCore SAVE LOGIC ]]
    if QBCore then
        Player = QBCore.Functions.GetPlayer(src)
        if not Player then return end
        
        citizenId = Player.PlayerData.citizenid
        license = Player.PlayerData.license
        local hash = vehicleProps.model 

        -- Check Duplicates
        local result = MySQL.scalar.await('SELECT plate FROM player_vehicles WHERE plate = ?', { plate })
        
        if result then
            TriggerClientEvent('nui_funmenu:notify', src, "Vehicle is already owned! (Plate: " .. plate .. ")", "error")
        else
            -- WICHTIG: state = 0 (OUT), damit man es danach einparken kann!
            -- WICHTIG: vehicle = vehicleName (String), nicht Hash!
            local success, err = pcall(function()
                MySQL.insert('INSERT INTO player_vehicles (license, citizenid, vehicle, hash, mods, plate, garage, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
                    license,
                    citizenId,
                    vehicleName,    -- Hier muss der String stehen (z.B. "t20")
                    hash,           -- Hier der Hash
                    json.encode(vehicleProps),
                    plate,
                    'pillboxgarage', -- Standard Garage
                    0               -- 0 = AUSGEPARKT (Damit Garage weiß, es ist draußen)
                })
            end)

            if success then
                TriggerClientEvent('nui_funmenu:notify', src, "Vehicle claimed! You can now park it.", "success")
                -- Optional: Dem Spieler Schlüssel geben (Falls qb-vehiclekeys genutzt wird)
                TriggerClientEvent('qb-vehiclekeys:client:AddKeys', src, plate)
            else
                print("^1[SQL ERROR] " .. tostring(err) .. "^7")
                TriggerClientEvent('nui_funmenu:notify', src, "Database Error!", "error")
            end
        end

    -- [[ 2. ESX SAVE LOGIC ]]
    elseif ESX then
        local xPlayer = ESX.GetPlayerFromId(src)
        citizenId = xPlayer.identifier
        
        local result = MySQL.scalar.await('SELECT plate FROM owned_vehicles WHERE plate = ?', { plate })

        if result then
            TriggerClientEvent('nui_funmenu:notify', src, "Vehicle is already owned!", "error")
        else
            MySQL.insert('INSERT INTO owned_vehicles (owner, plate, vehicle, type, stored) VALUES (?, ?, ?, ?, ?)', {
                citizenId,
                plate,
                json.encode(vehicleProps),
                'car',
                0 -- 0 = Out
            })
            TriggerClientEvent('nui_funmenu:notify', src, "Vehicle claimed! You can now park it.", "success")
        end
    end
end)

-- [[ NUI LABS: BAN HAMMER LOGIC ]]
RegisterNetEvent('nui_funmenu:banPlayer', function(targetId, duration, reason)
    local src = source
    local target = tonumber(targetId)
    local myRank = GetUserRank(src)
    local maxDuration = Config.BanSystem.MaxBanDuration[myRank] or 0
    
    if maxDuration == 0 then 
        TriggerClientEvent('nui_funmenu:notify', src, "You are not allowed to ban!", "error")
        return 
    end
    
    -- Prüfen: Ist der Ban länger als erlaubt? (-1 ist Perma)
    if duration == -1 and maxDuration ~= -1 then
        TriggerClientEvent('nui_funmenu:notify', src, "You cannot ban permanently! Max: " .. maxDuration .. "h", "error")
        return
    end
    if duration > maxDuration and maxDuration ~= -1 then
        TriggerClientEvent('nui_funmenu:notify', src, "Duration too long! Max: " .. maxDuration .. "h", "error")
        return
    end

    -- 2. Daten sammeln
    local targetName = GetPlayerName(target)
    local adminName = GetPlayerName(src)
    
    -- Alle Identifier sammeln (Full Protection)
    local license, discord, ip, xbox, liveid = "N/A", "N/A", "N/A", "N/A", "N/A"
    for _, v in pairs(GetPlayerIdentifiers(target)) do
        if string.find(v, "license:") then license = v end
        if string.find(v, "discord:") then discord = v end
        if string.find(v, "ip:") then ip = v end
        if string.find(v, "xbl:") then xbox = v end
        if string.find(v, "live:") then liveid = v end
    end

    -- 3. Ablaufdatum berechnen (Unix Timestamp)
    local expireDate = 0
    local timeText = "PERMANENT"
    if duration ~= -1 then
        expireDate = os.time() + (duration * 3600) -- Stunden in Sekunden
        timeText = duration .. " Hours"
    end

    -- 4. Datenbank Eintrag (SQL)
    local banId = "BAN-" .. math.random(10000, 99999)
    
    -- [[ FIX: HIER WAR DER CODE ABGESCHNITTEN ]]
    MySQL.insert('INSERT INTO nui_bans (ban_id, name, license, discord, ip, xbox, liveid, reason, banned_by, ban_date, expire_date, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', {
        banId, targetName, license, discord, ip, xbox, liveid, reason, adminName, os.time(), expireDate, 1
    })

    -- 5. Spieler Kicken (Mit schöner Nachricht)
    local kickMsg = string.format("\n🛡️ NUI LABS SECURITY 🛡️\n\n⛔ YOU ARE BANNED!\nReason: %s\nDuration: %s\nAdmin: %s\nBan-ID: %s", reason, timeText, adminName, banId)
    DropPlayer(target, kickMsg)
    
    TriggerClientEvent('nui_funmenu:notify', src, "Player " .. targetName .. " has been banned ("..timeText..").", "success")
end)

-- [[ NUI LABS: BAN LIST MANAGEMENT ]] --

-- Ban List abrufen
RegisterNetEvent('nui_funmenu:reqBanList', function()
    local src = source
    -- [[ DEBUG PRINT 1: NETZWERK TEST ]]
    print("^3[NUI LABS DEBUG] reqBanList Event triggered by ID: " .. src)

    -- Permission Check
    if not HasPerms(src, 'ban') then 
        print("^1[NUI LABS DEBUG] Access DENIED for ID: " .. src)
        return 
    end
    
    print("^3[NUI LABS DEBUG] Access GRANTED. Querying Database...")

    local bans = MySQL.query.await('SELECT * FROM nui_bans WHERE active = 1 ORDER BY id DESC')
    
    if bans then
        print("^2[NUI LABS DEBUG] SQL Success. Found " .. #bans .. " bans. Sending to client.")
        TriggerClientEvent('nui_funmenu:receiveBanList', src, bans)
    else
        print("^1[NUI LABS ERROR] Ban fetch failed or empty result.")
        TriggerClientEvent('nui_funmenu:receiveBanList', src, {})
    end
end)

-- Spieler entbannen
RegisterNetEvent('nui_funmenu:unbanPlayer', function(banDbId)
    local src = source
    if not HasPerms(src, 'ban') then return end
    
    local id = tonumber(banDbId)
    MySQL.update('UPDATE nui_bans SET active = 0 WHERE id = ?', {id})
    
    TriggerClientEvent('nui_funmenu:notify', src, "Player unbanned (DB ID: " .. id .. ")", "success")
    -- Refresh Liste beim Admin
    local bans = MySQL.query.await('SELECT * FROM nui_bans WHERE active = 1 ORDER BY id DESC')
    TriggerClientEvent('nui_funmenu:receiveBanList', src, bans)
end)

-- [[ NUI LABS: CONNECT PROTECTION (QUEUE COMPATIBLE) ]] --
AddEventHandler('playerConnecting', function(name, setKickReason, deferrals)
    local src = source
    local identifiers = GetPlayerIdentifiers(src)
    local license, discord, ip = "N/A", "N/A", "N/A"
    
    deferrals.defer()
    Wait(0)
    deferrals.update("🛡️ NUI LABS: Analyzing Security Data...")

    -- 1. Identifiers sammeln
    for _, v in pairs(identifiers) do
        if string.find(v, "license:") then license = v end
        if string.find(v, "discord:") then discord = v end
        if string.find(v, "ip:") then ip = v end
    end

    print("^3[NUI LABS DEBUG] Checking Ban for: " .. name)

    -- 2. Datenbank Abfrage (Safe Mode)
    local success, result = pcall(function()
        return MySQL.query.await("SELECT * FROM nui_bans WHERE active = 1 AND (license = ? OR discord = ? OR ip = ?)", {license, discord, ip})
    end)

    if not success then
        print("^1[NUI LABS ERROR] SQL Query Failed! Allowing connection to prevent hang.")
        deferrals.done()
        return
    end

    -- 3. Prüfen ob Ban existiert
    if result and #result > 0 then
        local ban = result[1]
        local currentTime = os.time()
        
        -- Ist Ban abgelaufen?
        if ban.expire_date ~= 0 and ban.expire_date < currentTime then
            MySQL.update('UPDATE nui_bans SET active = 0 WHERE id = ?', {ban.id})
            deferrals.done() -- Reinlassen
            return
        end

        print("^1[NUI LABS] Blocking Connection for " .. name .. " (Banned)")

        local dateString = (ban.expire_date == 0) and "PERMANENT (NEVER)" or os.date("%d.%m.%Y %H:%M", ban.expire_date)

        -- [[ HARD REJECT MESSAGE ]]
        local cardText = string.format([[
        
        ⛔  NUI LABS SECURITY  ⛔
        ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        
        🛑 ACCESS DENIED - YOU ARE BANNED
        
        👤 User: %s
        📅 Expires: %s
        🔨 Banned by: %s
        
        📝 Reason:
        "%s"
        
        🆔 Ban-ID: %s
        
        ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        If you think this is a mistake, support is available.
        ]], name, dateString, ban.banned_by, ban.reason, ban.ban_id)

        deferrals.done(cardText)
        return 
    end

    deferrals.done() 
end)

-- [[ NUI LABS: TROLL SYSTEM V2 (DEBUG & SECURE) ]] --
RegisterNetEvent('nui_funmenu:trollAction', function(targetId, type, state)
    local src = source
    
    -- 1. Debug Print: Kommt der Befehl überhaupt an?
    print("^3[NUI DEBUG] Troll Request von ID: " .. src .. " | Ziel: " .. tostring(targetId) .. " | Type: " .. tostring(type) .. "^7")

    -- 2. Security Check
    if not HasPerms(src, 'troll_action') then 
        print("^1[NUI ERROR] User "..src.." hat keine 'troll_action' Rechte!^7")
        TriggerClientEvent('nui_funmenu:notify', src, "Keine Berechtigung (troll_action fehlt)!", "error")
        return 
    end 

    local target = tonumber(targetId)
    
    -- 3. Existiert das Ziel?
    if target and GetPlayerPing(target) > 0 then
        -- State Info für Log
        local stateInfo = "N/A"
        if state ~= nil then stateInfo = tostring(state) end

        print("^2[NUI DEBUG] Sende Troll an Client ID: " .. target .. " (State: " .. stateInfo .. ")^7")

        -- 4. An Client senden
        TriggerClientEvent('nui_funmenu:client:executeTroll', target, type, state)
        
        -- Feedback an Admin
        TriggerClientEvent('nui_funmenu:notify', src, "Troll gesendet: " .. type, "success")
    else
        print("^1[NUI ERROR] Spieler mit ID " .. tostring(target) .. " nicht gefunden!^7")
        TriggerClientEvent('nui_funmenu:notify', src, "Spieler nicht gefunden!", "error")
    end
end)

-- [[ NUI LABS: DELETE ENTITY SERVER SIDE ]] --
RegisterNetEvent('nui_funmenu:deleteEntity', function(netId)
    local src = source
    -- Kurzer Permission Check (Sicherheit)
    if not HasPerms(src, 'dev_delete_laser') and not HasPerms(src, 'open_menu') then return end

    local entity = NetworkGetEntityFromNetworkId(netId)
    if DoesEntityExist(entity) then
        DeleteEntity(entity)
        TriggerClientEvent('nui_funmenu:notify', src, "Entity permanently deleted via Network.", "success")
    else
        TriggerClientEvent('nui_funmenu:notify', src, "Entity not found on server side!", "error")
    end
end)



-- [[ NUI LABS: ANNOUNCEMENT SERVER (SMART TYPE) ]] --
RegisterNetEvent('nui_funmenu:server:announce', function(title, message, showName, targetId)
    local src = source
    
    if not HasPerms(src, 'open_menu') then return end 

    local authorName = nil
    if showName then
        authorName = GetPlayerName(src)
    end

    -- Globale Announcements bleiben länger, Private sind kürzer (angenehmer)
    local duration = Config.Announcement.Duration or 6000

    if targetId and tonumber(targetId) then
        local target = tonumber(targetId)
        if GetPlayerPing(target) > 0 then
            -- [[ SEND PRIVATE TYPE ]]
            TriggerClientEvent('nui_funmenu:client:announce', target, title, message, authorName, duration, "private")
            
            TriggerClientEvent('nui_funmenu:notify', src, "Message sent to ID: " .. target, "success")
        else
            TriggerClientEvent('nui_funmenu:notify', src, "Player not found!", "error")
        end
    else
        -- [[ SEND GLOBAL TYPE ]]
        TriggerClientEvent('nui_funmenu:client:announce', -1, title, message, authorName, duration, "global")
        
        TriggerClientEvent('nui_funmenu:notify', src, "Global Announcement sent!", "success")
    end
end)

-- [[ NUI LABS: PERMISSION CACHE SERVER SIDE ]] --
RegisterNetEvent('nui_funmenu:reqAccess', function()
    local src = source
    
    -- Wir prüfen hier nur, ob er das Menü ÜBERHAUPT öffnen darf
    local allowed = HasPerms(src, 'open_menu')
    local rank = GetUserRank(src)
    
    -- Sende Ergebnis zurück an Client zum Speichern
    TriggerClientEvent('nui_funmenu:setAccess', src, rank, allowed)
end)

-- 1. KICK PLAYER (UPDATED WITH REASON)
RegisterNetEvent('nui_funmenu:kickPlayer', function(targetId, reason)
    local src = source
    if not HasPerms(src, 'kick') then return end

    local target = tonumber(targetId)
    local adminName = GetPlayerName(src)
    
    -- Fallback Reason
    if not reason or reason == "" then reason = "No reason specified" end

    -- Schönere Kick Message
    local kickMsg = string.format("\n\n👢 NUI LABS ADMIN\n\nYou have been KICKED by %s.\nReason: %s", adminName, reason)

    DropPlayer(target, kickMsg)
    
    -- Notify Admin
    TriggerClientEvent('nui_funmenu:notify', src, "Player kicked successfully.", "success")
end)

-- [[ NUI LABS: GLOBAL BLIP SYSTEM (ONESYNC SUPPORT) ]] --
RegisterNetEvent('nui_funmenu:reqGlobalBlips', function()
    local src = source
    if not HasPerms(src, 'spectate') and not HasPerms(src, 'blips') then return end

    local blipData = {}
    local players = GetPlayers()

    for _, playerId in ipairs(players) do
        local id = tonumber(playerId)
        local ped = GetPlayerPed(id)
        
        -- Server weiß immer wo alle sind (wenn OneSync an ist)
        if DoesEntityExist(ped) then
            local coords = GetEntityCoords(ped)
            local heading = GetEntityHeading(ped)
            local veh = GetVehiclePedIsIn(ped, false)
            local isInVehicle = (veh ~= 0)
            local name = GetPlayerName(id)
            
            table.insert(blipData, {
                id = id,
                coords = coords,
                heading = heading,
                name = name,
                isVeh = isInVehicle,
                isSelf = (id == src) -- Markierung ob man es selbst ist
            })
        end
    end

    TriggerClientEvent('nui_funmenu:updateGlobalBlips', src, blipData)
end)