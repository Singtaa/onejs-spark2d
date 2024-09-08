import { ComputeShader, Graphics, Mathf, RenderTexture, Shader, Texture2D } from "UnityEngine";

const RESULT: number = Shader.PropertyToID("result");
const INPUT_A: number = Shader.PropertyToID("inputA");
const INPUT_B: number = Shader.PropertyToID("inputB");
const SCALAR: number = Shader.PropertyToID("scalar");
const OPERATION: number = Shader.PropertyToID("operation");

enum Operation {
    ADD = 0,
    SUBTRACT = 1,
    MULTIPLY = 2,
    DIVIDE = 3,
    POW = 4,
    SQRT = 5,
    SCALAR_ADD = 6,
    SCALAR_SUBTRACT = 7,
    SCALAR_MULTIPLY = 8,
    SCALAR_DIVIDE = 9,
    SCALAR_POW = 10,
    SCALAR_SQRT = 11
}

interface RTProvider {
    rt: RenderTexture;
}

/**
 * Returns a wrapper that allows you to do MAth OPerations on the passed in RenderTexture.
 * [Immutable] The input texture will not be modified.
 */
export function maop(input: RenderTexture | RTProvider) {
    return new Maop("rt" in input ? input.rt : input);
}

/**
 * Fluent API for math operations
 */
export class Maop {
    /**
     * The underlying RenderTexture
     */
    get rt() {
        return this.#result;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #result: RenderTexture;
    #dummyTex: Texture2D;
    #basicKernel: number;

    #basicShader: ComputeShader;
    #rangeShader: ComputeShader;

    #input: RenderTexture;

    constructor(input: RenderTexture) {
        this.#input = input;
        this.#threadGroupsX = Mathf.CeilToInt(input.width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(input.height / 8);
        this.#result = CS.Spark2D.RenderTextureUtil.Clone(input);
        this.#dummyTex = new Texture2D(1, 1);
        this.#basicShader = csDepot.Get("math:basic")
        this.#basicKernel = this.#basicShader.FindKernel("CSMain");
        this.#rangeShader = csDepot.Get("math:range")
    }

    #dispatch() {
        this.#basicShader.SetTexture(this.#basicKernel, RESULT, this.#result);
        this.#basicShader.SetTexture(this.#basicKernel, INPUT_A, this.#input);

        Graphics.SetRenderTarget(this.#result);
        this.#basicShader.Dispatch(this.#basicKernel, this.#threadGroupsX, this.#threadGroupsY, 1);
    }

    add(scalar: number): Maop
    add(other: RenderTexture): Maop
    add(a: RenderTexture | number): Maop {
        if (typeof a === "number") {
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, this.#dummyTex); // INPUT_B still needs to be explicitly binded
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_ADD);
            this.#basicShader.SetFloat(SCALAR, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.ADD);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch();
        return this;
    }

    subtract(scalar: number): Maop
    subtract(other: RenderTexture): Maop
    subtract(a: RenderTexture | number): Maop {
        if (typeof a === "number") {
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, this.#dummyTex);
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_SUBTRACT);
            this.#basicShader.SetFloat(SCALAR, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.SUBTRACT);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch();
        return this;
    }

    multiply(scalar: number): Maop
    multiply(other: RenderTexture): Maop
    multiply(a: RenderTexture | number): Maop {
        if (typeof a === "number") {
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, this.#dummyTex);
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_MULTIPLY);
            this.#basicShader.SetFloat(SCALAR, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.MULTIPLY);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch();
        return this;
    }

    divide(scalar: number): Maop
    divide(other: RenderTexture): Maop
    divide(a: RenderTexture | number): Maop {
        if (typeof a === "number") {
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, this.#dummyTex);
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_DIVIDE);
            this.#basicShader.SetFloat(SCALAR, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.DIVIDE);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch();
        return this;
    }

    pow(scalar: number): Maop
    pow(other: RenderTexture): Maop
    pow(a: RenderTexture | number): Maop {
        if (typeof a === "number") {
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, this.#dummyTex);
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_POW);
            this.#basicShader.SetFloat(SCALAR, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.POW);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch();
        return this;
    }

    sqrt(): Maop {
        this.#basicShader.SetInt(OPERATION, Operation.SQRT);
        this.#dispatch();
        return this;
    }
}