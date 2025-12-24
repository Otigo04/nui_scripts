local isTabletOpen = false
local tabletProp = nil -- Variable to store the tablet object
local tabletModel = "prop_cs_tablet"
local tabletDict = "amb@code_human_in_bus_passenger_idles@female@tablet@idle_a"
local tabletAnim = "idle_a"

-- Command and Keymapping
RegisterCommand(Config.OpenCommand, function()
    if not isTabletOpen then
        ToggleTablet(true)
    else
        ToggleTablet(false)
    end
end)

RegisterKeyMapping(Config.OpenCommand, 'Open NUI Tablet', 'keyboard', Config.OpenKey)

function ToggleTablet(show)
    isTabletOpen = show
    
    if show then
        -- 1. Start Animation & Prop
        StartTabletAnimation()

        -- 2. Send UI Data
        SendNUIMessage({
            action = 'open',
            apps = Config.Apps,
            timezone = Config.Timezone,
            locale = Config.Locale,
            wallpapers = Config.Wallpapers
        })
        SetNuiFocus(true, true)
    else
        -- 1. Stop Animation & Prop
        StopTabletAnimation()

        -- 2. Reset Mouse
        SetCursorLocation(0.5, 0.5)
        SetNuiFocus(false, false)
        
        SendNUIMessage({
            action = 'close'
        })
    end
end

-- Callback to launch apps (closes tablet)
RegisterNUICallback('launchExternalApp', function(data, cb)
    local appName = data.app
    
    -- 1. Close the Tablet
    ToggleTablet(false)
    
    -- 2. Wait a moment for the animation
    Citizen.Wait(200)

    -- 3. Check which app was clicked and execute the command
    if appName == 'email' then
        ExecuteCommand("nui_mail_open")
    
    elseif appName == 'stocks' then
        -- This command triggers the nui_stocks client script
        ExecuteCommand("nui_stocks_open")
        
    elseif appName == 'settings' then
        -- Internal logic, usually handled in JS, but just in case
        print("Settings opened internally")
    end

    cb('ok')
end)

RegisterNUICallback('closeUI', function(data, cb)
    isTabletOpen = false
    SetNuiFocus(false, false)
    StopTabletAnimation() -- Ensure animation stops
    cb('ok')
end)

-- --- ANIMATION FUNCTIONS ---

function StartTabletAnimation()
    local ped = PlayerPedId()

    -- Load Animation Dictionary
    RequestAnimDict(tabletDict)
    while not HasAnimDictLoaded(tabletDict) do
        Citizen.Wait(100)
    end

    -- Load Prop Model
    RequestModel(tabletModel)
    while not HasModelLoaded(tabletModel) do
        Citizen.Wait(100)
    end

    -- Create Object
    tabletProp = CreateObject(GetHashKey(tabletModel), 0, 0, 0, true, true, true)
    
    -- Attach to Right Hand (Bone 28422)
    -- Formatting: (object, ped, boneIndex, x, y, z, xRot, yRot, zRot, p9, useSoftPinning, collision, isPed, vertexIndex, fixedRot)
    AttachEntityToEntity(tabletProp, ped, GetPedBoneIndex(ped, 28422), -0.05, 0.0, 0.0, 0.0, 0.0, 0.0, true, true, false, true, 1, true)

    -- Play Animation
    TaskPlayAnim(ped, tabletDict, tabletAnim, 3.0, 3.0, -1, 49, 0, 0, 0, 0)
end

function StopTabletAnimation()
    local ped = PlayerPedId()
    
    -- Clear Animation
    ClearPedTasks(ped)

    -- Delete Prop
    if tabletProp ~= nil then
        DeleteEntity(tabletProp)
        tabletProp = nil
    end
end