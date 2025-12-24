local QBCore = exports['qb-core']:GetCoreObject()
local tabletProp = nil
local tabletDict = "amb@code_human_in_bus_passenger_idles@female@tablet@idle_a"
local tabletAnim = "idle_a"
local tabletModel = "prop_cs_tablet"

local function _L(key)
    local lang = Config.Locale or 'en'
    if not Config.Locales[lang] then lang = 'en' end
    return Config.Locales[lang][key] or "MISSING: "
end

local display = false

-- 1. Animation & Prop Handling
local function ToggleTablet(bool)
    -- Config Check: Soll Animation überhaupt spielen?
    if not Config.EnableAnimation then return end

    local ped = PlayerPedId()

    if bool then
        -- Nur Animation starten, wenn UI auch wirklich offen ist
        if not display then return end

        RequestAnimDict(tabletDict)
        while not HasAnimDictLoaded(tabletDict) do Citizen.Wait(10) end

        RequestModel(tabletModel)
        while not HasModelLoaded(tabletModel) do Citizen.Wait(10) end

        if not tabletProp then
            tabletProp = CreateObject(GetHashKey(tabletModel), 0.0, 0.0, 0.0, true, true, false)
            AttachEntityToEntity(tabletProp, ped, GetPedBoneIndex(ped, 28422), -0.05, 0.0, 0.0, 0.0, 0.0, 0.0, true, true, false, true, 1, true)
        end

        TaskPlayAnim(ped, tabletDict, tabletAnim, 3.0, 3.0, -1, 49, 0, 0, 0, 0)
    else
        -- Tablet schließen (Sauberer Cleanup)
        ClearPedTasks(ped)
        
        if tabletProp then
            -- Erst loslösen, dann löschen (verhindert Glitching)
            DetachEntity(tabletProp, true, true)
            DeleteEntity(tabletProp)
            tabletProp = nil
        end
    end
end

-- 2. SetDisplay Funktion (Diese hat gefehlt!)
function SetDisplay(bool)
    display = bool
    SetNuiFocus(bool, bool)
    ToggleTablet(bool)

    if bool then
        -- ÖFFNEN: Daten abrufen und UI anzeigen
        QBCore.Functions.TriggerCallback('nui_mail:fetchMails', function(mails, myEmail, myCitizenId, locales, accounts)
            SendNUIMessage({
                type = "ui",
                action = "open",
                mails = mails,
                myEmail = myEmail,
                myCitizenId = myCitizenId,
                locales = locales,
                accounts = accounts,
                domain = Config.Domain,
                uiScale = Config.UIScale,
                config = Config
            })
        end)
    else
        -- SCHLIEßEN: UI ausblenden
        SendNUIMessage({
            type = "ui",
            action = "close"
        })
    end
end

-- 3. Callbacks & Events

-- Callback vom NUI, wenn ESC gedrückt wird
RegisterNUICallback("closeUI", function(data, cb)
    -- WICHTIG: Hier rufen wir NICHT SetDisplay(false) auf, um den Loop zu vermeiden.
    -- Wir setzen nur den Client-Status zurück.
    display = false
    SetNuiFocus(false, false)
    ToggleTablet(false) -- Animation stoppen
    
    cb("ok")
end)

-- Command & Keymapping
RegisterCommand("nui_mail_open", function()
    local PlayerData = QBCore.Functions.GetPlayerData()
    
    -- Checks: Tot, Bewusstlos oder Handschellen
    if PlayerData.metadata["isdead"] or PlayerData.metadata["inlaststand"] then
        QBCore.Functions.Notify(_L('error_cannot_open'), "error")
        return
    end
    if PlayerData.metadata["cuffed"] or PlayerData.metadata["handcuffed"] then 
        return 
    end

    -- Toggle Logik
    if not display then
        SetDisplay(true)
    else
        SetDisplay(false)
    end
end, false)

RegisterKeyMapping("nui_mail_open", _L('key_description') or "Open Mail", "keyboard", Config.OpenKey)

RegisterNUICallback("sendMail", function(data, cb)
    TriggerServerEvent('nui_mail:send', data)
    cb('ok')
end)

RegisterNUICallback("deleteMail", function(data, cb)
    TriggerServerEvent('nui_mail:delete', data)
    cb('ok')
end)

-- Blockiert Controls, wenn UI offen ist
Citizen.CreateThread(function()
    while true do
        if display then
            DisableControlAction(0, 1, true)
            DisableControlAction(0, 2, true)
            DisableControlAction(0, 24, true)
            DisableControlAction(0, 257, true)
            DisableControlAction(0, 30, true)
            DisableControlAction(0, 31, true)
        else
            Citizen.Wait(500)
        end
        Citizen.Wait(0)
    end
end)

RegisterNUICallback("refreshData", function(data, cb)
    QBCore.Functions.TriggerCallback('nui_mail:fetchMails', function(mails, myEmail, myCitizenId, locales, accounts)
        SendNUIMessage({
            type = "ui",
            action = "update_mails",
            mails = mails,
            myEmail = myEmail,
            myCitizenId = myCitizenId,
            locales = locales,
            accounts = accounts,
            domain = Config.Domain,
            uiScale = Config.UIScale,
            config = Config
        })
    end)
    cb('ok')
end)

RegisterNUICallback("markAsRead", function(data, cb)
    TriggerServerEvent('nui_mail:markRead', data.id)
    cb('ok')
end)

RegisterNetEvent('nui_mail:forceRefresh', function()
    SendNUIMessage({
        type = "ui",
        action = "force_reload"
    })
end)

RegisterNUICallback('createAccount', function(data, cb)
    TriggerServerEvent('nui_mail:createAccount', data)
    cb('ok')
end)

RegisterNUICallback('restoreMail', function(data, cb)
    TriggerServerEvent('nui_mail:restore', data)
    cb('ok')
end)

RegisterNUICallback('deleteAccount', function(data, cb)
    TriggerServerEvent('nui_mail:deleteAccount', data)
    cb('ok')
end)