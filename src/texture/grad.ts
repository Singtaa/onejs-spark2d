import { Color, ComputeBuffer, ComputeShader, Mathf, RenderTexture, Shader } from "UnityEngine"
import { tex } from "./tex";
import { float4 } from "Unity/Mathematics";

const INPUT_A: number = Shader.PropertyToID("inputA");
const COLORS_LENGTH: number = Shader.PropertyToID("colorsLength");
const COLORS: number = Shader.PropertyToID("colors");
const POSITIONS: number = Shader.PropertyToID("positions");

/**
 * Returns a horizontal gradient generator. 
 */
export function grad(rt: RenderTexture): Grad
export function grad(width: number, height?: number): Grad
export function grad(a: RenderTexture | number, b?: number): Grad {
    let t = typeof a === "number" ? tex(a, b) : tex(a);
    return new Grad(t.rt);
}


let _cachedInputA: RenderTexture;

export class Grad {
    /**
     * The underlying RenderTexture
     */
    get rt() {
        return this.#inputA;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #shader: ComputeShader;
    #kernel: number;
    #inputA: RenderTexture;

    #colors: Color[] = [];
    #positions: number[] = [];

    constructor(rt: RenderTexture) {
        this.#inputA = rt;
        this.#threadGroupsX = Mathf.CeilToInt(rt.width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(rt.height / 8);
        this.#shader = csDepot.Get("grad")
        this.#kernel = this.#shader.FindKernel("CSMain");
    }

    dispatch() {
        if (this.#colors.length === 0) {
            throw new Error("'grad()': No colors added. You need at least one color for generating a gradient.");
        }
        this.#setTextureForInputA(this.#inputA);
        this.#shader.SetInt(COLORS_LENGTH, this.#colors.length);

        this.#setBuffers();

        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);

        return this;
    }

    add(color: Color, position: number) {
        this.#colors.push(color);
        const prevPosition = this.#positions.length > 0 ? this.#positions[this.#positions.length - 1] : 0;
        this.#positions.push(Mathf.Max(position, prevPosition));

        return this;
    }

    #setTextureForInputA(rt: RenderTexture): void { // Cached
        if (_cachedInputA !== rt) {
            this.#shader.SetTexture(this.#kernel, INPUT_A, rt);
            _cachedInputA = rt;
        }
    }

    #setBuffers(): void { // TODO cache
        const colorsBuffer = CS.Spark2D.ComputeUtil.CreateBuffer(puer.$typeof(float4), colorsToFloat4s(this.#colors, puer.$typeof(float4)));
        const positionsBuffer = CS.Spark2D.ComputeUtil.CreateBuffer(puer.$typeof(CS.System.Single), CS.OneJS.Utils.FloatConvUtil.CreateFloatBuffer(this.#positions));

        this.#shader.SetBuffer(this.#kernel, COLORS, colorsBuffer);
        this.#shader.SetBuffer(this.#kernel, POSITIONS, positionsBuffer);
    }
}

function colorsToFloat4s(colors: Color[], type) {
    type = type || puer.$typeof(float4)
    let arr = CS.System.Array.CreateInstance(type, colors.length)
    for (let i = 0; i < arr.Length; i++) {
        arr.SetValue(new float4(colors[i].r, colors[i].g, colors[i].b, colors[i].a), i)
    }
    return arr
}

function jsArrToCsArr(jsarr, type) {
    type = type || puer.$typeof(CS.System.Object)
    let arr = CS.System.Array.CreateInstance(type, jsarr.length)
    // @ts-ignore
    CS.OneJS.Runtime.Utils.FloatConvUtil.CreateFloatBuffer([123, 234]);
    for (let i = 0; i < arr.Length; i++) {
        arr.SetValue(jsarr[i], i)
    }
    return arr
}