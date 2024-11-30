import { Color, ComputeShader, Graphics, Mathf, RenderTexture, Shader, Vector4 } from "UnityEngine";

const RESULT: number = Shader.PropertyToID("result");
const TEX1: number = Shader.PropertyToID("tex1");
const OFFSET: number = Shader.PropertyToID("offset");
const ROTATION: number = Shader.PropertyToID("rotation");
const SCALE: number = Shader.PropertyToID("scale");
const TILING: number = Shader.PropertyToID("tiling");
const BG_COLOR: number = Shader.PropertyToID("bgColor");

interface RTProvider {
    rt: RenderTexture;
}

/**
 * Returns a wrapper that allows you to do transformations on the passed in RenderTexture.
 * [Mutable] Operations will modify the input texture.
 * [Op Dispatch] Operations will dispatch immediately.
 */
export function trans(tex: RenderTexture | RTProvider) {
    return new Trans("rt" in tex ? tex.rt : tex);
}

export class Trans {
    /**
     * The result RenderTexture
     */
    get rt() {
        return this.#input;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #shader: ComputeShader;
    #kernel: number;
    #input: RenderTexture; // The original texture
    #result: RenderTexture; // Buffer texture used for ping-pong

    #u: number = 0
    #v: number = 0
    #rot: number = 0
    #scaleX: number = 1
    #scaleY: number = 1
    #tiling: boolean = false
    #bgColor: Color = Color.clear

    constructor(rt: RenderTexture) {
        const { width, height } = rt;
        this.#input = rt;
        this.#result = CS.Spark2D.RenderTextureUtil.InitNew(rt);
        this.#threadGroupsX = Mathf.CeilToInt(width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(height / 8);
        this.#shader = csDepot.Get("trans");
        this.#kernel = this.#shader.FindKernel("CSMain");
    }

    dispatch() {
        this.#shader.SetTexture(this.#kernel, TEX1, this.#input);
        this.#shader.SetTexture(this.#kernel, RESULT, this.#result);
        // this.#shader.SetFloats(OFFSET, this.#u, this.#v);
        this.#shader.SetVector(OFFSET, new Vector4(this.#u, this.#v));
        this.#shader.SetFloat(ROTATION, this.#rot);
        // this.#shader.SetFloats(SCALE, this.#scaleX, this.#scaleY);
        this.#shader.SetVector(SCALE, new Vector4(this.#scaleX, this.#scaleY));

        Graphics.SetRenderTarget(this.#input);
        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
        Graphics.Blit(this.#result, this.#input);
    }

    tile(v = true) {
        this.#tiling = v;
        return this;
    }

    bgColor(c: Color) {
        this.#bgColor = c;
        return this;
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
}