Config = {}

-- ---------------------------------------------------------
-- GENERAL SETTINGS
-- ---------------------------------------------------------

-- The domain used for all email addresses (e.g. john.doe@nui-labs.ls)
Config.Domain = "nui-labs.ls"

-- UI SCALING
-- 1.0 = Default size (100%)
-- 0.8 = Smaller (80%)
-- 1.2 = Larger (120%)
Config.UIScale = 1.0

-- JOB SETTINGS (OFFICIAL ACCOUNTS)
-- Jobs defined here can create verified custom emails (e.g. lspd@...)
-- verified = true means they get the checkmark icon
Config.OfficialJobs = {
    ['police'] = { minGrade = 2, verified = true },
    ['ambulance'] = { minGrade = 2, verified = true },
    ['mechanic'] = { minGrade = 2, verified = false },
    ['government'] = { minGrade = 2, verified = true },
}

-- VISUAL SETTINGS (HOW EMAILS LOOK)
-- Define which email addresses get specific colors and verified badges.
Config.EmailStyling = {
    { 
        keywords = {'police', 'lspd', 'polizei', 'sheriff', 'pd'}, 
        color = '#3B82F6', -- Blue
        verified = true    -- verified status
    },
    { 
        keywords = {'medic', 'lsmd', 'ems', 'rettung', 'hospital'}, 
        color = '#EF4444', -- Red
        verified = true 
    },
    { 
        keywords = {'gov', 'state', 'mayor', 'city', 'justice', 'doj'}, 
        color = '#F59E0B', -- Gold
        verified = true 
    },
    { 
        keywords = {'weazel', 'news', 'reporter'}, 
        color = '#F97316', -- Orange
        verified = true 
    },
    { 
        keywords = {'mechanic', 'lsc', 'bennys', 'werkstatt'}, 
        color = '#64748B', -- mechanic, blue
        verified = false   -- not verified, but has color
    }
}

-- Default Avatar Colors (Randomly picked for initials background)
Config.AvatarPalette = {
    '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#84cc16'
}

-- KEYBIND SETTINGS
-- Keybind to open the NUI Menu
Config.OpenKey = 'F7'

-- ANIMATION SETTINGS
-- Set check to false if you use this inside another tablet resource to prevent double animations.
Config.EnableAnimation = true

-- SELECT LANGUAGE
-- Options: 'en', 'de'...
Config.Locale = 'en'

-- ---------------------------------------------------------
-- TRANSLATIONS (Locales)
-- ---------------------------------------------------------
Config.Locales = {
    -- ENGLISH
    ['en'] = {
        -- Menu
        menu_inbox = "Inbox", 
        menu_sent = "Sent", 
        menu_refresh = "Refresh",
        btn_compose = "Compose",
        
        -- Settings & Sidebar
        lbl_settings_header = "Design Theme",
        lbl_transparency = "Transparency",
        
        -- Search
        placeholder_search = "Search...",
        
        -- Headers
        header_inbox = "Inbox", 
        header_sent = "Sent", 
        header_new_msg = "New Message",
        
        -- Read View Buttons
        btn_back = "Back",
        tooltip_delete = "Delete Forever",
        tooltip_reply = "Reply",
        
        -- Compose Form
        placeholder_recipient = "Recipient (name@domain.ls)...", 
        placeholder_subject = "Subject", 
        placeholder_message = "Your message... (Max 2000 chars)",
        btn_send = "Send", 
        btn_cancel = "Cancel",

        -- Notifications / Errors
        new_mail_notify = "New mail for %s from: %s", 
        success_sent = "Mail sent successfully!", 
        deleted_final = "Deleted permanently",
        
        error_domain = "Address must end with @%s", 
        error_format = "Invalid format",
        error_recipient = "Recipient not found", 
        error_too_long = "Message too long!",
        error_cannot_open = "You cannot open the mail app right now.",
        
        -- Time
        time_just_now = "Just now", 
        time_min_ago = "%d min ago", 
        time_today = "Today", 
        time_yesterday = "Yesterday",
        no_messages = "No messages found",
        history_header = "From: %s | Sent: %s",
    },

    -- GERMAN
    ['de'] = {
        menu_inbox = "Posteingang", 
        menu_sent = "Gesendet", 
        menu_refresh = "Aktualisieren",
        btn_compose = "Verfassen",
        
        lbl_settings_header = "Design Theme",
        lbl_transparency = "Transparenz",
        
        placeholder_search = "Suchen...",
        
        header_inbox = "Posteingang", 
        header_sent = "Gesendet", 
        header_new_msg = "Neue Nachricht",
        
        btn_back = "Zurück",
        tooltip_delete = "Endgültig Löschen",
        tooltip_reply = "Antworten",
        
        placeholder_recipient = "Empfänger (name@domain.ls)...", 
        placeholder_subject = "Betreff", 
        placeholder_message = "Deine Nachricht... (Max 2000 Zeichen)",
        btn_send = "Senden", 
        btn_cancel = "Abbrechen",

        new_mail_notify = "Neue Mail für %s von: %s",
        success_sent = "E-Mail erfolgreich gesendet!", 
        deleted_final = "Endgültig gelöscht",
        
        error_domain = "Adresse muss auf @%s enden", 
        error_format = "Ungültiges Format",
        error_recipient = "Empfänger nicht gefunden", 
        error_too_long = "Nachricht zu lang!",
        error_cannot_open = "Du kannst das Tablet gerade nicht öffnen.",
        
        time_just_now = "Gerade eben", 
        time_min_ago = "Vor %d Min", 
        time_today = "Heute", 
        time_yesterday = "Gestern",
        no_messages = "Keine Nachrichten vorhanden",
        history_header = "Von: %s | Gesendet: %s",
    },
    -- Other languages can be added here following the same stripped-down structure
}

-- Helper function to get translation
function _L(key)
    local lang = Config.Locale or 'en'
    if not Config.Locales[lang] then lang = 'en' end
    return Config.Locales[lang][key] or "MISSING TRANSLATION"
end