import { ComputeShader, Graphics, Mathf, RenderTexture, Shader, Vector2, Vector4 } from "UnityEngine";

const TEX1: number = Shader.PropertyToID("tex1");
const TEX2: number = Shader.PropertyToID("tex2");
const BLEND_MODE: number = Shader.PropertyToID("blendMode");
const OPACITY: number = Shader.PropertyToID("opacity");

enum BlendMode {
    Normal = 0,
    Dissolve = 1,
    Overlay = 2,
    Multiply = 3,
    Difference = 4
}

interface RTProvider {
    rt: RenderTexture;
}

/**
 * Returns a wrapper that allows you to blend two textures.
 * [Mutable] Operations will modify the input texture.
 */
export function blend(input: RenderTexture | RTProvider) {
    return new Blend("rt" in input ? input.rt : input);
}

export class Blend {
    /**
     * The underlying RenderTexture
     */
    get rt() {
        return this.#tex1;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #shader: ComputeShader;
    #kernel: number;
    #tex1: RenderTexture;

    constructor(input: RenderTexture) {
        this.#tex1 = input;
        this.#threadGroupsX = Mathf.CeilToInt(input.width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(input.height / 8);
        this.#shader = csDepot.Get("blend");
        this.#kernel = this.#shader.FindKernel("CSMain");
    }

    #dispatch(tex2: RenderTexture, blendMode: BlendMode, opacity: number) {
        this.#shader.SetTexture(this.#kernel, TEX1, this.#tex1);
        this.#shader.SetTexture(this.#kernel, TEX2, tex2);
        this.#shader.SetInt(BLEND_MODE, blendMode);
        this.#shader.SetFloat(OPACITY, opacity);

        Graphics.SetRenderTarget(this.#tex1);
        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
    }

    normal(tex2: RenderTexture, opacity: number = 1): Blend {
        this.#dispatch(tex2, BlendMode.Normal, opacity);
        return this;
    }

    dissolve(tex2: RenderTexture, opacity: number = 1): Blend {
        this.#dispatch(tex2, BlendMode.Dissolve, opacity);
        return this;
    }

    overlay(tex2: RenderTexture, opacity: number = 1): Blend {
        this.#dispatch(tex2, BlendMode.Overlay, opacity);
        return this;
    }

    multiply(tex2: RenderTexture, opacity: number = 1): Blend {
        this.#dispatch(tex2, BlendMode.Multiply, opacity);
        return this;
    }

    difference(tex2: RenderTexture, opacity: number = 1): Blend {
        this.#dispatch(tex2, BlendMode.Difference, opacity);
        return this;
    }
}