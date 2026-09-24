import { Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind } from "astal"
import { execAsync } from "astal/process"
import GdkPixbuf from "gi://GdkPixbuf"
import GLib from "gi://GLib"

// --- Блок погоды ---
const CITY_LAT = "51.1694"
const CITY_LON = "71.4491"

function getWeatherIcon(code: number): string {
    if (code === 0) return "󰖙" // Ясно
    if (code >= 1 && code <= 3) return "󰖕" // Переменная облачность
    if (code >= 45 && code <= 48) return "󰌵" // Туман
    if (code >= 51 && code <= 67) return "󰖖" // Морось / Дождь
    if (code >= 71 && code <= 77) return "󰼁" // Снег
    if (code >= 80 && code <= 82) return "󰙾" // Ливень
    if (code >= 85 && code <= 86) return "󰼁" // Снегопад
    if (code >= 95 && code <= 99) return "󰙾" // Гроза
    return "󰖔"
}

let lastWeatherFetch = 0

const weatherData = Variable({ temp: "--°C", icon: "󰖔" }).poll(10000, async () => {
    const now = Date.now()
    if (lastWeatherFetch === 0 || (now - lastWeatherFetch) >= 900000) {
        lastWeatherFetch = now
        try {
            const res = await execAsync(
                `curl -s "https://api.open-meteo.com/v1/forecast?latitude=${CITY_LAT}&longitude=${CITY_LON}&current_weather=true"`
            )
            const json = JSON.parse(res)
            const current = json.current_weather
            return {
                temp: `${Math.round(current.temperature)}°C`,
                icon: getWeatherIcon(current.weathercode)
            }
        } catch (e) {
            console.error("Ошибка получения погоды:", e)
            lastWeatherFetch = 0 
            return weatherData.get() 
        }
    }
    return weatherData.get()
})

// --- Блок времени и календаря ---
const time = Variable(new Date()).poll(1000, () => new Date())
const showCalendar = Variable(false)
const monthOffset = Variable(0)

// Переменная для почасового прогноза (6 часов)
const hourlyForecast = Variable<Array<{ time: string, temp: number, icon: string }>>([])

async function fetchHourlyForecast() {
    try {
        const res = await execAsync(
            `curl -s "https://api.open-meteo.com/v1/forecast?latitude=${CITY_LAT}&longitude=${CITY_LON}&hourly=temperature_2m,weathercode&timezone=auto"`
        )
        const json = JSON.parse(res)
        const now = new Date()
        
        // Начало текущего часа (локальное время)
        const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).getTime()
        
        // Если прошло больше 30 минут текущего часа, начинаем прогноз со следующего часа
        // (например, в 12:33 верхняя строка будет 13:00, а в 12:15 — 12:00)
        const targetHourStart = now.getMinutes() > 30 ? currentHourStart + 3600000 : currentHourStart

        let startIndex = -1
        for (let i = 0; i < json.hourly.time.length; i++) {
            const t = json.hourly.time[i]
            // Ручной парсинг для 100% избежания проблем с UTC/локальным временем
            const [datePart, timePart] = t.split('T')
            const [year, month, day] = datePart.split('-').map(Number)
            const [hour, minute] = timePart.split(':').map(Number)
            const entryTime = new Date(year, month - 1, day, hour, minute).getTime()
            
            if (entryTime >= targetHourStart) {
                startIndex = i
                break
            }
        }

        if (startIndex === -1) startIndex = 0 // Fallback на случай ошибок

        const next6Hours = []
        for (let i = 0; i < 6; i++) {
            const idx = startIndex + i
            if (idx < json.hourly.time.length) {
                const t = json.hourly.time[idx]
                const [datePart, timePart] = t.split('T')
                const [hour, minute] = timePart.split(':').map(Number)
                
                const temp = Math.round(json.hourly.temperature_2m[idx])
                const code = json.hourly.weathercode[idx]
                const hourLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                
                next6Hours.push({ time: hourLabel, temp, icon: getWeatherIcon(code) })
            }
        }
        hourlyForecast.set(next6Hours)
    } catch (e) {
        console.error("Ошибка получения почасового прогноза:", e)
    }
}

// Переменная для защиты от слишком частых срабатываний скролла (дребезг)
let lastScrollTime = 0

function CalendarContent() {
    const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]

    // Используем derive, чтобы календарь перерисовывался мгновенно при изменении месяца И времени
    const calendarState = Variable.derive([time, monthOffset], (t, offset) => ({ time: t, offset }))

    return (
        <eventbox 
            onScrollEvent={(_, event) => {
                const now = Date.now()
                // Защита от слишком частых срабатываний (максимум 1 смена месяца в 250 мс)
                if (now - lastScrollTime < 250) return true
                lastScrollTime = now

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

function AnimatedGif() {
    const catGifPath = "/home/goto/Pictures/Wallpaper/herta-kurukuru.gif" 
    const gifSize = 200

    return (
        <box 
            valign={Gtk.Align.CENTER} 
            halign={Gtk.Align.CENTER}
            css="padding: 10px;"
            setup={(self) => {
                try {
                    const anim = GdkPixbuf.PixbufAnimation.new_from_file(catGifPath)
                    const iter = anim.get_iter(null)
                    const image = new Gtk.Image()
                    let timeoutId: number | null = null

                    const updateFrame = () => {
                        const pixbuf = iter.get_pixbuf().scale_simple(
                            gifSize, 
                            gifSize, 
                            GdkPixbuf.InterpType.BILINEAR
                        )
                        image.set_from_pixbuf(pixbuf)
                        
                        let delay = iter.get_delay_time()
                        if (delay <= 0) delay = 100

                        iter.advance(null)
                        timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
                            updateFrame()
                            return GLib.SOURCE_REMOVE
                        })
                    }

                    updateFrame()
                    self.add(image)
                    self.show_all()

                    // КРИТИЧЕСКИ ВАЖНО: Очищаем таймер при уничтожении виджета
                    self.connect('destroy', () => {
                        if (timeoutId) {
                            GLib.source_remove(timeoutId)
                        }
                    })
                } catch (e) {
                    console.error("Ошибка загрузки GIF:", e)
                }
            }}
        />
    )
}

function HourlyForecastWidget() {
    return (
        <box vertical spacing={8} valign={Gtk.Align.CENTER} css="padding: 10px; min-width: 80px;">
            {bind(hourlyForecast).as(forecast => {
                if (!forecast || forecast.length === 0) {
                    return <label label="Загрузка..." css="color: #c0caf5; font-size: 12px;" />
                }
                return forecast.map(hour => (
                    <box horizontal spacing={6} halign={Gtk.Align.CENTER}>
                        <label label={hour.time} css="color: #7dcfff; font-size: 12px; min-width: 35px;" />
                        <label label={hour.icon} css="color: #e0af68; font-size: 14px;" />
                        <label label={`${hour.temp}°`} css="color: #c0caf5; font-weight: bold; font-size: 12px;" />
                    </box>
                ))
            })}
        </box>
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
                <button
                    onClicked={() => {
                        const isOpen = !showCalendar.get()
                        showCalendar.set(isOpen)
                        // Запрашиваем данные ТОЛЬКО при открытии
                        if (isOpen) {
                            fetchHourlyForecast()
                        }
                    }}
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
                        <label label="|" css="color: rgba(190, 203, 247, 0.3); font-size: 13px;" />
                        <label 
                            label={bind(weatherData).as(w => w.icon)} 
                            css="color: #e0af68; font-size: 14px;" 
                        />
                        <label 
                            label={bind(weatherData).as(w => w.temp)} 
                            css="color: #c0caf5; font-weight: bold; font-size: 13px; font-family: 'JetBrains Mono', monospace;" 
                        />
                    </box>
                </button>

                {/* Условный рендеринг: виджеты создаются только когда isOpen === true */}
                {bind(showCalendar).as(isOpen => {
                    if (!isOpen) {
                        return <box css="min-height: 0px; min-width: 0px;" />
                    }
                    return (
                        <box horizontal spacing={16} valign={Gtk.Align.CENTER} css="padding-top: 8px; border-top: 1px solid rgba(122, 162, 247, 0.1); margin-top: 8px;">
                            <CalendarContent />
                            <AnimatedGif />
                            <HourlyForecastWidget />
                        </box>
                    )
                })}
            </box>
        </window>
    )
}