import { Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind, exec, subprocess, execAsync } from "astal"
import GLib from "gi://GLib"

// Получение названия трека
const currentTrack = Variable("Ожидание музыки...").poll(1000, () => {
    try {
        const res = exec("playerctl -a metadata --format '{{artist}} - {{title}}' 2>/dev/null")
        const line = res ? res.split('\n')[0] : ""
        if (line && line.trim() !== "") return line
    } catch {}
    return "Системный аудиопоток"
})

// Статус воспроизведения
const isPlaying = Variable(false).poll(1000, () => {
    try {
        const status = exec("playerctl status 2>/dev/null")
        return status.trim() === "Playing"
    } catch {}
    return false
})

const eqHeights = Variable([5, 5, 5, 5, 5, 5])
const configPath = GLib.build_filenamev([GLib.get_home_dir(), ".config", "ags", "cava_config"])

// Запуск CAVA с жестким ограничением максимальной высоты!
subprocess(`cava -p ${configPath}`, (out) => {
    if (!out) return
    const values = out.trim().split(/[\s;]+/).map(Number)
    if (values.length >= 6 && !values.some(isNaN)) {
        // Math.min(65, ...) гарантирует, что столбик НИКОГДА не превысит 65px
        eqHeights.set(values.slice(0, 6).map(v => Math.min(65, Math.max(5, v))))
    }
})

export default function Bar(monitor: Gdk.Monitor) {
    return <window
        monitor={monitor}
        name="equalizer-widget"
        namespace="ags-equalizer"
        anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
        exclusivity={Astal.Exclusivity.IGNORE}
        layer={Astal.Layer.BOTTOM}
        marginTop={720}
        marginRight={-45}
        visible={true}
        //css="background-color: rgba(26, 27, 38, 0.85); border-radius: 22px; border: 1px solid rgba(122, 162, 247, 0.2);"
        css="background-color: transparent; 
        border-radius: 22px; border: 1px solid rgba(122, 162, 247, 0.2);
        border: none;"
        //css="background-color: transparent; border: none;"
    >
        <box 
            vertical={true} 
            spacing={10} 
            widthRequest={340} 
            heightRequest={140}
            css="padding: 16px;"
        >
            <label 
                label={bind(currentTrack)} 
                halign={Gtk.Align.CENTER} 
                truncate={true}
                maxWidthChars={32}
                css="color: #7aa2f7; font-weight: bold; font-size: 13px;" 
            />
            
            <box 
                heightRequest={70} 
                valign={Gtk.Align.END} 
                halign={Gtk.Align.CENTER} 
                spacing={10}
            >
                {/* Вернул твои рабочие инлайн-стили */}
                {bind(eqHeights).as(h => [
                    <box widthRequest={18} heightRequest={h[0]} valign={Gtk.Align.END} css="background-color: #7aa2f7; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[1]} valign={Gtk.Align.END} css="background-color: #bb9af7; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[2]} valign={Gtk.Align.END} css="background-color: #7dcfff; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[3]} valign={Gtk.Align.END} css="background-color: #9ece6a; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[4]} valign={Gtk.Align.END} css="background-color: #f7768e; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[5]} valign={Gtk.Align.END} css="background-color: #e0af68; border-radius: 6px;" />,
                ])}
            </box>

          {/* МЕДИЯ ПЛЕЕР */}
            <box halign={Gtk.Align.CENTER} spacing={12} css="margin-top: 15px; margin-bottom: 5px;">
                <button 
                    className="player-btn"
                    /* Задаем жесткие min-height и min-width, обнуляем padding */
                    css="background: rgba(122, 162, 247, 0.15); border: none; box-shadow: none; min-height: 36px; min-width: 55px; padding: 0; border-radius: 20px;"
                    onClicked={() => execAsync("playerctl previous").catch(() => {})}
                >
                    <label label="" css="font-size: 18px; color: #7aa2f7;" />
                </button>
                
                <button 
                    className="player-btn player-btn-play"
                    css="background: rgba(187, 154, 247, 0.15); border: none; box-shadow: none; min-height: 36px; min-width: 75px; padding: 0; border-radius: 20px;"
                    onClicked={() => execAsync("playerctl play-pause").catch(() => {})}
                >
                    <label label={bind(isPlaying).as(p => p ? "󱖐" : "")} css="font-size: 24px; color: #bb9af7;" />
                </button>
                
                <button 
                    className="player-btn"
                    css="background: rgba(122, 162, 247, 0.15); border: none; box-shadow: none; min-height: 36px; min-width: 55px; padding: 0; border-radius: 20px;"
                    onClicked={() => execAsync("playerctl next").catch(() => {})}
                >
                    <label label="" css="font-size: 18px; color: #7aa2f7;" />
                </button>
            </box>
        </box>
    </window>
}