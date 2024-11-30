import { tex } from "src/texture/tex";
import { ComputeShader, Graphics, Mathf, RenderTexture, Shader } from "UnityEngine";

const RESULT: number = Shader.PropertyToID("result");
const INPUT_A: number = Shader.PropertyToID("inputA");
const INPUT_B: number = Shader.PropertyToID("inputB");
const T: number = Shader.PropertyToID("t");

interface RTProvider {
    rt: RenderTexture;
}

let _cachedInputA: RenderTexture;
let _cachedInputB: RenderTexture;
let _cachedResult: RenderTexture;

/**
 * Returns a wrapper that allows you to perform smooth union interpolation between two textures.
 * [New RT] A new RenderTexture will be created for the result.
 */
export function morph(inputA: RenderTexture | RTProvider, inputB: RenderTexture | RTProvider): Morph {
    return new Morph(
        "rt" in inputA ? inputA.rt : inputA,
        "rt" in inputB ? inputB.rt : inputB,
    );
}

export class Morph {
    /**
     * The result RenderTexture
     */
    get rt() {
        return this.#result;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #shader: ComputeShader;
    #kernel: number;
    #inputA: RenderTexture;
    #inputB: RenderTexture;
    #result: RenderTexture;

    #t: number = 0;

    constructor(inputA: RenderTexture, inputB: RenderTexture) {
        const { width, height } = inputA;
        this.#inputA = inputA;
        this.#inputB = inputB;
        this.#t = 0;

        this.#threadGroupsX = Mathf.CeilToInt(width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(height / 8);
        this.#result = tex(inputA).clone().rt;
        this.#shader = csDepot.Get("morph");
        this.#kernel = this.#shader.FindKernel("CSMain");
    }

    /**
     * Set the interpolation factor
     * @param value The interpolation factor (0 to 1)
     */
    t(value: number): Morph {
        this.#t = Mathf.Clamp01(value);
        return this;
    }

    /**
     * Execute the linear interpolation and return the result RenderTexture
     */
    dispatch(): Morph {
        this.#setTextureForInputA(this.#inputA);
        this.#setTextureForInputB(this.#inputB);
        this.#setTextureForResult(this.#result);
        this.#shader.SetFloat(T, this.#t);

        Graphics.SetRenderTarget(this.#result);
        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
        return this;
    }

    #setTextureForInputA(rt: RenderTexture): void {
        if (_cachedInputA !== rt) {
            this.#shader.SetTexture(this.#kernel, INPUT_A, rt);
            _cachedInputA = rt;
        }
    }

    #setTextureForInputB(rt: RenderTexture): void {
        if (_cachedInputB !== rt) {
            this.#shader.SetTexture(this.#kernel, INPUT_B, rt);
            _cachedInputB = rt;
        }
    }

    #setTextureForResult(rt: RenderTexture): void {
        if (_cachedResult !== rt) {
            this.#shader.SetTexture(this.#kernel, RESULT, rt);
            _cachedResult = rt;
        }
    }
}