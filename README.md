(WIP)

This is the JS bindings and wrappers for [Spark2D](https://github.com/Singtaa/Spark2D). You can use this in any [OneJS](https://onejs.com)-enabled Unity projects and games.

## Installation

```bash
npm i spark2d
```

`spark2d` requires you to expose the provided ComputeShaderDepot as `csDepot` in ScriptEngine's Globals list.

Documentation will be available when `spark2d` is a bit more mature. For the time-being, here's a quick sample.

https://github.com/user-attachments/assets/851eb853-699b-4f65-9ae3-d7837f000c68

```tsx
import { h, render } from "preact"
import { Slider } from "comps/slider"
import { Image } from "UnityEngine/UIElements"
import { useEffect, useRef } from "preact/hooks"
import { Color, Mathf, RenderTexture, Time } from "UnityEngine"
import { blur, dye, fbm, grad, maop, sdfield, ShapeType, trans } from "spark2d"

interface ShapeProps {
    class?: string
    shape: Uncapitalize<keyof typeof ShapeType>
    args: number[]
    rounded?: number
    scale?: number
}

interface Params {
    rotOffset: number
    scaleOffset: number
    scaleSpeed: number
    rotSpeed: number
    color: Color
    auraColor: Color
    auraColorZeroAlpha: Color
}

const tweened = { value: 0 }

const noise1 = fbm(512).scale(0.65).lacunarity(3.4).octaves(3).gain(0.9)
const noise2 = fbm(512).scale(1.25).lacunarity(3.4).octaves(2).gain(0.9)

setInterval(() => {
    var time = Time.realtimeSinceStartupAsDouble * 1.2

    noise1.offset(0, time).rot(0).dispatch()
    maop(noise1.rt).multiply(0.15).add(0.5).pow(2.2).clamp(0, 1)

    noise2.offset(2, 0.431 * time).rot(0).dispatch()
    maop(noise2.rt).multiply(0.15).add(0.5).pow(2.2).clamp(0, 1)

    maop(noise1.rt).multiply(noise2.rt)
})

var gradient = grad(512).add(Color.black, 0).add(Color.white, 1).dispatch()
trans(gradient).rot(-90)
maop(gradient).pow(1.5)

const Shape = ({ shape, args, class: className, rounded, scale }: ShapeProps) => {
    const ref = useRef<Element>()
    const params = useRef<Params>({
        rotOffset: Math.random() * 360,
        scaleOffset: Math.random() * 2 * Math.PI,
        scaleSpeed: Math.random() + 2,
        rotSpeed: (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 10 + 20),
        color: getRandomPaletteColor(),
        auraColor: getRandomAuraColor(),
        auraColorZeroAlpha: new Color(0, 0, 0, 0)
    })

    useEffect(() => {
        const { r, g, b } = params.current.auraColor;
        params.current.auraColorZeroAlpha = new Color(r, g, b, 0)
        animate()

        var id = setInterval(animate)
        return () => clearInterval(id)
    }, [])

    function animate() {
        const img = ref.current.ve as Image
        var time = Time.realtimeSinceStartupAsDouble * 1.2
        const { rotOffset, scaleOffset, scaleSpeed, rotSpeed, color, auraColor, auraColorZeroAlpha } = params.current
        const field = (img.image ? sdfield(img.image as RenderTexture) : sdfield(512))
            .rounded(rounded || 0)
            .scale((scale || 1) + Math.sin(time * scaleSpeed + scaleOffset) * 0.1)
            .rot(time * rotSpeed + rotOffset)
        const rt = field[shape].apply(field, args).rt
        maop(rt).clamp(0, 1).oneMinus()

        const t = tweened.value
        const r = Mathf.Lerp(1, 100, t)
        const a = Mathf.Lerp(0.01, .2, t)
        const b = Mathf.Lerp(0, .22, t)
        const c = Mathf.Lerp(1, .7, t)
        const d = Mathf.Lerp(1, .72, t)
        const lastColor = Color.Lerp(color, Color.white, t)

        blur(rt).radius(r).mask(gradient.rt).dispatch()

        if (t <= 0.01) {
            dye(rt).firstRunOnly((d) => d.add(new Color(0, 0, 0, 0), 0).add(color, 1)).dispatch()
        } else {
            maop(rt).multiply(noise1.rt).multiply(15).clamp(0, 1)
            dye(rt).reset().add(auraColorZeroAlpha, 0).add(auraColor, a).add(color, b)
                .add(color, c).add(lastColor, d).add(lastColor, 1.5).dispatch()
        }

        img.image = rt
    }

    return <image ref={ref} class={className} style={{ borderWidth: 1, borderColor: new Color(1, 1, 1, 0.05) }} />
}

const App = () => {
    function onChange(value: number) {
        tweened.value = value
    }

    return <div class="w-full h-full flex-col justify-center items-center p-2">
        <div class="flex-row justify-center items-center flex-wrap p-2">
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="circle" args={[50]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="roundedBox" args={[38, 60, 10, 10, 20, 10]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="segment" args={[0, 40, 0, -40]} rounded={12} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="rhombus" args={[38, 60]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="trapezoid" args={[38, 60, 42]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="equilateralTriangle" args={[54]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="unevenCapsule" args={[40, 30, 40]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="pentagon" args={[50]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="hexagon" args={[50]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="octogon" args={[50]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="hexagram" args={[36]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="star5" args={[32, 2.5]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="pie" args={[-0.9, 0.3, 70]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="cutDisk" args={[60, -40]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="arc" args={[-0.9, -.8, 50, 14]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="vesica" args={[70, 20]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="moon" args={[40, 60, 55]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="egg" args={[45, 0.2]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="cross" args={[70, 30, 10]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="ellipse" args={[70, 50]} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="blobbyCross" args={[-50]} rounded={20} />
            <Shape class="w-[256px] h-[256px] my-1 mx-4" shape="tunnel" args={[55, 55]} />
        </div>
        <div class="w-full p-6">
            <Slider class="w-full" onChange={onChange} />
        </div>
    </div>
}

const colorPalette = [
    new Color(1, 0.435, 0.380, 1),      // Coral (#FF6F61)
    new Color(0.420, 0.357, 0.584, 1),  // Purple (#6B5B95)
    new Color(0.533, 0.690, 0.294, 1),  // Green (#88B04B)
    new Color(0.969, 0.792, 0.788, 1),  // Pink (#F7CAC9)
    new Color(0.573, 0.659, 0.820, 1),  // Blue (#92A8D1)
    new Color(0.584, 0.322, 0.318, 1),  // Mauve (#955251)
    new Color(0.710, 0.396, 0.655, 1),  // Orchid (#B565A7)
    new Color(0, 0.608, 0.467, 1),      // Teal (#009B77)
    new Color(0.867, 0.255, 0.141, 1),  // Red (#DD4124)
    new Color(0.839, 0.314, 0.463, 1)   // Raspberry (#D65076)
];

const auraColors = [
    new Color(0.5, 0.3, 0, 1)
]

function getRandomPaletteColor(): Color {
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    return colorPalette[randomIndex];
}

function getRandomAuraColor(): Color {
    const randomIndex = Math.floor(Math.random() * auraColors.length);
    return auraColors[randomIndex];
}

render(<App />, document.body)
```

### Zero-alloc Interop

For completeness, here's the Puerts Config that will make the JS-C# interop as performant as possible and allocation-free. See [the OneJS page](https://onejs.com/docs/v2.0/rainbow-bars) for more info.

```cs
using System;
using System.Collections.Generic;
using OneJS.Utils;
using Puerts;
using Spark2D;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.UIElements;

namespace OneJSContainer {
    [Configure]
    public class OneJSContainerPuertsCfg {
        [CodeOutputDirectory]
        static string OutputDir => Application.dataPath + "/_gen/";
        
        [Binding]
        static IEnumerable<Type> Bindings {
            get {
                return new List<Type>() {
                    typeof(Rect),
                    typeof(Color),
                    typeof(Color32),
                    typeof(Vector2),
                    typeof(Vector3),
                    typeof(Vector4),
                    typeof(float2),
                    typeof(float3),
                    typeof(float4),
                    typeof(Mathf),
                    typeof(FloatConvUtil),
                    typeof(ComputeUtil),
                    typeof(Quaternion),
                    typeof(VisualElement),
                    typeof(Image),
                    typeof(MeshGenerationContext),
                    typeof(Painter2D),
                    typeof(OneJS.Dom.Document),
                    typeof(OneJS.Dom.Dom),
                    typeof(OneJS.Dom.DomStyle),
                    typeof(Array),
                    typeof(Time),
                    typeof(ComputeShader),
                    typeof(ComputeBuffer),
                    typeof(RenderTexture),
                    typeof(Graphics),
                    typeof(SystemInfo)
                };
            }
        }

        [BlittableCopy]
        static IEnumerable<Type> Blittables {
            get {
                return new List<Type>() {
                    typeof(Rect),
                    typeof(Color),
                    typeof(Color32),
                    typeof(Vector2),
                    typeof(Vector3),
                    typeof(Vector4),
                    typeof(float2),
                    typeof(float3),
                    typeof(float4),
                    typeof(Quaternion),
                };
            }
        }
    }
}
```
