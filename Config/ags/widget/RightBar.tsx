import { App, Astal, Gdk, Gtk } from "astal/gtk3"
import { bind, Variable, execAsync } from "astal"
import Wp from "gi://AstalWp"
import Tray from "gi://AstalTray"
import Hyprland from "gi://AstalHyprland"

const css = `
    .RightBarWindow { background: transparent; }
    .right-bar-card {
        background-color: rgba(17, 17, 27, 0.75);
        border: 1px solid rgba(137, 180, 250, 0.2);
        border-radius: 20px;
        padding: 4px 20px;
    }
    .cpu-label { color: #f38ba8; font-weight: bold; }
    .memory-btn { color: #fab387; font-weight: bold; background: transparent; border: none; padding: 0; box-shadow: none; }
    .audio-btn { 
        color: #a6e3a1; background: transparent; border: none; box-shadow: none; padding: 0 4px; font-weight: bold; 
    }
    .audio-btn:hover { background-color: rgba(166, 227, 161, 0.15); border-radius: 6px; }
    .lang-label { color: #cba6f7; font-weight: bold; }
    .net-label { color: #94e2d5; font-weight: bold; }

    .embedded-slider { min-height: 0; padding: 0; margin: 0; }
    .embedded-slider trough {
        min-height: 4px; border-radius: 2px; background-color: rgba(255, 255, 255, 0.15);
    }
    .embedded-slider highlight {
        min-height: 4px; background-image: linear-gradient(90deg, #94e2d5, #a6e3a1);
    }
    .embedded-slider slider {
        min-width: 8px; min-height: 8px; background-color: #a6e3a1; border-radius: 50%; margin: -2px;
    }

    .lang-btn {
        background: transparent;
        border: none;
        padding: 0 4px;
        box-shadow: none;
    }
    .lang-btn:hover {
        background-color: rgba(203, 166, 247, 0.15);
        border-radius: 6px;
    }
    
    .tray-item { background: transparent; border: none; padding: 0 4px; }
    .tray-item icon { min-width: 16px; min-height: 16px; }
`

const provider = new Gtk.CssProvider()
provider.load_from_data(css)
Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default()!, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)

export default function RightBar(monitor: Gdk.Monitor) {
    const audio = Wp.get_default()?.audio
    const speaker = audio?.default_speaker
    const tray = Tray.get_default()
    const hyprland = Hyprland.get_default()

    const showSlider = Variable(false)

    const cpu = Variable("0").poll(10000, ["bash", "-c", "top -bn1 | grep 'Cpu(s)' | awk '{print int(100 - $8)}'"])

    const memAlt = Variable(false)
    const memGigs = Variable("0/0G").poll(30000, ["bash", "-c", "free -m | awk '/Mem:/ {printf \"%.1fG/%.1fG\", $3/1024, $2/1024}'"])
    const memPercent = Variable("0%").poll(30000, ["bash", "-c", "free -m | awk '/Mem:/ {printf \"%.0f%%\", $3/$2*100}'"])
    const memLabel = Variable.derive(
        [bind(memAlt), bind(memGigs), bind(memPercent)],
        (alt, gigs, percent) => alt ? `   ${percent}` : `   ${gigs}`
    )

    const net = Variable("Disconnected").poll(5000, ["bash", "-c", "ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || echo 'Disconnected'"])
    
    const lang = Variable("EN")

    // Надежное получение текущей раскладки через JSON
    const updateLang = async () => {
        try {
            const out = await execAsync(["hyprctl", "devices", "-j"])
            const devices = JSON.parse(out)
            const keyboards = devices.keyboards || []
            // Находим основную клавиатуру (main: true) или берем первую попавшуюся
            const keyboard = keyboards.find((kb: any) => kb.main) || keyboards[0]
            
            if (keyboard?.active_keymap) {
                // Берем первые 2 символа и переводим в верхний регистр 
                // (например: "Russian" -> "RU", "ru" -> "RU", "English (US)" -> "EN")
                const langCode = keyboard.active_keymap.substring(0, 2).toUpperCase()
                lang.set(langCode)
            } else {
                lang.set("EN")
            }
        } catch (err) {
            console.error("Failed to update lang:", err)
            lang.set("EN")
        }
    }

    // Надежное переключение раскладки на конкретной основной клавиатуре
    const switchLayout = async () => {
        try {
            const out = await execAsync(["hyprctl", "devices", "-j"])
            const devices = JSON.parse(out)
            const keyboards = devices.keyboards || []
            const keyboard = keyboards.find((kb: any) => kb.main) || keyboards[0]
            
            if (keyboard?.name) {
                // Переключаем раскладку конкретно на основной клавиатуре (надежнее, чем "all")
                await execAsync(["hyprctl", "switchxkblayout", keyboard.name, "next"])
                // Небольшая задержка, чтобы Hyprland успел обновить внутреннее состояние перед чтением
                setTimeout(() => updateLang(), 50)
            }
        } catch (err) {
            console.error("Failed to switch layout:", err)
        }
    }

    updateLang()
    // Используем стрелочную функцию, чтобы избежать проблем с передачей аргументов события
    hyprland.connect("keyboard-layout", () => updateLang())

    return (
        <window
            name="right_bar"
            className="RightBarWindow"
            gdkmonitor={monitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            marginTop={3} 
            css="background-color: transparent;"
        >
            <box halign={Gtk.Align.END} marginRight={10}>
                <box className="right-bar-card" spacing={12} valignment={Gtk.Align.CENTER}>
                    
                    <label className="cpu-label" label={bind(cpu).as(v => `  ${v}%`)} />

                    <button className="memory-btn" onClicked={() => memAlt.set(!memAlt.get())}>
                        <label label={bind(memLabel)} />
                    </button>

                    <box spacing={6} valignment={Gtk.Align.CENTER}>
                        <eventbox onScrollEvent={(self, event) => {
                            if (!speaker) return
                            const [hasDirection, dir] = event.get_scroll_direction()

                            if (hasDirection && dir !== Gdk.ScrollDirection.SMOOTH) {
                                if (dir === Gdk.ScrollDirection.UP) {
                                    speaker.volume = Math.min(1, speaker.volume + 0.05)
                                } else if (dir === Gdk.ScrollDirection.DOWN) {
                                    speaker.volume = Math.max(0, speaker.volume - 0.05)
                                }
                            } else {
                                const [, , dy] = event.get_scroll_deltas()
                                if (dy < 0) {
                                    speaker.volume = Math.min(1, speaker.volume + 0.05)
                                } else if (dy > 0) {
                                    speaker.volume = Math.max(0, speaker.volume - 0.05)
                                }
                            }
                            return true
                        }}>
                            <button 
                                className="audio-btn" 
                                onClicked={() => showSlider.set(!showSlider.get())}
                            >
                                <label label={speaker ? bind(speaker, "volume").as(v => {
                                    const vol = Math.round(v * 100)
                                    if (speaker.mute || vol === 0) return "   Muted"
                                    const icon = vol > 50 ? " " : vol > 20 ? " " : " "
                                    return `${icon} ${vol}%`
                                }) : "   Muted"} />
                            </button>
                        </eventbox>
                        
                        <box visible={bind(showSlider)} valignment={Gtk.Align.CENTER}>
                            {speaker && (
                                <slider
                                    className="embedded-slider" 
                                    widthRequest={80}
                                    valignment={Gtk.Align.CENTER}
                                    value={bind(speaker, "volume")}
                                    onDragged={({ value }) => { speaker.volume = value }}
                                />
                            )}
                        </box>
                    </box>

                    <button
                        className="lang-btn"
                        onClicked={switchLayout}
                    >
                        <label className="lang-label" label={bind(lang).as(v => `󰌌  ${v}`)} />
                    </button>
                    
                    <label className="net-label" label={bind(net).as(v => v === 'Disconnected' ? `󰖪  ${v}` : `󰈀  ${v}`)} />

                    {tray && (
                        <box className="tray-box" spacing={4} valignment={Gtk.Align.CENTER}>
                            {bind(tray, "items").as(items =>
                                items
                                    .filter(item => item.gicon)
                                    .map(item => (
                                        <eventbox
                                            className="tray-item"
                                            tooltipMarkup={bind(item, "tooltipMarkup")}
                                            onButtonPressEvent={(self, event) => {
                                                const [, button] = event.get_button()
                                                if (button === 1) {
                                                    item.activate(0, 0)
                                                } else if (button === 3 && item.menuModel) {
                                                    const menu = Gtk.Menu.new_from_model(item.menuModel)
                                                    menu.insert_action_group("dbusmenu", item.actionGroup)
                                                    menu.attach_to_widget(self, null)
                                                    menu.popup_at_pointer(event)
                                                }
                                            }}
                                        >
                                            <icon gicon={bind(item, "gicon")} widthRequest={16} heightRequest={16} />
                                        </eventbox>
                                    ))
                            )}
                        </box>
                    )}
                </box>
            </box>
        </window>
    )
}