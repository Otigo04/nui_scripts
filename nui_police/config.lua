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

Config.Locales = {
    ['en'] = {
        ['header_title'] = "Leitstelle",
        ['dispatch_mark_remove'] = "Remove Dispatch Marker",
        -- Weitere werden folgen
    }
}