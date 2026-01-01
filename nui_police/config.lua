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

Config.DirectivesPermissions = 3 -- Mindest-Rang-Level (z.B. 8 = Lieutenant)

Config.HazardLevels = {
    { id = 1, label = "Code Green", color = "#44ff44", description = "Normalbetrieb - Keine erhöhte Wachsamkeit." },
    { id = 2, label = "Code Yellow", color = "#ffcc00", description = "Erhöhte Wachsamkeit - Streifenbesetzung min. 2 Beamte." },
    { id = 3, label = "Code Red", color = "#ff4d4d", description = "Hohe Gefahr - Schusswaffengebrauch autorisiert." },
    { id = 4, label = "Code Black", color = "#9b59b6", description = "Ausnahmezustand - Alle Einheiten sammeln!" }
}

-- Global Config for Dispatch
Config.Vehicles = {
    { label = "Victoria Crown", model = "police", plate = "LSPD-01" },
    { label = "Dodge Charger", model = "police2", plate = "LSPD-02" },
    { label = "Ford Explorer", model = "police3", plate = "LSPD-03" },
    { label = "Police Maverick", model = "polmav", plate = "AIR-01" }
}

Config.StatusCodes = {
    { label = "CODE 1", value = "Code 1", color = "#44ff44" },
    { label = "CODE 2", value = "Code 2", color = "#ffcc00" },
    { label = "CODE 3", value = "Code 3", color = "#ff4d4d" },
    { label = "CODE 4", value = "Code 4", color = "#00d1ff" },
    { label = "CODE 5", value = "Code 5", color = "#9b59b6" }
}

Config.Locales = {
    ['en'] = {
        ['header_title'] = "Leitstelle",
        ['dispatch_mark_remove'] = "Remove Dispatch Marker",
        -- Weitere werden folgen
    }
}