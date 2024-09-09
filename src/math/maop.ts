import { ComputeShader, Graphics, Mathf, RenderTexture, Shader, Texture2D } from "UnityEngine";

const INPUT_A: number = Shader.PropertyToID("inputA");
const INPUT_B: number = Shader.PropertyToID("inputB");
const SCALARS: number = Shader.PropertyToID("scalars");
const OPERATION: number = Shader.PropertyToID("operation");

enum Operation {
    // Basic
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
    SCALAR_SQRT = 11,
    // Range
    CLAMP = 16,
    FRACTION = 17,
    MAXIMUM = 18,
    MINIMUM = 19,
    ONE_MINUS = 20,
    RANDOM_RANGE = 21,
    REMAP = 22,
    SATURATE = 23,
    SCALAR_MAXIMUM = 24,
    SCALAR_MINIMUM = 25,
}

interface RTProvider {
    rt: RenderTexture;
}

/**
 * Returns a wrapper that allows you to do [MA]th [OP]erations on the passed in RenderTexture.
 * [Mutable] Operations will modify the input texture.
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
        return this.#inputA;
    }

    #threadGroupsX: number;
    #threadGroupsY: number;
    #dummyTex: Texture2D;

    #basicShader: ComputeShader;
    #basicKernel: number;
    #rangeShader: ComputeShader;
    #rangeKernel: number;

    #inputA: RenderTexture;

    constructor(input: RenderTexture) {
        this.#inputA = input;
        this.#threadGroupsX = Mathf.CeilToInt(input.width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(input.height / 8);
        this.#dummyTex = new Texture2D(1, 1);
        this.#basicShader = csDepot.Get("math:basic")
        this.#basicKernel = this.#basicShader.FindKernel("CSMain");
        this.#rangeShader = csDepot.Get("math:range")
        this.#rangeKernel = this.#rangeShader.FindKernel("CSMain");
    }

    #predispatch() { 
        // INPUT_B need to be explicitly binded first
        this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, this.#dummyTex);
    }

    #dispatch(shader: ComputeShader, kernel: number) {
        shader.SetTexture(kernel, INPUT_A, this.#inputA);

        Graphics.SetRenderTarget(this.#inputA);
        shader.Dispatch(kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
    }

    blit(rt: RenderTexture): Maop {
        Graphics.Blit(rt, this.#inputA);
        return this;
    }

    /**
     * MARK: Basic
     */
    add(scalar: number): Maop
    add(other: RenderTexture): Maop
    add(a: RenderTexture | number): Maop {
        this.#predispatch();
        if (typeof a === "number") {
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_ADD);
            this.#basicShader.SetFloats(SCALARS, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.ADD);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch(this.#basicShader, this.#basicKernel);
        return this;
    }

    subtract(scalar: number): Maop
    subtract(other: RenderTexture): Maop
    subtract(a: RenderTexture | number): Maop {
        this.#predispatch();
        if (typeof a === "number") {
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_SUBTRACT);
            this.#basicShader.SetFloats(SCALARS, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.SUBTRACT);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch(this.#basicShader, this.#basicKernel);
        return this;
    }

    multiply(scalar: number): Maop
    multiply(other: RenderTexture): Maop
    multiply(a: RenderTexture | number): Maop {
        this.#predispatch();
        if (typeof a === "number") {
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_MULTIPLY);
            this.#basicShader.SetFloats(SCALARS, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.MULTIPLY);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch(this.#basicShader, this.#basicKernel);
        return this;
    }

    divide(scalar: number): Maop
    divide(other: RenderTexture): Maop
    divide(a: RenderTexture | number): Maop {
        this.#predispatch();
        if (typeof a === "number") {
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_DIVIDE);
            this.#basicShader.SetFloats(SCALARS, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.DIVIDE);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch(this.#basicShader, this.#basicKernel);
        return this;
    }

    pow(scalar: number): Maop
    pow(other: RenderTexture): Maop
    pow(a: RenderTexture | number): Maop {
        this.#predispatch();
        if (typeof a === "number") {
            this.#basicShader.SetInt(OPERATION, Operation.SCALAR_POW);
            this.#basicShader.SetFloats(SCALARS, a);
        } else {
            this.#basicShader.SetInt(OPERATION, Operation.POW);
            this.#basicShader.SetTexture(this.#basicKernel, INPUT_B, a);
        }
        this.#dispatch(this.#basicShader, this.#basicKernel);
        return this;
    }

    sqrt(): Maop {
        this.#predispatch();
        this.#basicShader.SetInt(OPERATION, Operation.SQRT);
        this.#dispatch(this.#basicShader, this.#basicKernel);
        return this;
    }

    /**
     * MARK: Range
     */
    clamp(min: number, max: number): Maop {
        this.#predispatch();
        this.#rangeShader.SetInt(OPERATION, Operation.CLAMP);
        this.#rangeShader.SetFloats(SCALARS, min, max);
        this.#dispatch(this.#rangeShader, this.#rangeKernel);
        return this;
    }

    frac(): Maop {
        this.#predispatch();
        this.#rangeShader.SetInt(OPERATION, Operation.FRACTION);
        this.#dispatch(this.#rangeShader, this.#rangeKernel);
        return this;
    }

    max(a: number): Maop {
        this.#predispatch();
        this.#rangeShader.SetInt(OPERATION, Operation.SCALAR_MAXIMUM);
        this.#rangeShader.SetFloats(SCALARS, a);
        this.#dispatch(this.#rangeShader, this.#rangeKernel);
        return this;
    }

    min(a: number): Maop {
        this.#predispatch();
        this.#rangeShader.SetInt(OPERATION, Operation.SCALAR_MINIMUM);
        this.#rangeShader.SetFloats(SCALARS, a);
        this.#dispatch(this.#rangeShader, this.#rangeKernel);
        return this;
    }

    oneMinus(): Maop {
        this.#predispatch();
        this.#rangeShader.SetInt(OPERATION, Operation.ONE_MINUS);
        this.#dispatch(this.#rangeShader, this.#rangeKernel);
        return this;
    }

    randomRange(min: number, max: number): Maop {
        this.#predispatch();
        this.#rangeShader.SetInt(OPERATION, Operation.RANDOM_RANGE);
        this.#rangeShader.SetFloats(SCALARS, min, max);
        this.#dispatch(this.#rangeShader, this.#rangeKernel);
        return this;
    }

    remap(fromMin: number, fromMax: number, toMin: number, toMax: number): Maop {
        this.#predispatch();
        this.#rangeShader.SetInt(OPERATION, Operation.REMAP);
        this.#rangeShader.SetFloats(SCALARS, fromMin, fromMax, toMin, toMax);
        this.#dispatch(this.#rangeShader, this.#rangeKernel);
        return this;
    }

    saturate(): Maop {
        this.#predispatch();
        this.#rangeShader.SetInt(OPERATION, Operation.SATURATE);
        this.#dispatch(this.#rangeShader, this.#rangeKernel);
        return this;
    }
}