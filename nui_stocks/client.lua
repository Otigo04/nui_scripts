local QBCore = exports['qb-core']:GetCoreObject()
local isMenuOpen = false

local QBCore = exports['qb-core']:GetCoreObject()
local isMenuOpen = false

local function ToggleUI(show)
    isMenuOpen = show
    SetNuiFocus(show, show)

    if show then
        -- TRICK: UI SOFORT öffnen (zeigt Ladebildschirm oder alte Daten kurz an)
        SendNUIMessage({ action = 'open' })

        -- DANN Daten holen und nachladen (Update)
        QBCore.Functions.TriggerCallback('nui_stocks:server:getData', function(companies, playerData)
            SendNUIMessage({
                action = 'open', -- 'open' aktualisiert im JS auch die Daten
                companies = companies,
                player = playerData
            })
        end)
    else
        SendNUIMessage({ action = 'close' })
    end
end

RegisterCommand('nui_stocks_open', function()
    if not isMenuOpen then
        ToggleUI(true)
    end
end, false)

RegisterNUICallback('closeUI', function(data, cb)
    ToggleUI(false)
    cb('ok')
end)

-- Callback: Buy Stock (Placeholder for Phase 4)
RegisterNUICallback('buyStock', function(data, cb)
    -- TriggerServerEvent('nui_stocks:server:buy', data)
    print("Buying stock: " .. data.symbol .. " Amount: " .. data.amount)
    cb('ok')
end)

-- Callback: Sell Stock (Placeholder for Phase 4)
RegisterNUICallback('sellStock', function(data, cb)
    -- TriggerServerEvent('nui_stocks:server:sell', data)
    print("Selling stock: " .. data.symbol .. " Amount: " .. data.amount)
    cb('ok')
end)

RegisterNUICallback('launchIPO', function(data, cb)
    TriggerServerEvent('nui_stocks:server:launchIPO', data)
    cb('ok')
end)

RegisterNUICallback('ceoAction', function(data, cb)
    TriggerServerEvent('nui_stocks:server:ceoAction', data)
    cb('ok')
end)

-- Event to refresh data (called after buy/sell)
RegisterNetEvent('nui_stocks:client:refresh', function()
    if isMenuOpen then
        -- Trigger the fetch logic again
        QBCore.Functions.TriggerCallback('nui_stocks:server:getData', function(companies, playerData)
            SendNUIMessage({
                action = 'open',
                companies = companies,
                player = playerData
            })
        end)
    end
end)

-- EVENT: Live Market Update from Server
RegisterNetEvent('nui_stocks:client:marketUpdate', function(companies)
    -- Only update NUI if menu is actually open to save performance
    if isMenuOpen then
        SendNUIMessage({
            action = 'update_prices',
            companies = companies
        })
    end
end)

-- Callback: Buy Stock (NOW ACTIVE)
RegisterNUICallback('buyStock', function(data, cb)
    TriggerServerEvent('nui_stocks:server:buyStock', data)
    cb('ok')
end)

-- Callback: Sell Stock (NOW ACTIVE)
RegisterNUICallback('sellStock', function(data, cb)
    TriggerServerEvent('nui_stocks:server:sellStock', data)
    cb('ok')
end)

RegisterNetEvent('nui_stocks:client:notify', function(type, message)
    SendNUIMessage({
        action = 'notify',
        type = type,
        message = message
    })
end)

RegisterNUICallback('checkCeoStatus', function(data, cb)
    QBCore.Functions.TriggerCallback('nui_stocks:server:checkCeoStatus', function(status)
        cb(status)
    end)
end)

RegisterNUICallback('depositMoney', function(data, cb)
    TriggerServerEvent('nui_stocks:server:depositMoney', data.amount)
    cb('ok')
end)

RegisterNUICallback('withdrawMoney', function(data, cb)
    TriggerServerEvent('nui_stocks:server:withdrawMoney', data.amount)
    cb('ok')
end)

RegisterNUICallback('getShareholders', function(data, cb)
    QBCore.Functions.TriggerCallback('nui_stocks:server:getShareholders', function(holders)
        cb(holders)
    end, data.id)
end)


RegisterNUICallback('getShareholders', function(data, cb)
    QBCore.Functions.TriggerCallback('nui_stocks:server:getShareholders', function(holders)
        cb(holders)
    end, data.id)
end)