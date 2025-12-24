fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'NUI LABS'
description 'NUI MAIL LITE - Clean, Smooth & Performant Mail System'
version '1.1.2' 

----------------------------------------------------------------------
-- NUI/HTML CONFIGURATION
----------------------------------------------------------------------

ui_page 'html/index.html'

-- All non-lua assets (HTML, CSS, JS, Images, Sounds)
files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
}

----------------------------------------------------------------------
-- ESCROW PROTECTION / IGNORE
----------------------------------------------------------------------

-- We explicitly ignore config.lua from encryption.
-- All other Lua files listed below will be ENCRYPTED by Asset Escrow.

escrow_ignore {
    'config.lua', -- THIS FILE IS OPEN AND EDITABLE
}

----------------------------------------------------------------------
-- SHARED SCRIPTS
----------------------------------------------------------------------

shared_scripts {
    'config.lua' -- Must be loaded by both client and server
}

----------------------------------------------------------------------
-- CLIENT SCRIPTS (ENCRYPTED)
----------------------------------------------------------------------

client_scripts {
    '@qb-core/shared/locale.lua', 
    'client.lua' -- THIS FILE IS PROTECTED
}

----------------------------------------------------------------------
-- SERVER SCRIPTS (ENCRYPTED)
----------------------------------------------------------------------

server_scripts {
    '@qb-core/shared/locale.lua', 
    'server.lua' -- THIS FILE IS PROTECTED
}

----------------------------------------------------------------------
-- DATA / DEPENDENCIES
----------------------------------------------------------------------

server_data 'nui_mail.sql'

dependencies {
    'qb-core',
    'oxmysql'
}