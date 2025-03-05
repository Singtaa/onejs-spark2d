// calculateBezierPoints.test.ts
import { curve } from '../curve'
import { float2 } from "Unity/Mathematics"
import { Array } from "System"

describe('calculateBezierPoints', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns an empty array when count < 2', () => {
        const result = curve([{ x: 0, y: 0 }, { x: 1, y: 1 }], 1)
        // @ts-ignore
        expect(result.length).toBe(0)
    })

    it('returns an empty array when controlPoints has fewer than 2 points', () => {
        const result = curve([{ x: 0, y: 0 }], 5)
        // @ts-ignore
        expect(result.length).toBe(0)
    })

    it('calculates linear bezier points correctly', () => {
        // With two control points, the bezier curve is a straight line.
        const controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
        const result = curve(controlPoints, 3)
        // Expected points: (0,0), (0.5,0.5), (1,1)
        expect(result[0]).toEqual(new float2(0, 0))
        expect(result[1]).toEqual(new float2(0.5, 0.5))
        expect(result[2]).toEqual(new float2(1, 1))
    })

    it('calculates quadratic bezier points correctly', () => {
        // A quadratic bezier curve with 3 control points.
        const controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 0 }]
        const result = curve(controlPoints, 3)
        // Expected:
        // t=0 -> (0,0)
        // t=0.5 -> (1,1)
        // t=1 -> (2,0)
        expect(result[0]).toEqual(new float2(0, 0))
        expect(result[1]).toEqual(new float2(1, 1))
        expect(result[2]).toEqual(new float2(2, 0))
    })

    it('calls CS.System.Array.CreateInstance with the correct parameters', () => {
        curve([{ x: 0, y: 0 }, { x: 1, y: 1 }], 3);

        // Use a custom matcher to check the arguments.
        expect(Array.CreateInstance).toHaveBeenCalledWith(
            expect.anything(), // We'll check the type more specifically below
            3
        );

        // Get the arguments of the first call to CreateInstance
        const [firstArg, secondArg] = (Array.CreateInstance as any).mock.calls[0];

        // Check if the first argument is a function (our "typeof" float2)
        expect(typeof firstArg).toBe('function');

        // Check if calling the function with a sample object returns an object with x and y properties
        const instance = new firstArg(1, 2);
        expect(instance).toHaveProperty('x');
        expect(instance).toHaveProperty('y');
    });
})
