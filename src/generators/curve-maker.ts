import { Array as CSArray } from "System"
import { float2 } from "Unity/Mathematics"

interface Point {
    x: number
    y: number
}

export class CurveMaker {

    get controlPoints(): Point[] {
        return [...this.#controlPoints]
    }

    set controlPoints(value: Point[]) {
        if (value.length < 2)
            throw new Error("Control points must have at least 2 points")
        this.#controlPoints = value
        this.#tempX = new Array(value.length)
        this.#tempY = new Array(value.length)
    }

    get count(): number {
        return this.#count
    }

    set count(value: number) {
        if (value < 2)
            throw new Error("Count must be at least 2")
        this.#count = value
        this.#resultPoints = CSArray.CreateInstance(puer.$typeof(float2), value)
    }

    #controlPoints: Point[]
    #tempX: number[]
    #tempY: number[]
    #count: number
    #resultPoints: CSArray

    constructor(controlPoints: Point[], count: number) {
        this.controlPoints = controlPoints
        this.count = count
    }

    public generate(): CSArray {
        if (this.#count < 2 || this.#controlPoints.length < 2)
            return this.#resultPoints;

        for (let i = 0; i < this.#count; i++) {
            const t = this.#count > 1 ? i / (this.#count - 1) : 0;

            for (let k = 0; k < this.#controlPoints.length; k++) {
                this.#tempX[k] = this.#controlPoints[k].x;
                this.#tempY[k] = this.#controlPoints[k].y;
            }

            // Apply De Casteljau's algorithm iteratively
            for (let j = this.#controlPoints.length - 1; j > 0; j--) {
                for (let k = 0; k < j; k++) {
                    this.#tempX[k] = (1 - t) * this.#tempX[k] + t * this.#tempX[k + 1];
                    this.#tempY[k] = (1 - t) * this.#tempY[k] + t * this.#tempY[k + 1];
                }
            }

            this.#resultPoints.SetValue(new float2(this.#tempX[0], this.#tempY[0]), i);
        }

        return this.#resultPoints;
    }
}