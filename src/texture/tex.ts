import { Graphics, RenderTexture } from "UnityEngine";

export function tex(rt: RenderTexture): Tex
export function tex(width: number, height?: number): Tex
export function tex(a: RenderTexture | number, b?: number): Tex {
    if (typeof a === "number") {
        return new Tex(a, b);
    } else {
        return new Tex(a);
    }
}

export class Tex {
    /**
     * The underlying RenderTexture
     */
    get rt() {
        return this.#texture;
    }

    #texture: RenderTexture;
    #width: number;
    #height: number;

    constructor(rt: RenderTexture)
    constructor(width: number, height?: number)
    constructor(a: RenderTexture | number, b?: number) {
        if (typeof a === "number") {
            this.#width = a;
            this.#height = b ?? a;
            this.#texture = CS.Spark2D.RenderTextureUtil.CreateRT(this.#width, this.#height);
        } else {
            this.#width = a.width;
            this.#height = a.height;
            this.#texture = a;
        }
    }

    blitFrom(rt: Texture) {
        Graphics.Blit(rt, this.#texture);
        return this;
    }

    /**
     * @returns A new blank RenderTexture with the same settings as the input texture
     */
    initNew() {
        return new Tex(CS.Spark2D.RenderTextureUtil.InitNew(this.#texture));
    }

    /**
     * @returns A new RenderTexture that's an exact clone as the input texture
     */
    clone() {
        return new Tex(CS.Spark2D.RenderTextureUtil.Clone(this.#texture));
    }
}