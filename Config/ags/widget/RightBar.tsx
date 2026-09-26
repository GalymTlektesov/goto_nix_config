import { App, Astal, Gdk, Gtk } from "astal/gtk3"
import { bind, Variable, execAsync } from "astal"
import Wp from "gi://AstalWp"
import Tray from "gi://AstalTray"
import Hyprland from "gi://AstalHyprland"
import GLib from "gi://GLib"
import Gio from "gi://Gio"

// Папка для кэширования превью видео
const CACHE_DIR = `${GLib.get_tmp_dir()}/astal_wall_cache`
GLib.mkdir_with_parents(CACHE_DIR, 0o755)

const css = `
    .RightBarWindow { background: transparent; }
    .right-bar-card {
        background-color: rgba(17, 17, 27, 0.75);
        border: 1px solid rgba(137, 180, 250, 0.2);
        border-radius: 20px;
        padding: 4px 20px;
    }
    
    .wallpaper-button { 
        color: #D4CA7D; 
        font-weight: bold; 
        background-color: transparent; 
        border: none;
        box-shadow: none;
        outline: none;
    }
    .wallpaper-button:focus, .wallpaper-button:hover {
        border: none;
        box-shadow: none;
        outline: none;
        background-color: transparent;
    }

    .cpu-label { color: #f38ba8; font-weight: bold; }
    .memory-btn { color: #fab387; font-weight: bold; background: transparent; border: none; padding: 0; box-shadow: none; }
    .audio-btn { color: #a6e3a1; background: transparent; border: none; box-shadow: none; padding: 0 4px; font-weight: bold; }
    .audio-btn:hover { background-color: rgba(166, 227, 161, 0.15); border-radius: 6px; }
    .lang-label { color: #cba6f7; font-weight: bold; }
    .net-label { color: #94e2d5; font-weight: bold; }

    .embedded-slider { min-height: 0; padding: 0; margin: 0; }
    .embedded-slider trough { min-height: 4px; border-radius: 2px; background-color: rgba(255, 255, 255, 0.15); }
    .embedded-slider highlight { min-height: 4px; background-image: linear-gradient(90deg, #94e2d5, #a6e3a1); }
    .embedded-slider slider { min-width: 8px; min-height: 8px; background-color: #a6e3a1; border-radius: 50%; margin: -2px; }

    .lang-btn { background: transparent; border: none; padding: 0 4px; box-shadow: none; }
    .lang-btn:hover { background-color: rgba(203, 166, 247, 0.15); border-radius: 6px; }
    .tray-item { background: transparent; border: none; padding: 0 4px; }
    .tray-item icon { min-width: 16px; min-height: 16px; }

    /* --- Стили увеличенного окна выбора обоев --- */
    .wallpaper-card {
        background-color: rgba(17, 17, 27, 0.95);
        border: 1px solid rgba(137, 180, 250, 0.3);
        border-radius: 24px;
        padding: 24px;
        min-width: 1100px;
    }

    .wallpaper-title {
        color: #f38443;
        font-weight: bold;
        font-size: 20px;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: #bac2de;
        box-shadow: none;
        font-size: 18px;
    }
    .close-btn:hover { color: #f38ba8; }

    .folder-btn {
        background-color: rgba(137, 180, 250, 0.15);
        border: 1px solid rgba(137, 180, 250, 0.3);
        border-radius: 12px;
        padding: 8px 16px;
        color: #cdd6f4;
        font-size: 16px;
        font-weight: bold;
    }
    .folder-btn:hover { background-color: rgba(137, 180, 250, 0.3); }

    .wallpaper-scroll {
        border-radius: 12px;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 12px;
    }

    /* Стили превью файлов */
    .wallpaper-item {
        background-size: cover;
        background-position: center;
        border-radius: 12px;
        min-width: 240px;
        min-height: 150px;
        border: 3px solid transparent;
        transition: min-width 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), 
                    min-height 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), 
                    border 0.15s ease-out;
        margin: 0 8px;
        padding: 0;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
    .wallpaper-item:hover {
        border: 3px solid rgba(137, 180, 250, 0.6);
        min-width: 260px;
        min-height: 162px;
    }
    
    .wallpaper-item.selected {
        min-width: 280px;
        min-height: 175px;
        border: 3px solid #a6e3a1;
        box-shadow: 0 8px 20px rgba(166, 227, 161, 0.3);
    }

    .video-fallback-icon {
        color: #cdd6f4;
        font-size: 32px;
        background-color: rgba(17, 17, 27, 0.7);
        border-radius: 50%;
        padding: 12px;
    }
`

const provider = new Gtk.CssProvider()
provider.load_from_data(css)
Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default()!, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)

const showWallpaperMenu = Variable(false)
const selectedFolderPath = Variable<string | null>(null)
const wallpaperFiles = Variable<string[]>([])
const currentWallpaper = Variable<string | null>(null)

async function getVideoThumbnail(filePath: string): Promise<string | null> {
    const safeName = filePath.replace(/[^a-zA-Z0-9]/g, '_')
    const thumbPath = `${CACHE_DIR}/${safeName}.jpg`

    if (GLib.file_test(thumbPath, GLib.FileTest.EXISTS)) return thumbPath

    try {
        await execAsync([
            "ffmpeg", "-y", 
            "-i", filePath, 
            "-ss", "00:00:01", 
            "-vframes", "1", 
            "-vf", "scale=400:-1", 
            thumbPath
        ])
        return thumbPath
    } catch (e) {
        console.error(`Не удалось создать превью для ${filePath}:`, e)
        return null
    }
}

function loadWallpapersFromFolder(folderPath: string) {
    try {
        const dir = Gio.File.new_for_path(folderPath)
        const enumerator = dir.enumerate_children("standard::*", Gio.FileQueryInfoFlags.NONE, null)
        const files: string[] = []
        const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm", ".mkv"]

        let info: Gio.FileInfo | null
        while ((info = enumerator.next_file(null)) !== null) {
            if (info.get_file_type() === Gio.FileType.REGULAR) {
                const name = info.get_name()
                const ext = name.substring(name.lastIndexOf(".")).toLowerCase()
                if (validExtensions.includes(ext)) {
                    files.push(`${folderPath}/${name}`)
                }
            }
        }
        files.sort((a, b) => a.localeCompare(b))
        wallpaperFiles.set(files)
        selectedFolderPath.set(folderPath)
    } catch (err) {
        wallpaperFiles.set([])
    }
}

function openFolderChooser() {
    const chooser = new Gtk.FileChooserDialog({
        title: "Выберите папку с обоями",
        action: Gtk.FileChooserAction.SELECT_FOLDER,
    })
    chooser.add_button("Отмена", Gtk.ResponseType.CANCEL)
    chooser.add_button("Выбрать", Gtk.ResponseType.ACCEPT)

    if (chooser.run() === Gtk.ResponseType.ACCEPT) {
        const folder = chooser.get_filename()
        if (folder) loadWallpapersFromFolder(folder)
    }
    chooser.destroy()
}

async function applyWallpaper(filePath: string) {
    currentWallpaper.set(filePath)
    const isVideo = [".mp4", ".webm", ".mkv"].some(ext => filePath.toLowerCase().endsWith(ext))

    try {
        await execAsync(["bash", "-c", "pkill -9 gslapper || true"])
        if (isVideo) {
            execAsync(["bash", "-c", `gslapper -o "loop" "*" "${filePath}" >/dev/null 2>&1 &`])
        } else {
            await execAsync(["awww", "img", filePath])
        }
    } catch (err) {
        console.error("Ошибка установки обоев:", err)
    }
}

function WallpaperItem({ file }: { file: string }) {
    const isVideo = [".mp4", ".webm", ".mkv"].some(v => file.toLowerCase().endsWith(v))
    const bgUrl = Variable<string | null>(isVideo ? null : file)

    if (isVideo) {
        getVideoThumbnail(file).then(thumb => {
            if (thumb) bgUrl.set(thumb)
        })
    }

    return (
        <button
            onClicked={() => applyWallpaper(file)}
            className={bind(currentWallpaper).as(cur => `wallpaper-item ${cur === file ? 'selected' : ''}`)}
            css={bind(bgUrl).as(url => url ? `background-image: url("file://${url.replace(/"/g, '\\"')}");` : "background-color: #313244;")}
        >
            {isVideo ? <label className="video-fallback-icon" label="🎬" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} /> : <box />}
        </button>
    )
}

function WallpaperMenu({ monitor }: { monitor: Gdk.Monitor }) {
    return (
        <window
            name="wallpaper_window"
            className="WallpaperWindow"
            gdkmonitor={monitor}
            visible={bind(showWallpaperMenu)}
            anchor={Astal.WindowAnchor.CENTER}
            layer={Astal.Layer.TOP}
            keymode={Astal.Keymode.ON_DEMAND}
        >
            <box className="wallpaper-card" vertical spacing={20}>
                <box spacing={8}>
                    <label className="wallpaper-title" label="󰸉  Галерея обоев" hexpand align={0} />
                    <button className="close-btn" onClicked={() => showWallpaperMenu.set(false)}>
                        <label label="✕" />
                    </button>
                </box>

                <box spacing={8} valignment={Gtk.Align.CENTER}>
                    <button className="folder-btn" onClicked={openFolderChooser} hexpand>
                        <label label={bind(selectedFolderPath).as(path => path ? `📁 ${path.split('/').pop()}` : "📁 Выбрать папку...")} />
                    </button>
                </box>

                <scrollable 
                    className="wallpaper-scroll" 
                    hscroll={Gtk.PolicyType.AUTOMATIC} 
                    vscroll={Gtk.PolicyType.NEVER}
                    heightRequest={240}
                    // Перехват обычного (вертикального) скролла и преобразование его в горизонтальный
                    onScrollEvent={(self, event) => {
                        const [hasDirection, dir] = event.get_scroll_direction()
                        const adj = self.get_hadjustment()
                        const step = 80 // Шаг (скорость) прокрутки

                        if (hasDirection && dir !== Gdk.ScrollDirection.SMOOTH) {
                            if (dir === Gdk.ScrollDirection.UP) {
                                adj.set_value(adj.get_value() - step)
                                return true
                            } else if (dir === Gdk.ScrollDirection.DOWN) {
                                adj.set_value(adj.get_value() + step)
                                return true
                            }
                        } else {
                            const [, dx, dy] = event.get_scroll_deltas()
                            
                            // Если свайп идет по горизонтали (например тачпадом), игнорируем перехват
                            if (dx !== 0) return false
                            
                            if (dy < 0) {
                                adj.set_value(adj.get_value() - step)
                                return true
                            } else if (dy > 0) {
                                adj.set_value(adj.get_value() + step)
                                return true
                            }
                        }
                        return false
                    }}
                >
                    <box spacing={12} valign={Gtk.Align.CENTER}>
                        {bind(wallpaperFiles).as(files => 
                            files.length === 0 ? (
                                <label 
                                    label={selectedFolderPath.get() ? "Файлы обоев не найдены" : "Нажмите на кнопку выбора папки"} 
                                    css="color: #6c7086; padding: 24px; font-size: 16px;" 
                                />
                            ) : (
                                files.map(file => <WallpaperItem file={file} />)
                            )
                        )}
                    </box>
                </scrollable>
            </box>
        </window>
    )
}

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
        (alt, gigs, percent) => alt ? `    ${percent}` : `    ${gigs}`
    )

    const net = Variable("Disconnected").poll(5000, ["bash", "-c", "ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || echo 'Disconnected'"])
    const lang = Variable("EN")

    const updateLang = async () => {
        try {
            const out = await execAsync(["hyprctl", "devices", "-j"])
            const devices = JSON.parse(out)
            const keyboards = devices.keyboards || []
            const keyboard = keyboards.find((kb: any) => kb.main) || keyboards[0]
            
            if (keyboard?.active_keymap) {
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

    const switchLayout = async () => {
        try {
            const out = await execAsync(["hyprctl", "devices", "-j"])
            const devices = JSON.parse(out)
            const keyboards = devices.keyboards || []
            const keyboard = keyboards.find((kb: any) => kb.main) || keyboards[0]
            
            if (keyboard?.name) {
                await execAsync(["hyprctl", "switchxkblayout", keyboard.name, "next"])
                setTimeout(() => updateLang(), 50)
            }
        } catch (err) {
            console.error("Failed to switch layout:", err)
        }
    }

    updateLang()
    hyprland.connect("keyboard-layout", () => updateLang())

    return (
        <>
            <window
                name="right_bar"
                className="RightBarWindow"
                gdkmonitor={monitor}
                exclusivity={Astal.Exclusivity.EXCLUSIVE}
                anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
                marginTop={3} 
                css="background-color: transparent;"
            >
                <box halign={Gtk.Align.END} marginRight={12}>
                    <box className="right-bar-card" spacing={4} valignment={Gtk.Align.CENTER}>

                        <button 
                            className="wallpaper-button" 
                            label="󰋰"
                            onClicked={() => showWallpaperMenu.set(!showWallpaperMenu.get())}
                        />

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
                                        if (speaker.mute || vol === 0) return "    Muted"
                                        const icon = vol > 50 ? " " : vol > 20 ? " " : " "
                                        return `${icon} ${vol}%`
                                    }) : "    Muted"} />
                                </button>
                            </eventbox>
                            
                            <revealer
                                revealChild={bind(showSlider)}
                                transitionType={Gtk.RevealerTransitionType.SLIDE_RIGHT}
                                transitionDuration={200}
                            >
                                <box valignment={Gtk.Align.CENTER}>
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
                            </revealer>
                        </box>

                        <button className="lang-btn" onClicked={switchLayout}>
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
                                                    if (button === 1) item.activate(0, 0)
                                                    else if (button === 3 && item.menuModel) {
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
            <WallpaperMenu monitor={monitor} />
        </>
    )
}