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
        namespace="ags-bar"
        anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
        exclusivity={Astal.Exclusivity.IGNORE}
        layer={Astal.Layer.BOTTOM}
        marginTop={45}
        marginRight={35}
        visible={true}
        css="background-color: rgba(26, 27, 38, 0.85); border-radius: 22px; border: 1px solid rgba(122, 162, 247, 0.2);"
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
                halign={Gtk.Align.START} 
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

//Календарь

const timeVar = Variable(new Date()).poll(60000, () => new Date())
const monthOffset = Variable(0) // 0 - текущий месяц, -1 - прошлый, +1 - следующий

// Объединяем переменные, чтобы календарь обновлялся и от времени, и от скролла
const calendarState = Variable.derive([timeVar, monthOffset], (time, offset) => ({ time, offset }))

export function CalendarWidget(monitor: Gdk.Monitor) {
    const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]

    return <window
        monitor={monitor}
        name="calendar-widget"
        namespace="ags-bar" 
        anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
        exclusivity={Astal.Exclusivity.IGNORE}
        layer={Astal.Layer.BOTTOM}
        marginTop={245} // Сдвинул ниже, так как эквалайзер стал чуть выше. Подкорректируй при необходимости.
        marginRight={35}
        visible={true}
        css="background-color: transparent;" 
    >
        {/* EVENTBOX для отслеживания скролла */}
        <eventbox 
            onScrollEvent={(_, event) => {
                const [hasDirection, dir] = event.get_scroll_direction()
                if (hasDirection) {
                    if (dir === Gdk.ScrollDirection.UP) monthOffset.set(monthOffset.get() - 1)
                    else if (dir === Gdk.ScrollDirection.DOWN) monthOffset.set(monthOffset.get() + 1)
                } else {
                    const [hasDeltas, dx, dy] = event.get_scroll_deltas()
                    if (hasDeltas) {
                        if (dy < 0) monthOffset.set(monthOffset.get() - 1)
                        else if (dy > 0) monthOffset.set(monthOffset.get() + 1)
                    }
                }
                return true
            }}
        >
            <box 
                vertical 
                widthRequest={340}
                css="background-color: rgba(26, 27, 38, 0.85); border-radius: 22px; border: 1px solid rgba(122, 162, 247, 0.2); padding: 16px;"
            >
                {bind(calendarState).as(({ time, offset }) => {
                    const realYear = time.getFullYear()
                    const realMonth = time.getMonth()
                    
                    // JS Date автоматически решает переход через год, если передать month + offset
                    const targetDate = new Date(realYear, realMonth + offset, 1)
                    const year = targetDate.getFullYear()
                    const month = targetDate.getMonth()
                    
                    const jsDay = targetDate.getDay()
                    const firstDayIndex = jsDay === 0 ? 6 : jsDay - 1
                    const totalDays = new Date(year, month + 1, 0).getDate()
                    
                    const isCurrentMonth = offset === 0
                    const currentDay = time.getDate() 

                    const daysArray = []
                    
                    for (let i = 0; i < firstDayIndex; i++) {
                        daysArray.push(<label css="min-height: 36px; min-width: 36px;" label="" />)
                    }
                    
                    for (let day = 1; day <= totalDays; day++) {
                        const isToday = isCurrentMonth && (day === currentDay)
                        
                        const dayCss = isToday 
                            ? "color: #1a1b26; background-color: #7aa2f7; font-weight: bold; font-size: 13px; border-radius: 8px; min-height: 36px; min-width: 36px;" 
                            : "color: #c0caf5; font-weight: bold; font-size: 13px; border-radius: 8px; min-height: 36px; min-width: 36px;"
                        
                        daysArray.push(
                            <label 
                                css={dayCss} 
                                label={String(day)} 
                                halign={Gtk.Align.CENTER}
                                valign={Gtk.Align.CENTER}
                            />
                        )
                    }

                    while (daysArray.length % 7 !== 0) {
                        daysArray.push(<label css="min-height: 36px;" label="" />)
                    }

                    const weeks = []
                    for (let i = 0; i < daysArray.length; i += 7) {
                        weeks.push(daysArray.slice(i, i + 7))
                    }

                    return (
                        <box vertical>
                            {/* Нажатие на месяц сбрасывает календарь на текущую дату */}
                            <button 
                                onClicked={() => monthOffset.set(0)} 
                                css="background: transparent; border: none; padding: 0;"
                                halign={Gtk.Align.START}
                            >
                                <label 
                                    css="color: #7dcfff; font-weight: bold; font-size: 14px; margin-bottom: 12px; margin-left: 6px;" 
                                    label={`${monthNames[month]} ${year}`} 
                                />
                            </button>
                            <box homogeneous css="margin-bottom: 8px;">
                                {dayNames.map(name => (
                                    <label css="color: #bb9af7; font-weight: bold; font-size: 13px;" label={name} halign={Gtk.Align.CENTER} />
                                ))}
                            </box>
                            <box vertical spacing={6}>
                                {weeks.map(week => (
                                    <box homogeneous spacing={6}>
                                        {week}
                                    </box>
                                ))}
                            </box>
                        </box>
                    )
                })}
            </box>
        </eventbox>
    </window>
}