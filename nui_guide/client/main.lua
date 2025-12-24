local display = false
local mapModel = "prop_tourist_map_01"
local animDict = "amb@world_human_tourist_map@male@base"
local animName = "base"
local mapspawned = nil -- Hält die Entity-ID des Props
local map_net = nil -- Hält die Net-ID des Props

-- Function to handle visibility and focus AND animation
function SetDisplay(bool)
    display = bool
    local playerPed = GetPlayerPed(PlayerId())
    
    -- 1. Steuerung der Animation und des Props
    if bool then
        -- Menü wird geöffnet: Animation starten und Prop spawnen
        
        -- Model laden
        RequestModel(mapModel)
        while not HasModelLoaded(mapModel) do
            Wait(0)
        end
        
        -- Animation Dictionary laden
        RequestAnimDict(animDict)
        while not HasAnimDictLoaded(animDict) do
            Wait(0)
        end
        
        -- Prop spawnen und als Networked Entity behandeln (wichtig für andere Spieler)
        -- Wir nutzen CreateObject statt CreateObjectNoOffset für eine einfachere Handhabung,
        -- und machen es ein Netzwerk-Objekt.
        mapspawned = CreateObject(GetHashKey(mapModel), GetEntityCoords(playerPed), true, true, true)
        
        -- Net-ID speichern, falls es später als Netzwerk-Objekt gelöscht werden muss
        map_net = ObjToNet(mapspawned)

        -- Prop an den Spieler anhängen
        -- Bone-ID 28422 ist die rechte Hand (hand_r)
        AttachEntityToEntity(
            mapspawned, -- Entity die angehängt wird (der Prop)
            playerPed, -- Entity an die angehängt wird (der Spieler)
            GetPedBoneIndex(playerPed, 28422), -- Bone-Index für die rechte Hand
            0.0, 0.0, 0.0, -- Offset-Koordinaten (anpassen für genaue Position)
            0.0, 0.0, 0.0, -- Rotations-Koordinaten (anpassen für genaue Rotation)
            true, -- useSoftPinning
            true, -- collision
            false, -- isPed
            true, -- vertexBlend
            0, -- fixedRot
            true -- useWorldCoords
        )
        
        -- Animation abspielen
        -- Flag 50 = 32 (Loop) + 16 (Allow movement) + 2 (Upperbody only, aber hier ist die ganze Animation)
        -- Hier nutzen wir -1 für die Dauer um zu loopen, bis sie gestoppt wird.
        TaskPlayAnim(playerPed, animDict, animName, 8.0, -1.0, -1, 50, 0.0, false, false, false) 
        
    else
        -- Menü wird geschlossen: Animation stoppen und Prop entfernen
        
        -- Animation stoppen und sekundäre Tasks löschen
        ClearPedTasksImmediately(playerPed) -- Stoppt alle Tasks, einschließlich TaskPlayAnim

        if mapspawned ~= nil and DoesEntityExist(mapspawned) then
            -- Prop von Spieler trennen
            DetachEntity(mapspawned, true, true)
            
            -- Prop löschen
            DeleteEntity(mapspawned)
            
            -- Models freigeben
            SetModelAsNoLongerNeeded(mapModel)
            RemoveAnimDict(animDict)

            mapspawned = nil
            map_net = nil
        end
    end
    
    -- 2. Control the mouse cursor and keyboard focus
    SetNuiFocus(bool, bool)
    
    -- 3. Send data to the UI (HTML/JS)
    SendNUIMessage({
        type = "ui",
        status = bool,
        resourceName = GetCurrentResourceName(), 
        categories = Config.Categories, 
        colors = Config.Colors
    })
end

-- Command Registration (defined in Config)
RegisterCommand(Config.OpenCommand, function()
    SetDisplay(not display)
end)

-- Key Mapping (Settings -> Keybinds -> FiveM)
RegisterKeyMapping(Config.OpenCommand, 'Open Server Guide', 'keyboard', Config.OpenKey)

-- NUI Callback: When user presses ESC in the UI
RegisterNUICallback('close', function(data, cb)
    SetDisplay(false)
    cb('ok')
end)