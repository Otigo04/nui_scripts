fx_version 'cerulean'
game 'gta5'

author 'NUI LABS'
description 'NUI Police'
version 'V0.1'

-- Alle Client-Seitigen Scripte
client_scripts {
    'config.lua',
    'client.lua'
}

-- Alle Server-Seitigen Scripte
server_scripts {
    '@oxmysql/lib/MySQL.lua', -- Wir nutzen oxmysql für die Datenbank
    'config.lua',
    'server.lua'
}

-- UI Dateien
ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    -- Hier kommen später die Map-Assets hin
}

lua54 'yes'