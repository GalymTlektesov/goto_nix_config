import { Variable, bind } from "astal"
import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { exec } from "astal/process"
import Hyprland from "gi://AstalHyprland" 

export const powerMenuVisible = Variable(false)

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
                                                ? "background-color: #89b4fa; color: #11111b; border-radius: 8px; padding: 0px 8px; border: none; min-height: 0;" 
                                                : "background-color: transparent; color: #cdd6f4; border-radius: 8px; padding: 0px 8px; border: none; min-height: 0;"
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
                            css="color: #6c7086; font-size: 11px;" 
                        />
                        {bind(hypr, "focusedClient").as(client => {
                            if (!client) return <label label="" />;
                            
                            return (
                                <label
                                    label={bind(client, "title").as(title => {
                                        const text = title || client.class || "";
                                        return text.length > 35 ? text.substring(0, 35) + "…" : text;
                                    })}
                                    css="color: #b4befe;"
                                />
                            );
                        })}
                    </box>
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
                            background-color: rgba(17, 17, 27, 0.75); /* Тот же уровень прозрачности, что у панели */
                            border: 1px solid rgba(137, 180, 250, 0.2);
                            border-top: none; /* Убираем верхнюю границу, чтобы слилось с кнопкой */
                            border-radius: 0 0 12px 12px; /* Скруглены только нижние углы */
                            padding: 4px; 
                            min-width: 32px;  
                            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.4);
                            font-family: 'FiraCode Nerd Font', 'Comfortaa', sans-serif;
                            font-size: 16px;
                            font-weight: bold;
                        `}
                    >
                        <button
                            css={`
                                background-color: transparent;
                                border-radius: 6px;
                                padding: 6px; 
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
                                border-radius: 6px;
                                padding: 6px; 
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
                                border-radius: 6px;
                                padding: 6px; 
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