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

local function ToggleTablet(bool)
    local ped = PlayerPedId()

    if bool then
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
        ClearPedTasks(ped)
        if tabletProp then
            DeleteEntity(tabletProp)
            tabletProp = nil
        end
    end
end

function SetDisplay(bool)
    display = bool
    SetNuiFocus(bool, bool)
    ToggleTablet(bool) 
    
    if bool then
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
        SendNUIMessage({
            type = "ui",
            action = "close"
        })
    end
end

-- Command & Keymapping
RegisterCommand("nui_mail_open", function()
    -- 1. Spielerstatus prüfen
    local PlayerData = QBCore.Functions.GetPlayerData()
    
    -- Wenn tot oder im "Last Stand" (Bewusstlos) -> Abbruch
    if PlayerData.metadata["isdead"] or PlayerData.metadata["inlaststand"] then
        -- HIER DIE ÄNDERUNG: _L() nutzen
        QBCore.Functions.Notify(_L('error_cannot_open'), "error")
        return
    end

    
    if PlayerData.metadata["cuffed"] or PlayerData.metadata["handcuffed"] then return end

    -- 2. Öffnen
    if not display then
        SetDisplay(true)
    end
end, false)
RegisterKeyMapping("nui_mail_open", _L('key_description'), "keyboard", Config.OpenKey)

RegisterNUICallback("closeUI", function(data, cb)
    SetDisplay(false)
    cb("ok")
end)

RegisterNUICallback("sendMail", function(data, cb)
    TriggerServerEvent('nui_mail:send', data)
    cb('ok')
end)

RegisterNUICallback("deleteMail", function(data, cb)
    -- Wir reichen das ganze 'data' Objekt weiter (da ist jetzt id & folder drin)
    TriggerServerEvent('nui_mail:delete', data)
    cb('ok')
end)

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
    -- Auch hier die neuen Parameter: accounts am Ende hinzufügen
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
            config = Config -- <--- NEU
        })
    end)
    cb('ok')
end)

RegisterNUICallback("markAsRead", function(data, cb)
    TriggerServerEvent('nui_mail:markRead', data.id)
    cb('ok')
end)

RegisterNetEvent('nui_mail:forceRefresh', function()
    -- Simuliert den Refresh Button
    SendNUIMessage({
        type = "ui",
        action = "force_reload" -- Wir fangen das gleich im JS ab
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