import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar, { CalendarWidget } from "./widget/Bar" // Импортируем и Bar, и календарь
import { PowerMenu, LeftModulesBar } from './widget/powermenu';
//import VolumeMenu from './widget/volumemenu';
import RightBar from "./widget/RightBar"
import CenterBar from "./widget/CenterBar"
import { exec, execAsync } from "astal"
import GLib from "gi://GLib"


const WALLPAPER_FILE = `${GLib.get_home_dir()}/.cache/ags_wallpaper.txt`

function killDaemons() {
    const killCmd = `
        pkill -9 gslapper || true
        pkill -9 awww-daemon || true
        pkill -9 awww || true
        pkill -9 nwg-dock-hyprland || true
        pkill -9 mako || true
    `
    try { exec(["bash", "-c", killCmd]) } catch (e) {}
}

function startDaemons() {
    // 1. На всякий случай чистим старые зависшие процессы
    killDaemons()

    // 2. Запускаем демоны
    execAsync(["bash", "-c", "mako &"])
    execAsync(["bash", "-c", "awww-daemon &"])
    execAsync(["bash", "-c", "nwg-dock-hyprland -p left -a start -i 26 -mb 0 -ml 0 -mt 0 -r -nolauncher -x &"])

    // 3. Восстанавливаем обои
    try {
        if (GLib.file_test(WALLPAPER_FILE, GLib.FileTest.EXISTS)) {
            const savedWall = exec(`cat ${WALLPAPER_FILE}`).trim()
            if (savedWall) {
                const isVideo = [".mp4", ".webm", ".mkv"].some(ext => savedWall.toLowerCase().endsWith(ext))
                if (isVideo) {
                    execAsync(["bash", "-c", `gslapper -o "loop" "*" "${savedWall}" >/dev/null 2>&1 &`])
                } else {
                    // Даем awww-daemon полсекунды на запуск перед отправкой картинки
                    execAsync(["bash", "-c", `sleep 0.5 && awww img "${savedWall}" &`])
                }
            }
        }
    } catch (e) {
        console.error("Не удалось восстановить обои при запуске:", e)
    }
}

App.start({
    css: style,
    main() {
        startDaemons()
        App.get_monitors().map(monitor => {
            Bar(monitor)
            //CalendarWidget(monitor)
            RightBar(monitor)
        })
        LeftModulesBar()
        CenterBar()
        //App.add_window(VolumeMenu())
    },
})

App.connect("shutdown", () => {
    killDaemons()
})