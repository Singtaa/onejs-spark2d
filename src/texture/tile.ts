import { ComputeShader, Graphics, Mathf, RenderTexture, Shader } from "UnityEngine";

const RESULT: number = Shader.PropertyToID("result");
const TEX1: number = Shader.PropertyToID("tex1");
const OFFSET: number = Shader.PropertyToID("offset");
const ROTATION: number = Shader.PropertyToID("rotation");
const SCALE: number = Shader.PropertyToID("scale");

interface RTProvider {
    rt: RenderTexture;
}

/**
 * This is the [Immutable] version of `trans`. It keeps the original texture unchanged, so that 
 * you can do consecutive transformations without getting artifacts.
 */
export function tile(tex: RenderTexture | RTProvider) {
    return new Tile("rt" in tex ? tex.rt : tex);
}

export class Tile {
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
    #tex1: RenderTexture; // The original texture
    #result: RenderTexture;

    #u: number = 0
    #v: number = 0
    #rot: number = 0
    #scaleX: number = 1
    #scaleY: number = 1

    constructor(rt: RenderTexture) {
        const { width, height } = rt;
        this.#tex1 = rt;
        this.#threadGroupsX = Mathf.CeilToInt(width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(height / 8);
        this.#result = CS.Spark2D.RenderTextureUtil.CreateRFloatRT(width, height);
        this.#shader = csDepot.Get("trans");
        this.#kernel = this.#shader.FindKernel("CSMain");
    }

    /**
     * Translate (in UV space) the texture by the given offset
     */
    offset(u: number, v: number) {
        this.#u = u;
        this.#v = v;
        return this;
    }

    /**
     * Rotate the texture by the given angle in degrees
     */
    rot(rot: number) { // in degrees
        this.#rot = rot * Mathf.Deg2Rad;
        return this;
    }

    /**
     * Rotate the texture by the given angle in radians
     */
    rotr(rot: number) { // in radians
        this.#rot = rot;
        return this;
    }

    /**
     * Scale the texture by the given factor
     */
    scale(x: number, y?: number) {
        this.#scaleX = x;
        this.#scaleY = y ?? x;
        return this;
    }

    /**
     * Execute the transformations and returns the result RenderTexture
     */
    dispatch() {
        this.#shader.SetTexture(this.#kernel, TEX1, this.#tex1);
        this.#shader.SetTexture(this.#kernel, RESULT, this.#result);
        this.#shader.SetFloats(OFFSET, this.#u, this.#v);
        this.#shader.SetFloat(ROTATION, this.#rot);
        this.#shader.SetFloats(SCALE, this.#scaleX, this.#scaleY);

        Graphics.SetRenderTarget(this.#result);
        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
        return this.#result;
    }
}