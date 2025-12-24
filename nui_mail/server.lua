local QBCore = exports['qb-core']:GetCoreObject()

-- Helper für Übersetzung (Server-Side)
local function _L(key)
    local lang = Config.Locale or 'en'
    if not Config.Locales[lang] then lang = 'en' end
    return Config.Locales[lang][key] or "MISSING: "
end

local function GetEmailFromPlayer(PlayerData)
    local first = PlayerData.charinfo.firstname
    local last = PlayerData.charinfo.lastname
    -- Lowercase Logik entfernen wir hier für saubere Anzeige, 
    -- oder wir nutzen string.lower() nur beim generieren.
    return string.lower(first .. "." .. last .. "@" .. Config.Domain)
end

-- 1. Mails abrufen
QBCore.Functions.CreateCallback('nui_mail:fetchMails', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({}, "", "unknown", {}, {}) end

    local citizenId = Player.PlayerData.citizenid
    local defaultEmail = GetEmailFromPlayer(Player.PlayerData)
    local currentLocales = Config.Locales[Config.Locale]

    -- 1. Standard-Account Check
    exports.oxmysql:scalar('SELECT count(*) FROM nui_mail_accounts WHERE citizenid = ? AND email = ?', {citizenId, defaultEmail}, function(count)
        if count == 0 then
            exports.oxmysql:insert('INSERT INTO nui_mail_accounts (citizenid, email, label, is_verified) VALUES (?, ?, ?, ?)', {
                citizenId, defaultEmail, "Privat", 0
            })
        end
        
        -- 2. Alle Accounts laden
        exports.oxmysql:execute('SELECT * FROM nui_mail_accounts WHERE citizenid = ?', {citizenId}, function(accounts)
            local emailList = {}
            
            -- Liste befüllen & LOWERCASE erzwingen für den Vergleich
            if accounts then
                for _, acc in pairs(accounts) do
                    if acc.email then 
                        table.insert(emailList, string.lower(acc.email))
                    end
                end
            end

            if #emailList == 0 then
                table.insert(emailList, string.lower(defaultEmail))
            end

            -- 3. Mails abrufen
            -- Wir suchen Mails, wo der 'owner' exakt einer meiner kleingeschriebenen E-Mails entspricht.
            -- Oder Fallback auf die alte Logik (owner IS NULL)
            local query = 'SELECT * FROM nui_mail_messages WHERE owner IN (?) OR (owner IS NULL AND (recipient IN (?) OR sender IN (?))) ORDER BY timestamp DESC'

            exports.oxmysql:execute(query, {emailList, emailList, emailList}, function(messages)
                cb(messages or {}, defaultEmail, citizenId, currentLocales, accounts or {})
            end)
        end)
    end)
end)

RegisterNetEvent('nui_mail:createAccount', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local newEmail = string.lower(data.email)
    local label = data.label or "Alias"
    
    -- 1. Domain Check
    if not string.find(newEmail, "@" .. Config.Domain, 1, true) then
        TriggerClientEvent('QBCore:Notify', src, string.format(_L('error_domain'), Config.Domain), "error")
        return
    end

    -- 2. RESTRICTED KEYWORD CHECK (FIXED)
    if Config.EmailStyling then
        -- Job Daten sicher abrufen
        local playerJob = Player.PlayerData.job.name
        local playerGrade = 0
        
        -- Grade Safety Check (Fängt Fehler ab, falls Grade eine Zahl statt Tabelle ist)
        if type(Player.PlayerData.job.grade) == "table" then
            playerGrade = tonumber(Player.PlayerData.job.grade.level) or 0
        else
            playerGrade = tonumber(Player.PlayerData.job.grade) or 0
        end

        local jobSettings = Config.OfficialJobs[playerJob]
        
        for _, style in ipairs(Config.EmailStyling) do
            if style.verified then 
                for _, keyword in ipairs(style.keywords) do
                    -- Wenn die Wunsch-Email ein verbotenes Wort enthält (z.B. "lspd")
                    if string.find(newEmail, keyword, 1, true) then
                        
                        local isAllowed = false
                        
                        if jobSettings then
                            print("[MAIL DEBUG] User Job: "..playerJob.. " | Grade: "..playerGrade.." | MinGrade: "..jobSettings.minGrade)

                            if jobSettings.verified and playerGrade >= tonumber(jobSettings.minGrade) then
                                isAllowed = true
                            end
                        end
                        
                        -- Wenn NICHT erlaubt -> Fehler senden & Abbruch
                        if not isAllowed then
                            TriggerClientEvent('QBCore:Notify', src, _L('error_restricted'), "error")
                            return 
                        end
                    end
                end
            end
        end
    end
    
    -- 3. Existenz Check & Erstellung
    exports.oxmysql:scalar('SELECT count(*) FROM nui_mail_accounts WHERE email = ?', {newEmail}, function(count)
        if count > 0 then
            TriggerClientEvent('QBCore:Notify', src, _L('error_exists'), "error")
            return
        end

        local isVerified = 0
        local jobSettings = Config.OfficialJobs[Player.PlayerData.job.name]
        
        -- Grade hier nochmal sicher abrufen für die Verification Logik
        local currentGrade = 0
        if type(Player.PlayerData.job.grade) == "table" then
            currentGrade = tonumber(Player.PlayerData.job.grade.level) or 0
        else
            currentGrade = tonumber(Player.PlayerData.job.grade) or 0
        end
        
        if jobSettings and currentGrade >= jobSettings.minGrade then
            isVerified = jobSettings.verified and 1 or 0
        else
            exports.oxmysql:scalar('SELECT count(*) FROM nui_mail_accounts WHERE citizenid = ?', {Player.PlayerData.citizenid}, function(myCount)
                if myCount >= (Config.MaxAccounts + 1) then 
                    TriggerClientEvent('QBCore:Notify', src, _L('error_limit_reached'), "error")
                    return
                end
                
                createEmailDB(src, Player.PlayerData.citizenid, newEmail, label, isVerified)
            end)
            return 
        end


        createEmailDB(src, Player.PlayerData.citizenid, newEmail, label, isVerified)
    end)
end)

function createEmailDB(src, cid, email, label, verified)
    exports.oxmysql:insert('INSERT INTO nui_mail_accounts (citizenid, email, label, is_verified) VALUES (?, ?, ?, ?)', {
        cid, email, label, verified
    }, function(id)
        if id then
            TriggerClientEvent('QBCore:Notify', src, _L('success_acc_created'), "success")
            TriggerClientEvent('nui_mail:forceRefresh', src)
        end
    end)
end



RegisterNetEvent('nui_mail:send', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local senderEmail = data.from
    local citizenId = Player.PlayerData.citizenid

    -- 1. Check Ownership & Sender bestimmen
    exports.oxmysql:scalar('SELECT count(*) FROM nui_mail_accounts WHERE email = ? AND citizenid = ?', {senderEmail, citizenId}, function(count)
        if not count or count == 0 then
            senderEmail = GetEmailFromPlayer(Player.PlayerData)
        end
        
        -- WICHTIG: Sender für die DB-Spalte 'owner' komplett kleinschreiben
        local senderOwner = string.lower(senderEmail)

        if string.len(data.message) > 2000 then
            TriggerClientEvent('QBCore:Notify', src, _L('error_too_long'), "error")
            return
        end

        local targets = data.recipients
        if type(targets) == "string" then targets = {targets} end
        
        if not targets or #targets == 0 then
            TriggerClientEvent('QBCore:Notify', src, _L('error_recipient'), "error")
            return
        end

        -- 2. Loop targets and create copies
        local validTargets = {}
        
        for _, targetEmail in ipairs(targets) do
            local cleanTarget = string.lower(targetEmail) -- Ziel ist eh schon lower

            -- EMPFÄNGER KOPIE -> Typ: 'inbox'
            if string.find(cleanTarget, "@" .. Config.Domain, 1, true) then
                exports.oxmysql:execute('SELECT citizenid FROM nui_mail_accounts WHERE email = ?', {cleanTarget}, function(result)
                    if result and result[1] then
                        local targetCitizenId = result[1].citizenid
                        
                        exports.oxmysql:insert('INSERT INTO nui_mail_messages (sender, recipient, subject, message, owner, mail_type) VALUES (?, ?, ?, ?, ?, ?)', {
                            senderEmail, -- Display Name (Original Case)
                            cleanTarget,
                            data.subject or "No Subject",
                            data.message,
                            cleanTarget, -- Owner (Lowercase)
                            'inbox'
                        }, function(id)
                            if id then
                                -- Notify Empfänger
                                local Recipient = QBCore.Functions.GetPlayerByCitizenId(targetCitizenId)
                                if Recipient then
                                    local notifyText = string.format(_L('new_mail_notify'), cleanTarget, senderEmail)
                                    TriggerClientEvent('QBCore:Notify', Recipient.PlayerData.source, notifyText, "success", 5000)
                                    TriggerClientEvent('nui_mail:forceRefresh', Recipient.PlayerData.source)
                                end
                            end
                        end)
                    end
                end)
                table.insert(validTargets, cleanTarget)
            end
        end

        -- ABSENDER KOPIE -> Typ: 'sent'
        if #validTargets > 0 then
            local recipientString = table.concat(validTargets, ", ")
            
            exports.oxmysql:insert('INSERT INTO nui_mail_messages (sender, recipient, subject, message, owner, isRead, mail_type) VALUES (?, ?, ?, ?, ?, 1, ?)', {
                senderEmail, -- Display Name
                recipientString,
                data.subject or "No Subject",
                data.message,
                senderOwner, -- WICHTIG: Owner (Lowercase) -> Damit du sie in fetchMails findest
                'sent'
            })
        end

        TriggerClientEvent('QBCore:Notify', src, _L('success_sent'), "success")
    end)
end)

-- 4. Delete Mail Event (Independent / Fan-Out Logic)
RegisterNetEvent('nui_mail:delete', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local myEmails = {}
    local citizenId = Player.PlayerData.citizenid

    exports.oxmysql:execute('SELECT email FROM nui_mail_accounts WHERE citizenid = ?', {citizenId}, function(accounts)
        -- Build Ownership List
        for _, acc in pairs(accounts) do
            if acc.email then
                myEmails[string.lower(acc.email)] = true
            end
        end

        local function processDelete(id)
            -- Check Owner Security: Darf ich diese Mail löschen?
            exports.oxmysql:execute('SELECT owner, sender, recipient FROM nui_mail_messages WHERE id = ?', {id}, function(res)
                if res and res[1] then
                    local mail = res[1]
                    local owner = mail.owner and string.lower(mail.owner) or nil
                    
                    -- Sicherheit: Gehört die Mail mir? (Check Owner Column oder Fallback auf Sender/Recipient für alte Mails)
                    local isMine = false
                    if owner and myEmails[owner] then isMine = true end
                    
                    -- Legacy Support für alte Mails ohne Owner
                    if not owner then 
                        if myEmails[string.lower(mail.sender)] or myEmails[string.lower(mail.recipient)] then isMine = true end
                    end

                    if isMine then
                        if data.folder == 'trash' then
                            -- Endgültig löschen (Zeile entfernen) -> Stört niemanden sonst!
                            exports.oxmysql:execute('DELETE FROM nui_mail_messages WHERE id = ?', {id})
                        else
                            -- In Papierkorb verschieben (Status setzen)
                            exports.oxmysql:execute('UPDATE nui_mail_messages SET isTrash = 1 WHERE id = ?', {id})
                        end
                    end
                end
            end)
        end

        if data.ids and type(data.ids) == "table" then
            for _, mailId in ipairs(data.ids) do processDelete(mailId) end
        else
            processDelete(data.id)
        end
        
        TriggerClientEvent('QBCore:Notify', src, data.folder == 'trash' and _L('deleted_final') or _L('moved_trash'), "success")
    end)
end)

RegisterNetEvent('nui_mail:restore', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local citizenId = Player.PlayerData.citizenid

    exports.oxmysql:execute('SELECT email FROM nui_mail_accounts WHERE citizenid = ?', {citizenId}, function(accounts)
        local myEmails = {}
        for _, acc in pairs(accounts) do myEmails[acc.email] = true end

        if data.id then
            exports.oxmysql:execute('SELECT sender, recipient FROM nui_mail_messages WHERE id = ?', {data.id}, function(mailInfo)
                if mailInfo and mailInfo[1] then
                    local mail = mailInfo[1]
                    if myEmails[mail.sender] then
                        exports.oxmysql:execute('UPDATE nui_mail_messages SET trash_sender = 0 WHERE id = ?', {data.id})
                    end
                    if myEmails[mail.recipient] then
                        exports.oxmysql:execute('UPDATE nui_mail_messages SET trash_recipient = 0 WHERE id = ?', {data.id})
                    end
                    TriggerClientEvent('QBCore:Notify', src, _L('success_restored'), "success")
                end
            end)
        end
    end)
end)

RegisterNetEvent('nui_mail:markRead', function(mailId)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    if mailId then exports.oxmysql:execute('UPDATE nui_mail_messages SET isRead = 1 WHERE id = ?', {mailId}) end
end)

-- 6. ACCOUNT LÖSCHEN (FIXED & DEBUGGED)
RegisterNetEvent('nui_mail:deleteAccount', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    -- Daten normalisieren (alles kleinschreiben für Vergleich)
    local targetEmail = string.lower(data.email)
    local citizenId = Player.PlayerData.citizenid
    
    -- Sicherheitscheck: Ist es der Standard-Account?
    -- Wir vergleichen beides in Kleinbuchstaben, damit "LSPD@..." == "lspd@..." erkannt wird
    local defaultEmail = string.lower(GetEmailFromPlayer(Player.PlayerData))
    
    print("^3[MAIL DEBUG] Lösch-Anfrage für: " .. targetEmail .. " (Standard: " .. defaultEmail .. ")^0")

    if targetEmail == defaultEmail then
        print("^1[MAIL DEBUG] Löschen blockiert: Ist Hauptaccount.^0")
        TriggerClientEvent('QBCore:Notify', src, _L('error_delete_default'), "error")
        return
    end

    -- Löschen (Nur wenn CitizenID und Email passen)
    exports.oxmysql:execute('DELETE FROM nui_mail_accounts WHERE email = ? AND citizenid = ?', {targetEmail, citizenId}, function(result)
        if result.affectedRows > 0 then
            print("^2[MAIL DEBUG] Account gelöscht!^0")
            TriggerClientEvent('QBCore:Notify', src, _L('success_acc_deleted'), "success")
            TriggerClientEvent('nui_mail:forceRefresh', src)
        else
            print("^1[MAIL DEBUG] SQL Delete fehlgeschlagen (Keine Rows affected). Falsche ID oder Email?^0")
        end
    end)
end)