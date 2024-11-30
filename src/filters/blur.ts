import { tex } from "src/texture/tex";
import { Color, ComputeShader, Graphics, Mathf, RenderTexture, Shader, Texture2D, TextureFormat, Vector4 } from "UnityEngine";

const RESULT: number = Shader.PropertyToID("result");
const INPUT: number = Shader.PropertyToID("input");
const BLUR_MASK: number = Shader.PropertyToID("blurMask");
const BLUR_RADIUS: number = Shader.PropertyToID("blurRadius");
const BLUR_SIGMA: number = Shader.PropertyToID("blurSigma");

interface RTProvider {
    rt: RenderTexture;
}

const __pixelTex = CS.Spark2D.RenderTextureUtil.CreateSinglePixelTexture(Color.white);

const _cacheMap = new WeakMap<RenderTexture, Blur>();

/**
 * Returns a wrapper that allows you to apply a Gaussian blur to the passed in RenderTexture.
 * [Mutable] Operations will modify the input texture.
 * [New RT] Will create a new RenderTexture internally for buffering.
 * [Cached RT] Subsequent calls with the same RenderTexture will return the same instance.
 */
export function blur(input: RenderTexture | RTProvider) {
    let rt = "rt" in input ? input.rt : input;
    if (_cacheMap.has(rt)) return _cacheMap.get(rt);
    const b = new Blur("rt" in input ? input.rt : input);
    _cacheMap.set(rt, b);
    return b;
}

export class Blur {
    /**
     * The result RenderTexture
     */
    get rt() {
        return this.#result;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #shader: ComputeShader;
    #kernelHorizontal: number;
    #kernelVertical: number;
    #input: RenderTexture;
    #result: RenderTexture;

    #radius: number = 5;
    #sigma: number = 2;
    #blurMask: RenderTexture;

    constructor(rt: RenderTexture) {
        const { width, height } = rt;
        this.#input = rt;
        this.#result = CS.Spark2D.RenderTextureUtil.InitNew(rt);
        this.#threadGroupsX = Mathf.CeilToInt(width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(height / 8);
        this.#shader = csDepot.Get("blur");
        this.#kernelHorizontal = this.#shader.FindKernel("HorizontalBlur");
        this.#kernelVertical = this.#shader.FindKernel("VerticalBlur");

        this.#blurMask = __pixelTex;
    }

    /**
     * Set the blur radius. Must be between 1 and 32.
     */
    radius(value: number) {
        this.#radius = Mathf.Clamp(Math.floor(value), 1, 1024);
        this.#sigma = this.#radius / 3.0;
        return this;
    }

    /**
     * Set the blur sigma (standard deviation). Must be greater than 0.
     */
    sigma(value: number) {
        this.#sigma = Mathf.Max(value, 0.1);
        return this;
    }

    mask(tex: RenderTexture) {
        this.#blurMask = tex;
        return this;
    }

    /**
     * Apply the blur and return the result RenderTexture.
     */
    dispatch() {
        // Set common properties
        this.#shader.SetInt(BLUR_RADIUS, this.#radius);
        this.#shader.SetFloat(BLUR_SIGMA, this.#sigma);

        // Horizontal pass
        this.#shader.SetTexture(this.#kernelHorizontal, BLUR_MASK, this.#blurMask);
        this.#shader.SetTexture(this.#kernelHorizontal, INPUT, this.#input);
        this.#shader.SetTexture(this.#kernelHorizontal, RESULT, this.#result);
        this.#shader.Dispatch(this.#kernelHorizontal, this.#threadGroupsX, this.#threadGroupsY, 1);

        // Vertical pass (ping pong)
        this.#shader.SetTexture(this.#kernelVertical, BLUR_MASK, this.#blurMask);
        this.#shader.SetTexture(this.#kernelVertical, INPUT, this.#result);
        this.#shader.SetTexture(this.#kernelVertical, RESULT, this.#input);
        this.#shader.Dispatch(this.#kernelVertical, this.#threadGroupsX, this.#threadGroupsY, 1);

        return this.#result;
    }
}