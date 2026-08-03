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
                        background-color: rgba(17, 17, 27, 0.85);
                        border: 1px solid rgba(137, 180, 250, 0.3);
                        border-radius: ${v ? "10px 10px 10px 0" : "10px"};
                        border-bottom-color: ${v ? "transparent" : "rgba(137, 180, 250, 0.3)"};
                        padding: 2px 6px;
                        margin-top: 5px;
                        min-height: 26px;
                    `)}
                    spacing={2}
                >
                    <button
                        css={`
                            color: #cdd6f4;
                            padding: 2px 8px;
                            font-size: 14px;
                            background-color: transparent;
                            border: none;
                            border-radius: 6px;
                        `}
                        onClicked={() => powerMenuVisible.set(!powerMenuVisible.get())}
                    >
                        <label label="󱄅" />
                    </button>
                    
                    <box css="background-color: rgba(255, 255, 255, 0.15); min-width: 1px; margin: 4px 2px;" />

                    <box vertical={false} spacing={2}>
                        {bind(hypr, "workspaces").as(wss =>
                            wss
                                .filter(ws => ws.id > 0)
                                .sort((a, b) => a.id - b.id)
                                .map(ws => (
                                    <button
                                        css={bind(hypr, "focusedWorkspace").as(fw =>
                                            fw === ws 
                                                ? "background-color: #89b4fa; color: #11111b; border-radius: 6px; padding: 2px 8px; border: none;" 
                                                : "background-color: transparent; color: #cdd6f4; border-radius: 6px; padding: 2px 8px; border: none;"
                                        )}
                                        onClicked={() => ws.focus()}
                                    >
                                        <label label={String(ws.id)} />
                                    </button>
                                ))
                        )}
                    </box>
                </box>

                {/* 2. ВЫПАДАЮЩЕЕ МЕНЮ (Суженное) */}
                <revealer
                    revealChild={bind(powerMenuVisible)}
                    transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
                    transitionDuration={200}
                    halign={Gtk.Align.START} 
                >
                    <box 
                        vertical={true} 
                        spacing={4} 
                        css={`
                            background-color: rgba(17, 17, 27, 0.95);
                            border: 1px solid rgba(137, 180, 250, 0.3);
                            border-top: none;
                            border-radius: 0 0 10px 10px;
                            padding: 6px 5px; /* <-- Уменьшили горизонтальные отступы контейнера */
                            min-width: 27px;  /* <-- Сузили минимальную ширину */
                            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.4);
                        `}
                    >
                        <button
                            css={`
                                background-color: transparent;
                                border-radius: 4px;
                                padding: 5px; /* <-- Уменьшили внутренние отступы самих кнопок */
                                border: none;
                                color: #f38ba8;
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
                                border-radius: 4px;
                                padding: 5px;
                                border: none;
                                color: #f9e2af;
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
                                border-radius: 4px;
                                padding: 5px;
                                border: none;
                                color: #cba6f7;
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