import { ComputeShader, FilterMode, Graphics, Mathf, RenderTexture, RenderTextureFormat, Shader, Vector2, Vector4 } from "UnityEngine";

const RESULT: number = Shader.PropertyToID("result");
const SCALE: number = Shader.PropertyToID("scale");
const OFFSET: number = Shader.PropertyToID("offset");
const ROTATION: number = Shader.PropertyToID("rotation");
const OCTAVES: number = Shader.PropertyToID("octaves");
const LACUNARITY: number = Shader.PropertyToID("lacunarity");
const GAIN: number = Shader.PropertyToID("gain");
const SEED: number = Shader.PropertyToID("seed");

/**
 * Returns an FBM (Fractional Brownian Motion) noise generator. 
 * [New RT] A new RenderTexture will be created.
 */
export function fbm(width?: number, height?: number) {
    width = width ?? 512;
    height = height ?? width;
    return new FBM(width, height);
}

export class FBM {
    /**
     * The underlying RenderTexture
     */
    get rt() {
        return this.#texture;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #texture: RenderTexture;
    #shader: ComputeShader;
    #kernel: number;

    #scale: number = 2;
    #offsetX: number = 0;
    #offsetY: number = 0;
    #rotation: number = 0;
    #octaves: number = 5;
    #lacunarity: number = 2;
    #gain: number = 0.5;
    #seed: number = 0;

    constructor(width: number, height: number) {
        this.#threadGroupsX = Mathf.CeilToInt(width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(height / 8);
        this.#texture = CS.Spark2D.RenderTextureUtil.CreateRT(width, height);
        this.#texture.filterMode = FilterMode.Point;
        this.#shader = csDepot.Get("fbm")
        this.#kernel = this.#shader.FindKernel("CSMain");
    }

    seed(value: number) {
        this.#seed = value;
        return this;
    }

    offset(x: number, y: number) {
        this.#offsetX = x;
        this.#offsetY = y;
        return this;
    }

    rot(r: number) {
        this.#rotation = r;
        return this;
    }

    scale(value: number) {
        this.#scale = value;
        return this;
    }

    octaves(value: number) {
        this.#octaves = Mathf.Clamp(Math.floor(value), 1, 10);
        return this;
    }

    lacunarity(value: number) {
        this.#lacunarity = Mathf.Max(value, 1);
        return this;
    }

    gain(value: number) {
        this.#gain = Mathf.Clamp01(value);
        return this;
    }

    dispatch() {
        this.#shader.SetTexture(this.#kernel, RESULT, this.#texture);
        this.#shader.SetFloat(SCALE, this.#scale);
        // this.#shader.SetFloats(OFFSET, this.#offsetX, this.#offsetY); // SetFloats allocs
        this.#shader.SetVector(OFFSET, new Vector4(this.#offsetX, this.#offsetY));
        this.#shader.SetInt(OCTAVES, this.#octaves);
        this.#shader.SetFloat(LACUNARITY, this.#lacunarity);
        this.#shader.SetFloat(GAIN, this.#gain);
        this.#shader.SetFloat(ROTATION, this.#rotation);
        this.#shader.SetFloat(SEED, this.#seed);

        Graphics.SetRenderTarget(this.#texture);
        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
        return this.#texture;
    }
}