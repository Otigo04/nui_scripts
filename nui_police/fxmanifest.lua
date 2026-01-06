fx_version 'cerulean'
game 'gta5'

author 'NUI LABS'
description 'Professional Police Dispatch System'
version 'V0.50 Beta'

client_scripts {
    'config.lua',
    'client.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'config.lua',
    'server.lua'
}

ui_page 'html/index.html'

-- NUIPolice/fxmanifest.lua

-- NUIPolice/fxmanifest.lua

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    -- LOKALE BIBLIOTHEKEN (WICHTIG!)
    'html/libs/leaflet.js',
    'html/libs/leaflet.css',
    -- BLIPS UND MAP ASSETS
    'html/blips/*.png',
    'html/mapStyles/styleSatelite/**/*.jpg',
    'html/mapStyles/styleSatelite/**/*.png'
}

lua54 'yes'