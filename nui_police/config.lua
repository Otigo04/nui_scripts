Config = {}

Config.Debug = true -- Setze auf false für den Release
Config.Command = "dispatch" -- Befehl zum Öffnen
Config.JobName = "police"   -- Welcher Job darf das Interface nutzen?

Config.Colors = {
    primary = "#005bb7",    -- Blau-Ton aus deinem Bild
    secondary = "#0a1724",  -- Dunkler Hintergrund
    accent = "#00d1ff",
    danger = "#ff4d4d",
    success = "#44ff44"
}


Config.Ranks = {
    [1] = "Recruit",
    [2] = "Officer I",
    [3] = "Officer II",
    [4] = "Officer III",
    [5] = "Senior Officer",
    [6] = "Sergeant",
    [7] = "Staff Sergeant",
    [8] = "Lieutenant",
    [9] = "Captain",
    [10] = "Assistant Chief",
    [11] = "Deputy Chief",
    [12] = "Chief of Police"
}

-- DATEI: config.lua
Config.Vehicles = {
    { label = "Victoria Crown (LSPD)", model = "police", plate = "LSPD-01" },
    { label = "Dodge Charger (Interstate)", model = "police2", plate = "LSPD-02" },
    { label = "Ford Explorer (K9)", model = "police3", plate = "LSPD-03" },
    { label = "Maverick (Air)", model = "polmav", plate = "N-PILOT" }
}

Config.Locales = {
    ['en'] = {
        ['header_title'] = "Leitstelle",
        ['dispatch_mark_remove'] = "Remove Dispatch Marker",
        -- Weitere werden folgen
    }
}