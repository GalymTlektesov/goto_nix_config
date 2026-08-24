import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar, { CalendarWidget } from "./widget/Bar" // Импортируем и Bar, и календарь
import { PowerMenu, LeftModulesBar } from './widget/powermenu';
//import VolumeMenu from './widget/volumemenu';
import RightBar from "./widget/RightBar"

App.start({
    css: style,
    main() {
        LeftModulesBar()
        App.get_monitors().map(monitor => {
            Bar(monitor)
            CalendarWidget(monitor)
            RightBar(monitor)
        })
        //App.add_window(VolumeMenu())
    },
})