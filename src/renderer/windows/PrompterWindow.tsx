import { useState, useEffect } from "react";
import PrompterView from "../components/prompter/PrompterView";

/** Radius of the outward curves at the top corners. */
const CURVE = 20;
/** Radius of the standard rounded corners at the bottom. */
const BOTTOM_RADIUS = 24;

export default function PrompterWindow() {
    const [size, setSize] = useState({
        w: window.innerWidth,
        h: window.innerHeight,
    });

    useEffect(() => {
        const onResize = () =>
            setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const { w, h } = size;
    const C = CURVE;
    const BR = BOTTOM_RADIUS;

    // SVG path describing the notch shape:
    //   - Full width at the top (connects to the notch area)
    //   - Outward curves narrow to the body width
    //   - Body extends down with standard rounded bottom corners
    const d = [
        `M 0 0`,
        `L ${w} 0`,
        `A ${C} ${C} 0 0 0 ${w - C} ${C}`,
        `L ${w - C} ${h - BR}`,
        `A ${BR} ${BR} 0 0 1 ${w - C - BR} ${h}`,
        `L ${C + BR} ${h}`,
        `A ${BR} ${BR} 0 0 1 ${C} ${h - BR}`,
        `L ${C} ${C}`,
        `A ${C} ${C} 0 0 0 0 0`,
        `Z`,
    ].join(" ");

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                background: "black",
                clipPath: `path('${d}')`,
                overflow: "hidden",
                paddingTop: 8,
                paddingLeft: C,
                paddingRight: C,
            }}
        >
            <PrompterView />
        </div>
    );
}
