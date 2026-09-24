import { Variable, bind, exec, subprocess, execAsync } from "astal"
import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import Hyprland from "gi://AstalHyprland" 
import GLib from "gi://GLib"

const powerOpen = Variable(false)
const eqOpen = Variable(false)

const closeAll = () => {
    powerOpen.set(false)
    eqOpen.set(false)
}

// Динамический CSS для бара с правильными скруглениями и плавным переходом
const barCss = Variable.derive([powerOpen, eqOpen], (p, e) => {
    // Левая панель открыта: нижний левый угол прямой (0)
    // Правая панель открыта: нижний правый угол прямой (0)
    const bottomLeft = p ? "0" : "16px"
    const bottomRight = e ? "0" : "16px"
    
    return `
        background-color: rgba(26, 27, 38, 0.85);
        border: 1px solid rgba(122, 162, 247, 0.2);
        border-radius: 16px 16px ${bottomRight} ${bottomLeft};
        padding: 5px 14px;
        font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif;
        font-size: 13px;
        font-weight: bold;
        transition: border-radius 0.2s ease-in-out;
    `
})

const currentTrack = Variable("Ожидание музыки...").poll(1000, () => {
    try {
        const res = exec("playerctl -a metadata --format '{{artist}} - {{title}}' 2>/dev/null")
        const line = res ? res.split('\n')[0] : ""
        if (line && line.trim() !== "") return line
    } catch {}
    return "Системный аудиопоток"
})

const isPlaying = Variable(false).poll(1000, () => {
    try {
        const status = exec("playerctl status 2>/dev/null")
        return status.trim() === "Playing"
    } catch {}
    return false
})

const eqHeights = Variable([3, 3, 3, 3, 3, 3])
const configPath = GLib.build_filenamev([GLib.get_home_dir(), ".config", "ags", "cava_config"])

subprocess(`cava -p ${configPath}`, (out) => {
    if (!out) return
    const values = out.trim().split(/[\s;]+/).map(Number)
    if (values.length >= 6 && !values.some(isNaN)) {
        eqHeights.set(values.slice(0, 6).map(v => Math.min(14, Math.max(3, v * 0.25))))
    }
})

export function LeftModulesBar() {
    const hypr = Hyprland.get_default()
    const colors = ['#89b4fa', '#cba6f7', '#89dceb', '#a6e3a1', '#f38ba8', '#f9e2af']

    return (
        <window
            name="top_left_bar"
            application={App}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            exclusivity={Astal.Exclusivity.IGNORE}
            layer={Astal.Layer.TOP}
            marginLeft={65}
            marginTop={3}
            css="background-color: transparent;"
        >
            <box vertical={true} halign={Gtk.Align.START} valign={Gtk.Align.START}>
                
                {/* ОСНОВНОЙ БАР */}
                <box 
                    vertical={false}
                    css={bind(barCss)}
                    spacing={8}
                    valign={Gtk.Align.CENTER}
                >
                    <button
                        css="color: #cdd6f4; padding: 0px 6px; font-size: 16px; background-color: transparent; border: none; border-radius: 4px; min-height: 0;"
                        onClicked={() => {
                            const current = powerOpen.get()
                            closeAll()
                            powerOpen.set(!current)
                        }}
                    >
                        <label label="󱄅" />
                    </button>
                    
                    <box css="background-color: rgba(255, 255, 255, 0.15); min-width: 1px; margin: 4px 4px;" />

                    <box vertical={false} spacing={2} valign={Gtk.Align.CENTER}>
                        {bind(hypr, "workspaces").as(wss =>
                            wss
                                .filter(ws => ws.id > 0)
                                .sort((a, b) => a.id - b.id)
                                .map(ws => (
                                    <button
                                        css={bind(hypr, "focusedWorkspace").as(fw =>
                                            fw === ws 
                                                ? "font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif; font-weight: bold; font-size: 13px; background-color: #89b4fa; color: #11111b; border-radius: 8px; padding: 0px 8px; border: none; min-height: 0;" 
                                                : "font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif; font-weight: bold; font-size: 13px; background-color: transparent; color: #cdd6f4; border-radius: 8px; padding: 0px 8px; border: none; min-height: 0;"
                                        )}
                                        onClicked={() => ws.focus()}
                                    >
                                        <label label={String(ws.id)} />
                                    </button>
                                ))
                        )}
                    </box>

                    <box vertical={false} spacing={6} css="margin-left: 6px; padding-right: 4px;" visible={bind(hypr, "focusedClient").as(c => c !== null)} valign={Gtk.Align.CENTER}>
                        <label label="❯" css="font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif; font-weight: bold; font-size: 11px; color: #6c7086;" />
                        {bind(hypr, "focusedClient").as(client => {
                            if (!client) return <label label="" />;
                            return (
                                <label
                                    label={bind(client, "title").as(title => {
                                        const text = title || client.class || "";
                                        return text.length > 30 ? text.substring(0, 25) + "…" : text;
                                    })}
                                    css="font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif; font-weight: bold; font-size: 13px; color: #b4befe;"
                                />
                            );
                        })}
                    </box>

                    <box css="background-color: rgba(255, 255, 255, 0.15); min-width: 1px; margin: 4px 6px;" />
                    
                    <box vertical={false} spacing={8} valign={Gtk.Align.CENTER}>
                        <button 
                            css="background: transparent; border: none; padding: 0; min-height: 0; min-width: 0;"
                            tooltipText="Информация о треке"
                            onClicked={() => {
                                const current = eqOpen.get()
                                closeAll()
                                eqOpen.set(!current)
                            }}
                        >
                            <box vertical={false} spacing={3} valign={Gtk.Align.CENTER} css="min-height: 14px;">
                                {bind(eqHeights).as(h => h.map((val, i) => (
                                    <box 
                                        widthRequest={4} 
                                        heightRequest={val} 
                                        valign={Gtk.Align.CENTER} 
                                        css={`background-color: ${colors[i]}; border-radius: 2px;`} 
                                    />
                                )))}
                            </box>
                        </button>

                        <box vertical={false} spacing={4} valign={Gtk.Align.CENTER}>
                            <button css="background: transparent; border: none; padding: 0 4px; min-height: 0;" onClicked={() => execAsync("playerctl previous").catch(() => {})}>
                                <label label="󰒮" css="font-size: 14px; color: #89b4fa;" />
                            </button>
                            <button css="background: transparent; border: none; padding: 0 4px; min-height: 0;" onClicked={() => execAsync("playerctl play-pause").catch(() => {})}>
                                <label label={bind(isPlaying).as(p => p ? "󰏤" : "󰐊")} css="font-size: 14px; color: #cba6f7;" />
                            </button>
                            <button css="background: transparent; border: none; padding: 0 4px; min-height: 0;" onClicked={() => execAsync("playerctl next").catch(() => {})}>
                                <label label="󰒭" css="font-size: 14px; color: #89b4fa;" />
                            </button>
                        </box>
                    </box>
                </box>

                {/* КОНТЕЙНЕР ПАНЕЛЕК */}
                <box vertical={false} css="min-height: 0; margin-top: -1px;">
                    
                    {/* ПАНЕЛЬ ПИТАНИЯ - СЛЕВА (с вогнутым углом справа) */}
                    <revealer
                        revealChild={bind(powerOpen)}
                        transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
                        transitionDuration={200}
                        halign={Gtk.Align.START}
                    >
                        <box vertical={false}>
                            {/* Сама панель питания */}
                            <box 
                                vertical={true} 
                                spacing={4}
                                css={`
                                    background-color: rgba(26, 27, 38, 0.85);
                                    border: 1px solid rgba(122, 162, 247, 0.2);
                                    border-top: none;
                                    border-radius: 0 0 16px 16px;
                                    padding: 6px;
                                    min-width: 40px;
                                `}
                            >
                                <button css="background-color: transparent; border-radius: 8px; padding: 6px; border: none; color: #f38ba8; min-height: 0;" onClicked={() => { exec("systemctl poweroff"); closeAll(); }} tooltipText="Выключение">
                                    <icon icon="system-shutdown-symbolic" size={14} />
                                </button>
                                <button css="background-color: transparent; border-radius: 8px; padding: 6px; border: none; color: #f9e2af; min-height: 0;" onClicked={() => { exec("systemctl reboot"); closeAll(); }} tooltipText="Перезапуск">
                                    <icon icon="system-reboot-symbolic" size={14} />
                                </button>
                                <button css="background-color: transparent; border-radius: 8px; padding: 6px; border: none; color: #cba6f7; min-height: 0;" onClicked={() => { exec("systemctl suspend"); closeAll(); }} tooltipText="Спящий режим">
                                    <icon icon="system-suspend-symbolic" size={14} />
                                </button>
                            </box>

                            {/* Изогнутый угол для соединения (справа от панели) */}
                            <box 
                                valign={Gtk.Align.START}
                                css={`
                                    min-width: 16px;
                                    min-height: 16px;
                                    margin-left: -1px; /* Перекрывает границу панели */
                                    background-image: radial-gradient(circle at 100% 100%, transparent 15px, rgba(122, 162, 247, 0.2) 15px, rgba(122, 162, 247, 0.2) 16px, rgba(26, 27, 38, 0.85) 16px);
                                `}
                            />
                        </box>
                    </revealer>

                    <box hexpand={true} />

                    {/* ПАНЕЛЬ ТРЕКА - СПРАВА (с вогнутым углом слева) */}
                    <revealer
                        revealChild={bind(eqOpen)}
                        transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
                        transitionDuration={200}
                        halign={Gtk.Align.END}
                    >
                        <box vertical={false}>
                            {/* Изогнутый угол для соединения (слева от панели) */}
                            <box 
                                valign={Gtk.Align.START}
                                css={`
                                    min-width: 16px;
                                    min-height: 16px;
                                    margin-right: -1px; /* Перекрывает границу панели */
                                    background-image: radial-gradient(circle at 0% 100%, transparent 15px, rgba(122, 162, 247, 0.2) 15px, rgba(122, 162, 247, 0.2) 16px, rgba(26, 27, 38, 0.85) 16px);
                                `}
                            />
                            
                            {/* Сама панель EQ */}
                            <box 
                                vertical={true}
                                css={`
                                    background-color: rgba(26, 27, 38, 0.85);
                                    border: 1px solid rgba(122, 162, 247, 0.2);
                                    border-top: none;
                                    border-radius: 0 0 16px 16px;
                                    padding: 8px 12px;
                                    min-width: 160px;
                                `}
                            >
                                <label 
                                    label={bind(currentTrack)} 
                                    halign={Gtk.Align.CENTER} 
                                    truncate={true}
                                    maxWidthChars={120}
                                    css="color: #89b4fa; font-weight: bold; font-size: 13px;" 
                                />
                            </box>
                        </box>
                    </revealer>

                </box>
            </box>
        </window>
    )
}