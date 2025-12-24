// --- CONFIGURATION / DATA ---
const menuData = {
    self: {
        label: "🧍‍♂️SELF OPTIONS",
        items: [
            { label: "🛡️ GODMODE", action: "godmode", type: "toggle", state: false },
            { label: "👻 NOCLIP MODE", action: "noclip", type: "toggle", state: false },
            { label: "🏷️ PLAYER NAMES", action: "toggle_names", type: "toggle", state: false },
            { label: "🗺️ MAP BLIPS", action: "toggle_blips", type: "toggle", state: false },
            { label: "🦘 SUPER JUMP", action: "super_jump", type: "toggle", state: false },
            { label: "🏃 FAST RUN", action: "fast_run", type: "toggle", state: false },
            { label: "🫥 GHOST MODE (INVIS)", action: "ghost_mode", type: "toggle", state: false },
            { label: "❤️ HEAL ME", action: "heal_self", type: "button" },
            { label: "⚡ REVIVE ME", action: "revive_self", type: "button" },
            {
                label: "💵 MONEY MANAGEMENT",
                type: "submenu",
                items: [
                    { label: "💵 CASH (+/-)", action: "manage_money", type: "button", moneyType: "cash" },
                    { label: "🏦 BANK (+/-)", action: "manage_money", type: "button", moneyType: "bank" },
                    { label: "🕶️ BLACK MONEY (+/-)", action: "manage_money", type: "button", moneyType: "crypto" }
                ]
            },
            { label: "🧼 CLEAN CLOTHES", action: "clean_ped", type: "button" },
            { label: "☠️ SUICIDE", action: "suicide", type: "button" }
        ]
    },
    players: {
        label: "🧑‍🤝‍🧑PLAYERS",
        items: [
            { 
                label: "PLAYER LIST", 
                type: "submenu", 
                items: [] 
            },
            { label: "💀 KILL ALL", action: "kill_all", type: "button", needsConfirm: true }, 
            { label: "❤️ HEAL ALL", action: "heal_all", type: "button", needsConfirm: true }, 
            { label: "⚡ REVIVE ALL", action: "revive_all", type: "button", needsConfirm: true },
        ]
    },
    weapons: {
        label: "🔫WEAPON OPTIONS",
        items: [
            { 
                label: "🔫 GIVE WEAPON", 
                type: "submenu", 
                items: [
                    {
                        label: "MELEE",
                        type: "submenu",
                        items: [
                            { label: "BAT", action: "give_weapon_click", weapon: "weapon_bat", type: "button" },
                            { label: "BOTTLE", action: "give_weapon_click", weapon: "weapon_bottle", type: "button" },
                            { label: "BATTLEAXE", action: "give_weapon_click", weapon: "weapon_battleaxe", type: "button" },
                            { label: "CANDY CANE", action: "give_weapon_click", weapon: "weapon_candycane", type: "button" },
                            { label: "CROWBAR", action: "give_weapon_click", weapon: "weapon_crowbar", type: "button" },
                            { label: "DAGGER", action: "give_weapon_click", weapon: "weapon_dagger", type: "button" },
                            { label: "FLASHLIGHT", action: "give_weapon_click", weapon: "weapon_flashlight", type: "button" },
                            { label: "GOLF CLUB", action: "give_weapon_click", weapon: "weapon_golfclub", type: "button" },
                            { label: "HAMMER", action: "give_weapon_click", weapon: "weapon_hammer", type: "button" },
                            { label: "HATCHET", action: "give_weapon_click", weapon: "weapon_hatchet", type: "button" },
                            { label: "KNIFE", action: "give_weapon_click", weapon: "weapon_knife", type: "button" },
                            { label: "KNUCKLE", action: "give_weapon_click", weapon: "weapon_knuckle", type: "button" },
                            { label: "MACHETE", action: "give_weapon_click", weapon: "weapon_machete", type: "button" },
                            { label: "NIGHTSTICK", action: "give_weapon_click", weapon: "weapon_nightstick", type: "button" },
                            { label: "POOL CUE", action: "give_weapon_click", weapon: "weapon_poolcue", type: "button" },
                            { label: "STONE HATCHET", action: "give_weapon_click", weapon: "weapon_stone_hatchet", type: "button" },
                            { label: "STUN ROD", action: "give_weapon_click", weapon: "weapon_stunrod", type: "button" },
                            { label: "SWITCHBLADE", action: "give_weapon_click", weapon: "weapon_switchblade", type: "button" },
                            { label: "WRENCH", action: "give_weapon_click", weapon: "weapon_wrench", type: "button" }
                        ]
                    },
                    {
                        label: "HANDGUNS (PISTOLS)",
                        type: "submenu",
                        items: [
                            { label: "PISTOL", action: "give_weapon_click", weapon: "weapon_pistol", type: "button" },
                            { label: "PISTOL MK2", action: "give_weapon_click", weapon: "weapon_pistol_mk2", type: "button" },
                            { label: "PISTOL XM3", action: "give_weapon_click", weapon: "weapon_pistolxm3", type: "button" },
                            { label: "AP PISTOL", action: "give_weapon_click", weapon: "weapon_appistol", type: "button" },
                            { label: "CERAMIC PISTOL", action: "give_weapon_click", weapon: "weapon_ceramicpistol", type: "button" },
                            { label: "COMBAT PISTOL", action: "give_weapon_click", weapon: "weapon_combatpistol", type: "button" },
                            { label: "DOUBLE ACTION", action: "give_weapon_click", weapon: "weapon_doubleaction", type: "button" },
                            { label: "FLARE GUN", action: "give_weapon_click", weapon: "weapon_flaregun", type: "button" },
                            { label: "GADGET PISTOL", action: "give_weapon_click", weapon: "weapon_gadgetpistol", type: "button" },
                            { label: "HEAVY PISTOL", action: "give_weapon_click", weapon: "weapon_heavypistol", type: "button" },
                            { label: "MARKSMAN PISTOL", action: "give_weapon_click", weapon: "weapon_marksmanpistol", type: "button" },
                            { label: "NAVY REVOLVER", action: "give_weapon_click", weapon: "weapon_navyrevolver", type: "button" },
                            { label: "PISTOL .50", action: "give_weapon_click", weapon: "weapon_pistol50", type: "button" },
                            { label: "REVOLVER", action: "give_weapon_click", weapon: "weapon_revolver", type: "button" },
                            { label: "REVOLVER MK2", action: "give_weapon_click", weapon: "weapon_revolver_mk2", type: "button" },
                            { label: "SNS PISTOL", action: "give_weapon_click", weapon: "weapon_snspistol", type: "button" },
                            { label: "SNS PISTOL MK2", action: "give_weapon_click", weapon: "weapon_snspistol_mk2", type: "button" },
                            { label: "VINTAGE PISTOL", action: "give_weapon_click", weapon: "weapon_vintagepistol", type: "button" }
                        ]
                    },  
                    {
                        label: "SUBMACHINE GUNS (SMG)",
                        type: "submenu",
                        items: [
                            { label: "ASSAULT SMG", action: "give_weapon_click", weapon: "weapon_assaultsmg", type: "button" },
                            { label: "COMBAT PDW", action: "give_weapon_click", weapon: "weapon_combatpdw", type: "button" },
                            { label: "MACHINE PISTOL", action: "give_weapon_click", weapon: "weapon_machinepistol", type: "button" },
                            { label: "MICRO SMG", action: "give_weapon_click", weapon: "weapon_microsmg", type: "button" },
                            { label: "MINI SMG", action: "give_weapon_click", weapon: "weapon_minismg", type: "button" },
                            { label: "RAY CARBINE", action: "give_weapon_click", weapon: "weapon_raycarbine", type: "button" },
                            { label: "SMG", action: "give_weapon_click", weapon: "weapon_smg", type: "button" },
                            { label: "SMG MK2", action: "give_weapon_click", weapon: "weapon_smg_mk2", type: "button" },
                            { label: "TEC PISTOL", action: "give_weapon_click", weapon: "weapon_tecpistol", type: "button" }
                        ]
                    },  
                    {
                        label: "SHOTGUNS",
                        type: "submenu",
                        items: [
                            { label: "ASSAULT SHOTGUN", action: "give_weapon_click", weapon: "weapon_assaultshotgun", type: "button" },
                            { label: "AUTO SHOTGUN", action: "give_weapon_click", weapon: "weapon_autoshotgun", type: "button" },
                            { label: "BULLPUP SHOTGUN", action: "give_weapon_click", weapon: "weapon_bullpupshotgun", type: "button" },
                            { label: "COMBAT SHOTGUN", action: "give_weapon_click", weapon: "weapon_combatshotgun", type: "button" },
                            { label: "DB SHOTGUN", action: "give_weapon_click", weapon: "weapon_dbshotgun", type: "button" },
                            { label: "HEAVY SHOTGUN", action: "give_weapon_click", weapon: "weapon_heavyshotgun", type: "button" },
                            { label: "PUMP SHOTGUN", action: "give_weapon_click", weapon: "weapon_pumpshotgun", type: "button" },
                            { label: "PUMP SHOTGUN MK2", action: "give_weapon_click", weapon: "weapon_pumpshotgun_mk2", type: "button" },
                            { label: "SAWN OFF SHOTGUN", action: "give_weapon_click", weapon: "weapon_sawnoffshotgun", type: "button" },
                            { label: "MUSKET", action: "give_weapon_click", weapon: "weapon_musket", type: "button" }
                        ]
                    }, 
                    {
                        label: "ASSAULT RIFLES",
                        type: "submenu",
                        items: [
                            { label: "ADVANCED RIFLE", action: "give_weapon_click", weapon: "weapon_advancedrifle", type: "button" },
                            { label: "ASSAULT RIFLE", action: "give_weapon_click", weapon: "weapon_assaultrifle", type: "button" },
                            { label: "ASSAULT RIFLE MK2", action: "give_weapon_click", weapon: "weapon_assaultrifle_mk2", type: "button" },
                            { label: "BATTLE RIFLE", action: "give_weapon_click", weapon: "weapon_battlerifle", type: "button" },
                            { label: "BULLPUP RIFLE", action: "give_weapon_click", weapon: "weapon_bullpuprifle", type: "button" },
                            { label: "BULLPUP RIFLE MK2", action: "give_weapon_click", weapon: "weapon_bullpuprifle_mk2", type: "button" },
                            { label: "CARBINE RIFLE", action: "give_weapon_click", weapon: "weapon_carbinerifle", type: "button" },
                            { label: "CARBINE RIFLE MK2", action: "give_weapon_click", weapon: "weapon_carbinerifle_mk2", type: "button" },
                            { label: "COMPACT RIFLE", action: "give_weapon_click", weapon: "weapon_compactrifle", type: "button" },
                            { label: "HEAVY RIFLE", action: "give_weapon_click", weapon: "weapon_heavyrifle", type: "button" },
                            { label: "MILITARY RIFLE", action: "give_weapon_click", weapon: "weapon_militaryrifle", type: "button" },
                            { label: "SERVICE CARBINE", action: "give_weapon_click", weapon: "weapon_servicecarbine", type: "button" },
                            { label: "SPECIAL CARBINE", action: "give_weapon_click", weapon: "weapon_specialcarbine", type: "button" },
                            { label: "SPECIAL CARBINE MK2", action: "give_weapon_click", weapon: "weapon_specialcarbine_mk2", type: "button" },
                            { label: "TACTICAL RIFLE", action: "give_weapon_click", weapon: "weapon_tacticalrifle", type: "button" }
                        ]
                    },  
                    {
                        label: "LIGHT MACHINE GUNS (MG)",
                        type: "submenu",
                        items: [
                            { label: "COMBAT MG", action: "give_weapon_click", weapon: "weapon_combatmg", type: "button" },
                            { label: "COMBAT MG MK2", action: "give_weapon_click", weapon: "weapon_combatmg_mk2", type: "button" },
                            { label: "GUSENBERG SWEEPER", action: "give_weapon_click", weapon: "weapon_gusenberg", type: "button" },
                            { label: "MG", action: "give_weapon_click", weapon: "weapon_mg", type: "button" }
                        ]
                    },  
                    {
                        label: "SNIPER",
                        type: "submenu",
                        items: [
                            { label: "HEAVY SNIPER", action: "give_weapon_click", weapon: "weapon_heavysniper", type: "button" },
                            { label: "HEAVY SNIPER MK2", action: "give_weapon_click", weapon: "weapon_heavysniper_mk2", type: "button" },
                            { label: "MARKSMAN RIFLE", action: "give_weapon_click", weapon: "weapon_marksmanrifle", type: "button" },
                            { label: "MARKSMAN RIFLE MK2", action: "give_weapon_click", weapon: "weapon_marksmanrifle_mk2", type: "button" },
                            { label: "PRECISION RIFLE", action: "give_weapon_click", weapon: "weapon_precisionrifle", type: "button" },
                            { label: "SNIPER RIFLE", action: "give_weapon_click", weapon: "weapon_sniperrifle", type: "button" }
                        ]
                    },  
                    {
                        label: "HEAVY WEAPONS",
                        type: "submenu",
                        items: [
                            { label: "COMPACT LAUNCHER", action: "give_weapon_click", weapon: "weapon_compactlauncher", type: "button" },
                            { label: "FIREWORK LAUNCHER", action: "give_weapon_click", weapon: "weapon_firework", type: "button" },
                            { label: "GRENADE LAUNCHER", action: "give_weapon_click", weapon: "weapon_grenadelauncher", type: "button" },
                            { label: "GRENADE LAUNCHER SMOKE", action: "give_weapon_click", weapon: "weapon_grenadelauncher_smoke", type: "button" },
                            { label: "HOMING LAUNCHER", action: "give_weapon_click", weapon: "weapon_hominglauncher", type: "button" },
                            { label: "MINIGUN", action: "give_weapon_click", weapon: "weapon_minigun", type: "button" },
                            { label: "RAILGUN", action: "give_weapon_click", weapon: "weapon_railgun", type: "button" },
                            { label: "RAY MINIGUN", action: "give_weapon_click", weapon: "weapon_rayminigun", type: "button" },
                            { label: "RPG", action: "give_weapon_click", weapon: "weapon_rpg", type: "button" },
                            { label: "EMP LAUNCHER", action: "give_weapon_click", weapon: "weapon_emplauncher", type: "button" }
                        ]
                    }, 
                    {
                        label: "THROWABLES",
                        type: "submenu",
                        items: [
                            { label: "BALL", action: "give_weapon_click", weapon: "weapon_ball", type: "button" },
                            { label: "BZ GAS", action: "give_weapon_click", weapon: "weapon_bzgas", type: "button" },
                            { label: "FLARE", action: "give_weapon_click", weapon: "weapon_flare", type: "button" },
                            { label: "GRENADE", action: "give_weapon_click", weapon: "weapon_grenade", type: "button" },
                            { label: "MOLOTOV", action: "give_weapon_click", weapon: "weapon_molotov", type: "button" },
                            { label: "PIPE BOMB", action: "give_weapon_click", weapon: "weapon_pipebomb", type: "button" },
                            { label: "PROXIMITY MINE", action: "give_weapon_click", weapon: "weapon_proxmine", type: "button" },
                            { label: "SNOWBALL", action: "give_weapon_click", weapon: "weapon_snowball", type: "button" },
                            { label: "STICKY BOMB", action: "give_weapon_click", weapon: "weapon_stickybomb", type: "button" }
                        ]
                    }, 
                    {
                        label: "MISC (SPECIAL)",
                        type: "submenu",
                        items: [
                            { label: "BRIEFCASE", action: "give_weapon_click", weapon: "weapon_briefcase", type: "button" },
                            { label: "BRIEFCASE 02", action: "give_weapon_click", weapon: "weapon_briefcase_02", type: "button" },
                            { label: "DIGI SCANNER", action: "give_weapon_click", weapon: "weapon_digiscanner", type: "button" },
                            { label: "FERTILIZER CAN", action: "give_weapon_click", weapon: "weapon_fertilizercan", type: "button" },
                            { label: "FIRE EXTINGUISHER", action: "give_weapon_click", weapon: "weapon_fireextinguisher", type: "button" },
                            { label: "HAZARD CAN", action: "give_weapon_click", weapon: "weapon_hazardcan", type: "button" },
                            { label: "JERRY CAN", action: "give_weapon_click", weapon: "weapon_petrolcan", type: "button" },
                            { label: "PARACHUTE", action: "give_weapon_click", weapon: "weapon_parachute", type: "button" },
                            { label: "RAY PISTOL", action: "give_weapon_click", weapon: "weapon_raypistol", type: "button" },
                            { label: "RAY CARBINE", action: "give_weapon_click", weapon: "weapon_raycarbine", type: "button" },
                            { label: "STUN GUN", action: "give_weapon_click", weapon: "weapon_stungun", type: "button" },
                            { label: "STUN GUN MP", action: "give_weapon_click", weapon: "weapon_stungun_mp", type: "button" }
                        ]
                    },                                                                                                                                                                              
                ], 
            },
            { label: "♾️ INFINITE AMMO", action: "infinite_Ammo", type: "toggle" },
            { label: "💥 EXPLOSIVE AMMO", action: "exp_ammo", type: "toggle" },
            { label: "📦 GIVE MAX AMMO (250)", action: "max_ammo", type: "button" }
        ]
    },
    vehicle: {
        label: "🚗VEHICLE OPTIONS",
        items: [
            // EBENE 1: SPAWN KATEGORIE
            { 
                label: "SPAWN VEHICLE", 
                type: "submenu", 
                items: [ 
                    // --- SUPER SPORTS ---
                    // --- ADD YOUR VEHICLES BELOW ---
                    {
                        label: "SUPER",
                        type: "submenu",
                        items: [
                            { label: "ADDER", action: "spawn_vehicle_click", model: "adder", type: "button" },
                            { label: "AUTARCH", action: "spawn_vehicle_click", model: "autarch", type: "button" },
                            { label: "BANSHEE 900R", action: "spawn_vehicle_click", model: "banshee2", type: "button" },
                            { label: "BULLET", action: "spawn_vehicle_click", model: "bullet", type: "button" },
                            { label: "CHEETAH", action: "spawn_vehicle_click", model: "cheetah", type: "button" },
                            { label: "CHAMPION", action: "spawn_vehicle_click", model: "champion", type: "button" },
                            { label: "CYCLONE", action: "spawn_vehicle_click", model: "cyclone", type: "button" },
                            { label: "CYCLONE II", action: "spawn_vehicle_click", model: "cyclone2", type: "button" },
                            { label: "DEVESTE EIGHT", action: "spawn_vehicle_click", model: "deveste", type: "button" },
                            { label: "EMERUS", action: "spawn_vehicle_click", model: "emerus", type: "button" },
                            { label: "ENTITY XF", action: "spawn_vehicle_click", model: "entityxf", type: "button" },
                            { label: "ENTITY XXR", action: "spawn_vehicle_click", model: "entity2", type: "button" },
                            { label: "ENTITY MT", action: "spawn_vehicle_click", model: "entity3", type: "button" },
                            { label: "FMJ", action: "spawn_vehicle_click", model: "fmj", type: "button" },
                            { label: "FURIA", action: "spawn_vehicle_click", model: "furia", type: "button" },
                            { label: "GP1", action: "spawn_vehicle_click", model: "gp1", type: "button" },
                            { label: "IGNUS", action: "spawn_vehicle_click", model: "ignus", type: "button" },
                            { label: "INFERNUS", action: "spawn_vehicle_click", model: "infernus", type: "button" },
                            { label: "ITALI GTB", action: "spawn_vehicle_click", model: "italigtb", type: "button" },
                            { label: "ITALI GTB CUSTOM", action: "spawn_vehicle_click", model: "italigtb2", type: "button" },
                            { label: "ITALI RSX", action: "spawn_vehicle_click", model: "italirsx", type: "button" },
                            { label: "KRIEGER", action: "spawn_vehicle_click", model: "krieger", type: "button" },
                            { label: "NERO", action: "spawn_vehicle_click", model: "nero", type: "button" },
                            { label: "NERO CUSTOM", action: "spawn_vehicle_click", model: "nero2", type: "button" },
                            { label: "OSIRIS", action: "spawn_vehicle_click", model: "osiris", type: "button" },
                            { label: "PENETRATOR", action: "spawn_vehicle_click", model: "penetrator", type: "button" },
                            { label: "PFISTER 811", action: "spawn_vehicle_click", model: "pfister811", type: "button" },
                            { label: "PROTOTIPO", action: "spawn_vehicle_click", model: "prototipo", type: "button" },
                            { label: "REAPER", action: "spawn_vehicle_click", model: "reaper", type: "button" },
                            { label: "SC1", action: "spawn_vehicle_click", model: "sc1", type: "button" },
                            { label: "SULTAN RS", action: "spawn_vehicle_click", model: "sultanrs", type: "button" },
                            { label: "T20", action: "spawn_vehicle_click", model: "t20", type: "button" },
                            { label: "TAIPAN", action: "spawn_vehicle_click", model: "taipan", type: "button" },
                            { label: "TEMPESTA", action: "spawn_vehicle_click", model: "tempesta", type: "button" },
                            { label: "TEZERACT", action: "spawn_vehicle_click", model: "tezeract", type: "button" },
                            { label: "THRAX", action: "spawn_vehicle_click", model: "thrax", type: "button" },
                            { label: "TIGON", action: "spawn_vehicle_click", model: "tigon", type: "button" },
                            { label: "TORERO XO", action: "spawn_vehicle_click", model: "torero2", type: "button" },
                            { label: "TURISMO R", action: "spawn_vehicle_click", model: "turismor", type: "button" },
                            { label: "TYRANT", action: "spawn_vehicle_click", model: "tyrant", type: "button" },
                            { label: "TYRUS", action: "spawn_vehicle_click", model: "tyrus", type: "button" },
                            { label: "VACCA", action: "spawn_vehicle_click", model: "vacca", type: "button" },
                            { label: "VAGNER", action: "spawn_vehicle_click", model: "vagner", type: "button" },
                            { label: "VIGILANTE", action: "spawn_vehicle_click", model: "vigilante", type: "button" },
                            { label: "VIRTUE", action: "spawn_vehicle_click", model: "virtue", type: "button" },
                            { label: "VISIONE", action: "spawn_vehicle_click", model: "visione", type: "button" },
                            { label: "VOLTIC", action: "spawn_vehicle_click", model: "voltic", type: "button" },
                            { label: "XA-21", action: "spawn_vehicle_click", model: "xa21", type: "button" },
                            { label: "ZENTORNO", action: "spawn_vehicle_click", model: "zentorno", type: "button" },
                            { label: "ZORRUSSO", action: "spawn_vehicle_click", model: "zorrusso", type: "button" }
                        ]
                    },
                    // --- SPORTS ---
                    {
                        label: "SPORTS",
                        type: "submenu",
                        items: [
                            { label: "10F", action: "spawn_vehicle_click", model: "tenf", type: "button" },
                            { label: "10F WIDEBODY", action: "spawn_vehicle_click", model: "tenf2", type: "button" },
                            { label: "ALPHA", action: "spawn_vehicle_click", model: "alpha", type: "button" },
                            { label: "BANSHEE", action: "spawn_vehicle_click", model: "banshee", type: "button" },
                            { label: "BESTIA GTS", action: "spawn_vehicle_click", model: "bestiagts", type: "button" },
                            { label: "BUFFALO", action: "spawn_vehicle_click", model: "buffalo", type: "button" },
                            { label: "BUFFALO S", action: "spawn_vehicle_click", model: "buffalo2", type: "button" },
                            { label: "BUFFALO EVX", action: "spawn_vehicle_click", model: "buffalo5", type: "button" },
                            { label: "BUFFALO STX", action: "spawn_vehicle_click", model: "buffalo4", type: "button" },
                            { label: "CALICO GTF", action: "spawn_vehicle_click", model: "calico", type: "button" },
                            { label: "CARBONIZZARE", action: "spawn_vehicle_click", model: "carbonizzare", type: "button" },
                            { label: "COMET", action: "spawn_vehicle_click", model: "comet2", type: "button" },
                            { label: "COMET S2", action: "spawn_vehicle_click", model: "comet6", type: "button" },
                            { label: "COMET S2 CABRIO", action: "spawn_vehicle_click", model: "comet7", type: "button" },
                            { label: "COMET SR", action: "spawn_vehicle_click", model: "comet5", type: "button" },
                            { label: "COQUETTE", action: "spawn_vehicle_click", model: "coquette", type: "button" },
                            { label: "COQUETTE D10", action: "spawn_vehicle_click", model: "coquette4", type: "button" },
                            { label: "CYPHER", action: "spawn_vehicle_click", model: "cypher", type: "button" },
                            { label: "DRAFTER", action: "spawn_vehicle_click", model: "drafter", type: "button" },
                            { label: "ELEGY RH8", action: "spawn_vehicle_click", model: "elegy2", type: "button" },
                            { label: "ELEGY RETRO", action: "spawn_vehicle_click", model: "elegy", type: "button" },
                            { label: "EUROS", action: "spawn_vehicle_click", model: "euros", type: "button" },
                            { label: "FELTZER", action: "spawn_vehicle_click", model: "feltzer2", type: "button" },
                            { label: "FLASH GT", action: "spawn_vehicle_click", model: "flashgt", type: "button" },
                            { label: "FUSILADE", action: "spawn_vehicle_click", model: "fusilade", type: "button" },
                            { label: "FUTO", action: "spawn_vehicle_click", model: "futo", type: "button" },
                            { label: "FUTO GTX", action: "spawn_vehicle_click", model: "futo2", type: "button" },
                            { label: "GROWLER", action: "spawn_vehicle_click", model: "growler", type: "button" },
                            { label: "ITALI GTO", action: "spawn_vehicle_click", model: "italigto", type: "button" },
                            { label: "ITALI GTO STINGER TT", action: "spawn_vehicle_click", model: "italigto2", type: "button" },
                            { label: "JESTER", action: "spawn_vehicle_click", model: "jester", type: "button" },
                            { label: "JESTER RR", action: "spawn_vehicle_click", model: "jester4", type: "button" },
                            { label: "JUGULAR", action: "spawn_vehicle_click", model: "jugular", type: "button" },
                            { label: "KHAMELION", action: "spawn_vehicle_click", model: "khamelion", type: "button" },
                            { label: "KOMODA", action: "spawn_vehicle_click", model: "komoda", type: "button" },
                            { label: "KURUMA", action: "spawn_vehicle_click", model: "kuruma", type: "button" },
                            { label: "KURUMA ARMORED", action: "spawn_vehicle_click", model: "kuruma2", type: "button" },
                            { label: "MASSACRO", action: "spawn_vehicle_click", model: "massacro", type: "button" },
                            { label: "NEON", action: "spawn_vehicle_click", model: "neon", type: "button" },
                            { label: "NINEF", action: "spawn_vehicle_click", model: "ninef", type: "button" },
                            { label: "OMNIS E-GT", action: "spawn_vehicle_click", model: "omnisegt", type: "button" },
                            { label: "PARAGON R", action: "spawn_vehicle_click", model: "paragon", type: "button" },
                            { label: "PARIAH", action: "spawn_vehicle_click", model: "pariah", type: "button" },
                            { label: "PENUMBRA", action: "spawn_vehicle_click", model: "penumbra", type: "button" },
                            { label: "PENUMBRA FF", action: "spawn_vehicle_click", model: "penumbra2", type: "button" },
                            { label: "RAIDEN", action: "spawn_vehicle_click", model: "raiden", type: "button" },
                            { label: "RAPID GT", action: "spawn_vehicle_click", model: "rapidgt", type: "button" },
                            { label: "REVOLTER", action: "spawn_vehicle_click", model: "revolter", type: "button" },
                            { label: "SCHAFTER V12", action: "spawn_vehicle_click", model: "schafter3", type: "button" },
                            { label: "SCHLAGEN GT", action: "spawn_vehicle_click", model: "schlagen", type: "button" },
                            { label: "SCHWARZER", action: "spawn_vehicle_click", model: "schwarzer", type: "button" },
                            { label: "SENTINEL XS", action: "spawn_vehicle_click", model: "sentinel2", type: "button" },
                            { label: "SEVEN-70", action: "spawn_vehicle_click", model: "seven70", type: "button" },
                            { label: "SPECTER", action: "spawn_vehicle_click", model: "specter", type: "button" },
                            { label: "SULTAN", action: "spawn_vehicle_click", model: "sultan", type: "button" },
                            { label: "SULTAN CLASSIC", action: "spawn_vehicle_click", model: "sultan2", type: "button" },
                            { label: "SURANO", action: "spawn_vehicle_click", model: "surano", type: "button" },
                            { label: "VECTRE", action: "spawn_vehicle_click", model: "vectre", type: "button" }
                        ]
                    },
                    // --- MUSCLE ---
                    {
                        label: "MUSCLE",
                        type: "submenu",
                        items: [
                            { label: "BEATER DUKES", action: "spawn_vehicle_click", model: "dukes2", type: "button" },
                            { label: "BLADE", action: "spawn_vehicle_click", model: "blade", type: "button" },
                            { label: "BUCCANEER", action: "spawn_vehicle_click", model: "buccaneer", type: "button" },
                            { label: "BUCCANEER CUSTOM", action: "spawn_vehicle_click", model: "buccaneer2", type: "button" },
                            { label: "CHINO", action: "spawn_vehicle_click", model: "chino", type: "button" },
                            { label: "COQUETTE BLACKFIN", action: "spawn_vehicle_click", model: "coquette3", type: "button" },
                            { label: "DEVIANT", action: "spawn_vehicle_click", model: "deviant", type: "button" },
                            { label: "DOMINATOR", action: "spawn_vehicle_click", model: "dominator", type: "button" },
                            { label: "DOMINATOR ASP", action: "spawn_vehicle_click", model: "dominator8", type: "button" },
                            { label: "DOMINATOR GTT", action: "spawn_vehicle_click", model: "dominator7", type: "button" },
                            { label: "DOMINATOR GTX", action: "spawn_vehicle_click", model: "dominator3", type: "button" },
                            { label: "DOMINATOR GT", action: "spawn_vehicle_click", model: "dominator9", type: "button" },
                            { label: "DUKES", action: "spawn_vehicle_click", model: "dukes", type: "button" },
                            { label: "ELLIE", action: "spawn_vehicle_click", model: "ellie", type: "button" },
                            { label: "FACTION", action: "spawn_vehicle_click", model: "faction", type: "button" },
                            { label: "GAUNTLET", action: "spawn_vehicle_click", model: "gauntlet", type: "button" },
                            { label: "GAUNTLET HELLFIRE", action: "spawn_vehicle_click", model: "gauntlet4", type: "button" },
                            { label: "GAUNTLET CLASSIC", action: "spawn_vehicle_click", model: "gauntlet3", type: "button" },
                            { label: "GREENWOOD", action: "spawn_vehicle_click", model: "greenwood", type: "button" },
                            { label: "HERMES", action: "spawn_vehicle_click", model: "hermes", type: "button" },
                            { label: "HOTKNIFE", action: "spawn_vehicle_click", model: "hotknife", type: "button" },
                            { label: "HUSTLER", action: "spawn_vehicle_click", model: "hustler", type: "button" },
                            { label: "IMPALER", action: "spawn_vehicle_click", model: "impaler", type: "button" },
                            { label: "IMPALER LX", action: "spawn_vehicle_click", model: "impaler5", type: "button" },
                            { label: "IMPERATOR", action: "spawn_vehicle_click", model: "imperator", type: "button" },
                            { label: "LURCHER", action: "spawn_vehicle_click", model: "lurcher", type: "button" },
                            { label: "MOONBEAM", action: "spawn_vehicle_click", model: "moonbeam", type: "button" },
                            { label: "NIGHTSHADE", action: "spawn_vehicle_click", model: "nightshade", type: "button" },
                            { label: "PHOENIX", action: "spawn_vehicle_click", model: "phoenix", type: "button" },
                            { label: "PICADOR", action: "spawn_vehicle_click", model: "picador", type: "button" },
                            { label: "RAPID GT CLASSIC", action: "spawn_vehicle_click", model: "rapidgt3", type: "button" },
                            { label: "RUINER", action: "spawn_vehicle_click", model: "ruiner", type: "button" },
                            { label: "RUINER 2000", action: "spawn_vehicle_click", model: "ruiner2", type: "button" },
                            { label: "SABRE TURBO", action: "spawn_vehicle_click", model: "sabreGT", type: "button" },
                            { label: "SLAMVAN", action: "spawn_vehicle_click", model: "slamvan", type: "button" },
                            { label: "STALION", action: "spawn_vehicle_click", model: "stalion", type: "button" },
                            { label: "TAMPA", action: "spawn_vehicle_click", model: "tampa", type: "button" },
                            { label: "TULIP", action: "spawn_vehicle_click", model: "tulip", type: "button" },
                            { label: "VAMOS", action: "spawn_vehicle_click", model: "vamos", type: "button" },
                            { label: "VIGERO", action: "spawn_vehicle_click", model: "vigero", type: "button" },
                            { label: "VIGERO ZX", action: "spawn_vehicle_click", model: "vigero2", type: "button" },
                            { label: "VIRGO", action: "spawn_vehicle_click", model: "virgo", type: "button" },
                            { label: "VOODOO", action: "spawn_vehicle_click", model: "voodoo", type: "button" },
                            { label: "YOSEMITE", action: "spawn_vehicle_click", model: "yosemite", type: "button" }
                        ]
                    },
                    // --- SUVS ---
                    {
                        label: "SUVS",
                        type: "submenu",
                        items: [
                            { label: "ASTRON", action: "spawn_vehicle_click", model: "astron", type: "button" },
                            { label: "BALLER", action: "spawn_vehicle_click", model: "baller", type: "button" },
                            { label: "BALLER LE", action: "spawn_vehicle_click", model: "baller3", type: "button" },
                            { label: "BALLER ST", action: "spawn_vehicle_click", model: "baller7", type: "button" },
                            { label: "CAVALCADE XL", action: "spawn_vehicle_click", model: "cavalcade3", type: "button" },
                            { label: "CONTENDER", action: "spawn_vehicle_click", model: "contender", type: "button" },
                            { label: "DUBSTA", action: "spawn_vehicle_click", model: "dubsta", type: "button" },
                            { label: "DUBSTA 6X6", action: "spawn_vehicle_click", model: "dubsta3", type: "button" },
                            { label: "GRANGER 3600LX", action: "spawn_vehicle_click", model: "granger2", type: "button" },
                            { label: "GRESLEY", action: "spawn_vehicle_click", model: "gresley", type: "button" },
                            { label: "HABANERO", action: "spawn_vehicle_click", model: "habanero", type: "button" },
                            { label: "HUNTLEY S", action: "spawn_vehicle_click", model: "huntley", type: "button" },
                            { label: "JUBILEE", action: "spawn_vehicle_click", model: "jubilee", type: "button" },
                            { label: "LANDSTALKER XL", action: "spawn_vehicle_click", model: "landstalker2", type: "button" },
                            { label: "MESA", action: "spawn_vehicle_click", model: "mesa", type: "button" },
                            { label: "NOVAK", action: "spawn_vehicle_click", model: "novak", type: "button" },
                            { label: "PATRIOT", action: "spawn_vehicle_click", model: "patriot", type: "button" },
                            { label: "PATRIOT MILSPEC", action: "spawn_vehicle_click", model: "patriot3", type: "button" },
                            { label: "REBLA GTS", action: "spawn_vehicle_click", model: "rebla", type: "button" },
                            { label: "ROCOTO", action: "spawn_vehicle_click", model: "rocoto", type: "button" },
                            { label: "SEMINOLE", action: "spawn_vehicle_click", model: "seminole", type: "button" },
                            { label: "SERRANO", action: "spawn_vehicle_click", model: "serrano", type: "button" },
                            { label: "TOROS", action: "spawn_vehicle_click", model: "toros", type: "button" },
                            { label: "XLS", action: "spawn_vehicle_click", model: "xls", type: "button" }
                        ]
                    },
                    // --- SEDANS ---
                    {
                        label: "SEDANS",
                        type: "submenu",
                        items: [
                            { label: "ASEA", action: "spawn_vehicle_click", model: "asea", type: "button" },
                            { label: "ASTEROPE", action: "spawn_vehicle_click", model: "asterope", type: "button" },
                            { label: "CINQUEMILA", action: "spawn_vehicle_click", model: "cinquemila", type: "button" },
                            { label: "COGNOSCENTI", action: "spawn_vehicle_click", model: "cognoscenti", type: "button" },
                            { label: "DEITY", action: "spawn_vehicle_click", model: "deity", type: "button" },
                            { label: "EMPEROR", action: "spawn_vehicle_click", model: "emperor", type: "button" },
                            { label: "FUGITIVE", action: "spawn_vehicle_click", model: "fugitive", type: "button" },
                            { label: "GLENDALE", action: "spawn_vehicle_click", model: "glendale", type: "button" },
                            { label: "IMPALER SZ", action: "spawn_vehicle_click", model: "impaler6", type: "button" },
                            { label: "INGOT", action: "spawn_vehicle_click", model: "ingot", type: "button" },
                            { label: "INTRUDER", action: "spawn_vehicle_click", model: "intruder", type: "button" },
                            { label: "PREMIER", action: "spawn_vehicle_click", model: "premier", type: "button" },
                            { label: "PRIMO", action: "spawn_vehicle_click", model: "primo", type: "button" },
                            { label: "REGINE", action: "spawn_vehicle_click", model: "regina", type: "button" },
                            { label: "ROMERO HEARSE", action: "spawn_vehicle_click", model: "romero", type: "button" },
                            { label: "SCHAFTER", action: "spawn_vehicle_click", model: "schafter2", type: "button" },
                            { label: "STAFFORD", action: "spawn_vehicle_click", model: "stafford", type: "button" },
                            { label: "STANIER", action: "spawn_vehicle_click", model: "stanier", type: "button" },
                            { label: "STRATUM", action: "spawn_vehicle_click", model: "stratum", type: "button" },
                            { label: "SUPER DIAMOND", action: "spawn_vehicle_click", model: "superd", type: "button" },
                            { label: "SURGE", action: "spawn_vehicle_click", model: "surge", type: "button" },
                            { label: "TAILGATER", action: "spawn_vehicle_click", model: "tailgater", type: "button" },
                            { label: "TAILGATER S", action: "spawn_vehicle_click", model: "tailgater2", type: "button" },
                            { label: "WARRENER", action: "spawn_vehicle_click", model: "warrener", type: "button" },
                            { label: "WASHINGTON", action: "spawn_vehicle_click", model: "washington", type: "button" }
                        ]
                    },
                    // --- COMPACTS ---
                    {
                        label: "COMPACTS",
                        type: "submenu",
                        items: [
                            { label: "ASBO", action: "spawn_vehicle_click", model: "asbo", type: "button" },
                            { label: "BLISTA", action: "spawn_vehicle_click", model: "blista", type: "button" },
                            { label: "BRIOSO R/A", action: "spawn_vehicle_click", model: "brioso", type: "button" },
                            { label: "BRIOSO 300", action: "spawn_vehicle_click", model: "brioso2", type: "button" },
                            { label: "CLUB", action: "spawn_vehicle_click", model: "club", type: "button" },
                            { label: "DILETTANTE", action: "spawn_vehicle_click", model: "dilettante", type: "button" },
                            { label: "ISSI", action: "spawn_vehicle_click", model: "issi2", type: "button" },
                            { label: "ISSI CLASSIC", action: "spawn_vehicle_click", model: "issi3", type: "button" },
                            { label: "KANJO", action: "spawn_vehicle_click", model: "kanjo", type: "button" },
                            { label: "PANTO", action: "spawn_vehicle_click", model: "panto", type: "button" },
                            { label: "PRAIRIE", action: "spawn_vehicle_click", model: "prairie", type: "button" },
                            { label: "RHAPSODY", action: "spawn_vehicle_click", model: "rhapsody", type: "button" }
                        ]
                    },
                    // --- MOTORCYCLES ---
                    {
                        label: "MOTORCYCLES",
                        type: "submenu",
                        items: [
                            { label: "AKUMA", action: "spawn_vehicle_click", model: "akuma", type: "button" },
                            { label: "AVARUS", action: "spawn_vehicle_click", model: "avarus", type: "button" },
                            { label: "BAGGER", action: "spawn_vehicle_click", model: "bagger", type: "button" },
                            { label: "BATI 801", action: "spawn_vehicle_click", model: "bati", type: "button" },
                            { label: "BF400", action: "spawn_vehicle_click", model: "bf400", type: "button" },
                            { label: "CARBON RS", action: "spawn_vehicle_click", model: "carbonrs", type: "button" },
                            { label: "CHIMERA", action: "spawn_vehicle_click", model: "chimera", type: "button" },
                            { label: "CLIFFHANGER", action: "spawn_vehicle_click", model: "cliffhanger", type: "button" },
                            { label: "DAEMON", action: "spawn_vehicle_click", model: "daemon", type: "button" },
                            { label: "DEFILER", action: "spawn_vehicle_click", model: "defiler", type: "button" },
                            { label: "DIABLOUS", action: "spawn_vehicle_click", model: "diablous", type: "button" },
                            { label: "DOUBLE-T", action: "spawn_vehicle_click", model: "double", type: "button" },
                            { label: "ENDURO", action: "spawn_vehicle_click", model: "enduro", type: "button" },
                            { label: "FAGGIO", action: "spawn_vehicle_click", model: "faggio", type: "button" },
                            { label: "FAGGIO SPORT", action: "spawn_vehicle_click", model: "faggio2", type: "button" },
                            { label: "GARGOLYE", action: "spawn_vehicle_click", model: "gargoyle", type: "button" },
                            { label: "HAKUCHOU", action: "spawn_vehicle_click", model: "hakuchou", type: "button" },
                            { label: "HAKUCHOU DRAG", action: "spawn_vehicle_click", model: "hakuchou2", type: "button" },
                            { label: "HEXER", action: "spawn_vehicle_click", model: "hexer", type: "button" },
                            { label: "INNOVATION", action: "spawn_vehicle_click", model: "innovation", type: "button" },
                            { label: "MANCHEZ", action: "spawn_vehicle_click", model: "manchez", type: "button" },
                            { label: "NEMESIS", action: "spawn_vehicle_click", model: "nemesis", type: "button" },
                            { label: "NIGHTBLADE", action: "spawn_vehicle_click", model: "nightblade", type: "button" },
                            { label: "OPPRESSOR", action: "spawn_vehicle_click", model: "oppressor", type: "button" },
                            { label: "OPPRESSOR MK2", action: "spawn_vehicle_click", model: "oppressor2", type: "button" },
                            { label: "PCJ 600", action: "spawn_vehicle_click", model: "pcj", type: "button" },
                            { label: "POWERSURGE", action: "spawn_vehicle_click", model: "powersurge", type: "button" },
                            { label: "RUFFIAN", action: "spawn_vehicle_click", model: "ruffian", type: "button" },
                            { label: "SANCHEZ", action: "spawn_vehicle_click", model: "sanchez", type: "button" },
                            { label: "SHINOBI", action: "spawn_vehicle_click", model: "shinobi", type: "button" },
                            { label: "SHOTARO", action: "spawn_vehicle_click", model: "shotaro", type: "button" },
                            { label: "SOVEREIGN", action: "spawn_vehicle_click", model: "sovereign", type: "button" },
                            { label: "VADER", action: "spawn_vehicle_click", model: "vader", type: "button" },
                            { label: "VORTEX", action: "spawn_vehicle_click", model: "vortex", type: "button" },
                            { label: "ZOMBIE CHOPPER", action: "spawn_vehicle_click", model: "zombiea", type: "button" }
                        ]
                    },
                    // --- OFF-ROAD ---
                    {
                        label: "OFF-ROAD",
                        type: "submenu",
                        items: [
                            { label: "BIFTA", action: "spawn_vehicle_click", model: "bifta", type: "button" },
                            { label: "BLAZER", action: "spawn_vehicle_click", model: "blazer", type: "button" },
                            { label: "BODHI", action: "spawn_vehicle_click", model: "bodhi2", type: "button" },
                            { label: "BRAWLER", action: "spawn_vehicle_click", model: "brawler", type: "button" },
                            { label: "CARACARA", action: "spawn_vehicle_click", model: "caracara2", type: "button" },
                            { label: "DRAUGUR", action: "spawn_vehicle_click", model: "draugur", type: "button" },
                            { label: "DUNE BUGGY", action: "spawn_vehicle_click", model: "dune", type: "button" },
                            { label: "EVERON", action: "spawn_vehicle_click", model: "everon", type: "button" },
                            { label: "FREE CRAWLER", action: "spawn_vehicle_click", model: "freecrawler", type: "button" },
                            { label: "INSURGENT", action: "spawn_vehicle_click", model: "insurgent", type: "button" },
                            { label: "KALAHARI", action: "spawn_vehicle_click", model: "kalahari", type: "button" },
                            { label: "KAMACHO", action: "spawn_vehicle_click", model: "kamacho", type: "button" },
                            { label: "MARSHALL", action: "spawn_vehicle_click", model: "marshall", type: "button" },
                            { label: "MESA (OFFROAD)", action: "spawn_vehicle_click", model: "mesa3", type: "button" },
                            { label: "MONSTROCITI", action: "spawn_vehicle_click", model: "monstrociti", type: "button" },
                            { label: "OUTLAW", action: "spawn_vehicle_click", model: "outlaw", type: "button" },
                            { label: "RANCHER XL", action: "spawn_vehicle_click", model: "rancherxl", type: "button" },
                            { label: "REBEL", action: "spawn_vehicle_click", model: "rebel2", type: "button" },
                            { label: "SANDKING XL", action: "spawn_vehicle_click", model: "sandking", type: "button" },
                            { label: "TROPHY TRUCK", action: "spawn_vehicle_click", model: "trophytruck", type: "button" },
                            { label: "VAGRANT", action: "spawn_vehicle_click", model: "vagrant", type: "button" },
                            { label: "WINKY", action: "spawn_vehicle_click", model: "winky", type: "button" },
                            { label: "ZHABA", action: "spawn_vehicle_click", model: "zhaba", type: "button" }
                        ]
                    },
                    // --- EMERGENCY ---
                    {
                        label: "EMERGENCY",
                        type: "submenu",
                        items: [
                            { label: "AMBULANCE", action: "spawn_vehicle_click", model: "ambulance", type: "button" },
                            { label: "FBI", action: "spawn_vehicle_click", model: "fbi", type: "button" },
                            { label: "FBI SUV", action: "spawn_vehicle_click", model: "fbi2", type: "button" },
                            { label: "FIRE TRUCK", action: "spawn_vehicle_click", model: "firetruk", type: "button" },
                            { label: "LIFEGUARD", action: "spawn_vehicle_click", model: "lguard", type: "button" },
                            { label: "POLICE CRUISER", action: "spawn_vehicle_click", model: "police", type: "button" },
                            { label: "POLICE BUFFALO", action: "spawn_vehicle_click", model: "police2", type: "button" },
                            { label: "POLICE INTERCEPTOR", action: "spawn_vehicle_click", model: "police3", type: "button" },
                            { label: "UNMARKED CRUISER", action: "spawn_vehicle_click", model: "police4", type: "button" },
                            { label: "POLICE GAUNTLET", action: "spawn_vehicle_click", model: "police5", type: "button" },
                            { label: "POLICE BIKE", action: "spawn_vehicle_click", model: "policeb", type: "button" },
                            { label: "POLICE RIOT", action: "spawn_vehicle_click", model: "riot", type: "button" },
                            { label: "PRISON BUS", action: "spawn_vehicle_click", model: "pbus", type: "button" },
                            { label: "PARK RANGER", action: "spawn_vehicle_click", model: "pranger", type: "button" },
                            { label: "SHERIFF CRUISER", action: "spawn_vehicle_click", model: "sheriff", type: "button" },
                            { label: "SHERIFF SUV", action: "spawn_vehicle_click", model: "sheriff2", type: "button" },
                            { label: "UNMARKED RIOT", action: "spawn_vehicle_click", model: "riot2", type: "button" }
                        ]
                    },
                    // --- HELICOPTERS ---
                    {
                        label: "HELICOPTERS",
                        type: "submenu",
                        items: [
                            { label: "AKULA", action: "spawn_vehicle_click", model: "akula", type: "button" },
                            { label: "ANNIHILATOR", action: "spawn_vehicle_click", model: "annihilator", type: "button" },
                            { label: "BUZZARD", action: "spawn_vehicle_click", model: "buzzard", type: "button" },
                            { label: "BUZZARD ATTACK", action: "spawn_vehicle_click", model: "buzzard2", type: "button" },
                            { label: "CARGOBOB", action: "spawn_vehicle_click", model: "cargobob", type: "button" },
                            { label: "CONADA", action: "spawn_vehicle_click", model: "conada", type: "button" },
                            { label: "FROGGER", action: "spawn_vehicle_click", model: "frogger", type: "button" },
                            { label: "HAVOK", action: "spawn_vehicle_click", model: "havok", type: "button" },
                            { label: "HUNTER", action: "spawn_vehicle_click", model: "hunter", type: "button" },
                            { label: "MAVERICK", action: "spawn_vehicle_click", model: "maverick", type: "button" },
                            { label: "POLICE MAVERICK", action: "spawn_vehicle_click", model: "polmav", type: "button" },
                            { label: "SAVAGE", action: "spawn_vehicle_click", model: "savage", type: "button" },
                            { label: "SEA SPARROW", action: "spawn_vehicle_click", model: "seasparrow", type: "button" },
                            { label: "SUPERVOLITO", action: "spawn_vehicle_click", model: "supervolito", type: "button" },
                            { label: "SWIFT", action: "spawn_vehicle_click", model: "swift", type: "button" },
                            { label: "VALKYRIE", action: "spawn_vehicle_click", model: "valkyrie", type: "button" },
                            { label: "VOLATUS", action: "spawn_vehicle_click", model: "volatus", type: "button" }
                        ]
                    },
                    // --- PLANES ---
                    {
                        label: "PLANES",
                        type: "submenu",
                        items: [
                            { label: "ALPHAZ1", action: "spawn_vehicle_click", model: "alphaz1", type: "button" },
                            { label: "AVENGER", action: "spawn_vehicle_click", model: "avenger", type: "button" },
                            { label: "BESRA", action: "spawn_vehicle_click", model: "besra", type: "button" },
                            { label: "CUBAN 800", action: "spawn_vehicle_click", model: "cuban800", type: "button" },
                            { label: "DODO", action: "spawn_vehicle_click", model: "dodo", type: "button" },
                            { label: "HYDRA", action: "spawn_vehicle_click", model: "hydra", type: "button" },
                            { label: "JET", action: "spawn_vehicle_click", model: "jet", type: "button" },
                            { label: "LAZER", action: "spawn_vehicle_click", model: "lazer", type: "button" },
                            { label: "LUXOR", action: "spawn_vehicle_click", model: "luxor", type: "button" },
                            { label: "LUXOR DELUXE", action: "spawn_vehicle_click", model: "luxor2", type: "button" },
                            { label: "MAMMATUS", action: "spawn_vehicle_click", model: "mammatus", type: "button" },
                            { label: "MOLOTOK", action: "spawn_vehicle_click", model: "molotok", type: "button" },
                            { label: "NIMBUS", action: "spawn_vehicle_click", model: "nimbus", type: "button" },
                            { label: "NOKOTA", action: "spawn_vehicle_click", model: "nokota", type: "button" },
                            { label: "PYRO", action: "spawn_vehicle_click", model: "pyro", type: "button" },
                            { label: "ROGUE", action: "spawn_vehicle_click", model: "rogue", type: "button" },
                            { label: "SEABREEZE", action: "spawn_vehicle_click", model: "seabreeze", type: "button" },
                            { label: "SHAMAL", action: "spawn_vehicle_click", model: "shamal", type: "button" },
                            { label: "STARLING", action: "spawn_vehicle_click", model: "starling", type: "button" },
                            { label: "STUNT", action: "spawn_vehicle_click", model: "stunt", type: "button" },
                            { label: "TITAN", action: "spawn_vehicle_click", model: "titan", type: "button" },
                            { label: "TULA", action: "spawn_vehicle_click", model: "tula", type: "button" },
                            { label: "VELUM", action: "spawn_vehicle_click", model: "velum", type: "button" },
                            { label: "VOLATOL", action: "spawn_vehicle_click", model: "volatol", type: "button" },
                            { label: "RO-86 ALKONOST", action: "spawn_vehicle_click", model: "alkonost", type: "button" }
                        ]
                    },
                    // --- BOATS ---
                    {
                        label: "BOATS",
                        type: "submenu",
                        items: [
                            { label: "DINGHY", action: "spawn_vehicle_click", model: "dinghy", type: "button" },
                            { label: "JETMAX", action: "spawn_vehicle_click", model: "jetmax", type: "button" },
                            { label: "MARQUIS", action: "spawn_vehicle_click", model: "marquis", type: "button" },
                            { label: "SEASHARK", action: "spawn_vehicle_click", model: "seashark", type: "button" },
                            { label: "SPEEDER", action: "spawn_vehicle_click", model: "speeder", type: "button" },
                            { label: "SQUALO", action: "spawn_vehicle_click", model: "squalo", type: "button" },
                            { label: "SUBMERSIBLE", action: "spawn_vehicle_click", model: "submersible", type: "button" },
                            { label: "TORO", action: "spawn_vehicle_click", model: "toro", type: "button" },
                            { label: "TROPIC", action: "spawn_vehicle_click", model: "tropic", type: "button" },
                            { label: "TUG", action: "spawn_vehicle_click", model: "tug", type: "button" },
                            { label: "YACHT (SCRIPTED)", action: "spawn_vehicle_click", model: "yacht", type: "button" }
                        ]
                    },
                    // --- COMMERCIAL / INDUSTRIAL ---
                    {
                        label: "COMMERCIAL & INDUSTRIAL",
                        type: "submenu",
                        items: [
                            { label: "BENSON", action: "spawn_vehicle_click", model: "benson", type: "button" },
                            { label: "BIFF", action: "spawn_vehicle_click", model: "biff", type: "button" },
                            { label: "BOXVILLE", action: "spawn_vehicle_click", model: "boxville", type: "button" },
                            { label: "BULLDOZER", action: "spawn_vehicle_click", model: "bulldozer", type: "button" },
                            { label: "CAMPER", action: "spawn_vehicle_click", model: "camper", type: "button" },
                            { label: "FLATBED", action: "spawn_vehicle_click", model: "flatbed", type: "button" },
                            { label: "HANDLER", action: "spawn_vehicle_click", model: "handler", type: "button" },
                            { label: "HAULER", action: "spawn_vehicle_click", model: "hauler", type: "button" },
                            { label: "MULE", action: "spawn_vehicle_click", model: "mule", type: "button" },
                            { label: "PACKER", action: "spawn_vehicle_click", model: "packer", type: "button" },
                            { label: "PHANTOM", action: "spawn_vehicle_click", model: "phantom", type: "button" },
                            { label: "POUNDER", action: "spawn_vehicle_click", model: "pounder", type: "button" },
                            { label: "STOCKADE", action: "spawn_vehicle_click", model: "stockade", type: "button" },
                            { label: "TACO VAN", action: "spawn_vehicle_click", model: "taco", type: "button" },
                            { label: "TRASHMASTER", action: "spawn_vehicle_click", model: "trash", type: "button" }
                        ]
                    },
                    // --- CYCLES ---
                    {
                        label: "CYCLES",
                        type: "submenu",
                        items: [
                            { label: "BMX", action: "spawn_vehicle_click", model: "bmx", type: "button" },
                            { label: "CRUISER", action: "spawn_vehicle_click", model: "cruiser", type: "button" },
                            { label: "FIXTER", action: "spawn_vehicle_click", model: "fixter", type: "button" },
                            { label: "SCORCHER", action: "spawn_vehicle_click", model: "scorcher", type: "button" },
                            { label: "TRI-CYCLE", action: "spawn_vehicle_click", model: "tribike", type: "button" },
                            { label: "INDUCTOR", action: "spawn_vehicle_click", model: "inductor", type: "button" },
                            { label: "JUNK ENERGY INDUCTOR", action: "spawn_vehicle_click", model: "inductor2", type: "button" },
                        ]
                    }
                ]
            },
            { label: "🛡️ VEHICLE GODMODE", action: "vehicle_godmode", type: "toggle"},
            { label: "🛠️✨ REPAIR & CLEAN", action: "fix_vehicle", type: "button" },
            { label: "🏁 FULL AUTOTUNE (MAX)", action: "full_tune", type: "button"},
            { label: "💎 NUI CUSTOMS (TUNER)", action: "open_nui_customs", type: "button" },
            { label: "🗑️ DELETE VEHICLE", action: "del_vehicle", type: "button" },
            { label: "🚀 SPEED BOOST (50x)", action: "speed_boost", type: "toggle", state: false },
            { label: "🌈 RAINBOW PAINT", action: "rainbow_paint", type: "toggle", state: false },
            { 
                label: "🔑 OWNERSHIP", 
                type: "submenu", 
                items: [
                    { label: "🏷️ CLAIM THIS VEHICLE", action: "claim_vehicle", type: "button" } 
                ] 
            }
        ]
    },
    world: {
        label: "🌍WORLD OPTIONS",
        items: [
            {
                label: "🕒 SET TIME",
                type: "submenu",
                items: [
                    { label: "🌑 00:00", action: "time_00", type: "button" },
                    { label: "🌑 01:00", action: "time_01", type: "button" },
                    { label: "🌑 02:00", action: "time_02", type: "button" },
                    { label: "🌑 03:00", action: "time_03", type: "button" },
                    { label: "🌌 04:00", action: "time_04", type: "button" },
                    { label: "🌌 05:00", action: "time_05", type: "button" },
                    { label: "🌅 06:00", action: "time_06", type: "button" },
                    { label: "🌅 07:00", action: "time_07", type: "button" },
                    { label: "🌤️ 08:00", action: "time_08", type: "button" },
                    { label: "🌤️ 09:00", action: "time_09", type: "button" },
                    { label: "🌤️ 10:00", action: "time_10", type: "button" },
                    { label: "🌤️ 11:00", action: "time_11", type: "button" },
                    { label: "☀️ 12:00", action: "time_12", type: "button" },
                    { label: "☀️ 13:00", action: "time_13", type: "button" },
                    { label: "🌞 14:00", action: "time_14", type: "button" },
                    { label: "🌞 15:00", action: "time_15", type: "button" },
                    { label: "🌞 16:00", action: "time_16", type: "button" },
                    { label: "🌇 17:00", action: "time_17", type: "button" },
                    { label: "🌇 18:00", action: "time_18", type: "button" },
                    { label: "🌆 19:00", action: "time_19", type: "button" },
                    { label: "🌆 20:00", action: "time_20", type: "button" },
                    { label: "🌙 21:00", action: "time_21", type: "button" },
                    { label: "🌙 22:00", action: "time_22", type: "button" },
                    { label: "🌙 23:00", action: "time_23", type: "button" }
                ]
            },
            {
                label: "🌦️ SET WEATHER",
                type: "submenu",
                items: [
                    { label: "☀️ EXTRASUNNY", action: "weather_extrasunny", type: "button", },
                    { label: "☀️ CLEAR", action: "weather_clear", type: "button", },
                    { label: "☀️ NEUTRAL", action: "weather_neutral", type: "button", },
                    { label: "🌁 SMOG", action: "weather_smog", type: "button", },
                    { label: "🌫️ FOGGY", action: "weather_foggy", type: "button", },
                    { label: "⛅ OVERCAST", action: "weather_overcast", type: "button", },
                    { label: "☁️ CLOUDS", action: "weather_clouds", type: "button", },
                    { label: "🌤️ CLEARING", action: "weather_clearing", type: "button", },
                    { label: "☂️ RAIN", action: "weather_rain", type: "button", },
                    { label: "⛈️ THUNDER", action: "weather_thunder", type: "button", },
                    { label: "❄️ SNOW", action: "weather_snow", type: "button", },
                    { label: "🌨️ BLIZZARD", action: "weather_blizzed", type: "button", },
                    { label: "❄️ SNOWLIGHT", action: "weather_light_snow", type: "button", },
                    { label: "🌨️ XMAS", action: "weather_heavy_snow", type: "button", },
                    { label: "🎃 HALLOWEEN", action: "weather_halloween", type: "button", },
                ]
            },            
            { label: "🌑 BLACKOUT", action: "blackout", type: "toggle", state: false },
            { label: "🚶‍♂️❌ CLEAR AREA (PEDS)", action: "clear_peds", type: "button" },
            { label: "🚗❌ CLEAR AREA (CARS)", action: "clear_cars", type: "button" },
        ]
    },
    teleport: {
        label: "📍TELEPORT",
        items: [
            { label: "📌 TP TO MARKER", action: "tp_marker", type: "button" },
            { label: "🏛️ TP TO LEGION", action: "tp_legion", type: "button" },
            { label: "🚓 TP TO PD", action: "tp_pd", type: "button" },
            { label: "🏥 TP TO HOSPITAL", action: "tp_hospital", type: "button" },
            { label: "🏔️ TP TO MT CHILIAD", action: "tp_chiliad", type: "button" }
        ]
    },
    dev: {
        label: "🛠️DEVELOPER TOOLS",
        items: [
            { label: "📋 COPY VECTOR3", action: "copy_vector3", type: "button" },
            { label: "📋 COPY VECTOR4", action: "copy_vector4", type: "button" },
            { label: "🧭 COPY HEADING", action: "copy_heading", type: "button" },
            { label: "📐 DISPLAY COORDS", action: "display_coords", type: "toggle", state: false },
            { label: "🔍 ENTITY INSPECTOR", action: "entity_view_mode", type: "toggle", state: false },
            { label: "🔴 DELETE LASER", action: "dev_delete_laser", type: "toggle", state: false }
        ]
    },
    server: {
        label: "🛡️SERVER ADMINISTRATION",
        items: [
            { 
                label: "📢 SERVER ANNOUNCEMENT", 
                action: "open_announce_menu",
                type: "button" 
            },
            { 
                label: "BAN LIST", 
                type: "submenu", 
                action: "req_banlist",
                items: [] 
            },
        ]
    },
    settings: {
        label: "⚙️SETTINGS",
        items: [
            {
                label: "🎨 UI THEMES",
                type: "submenu",
                items: [
                    { label: "🔴 NUI LABS RED (DEFAULT)", action: "set_theme", type: "button", theme: "default" },
                    { label: "🔵 NUI LABS CYAN", action: "set_theme", type: "button", theme: "blue" },
                    { label: "🟢 TOXIC GREEN", action: "set_theme", type: "button", theme: "green" },
                    { label: "🟣 ROYAL PURPLE", action: "set_theme", type: "button", theme: "purple" },
                    { label: "🟠 SUNSET ORANGE", action: "set_theme", type: "button", theme: "orange" },
                    { label: "💻 MATRIX MODE", action: "set_theme", type: "button", theme: "matrix" }
                ]
            },
            {
                label: "📐 UI SIZE / SCALE",
                type: "submenu",
                items: [
                    { label: "🔽 SMALL (80%)", action: "set_scale", type: "button", scale: "80" },
                    { label: "🔹 NORMAL (100%)", action: "set_scale", type: "button", scale: "100" },
                    { label: "🔼 LARGE (110%)", action: "set_scale", type: "button", scale: "110" }
                ]
            },
            { label: "🔊 SOUND EFFECTS", action: "toggle_sounds", type: "toggle", state: true },
            
            { label: "💾 KEEP SETTINGS ON RELOG", action: "save_all_settings", type: "button" },
            { label: "⚠️ FACTORY RESET MENU", action: "factory_reset", type: "button", needsConfirm: true }
        ]
    }
};