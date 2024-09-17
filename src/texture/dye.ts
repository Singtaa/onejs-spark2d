import { Color, ComputeBuffer, ComputeShader, Mathf, RenderTexture, Shader } from "UnityEngine"
import { tex } from "./tex";
import { float4 } from "Unity/Mathematics";

const INPUT_A: number = Shader.PropertyToID("inputA");
const COLORS_LENGTH: number = Shader.PropertyToID("colorsLength");
const COLORS: number = Shader.PropertyToID("colors");
const POSITIONS: number = Shader.PropertyToID("positions");

interface RTProvider {
    rt: RenderTexture;
}

const _cacheMap = new WeakMap<RenderTexture, Dye>();

/**
 * Returns a horizontal gradient generator. 
 * [Mutable] Operations will modify the input texture.
 */
export function dye(tex: RenderTexture | RTProvider): Dye {
    let rt = "rt" in tex ? tex.rt : tex
    if (_cacheMap.has(rt)) {
        let d = _cacheMap.get(rt)
        d.firstRun = false
        return d
    }
    let d = new Dye(rt)
    _cacheMap.set(rt, d)
    return d
}

let _cachedInputA: RenderTexture;
let _cacheColorsBuffer: ComputeBuffer;
let _cachePositionsBuffer: ComputeBuffer;

export class Dye {
    /**
     * The underlying RenderTexture
     */
    get rt() {
        return this.#inputA;
    }

    set firstRun(value: boolean) {
        this.#firstRun = value;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #shader: ComputeShader;
    #kernel: number;
    #inputA: RenderTexture;

    #colors: Color[] = [];
    #positions: number[] = [];

    #bufferCapacity: number = 6;
    #colorsBuffer: ComputeBuffer;
    #colorsArray: CS.System.Array;
    #positionsBuffer: ComputeBuffer;
    #positionsArray: CS.System.Array;

    #firstRun: boolean = true;

    constructor(rt: RenderTexture) {
        this.#inputA = rt;
        this.#threadGroupsX = Mathf.CeilToInt(rt.width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(rt.height / 8);
        this.#shader = csDepot.Get("dye")
        this.#kernel = this.#shader.FindKernel("CSMain");
        this.initBuffers()
    }

    initBuffers() {
        this.#colorsArray = CS.System.Array.CreateInstance(puer.$typeof(float4), this.#bufferCapacity)
        for (let i = 0; i < this.#colors.length; i++) {
            this.#setColorsArrayValue(this.#colors[i], i)
        }
        this.#colorsBuffer = CS.Spark2D.ComputeUtil.CreateBuffer(puer.$typeof(float4), this.#colorsArray)

        this.#positionsArray = CS.System.Array.CreateInstance(puer.$typeof(CS.System.Single), this.#bufferCapacity)
        for (let i = 0; i < this.#positions.length; i++) {
            this.#setPositionsArrayValue(this.#positions[i], i)
        }
        this.#positionsBuffer = CS.Spark2D.ComputeUtil.CreateBuffer(puer.$typeof(CS.System.Single), this.#positionsArray)
    }

    /**
     * Reset the colors and positions arrays, but not the internal computer buffers. 
     * Useful for when you want to reuse the internal computer buffers during animation loops.
     */
    reset() {
        this.#colors.length = 0;
        this.#positions.length = 0;

        return this;
    }

    /**
     * Run the callback only once on the first run. Useful for when you need to use dye()
     * in an animation loop but only want to set the colors once, for example.
     */
    firstRunOnly(cb: (d: Dye) => void): Dye {
        if (this.#firstRun) {
            cb(this);
            this.#firstRun = false;
        }
        return this;
    }

    dispatch() {
        if (this.#colors.length === 0) {
            throw new Error("'dye()': No colors added. You need at least one color for generating a gradient.");
        }

        this.#shader.SetInt(COLORS_LENGTH, this.#colors.length);
        this.#setTextureForInputA(this.#inputA);
        this.#setBuffers();

        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
        return this;
    }

    add(color: Color, position: number) {
        this.#colors.push(color);
        const prevPosition = this.#positions.length > 0 ? this.#positions[this.#positions.length - 1] : 0;
        const pos = Math.max(position, prevPosition);
        this.#positions.push(pos);

        this.#setColorsArrayValue(color, this.#colors.length - 1)
        this.#setPositionsArrayValue(pos, this.#positions.length - 1)

        if (this.#colors.length >= this.#bufferCapacity) {
            this.#bufferCapacity *= 2;
            this.initBuffers()
        }

        return this;
    }

    #setColorsArrayValue(color: Color, index: number) {
        // this.#colorsArray.SetValue(new float4(color.r, color.g, color.b, color.a), index)
        CS.OneJS.Utils.FloatConvUtil.SetFloat4Value(this.#colorsArray, new float4(color.r, color.g, color.b, color.a), index)
    }

    #setPositionsArrayValue(position: number, index: number) {
        CS.OneJS.Utils.FloatConvUtil.SetFloatValue(this.#positionsArray, position, index)
    }

    #setTextureForInputA(rt: RenderTexture): void { // Cached
        if (_cachedInputA !== rt) {
            this.#shader.SetTexture(this.#kernel, INPUT_A, rt);
            _cachedInputA = rt;
        }
    }

    #setBuffers(): void {
        this.#colorsBuffer.SetData(this.#colorsArray);
        if (_cacheColorsBuffer !== this.#colorsBuffer) {
            this.#shader.SetBuffer(this.#kernel, COLORS, this.#colorsBuffer);
            _cacheColorsBuffer = this.#colorsBuffer;
        }
        this.#positionsBuffer.SetData(this.#positionsArray);
        if (_cachePositionsBuffer !== this.#positionsBuffer) {
            this.#shader.SetBuffer(this.#kernel, POSITIONS, this.#positionsBuffer);
            _cachePositionsBuffer = this.#positionsBuffer;
        }
    }
}