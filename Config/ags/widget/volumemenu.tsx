import { App, Astal, Gdk, Gtk } from "astal/gtk3"
import { bind } from "astal"
import Wp from "gi://AstalWp"

const css = `
    .VolumeMenu {
        background: transparent;
    }
    .volume-popup-card {
        background-color: rgba(17, 17, 27, 0.75);
        border: 1px solid rgba(137, 180, 250, 0.2);
        border-radius: 12px;
        padding: 6px 14px;
    }
    .volume-slider trough {
        min-height: 4px;
        border-radius: 2px;
        background-color: rgba(255, 255, 255, 0.15);
        border: none;
        box-shadow: none;
    }
    .volume-slider highlight {
        min-height: 4px;
        border-radius: 2px;
        /* Переход от мятного к родному зеленому цвету иконки #a6e3a1 */
        background-image: linear-gradient(90deg, #94e2d5, #a6e3a1);
        border: none;
    }
    .volume-slider slider {
        min-width: 10px;
        min-height: 10px;
        border-radius: 50%;
        background-image: none;
        background-color: #a6e3a1;
        border: 2px solid #11111b;
        box-shadow: none;
        margin: -3px;
    }
`

const provider = new Gtk.CssProvider()
provider.load_from_data(css)
Gtk.StyleContext.add_provider_for_screen(
    Gdk.Screen.get_default()!,
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
)

export default function VolumeMenu() {
    const audio = Wp.get_default()?.audio
    const speaker = audio?.default_speaker

    return (
        <window
            name="volume_menu"
            className="VolumeMenu"
            layer={Astal.Layer.OVERLAY}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
            marginTop={-1}
            marginRight={277}
            visible={false}
            keymode={Astal.Keymode.ON_DEMAND}
            onKeyPressEvent={(self, event: Gdk.Event) => {
                if (event.get_keyval()[1] === Gdk.KEY_Escape) {
                    self.hide()
                }
            }}
        >
            <box className="volume-popup-card" widthRequest={220}>
                {speaker && (
                    <slider
                        hexpand
                        className="volume-slider"
                        value={bind(speaker, "volume")}
                        onDragged={({ value }) => {
                            speaker.volume = value
                        }}
                    />
                )}
            </box>
        </window>
    )
}