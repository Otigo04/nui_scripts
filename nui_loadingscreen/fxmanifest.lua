fx_version 'cerulean'
game 'gta5'

author 'Jumanji - Scripts'
description 'A clean, minimalist loading screen for FiveM with smooth animations and ambient music.'
version '1.0.0'

loadscreen_manual_shutdown "yes"
files {
    'html/index.html',
    'html/main.js',
    'html/style.css',
    'html/assets/**/*.*' 
}
loadscreen 'html/index.html'
lua54 'yes'

dependency '/assetpacks'