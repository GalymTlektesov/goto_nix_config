import { Variable, bind, exec, subprocess, execAsync } from "astal"
import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import Hyprland from "gi://AstalHyprland" 
import GLib from "gi://GLib"

export const powerMenuVisible = Variable(false)

const isPlaying = Variable(false).poll(1000, () => {
    try {
        const status = exec("playerctl status 2>/dev/null")
        return status.trim() === "Playing"
    } catch {}
    return false
})

// Стандартная высота в простое
const eqHeights = Variable([3, 3, 3, 3, 3, 3])
const configPath = GLib.build_filenamev([GLib.get_home_dir(), ".config", "ags", "cava_config"])

// Запуск CAVA (теперь мы масштабируем значения)
subprocess(`cava -p ${configPath}`, (out) => {
    if (!out) return
    const values = out.trim().split(/[\s;]+/).map(Number)
    if (values.length >= 6 && !values.some(isNaN)) {
        // Умножаем v на 0.25, чтобы сжать столбик пропорционально, а не просто срезать верхушку. 
        // Если эквалайзер будет слишком низким, увеличьте 0.25 (например, до 0.4).
        eqHeights.set(values.slice(0, 6).map(v => Math.min(16, Math.max(3, v * 0.25))))
    }
})

export function LeftModulesBar() {
    const hypr = Hyprland.get_default()

    return (
        <window
            name="top_left_bar"
            application={App}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            exclusivity={Astal.Exclusivity.IGNORE}
            layer={Astal.Layer.TOP}
            marginLeft={65}
            css="background-color: transparent;"
        >
            <box vertical={true} halign={Gtk.Align.START} valign={Gtk.Align.START}>
                
                {/* 1. ОСНОВНАЯ ПАНЕЛЬ */}
                <box 
                    vertical={false}
                    css={bind(powerMenuVisible).as(v => `
                        background-color: rgba(17, 17, 27, 0.75);
                        border: 1px solid rgba(137, 180, 250, 0.2); 
                        border-radius: ${v ? "12px 12px 12px 0" : "12px"}; 
                        border-bottom-color: ${v ? "transparent" : "rgba(137, 180, 250, 0.2)"};
                        padding: 2px 10px; 
                        margin-top: 5px; 
                        min-height: 0;
                        font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif;
                        font-size: 13px;
                        font-weight: bold;
                    `)}
                    spacing={2}
                    valign={Gtk.Align.START}
                >
                    <button
                        css={`
                            color: #cdd6f4;
                            padding: 0px 6px;
                            font-size: 18px;
                            background-color: transparent;
                            border: none;
                            border-radius: 4px;
                            min-height: 0;
                        `}
                        onClicked={() => powerMenuVisible.set(!powerMenuVisible.get())}
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

                    <box
                        vertical={false}
                        spacing={6}
                        css="margin-left: 6px; padding-right: 4px;"
                        visible={bind(hypr, "focusedClient").as(c => c !== null)}
                        valign={Gtk.Align.CENTER}
                    >
                        <label 
                            label="❯" 
                            css="font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif; font-weight: bold; font-size: 11px; color: #6c7086;" 
                        />
                        {bind(hypr, "focusedClient").as(client => {
                            if (!client) return <label label="" />;
                            
                            return (
                                <label
                                    label={bind(client, "title").as(title => {
                                        const text = title || client.class || "";
                                        return text.length > 30 ? text.substring(0, 30) + "…" : text;
                                    })}
                                    css="font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif; font-weight: bold; font-size: 13px; color: #b4befe;"
                                />
                            );
                        })}
                    </box>

                    {/* --- ОБНОВЛЕННЫЙ МЕДИАПЛЕЕР И ЭКВАЛАЙЗЕР --- */}
                    <box css="background-color: rgba(255, 255, 255, 0.15); min-width: 1px; margin: 4px 6px;" />
                    
                    <box 
                        vertical={false} 
                        spacing={8} 
                        valign={Gtk.Align.CENTER}
                    >
                        {/* Компактный горизонтальный эквалайзер */}
                        <box vertical={false} spacing={3} valign={Gtk.Align.CENTER} css="margin: 0 4px;">
                            {bind(eqHeights).as(h => h.map((val, i) => {
                                const colors = ['#89b4fa', '#cba6f7', '#89dceb', '#a6e3a1', '#f38ba8', '#f9e2af'];
                                return (
                                    <box 
                                        widthRequest={4} 
                                        heightRequest={val} 
                                        valign={Gtk.Align.CENTER} 
                                        css={`background-color: ${colors[i]}; border-radius: 2px;`} 
                                    />
                                );
                            }))}
                        </box>

                        {/* Кнопки управления */}
                        <box vertical={false} spacing={4} valign={Gtk.Align.CENTER}>
                            <button 
                                css="background: transparent; border: none; padding: 0 4px; min-height: 0;"
                                onClicked={() => execAsync("playerctl previous").catch(() => {})}
                            >
                                <label label="󰒮" css="font-size: 14px; color: #89b4fa;" />
                            </button>
                            <button 
                                css="background: transparent; border: none; padding: 0 4px; min-height: 0;"
                                onClicked={() => execAsync("playerctl play-pause").catch(() => {})}
                            >
                                <label label={bind(isPlaying).as(p => p ? "󰏤" : "󰐊")} css="font-size: 16px; color: #cba6f7;" />
                            </button>
                            <button 
                                css="background: transparent; border: none; padding: 0 4px; min-height: 0;"
                                onClicked={() => execAsync("playerctl next").catch(() => {})}
                            >
                                <label label="󰒭" css="font-size: 14px; color: #89b4fa;" />
                            </button>
                        </box>
                    </box>
                    {/* ------------------------------------------- */}

                </box>

                {/* 2. ВЫПАДАЮЩЕЕ МЕНЮ (Слитное с панелью) */}
                <revealer
                    revealChild={bind(powerMenuVisible)}
                    transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
                    transitionDuration={200}
                    halign={Gtk.Align.START} 
                >
                    <box 
                        vertical={true} 
                        spacing={2} 
                        css={`
                            background-color: rgba(17, 17, 27, 0.75);
                            border: 1px solid rgba(137, 180, 250, 0.2);
                            border-top: none;
                            border-radius: 0 0 16px 16px;
                            padding: 4px; 
                            min-width: 32px;  
                            box-shadow: 0 14px 16px rgba(0, 0, 0, 0.4);
                            font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif;
                            font-size: 18px;
                            font-weight: bold;
                        `}
                    >
                        <button
                            css={`
                                background-color: transparent;
                                border-radius: 9px;
                                padding: 9px; 
                                border: none;
                                color: #f38ba8;
                                min-height: 0;
                            `}
                            onClicked={() => {
                                exec("systemctl poweroff")
                                powerMenuVisible.set(false)
                            }}
                            tooltipText="Выключение"
                        >
                            <icon icon="system-shutdown-symbolic" size={14} />
                        </button>
                        <button
                            css={`
                                background-color: transparent;
                                border-radius: 9px;
                                padding: 9px; 
                                border: none;
                                color: #f9e2af;
                                min-height: 0;
                            `}
                            onClicked={() => {
                                exec("systemctl reboot")
                                powerMenuVisible.set(false)
                            }}
                            tooltipText="Перезапуск"
                        >
                            <icon icon="system-reboot-symbolic" size={14} />
                        </button>
                        <button
                            css={`
                                background-color: transparent;
                                border-radius: 9px;
                                padding: 9px; 
                                border: none;
                                color: #cba6f7;
                                min-height: 0;
                            `}
                            onClicked={() => {
                                exec("systemctl suspend")
                                powerMenuVisible.set(false)
                            }}
                            tooltipText="Спящий режим"
                        >
                            <icon icon="system-suspend-symbolic" size={14} />
                        </button>
                    </box>
                </revealer>
            </box>
        </window>
    )
}