local QBCore = exports['qb-core']:GetCoreObject()
local CachedMarketData = nil

-- --- HELPER: Fetch Data Centralized (FIXED SQL SYNTAX) --

-- --- HELPER: Caching System (PERFORMANCE & WARNING FIX) ---
-- --- HELPER: Caching System (RAM ONLY UPDATE) ---
local function RefreshMarketCache()
    exports.oxmysql:execute('SELECT * FROM nui_stock_companies', {}, function(companies)
        if not companies then return end
        
        -- INIT LOAD: Wir laden maximal 1000 Einträge beim Start.
        -- Danach fassen wir die DB für History nicht mehr an (nur INSERTs).
        local limit = 1000 
        
        local query = 'SELECT company_id, price, timestamp FROM nui_stock_history ORDER BY id DESC LIMIT ' .. limit
        
        exports.oxmysql:execute(query, {}, function(historyData)
            local stockHistory = {}
            
            if historyData then
                -- Sortieren nach Zeit aufsteigend
                table.sort(historyData, function(a, b) 
                    return (a.timestamp or 0) < (b.timestamp or 0) 
                end)

                for _, h in pairs(historyData) do
                    if h.company_id then
                        if not stockHistory[h.company_id] then stockHistory[h.company_id] = {} end
                        local t = h.timestamp or os.date('%Y-%m-%d %H:%M:%S')
                        table.insert(stockHistory[h.company_id], { price = h.price, time = t })
                    end
                end
            end

            for _, comp in pairs(companies) do
                comp.history = stockHistory[comp.id] or {}
            end

            CachedMarketData = companies
            print('^2[NUI STOCKS] Market Data initialized from SQL.^0')
        end)
    end)
end

-- Diese Funktion gibt dem Client sofort die Daten aus dem RAM
local function GetMarketData(cb)
    if CachedMarketData then
        cb(CachedMarketData)
    else
        -- Falls Cache leer ist (Serverstart), lade ihn einmalig
        RefreshMarketCache()
        -- Kurze Wartezeit, dann nochmal versuchen (rekursiv)
        SetTimeout(1000, function() 
            if CachedMarketData then cb(CachedMarketData) else cb({}) end 
        end)
    end
end

-- HELPER: Get User Broker Balance (SAFE MODE)
local function GetBrokerBalance(citizenid)
    local account = exports.oxmysql:singleSync('SELECT balance FROM nui_stock_accounts WHERE citizenid = ?', {citizenid})
    
    -- Prüfen ob account existiert UND eine Tabelle ist (verhindert 'compare number with table')
    if account and type(account) == 'table' and account.balance then
        return tonumber(account.balance)
    else
        -- Erstelle Account, falls nicht vorhanden
        exports.oxmysql:insert('INSERT INTO nui_stock_accounts (citizenid, balance) VALUES (?, 0) ON DUPLICATE KEY UPDATE citizenid=citizenid', {citizenid})
        return 0.0
    end
end

-- AB HIER FOLGT: -- 1. Initialize & Seed (Diesen Teil nicht löschen, einfach den Code hier drüber einfügen)

-- 1. Initialize
-- 1. Initialize & Seed (EXTENDED LIST)
Citizen.CreateThread(function()
    Citizen.Wait(2000)
    RefreshMarketCache()
    
    local count = exports.oxmysql:scalarSync('SELECT count(*) FROM nui_stock_companies')
    if count == 0 then
        print('^2[NUI STOCKS] Seeding 35 new companies...^0')
        
        local companies = {
            -- TECH
            { j='none', l='Lifeinvader', c='tech', p=140.00, t=5000, b=500000 },
            { j='none', l='Facebrowser', c='tech', p=210.50, t=4500, b=800000 },
            { j='none', l='Bleeter', c='tech', p=85.20, t=3000, b=250000 },
            { j='none', l='iFruit', c='tech', p=450.00, t=8000, b=2000000 },
            { j='none', l='Drone-O-Matic', c='tech', p=32.50, t=1000, b=50000 },

            -- AUTO
            { j='cardealer', l='Premium Deluxe', c='auto', p=350.00, t=2000, b=400000 },
            { j='mechanic', l='Bennys Customs', c='auto', p=210.00, t=1500, b=300000 },
            { j='none', l='Vapid Motor Co.', c='auto', p=65.00, t=10000, b=600000 },
            { j='none', l='Grotti Automobili', c='auto', p=520.00, t=500, b=900000 },
            { j='none', l='Pfister Design', c='auto', p=410.00, t=800, b=750000 },

            -- FINANCE
            { j='none', l='Maze Bank', c='finance', p=1200.00, t=10000, b=5000000 },
            { j='none', l='Fleeca Bank', c='finance', p=340.00, t=5000, b=1500000 },
            { j='none', l='Pacific Standard', c='finance', p=890.00, t=3000, b=2500000 },
            { j='none', l='Lombank', c='finance', p=600.50, t=2500, b=1200000 },
            { j='none', l='Dynasty 8 Real Estate', c='finance', p=150.00, t=4000, b=450000 },

            -- GOV
            { j='police', l='L.S. Police Dept.', c='gov', p=120.50, t=1000, b=100000 },
            { j='ambulance', l='L.S. Medical Center', c='gov', p=95.00, t=1000, b=100000 },
            { j='none', l='Dept. of Justice', c='gov', p=80.00, t=2000, b=150000 },
            { j='none', l='L.S. Water & Power', c='gov', p=45.00, t=5000, b=500000 },
            { j='none', l='San Andreas State', c='gov', p=100.00, t=10000, b=1000000 },

            -- FOOD
            { j='none', l='Burger Shot', c='food', p=25.00, t=5000, b=200000 },
            { j='none', l='Cluckin Bell', c='food', p=22.50, t=5000, b=180000 },
            { j='none', l='Taco Bomb', c='food', p=12.00, t=2000, b=50000 },
            { j='none', l='Up-n-Atom', c='food', p=35.00, t=2500, b=150000 },
            { j='none', l='Bean Machine', c='food', p=18.50, t=3000, b=80000 },

            -- INDUSTRIAL
            { j='none', l='Ron Oil', c='industrial', p=110.00, t=6000, b=2000000 },
            { j='none', l='Globe Oil', c='industrial', p=105.00, t=6000, b=1900000 },
            { j='none', l='LTD Gasoline', c='industrial', p=90.00, t=4000, b=800000 },
            { j='none', l='Rogers Salvage', c='industrial', p=45.00, t=1500, b=100000 },
            { j='none', l='Alpha Mail', c='industrial', p=60.00, t=2000, b=120000 },

            -- TRANSPORT
            { j='taxi', l='Downtown Cab Co.', c='transport', p=15.00, t=1000, b=50000 },
            { j='none', l='Los Santos Transit', c='transport', p=10.00, t=10000, b=500000 },
            { j='none', l='FlyUS', c='transport', p=220.00, t=5000, b=3000000 },
            { j='none', l='Air Herler', c='transport', p=180.00, t=3000, b=1500000 },
            { j='none', l='Post OP', c='transport', p=55.00, t=4000, b=400000 }
        }

        for _, v in pairs(companies) do
            -- Ticker generieren (Erste 3 Buchstaben)
            local ticker = string.upper(string.sub(v.l:gsub("%s+", ""), 1, 3))
            
            exports.oxmysql:insert('INSERT INTO nui_stock_companies (job_name, label, category, ticker, current_price, previous_price, shares_available, total_shares, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            { v.j, v.l, v.c, ticker, v.p, v.p, v.t, v.t, v.b })
        end
        print('^2[NUI STOCKS] Seed complete.^0')
    end
end)

-- Global Trend State (Stored in RAM)
local currentGlobalTrend = 'neutral' -- 'bull', 'bear', 'neutral'

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(Config.UpdateInterval * 1000)
        
        -- 1. Determine Global Market Trend
        if math.random() < Config.MarketTrend.ChanceToSwitch then
            local trends = {'bull', 'bear', 'neutral', 'neutral'} -- Higher chance for neutral
            currentGlobalTrend = trends[math.random(#trends)]
        --  print('^3[NUI STOCKS] Global Market Trend switched to: ' .. string.upper(currentGlobalTrend) .. '^0')
        end

        UpdateMarketPrices()
    end
end)

function UpdateMarketPrices()
    if not CachedMarketData then RefreshMarketCache() return end
    
    local queries = {} 
    local broadcastData = {} 

    for _, company in pairs(CachedMarketData) do
        -- Basis Daten
        local currentPrice = tonumber(company.current_price) or 10.0
        local balance = tonumber(company.balance) or 0
        local totalShares = tonumber(company.total_shares) or 1000
        
        -- CONFIG
        local catKey = company.category or 'auto'
        local catSettings = Config.Categories[catKey] or Config.Categories['auto']
        local globalVol = Config.Math and Config.Math.GlobalVolatility or 1.0

        -- 1. FUNDAMENTAL ANALYSIS (Das Geld auf dem Firmenkonto)
        -- "Buchwert" pro Aktie = Wie viel Geld steckt hinter einer Aktie?
        -- Wir nehmen 10% des Buchwerts als "fairen Bodenpreis", um Spekulation zu simulieren
        local bookValuePerShare = (balance / totalShares) * 0.10
        
        -- Health Factor berechnen
        local healthBias = 0.0
        if currentPrice < bookValuePerShare then
            -- Aktie ist unterbewertet (Firma hat viel Geld) -> Starker Push nach oben
            healthBias = 0.03 * globalVol
        elseif balance < 50000 then
            -- Firma ist fast pleite -> Leichter Push nach unten
            healthBias = -0.01 * globalVol
        end

        -- 2. RANDOM VOLATILITY (Spekulation)
        local randomFactor = (math.random() * 2.0) - 1.0 
        local changePercent = randomFactor * (catSettings.volatility * 0.05) * globalVol
        
        -- 3. ZUSAMMENFÜHREN
        changePercent = changePercent + (catSettings.trendBias * globalVol)
        changePercent = changePercent + healthBias -- Hier greift das Firmenkonto ein!

        -- Global Trend
        if currentGlobalTrend == 'bull' then changePercent = changePercent + 0.01 
        elseif currentGlobalTrend == 'bear' then changePercent = changePercent - 0.01 end

        -- Soft Cap (Damping ab 2000$)
        if Config.Math and currentPrice > Config.Math.SoftCapStart then
            changePercent = changePercent - (Config.Math.SoftCapResistance * globalVol)
        end

        -- Hard Limits
        if changePercent > Config.Limits.MaxChange then changePercent = Config.Limits.MaxChange end
        if changePercent < -Config.Limits.MaxChange then changePercent = -Config.Limits.MaxChange end

        -- Neuen Preis berechnen
        local newPrice = currentPrice * (1 + changePercent)
        
        if newPrice < Config.Limits.MinPrice then newPrice = Config.Limits.MinPrice end
        if newPrice > Config.Limits.MaxPrice then newPrice = Config.Limits.MaxPrice end
        
        -- Runden
        newPrice = math.floor(newPrice * 100 + 0.5) / 100

        -- Updates speichern
        queries[#queries+1] = {
            query = 'UPDATE nui_stock_companies SET current_price = ?, previous_price = ? WHERE id = ?',
            values = { newPrice, currentPrice, company.id }
        }
        queries[#queries+1] = {
            query = 'INSERT INTO nui_stock_history (company_id, price) VALUES (?, ?)',
            values = { company.id, newPrice }
        }

        -- RAM Update
        company.previous_price = currentPrice
        company.current_price = newPrice
        
        if not company.history then company.history = {} end
        table.insert(company.history, { price = newPrice, time = os.date('%Y-%m-%d %H:%M:%S') })
        if #company.history > 50 then table.remove(company.history, 1) end
        
        table.insert(broadcastData, company)
    end

    if #queries > 0 then
        exports.oxmysql:transaction(queries, function(success)
            if not success then print('^1[NUI STOCKS] DB Transaction Failed!^0') end
        end)
    end

    TriggerClientEvent('nui_stocks:client:marketUpdate', -1, broadcastData)
end

-- 3. Get Data Callback (DAS HAT GEFEHLT!)
QBCore.Functions.CreateCallback('nui_stocks:server:getData', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}, {}) end

    -- Hier wird die graue Funktion endlich aufgerufen!
    GetMarketData(function(companies)
        exports.oxmysql:execute('SELECT * FROM nui_stock_portfolio WHERE citizenid = ?', {Player.PlayerData.citizenid}, function(portfolio)
            local userShares = {}
            if portfolio then
                for _, p in pairs(portfolio) do
                    userShares[p.company_id] = { amount = p.amount, avgPrice = p.avg_buy_price }
                end
            end

            for _, comp in pairs(companies) do
                if userShares[comp.id] then
                    comp.myShares = userShares[comp.id].amount
                    comp.myAvgPrice = userShares[comp.id].avgPrice
                else
                    comp.myShares = 0
                    comp.myAvgPrice = 0
                end
            end

            local brokerBalance = GetBrokerBalance(Player.PlayerData.citizenid)

            local playerData = { 
                cash = Player.PlayerData.money.cash, 
                citizenid = Player.PlayerData.citizenid,
                brokerBalance = brokerBalance
            }
            cb(companies, playerData)
        end)
    end)
end)

-- 3. Get Data Callback (Client Open)
-- 10. Shareholders List (ROBUST & CRASH PROOF)
QBCore.Functions.CreateCallback('nui_stocks:server:getShareholders', function(source, cb, companyId)
    -- ID Sicherheit
    local cId = tonumber(companyId)
    if not cId then 
        print("^1[STOCKS ERROR] Invalid Company ID received.^0")
        cb({}) 
        return 
    end

    exports.oxmysql:execute('SELECT citizenid, amount FROM nui_stock_portfolio WHERE company_id = ? ORDER BY amount DESC', {cId}, function(holders)
        local result = {}
        
        -- Prüfen ob wir überhaupt eine Liste bekommen haben
        if holders and type(holders) == 'table' then
            for _, holder in pairs(holders) do
                -- Sicherheit: Existiert der Eintrag und hat er Shares?
                if holder and holder.amount then
                    local amt = tonumber(holder.amount)
                    
                    -- Nur hinzufügen wenn amt eine Zahl ist und > 0 (Hier war der Crash!)
                    if amt and type(amt) == 'number' and amt > 0 then
                        
                        local name = "Unknown Investor"
                        
                        -- Spieler Name finden
                        local p = QBCore.Functions.GetPlayerByCitizenId(holder.citizenid)
                        if p then
                            name = p.PlayerData.charinfo.firstname .. ' ' .. p.PlayerData.charinfo.lastname
                        else
                            local playerRow = exports.oxmysql:singleSync('SELECT charinfo FROM players WHERE citizenid = ?', {holder.citizenid})
                            if playerRow and playerRow.charinfo then
                                local success, charData = pcall(json.decode, playerRow.charinfo)
                                if success and charData then
                                    name = charData.firstname .. ' ' .. charData.lastname
                                end
                            end
                        end
                        
                        table.insert(result, {
                            name = name,
                            amount = amt
                        })
                    end
                end
            end
        end
        
        -- Daten zurücksenden
        cb(result)
    end)
end)
-- 4. Buying
-- REPLACEMENT: Buy Stock (ROUNDED COST)
RegisterNetEvent('nui_stocks:server:buyStock', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local companyId, amount, price = data.id, tonumber(data.amount), tonumber(data.price)
    
    -- Berechnung der Kosten
    local rawCost = amount * price
    -- FIX: Runden auf 2 Nachkommastellen (Kaufmännisch)
    local totalCost = math.floor(rawCost * 100 + 0.5) / 100

    local cid = Player.PlayerData.citizenid

    -- 1. Check Availability
    local company = exports.oxmysql:singleSync('SELECT shares_available FROM nui_stock_companies WHERE id = ?', {companyId})
    if not company or company.shares_available < amount then
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Not enough shares available on the market!")
        return
    end

    local brokerBalance = GetBrokerBalance(cid)

    if brokerBalance >= totalCost then
        -- 2. Money Logic
        exports.oxmysql:execute('UPDATE nui_stock_accounts SET balance = balance - ? WHERE citizenid = ?', {totalCost, cid})

        -- 3. Update Portfolio
        exports.oxmysql:execute('INSERT INTO nui_stock_portfolio (citizenid, company_id, amount, avg_buy_price) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = amount + ?, avg_buy_price = (avg_buy_price * amount + ? * ?) / (amount + ?)', {
            cid, companyId, amount, price, amount, amount, price, amount
        })

        -- 4. Decrease Available Shares
        exports.oxmysql:execute('UPDATE nui_stock_companies SET shares_available = shares_available - ?, balance = balance + ? WHERE id = ?', {amount, totalCost, companyId})
        
        -- 5. Log
        exports.oxmysql:insert('INSERT INTO nui_stock_transactions (citizenid, company_id, type, amount, price_per_share) VALUES (?, ?, ?, ?, ?)', {cid, companyId, 'buy', amount, price})
        
        TriggerClientEvent('nui_stocks:client:notify', src, 'success', "Bought " .. amount .. " shares for $" .. totalCost)
        TriggerClientEvent('nui_stocks:client:refresh', src)
    else
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Insufficient funds in Broker Account.")
    end
end)

-- REPLACEMENT: Sell Stock (ROUNDED REVENUE)
RegisterNetEvent('nui_stocks:server:sellStock', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local companyId, amount, price = data.id, tonumber(data.amount), tonumber(data.price)
    
    -- Berechnung des Gewinns
    local rawRevenue = amount * price
    -- FIX: Runden auf 2 Nachkommastellen
    local totalRevenue = math.floor(rawRevenue * 100 + 0.5) / 100

    local cid = Player.PlayerData.citizenid

    local portfolioItem = exports.oxmysql:singleSync('SELECT * FROM nui_stock_portfolio WHERE citizenid = ? AND company_id = ?', { cid, companyId })

    if portfolioItem and portfolioItem.amount >= amount then
        -- 1. Remove from User
        local newAmount = portfolioItem.amount - amount
        if newAmount <= 0 then
            exports.oxmysql:execute('DELETE FROM nui_stock_portfolio WHERE id = ?', {portfolioItem.id})
        else
            exports.oxmysql:execute('UPDATE nui_stock_portfolio SET amount = ? WHERE id = ?', {newAmount, portfolioItem.id})
        end
        
        -- 2. Add Money to Broker
        exports.oxmysql:execute('INSERT INTO nui_stock_accounts (citizenid, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?', {
            cid, totalRevenue, totalRevenue
        })

        -- 3. Return Shares to Market
        exports.oxmysql:execute('UPDATE nui_stock_companies SET shares_available = shares_available + ? WHERE id = ?', {amount, companyId})

        exports.oxmysql:insert('INSERT INTO nui_stock_transactions (citizenid, company_id, type, amount, price_per_share) VALUES (?, ?, ?, ?, ?)', {cid, companyId, 'sell', amount, price})
        
        -- FIX: Schöne Ausgabe ohne 100 Kommastellen
        TriggerClientEvent('nui_stocks:client:notify', src, 'success', "Sold shares. Added $"..totalRevenue.." to Broker.")
        TriggerClientEvent('nui_stocks:client:refresh', src)
    else
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Not enough shares.")
    end
end)

QBCore.Functions.CreateCallback('nui_stocks:server:checkCeoStatus', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    local isBoss = Player.PlayerData.job.isboss
    local myJob = Player.PlayerData.job.name
    local citizenid = Player.PlayerData.citizenid
    local bank = Player.PlayerData.money.bank

    -- Wir holen ALLE Firmen, wo du als Owner eingetragen bist
    exports.oxmysql:execute('SELECT * FROM nui_stock_companies WHERE owner_citizenid = ?', {citizenid}, function(ownedCompanies)
        
        local validatedCompanies = {}

        for _, comp in pairs(ownedCompanies) do
            -- LOGIK CHECK:
            -- Wenn die Firma an einen Job gebunden ist (z.B. police), MUSS der Spieler diesen Job haben und Boss sein.
            -- Wenn es eine private Firma ist (kein Job Name oder 'none'), darf er sie behalten.
            
            local isValid = true
            
            if comp.job_name and comp.job_name ~= 'none' then
                if comp.job_name ~= myJob or not isBoss then
                    isValid = false
                end
            end

            if isValid then
                table.insert(validatedCompanies, comp)
            end
        end

        cb({
            isBoss = isBoss,
            bankBalance = bank,
            ownedCompanies = validatedCompanies
        })
    end)
end)

-- 7. LAUNCH IPO (Firma erstellen)
-- REPLACEMENT: Launch IPO with 50% Ownership Rule
RegisterNetEvent('nui_stocks:server:launchIPO', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player or not Player.PlayerData.job.isboss then return end

    local cost = 100000 
    local bank = Player.PlayerData.money.bank

    if bank >= cost then
        local count = exports.oxmysql:scalarSync('SELECT count(*) FROM nui_stock_companies WHERE job_name = ?', {Player.PlayerData.job.name})
        if count > 0 then
            TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Company already listed!")
            return
        end

        Player.Functions.RemoveMoney('bank', cost, "stock-ipo-launch")

        local initialPrice = tonumber(data.price) or 50.0
        local totalShares = tonumber(data.shares) or 1000
        
        -- LOGIK: Boss bekommt 50%, Rest geht in den Markt
        local ownerShares = math.floor(totalShares * 0.5) 
        local marketShares = totalShares - ownerShares

        local label = data.name or Player.PlayerData.job.label
        local category = data.category or 'auto'
        local ticker = data.ticker or string.upper(string.sub(Player.PlayerData.job.name, 1, 3))

        -- 1. Firma erstellen
        local companyId = exports.oxmysql:insert('INSERT INTO nui_stock_companies (job_name, label, category, ticker, current_price, previous_price, total_shares, shares_available, owner_citizenid, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', {
            Player.PlayerData.job.name, label, category, ticker, initialPrice, initialPrice, totalShares, marketShares, Player.PlayerData.citizenid, cost 
        })

        -- 2. Dem Boss 50% der Aktien geben
        if companyId then
            exports.oxmysql:insert('INSERT INTO nui_stock_portfolio (citizenid, company_id, amount, avg_buy_price) VALUES (?, ?, ?, ?)', {
                Player.PlayerData.citizenid, companyId, ownerShares, 0 -- 0$ Kosten für Founder Shares
            })
        end

        TriggerClientEvent('nui_stocks:client:notify', src, 'success', "IPO Launched! You received " .. ownerShares .. " shares (50%).")
        TriggerClientEvent('nui_stocks:client:refresh', src)
    else
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Insufficient bank funds ($100k needed).")
    end
end)

-- 8. CEO ACTION: DEPOSIT / WITHDRAW
RegisterNetEvent('nui_stocks:server:ceoAction', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local companyId = data.id
    local action = data.action
    local amount = tonumber(data.amount)

    print("^3[CEO DEBUG] Action: " .. action .. " Amount: " .. tostring(amount) .. "^0")

    if not amount or amount <= 0 then 
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Invalid Amount")
        return 
    end

    local company = exports.oxmysql:singleSync('SELECT * FROM nui_stock_companies WHERE id = ?', {companyId})
    
    if company then
        -- Check Boss Permissions
        if Player.PlayerData.job.name == company.job_name and Player.PlayerData.job.isboss then
            
            -- A) DEPOSIT
            if action == 'deposit' then
                if Player.Functions.RemoveMoney('bank', amount, "stock-comp-deposit") then
                    exports.oxmysql:execute('UPDATE nui_stock_companies SET balance = balance + ? WHERE id = ?', {amount, companyId})
                    
                    -- Price Boost (0.5% per 10k)
                    local boost = (amount / 10000) * 0.005 
                    if boost > 0.05 then boost = 0.05 end 
                    local newPrice = company.current_price * (1 + boost)
                    exports.oxmysql:execute('UPDATE nui_stock_companies SET current_price = ? WHERE id = ?', {newPrice, companyId})

                    TriggerClientEvent('nui_stocks:client:notify', src, 'success', "Deposited $"..amount)
                    TriggerClientEvent('nui_stocks:client:refresh', src)
                else
                    TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Not enough money in bank.")
                end

            -- B) WITHDRAW
            elseif action == 'withdraw' then
                if tonumber(company.balance) >= amount then
                    local tax = amount * 0.10
                    local payout = amount - tax
                    
                    exports.oxmysql:execute('UPDATE nui_stock_companies SET balance = balance - ? WHERE id = ?', {amount, companyId})
                    Player.Functions.AddMoney('bank', payout, "stock-comp-withdraw")
                    
                    -- Price Drop (1% per 10k)
                    local drop = (amount / 10000) * 0.01
                    if drop > 0.10 then drop = 0.10 end
                    local newPrice = company.current_price * (1 - drop)
                    if newPrice < 1 then newPrice = 1 end
                    exports.oxmysql:execute('UPDATE nui_stock_companies SET current_price = ? WHERE id = ?', {newPrice, companyId})

                    TriggerClientEvent('nui_stocks:client:notify', src, 'success', "Withdrew $"..payout.." (Tax paid)")
                    TriggerClientEvent('nui_stocks:client:refresh', src)
                else
                    TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Company balance too low! ($"..company.balance..")")
                end
            
            -- C) DIVIDEND
            elseif action == 'dividend' then
                local totalCost = amount * company.total_shares
                
                if tonumber(company.balance) >= totalCost then
                    exports.oxmysql:execute('UPDATE nui_stock_companies SET balance = balance - ? WHERE id = ?', {totalCost, companyId})
                    
                    -- Payout Loop
                    exports.oxmysql:execute('SELECT * FROM nui_stock_portfolio WHERE company_id = ?', {companyId}, function(holders)
                        for _, holder in pairs(holders) do
                            local pMoney = holder.amount * amount
                            local TPlayer = QBCore.Functions.GetPlayerByCitizenId(holder.citizenid)
                            if TPlayer then
                                TPlayer.Functions.AddMoney('bank', pMoney, "stock-dividend")
                                TriggerClientEvent('nui_stocks:client:notify', TPlayer.PlayerData.source, 'success', "Dividend Received: $"..pMoney)
                            else
                                -- Offline Player Logic: Could add to DB, but skipped for now
                            end
                        end
                    end)

                    -- Price Boost (Big!)
                    local newPrice = company.current_price * 1.15
                    exports.oxmysql:execute('UPDATE nui_stock_companies SET current_price = ? WHERE id = ?', {newPrice, companyId})

                    TriggerClientEvent('nui_stocks:client:notify', src, 'success', "Dividends paid out! Stock soaring.")
                    TriggerClientEvent('nui_stocks:client:refresh', src)
                else
                    TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Need $"..totalCost.." for dividends.")
                end
            end

        else
            TriggerClientEvent('nui_stocks:client:notify', src, 'error', "You are not the boss of this company!")
        end
    else
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Company not found.")
    end
end)

-- CLEANUP THREAD (FIXED)
Citizen.CreateThread(function()
    Citizen.Wait(5000) -- Wait for MySQL to be ready
    exports.oxmysql:execute('DELETE FROM nui_stock_history WHERE timestamp < NOW() - INTERVAL 7 DAY', {}, function(result)
        -- Fix für oxmysql Version Unterschiede (Number vs Table)
        local count = 0
        if type(result) == 'table' then
            count = result.affectedRows or 0
        elseif type(result) == 'number' then
            count = result
        end

        if count > 0 then
            print('^3[NUI STOCKS] Cleaned up ' .. count .. ' old history entries.^0')
        end
    end)
end)

-- DEPOSIT: BANK -> Broker Account
RegisterNetEvent('nui_stocks:server:depositMoney', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local val = tonumber(amount)

    if not val or val < Config.Broker.MinDeposit then 
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Invalid amount (Min: $"..Config.Broker.MinDeposit..")")
        return 
    end

    -- ÄNDERUNG: Check 'bank' statt 'cash'
    if Player.PlayerData.money.bank >= val then
        Player.Functions.RemoveMoney('bank', val, "stock-deposit") -- ÄNDERUNG: Nimmt Geld von der Bank
        
        -- Add to SQL Balance
        exports.oxmysql:execute('INSERT INTO nui_stock_accounts (citizenid, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?', {
            Player.PlayerData.citizenid, val, val
        })

        TriggerClientEvent('nui_stocks:client:notify', src, 'success', "Deposited $"..val.." from Bank Account")
        TriggerClientEvent('nui_stocks:client:refresh', src)
    else
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Insufficient funds in Bank Account.")
    end
end)

-- WITHDRAW: Broker Account -> Cash (Minus Tax!)
RegisterNetEvent('nui_stocks:server:withdrawMoney', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local val = tonumber(amount)
    local cid = Player.PlayerData.citizenid
    
    local currentBalance = GetBrokerBalance(cid)

    if not val or val <= 0 then return end

    if currentBalance >= val then
        -- Calculate Tax
        local tax = val * Config.Broker.WithdrawTax
        local payout = val - tax

        -- Update SQL
        exports.oxmysql:execute('UPDATE nui_stock_accounts SET balance = balance - ? WHERE citizenid = ?', {val, cid})
        
        -- Give Cash
        Player.Functions.AddMoney('cash', payout, "stock-withdraw")

        TriggerClientEvent('nui_stocks:client:notify', src, 'success', "Withdrew $"..payout.." (Tax: $"..tax..")")
        TriggerClientEvent('nui_stocks:client:refresh', src)
    else
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Insufficient broker balance.")
    end
end)

-- REPLACEMENT: Withdraw to BANK
RegisterNetEvent('nui_stocks:server:withdrawMoney', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local val = tonumber(amount)
    local cid = Player.PlayerData.citizenid
    
    local currentBalance = GetBrokerBalance(cid)

    if not val or val <= 0 then return end

    if currentBalance >= val then
        local tax = val * Config.Broker.WithdrawTax or 0
        local payout = val - tax

        exports.oxmysql:execute('UPDATE nui_stock_accounts SET balance = balance - ? WHERE citizenid = ?', {val, cid})
        
        -- FIX: Add to BANK instead of Cash
        Player.Functions.AddMoney('bank', payout, "stock-withdraw")

        TriggerClientEvent('nui_stocks:client:notify', src, 'success', "Withdrew $"..payout.." to Bank (Tax: $"..tax..")")
        -- Refresh UI Data (Updates Cash/Bank display)
        TriggerClientEvent('nui_stocks:client:refresh', src)
    else
        TriggerClientEvent('nui_stocks:client:notify', src, 'error', "Insufficient broker balance.")
    end
end)

-- NEW: Get Shareholders List (ROBUST VERSION)
-- ROBUST SHAREHOLDER FETCH
QBCore.Functions.CreateCallback('nui_stocks:server:getShareholders', function(source, cb, companyId)
    if not companyId then cb({}) return end

    exports.oxmysql:execute('SELECT citizenid, amount FROM nui_stock_portfolio WHERE company_id = ? ORDER BY amount DESC', {companyId}, function(holders)
        local result = {}
        
        if holders then
            for _, holder in pairs(holders) do
                local name = "Unknown Investor ("..string.sub(holder.citizenid, 1, 4)..")"
                
                -- Versuch 1: Online Spieler
                local p = QBCore.Functions.GetPlayerByCitizenId(holder.citizenid)
                if p then
                    name = p.PlayerData.charinfo.firstname .. ' ' .. p.PlayerData.charinfo.lastname
                else
                    -- Versuch 2: Offline (Datenbank)
                    -- ACHTUNG: Wir nutzen pcall, damit JSON Fehler den Server nicht crashen!
                    local playerRow = exports.oxmysql:singleSync('SELECT charinfo FROM players WHERE citizenid = ?', {holder.citizenid})
                    if playerRow and playerRow.charinfo then
                        local success, charData = pcall(json.decode, playerRow.charinfo)
                        if success and charData and charData.firstname then
                            name = charData.firstname .. ' ' .. charData.lastname
                        end
                    end
                end
                
                table.insert(result, {
                    name = name,
                    amount = holder.amount
                })
            end
        end
        
        cb(result)
    end)
end)

