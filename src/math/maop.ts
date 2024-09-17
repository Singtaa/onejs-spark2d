import { ComputeShader, Graphics, Mathf, RenderTexture, Shader, Texture2D, Vector4 } from "UnityEngine";

const INPUT_A: number = Shader.PropertyToID("inputA");
const INPUT_B: number = Shader.PropertyToID("inputB");
const SCALARS: number = Shader.PropertyToID("scalars");
const OPERATION: number = Shader.PropertyToID("operation");
const MODE: number = Shader.PropertyToID("mode");
const ROUTES: number = Shader.PropertyToID("routes");

enum Operation {
    // Basic
    ADD = 0,
    SUBTRACT = 1,
    MULTIPLY = 2,
    DIVIDE = 3,
    POW = 4,
    SQRT = 5,
    // Range
    CLAMP = 16,
    FRACTION = 17,
    MAXIMUM = 18,
    MINIMUM = 19,
    ONE_MINUS = 20,
    RANDOM_RANGE = 21,
    REMAP = 22,
    SATURATE = 23,
    // Advanced
    ABSOLUTE = 32,
    EXPONENTIAL = 33,
    LENGTH = 34,
    LOG = 35,
    MODULO = 36,
    NEGATE = 37,
    NORMALIZE = 38,
    POSTERIZE = 39,
    RECIPROCAL = 40,
    RECIPROCAL_SQRT = 41,
}

enum Mode {
    Texture,
    Vector,
    Scalar
}

interface RTProvider {
    rt: RenderTexture;
}

let _cachedInputA: RenderTexture;
let _cachedInputB: RenderTexture;

// INPUT_B need to be explicitly binded first because sampler is used
const shader = csDepot.Get("maop")
const kernel = shader.FindKernel("CSMain");
shader.SetTexture(kernel, INPUT_B, new Texture2D(1, 1));

const _cacheMap = new WeakMap<RenderTexture, Maop>();

/**
 * Returns a wrapper that allows you to do [MA]th [OP]erations on the passed in RenderTexture.
 * [Mutable] Operations will modify the input texture.
 * [Op Dispatch] Operations will dispatch immediately.
 */
export function maop(input: RenderTexture | RTProvider) {
    let rt = "rt" in input ? input.rt : input;
    if (_cacheMap.has(rt)) return _cacheMap.get(rt);
    let m = new Maop(rt);
    _cacheMap.set(rt, m);
    return m;
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
    #routes: number[] = [0, 1, 2, 4];

    #shader: ComputeShader;
    #kernel: number;

    #inputA: RenderTexture;

    constructor(input: RenderTexture) {
        this.#inputA = input;
        this.#threadGroupsX = Mathf.CeilToInt(input.width / 8);
        this.#threadGroupsY = Mathf.CeilToInt(input.height / 8);
        this.#dummyTex = new Texture2D(1, 1);
        this.#shader = csDepot.Get("maop")
        this.#kernel = this.#shader.FindKernel("CSMain");
    }

    #predispatch() {
        this.#shader.SetInt(MODE, Mode.Texture);
    }

    #dispatch() {
        // this.#shader.SetTexture(this.#kernel, INPUT_A, this.#inputA);
        this.#setTextureForInputA(this.#inputA);
        // this.#shader.SetInts(ROUTES, ...this.#routes); // SetInts allocs
        this.#shader.SetVector(ROUTES, new Vector4(this.#routes[0], this.#routes[1], this.#routes[2], this.#routes[3]));

        // Graphics.SetRenderTarget(this.#inputA);
        this.#shader.Dispatch(this.#kernel, this.#threadGroupsX, this.#threadGroupsY, 1);
    }

    #dispatchForSingleOperand(op: Operation, cb?: Function): Maop {
        this.#predispatch();
        this.#shader.SetInt(OPERATION, op);
        if (typeof cb === 'function') {
            cb();
        }
        this.#dispatch();
        return this;
    }

    #dispatchForTwoOperands(b: RenderTexture | number | number[], op: Operation): Maop {
        this.#predispatch();
        this.#shader.SetInt(OPERATION, op);
        if (typeof b === "number") {
            // this.#shader.SetFloats(SCALARS, b);
            this.#shader.SetVector(SCALARS, new Vector4(b, 0));
            this.#shader.SetInt(MODE, Mode.Scalar);
        } else if (Array.isArray(b)) {
            // this.#shader.SetFloats(SCALARS, ...b);
            this.#shader.SetVector(SCALARS, new Vector4(b[0], b[1], b[2], b[3]));
            this.#shader.SetInt(MODE, Mode.Vector);
        } else {
            // this.#shader.SetTexture(this.#kernel, INPUT_B, b);
            this.#setTextureForInputB(b);
        }
        this.#dispatch();
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

    blit(rt: RenderTexture): Maop {
        Graphics.Blit(rt, this.#inputA);
        return this;
    }

    /**
     * Use this to setup what each component is wired to for component-wise operations.
     * Default is 0, 1, 2, 4
     * 
     * 0: r, 1: g, 2: b, 3: a, 4: ignored
     */
    routes(r: number, g: number, b: number, a: number): Maop {
        this.#routes = [r, g, b, a];
        return this;
    }

    /**
     * MARK: Basic
     */
    add(scalar: number): Maop
    add(vector: number[]): Maop
    add(other: RenderTexture): Maop
    add(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.ADD);
    }

    subtract(scalar: number): Maop
    subtract(vector: number[]): Maop
    subtract(texture: RenderTexture): Maop
    subtract(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.SUBTRACT);
    }

    multiply(scalar: number): Maop
    multiply(vector: number[]): Maop
    multiply(texture: RenderTexture): Maop
    multiply(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.MULTIPLY);
    }

    divide(scalar: number): Maop
    divide(vector: number[]): Maop
    divide(texture: RenderTexture): Maop
    divide(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.DIVIDE);
    }

    pow(scalar: number): Maop
    pow(vector: number[]): Maop
    pow(texture: RenderTexture): Maop
    pow(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.POW);
    }

    sqrt(): Maop {
        this.#dispatchForSingleOperand(Operation.SQRT);
        return this;
    }

    /**
     * MARK: Range
     */
    clamp(min: number, max: number): Maop {
        this.#dispatchForSingleOperand(Operation.CLAMP, () => {
            // this.#shader.SetFloats(SCALARS, min, max);
            this.#shader.SetVector(SCALARS, new Vector4(min, max));
        });
        return this;
    }

    frac(): Maop {
        this.#dispatchForSingleOperand(Operation.FRACTION);
        return this;
    }

    max(scalar: number): Maop
    max(vector: number[]): Maop
    max(texture: RenderTexture): Maop
    max(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.MAXIMUM);
    }

    min(scalar: number): Maop
    min(vector: number[]): Maop
    min(texture: RenderTexture): Maop
    min(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.MINIMUM);
    }

    oneMinus(): Maop {
        this.#dispatchForSingleOperand(Operation.ONE_MINUS);
        return this;
    }

    randomRange(min: number, max: number): Maop {
        this.#dispatchForSingleOperand(Operation.RANDOM_RANGE, () => {
            // this.#shader.SetFloats(SCALARS, min, max);
            this.#shader.SetVector(SCALARS, new Vector4(min, max));
        });
        return this;
    }

    remap(fromMin: number, fromMax: number, toMin: number, toMax: number): Maop {
        this.#dispatchForSingleOperand(Operation.REMAP, () => {
            // this.#shader.SetFloats(SCALARS, fromMin, fromMax, toMin, toMax);
            this.#shader.SetVector(SCALARS, new Vector4(fromMin, fromMax, toMin, toMax));
        });
        return this;
    }

    saturate(): Maop {
        this.#dispatchForSingleOperand(Operation.SATURATE);
        return this;
    }

    /**
     * MARK: Advanced
     */

    abs(): Maop {
        this.#dispatchForSingleOperand(Operation.ABSOLUTE);
        return this;
    }

    exp(): Maop {
        this.#dispatchForSingleOperand(Operation.EXPONENTIAL);
        return this;
    }

    length(): Maop {
        this.#dispatchForSingleOperand(Operation.LENGTH);
        return this;
    }

    log(): Maop {
        this.#dispatchForSingleOperand(Operation.LOG);
        return this;
    }

    modulo(scalar: number): Maop
    modulo(vector: number[]): Maop
    modulo(texture: RenderTexture): Maop
    modulo(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.MODULO);
    }

    negate(): Maop {
        this.#dispatchForSingleOperand(Operation.NEGATE);
        return this;
    }

    normalize(): Maop {
        this.#dispatchForSingleOperand(Operation.NORMALIZE);
        return this;
    }

    posterize(scalar: number): Maop
    posterize(vector: number[]): Maop
    posterize(texture: RenderTexture): Maop
    posterize(b: RenderTexture | number | number[]): Maop {
        return this.#dispatchForTwoOperands(b, Operation.POSTERIZE);
    }

    reciprocal(): Maop {
        this.#dispatchForSingleOperand(Operation.RECIPROCAL);
        return this;
    }

    reciprocalSqrt(): Maop {
        this.#dispatchForSingleOperand(Operation.RECIPROCAL_SQRT);
        return this;
    }
}