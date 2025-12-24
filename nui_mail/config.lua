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
Config.UIScale = 1.2

-- MULTI ACCOUNT SETTINGS
-- Maximum number of additional personal accounts a player can create
Config.MaxAccounts = 3 

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
-- logic: If the sender email contains a 'keyword', the style is applied.
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

-- Default Avatar Colors (Randomly picked for normal users)
Config.AvatarPalette = {
    '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#84cc16'
}

-- KEYBIND SETTINGS
-- Keybind to open the NUI Menu
Config.OpenKey = 'F4'

-- SELECT LANGUAGE
-- Options: 'en', 'de', 'es', 'fr', 'tr'
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
        menu_trash = "Trash", 
        menu_refresh = "Refresh",
        btn_compose = "Compose",
        
        -- Settings & Sidebar
        lbl_settings_header = "Design Theme",
        lbl_transparency = "Transparency",
        lbl_add_account = "Add Account",
        
        -- Search
        placeholder_search = "Search...",
        
        -- Headers
        header_inbox = "Inbox", 
        header_sent = "Sent", 
        header_trash = "Trash", 
        header_new_msg = "New Message",
        
        -- Read View Buttons
        btn_back = "Back",
        tooltip_restore = "Restore Mail",
        tooltip_delete = "Delete",
        tooltip_reply = "Reply",
        
        -- Compose Form
        placeholder_recipient = "Recipient (Name or ID)...", 
        placeholder_subject = "Subject", 
        placeholder_message = "Your message... (Max 2000 chars)",
        btn_send = "Send", 
        btn_cancel = "Cancel",

        -- Create Account Modal
        modal_title = "New Identity",
        modal_desc = "Create a new alias for your mail system.",
        modal_label_acc = "Account Label",
        modal_placeholder_acc = "e.g. Business / Secret",
        modal_label_mail = "Email Address",
        modal_placeholder_mail = "prefix",
        modal_btn_create = "Create Alias",
        modal_btn_cancel = "Cancel",

        -- Notifications / Errors
        new_mail_notify = "New mail for %s from: %s", -- %s are placeholders
        success_sent = "Mail sent successfully!", 
        success_restored = "Mail restored to inbox",
        success_acc_created = "Account created successfully!",
        moved_trash = "Moved to trash",
        deleted_final = "Deleted permanently",
        error_restricted = "Name contains restricted keywords!",
        
        error_domain = "Address must end with @%s", 
        error_format = "Invalid format",
        error_recipient = "Recipient not found", 
        error_too_long = "Message too long!",
        error_limit_reached = "Account limit reached!",
        error_exists = "This email is already taken!",
        error_cannot_open = "You cannot open the mail app right now.",
        
        -- Time
        time_just_now = "Just now", 
        time_min_ago = "%d min ago", 
        time_today = "Today", 
        time_yesterday = "Yesterday",
        no_messages = "No messages found",
        history_header = "From: %s | Sent: %s",

        -- DELETE ACCOUNT MODAL
        modal_delete_title = "Delete Account?",
        modal_delete_desc = "This action cannot be undone. All mails in this inbox will be lost.",
        btn_confirm_delete = "Yes, Delete",
        
        -- ERROR / SUCCESS
        success_acc_deleted = "Account deleted successfully.",
        error_delete_default = "You cannot delete your main account!",

        
    },

    -- GERMAN
    ['de'] = {
        menu_inbox = "Posteingang", 
        menu_sent = "Gesendet", 
        menu_trash = "Papierkorb", 
        menu_refresh = "Aktualisieren",
        btn_compose = "Verfassen",
        
        lbl_settings_header = "Design Theme",
        lbl_transparency = "Transparenz",
        lbl_add_account = "Konto hinzufügen",
        
        placeholder_search = "Suchen...",
        
        header_inbox = "Posteingang", 
        header_sent = "Gesendet", 
        header_trash = "Papierkorb", 
        header_new_msg = "Neue Nachricht",
        error_restricted = "Name enthält geschützte Begriffe!",
        
        btn_back = "Zurück",
        tooltip_restore = "Wiederherstellen",
        tooltip_delete = "Löschen",
        tooltip_reply = "Antworten",
        
        placeholder_recipient = "Empfänger (Name oder ID)...", 
        placeholder_subject = "Betreff", 
        placeholder_message = "Deine Nachricht... (Max 2000 Zeichen)",
        btn_send = "Senden", 
        btn_cancel = "Abbrechen",

        modal_title = "Neue Identität",
        modal_desc = "Erstelle einen neuen Alias für deine Mails.",
        modal_label_acc = "Konto Bezeichnung",
        modal_placeholder_acc = "z.B. Geschäftlich / Privat",
        modal_label_mail = "E-Mail Adresse",
        modal_placeholder_mail = "wunschname",
        modal_btn_create = "Alias Erstellen",
        modal_btn_cancel = "Abbrechen",

        new_mail_notify = "Neue Mail für %s von: %s",
        success_sent = "E-Mail erfolgreich gesendet!", 
        success_restored = "Nachricht wiederhergestellt",
        success_acc_created = "Konto erfolgreich erstellt!",
        moved_trash = "In Papierkorb verschoben",
        deleted_final = "Endgültig gelöscht",
        
        error_domain = "Adresse muss auf @%s enden", 
        error_format = "Ungültiges Format",
        error_recipient = "Empfänger nicht gefunden", 
        error_too_long = "Nachricht zu lang!",
        error_limit_reached = "Konto-Limit erreicht!",
        error_exists = "Diese E-Mail ist bereits vergeben!",
        error_cannot_open = "Du kannst das Tablet gerade nicht öffnen.",
        
        time_just_now = "Gerade eben", 
        time_min_ago = "Vor %d Min", 
        time_today = "Heute", 
        time_yesterday = "Gestern",
        no_messages = "Keine Nachrichten vorhanden",
        history_header = "Von: %s | Gesendet: %s",

        modal_delete_title = "Konto löschen?",
        modal_delete_desc = "Dies kann nicht rückgängig gemacht werden. Alle Mails in diesem Postfach gehen verloren.",
        btn_confirm_delete = "Ja, Löschen",
        
        success_acc_deleted = "Konto erfolgreich gelöscht.",
        error_delete_default = "Du kannst dein Hauptkonto nicht löschen!",

        
    },

    -- SPANISH
    ['es'] = {
        menu_inbox = "Bandeja de entrada", 
        menu_sent = "Enviados", 
        menu_trash = "Papelera", 
        menu_refresh = "Actualizar",
        btn_compose = "Redactar",
        
        lbl_settings_header = "Tema de diseño",
        lbl_transparency = "Transparencia",
        lbl_add_account = "Añadir cuenta",
        
        placeholder_search = "Buscar...",
        
        header_inbox = "Bandeja de entrada", 
        header_sent = "Enviados", 
        header_trash = "Papelera", 
        header_new_msg = "Nuevo mensaje",
        
        btn_back = "Atrás",
        tooltip_restore = "Restaurar",
        tooltip_delete = "Eliminar",
        tooltip_reply = "Responder",
        
        placeholder_recipient = "Destinatario (Nombre o ID)...", 
        placeholder_subject = "Asunto", 
        placeholder_message = "Tu mensaje... (Máx 2000 caracteres)",
        btn_send = "Enviar", 
        btn_cancel = "Cancelar",

        modal_title = "Nueva Identidad",
        modal_desc = "Crea un nuevo alias para tu correo.",
        modal_label_acc = "Etiqueta de cuenta",
        modal_placeholder_acc = "ej. Negocios / Privado",
        modal_label_mail = "Dirección de correo",
        modal_placeholder_mail = "nombre",
        modal_btn_create = "Crear Alias",
        modal_btn_cancel = "Cancelar",
        

        new_mail_notify = "Nuevo correo para %s de: %s",
        success_sent = "¡Correo enviado con éxito!", 
        success_restored = "Correo restaurado",
        success_acc_created = "¡Cuenta creada con éxito!",
        moved_trash = "Movido a la papelera",
        deleted_final = "Eliminado permanentemente",
        
        error_domain = "La dirección debe terminar en @%s", 
        error_format = "Formato inválido",
        error_recipient = "Destinatario no encontrado", 
        error_too_long = "¡Mensaje demasiado largo!",
        error_limit_reached = "¡Límite de cuentas alcanzado!",
        error_exists = "¡Este correo ya está en uso!",
        error_cannot_open = "No puedes abrir esto ahora.",
        error_restricted = "¡Nombre contiene palabras prohibidas!",
        
        time_just_now = "Ahora mismo", 
        time_min_ago = "Hace %d min", 
        time_today = "Hoy", 
        time_yesterday = "Ayer",
        no_messages = "No hay mensajes",
        history_header = "De: %s | Enviado: %s",

        modal_delete_title = "Konto löschen?",
        modal_delete_desc = "Dies kann nicht rückgängig gemacht werden. Alle Mails in diesem Postfach gehen verloren.",
        btn_confirm_delete = "Ja, Löschen",
        
        success_acc_deleted = "Konto erfolgreich gelöscht.",
        error_delete_default = "Du kannst dein Hauptkonto nicht löschen!",
    },

    -- FRENCH
    ['fr'] = {
        menu_inbox = "Boîte de réception", 
        menu_sent = "Envoyés", 
        menu_trash = "Corbeille", 
        menu_refresh = "Actualiser",
        btn_compose = "Écrire",
        
        lbl_settings_header = "Thème",
        lbl_transparency = "Transparence",
        lbl_add_account = "Ajouter un compte",
        
        placeholder_search = "Rechercher...",
        
        header_inbox = "Boîte de réception", 
        header_sent = "Messages envoyés", 
        header_trash = "Corbeille", 
        header_new_msg = "Nouveau message",
        
        btn_back = "Retour",
        tooltip_restore = "Restaurer",
        tooltip_delete = "Supprimer",
        tooltip_reply = "Répondre",
        
        placeholder_recipient = "Destinataire (Nom ou ID)...", 
        placeholder_subject = "Objet", 
        placeholder_message = "Votre message... (Max 2000 car.)",
        btn_send = "Envoyer", 
        btn_cancel = "Annuler",

        modal_title = "Nouvelle Identité",
        modal_desc = "Créez un nouvel alias pour vos e-mails.",
        modal_label_acc = "Libellé du compte",
        modal_placeholder_acc = "ex. Business / Privé",
        modal_label_mail = "Adresse e-mail",
        modal_placeholder_mail = "prefixe",
        modal_btn_create = "Créer un alias",
        modal_btn_cancel = "Annuler",

        new_mail_notify = "Nouveau mail pour %s de : %s",
        success_sent = "E-mail envoyé avec succès !", 
        success_restored = "Message restauré",
        success_acc_created = "Compte créé avec succès !",
        moved_trash = "Déplacé vers la corbeille",
        deleted_final = "Supprimé définitivement",
        
        error_domain = "L'adresse doit finir par @%s", 
        error_format = "Format invalide",
        error_recipient = "Destinataire introuvable", 
        error_too_long = "Message trop long !",
        error_limit_reached = "Limite de comptes atteinte !",
        error_exists = "Cette adresse est déjà prise !",
        error_cannot_open = "Impossible d'ouvrir maintenant.",
        error_restricted = "Nom contient des mots interdits !",
        
        time_just_now = "À l'instant", 
        time_min_ago = "Il y a %d min", 
        time_today = "Aujourd'hui", 
        time_yesterday = "Hier",
        no_messages = "Aucun message",
        history_header = "De : %s | Envoyé : %s",

        modal_delete_title = "Konto löschen?",
        modal_delete_desc = "Dies kann nicht rückgängig gemacht werden. Alle Mails in diesem Postfach gehen verloren.",
        btn_confirm_delete = "Ja, Löschen",
        
        success_acc_deleted = "Konto erfolgreich gelöscht.",
        error_delete_default = "Du kannst dein Hauptkonto nicht löschen!",
    },

    -- TURKISH
    ['tr'] = {
        menu_inbox = "Gelen Kutusu", 
        menu_sent = "Gönderilenler", 
        menu_trash = "Çöp Kutusu", 
        menu_refresh = "Yenile",
        btn_compose = "Oluştur",
        
        lbl_settings_header = "Tasarım Teması",
        lbl_transparency = "Saydamlık",
        lbl_add_account = "Hesap Ekle",
        
        placeholder_search = "Ara...",
        
        header_inbox = "Gelen Kutusu", 
        header_sent = "Gönderilenler", 
        header_trash = "Çöp Kutusu", 
        header_new_msg = "Yeni Mesaj",
        
        btn_back = "Geri",
        tooltip_restore = "Geri Yükle",
        tooltip_delete = "Sil",
        tooltip_reply = "Yanıtla",
        
        placeholder_recipient = "Alıcı (İsim veya ID)...", 
        placeholder_subject = "Konu", 
        placeholder_message = "Mesajınız... (Maks 2000 karakter)",
        btn_send = "Gönder", 
        btn_cancel = "İptal",

        modal_title = "Yeni Kimlik",
        modal_desc = "Posta sisteminiz için yeni bir takma ad oluşturun.",
        modal_label_acc = "Hesap Etiketi",
        modal_placeholder_acc = "örn. İş / Özel",
        modal_label_mail = "E-posta Adresi",
        modal_placeholder_mail = "isim",
        modal_btn_create = "Takma Ad Oluştur",
        modal_btn_cancel = "İptal",

        new_mail_notify = "%s için yeni posta: %s",
        success_sent = "E-posta başarıyla gönderildi!", 
        success_restored = "Mesaj geri yüklendi",
        success_acc_created = "Hesap başarıyla oluşturuldu!",
        moved_trash = "Çöp kutusuna taşındı",
        deleted_final = "Kalıcı olarak silindi",
        
        error_domain = "Adres @%s ile bitmelidir", 
        error_format = "Geçersiz format",
        error_recipient = "Alıcı bulunamadı", 
        error_too_long = "Mesaj çok uzun!",
        error_limit_reached = "Hesap sınırına ulaşıldı!",
        error_exists = "Bu e-posta adresi zaten kullanımda!",
        error_cannot_open = "Şu anda açamazsın.",
        error_restricted = "İsim yasaklı kelimeler içeriyor!",
        
        time_just_now = "Az önce", 
        time_min_ago = "%d dk önce", 
        time_today = "Bugün", 
        time_yesterday = "Dün",
        no_messages = "Mesaj yok",
        history_header = "Gönderen: %s | Gönderildi: %s",

        modal_delete_title = "Konto löschen?",
        modal_delete_desc = "Dies kann nicht rückgängig gemacht werden. Alle Mails in diesem Postfach gehen verloren.",
        btn_confirm_delete = "Ja, Löschen",
        
        success_acc_deleted = "Konto erfolgreich gelöscht.",
        error_delete_default = "Du kannst dein Hauptkonto nicht löschen!",
    }
}

-- Helper function to get translation
function _L(key)
    local lang = Config.Locale or 'en'
    if not Config.Locales[lang] then lang = 'en' end
    return Config.Locales[lang][key] or "MISSING TRANSLATION"
end