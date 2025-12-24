-- [[ NUI LABS: CLIENT INITIALIZATION ]] --
local QBCore = exports['qb-core']:GetCoreObject()

local isMenuOpen = false
local blipCache = {}
local lastBlackoutTime = 0
local isAdminFrozen = false

-- Feature States
local features = {
    godmode = false,
    noclip = false, -- Handled by new noclip system
    superJump = false,
    fastRun = false,
    invisible = false,
    names = false,
    blips = false,
    -- PHASE 5 VEHICLES:
    speedBoost = false,
    rainbow = false,
    vehicleGodmode = false,
    -- PHASE 6 WORLD MAYHEM:
    superPunch = false,
    explosiveAmmo = false,
    infiniteAmmo = false,     
    freezeTime = false,
    blackout = false,
}

-- [[ NUI LABS: NOCLIP VARIABLES ]] --
local IsNoClipping      = false
local NoClipPlayerPed   = nil
local NoClipEntity      = nil
local NoClipCamera      = nil
local NoClipAlpha       = nil
local PlayerIsInVehicle = false
local MinY, MaxY        = -89.0, 89.0

-- [[ NUI LABS: PERFORMANCE CACHE ]] --
local hasAccess = false
local myRank = 'user'
local isPermissionsCached = false

-- Settings
local NoClipSpeed = 2.0
local frozenTime = {h = 12, m = 0} -- Stores time when frozen

-- Rainbow Color Variables
local rainbowHue = 0

-- Settings for NoClip
local noclipSpeed = 2.0

-- [[ NUI LABS: SPECTATE VARS ]] --
local lastSpectateCoord = nil
local spectateData = {
    active = false,
    cam = nil,
    target = nil,
    oldCoords = nil,
    oldVeh = nil,
    oldSeat = nil
}

-- Blip & Name Management
local activeBlips = {}

local gamerTags = {}

-- [[ NUI LABS: PREFERENCES LOADER ]] --
local function LoadPlayerPrefs()
    -- Godmode Pref
    local kvpGod = GetResourceKvpString("nui_pref_godmode")
    if kvpGod == "true" then
        ToggleGodmode(true)
        -- Update NUI state wenn Menü öffnet
    end

    -- NoClip Speed Pref
    local kvpSpeed = GetResourceKvpFloat("nui_pref_noclip_speed")
    if kvpSpeed > 0.0 then
        NoClipSpeed = kvpSpeed
    end
end

-- Beim Start laden
Citizen.CreateThread(function()
    Citizen.Wait(2000) -- Kurz warten bis alles geladen ist
    LoadPlayerPrefs()
end)



-- [[ NUI LABS: MATH HELPERS ]] --

local function GetCamDirection()
    local rot = GetGameplayCamRot(2)
    local pitch = rot.x
    local heading = rot.z
    local x = -math.sin(heading * math.pi / 180.0)
    local y = math.cos(heading * math.pi / 180.0)
    local z = math.sin(pitch * math.pi / 180.0)
    local len = math.sqrt(x * x + y * y + z * z)
    if len ~= 0 then x = x / len; y = y / len; z = z / len end
    return x, y, z
end

local function GetCamRightVector()
    local rot = GetGameplayCamRot(2)
    local heading = rot.z
    local x = math.cos(heading * math.pi / 180.0)
    local y = math.sin(heading * math.pi / 180.0)
    return x, y, 0
end

-- [[ NUI LABS: MATH HELPER FOR ROTATION ]] --
local function RotationToDirection(rotation)
    local adjustedRotation = vector3(
        (math.pi / 180) * rotation.x, 
        (math.pi / 180) * rotation.y, 
        (math.pi / 180) * rotation.z
    )
    local direction = vector3(
        -math.sin(adjustedRotation.z) * math.abs(math.cos(adjustedRotation.x)), 
        math.cos(adjustedRotation.z) * math.abs(math.cos(adjustedRotation.x)), 
        math.sin(adjustedRotation.x)
    )
    return direction
end

-- [[ NOTIFICATION HELPER ]] --
local function Notify(text, type)
    -- type: 'success' (grün) oder 'error' (rot)
    SendNUIMessage({
        type = "notify",
        message = text,
        style = type or 'info'
    })
end

-- [[ NUI LABS: ADVANCED NOCLIP SYSTEM ]] --

local function IsControlAlwaysPressed(inputGroup, control)
    return IsControlPressed(inputGroup, control) or IsDisabledControlPressed(inputGroup, control)
end

local function IsPedDrivingVehicle(ped, veh)
    return ped == GetPedInVehicleSeat(veh, -1)
end

local function SetupCam()
    local entityRot = GetEntityRotation(NoClipEntity)
    NoClipCamera = CreateCameraWithParams('DEFAULT_SCRIPTED_CAMERA', GetEntityCoords(NoClipEntity), vector3(0.0, 0.0, entityRot.z), 75.0)
    SetCamActive(NoClipCamera, true)
    RenderScriptCams(true, true, 1000, false, false)

    if PlayerIsInVehicle then
        AttachCamToEntity(NoClipCamera, NoClipEntity, 0.0, 0.5, 1.0, true) -- Car Offset
    else
        AttachCamToEntity(NoClipCamera, NoClipEntity, 0.0, 0.0, 1.0, true) -- Ped Offset
    end
end

local function DestroyCamera()
    SetGameplayCamRelativeHeading(0)
    RenderScriptCams(false, true, 1000, true, true)
    DetachEntity(NoClipEntity, true, true)
    SetCamActive(NoClipCamera, false)
    DestroyCam(NoClipCamera, true)
end

local function CheckInputRotation()
    local rightAxisX = GetControlNormal(0, 220)
    local rightAxisY = GetControlNormal(0, 221)

    local rotation = GetCamRot(NoClipCamera, 2)

    local yValue = rightAxisY * -5
    local newX
    local newZ = rotation.z + (rightAxisX * -10)
    if (rotation.x + yValue > MinY) and (rotation.x + yValue < MaxY) then
        newX = rotation.x + yValue
    end
    if newX ~= nil and newZ ~= nil then
        SetCamRot(NoClipCamera, vector3(newX, rotation.y, newZ), 2)
    end

    SetEntityHeading(NoClipEntity, math.max(0, (rotation.z % 360)))
end

local function DisableNoClipControls()
    HudWeaponWheelIgnoreSelection()
    DisableAllControlActions(0)
    DisableAllControlActions(1)
    DisableAllControlActions(2)
    EnableControlAction(0, 220, true)
    EnableControlAction(0, 221, true)
    EnableControlAction(0, 245, true)
    EnableControlAction(0, 200, true) -- ESC
end

local function StopNoClip()
    FreezeEntityPosition(NoClipEntity, false)
    SetEntityCollision(NoClipEntity, true, true)
    SetEntityVisible(NoClipEntity, true, false)
    SetLocalPlayerVisibleLocally(true)
    ResetEntityAlpha(NoClipEntity)
    ResetEntityAlpha(NoClipPlayerPed)
    
    SetEveryoneIgnorePlayer(NoClipPlayerPed, false)
    SetPoliceIgnorePlayer(NoClipPlayerPed, false)
    SetEntityInvincible(NoClipEntity, false)

    -- Logic to prevent falling through ground if stopped mid-air close to ground
    if GetVehiclePedIsIn(NoClipPlayerPed, false) ~= 0 then
        while (not IsVehicleOnAllWheels(NoClipEntity)) and not IsNoClipping do
            Wait(0)
        end
    end
end

local function RunNoClipThread()
    Citizen.CreateThread(function()
        while IsNoClipping do
            Citizen.Wait(0)
            CheckInputRotation()
            DisableNoClipControls()

            -- Speed Controls
            if IsControlAlwaysPressed(2, Config.NoClip.Controls.SPEED_DECREASE) then
                NoClipSpeed = NoClipSpeed - 0.5
                if NoClipSpeed < 0.5 then NoClipSpeed = 0.5 end
            elseif IsControlAlwaysPressed(2, Config.NoClip.Controls.SPEED_INCREASE) then
                NoClipSpeed = NoClipSpeed + 0.5
                if NoClipSpeed > Config.NoClip.MaxSpeed then NoClipSpeed = Config.NoClip.MaxSpeed end
            elseif IsDisabledControlJustReleased(0, Config.NoClip.Controls.SPEED_RESET) then
                NoClipSpeed = 1.0
            end

            local multi = 1.0
            if IsControlAlwaysPressed(0, Config.NoClip.Controls.SPEED_FAST_MODIFIER) then
                multi = 2
            elseif IsControlAlwaysPressed(0, Config.NoClip.Controls.SPEED_FASTER_MODIFIER) then
                multi = 4
            elseif IsControlAlwaysPressed(0, Config.NoClip.Controls.SPEED_SLOW_MODIFIER) then
                multi = 0.25
            end

            -- Movement Logic
            if IsControlAlwaysPressed(0, Config.NoClip.Controls.MOVE_FORWARDS) then
                local pitch = GetCamRot(NoClipCamera, 0)
                if pitch.x >= 0 then
                    SetEntityCoordsNoOffset(NoClipEntity, GetOffsetFromEntityInWorldCoords(NoClipEntity, 0.0, 0.5 * (NoClipSpeed * multi), (pitch.x * ((NoClipSpeed / 2) * multi)) / 89))
                else
                    SetEntityCoordsNoOffset(NoClipEntity, GetOffsetFromEntityInWorldCoords(NoClipEntity, 0.0, 0.5 * (NoClipSpeed * multi), -1 * ((math.abs(pitch.x) * ((NoClipSpeed / 2) * multi)) / 89)))
                end
            elseif IsControlAlwaysPressed(0, Config.NoClip.Controls.MOVE_BACKWARDS) then
                local pitch = GetCamRot(NoClipCamera, 2)
                if pitch.x >= 0 then
                    SetEntityCoordsNoOffset(NoClipEntity, GetOffsetFromEntityInWorldCoords(NoClipEntity, 0.0, -0.5 * (NoClipSpeed * multi), -1 * (pitch.x * ((NoClipSpeed / 2) * multi)) / 89))
                else
                    SetEntityCoordsNoOffset(NoClipEntity, GetOffsetFromEntityInWorldCoords(NoClipEntity, 0.0, -0.5 * (NoClipSpeed * multi), ((math.abs(pitch.x) * ((NoClipSpeed / 2) * multi)) / 89)))
                end
            end

            if IsControlAlwaysPressed(0, Config.NoClip.Controls.MOVE_LEFT) then
                SetEntityCoordsNoOffset(NoClipEntity, GetOffsetFromEntityInWorldCoords(NoClipEntity, -0.5 * (NoClipSpeed * multi), 0.0, 0.0))
            elseif IsControlAlwaysPressed(0, Config.NoClip.Controls.MOVE_RIGHT) then
                SetEntityCoordsNoOffset(NoClipEntity, GetOffsetFromEntityInWorldCoords(NoClipEntity, 0.5 * (NoClipSpeed * multi), 0.0, 0.0))
            end

            if IsControlAlwaysPressed(0, Config.NoClip.Controls.MOVE_UP) then
                SetEntityCoordsNoOffset(NoClipEntity, GetOffsetFromEntityInWorldCoords(NoClipEntity, 0.0, 0.0, 0.5 * (NoClipSpeed * multi)))
            elseif IsControlAlwaysPressed(0, Config.NoClip.Controls.MOVE_DOWN) then
                SetEntityCoordsNoOffset(NoClipEntity, GetOffsetFromEntityInWorldCoords(NoClipEntity, 0.0, 0.0, -0.5 * (NoClipSpeed * multi)))
            end

            local coords = GetEntityCoords(NoClipEntity)
            RequestCollisionAtCoord(coords.x, coords.y, coords.z)

            FreezeEntityPosition(NoClipEntity, true)
            SetEntityCollision(NoClipEntity, false, false)
            SetEntityVisible(NoClipEntity, false, false)
            SetEntityInvincible(NoClipEntity, true)
            SetLocalPlayerVisibleLocally(true)
            
            SetEntityAlpha(NoClipEntity, NoClipAlpha, false)
            if PlayerIsInVehicle then
                SetEntityAlpha(NoClipPlayerPed, NoClipAlpha, false)
            end
            
            SetEveryoneIgnorePlayer(NoClipPlayerPed, true)
            SetPoliceIgnorePlayer(NoClipPlayerPed, true)
        end
        StopNoClip()
    end)
end

local function ToggleNoClip(state)
    IsNoClipping      = state
    NoClipPlayerPed   = PlayerPedId()
    
    local veh = GetVehiclePedIsIn(NoClipPlayerPed, false)
    if veh ~= 0 and IsPedDrivingVehicle(NoClipPlayerPed, veh) then
        PlayerIsInVehicle = true
        NoClipEntity = veh
        SetVehicleEngineOn(NoClipEntity, not IsNoClipping, true, IsNoClipping)
        NoClipAlpha = 0 -- Invisible
    else
        PlayerIsInVehicle = false
        NoClipEntity = NoClipPlayerPed
        NoClipAlpha = 51 -- Semi visible ghost
    end

    if IsNoClipping then
        FreezeEntityPosition(NoClipPlayerPed, true)
        SetupCam()
        PlaySoundFromEntity(-1, 'SELECT', NoClipPlayerPed, 'HUD_LIQUOR_STORE_SOUNDSET', 0, 0)
        
        if not PlayerIsInVehicle then
            ClearPedTasksImmediately(NoClipPlayerPed)
        end
        
        RunNoClipThread()
    else
        -- Logic to drop player to ground safely
        local coords = GetEntityCoords(NoClipEntity)
        local foundGround, zPos = GetGroundZFor_3dCoord(coords.x, coords.y, coords.z - 0.5, 0)
        if foundGround then
            SetEntityCoords(NoClipEntity, coords.x, coords.y, zPos)
        end
        
        DestroyCamera()
        PlaySoundFromEntity(-1, 'CANCEL', NoClipPlayerPed, 'HUD_LIQUOR_STORE_SOUNDSET', 0, 0)
    end
    
    SetUserRadioControlEnabled(not IsNoClipping)
end

local function DrawText3D(x, y, z, text)
	SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(1)
    SetTextColour(255, 255, 255, 215)
    SetTextEntry("STRING")
    SetTextCentre(true)
    AddTextComponentString(text)
    SetDrawOrigin(x, y, z, 0)
    DrawText(0.0, 0.0)
    local factor = (string.len(text)) / 370
    DrawRect(0.0, 0.0 + 0.0125, 0.017 + factor, 0.03, 0, 0, 0, 75)
    ClearDrawOrigin()
end

-- [[ NUI LABS: OPTIMIZED FEATURE THREADS ]] --

-- [[ NUI LABS: GODMODE (ORIGINAL QB-ADMINMENU LOGIC + ANTI-EJECT) ]] --
local function ToggleGodmode(state)
    features.godmode = state
    
    -- Sound Feedback (Optional, wie bei QB)
    -- PlaySoundFrontend(-1, state and "SELECT" or "QUIT", "HUD_FRONTEND_DEFAULT_SOUNDSET", false)

    if state then
        Citizen.CreateThread(function()
            while features.godmode do
                local ped = PlayerPedId()
                local playerId = PlayerId()
                
                -- 1. Unsterblichkeit (Core)
                SetEntityInvincible(ped, true)
                SetPlayerInvincible(playerId, true)
                
                -- 2. Ragdoll verhindern (Das stoppt das Rausfliegen!)
                SetPedCanRagdoll(ped, false)
                SetPedCanRagdollFromPlayerImpact(ped, false)
                SetPedConfigFlag(ped, 32, false) -- PED_FLAG_CAN_FLY_THROUGH_WINDSCREEN (Aus!)
                
                -- 3. Optik & Status
                ClearPedBloodDamage(ped)
                ResetPedVisibleDamage(ped)
                ClearPedLastWeaponDamage(ped)
                SetEntityProofs(ped, true, true, true, true, true, true, true, true)
                
                -- 4. Schaden komplett deaktivieren (Redundanz)
                SetEntityCanBeDamaged(ped, false)
                SetEntityOnlyDamagedByPlayer(ped, false)

                Citizen.Wait(0) -- Muss 0 sein für Ragdoll-Schutz
            end
            
            -- [[ CLEANUP (Wenn aus) ]] --
            local ped = PlayerPedId()
            local playerId = PlayerId()
            
            SetEntityInvincible(ped, false)
            SetPlayerInvincible(playerId, false)
            SetPedCanRagdoll(ped, true)
            SetPedCanRagdollFromPlayerImpact(ped, true)
            SetEntityCanBeDamaged(ped, true)
            SetPedConfigFlag(ped, 32, true) -- Rausfliegen wieder erlauben
            SetEntityProofs(ped, false, false, false, false, false, false, false, false)
        end)
    else
        -- Sofortiges Cleanup zur Sicherheit beim Ausschalten
        local ped = PlayerPedId()
        local playerId = PlayerId()
        SetEntityInvincible(ped, false)
        SetPlayerInvincible(playerId, false)
        SetPedCanRagdoll(ped, true)
        SetEntityCanBeDamaged(ped, true)
        SetPedConfigFlag(ped, 32, true)
        SetEntityProofs(ped, false, false, false, false, false, false, false, false)
    end
end

-- 2. SUPER JUMP THREAD
local function ToggleSuperJump(state)
    features.superJump = state
    if state then
        Citizen.CreateThread(function()
            while features.superJump do
                SetSuperJumpThisFrame(PlayerId(), 1000)
                Citizen.Wait(0)
            end
        end)
    end
end

-- 3. FAST RUN THREAD
local function ToggleFastRun(state)
    features.fastRun = state
    if state then
        Citizen.CreateThread(function()
            while features.fastRun do
                SetRunSprintMultiplierForPlayer(PlayerId(), 1.49)
                SetPedMoveRateOverride(PlayerPedId(), 10.0)
                Citizen.Wait(0)
            end
            -- Reset
            SetRunSprintMultiplierForPlayer(PlayerId(), 1.0)
        end)
    else
        SetRunSprintMultiplierForPlayer(PlayerId(), 1.0)
    end
end

-- 4. INVISIBLE THREAD
local function ToggleInvisible(state)
    features.invisible = state
    local ped = PlayerPedId()
    if state then
        SetEntityVisible(ped, false, false)
        SetLocalPlayerVisibleLocally(true) -- User sees himself (Ghost)
        SetEntityAlpha(ped, 50, false)
    else
        SetEntityVisible(ped, true, false)
        ResetEntityAlpha(ped)
    end
end

-- [[ NUI LABS: NATIVE GAMERTAGS (BLINK FIX) ]] --
-- [[ NUI LABS: NATIVE GAMERTAGS (EXTENDED RANGE) ]] --
local function ToggleNames(state)
    features.names = state
    
    -- Cleanup Helper
    local function CleanUpGamerTags()
        for _, tag in pairs(gamerTags) do
            if IsMpGamerTagActive(tag) then
                RemoveMpGamerTag(tag)
            end
        end
        gamerTags = {}
    end

    if not state then
        CleanUpGamerTags()
        return
    end

    Citizen.CreateThread(function()
        while features.names do
            local curPlayers = GetActivePlayers()
            local myPed = PlayerPedId()
            local myCoords = GetEntityCoords(myPed)

            for _, player in ipairs(curPlayers) do
                local ped = GetPlayerPed(player)
                
                -- Existenz Check
                if DoesEntityExist(ped) and ped ~= myPed then
                    local dist = #(myCoords - GetEntityCoords(ped))

                    -- [UPDATE] Render Distanz auf 400.0 erhöht (Maximum der Engine)
                    if dist < 400.0 then
                        -- 1. Tag erstellen, falls er noch nicht existiert
                        if not gamerTags[player] or not IsMpGamerTagActive(gamerTags[player]) then
                            local nameText = "["..GetPlayerServerId(player).."] "..GetPlayerName(player)
                            gamerTags[player] = CreateFakeMpGamerTag(ped, nameText, false, false, "", 0)
                        end
                        
                        -- 2. Sichtbarkeit erzwingen
                        local tag = gamerTags[player]
                        if tag then
                            SetMpGamerTagVisibility(tag, 0, true)
                            SetMpGamerTagColour(tag, 0, 0) -- 0 = Weiß

                            -- Lebensbalken
                            SetMpGamerTagVisibility(tag, 2, true) 
                            SetMpGamerTagAlpha(tag, 2, 255) 
                            
                            -- Audio Icon wenn er redet
                            if NetworkIsPlayerTalking(player) then
                                SetMpGamerTagVisibility(tag, 4, true)
                                SetMpGamerTagColour(tag, 4, 12) -- Gelb
                            else
                                SetMpGamerTagVisibility(tag, 4, false)
                            end
                            
                            -- Optional: Alpha basierend auf Distanz anpassen (Fade Out)
                            -- Ab 300m wird es transparenter
                            if dist > 300.0 then
                                SetMpGamerTagAlpha(tag, 0, 150)
                            else
                                SetMpGamerTagAlpha(tag, 0, 255)
                            end
                        end
                    else
                        -- Außer Reichweite -> Löschen
                        if gamerTags[player] then
                            RemoveMpGamerTag(gamerTags[player])
                            gamerTags[player] = nil
                        end
                    end
                end
            end
            
            Citizen.Wait(500) 
        end
        
        CleanUpGamerTags()
    end)
end

-- 6. BLIPS (Map) THREAD - OPTIMIZED & FIXED NAMES
-- [[ NUI LABS: GLOBAL BLIPS (ONESYNC INFINITY READY) ]] --
local function ToggleBlips(state)
    features.blips = state
    
    if state then
        Citizen.CreateThread(function()
            while features.blips do
                -- Daten vom Server anfordern (damit wir auch ferne Spieler sehen)
                TriggerServerEvent('nui_funmenu:reqGlobalBlips')
                Citizen.Wait(2000) -- Alle 2 Sekunden Daten holen (reicht für Map)
            end
            
            -- Cleanup wenn aus
            for _, blip in pairs(blipCache) do
                if DoesBlipExist(blip) then RemoveBlip(blip) end
            end
            blipCache = {}
        end)
    else
        -- Sofort Cleanup
        for _, blip in pairs(blipCache) do
            if DoesBlipExist(blip) then RemoveBlip(blip) end
        end
        blipCache = {}
    end
end

-- Das Event, das die Daten empfängt und zeichnet
-- Das Event, das die Daten empfängt und zeichnet
RegisterNetEvent('nui_funmenu:updateGlobalBlips', function(serverData)
    if not features.blips then return end

    -- ABSICHERUNG: Falls blipCache nil ist, erstellen wir es neu
    if not blipCache then blipCache = {} end 

    local currentServerIds = {}

    for _, data in ipairs(serverData) do
        currentServerIds[data.id] = true
        
        -- Sich selbst überspringen (optional)
        if not data.isSelf then
            local blip = blipCache[data.id]

            -- A. Blip existiert noch nicht -> Erstellen
            if not DoesBlipExist(blip) then
                blip = AddBlipForCoord(data.coords.x, data.coords.y, data.coords.z)
                SetBlipDisplay(blip, 4) -- Map & Minimap
                SetBlipScale(blip, 0.85)
                SetBlipColour(blip, 0) -- Weiß
                SetBlipShowCone(blip, true)
                SetBlipCategory(blip, 7)
                blipCache[data.id] = blip
            end

            -- B. Blip existiert -> Updaten (Position & Style)
            SetBlipCoords(blip, data.coords.x, data.coords.y, data.coords.z)
            SetBlipRotation(blip, math.ceil(data.heading))
            
            -- Auto vs Mensch Symbol
            if data.isVeh then
                if GetBlipSprite(blip) ~= 326 then SetBlipSprite(blip, 326) end -- Auto
            else
                if GetBlipSprite(blip) ~= 1 then SetBlipSprite(blip, 1) end -- Punkt
            end

            -- Name aktualisieren
            BeginTextCommandSetBlipName("STRING")
            AddTextComponentSubstringPlayerName("["..data.id.."] "..data.name)
            EndTextCommandSetBlipName(blip)
        end
    end

    -- C. Cleanup: Spieler die offline gegangen sind löschen
    for id, blip in pairs(blipCache) do
        if not currentServerIds[id] then
            if DoesBlipExist(blip) then RemoveBlip(blip) end
            blipCache[id] = nil
        end
    end
end)

-- 7. RAINBOW PAINT THREAD (Optimized)
local function ToggleRainbow(state)
    features.rainbow = state
    if state then
        Citizen.CreateThread(function()
            local hue = 0
            while features.rainbow do
                local ped = PlayerPedId()
                if IsPedInAnyVehicle(ped, false) then
                    local veh = GetVehiclePedIsIn(ped, false)
                    -- Nur wenn wir Fahrer sind
                    if GetPedInVehicleSeat(veh, -1) == ped then
                        if hue < 360 then hue = hue + 1 else hue = 0 end
                        
                        -- Simple HSV zu RGB Umrechnung
                        local r = math.floor(math.sin(hue * math.pi / 180) * 127 + 128)
                        local g = math.floor(math.sin((hue + 120) * math.pi / 180) * 127 + 128)
                        local b = math.floor(math.sin((hue + 240) * math.pi / 180) * 127 + 128)
                        
                        SetVehicleCustomPrimaryColour(veh, r, g, b)
                        SetVehicleCustomSecondaryColour(veh, r, g, b)
                        SetVehicleNeonLightsColour(veh, r, g, b)
                    end
                end
                Citizen.Wait(40) -- 40ms reicht für flüssigen Farbwechsel (spart CPU)
            end
        end)
    end
end

-- VEHICLE GODMODE THREAD
local function ToggleVehicleGodmode(state)
    features.vehicleGodmode = state
    
    if state then
        Citizen.CreateThread(function()
            while features.vehicleGodmode do
                local ped = PlayerPedId()
                if IsPedInAnyVehicle(ped, false) then
                    local veh = GetVehiclePedIsIn(ped, false)
                    
                    -- Apply Invincibility
                    SetEntityInvincible(veh, true)
                    
                    -- Apply Proofs (Bullet, Fire, Explosion, Collision, etc.)
                    SetEntityProofs(veh, true, true, true, true, true, true, true, true)
                    
                    -- Visual Damage Prevention
                    SetVehicleTyresCanBurst(veh, false)
                    SetVehicleCanBeVisiblyDamaged(veh, false)
                    SetVehicleWheelsCanBreak(veh, false)
                end
                
                -- We check every second. No need for 0ms loop as these natives stick for a while
                Citizen.Wait(1000) 
            end
            
            -- Cleanup when turned off
            local ped = PlayerPedId()
            if IsPedInAnyVehicle(ped, false) then
                local veh = GetVehiclePedIsIn(ped, false)
                SetEntityInvincible(veh, false)
                SetEntityProofs(veh, false, false, false, false, false, false, false, false)
                SetVehicleTyresCanBurst(veh, true)
                SetVehicleCanBeVisiblyDamaged(veh, true)
            end
        end)
    else
        -- Immediate cleanup if toggled off
        local ped = PlayerPedId()
        if IsPedInAnyVehicle(ped, false) then
            local veh = GetVehiclePedIsIn(ped, false)
            SetEntityInvincible(veh, false)
            SetEntityProofs(veh, false, false, false, false, false, false, false, false)
            SetVehicleCanBeVisiblyDamaged(veh, true)
        end
    end
end

-- 8. SPEED BOOST THREAD (Optimized)
local function ToggleSpeedBoost(state)
    features.speedBoost = state
    if state then
        Citizen.CreateThread(function()
            while features.speedBoost do
                local ped = PlayerPedId()
                if IsPedInAnyVehicle(ped, false) then
                    local veh = GetVehiclePedIsIn(ped, false)
                    -- Multiplier setzen (Muss regelmäßig gesetzt werden, da Spiel es resetten kann)
                    if GetPedInVehicleSeat(veh, -1) == ped then
                        SetVehicleEnginePowerMultiplier(veh, 50.0)
                    end
                end
                Citizen.Wait(500) -- Alle 0.5 Sekunden reicht völlig
            end
            
            -- Reset beim Ausschalten
            local ped = PlayerPedId()
            if IsPedInAnyVehicle(ped, false) then
                local veh = GetVehiclePedIsIn(ped, false)
                SetVehicleEnginePowerMultiplier(veh, 1.0)
            end
        end)
    else
        -- Sofortiger Reset falls Thread schon aus war
        local ped = PlayerPedId()
        if IsPedInAnyVehicle(ped, false) then
            local veh = GetVehiclePedIsIn(ped, false)
            SetVehicleEnginePowerMultiplier(veh, 1.0)
        end
    end
end


local function ToggleSuperPunch(state)
    features.superPunch = state
    if state then
        Citizen.CreateThread(function()
            while features.superPunch do
                SetExplosiveMeleeThisFrame(PlayerId())
                Citizen.Wait(0) -- Muss jeden Frame gesetzt werden
            end
        end)
    end
end

-- [[ NUI LABS: INSTANT OPEN LOGIC (CACHE WAIT FIX) ]] --
local function OpenMenuLogic(sourceType)
    if isMenuOpen then return end
    
    -- 1. Check Cache: Haben wir Daten? Wenn nicht, holen & warten!
    if not isPermissionsCached then
        TriggerServerEvent('nui_funmenu:reqAccess')
        
        -- [[ FIX: WARTESCHLEIFE ]]
        -- Wir warten maximal 1 Sekunde auf den Server
        local timeout = 0
        while not isPermissionsCached and timeout < 100 do
            Citizen.Wait(10)
            timeout = timeout + 1
        end

        -- Wenn immer noch nichts da ist (Server laggt extrem)
        if not isPermissionsCached then
            Notify("System loading... please wait a moment.", "info")
            return
        end
    end

    -- 2. Local Check: Darf ich?
    if not hasAccess then
        Notify("Access Denied.", "error")
        return
    end

    -- 3. OPEN IMMEDIATELY
    isMenuOpen = true
    SetNuiFocus(true, false)
    SetNuiFocusKeepInput(true)

    local savedNoclipKey = GetResourceKvpString("nui_key_noclip") or "F2"

    -- State Collection
    local currentStates = {
        godmode         = features.godmode,
        noclip          = features.noclip,
        ghost_mode      = features.invisible,
        super_jump      = features.superJump,
        fast_run        = features.fastRun,
        toggle_names    = features.names,
        toggle_blips    = features.blips,
        superPunch      = features.superPunch,
        vehicle_godmode = features.vehicleGodmode,
        speed_boost     = features.speedBoost,
        rainbow_paint   = features.rainbow,
        infinite_Ammo   = features.infiniteAmmo,
        exp_ammo        = features.explosiveAmmo,
        freeze_time     = features.freezeTime,
        blackout        = features.blackout
    }

    -- 4. Show UI
    SendNUIMessage({ 
        type = "ui", 
        display = true,
        permissions = Config.Permissions,
        rank = myRank,
        hotkeys = { noclip = savedNoclipKey },
        states = currentStates
    })

    -- 5. Fetch Heavy Data
    TriggerServerEvent('nui_funmenu:reqPlayerCount')
    TriggerServerEvent('nui_funmenu:reqPlayerList')
end

RegisterCommand(Config.Access.commandName, function(source, args, rawCommand)
    if Config.Access.enableCommand then OpenMenuLogic('command') end
end, false)

if Config.Access.enableKeybind then
    local keybindCommand = 'keybind_' .. Config.Access.commandName
    RegisterCommand(keybindCommand, function() OpenMenuLogic('keybind') end, false)
    RegisterKeyMapping(keybindCommand, 'Open Fun Menu', 'keyboard', Config.Access.defaultKey)
end

Citizen.CreateThread(function() print('^5[NUI LABS] ^7Fun Menu initialized.') end)




-- [[ TELEPORT SAFE (STANDARD) ]] --
local function TeleportSafe(x, y, z_target)
    local ped = PlayerPedId()
    local entity = ped
    if IsPedInAnyVehicle(ped, false) then 
        entity = GetVehiclePedIsIn(ped, false) 
    end

    -- 1. Einfrieren
    FreezeEntityPosition(entity, true)
    
    -- 2. Kollision laden
    local checkZ = z_target or 100.0
    RequestCollisionAtCoord(x, y, checkZ)
    
    -- 3. Kurzer Wait Loop (Sicherheit)
    local timer = GetGameTimer()
    while not HasCollisionLoadedAroundEntity(entity) and (GetGameTimer() - timer) < 1000 do
        SetEntityCoords(entity, x, y, checkZ, false, false, false, false)
        RequestCollisionAtCoord(x, y, checkZ)
        Citizen.Wait(0)
    end

    -- 4. Boden finden
    local foundGround, zPos = GetGroundZFor_3dCoord(x, y, 1000.0, false)
    if foundGround then 
        SetEntityCoords(entity, x, y, zPos, false, false, false, false)
    else
        SetEntityCoords(entity, x, y, checkZ, false, false, false, false)
    end

    -- 5. Loslassen
    FreezeEntityPosition(entity, false)
end

-- [[ NUI CALLBACKS ]] --

RegisterNUICallback('closeMenu', function(data, cb)
    local ped = PlayerPedId()
    
    -- 1. Status Variablen resetten
    isMenuOpen = false
    isTypingOrModal = false -- WICHTIG: Input Blocker lösen!
    isTuningMode = false
    
    -- 2. NUI Fokus komplett töten
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false) -- Zurücksetzen auf Standard
    
    -- 3. Physisch entfrieren (Sicherheitsnetz)
    FreezeEntityPosition(ped, false)
    if IsPedInAnyVehicle(ped, false) then
        local veh = GetVehiclePedIsIn(ped, false)
        FreezeEntityPosition(veh, false)
    end

    SendNUIMessage({ type = "ui", display = false })
    cb('ok')
end)

RegisterNUICallback('godmode', function(data, cb)
    ToggleGodmode(data.state)
    Notify("Godmode " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

RegisterNUICallback('noclip', function(data, cb)
    features.noclip = data.state -- Keep state sync
    ToggleNoClip(data.state)
    
    Notify("NoClip " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

RegisterNUICallback('heal_self', function(data, cb)
    local ped = PlayerPedId()
    SetEntityHealth(ped, 200)
    SetPedArmour(ped, 100)
    ClearPedBloodDamage(ped)
    ResetPedVisibleDamage(ped)
    Notify("Player healed!", "success")
    cb('ok')
end)

RegisterNUICallback('max_ammo', function(data, cb)
    local ped = PlayerPedId()
    local weapon = GetSelectedPedWeapon(ped)
    local unarmedHash = GetHashKey("WEAPON_UNARMED")

    if weapon == unarmedHash then
        Notify("You don't have a weapon equipped!", "error")
    else
        -- 250 Schuss + volles Magazin
        AddAmmoToPed(ped, weapon, 250)
        local success, maxClip = GetMaxAmmoInClip(ped, weapon, true)
        if success then
            SetAmmoInClip(ped, weapon, maxClip)
        end

        local displayName = GetDisplayNameFromVehicleModel(weapon) 
        local weaponName = GetLabelText(displayName)
        if weaponName == "NULL" or weaponName == "" then
            weaponName = "Weapon"
        end

        Notify(weaponName .. ": 250 ammo added", "success")
    end

    cb('ok')
end)

RegisterNUICallback('super_jump', function(data, cb)
    ToggleSuperJump(data.state)
    Notify("Super Jump " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

RegisterNUICallback('fast_run', function(data, cb)
    ToggleFastRun(data.state)
    Notify("Fast Run " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

RegisterNUICallback('ghost_mode', function(data, cb)
    ToggleInvisible(data.state)
    Notify("Invisible " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)
-- [[ NUI LABS: REVIVE SELF (USER FRIENDLY FIX) ]] --
RegisterNUICallback('revive_self', function(data, cb)
    -- Wir holen unsere eigene ID
    local myId = GetPlayerServerId(PlayerId())
    
    -- Anstatt den Admin-Befehl "/revive" zu nutzen (der geblockt würde),
    -- nutzen wir unser eigenes Server-Event, das auf unsere Config hört.
    TriggerServerEvent('nui_funmenu:revivePlayer', myId)
    
    -- Optik
    local ped = PlayerPedId()
    ClearPedBloodDamage(ped)
    ResetPedVisibleDamage(ped)
    
    Notify("Revive request sent!", "success")
    cb('ok')
end)
RegisterNUICallback('clean_ped', function(data, cb)
    local ped = PlayerPedId()
    ClearPedBloodDamage(ped)
    ResetPedVisibleDamage(ped)
    ClearPedWetness(ped)
    ClearPedEnvDirt(ped)

    local dict = "clothingtie"
    local anim = "try_tie_positive_a"

    RequestAnimDict(dict)
    while not HasAnimDictLoaded(dict) do
        Wait(0)
    end

    TaskPlayAnim(ped, dict, anim, 8.0, -8.0, 3000, 49, 0, false, false, false)

    Notify("You're clean!", "success")
    cb('ok')
end)

RegisterNUICallback('toggle_names', function(data, cb)
    ToggleNames(data.state)
    Notify("Player Names " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

RegisterNUICallback('toggle_blips', function(data, cb)
    ToggleBlips(data.state)
    Notify("Map Blips " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

RegisterNUICallback('suicide', function(data, cb)
    local ped = PlayerPedId()
    SetEntityHealth(ped, 0)
    Notify("Committed suicide!", "success")
    cb('ok')
end)

local function setWeatherInstant(weather)
    ClearOverrideWeather()
    ClearWeatherTypePersist()
    SetWeatherTypePersist(weather)
    SetWeatherTypeNow(weather)
    SetWeatherTypeNowPersist(weather)
end

-- [[ VEHICLE CALLBACKS ]] --

-- Helper Function: Spawn Vehicle safely
local spawnedVehicle = nil

-- Zufälliges Kennzeichen generieren [NOTIZ VON TREETY: Native Generate von GTA ist Buggy und funktioniert nicht gut mit "TaskWarpPedIntoVehicle", deswegen diese Alternative]
local function GenerateRandomPlate()
    local plate = ""
    local chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    for i = 1, 8 do
        local rand = math.random(1, #chars)
        plate = plate .. chars:sub(rand, rand)
    end
    return plate
end

-- Nur relevant wenn RemovePreviousVehicle = false
local function GetSideSpawnCoords()
    local baseCoords, heading

    if spawnedVehicle and DoesEntityExist(spawnedVehicle) then
        baseCoords = GetEntityCoords(spawnedVehicle)
        heading = GetEntityHeading(spawnedVehicle)
    else
        local ped = PlayerPedId()
        baseCoords = GetEntityCoords(ped)
        heading = GetEntityHeading(ped)
    end

    local offsets = {
        vector3(4.5, 0.0, 1.0),   -- rechts
        vector3(-4.5, 0.0, 1.0),  -- links
        vector3(0.0, 5.5, 1.0),   -- vorne
        vector3(0.0, -5.5, 1.0),  -- hinten
        vector3(4.5, 4.5, 1.0),   -- rechts-vorne
        vector3(-4.5, 4.5, 1.0),  -- links-vorne
        vector3(4.5, -4.5, 1.0),  -- rechts-hinten
        vector3(-4.5, -4.5, 1.0), -- links-hinten
    }

    for _, offset in ipairs(offsets) do
        local rotX = offset.x * math.cos(-math.rad(heading)) - offset.y * math.sin(-math.rad(heading))
        local rotY = offset.x * math.sin(-math.rad(heading)) + offset.y * math.cos(-math.rad(heading))
        local testCoords = baseCoords + vector3(rotX, rotY, offset.z)

        if not IsAnyVehicleNearPoint(testCoords.x, testCoords.y, testCoords.z, 3.0) then
            return testCoords, heading
        end
    end

    -- Fallback: rechts vom Spieler
    return baseCoords + vector3(4.5, 0.0, 1.0), heading
end

local function SpawnVehicle(modelName)
    local hash = GetHashKey(modelName)
    
    -- Check if model is valid
    if not IsModelInCdimage(hash) or not IsModelAVehicle(hash) then
        Notify("Invalid vehicle: " .. modelName, "error")
        return
    end

    -- Delete previous vehicle if config allows (Uses Config.VehicleSettings.RemovePreviousVehicle)
    if Config.VehicleSettings.RemovePreviousVehicle and spawnedVehicle and DoesEntityExist(spawnedVehicle) then
        DeleteEntity(spawnedVehicle)
        spawnedVehicle = nil
        Notify("Previous vehicle removed.", "info")
    end

    -- Load Model
    RequestModel(hash)
    while not HasModelLoaded(hash) do
        Citizen.Wait(10)
    end

    local ped = PlayerPedId()
    local coords, heading

    -- ENTSCHEIDUNG: Wo soll das neue Fahrzeug spawnen?
    if Config.VehicleSettings.RemovePreviousVehicle then
        -- Klassisches Verhalten: direkt beim Spieler
        coords = GetEntityCoords(ped)
        heading = GetEntityHeading(ped)
        coords = vector3(coords.x, coords.y, coords.z + 1.0)
    else
        -- Smart: neben dem letzten Fahrzeug (oder Spieler, falls keins da)
        coords, heading = GetSideSpawnCoords()
    end

    -- Create Vehicle
    local vehicle = CreateVehicle(hash, coords.x, coords.y, coords.z, heading, true, false)

    -- Set vehicle properly on ground + mission entity
    SetVehicleOnGroundProperly(vehicle)
    SetEntityAsMissionEntity(vehicle, true, true)

    -- Immer das zuletzt gespawnte merken (wichtig für nächstes Neben-Spawnen)
    spawnedVehicle = vehicle

    -- Set Plate Text based on config (Uses Config.VehicleSettings.UseRandomPlate and FixedPlateText)
    if not Config.VehicleSettings.UseRandomPlate then
        -- Use the fixed plate text from the config
        SetVehicleNumberPlateText(vehicle, Config.VehicleSettings.FixedPlateText)
    else
        -- Standard behavior: use a random plate da native buggy ist
        local randomPlate = GenerateRandomPlate()
        SetVehicleNumberPlateText(vehicle, randomPlate)
    end
    
    -- >> This ensures the vehicle entity is fully stabilized before warping the player.
    Citizen.Wait(100)

    -- Teleport Player into Vehicle
    if DoesEntityExist(vehicle) then
        TaskWarpPedIntoVehicle(ped, vehicle, -1)
    end

    -- Cleanup memory
    SetModelAsNoLongerNeeded(hash)
    
    Notify("Vehicle spawned: " .. modelName, "success")
end



-- REPAIR & CLEAN
RegisterNUICallback('fix_vehicle', function(data, cb)
    local ped = PlayerPedId()
    if IsPedInAnyVehicle(ped, false) then
        local vehicle = GetVehiclePedIsIn(ped, false)
        SetVehicleFixed(vehicle)
        SetVehicleDirtLevel(vehicle, 0.0)
        SetVehicleDeformationFixed(vehicle)
        SetVehicleUndriveable(vehicle, false)
        Notify("Vehicle repaired and cleaned!", "success")
    else
        Notify("You are not in a vehicle!", "error")
    end
    cb('ok')
end)

-- DELETE VEHICLE
RegisterNUICallback('del_vehicle', function(data, cb)
    local ped = PlayerPedId()
    if IsPedInAnyVehicle(ped, false) then
        local vehicle = GetVehiclePedIsIn(ped, false)
        SetEntityAsMissionEntity(vehicle, true, true)
        DeleteVehicle(vehicle)
        Notify("Vehicle deleted!", "success")
    else
        -- Try to delete vehicle in front? (Optional feature for later)
        Notify("You are not in a vehicle!", "error")
    end
    cb('ok')
end)

-- TOGGLES

RegisterNUICallback('speed_boost', function(data, cb)
    ToggleSpeedBoost(data.state)
    Notify("Speed Boost " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)
RegisterNUICallback('rainbow_paint', function(data, cb)
    ToggleRainbow(data.state)
    Notify("Rainbow Paint " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

-- [[ WORLD MAYHEM CALLBACKS ]] --

RegisterNUICallback('superPunch', function(data, cb) 
    ToggleSuperPunch(data.state)
    Notify("Super Punch " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok') 
end)

RegisterNUICallback('exp_ammo', function(data, cb)
    features.explosiveAmmo = data.state
    Notify("Explosive Ammo " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

RegisterNUICallback('infinite_Ammo', function(data, cb)
    features.infiniteAmmo = data.state

    local ped = PlayerPedId()

    if data.state then

        SetPedInfiniteAmmoClip(ped, true)
    else

        SetPedInfiniteAmmoClip(ped, false)
    end

    Notify("Infinite Ammo " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

RegisterNUICallback('freeze_time', function(data, cb) 
    features.freezeTime = data.state
    if features.freezeTime then
        NetworkOverrideClockTime(frozenTime.h, frozenTime.m, 0)
    end
    
    Notify("Time Freeze " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok') 
end)

-- [[ NUI LABS: BLACKOUT LOGIC WITH COOLDOWN & NOTIFY ]] --
RegisterNUICallback('blackout', function(data, cb) 
    local currentTime = GetGameTimer()
    
    if (currentTime - lastBlackoutTime) < Config.BlackoutCooldown then
        PlaySoundFrontend(-1, "ERROR", "HUD_FRONTEND_DEFAULT_SOUNDSET", 1)
        
        Notify("System: Cooldown active! Wait shortly...", "error")
        
        cb('error')
        return
    end
    
    lastBlackoutTime = currentTime
    TriggerServerEvent("nui_funmenu:requestBlackout", data.state)
    
    Notify("Blackout " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok') 
end)

RegisterNUICallback('clear_peds', function(data, cb)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    ClearAreaOfPeds(coords.x, coords.y, coords.z, 100.0, 1)
    Notify("System: Area cleared of Peds. Radius: 100", "success")
    cb('ok')
end)

-- CLEAR AREA (CARS)
RegisterNUICallback('clear_cars', function(data, cb)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    -- Clears 100.0 units around player
    ClearAreaOfVehicles(coords.x, coords.y, coords.z, 100.0, false, false, false, false, false)
    Notify("Area cleared of Vehicles. Radius: 100", "success")
    cb('ok')
end)

-- WORLD MAYHEM
-- ===== WEATHER
local lastWeatherChange = 0

local function changeWeather(weatherName, displayName)
    local currentTime = GetGameTimer()
    
    -- Cooldown prüfen (Wert kommt aus config.lua)
    if (currentTime - lastWeatherChange) < Config.WeatherCooldown then
        PlaySoundFrontend(-1, "ERROR", "HUD_FRONTEND_DEFAULT_SOUNDSET", 1)
        Notify("Cooldown active! Please wait a moment.", "error")
        return
    end
    
    -- Cooldown abgelaufen → Wetter wechseln
    lastWeatherChange = currentTime
    TriggerServerEvent('qb-weathersync:server:setWeather', weatherName)
    Notify("Weather changed to " .. displayName, "success")
end

-- Wetter-Mapping
local weatherMap = {
    weather_extrasunny = { name = "EXTRASUNNY",   label = "Extra Sunny" },
    weather_clear      = { name = "CLEAR",        label = "Clear" },
    weather_neutral    = { name = "NEUTRAL",      label = "Neutral" },
    weather_smog       = { name = "SMOG",         label = "Smog" },
    weather_foggy      = { name = "FOGGY",        label = "Foggy" },
    weather_overcast   = { name = "OVERCAST",     label = "Overcast" },
    weather_clouds     = { name = "CLOUDS",       label = "Cloudy" },
    weather_clearing   = { name = "CLEARING",     label = "Clearing" },
    weather_rain       = { name = "RAIN",         label = "Rain" },
    weather_thunder    = { name = "THUNDER",      label = "Thunderstorm" },
    weather_snow       = { name = "SNOW",         label = "Snow" },
    weather_blizzed    = { name = "BLIZZARD",     label = "Blizzard" },
    weather_light_snow = { name = "SNOWLIGHT",    label = "Light Snow" },
    weather_heavy_snow = { name = "XMAS",         label = "Heavy Snow (XMAS)" },
    weather_halloween  = { name = "HALLOWEEN",    label = "Halloween" },
}

-- Automatische Registrierung aller Wetter-Buttons
for action, data in pairs(weatherMap) do
    RegisterNUICallback(action, function(_, cb)
        changeWeather(data.name, data.label)
        cb('ok')
    end)
end

RegisterNUICallback('superPunch', function(data, cb) features.superPunch = data.state; cb('ok') end)
RegisterNUICallback('time_night', function(data, cb) NetworkOverrideClockTime(0, 0, 0); cb('ok') end)
RegisterNUICallback('time_day', function(data, cb) NetworkOverrideClockTime(12, 0, 0); cb('ok') end)

RegisterNUICallback('manage_money', function(data, cb)
    TriggerServerEvent('nui_funmenu:manageMoney', data)
    cb('ok')
end)

RegisterNUICallback('clear_peds', function(data, cb) 
    local c = GetEntityCoords(PlayerPedId())
    ClearAreaOfPeds(c.x, c.y, c.z, 100.0, 1)
    cb('ok') 
end)

RegisterNUICallback('clear_cars', function(data, cb) 
    local c = GetEntityCoords(PlayerPedId())
    ClearAreaOfVehicles(c.x, c.y, c.z, 100.0, false, false, false, false, false)
    cb('ok') 
end)

-- [[ NUI LABS: ULTIMATE EXPLOSIVE AMMO (RAYCAST V2) ]] --
CreateThread(function()
    -- Particle Dictionary Load
    local ptfxDict = "scr_solomon3"
    local ptfxName = "scr_solomon3_explosion"
    RequestNamedPtfxAsset(ptfxDict)
    while not HasNamedPtfxAssetLoaded(ptfxDict) do Wait(10) end

    local explosionType   = 5   -- EXPLOSION_TANKER (Big visuals)
    local explosionDamage = 5.0 -- Damage Value

    while true do
        local sleep = 1000

        if features.explosiveAmmo then
            sleep = 0 -- Run every frame when active
            local ped = PlayerPedId()

            -- Check if player shoots
            if IsPedShooting(ped) then
                local camPos = GetGameplayCamCoord()
                local camRot = GetGameplayCamRot(2)
                
                -- Calculate Target via Raycast (2000m Range)
                local dir = RotationToDirection(camRot)
                local destination = vector3(
                    camPos.x + dir.x * 2000.0, 
                    camPos.y + dir.y * 2000.0, 
                    camPos.z + dir.z * 2000.0
                )

                -- Shoot the Ray
                -- -1 Flags = Intersect with everything (Map, Peds, Vehicles)
                -- 4th arg = ped (Ignore player self)
                local rayHandle = StartShapeTestRay(
                    camPos.x, camPos.y, camPos.z, 
                    destination.x, destination.y, destination.z, 
                    -1, ped, 0
                )
                
                local _, hit, hitCoords, _, _ = GetShapeTestResult(rayHandle)

                if hit == 1 then
                    -- Create Explosion at Raycast Hit
                    AddExplosion(
                        hitCoords.x, hitCoords.y, hitCoords.z,
                        explosionType,      
                        explosionDamage,    
                        true,   -- Audible
                        false,  -- Invisible (we use custom particles)
                        false   -- Camera Shake
                    )

                    -- Custom Particle Effect
                    UseParticleFxAsset(ptfxDict)
                    StartParticleFxNonLoopedAtCoord(
                        ptfxName,
                        hitCoords.x, hitCoords.y, hitCoords.z + 0.5,
                        0.0, 0.0, 0.0,
                        1.0, 
                        false, false, false
                    )
                end
            end
        end
        Wait(sleep)
    end
end)

-- Diese Funktion ruft das Server-Event auf, um die Berechtigungsprüfung zu durchlaufen
local function GiveWeapon(weaponName)

    -- Prüfen, ob der Waffenname leer ist
    if not weaponName or weaponName == "" then
        Notify("Invalid Weapon Name", "error")
        return
    end

    TriggerServerEvent('nui_funmenu:giveWeapon', weaponName)
    
    Notify("You received " .. weaponName .. " in your inventory.", "success")
end

RegisterNUICallback('tp_marker', function(data, cb)
    local waypointBlip = GetFirstBlipInfoId(8) -- 8 = Waypoint ID

    if DoesBlipExist(waypointBlip) then
        local blipPos = GetBlipInfoIdCoord(waypointBlip)
        Notify("Teleporting...", "info")

        Citizen.CreateThread(function()
            local ped = PlayerPedId()
            local entity = ped
            -- Check: Sitzt der Spieler im Auto? Dann Auto teleportieren!
            if IsPedInAnyVehicle(ped, false) then 
                entity = GetVehiclePedIsIn(ped, false) 
            end
            -- 1. Maximale Höhe an der Koordinate ermitteln (Top Z)
            local z = GetHeightmapTopZForPosition(blipPos.x, blipPos.y)
            
            -- 2. Entity dort hinsetzen & einfrieren (damit man nicht fällt)
            SetEntityCoords(entity, blipPos.x, blipPos.y, z, true, false, false, false)
            FreezeEntityPosition(entity, true)

            -- 3. Warten bis der Boden geladen ist (Kollision)
            local gz = 0.0
            local groundFound = false
            
            repeat
                Citizen.Wait(50)
                -- Wir fordern Kollision an, damit GTA den Boden lädt
                RequestCollisionAtCoord(blipPos.x, blipPos.y, z)
                
                -- Prüfen ob Boden da ist
                local success, height = GetGroundZFor_3dCoord(blipPos.x, blipPos.y, z, true)
                if success then
                    gz = height
                    groundFound = true
                end
            until groundFound

            -- 4. Finaler Teleport auf den Boden & Loslassen
            SetEntityCoords(entity, blipPos.x, blipPos.y, gz, true, false, false, false)
            FreezeEntityPosition(entity, false)
            
            Notify("Arrived!", "success")
        end)
    else
        Notify("No Waypoint Set!", "error")
    end
    cb('ok')
end)

RegisterNUICallback('tp_legion', function(data, cb) 
    Citizen.CreateThread(function() TeleportSafe(225.0, -850.0, 30.0) end)
    Notify("Welcome to Legion", "success")
    cb('ok') 
end)

RegisterNUICallback('tp_pd', function(data, cb) 
    Citizen.CreateThread(function() TeleportSafe(420.0, -970.0, 20.0) end)
    Notify("Welcome to PD", "success")
    cb('ok') 
end)

RegisterNUICallback('tp_hospital', function(data, cb) 
    Citizen.CreateThread(function() TeleportSafe(283.0, -578.0, 43.0) end)
    Notify("Welcome to Hospital", "success")
    cb('ok') 
end)

RegisterNUICallback('tp_chiliad', function(data, cb) 
    Citizen.CreateThread(function() TeleportSafe(501.0, 5604.0, 797.0) end)
    Notify("Welcome to Mt. Chiliad", "success")
    cb('ok') 
end)

RegisterNetEvent('nui_funmenu:setBlackoutState', function(state)
    features.blackout = state
    
    SetBlackout(state)
    SetArtificialLightsState(state)
    
    print('^5[NUI LABS] ^7System update: Blackout is now ' .. (state and "ACTIVE" or "INACTIVE"))
end)

-- [[ NUI LABS: CLIENT STATE MANAGEMENT ]] --

-- [[ NUI LABS: CLIENT STATE MANAGEMENT ]] --

local function ApplyBlackout(state)
    features.blackout = state
    
    -- 1. Engine Blackout anwenden
    SetBlackout(state)
    
    -- 2. Künstliche Lichter anwenden (Laternen etc.)
    SetArtificialLightsState(state)
    
    -- 3. Update erzwingen
    -- Wenn wir ausschalten (false), stellen wir sicher, dass die Engine es kapiert
    if not state then
        SetArtificialLightsStateAffectsVehicles(true) -- Auto-Lichter wieder normal
    else
        SetArtificialLightsStateAffectsVehicles(false) -- Auto-Lichter bleiben an, aber Umgebungslicht weg
    end
    
    print('^5[NUI LABS] ^7Blackout Applied locally: ' .. tostring(state))
end

-- Reagiert auf GlobalState Änderungen (Modern)
AddStateBagChangeHandler("Blackout", nil, function(bagName, key, value)
    if bagName ~= "global" then return end 
    ApplyBlackout(value)
end)

-- Legacy Support Event (Absicherung)
RegisterNetEvent('nui_funmenu:setBlackoutState', function(state)
    ApplyBlackout(state)
end)

-- Initial Sync beim Joinen
Citizen.CreateThread(function()
    Citizen.Wait(1000)
    if GlobalState.Blackout ~= nil then
        ApplyBlackout(GlobalState.Blackout)
    end
end)

-- Legacy Support Event (Falls wir GlobalState nicht nutzen)
RegisterNetEvent('nui_funmenu:setBlackoutState', function(state)
    features.blackout = state
    SetBlackout(state)
    SetArtificialLightsState(state)
end)

-- [[ NUI LABS: PLAYER COUNT LISTENER DEBUG ]] --
RegisterNetEvent('nui_funmenu:receivePlayerCount', function(active, max)
    print('^5[NUI LABS DEBUG] ^7Client received stats: '..active..' / '..max)

    SendNUIMessage({
        type = "updatePlayerCount",
        active = active,
        max = max
    })
    
    print('^5[NUI LABS DEBUG] ^7Sent message to NUI.')
end)

-- [[ NUI LABS: PLAYER LIST LISTENER ]] --
RegisterNetEvent('nui_funmenu:receivePlayerList', function(players)
    SendNUIMessage({
        type = "updatePlayerList",
        players = players
    })
end)

-- [[ NUI LABS: ULTIMATE INPUT BLOCKER (NUCLEAR OPTION) ]] --
local isTypingOrModal = false

Citizen.CreateThread(function()
    while true do
        local sleep = 500
        if isTypingOrModal then
            sleep = 0
            -- Deaktiviert JEDEN Input, der an das Spiel gehen könnte
            DisableAllControlActions(0)
            DisableAllControlActions(1)
            DisableAllControlActions(2)
            
            -- Damit man ESC drücken kann um NUI zu schließen, falls was hängt (Optional)
            -- EnableControlAction(0, 200, true) 
        end
        Citizen.Wait(sleep)
    end
end)

RegisterNUICallback('nui_typing_focus', function(data, cb)
    isTypingOrModal = data.state

    if data.state then
        -- MODUS: EINGABE (Hart blockieren)
        -- KeepInput = FALSE bedeutet: GTA bekommt KEINE Tasten mehr mit. Nur NUI.
        SetNuiFocus(true, true) 
        SetNuiFocusKeepInput(false) 
    else
        -- MODUS: MENÜ NAVIGATION (Laufen erlaubt)
        SetNuiFocus(true, false)
        SetNuiFocusKeepInput(true)
    end
    cb('ok')
end)

-- [[ NUI LABS: INFO PANEL BRIDGE ]] --
RegisterNetEvent('nui_funmenu:receivePlayerDetails', function(data)
    SendNUIMessage({
        type = "updatePlayerStats",
        data = data
    })
end)

RegisterNUICallback('reqPlayerDetails', function(data, cb)
    TriggerServerEvent('nui_funmenu:reqPlayerDetails', data.targetId)
    cb('ok')
end)

-- Callbacks für das NUI (Die Verbindung zwischen JS Button und Server)

RegisterNUICallback('kick_player', function(data, cb)
    -- Hier könnten wir noch ein Input-Feld für den Grund einbauen später
    TriggerServerEvent('nui_funmenu:kickPlayer', data.targetId, "Kicked via NUI LABS Menu")
    cb('ok')
end)

RegisterNUICallback('revive_player', function(data, cb)
    TriggerServerEvent('nui_funmenu:revivePlayer', data.targetId)
    cb('ok')
end)

RegisterNUICallback('freeze_player', function(data, cb)
    TriggerServerEvent('nui_funmenu:freezePlayer', data.targetId, data.state)
    cb('ok')
end)

RegisterNUICallback('goto_player', function(data, cb)
    TriggerServerEvent('nui_funmenu:gotoPlayer', data.targetId)
    cb('ok')
end)

RegisterNUICallback('bring_player', function(data, cb)
    TriggerServerEvent('nui_funmenu:bringPlayer', data.targetId)
    cb('ok')
end)

RegisterNUICallback('sit_in_vehicle', function(data, cb)
    isMenuOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ type = "ui", display = false })
    
    TriggerServerEvent('nui_funmenu:sitInVehicle', data.targetId)
    cb('ok')
end)
RegisterNUICallback('give_clothing_menu', function(data, cb)
    TriggerServerEvent('nui_funmenu:openClothing', data.targetId)
    cb('ok')
end)

RegisterNUICallback('open_inventory', function(data, cb)

    isMenuOpen = false

    -- 2. UI visuell schließen
    SendNUIMessage({ type = "ui", display = false })
    SetNuiFocus(false, false)
    
    -- 3. Warte kurz, bis das NUI weg ist
    Citizen.Wait(200) 
    
    -- 4. Server Event triggern
    if data.targetId then
        TriggerServerEvent('nui_funmenu:openInventory', data.targetId)
    end
    
    cb('ok')
end)

-- [[ NUI LABS: PLAYER ACTIONS CALLBACKS ]] --

RegisterNUICallback('kill_player', function(data, cb)
    TriggerServerEvent('nui_funmenu:killPlayer', data.targetId)
    cb('ok')
end)

RegisterNUICallback('spectate_player', function(data, cb)
    
    TriggerServerEvent('nui_funmenu:spectatePlayer', data.targetId)
    cb('ok')
end)

RegisterNUICallback('freeze_player', function(data, cb)
    TriggerServerEvent('nui_funmenu:freezePlayer', data.targetId, data.state)
    cb('ok')
end)

-- [[ NUI LABS: SPECTATE LOGIC (Ported from qb-admin) ]] --
-- [[ NUI LABS: SPECTATE SYSTEM V2 (VEHICLE SAFE) ]] --
RegisterNetEvent('nui_funmenu:client:spectate', function(targetServerId, targetCoords)
    local myPed = PlayerPedId()
    local targetID = tonumber(targetServerId)

    -- [[ 1. STOP SPECTATING ]] --
    if spectateData.active then
        spectateData.active = false
        
        -- A. Kamera zerstören
        RenderScriptCams(false, false, 0, 1, 0)
        DestroyCam(spectateData.cam, false)
        spectateData.cam = nil
        
        -- B. Fokus zurücksetzen (Wichtig!)
        ClearFocus()
        
        -- C. Spieler/Auto wieder sichtbar & entfrieren
        local entityToRestore = myPed
        
        -- Falls wir im Auto waren, Auto wiederherstellen
        if spectateData.oldVeh and DoesEntityExist(spectateData.oldVeh) then
            entityToRestore = spectateData.oldVeh
            -- Sicherheits-Check: Sitzen wir noch drin? Wenn nicht, reinsetzen.
            if not IsPedInVehicle(myPed, spectateData.oldVeh, false) then
                TaskWarpPedIntoVehicle(myPed, spectateData.oldVeh, spectateData.oldSeat)
            end
        else
            -- Falls zu Fuß, Teleport zur Sicherheit zurück (falls Glitch)
            if spectateData.oldCoords then
                SetEntityCoords(myPed, spectateData.oldCoords.x, spectateData.oldCoords.y, spectateData.oldCoords.z)
            end
        end

        FreezeEntityPosition(entityToRestore, false)
        SetEntityVisible(entityToRestore, true, 0)
        SetEntityCollision(entityToRestore, true, true)
        SetEntityInvincible(entityToRestore, false)
        
        Notify("Spectate Mode: OFF", "info")
        return
    end

    -- [[ 2. START SPECTATING ]] --
    
    -- Target Validierung
    local targetPlayer = GetPlayerFromServerId(targetID)
    if targetPlayer == -1 then
        Notify("Player is too far to initialize! (OneSync Syncing...)", "warning")
        -- Optional: Hier könnte man kurz hintporten zum Laden, aber das zerstört das "Auto-Sitzen".
        -- Mit SetFocusEntity unten lösen wir das meistens.
    end

    -- Daten sichern
    spectateData.active = true
    spectateData.target = targetID
    spectateData.oldCoords = GetEntityCoords(myPed)
    spectateData.oldVeh = nil
    spectateData.oldSeat = -1

    -- Auto Check
    local veh = GetVehiclePedIsIn(myPed, false)
    local entityToHide = myPed
    
    if veh ~= 0 then
        spectateData.oldVeh = veh
        entityToHide = veh
        -- Sitzplatz finden
        for i = -1, 6 do
            if GetPedInVehicleSeat(veh, i) == myPed then
                spectateData.oldSeat = i
                break
            end
        end
    end

    -- Unsichtbar & Freeze (Damit uns niemand sieht oder rammt während wir weg sind)
    FreezeEntityPosition(entityToHide, true)
    SetEntityVisible(entityToHide, false, 0)
    SetEntityCollision(entityToHide, false, false)
    SetEntityInvincible(entityToHide, true)

    -- Kamera erstellen
    spectateData.cam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    SetCamActive(spectateData.cam, true)
    RenderScriptCams(true, false, 0, 1, 0)

    -- [[ DER LOOP ]] --
    Citizen.CreateThread(function()
        while spectateData.active do
            local targetPlayerIdx = GetPlayerFromServerId(spectateData.target)
            local targetPed = nil
            
            if targetPlayerIdx ~= -1 then
                targetPed = GetPlayerPed(targetPlayerIdx)
            end

            -- OneSync Magic: Fokus auf das Ziel setzen, damit GTA die Map dort lädt
            -- Auch wenn wir physisch 10km weg sind.
            if targetPed and DoesEntityExist(targetPed) then
                SetFocusEntity(targetPed)
                
                -- Kamera an Ziel kleben
                AttachCamToEntity(spectateData.cam, targetPed, 0.0, -2.0, 1.0, true)
                SetCamRot(spectateData.cam, -15.0, 0.0, GetEntityHeading(targetPed), 2)
            else
                -- Fallback: Wenn Ped nicht geladen ist (passiert selten mit SetFocus)
                SetFocusArea(targetCoords.x, targetCoords.y, targetCoords.z, 0.0, 0.0, 0.0)
                SetCamCoord(spectateData.cam, targetCoords.x, targetCoords.y, targetCoords.z + 2.0)
            end

            Citizen.Wait(0)
        end
    end)

    Notify("Spectate Mode: ON", "success")
end)

-- [[ NUI LABS: FREEZE HANDLER ]] --
RegisterNetEvent('nui_funmenu:client:freeze', function(shouldFreeze)
    local ped = PlayerPedId()
    isAdminFrozen = shouldFreeze -- Variable setzen
    
    FreezeEntityPosition(ped, isAdminFrozen)
    
    if isAdminFrozen then
        SetEntityInvincible(ped, true)
        SetPlayerInvincible(PlayerId(), true)
        Notify("You have been FROZEN by an Admin.", "error")
    else
        SetEntityInvincible(ped, false)
        SetPlayerInvincible(PlayerId(), false)
        Notify("You have been UNFROZEN.", "success")
    end
end)

-- [[ NUI LABS: GLOBAL SERVER ACTIONS ]] --

-- Callback matches 'action: "kill_all"' from script.js
RegisterNUICallback('kill_all', function(data, cb)
    -- Trigger server event to handle logic for all players
    TriggerServerEvent('nui_funmenu:kill_all')
    cb('ok')
end)

-- Callback matches 'action: "revive_all"' from script.js
RegisterNUICallback('revive_all', function(data, cb)
    TriggerServerEvent('nui_funmenu:revive_all')
    cb('ok')
end)

-- Callback matches 'action: "heal_all"' from script.js
RegisterNUICallback('heal_all', function(data, cb)
    TriggerServerEvent('nui_funmenu:heal_all')
    cb('ok')
end)


for i = 0, 23 do
    -- Format hour to 2 digits (e.g. 0 becomes "00", 5 becomes "05")
    local actionName = string.format("time_%02d", i)
    
    RegisterNUICallback(actionName, function(data, cb)
        -- Trigger server event with the hour (i) and minute (0)
        TriggerServerEvent('nui_funmenu:setTime', i, 0)
        
        Notify("Time set to " .. string.format("%02d:00", i), "success")
        cb('ok')
    end)
end

RegisterNetEvent('nui_funmenu:client:forceTime', function(h, m)
    NetworkOverrideClockTime(h, m, 0)
end)

-- [[ NUI LABS: AUTOTUNE SYSTEM ]] --

-- Helper: Wendet maximales Tuning auf ein Fahrzeug an
local function ApplyMaxTuning(vehicle)
    SetVehicleModKit(vehicle, 0) -- WICHTIG: Erlaubt Modifikationen
    
    -- 1. Performance Mods (Turbo, Motor, Bremsen, Getriebe etc.)
    ToggleVehicleMod(vehicle, 18, true) -- Turbo
    ToggleVehicleMod(vehicle, 22, true) -- Xenon Headlights
    
    -- Gehe alle Mod-Typen durch (0 bis 49 sind Standard GTA Mods)
    for i = 0, 49 do
        local maxLvl = GetNumVehicleMods(vehicle, i)
        if maxLvl > 0 then
            -- Setze auf höchstes Level (maxLvl - 1, da Zählung bei 0 beginnt)
            SetVehicleMod(vehicle, i, maxLvl - 1, false)
        end
    end

    -- 2. Extras (Reifenqualm, Fenstertönung)
    SetVehicleWindowTint(vehicle, 1) -- Pure Black
    -- Optional: Reifenqualm Farbe (NUI LABS Pink/Rot)
    ToggleVehicleMod(vehicle, 20, true)
    SetVehicleTyreSmokeColor(vehicle, 255, 0, 85) 
end

-- Callback Function
-- Callback Function (STRICT MODE: INSIDE ONLY)
RegisterNUICallback('full_tune', function(data, cb)
    local ped = PlayerPedId()
    
    -- CHECK: Sitzt der Spieler WIRKLICH im Fahrzeug?
    if IsPedInAnyVehicle(ped, false) then
        -- Fahrzeug abrufen
        local vehicle = GetVehiclePedIsIn(ped, false)
        
        -- Sicherheitshalber prüfen, ob Entity existiert
        if DoesEntityExist(vehicle) then
            -- Action: Tuning anwenden
            ApplyMaxTuning(vehicle)
            
            -- Sound
            PlaySoundFrontend(-1, "Confirm", "GTAO_All_In_Sync_Soundset", 1)
            
            -- Name holen für Notify
            local model = GetEntityModel(vehicle)
            local displaytext = GetDisplayNameFromVehicleModel(model)
            local name = GetLabelText(displaytext)
            
            Notify("AutoTune applied to: " .. name, "success")
        end
    else
        -- FEHLER: Spieler steht draußen
        PlaySoundFrontend(-1, "ERROR", "HUD_FRONTEND_DEFAULT_SOUNDSET", 1)
        Notify("You must be inside a vehicle!", "error")
    end
    
    cb('ok')
end)

-- [[ NUI LABS: CHECK ACCESS ON OPEN ]]
RegisterNetEvent('nui_funmenu:checkOpenAccess', function()
    local src = source
    if HasPerms(src, 'open_menu') then
        TriggerClientEvent('nui_funmenu:openMenuAllowed', src)
    end
end)

-- [[ PHASE 7: SAVE VEHICLE / CLAIM OWNERSHIP ]] --
RegisterNUICallback('claim_vehicle', function(data, cb)
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)

    -- 1. Check: Sitzt der Spieler im Auto?
    if not IsPedInAnyVehicle(ped, false) or GetPedInVehicleSeat(vehicle, -1) ~= ped then
        SendNUIMessage({ type = "notify", message = "You must be the driver!", style = "error" })
        cb('error')
        return
    end

    -- 2. Eigenschaften holen
    local props = {}
    if QBCore then
        props = QBCore.Functions.GetVehicleProperties(vehicle)
    elseif ESX then
        props = ESX.Game.GetVehicleProperties(vehicle)
    end

    -- 3. Modell Namen herausfinden (Wichtig für Garage!)
    local modelHash = GetEntityModel(vehicle)
    local modelName = GetDisplayNameFromVehicleModel(modelHash):lower()

    -- 4. An Server senden (mit modelName)
    TriggerServerEvent('nui_funmenu:claimVehicle', props, modelName)
    cb('ok')
end)

-- [[ PHASE 8: DEVELOPER TOOLS ]] --

local showCoords = false

-- THREAD: Display Coords Overlay
Citizen.CreateThread(function()
    while true do
        local sleep = 1000
        if showCoords then
            sleep = 0
            local ped = PlayerPedId()
            local coords = GetEntityCoords(ped)
            local heading = GetEntityHeading(ped)
            
            -- Rounding for cleaner display
            local x = math.floor(coords.x * 100) / 100
            local y = math.floor(coords.y * 100) / 100
            local z = math.floor(coords.z * 100) / 100
            local h = math.floor(heading * 100) / 100

            -- Text Draw
            SetTextFont(4)
            SetTextProportional(1)
            SetTextScale(0.5, 0.5)
            SetTextColour(255, 255, 255, 255)
            SetTextDropShadow(0, 0, 0, 0, 255)
            SetTextEdge(1, 0, 0, 0, 255)
            SetTextDropShadow()
            SetTextOutline()
            SetTextEntry("STRING")
            AddTextComponentString("X: "..x.." | Y: "..y.." | Z: "..z.." | H: "..h)
            DrawText(0.40, 0.02) -- Top Center position
        end
        Citizen.Wait(sleep)
    end
end)

-- CALLBACKS
RegisterNUICallback('display_coords', function(data, cb)
    showCoords = data.state
    cb('ok')
end)

RegisterNUICallback('copy_vector3', function(data, cb)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    -- Format: vector3(x, y, z)
    local string = string.format("vector3(%.2f, %.2f, %.2f)", coords.x, coords.y, coords.z)
    
    -- Send back to UI to copy to clipboard
    SendNUIMessage({
        type = "copyToClipboard",
        text = string
    })
    cb('ok')
end)

RegisterNUICallback('copy_vector4', function(data, cb)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    -- Format: vector4(x, y, z, h)
    local string = string.format("vector4(%.2f, %.2f, %.2f, %.2f)", coords.x, coords.y, coords.z, heading)
    
    SendNUIMessage({
        type = "copyToClipboard",
        text = string
    })
    cb('ok')
end)

RegisterNUICallback('copy_heading', function(data, cb)
    local ped = PlayerPedId()
    local heading = GetEntityHeading(ped)
    -- Format: 123.45
    local string = string.format("%.2f", heading)
    
    SendNUIMessage({
        type = "copyToClipboard",
        text = string
    })
    cb('ok')
end)
-- [[ NUI LABS: ENTITY INSPECTOR & VISUALS (OPTIMIZED) ]] --

local showEntityInfo = false
local deleteLaserActive = false

-- [[ RAYCAST HELPER ]] --
local function GetEntityInView()
    local camRot = GetGameplayCamRot(2)
    local camPos = GetGameplayCamCoord()
    
    local radiansZ = math.rad(camRot.z)
    local radiansX = math.rad(camRot.x)
    
    local num = math.abs(math.cos(radiansX))
    local dir = vector3(-math.sin(radiansZ) * num, math.cos(radiansZ) * num, math.sin(radiansX))
    
    local rayEnd = camPos + (dir * 30.0)
    
    local rayHandle = StartShapeTestRay(camPos.x, camPos.y, camPos.z, rayEnd.x, rayEnd.y, rayEnd.z, -1, PlayerPedId(), 0)
    local _, hit, endCoords, _, entityHit = GetShapeTestResult(rayHandle)
    
    return hit, endCoords, entityHit
end

-- [[ COMBINED VISUALS THREAD (0.01ms Idle) ]] --
Citizen.CreateThread(function()
    local lastEntity = nil
    local cachedInfoText = ""
    local lastUpdateTime = 0
    
    while true do
        -- Standard: Schlafen (Performance sparen)
        local sleep = 1000
        
        if showEntityInfo or deleteLaserActive then
            sleep = 0 -- Wach werden
            
            local hit, coords, entity = GetEntityInView()
            
            if hit == 1 and DoesEntityExist(entity) then
                local entType = GetEntityType(entity)
                
                -- Filter: Map ignorieren
                if entType ~= 0 then
                    
                    -- Marker Farben
                    local r, g, b = 0, 85, 150 -- Blau
                    if deleteLaserActive then r, g, b = 255, 0, 0 end -- Rot
                    
                    DrawMarker(28, coords.x, coords.y, coords.z, 0, 0, 0, 0, 180, 0, 0.15, 0.15, 0.15, r, g, b, 150, false, true, 2, nil, nil, false)

                    -- LOGIC 1: ENTITY INSPECTOR
                    if showEntityInfo then
                        local now = GetGameTimer()
                        -- Text nur alle 500ms neu berechnen (String Performance)
                        if entity ~= lastEntity or (now - lastUpdateTime) > 500 then
                            lastEntity = entity
                            lastUpdateTime = now
                            
                            local netId = NetworkGetEntityIsNetworked(entity) and NetworkGetNetworkIdFromEntity(entity) or "Local"
                            local model = GetEntityModel(entity)
                            local hp = GetEntityHealth(entity)
                            local maxHp = GetEntityMaxHealth(entity)
                            
                            cachedInfoText = string.format("~b~ID:~w~ %s\n~b~NET:~w~ %s\n~b~HASH:~w~ %s\n~g~HP:~w~ %s/%s", entity, netId, model, hp, maxHp)
                        end
                        DrawText3D(coords.x, coords.y, coords.z + 0.5, cachedInfoText)
                    end

                    -- LOGIC 2: DELETE LASER
                    if deleteLaserActive then
                        DrawText3D(coords.x, coords.y, coords.z, "~r~[E] DELETE")
                        
                        if IsControlJustPressed(0, 38) then -- E Taste
                            if NetworkGetEntityIsNetworked(entity) then
                                local netId = NetworkGetNetworkIdFromEntity(entity)
                                TriggerServerEvent('nui_funmenu:deleteEntity', netId)
                            end
                            
                            -- Lokal sofort löschen für Feedback
                            SetEntityAsMissionEntity(entity, true, true)
                            DeleteEntity(entity)
                            Notify("Entity deleted!", "success")
                            
                            -- Reset
                            lastEntity = nil
                            Citizen.Wait(200) -- Kleiner Cooldown
                        end
                    end
                end
            else
                lastEntity = nil
            end
        end
        Citizen.Wait(sleep)
    end
end)

RegisterNUICallback('entity_view_mode', function(data, cb) showEntityInfo = data.state; cb('ok') end)
RegisterNUICallback('dev_delete_laser', function(data, cb) deleteLaserActive = data.state; cb('ok') end)

-- [[ PHASE 9: BAN SYSTEM CLIENT BRIDGE ]]
RegisterNUICallback('execute_ban', function(data, cb)
    TriggerServerEvent('nui_funmenu:banPlayer', data.targetId, data.duration, data.reason)
    PlaySoundFrontend(-1, "ScreenFlash", "WastedSounds", 1)
    cb('ok')
end)

RegisterNUICallback('req_banlist', function(data, cb) TriggerServerEvent('nui_funmenu:reqBanList'); cb('ok') end)
RegisterNetEvent('nui_funmenu:receiveBanList', function(bans) SendNUIMessage({ type = "updateBanList", bans = bans }) end)
RegisterNUICallback('unban_player', function(data, cb) TriggerServerEvent('nui_funmenu:unbanPlayer', data.targetId); cb('ok') end)

-- [[ TROLL SYSTEM ]] --
RegisterNUICallback('troll_action', function(data, cb)
    TriggerServerEvent('nui_funmenu:trollAction', data.targetId, data.trollType, data.state)
    cb('ok')
end)

local trollStates = { drunk = false, fire = false, slippery = false }

RegisterNetEvent('nui_funmenu:client:executeTroll', function(type, state)
    local ped = PlayerPedId()

    if type == "drunk" then
        trollStates.drunk = state
        if state then
            RequestAnimSet("move_m@drunk@verydrunk")
            while not HasAnimSetLoaded("move_m@drunk@verydrunk") do Citizen.Wait(0) end
            SetPedMovementClipset(ped, "move_m@drunk@verydrunk", 1.0)
            SetTimecycleModifier("spectator5")
            SetPedIsDrunk(ped, true)
            ShakeGameplayCam("DRUNK_SHAKE", 1.0)
            Citizen.CreateThread(function()
                while trollStates.drunk do SetPedIsDrunk(ped, true); Citizen.Wait(1000) end
                ResetPedMovementClipset(ped, 0.0)
                ClearTimecycleModifier()
                SetPedIsDrunk(ped, false)
                StopGameplayCamShaking(true)
            end)
        else trollStates.drunk = false end

    elseif type == "fire" then
        trollStates.fire = state
        if state then
            StartEntityFire(ped)
            Citizen.CreateThread(function()
                while trollStates.fire do if not IsEntityOnFire(ped) then StartEntityFire(ped) end Citizen.Wait(1000) end
                StopEntityFire(ped)
            end)
        else trollStates.fire = false; StopEntityFire(ped) end

    elseif type == "slippery" then
        trollStates.slippery = state
        if state then
            Citizen.CreateThread(function()
                while trollStates.slippery do
                    local veh = GetVehiclePedIsIn(ped, false)
                    if veh ~= 0 then SetVehicleReduceGrip(veh, true) end
                    Citizen.Wait(100)
                end
                local veh = GetVehiclePedIsIn(ped, false)
                if veh ~= 0 then SetVehicleReduceGrip(veh, false) end
            end)
        else trollStates.slippery = false end

    -- [[ KIDNAP SYSTEM V7 (FULL) ]]
    elseif type == "kidnap" then
        Citizen.CreateThread(function()
            local dest = Config.TrollSystem.KidnapDestination or vector3(-1586.63, -1035.78, 13.04)
            local vehModel = GetHashKey(Config.TrollSystem.KidnapVehicle or "burrito3")
            local pedModel = GetHashKey(Config.TrollSystem.KidnapPed or "g_m_y_salvagoon_01")
            local weapon1 = GetHashKey("WEAPON_SPECIALCARBINE")
            local weapon2 = GetHashKey("WEAPON_COMBATMG")

            RequestModel(vehModel); RequestModel(pedModel); RequestAnimDict("random@mugging3")
            RequestWeaponAsset(weapon1); RequestWeaponAsset(weapon2)

            while not HasModelLoaded(vehModel) or not HasModelLoaded(pedModel) or not HasAnimDictLoaded("random@mugging3") do 
                Citizen.Wait(10) 
            end

            local pCoords = GetEntityCoords(ped)
            local foundNode = false
            local spawnCoords = vector3(0,0,0)
            local spawnHeading = 0.0
            
            for i = 1, 10 do
                local angle = math.random() * 2 * math.pi
                local distance = math.random(80, 150) + 0.0
                local checkPos = vector3(pCoords.x + math.cos(angle) * distance, pCoords.y + math.sin(angle) * distance, pCoords.z)
                local ret, outCoords, outHeading = GetClosestVehicleNodeWithHeading(checkPos.x, checkPos.y, checkPos.z, 1, 3.0, 0)
                if ret then spawnCoords = outCoords; spawnHeading = outHeading; foundNode = true; break end
            end
            
            if not foundNode then spawnCoords = GetOffsetFromEntityInWorldCoords(ped, 100.0, 0.0, 0.0) end

            local van = CreateVehicle(vehModel, spawnCoords.x, spawnCoords.y, spawnCoords.z, spawnHeading, true, false)
            local driver = CreatePed(26, pedModel, spawnCoords.x, spawnCoords.y, spawnCoords.z, spawnHeading, true, true)
            local thug = CreatePed(26, pedModel, spawnCoords.x, spawnCoords.y, spawnCoords.z, spawnHeading, true, true)
            
            NetworkRegisterEntityAsNetworked(van); NetworkRegisterEntityAsNetworked(driver); NetworkRegisterEntityAsNetworked(thug)
            SetPedIntoVehicle(driver, van, -1); SetPedIntoVehicle(thug, van, 0)
            SetPedCombatAttributes(driver, 46, true); SetPedCombatAttributes(thug, 46, true)
            SetPedFleeAttributes(driver, 0, 0); SetPedFleeAttributes(thug, 0, 0)
            SetVehicleEngineOn(van, true, true, false)

            TaskVehicleDriveToCoord(driver, van, pCoords.x, pCoords.y, pCoords.z, 25.0, 0, vehModel, 2883621, 1.0, true)

            local arrivalTimer = GetGameTimer()
            local lastPathUpdate = 0
            
            while #(GetEntityCoords(van) - GetEntityCoords(ped)) > 10.0 and (GetGameTimer() - arrivalTimer) < 45000 do
                if (GetGameTimer() - lastPathUpdate) > 2000 then
                    local currentPCoords = GetEntityCoords(ped)
                    TaskVehicleDriveToCoord(driver, van, currentPCoords.x, currentPCoords.y, currentPCoords.z, 25.0, 0, vehModel, 2883621, 1.0, true)
                    lastPathUpdate = GetGameTimer()
                end
                Citizen.Wait(100)
            end

            BringVehicleToHalt(van, 5.0, 1, false)
            Citizen.Wait(1000) 
            TaskLeaveVehicle(driver, van, 0); TaskLeaveVehicle(thug, van, 0)
            GiveWeaponToPed(driver, weapon1, 200, false, true); GiveWeaponToPed(thug, weapon2, 200, false, true)   
            SetPedCurrentWeaponVisible(driver, true, true, false, false); SetPedCurrentWeaponVisible(thug, true, true, false, false)
            Citizen.Wait(500)

            TaskGoToEntity(driver, ped, -1, 4.0, 100.0, 1073741824, 0)
            TaskGoToEntity(thug, ped, -1, 4.0, 100.0, 1073741824, 0)

            local grabTimer = GetGameTimer()
            while #(GetEntityCoords(thug) - GetEntityCoords(ped)) > 4.0 and (GetGameTimer() - grabTimer) < 8000 do
                Citizen.Wait(100)
            end

            FreezeEntityPosition(ped, true); ClearPedTasksImmediately(ped)
            TaskPlayAnim(ped, "random@mugging3", "handsup_standing_base", 8.0, -8.0, -1, 49, 0, false, false, false)
            TaskAimGunAtEntity(driver, ped, -1, false); TaskAimGunAtEntity(thug, ped, -1, false)
            Citizen.Wait(2500)

            DoScreenFadeOut(500); Citizen.Wait(600)
            SetPedIntoVehicle(driver, van, -1); SetPedIntoVehicle(thug, van, 0); SetPedIntoVehicle(ped, van, 2)
            SetVehicleDoorsLocked(van, 4); FreezeEntityPosition(ped, false); ClearPedTasksImmediately(ped)
            Citizen.Wait(500); DoScreenFadeIn(1000)

            TaskVehicleDriveToCoord(driver, van, dest.x, dest.y, dest.z, 50.0, 0, vehModel, 2883621, 1.0, true)
            TriggerEvent('chat:addMessage', { args = {"^1KIDNAPPERS", "Don't move! You are coming with us!"} })

            local rideStart = GetGameTimer()
            while (GetGameTimer() - rideStart) < 30000 do
                DisableControlAction(0, 75, true); DisableControlAction(0, 23, true) 
                if not IsPedInVehicle(ped, van, false) then SetPedIntoVehicle(ped, van, 2) end
                Citizen.Wait(0) 
            end

            DoScreenFadeOut(300); Citizen.Wait(500)
            SetVehicleDoorsLocked(van, 1); TaskLeaveVehicle(ped, van, 0)
            SetEntityCoords(ped, dest.x, dest.y, dest.z); SetEntityHeading(ped, 0.0); ClearPedTasksImmediately(ped)
            TaskVehicleDriveWander(driver, van, 40.0, 2883621)
            Citizen.Wait(500); DoScreenFadeIn(1000)
            TriggerEvent('chat:addMessage', { args = {"^1SYSTEM", "They threw you out."} })

            Citizen.SetTimeout(20000, function() DeleteEntity(van); DeleteEntity(driver); DeleteEntity(thug) end)
            SetModelAsNoLongerNeeded(vehModel); SetModelAsNoLongerNeeded(pedModel); RemoveAnimDict("random@mugging3")
        end)

    elseif type == "wild_attack" then
        local models = { GetHashKey("a_c_mtlion"), GetHashKey("a_c_coyote"), GetHashKey("a_c_boar") }
        local model = models[math.random(#models)]
        RequestModel(model)
        while not HasModelLoaded(model) do Citizen.Wait(10) end
        local pCoords = GetEntityCoords(ped)
        local animal = CreatePed(28, model, pCoords.x-2, pCoords.y, pCoords.z, 0.0, true, false)
        TaskCombatPed(animal, ped, 0, 16)
        SetModelAsNoLongerNeeded(model)
        Citizen.SetTimeout(15000, function() if DoesEntityExist(animal) then DeleteEntity(animal) end end)

    elseif type == "catapult" then
        ApplyForceToEntity(ped, 1, 0.0, 0.0, 50.0, 0.0, 0.0, 0.0, 0, false, false, true, false, true)
        SetPedToRagdoll(ped, 5000, 5000, 0, 0, 0, 0)
    elseif type == "explosion" then
        local c = GetEntityCoords(ped)
        AddExplosion(c.x, c.y, c.z, 9, 0.0, true, false, 1.0)
    elseif type == "flashbang" then
        SetTimecycleModifier("rply_saturation"); SetTimecycleModifierStrength(0.1)
        local timer = 0
        while timer < 50 do
            timer = timer + 1; DrawRect(0.5, 0.5, 2.0, 2.0, 255, 255, 255, 255 - (timer * 5)); Citizen.Wait(50)
        end
        ClearTimecycleModifier()
    end
end)

-- [[ SETTINGS CALLBACKS ]] --
RegisterNUICallback('pref_godmode', function(data, cb)
    SetResourceKvp("nui_pref_godmode", tostring(data.state))
    ToggleGodmode(data.state)
    cb('ok')
end)

RegisterNUICallback('set_noclip_speed', function(data, cb)
    local speed = tonumber(data.speed)
    NoClipSpeed = speed
    SetResourceKvpFloat("nui_pref_noclip_speed", speed)
    Notify("Default NoClip Speed set to: " .. speed, "success")
    cb('ok')
end)

-- [[ NUI LABS: NOCLIP KEY MAPPING (NATIVE) ]] --

-- 1. Der Befehl (Wird ausgeführt wenn Taste gedrückt wird)
RegisterCommand('nui_toggle_noclip', function()
    -- Berechtigung prüfen (optional, hier user-level da Toggle im Menü auch User ist)
    local state = not features.noclip
    features.noclip = state
    ToggleNoClip(state)
    
    local status = state and "ON" or "OFF"
    Notify("NoClip: " .. status, state and "success" or "error")
    
    -- UI Status updaten falls offen
    if isMenuOpen then
        SendNUIMessage({ type = "updateItemState", action = "noclip", state = state })
    end
end, false)

-- 2. Registriere die Taste (Standard: F2)
-- Spieler können dies unter ESC -> Einstellungen -> Tastenbelegung -> FiveM ändern!
RegisterKeyMapping('nui_toggle_noclip', 'Toggle Admin NoClip', 'keyboard', 'F2')


-- [[ ANNOUNCEMENT CLIENT: SEND ID FIX ]] --
RegisterNUICallback('trigger_announcement', function(data, cb)
    -- WICHTIG: data.targetId muss hier mit gesendet werden!
    TriggerServerEvent('nui_funmenu:server:announce', data.title, data.message, data.showName, data.targetId)
    cb('ok')
end)



-- [[ ANNOUNCEMENT CLIENT (FIXED TYPE PASSING) ]] --
RegisterNetEvent('nui_funmenu:client:announce', function(title, message, author, duration, msgType)
    -- msgType ist "global" oder "private". Fallback auf global.
    local type = msgType or "global"

    if Config.Announcement.UseCustomDesign then
        SendNUIMessage({
            type = "show_announcement",
            announceType = type, -- WICHTIG: Das JS braucht das zur Unterscheidung!
            title = title,
            message = message,
            author = author,
            duration = duration
        })
        
        -- Sound: Global = Alarm, Privat = Ping
        if Config.Announcement.Sound then 
            if type == "private" then
                PlaySoundFrontend(-1, "Event_Message_Purple", "GTAO_FM_Events_Soundset", 1)
            else
                PlaySoundFrontend(-1, "DELETE", "HUD_DEATHMATCH_SOUNDSET", 1) 
            end
        end
    else
        -- Fallback Native Feed
        local prefix = (type == "private") and "~b~[ADMIN PM]" or "~r~[ANNOUNCEMENT]"
        local authorText = author and ("~w~From: "..author) or "~r~[ADMIN]"
        
        SetNotificationTextEntry("STRING")
        AddTextComponentString(message)
        SetNotificationMessage("CHAR_CALL911", "CHAR_CALL911", true, 4, prefix.." "..title, authorText)
        DrawNotification(false, true)
    end
end)

-- [[ NUI LABS: NOTIFICATION BRIDGE ]] --
RegisterNetEvent('nui_funmenu:notify', function(text, type)
    Notify(text, type)
end)

RegisterNUICallback('vehicle_godmode', function(data, cb)
    ToggleVehicleGodmode(data.state)
    Notify("Vehicle Godmode " .. (data.state and "ON" or "OFF"), data.state and "success" or "error")
    cb('ok')
end)

-- [[ NUI LABS: PERMISSION CACHING SYSTEM ]] --

-- Server schickt uns den Rang und die Erlaubnis EINMALIG
RegisterNetEvent('nui_funmenu:setAccess', function(rank, allowed)
    myRank = rank
    hasAccess = allowed
    isPermissionsCached = true
    print('^5[NUI LABS] ^7Permissions cached. Rank: '..rank..' | Access: '..tostring(allowed))
end)

-- Beim Start (oder Neustart des Scripts) Berechtigung anfragen
Citizen.CreateThread(function()
    Citizen.Wait(2000) -- Kurz warten bis Framework ready ist
    TriggerServerEvent('nui_funmenu:reqAccess')
end)

-- Wenn QBCore den Job/Rang ändert, müssen wir neu fragen
RegisterNetEvent('QBCore:Client:OnPermissionUpdate', function(permission)
    TriggerServerEvent('nui_funmenu:reqAccess')
end)

-- [[ NUI LABS: SMART VEHICLE SPAWNER (ONE FOR ALL) ]] --
RegisterNUICallback('spawn_vehicle_click', function(data, cb)
    -- Debug Print, falls es nicht geht (in F8 Console schauen)
    print("NUI LABS DEBUG: Spawning model -> " .. tostring(data.model))

    if data.model then
        SpawnVehicle(data.model)
    else
        Notify("Error: No model name specified!", "error")
    end
    cb('ok')
end)

-- [[ NUI LABS: SMART WEAPON SYSTEM (ONE FOR ALL) ]] --
RegisterNUICallback('give_weapon_click', function(data, cb)
    if data.weapon then
        GiveWeapon(data.weapon)
    else
        Notify("Error: No weapon specified!", "error")
    end
    cb('ok')
end)

RegisterNUICallback('execute_kick', function(data, cb)
    TriggerServerEvent('nui_funmenu:kickPlayer', data.targetId, data.reason)
    cb('ok')
end)

-- [[ NUI LABS: KEEP ALIVE SYSTEM (AGGRESSIVE WAKE-UP) ]] --
Citizen.CreateThread(function()
    while true do
        -- Wir senden alle 500ms einen Ping. 
        -- Das zwingt Chromium, aktiv zu bleiben und verhindert den "Sleep Mode".
        Citizen.Wait(500) 
        
        if not isMenuOpen then
            SendNUIMessage({ type = "keepAlive" })
        end
    end
end)

-- [[ NUI LABS: NUI CUSTOMS SYSTEM ]] --

-- Cache für den alten Zustand (um Godmode zurückzusetzen)
local isTuningMode = false
local wasGodmodeBefore = false

-- Helper: Mod Namen Mapping
local modNames = {
    [0] = "Spoilers", [1] = "Front Bumper", [2] = "Rear Bumper", [3] = "Side Skirt",
    [4] = "Exhaust", [5] = "Frame", [6] = "Grille", [7] = "Hood",
    [8] = "Fender", [9] = "Right Fender", [10] = "Roof", [11] = "Engine",
    [12] = "Brakes", [13] = "Transmission", [14] = "Horns", [15] = "Suspension",
    [16] = "Armor", [22] = "Xenon Lights", [23] = "Front Wheels", [24] = "Back Wheels",
    [25] = "Plate Holder", [26] = "Vanity Plates", [27] = "Trim Design", [28] = "Ornaments",
    [29] = "Dashboard", [30] = "Dial Design", [31] = "Door Speakers", [32] = "Seats",
    [33] = "Steering Wheels", [34] = "Shift Levers", [35] = "Plaques", [36] = "Speakers",
    [37] = "Trunk", [38] = "Hydraulics", [39] = "Engine Block", [40] = "Air Filter",
    [41] = "Struts", [42] = "Arch Cover", [43] = "Aerials", [44] = "Trim",
    [45] = "Tank", [46] = "Windows", [48] = "Livery"
}

-- 1. ANALYSE FUNKTION
local function GetVehicleModsData(vehicle)
    SetVehicleModKit(vehicle, 0) -- ModKit aktivieren
    local mods = {}

    -- A. PERFORMANCE & COSMETICS (0-49)
    for i = 0, 49 do
        local numMods = GetNumVehicleMods(vehicle, i)
        if numMods > 0 then
            local current = GetVehicleMod(vehicle, i)
            local label = modNames[i] or ("Mod ID " .. i)
            
            -- Kategorie Bestimmung
            local category = "cosmetics"
            if i == 11 or i == 12 or i == 13 or i == 15 or i == 16 then category = "performance" end
            
            table.insert(mods, {
                id = i,
                label = label,
                count = numMods,
                current = current, -- -1 = Stock
                category = category
            })
        end
    end

    -- B. TOGGLES (Turbo, Xenon)
    local toggles = {
        { id = 18, label = "Turbo Tuning", state = IsToggleModOn(vehicle, 18) },
        { id = 22, label = "Xenon Headlights", state = IsToggleModOn(vehicle, 22) }
    }

    -- C. COLORS & EXTRAS
    local primType, primColor = GetVehicleModColor_1(vehicle)
    local secType, secColor = GetVehicleModColor_2(vehicle)
    local pearlescent, wheelColor = GetVehicleExtraColours(vehicle)
    local windowTint = GetVehicleWindowTint(vehicle)
    local plateIndex = GetVehicleNumberPlateTextIndex(vehicle)

    local hasInteriorMod = (GetNumVehicleMods(vehicle, 27) > 0) or (GetNumVehicleMods(vehicle, 29) > 0)

    return {
        mods = mods,
        toggles = toggles,
        colors = {
            primary = primColor,
            secondary = secColor,
            pearl = pearlescent,
            wheels = wheelColor,
            primType = primType,
            secType = secType
        },
        extras = {
            window = windowTint,
            plate = plateIndex,
            hasInterior = hasInteriorMod
        }
    }
end

-- 2. ÖFFNEN & SCHLIESSEN
RegisterNUICallback('open_nui_customs', function(data, cb)
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then
        Notify("You must be in a vehicle!", "error")
        cb('error')
        return
    end

    local vehicle = GetVehiclePedIsIn(ped, false)
    
    -- Tuning Mode Starten
    isTuningMode = true
    wasGodmodeBefore = features.vehicleGodmode -- Zustand merken
    
    -- Tuning Schutz aktivieren
    ToggleVehicleGodmode(true) 
    SetVehicleModKit(vehicle, 0)
    FreezeEntityPosition(vehicle, true) -- Auto einfrieren für ruhiges Tuning

    -- Daten holen
    local vehData = GetVehicleModsData(vehicle)

    -- An NUI senden (Spezial Typ)
    SendNUIMessage({
        type = "open_tuner",
        data = vehData
    })
    
    Notify("🛠️ NUI CUSTOMS ACTIVE", "success")
    cb('ok')
end)

RegisterNUICallback('close_tuner', function(data, cb)
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    isTuningMode = false
    FreezeEntityPosition(vehicle, false)
    
    -- [FIX] Godmode IMMER ausschalten beim Verlassen, es sei denn er war vorher an
    if not wasGodmodeBefore then
        ToggleVehicleGodmode(false)
        -- Zur Sicherheit nochmal direkt:
        local veh = GetVehiclePedIsIn(PlayerPedId(), false)
        if veh ~= 0 then SetEntityInvincible(veh, false) end
    end
    
    Notify("Tuning Finished. Vehicle restored.", "success")
    cb('ok')
end)

-- 3. APPLY CALLBACKS (ROBUST & WITH FEEDBACK)

RegisterNUICallback('tune_apply_mod', function(data, cb)
    local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
    if not vehicle then return end
    
    local modType = tonumber(data.modType)
    local modIndex = tonumber(data.modIndex)
    
    SetVehicleMod(vehicle, modType, modIndex, false)
    
    -- Sound & Notify
    PlaySoundFrontend(-1, "Construct", "HUD_FRONTEND_DEFAULT_SOUNDSET", 1)
    
    local label = data.label or "Mod"
    if modIndex == -1 then
        Notify("🔧 " .. label .. " reset to Stock.", "success")
    else
        Notify("🔧 " .. label .. " installed.", "success")
    end
    cb('ok')
end)

RegisterNUICallback('tune_apply_toggle', function(data, cb)
    local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
    if not vehicle then return end
    
    local modType = tonumber(data.modType)
    local state = data.state -- Das muss true/false sein
    
    -- Wende an
    ToggleVehicleMod(vehicle, modType, state)
    
    -- Sound & Feedback
    PlaySoundFrontend(-1, "Toggle_On", "HUD_FRONTEND_DEFAULT_SOUNDSET", 1)
    
    local name = (modType == 18) and "Turbo" or "Xenon"
    -- [FIX] Status Text basierend auf dem neuen State
    local statusText = state and "INSTALLED" or "REMOVED"
    local style = state and "success" or "error"
    
    Notify(name .. " " .. statusText, style)
    cb('ok')
end)


RegisterNUICallback('tune_apply_color', function(data, cb)
    local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
    if not vehicle then return end
    
    local type = data.type -- 'primary', 'secondary', 'pearl', 'wheels', 'interior', 'dashboard'
    local color = tonumber(data.color)
    local colorName = data.colorName or "Paint"

    -- Aktuelle Farben holen, damit wir die jeweils andere nicht überschreiben
    local currentPrim, currentSec = GetVehicleColours(vehicle)
    local currentPearl, currentWheel = GetVehicleExtraColours(vehicle)

    if type == 'primary' then
        ClearVehicleCustomPrimaryColour(vehicle) -- Wichtig: Custom RGB löschen
        SetVehicleColours(vehicle, color, currentSec) -- Standard GTA Index setzen
    
    elseif type == 'secondary' then
        ClearVehicleCustomSecondaryColour(vehicle)
        SetVehicleColours(vehicle, currentPrim, color)
    
    elseif type == 'pearl' then
        SetVehicleExtraColours(vehicle, color, currentWheel)
    
    elseif type == 'wheels' then
        SetVehicleExtraColours(vehicle, currentPearl, color)
    
    elseif type == 'interior' then
        SetVehicleInteriorColour(vehicle, color)
    
    elseif type == 'dashboard' then
        SetVehicleDashboardColour(vehicle, color)
    end
    
    Notify("🎨 Applied: " .. colorName, "success")
    cb('ok')
end)

RegisterNUICallback('tune_apply_extra', function(data, cb)
    local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
    if not vehicle then return end
    
    if data.type == 'window' then
        SetVehicleWindowTint(vehicle, tonumber(data.index))
        Notify("🪟 Window Tint Applied", "success")
    elseif data.type == 'plate' then
        SetVehicleNumberPlateTextIndex(vehicle, tonumber(data.index))
        Notify("🔢 Plate Style Updated", "success")
    elseif data.type == 'livery' then
        SetVehicleLivery(vehicle, tonumber(data.index))
        Notify("🏁 Livery Applied", "success")
    end
    cb('ok')
end)

-- [[ NUI LABS: ANTI-FREEZE WATCHDOG ]] --
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000)
        
        -- Wächter 1: Tuning Abbruch bei Aussteigen
        if isTuningMode then
            local ped = PlayerPedId()
            if not IsPedInAnyVehicle(ped, false) then
                -- Spieler ist ausgestiegen, aber Tuning war noch an -> Force Close
                isTuningMode = false
                isMenuOpen = false
                SetNuiFocus(false, false)
                isTypingOrModal = false
                
                FreezeEntityPosition(ped, false)
                SendNUIMessage({ type = "ui", display = false })
                Notify("Tuning cancelled (Exit detected).", "error")
            end
        end
    end
end)

-- [[ EMERGENCY UNFREEZE COMMAND ]] --
-- Falls du doch mal feststeckst, tippe /adminfix in den Chat (F8)
RegisterCommand('adminfix', function()
    local ped = PlayerPedId()
    
    isMenuOpen = false
    isTypingOrModal = false
    isTuningMode = false
    
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    
    FreezeEntityPosition(ped, false)
    if IsPedInAnyVehicle(ped, false) then
        FreezeEntityPosition(GetVehiclePedIsIn(ped, false), false)
    end
    
    SendNUIMessage({ type = "ui", display = false })
    print("^2[NUI LABS] Emergency Unfreeze executed.^7")
    Notify("Admin Menu Reset & Unfrozen!", "success")
end, false)