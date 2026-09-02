import { Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind } from "astal"
import GdkPixbuf from "gi://GdkPixbuf"
import GLib from "gi://GLib"

const time = Variable(new Date()).poll(1000, () => new Date())
const showCalendar = Variable(false)
const monthOffset = Variable(0)

const calendarState = Variable.derive([time, monthOffset], (t, offset) => ({ time: t, offset }))

function CalendarContent() {
    const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]

    return (
        <eventbox 
            onScrollEvent={(_, event) => {
                const [hasDirection, dir] = event.get_scroll_direction()
                if (hasDirection) {
                    if (dir === Gdk.ScrollDirection.UP) monthOffset.set(monthOffset.get() - 1)
                    else if (dir === Gdk.ScrollDirection.DOWN) monthOffset.set(monthOffset.get() + 1)
                } else {
                    const [hasDeltas, _, dy] = event.get_scroll_deltas()
                    if (hasDeltas) {
                        if (dy < 0) monthOffset.set(monthOffset.get() - 1)
                        else if (dy > 0) monthOffset.set(monthOffset.get() + 1)
                    }
                }
                return true
            }}
        >
            <box vertical widthRequest={320} css="padding-top: 10px;">
                {bind(calendarState).as(({ time: t, offset }) => {
                    const realYear = t.getFullYear()
                    const realMonth = t.getMonth()
                    
                    const targetDate = new Date(realYear, realMonth + offset, 1)
                    const year = targetDate.getFullYear()
                    const month = targetDate.getMonth()
                    
                    const jsDay = targetDate.getDay()
                    const firstDayIndex = jsDay === 0 ? 6 : jsDay - 1
                    const totalDays = new Date(year, month + 1, 0).getDate()
                    
                    const isCurrentMonth = offset === 0
                    const currentDay = t.getDate() 

                    const daysArray = []
                    for (let i = 0; i < firstDayIndex; i++) {
                        daysArray.push(<label css="min-height: 34px; min-width: 34px;" label="" />)
                    }
                    
                    for (let day = 1; day <= totalDays; day++) {
                        const isToday = isCurrentMonth && (day === currentDay)
                        const dayCss = isToday 
                            ? "color: #1a1b26; background-color: #7aa2f7; font-weight: bold; font-size: 13px; border-radius: 8px; min-height: 34px; min-width: 34px;" 
                            : "color: #c0caf5; font-weight: bold; font-size: 13px; border-radius: 8px; min-height: 34px; min-width: 34px;"
                        
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
                        daysArray.push(<label css="min-height: 34px;" label="" />)
                    }

                    const weeks = []
                    for (let i = 0; i < daysArray.length; i += 7) {
                        weeks.push(daysArray.slice(i, i + 7))
                    }

                    return (
                        <box vertical spacing={4}>
                            <button 
                                onClicked={() => monthOffset.set(0)} 
                                css="background: transparent; border: none; padding: 0;"
                                halign={Gtk.Align.START}
                            >
                                <label 
                                    css="color: #7dcfff; font-weight: bold; font-size: 14px; margin-bottom: 8px; margin-left: 4px;" 
                                    label={`${monthNames[month]} ${year}`} 
                                />
                            </button>
                            <box homogeneous css="margin-bottom: 4px;">
                                {dayNames.map(name => (
                                    <label css="color: #bb9af7; font-weight: bold; font-size: 12px;" label={name} halign={Gtk.Align.CENTER} />
                                ))}
                            </box>
                            <box vertical spacing={4}>
                                {weeks.map(week => (
                                    <box homogeneous spacing={4}>
                                        {week}
                                    </box>
                                ))}
                            </box>
                        </box>
                    )
                })}
            </box>
        </eventbox>
    )
}

export default function CenterBar(monitor: Gdk.Monitor) {
    const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${hours}:${minutes}:${seconds}`
    }

    const formatDate = (date: Date) => {
        const str = date.toLocaleDateString('ru-RU', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        })
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    const catGifPath = "/home/goto/Pictures/Wallpaper/herta-kurukuru.gif" 
    const gifSize = 200

    return (
        <window
            monitor={monitor}
            name="center-bar"
            namespace="ags-bar"
            anchor={Astal.WindowAnchor.TOP}
            exclusivity={Astal.Exclusivity.IGNORE}
            layer={Astal.Layer.TOP}
            marginTop={3}
            visible={true}
            css="background-color: transparent;"
        >
            <box
                vertical={true}
                halign={Gtk.Align.CENTER}
                css="background-color: rgba(26, 27, 38, 0.85); border-radius: 16px; border: 1px solid rgba(122, 162, 247, 0.2); padding: 5px 14px;"
            >
                {/* Кнопка часов и даты */}
                <button
                    onClicked={() => showCalendar.set(!showCalendar.get())}
                    css="background: transparent; border: none; padding: 0; margin: 0;"
                >
                    <box spacing={10} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
                        <label label="" css="color: #7dcfff; font-size: 13px;" />
                        <label 
                            label={bind(time).as(formatTime)} 
                            css="color: #c0caf5; font-weight: bold; font-size: 13px; font-family: 'JetBrains Mono', monospace;" 
                        />
                        <label label="|" css="color: rgba(190, 203, 247, 0.3); font-size: 13px;" />
                        <label 
                            label={bind(time).as(formatDate)} 
                            css="color: #c0caf5; font-weight: bold; font-size: 13px;" 
                        />
                    </box>
                </button>

                {/* Раскрывающаяся панель */}
                <box visible={bind(showCalendar)}>
                    <box horizontal spacing={16} valign={Gtk.Align.CENTER}>
                        {/* Календарь слева */}
                        <CalendarContent />

                        {/* Анимированный GIF справа с ручным рендером и масштабированием кадров */}
                        <box 
                            valign={Gtk.Align.CENTER} 
                            halign={Gtk.Align.CENTER}
                            css="padding: 10px;"
                            setup={(self) => {
                                try {
                                    const anim = GdkPixbuf.PixbufAnimation.new_from_file(catGifPath)
                                    const iter = anim.get_iter(null)
                                    const image = new Gtk.Image()

                                    const updateFrame = () => {
                                        const pixbuf = iter.get_pixbuf().scale_simple(
                                            gifSize, 
                                            gifSize, 
                                            GdkPixbuf.InterpType.BILINEAR
                                        )
                                        image.set_from_pixbuf(pixbuf)
                                        
                                        let delay = iter.get_delay_time()
                                        if (delay <= 0) delay = 100 // fallback если в гифке нет задержки

                                        iter.advance(null)
                                        GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
                                            updateFrame()
                                            return GLib.SOURCE_REMOVE
                                        })
                                    }

                                    updateFrame()
                                    self.add(image)
                                    self.show_all()
                                } catch (e) {
                                    console.error("Ошибка загрузки GIF:", e)
                                }
                            }}
                        />
                    </box>
                </box>
            </box>
        </window>
    )
}