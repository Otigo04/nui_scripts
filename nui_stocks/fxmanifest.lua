fx_version 'cerulean'
game 'gta5'

author 'NUI LABS'
description 'Advanced Realtime Stock Market'
version '1.0.0'

ui_page 'html/index.html'

shared_scripts {
    'config.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua', -- Wir brauchen Datenbankzugriff
    'server.lua'
}

client_scripts {
    'client.lua'
}

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    -- Wir brauchen eine Chart Library. Ich empfehle Chart.js via CDN im HTML, 
    -- aber man kann es auch lokal haben. Wir nehmen erstmal CDN.
}

lua54 'yes'