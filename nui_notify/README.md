# NUI LABS - Advanced Notification System (V1.0)

Welcome to **NUI LABS**. This resource provides a high-performance, standalone notification system designed to replace the default GTA/Framework notifications with a modern, animated, and sound-supported UI.

## 🌟 Features

- **10 Unique Themes** (Industrial, Cyber, Glass, Retro, Social, and more).
- **Framework Integration**: Auto-replaces `ESX` and `QB-Core` notifications instantly.
- **Fully Responsive**: Works on 1080p, 1440p, and 4K monitors (Scaling configurable).
- **Sound Design**: Custom sound cues for different notification types.
- **Positioning**: Optimized "Center-Left" positioning for best visibility while driving.
- **Optimized**: 0.00ms resmon idle.

## 📦 Installation

1.  Download the resource and drop the `nuilabs_notify` folder into your `resources` directory.
2.  Add `ensure nuilabs_notify` to your `server.cfg`.
3.  **IMPORTANT:** If you use ESX or QB-Core, please **disable/stop** your default notification resources (e.g., `esx_notify`, `qb-notify`, `mythic_notify`) to avoid duplicate messages.

## ⚙️ Configuration (`config.lua`)

You can customize almost everything in the config file:

- `Config.FrameworkIntegration`: Set to `true` to automatically hook into ESX/QB events.
- `Config.DefaultTheme`: Choose the look of your server (e.g., `'industrial'`, `'glass'`, `'cyber'`).
- `Config.UIScale`: Adjust size (e.g., `1.2` for larger UI, `0.8` for smaller).
- `Config.Position`: Currently locked to `center-left` for design consistency.

## 💻 Developer Guide (Exports & Events)

You can use this system in your own scripts using Exports (Client-Side) or Events (Server-Side).

### 1. Client-Side Export

The most performant way to trigger a notification.

```lua
exports.nuilabs_notify:Notify({
    type = 'success', -- Options: success, error, info, warning, police, ambulance, nuilabs, team
    title = 'Mission Complete', -- Optional Title
    message = 'You have successfully delivered the package.',
    duration = 5000, -- Duration in ms
    theme = 'industrial' -- Optional: Override default theme for this specific notify
})
```
