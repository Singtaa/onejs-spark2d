import { ComputeShader, Graphics, Mathf, RenderTexture, RenderTextureFormat, Shader } from "UnityEngine";

const TEX1: number = Shader.PropertyToID("tex1");
const RESULT: number = Shader.PropertyToID("result");
const OPERATION: number = Shader.PropertyToID("operation");

interface RTProvider {
    rt: RenderTexture;
}

enum Operation {
    SpreadR = 0,
    SpreadG = 1,
    SpreadB = 2,
}

/**
 * Returns a wrapper that allows you to do channel-related operations on the passed in RenderTexture.
 * [Immutable] Operations will not modify the input texture. (input and result textures may have different formats)
 */
export function channel(tex: RenderTexture | RTProvider) {
    return new Channel("rt" in tex ? tex.rt : tex);
}

export class Channel {
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
    #input: RenderTexture;  // The original texture
    #result: RenderTexture;

    constructor(rt: RenderTexture) {
        const { width, height } = rt;
        this.#input = rt;
        this.#result = CS.Spark2D.RenderTextureUtil.InitNew(rt, RenderTextureFormat.ARGBFloat);
        Graphics.Blit(rt, this.#result);
        this.#threadGroupsX = Mathf.CeilToInt(width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(height / 8);
        this.#shader = csDepot.Get("channel");
        this.#kernel = this.#shader.FindKernel("CSMain");
    }

    #dispatch() {
        this.#shader.SetTexture(this.#kernel, RESULT, this.#result);

        Graphics.SetRenderTarget(this.#input);
        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
    }

    blit(rt: RenderTexture): Channel {
        Graphics.Blit(rt, this.#result);
        return this;
    }

    /**
     * Spread the channel R to all 3 channels (rgb)
     */
    spreadR() {
        this.#shader.SetInt(OPERATION, Operation.SpreadR);
        this.#dispatch();
        return this;
    }

    /**
     * Spread the channel G to all 3 channels (rgb)
     */
    spreadG() {
        this.#shader.SetInt(OPERATION, Operation.SpreadG);
        this.#dispatch();
        return this;
    }

    /**
     * Spread the channel B to all 3 channels (rgb)
     */
    spreadB() {
        this.#shader.SetInt(OPERATION, Operation.SpreadB);
        this.#dispatch();
        return this;
    }
}