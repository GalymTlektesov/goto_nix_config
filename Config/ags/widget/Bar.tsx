import { Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind, exec, subprocess } from "astal"
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

// Реактивная переменная высоты столбиков
const eqHeights = Variable([5, 5, 5, 5, 5, 5])

// Безопасный путь к конфигу cava через GLib
const configPath = GLib.build_filenamev([GLib.get_home_dir(), ".config", "ags", "cava_config"])

// Запуск CAVA в фоновом режиме с реальным потоком данных
subprocess(`cava -p ${configPath}`, (out) => {
    if (!out) return
    const values = out.trim().split(/[\s;]+/).map(Number)
    if (values.length >= 6 && !values.some(isNaN)) {
        eqHeights.set(values.slice(0, 6).map(v => Math.max(5, v)))
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
                heightRequest={85} 
                valign={Gtk.Align.END} 
                halign={Gtk.Align.CENTER} 
                spacing={10}
            >
                {bind(eqHeights).as(h => [
                    <box widthRequest={18} heightRequest={h[0]} valign={Gtk.Align.END} css="background-color: #7aa2f7; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[1]} valign={Gtk.Align.END} css="background-color: #bb9af7; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[2]} valign={Gtk.Align.END} css="background-color: #7dcfff; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[3]} valign={Gtk.Align.END} css="background-color: #9ece6a; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[4]} valign={Gtk.Align.END} css="background-color: #f7768e; border-radius: 6px;" />,
                    <box widthRequest={18} heightRequest={h[5]} valign={Gtk.Align.END} css="background-color: #e0af68; border-radius: 6px;" />,
                ])}
            </box>
        </box>
    </window>
}

// НОВЫЙ СТИЛИЗОВАННЫЙ КАЛЕНДАРЬ (ПОРЯДОК ДНЕЙ И СТИЛЬ)
export function CalendarWidget(monitor: Gdk.Monitor) {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]

    const jsDay = new Date(year, month, 1).getDay()
    const firstDayIndex = jsDay === 0 ? 6 : jsDay - 1
    const totalDays = new Date(year, month + 1, 0).getDate()
    
    // Жестко берем сегодняшний день для рантайма
    const currentDay = 27 

    const daysArray = []
    
    // Пустые невидимые заглушки
    for (let i = 0; i < firstDayIndex; i++) {
        daysArray.push(<label css="min-height: 36px;" label="" />)
    }
    
    // Заполняем числа месяца
    for (let day = 1; day <= totalDays; day++) {
        const isToday = day === currentDay
        
        const dayCss = isToday 
            ? "color: #1a1b26; background-color: #7aa2f7; font-weight: bold; font-size: 13px; border-radius: 8px; min-height: 36px;" 
            : "color: #c0caf5; font-weight: bold; font-size: 13px; border-radius: 8px; min-height: 36px;";
            
        daysArray.push(
            <label 
                css={dayCss} 
                label={String(day)} 
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
            />
        )
    }

    // Добираем пустые ячейки до конца недели, чтобы последний ряд не перекосило
    while (daysArray.length % 7 !== 0) {
        daysArray.push(<label css="min-height: 36px;" label="" />)
    }

    // Разбиваем массив дней на недели (по 7 штук)
    const weeks = []
    for (let i = 0; i < daysArray.length; i += 7) {
        weeks.push(daysArray.slice(i, i + 7))
    }

    return <window
        monitor={monitor}
        name="calendar-widget"
        namespace="ags-bar" 
        anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
        exclusivity={Astal.Exclusivity.IGNORE}
        layer={Astal.Layer.BOTTOM}
        marginTop={195}
        marginRight={35}
        visible={true}
        css="background-color: transparent;" 
    >
        <box 
            vertical 
            widthRequest={340}
            css="background-color: rgba(26, 27, 38, 0.85); border-radius: 22px; border: 1px solid rgba(122, 162, 247, 0.2); padding: 16px;"
        >
            {/* Месяц и год */}
            <label 
                css="color: #7dcfff; font-weight: bold; font-size: 14px; margin-bottom: 12px; margin-left: 6px;" 
                label={`${monthNames[month]} ${year}`} 
                halign={Gtk.Align.START} 
            />
            
            {/* Шапка дней недели */}
            <box homogeneous css="margin-bottom: 8px;">
                {dayNames.map(name => (
                    <label css="color: #bb9af7; font-weight: bold; font-size: 13px;" label={name} halign={Gtk.Align.CENTER} />
                ))}
            </box>
            
            {/* Сетка недель на базе чистых однородных Box */}
            <box vertical spacing={6}>
                {weeks.map(week => (
                    <box homogeneous spacing={6}>
                        {week}
                    </box>
                ))}
            </box>
        </box>
    </window>
}