import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar, { CalendarWidget } from "./widget/Bar" // Импортируем и Bar, и календарь

App.start({
    css: style,
    main() {
        App.get_monitors().map(monitor => {
            Bar(monitor)
            CalendarWidget(monitor)
        })
    },
})