Config = {}

Config.OpenKey = 'F3'
Config.OpenCommand = 'tablet'

Config.OpenKey = 'F3' 
Config.OpenCommand = 'tablet'

-- Settings for the Clock
Config.Timezone = 'Europe/Berlin' -- Timezone Identifier (e.g. 'America/New_York', 'Europe/London')
Config.Locale = 'de-DE' -- Locale for date formatting

Config.Locale = 'de-DE' 

-- Standard Wallpapers (CSS Gradients oder URLs)
Config.Wallpapers = {
    { label = "NUI Dark", value = "linear-gradient(135deg, #1c1c1c 0%, #2a2a2a 100%)" },
    { label = "Midnight", value = "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" },
    { label = "Sunset", value = "linear-gradient(to right, #ff512f, #dd2476)" },
    { label = "Ocean", value = "linear-gradient(to right, #2193b0, #6dd5ed)" },
    { label = "Nature", value = "linear-gradient(to right, #11998e, #38ef7d)" },
    { label = "Royal", value = "linear-gradient(to right, #141e30, #243b55)" }
}

Config.Apps = {
    {
        name = 'email',
        label = 'E-Mail',
        icon = 'fas fa-envelope',
        resourceName = 'nui_email',
        isDefault = true,
        color = 'linear-gradient(135deg, #38b6ff 0%, #004e92 100%)' 
    },
    {
        name = 'stocks',
        label = 'Stocks',
        icon = 'fas fa-chart-line',
        resourceName = 'nui_stocks',
        isDefault = true,
        color = 'linear-gradient(135deg, #131722 0%, #2a2e39 100%)'
    },
    {
        name = 'settings',
        label = 'Settings',
        icon = 'fas fa-cog',
        resourceName = 'nui_tablet',
        isDefault = true,
        -- NEU: Ein dezentes Grau/Silber
        color = 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)'
    },
    -- Beispiel für später (Banking = Grün)
    -- {
    --     name = 'banking',
    --     label = 'Banking',
    --     icon = 'fas fa-wallet',
    --     resourceName = 'nui_banking',
    --     isDefault = false,
    --     color = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    -- }
}