import { CurveMaker } from '../curve-maker'
import { float2 } from "Unity/Mathematics"
import { Array as CSArray } from "System"

describe('CurveMaker', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('calculates linear bezier points correctly', () => {
        // With two control points, the bezier curve is a straight line.
        const controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
        const curveMaker = new CurveMaker(controlPoints, 3)
        const result = curveMaker.generate()
        // Expected points: (0,0), (0.5,0.5), (1,1)
        expect(result[0]).toEqual(new float2(0, 0))
        expect(result[1]).toEqual(new float2(0.5, 0.5))
        expect(result[2]).toEqual(new float2(1, 1))
    })

    it('calculates quadratic bezier points correctly', () => {
        // A quadratic bezier curve with 3 control points.
        const controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 0 }]
        const curveMaker = new CurveMaker(controlPoints, 3)
        const result = curveMaker.generate()
        // Expected:
        // t=0 -> (0,0)
        // t=0.5 -> (1,1)
        // t=1 -> (2,0)
        expect(result[0]).toEqual(new float2(0, 0))
        expect(result[1]).toEqual(new float2(1, 1))
        expect(result[2]).toEqual(new float2(2, 0))
    })

    it('calculates cubic bezier points correctly', () => {
        const controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: -1 }, { x: 3, y: 1 }]
        const curveMaker = new CurveMaker(controlPoints, 4)
        const result = curveMaker.generate()
        // Expected points can be calculated using Bezier curve formula or online calculators
        expect(result[0]).toEqual(new float2(0, 0))
        expect(result[1].x).toBeCloseTo(1)
        expect(result[1].y).toBeCloseTo(0.704)
        expect(result[2].x).toBeCloseTo(2)
        expect(result[2].y).toBeCloseTo(0.296)
        expect(result[3]).toEqual(new float2(3, 1))
    })

    it('throws error if control points are less than 2', () => {
        expect(() => {
            new CurveMaker([{ x: 0, y: 0 }], 3)
        }).toThrow("Control points must have at least 2 points")
    })

    it('throws error if count is less than 2', () => {
        expect(() => {
            new CurveMaker([{ x: 0, y: 0 }, { x: 1, y: 1 }], 1)
        }).toThrow("Count must be at least 2")
    })

    it('generates correct number of points based on count', () => {
        const controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }]
        const curveMaker = new CurveMaker(controlPoints, 5)
        const result = curveMaker.generate()
        // @ts-ignore
        expect(result.length).toBe(5)
    })

    it('generates start and end points correctly when count is 2', () => {
        const controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 0 }]
        const curveMaker = new CurveMaker(controlPoints, 2)
        const result = curveMaker.generate()
        // @ts-ignore
        expect(result.length).toBe(2)
        expect(result[0]).toEqual(new float2(0, 0))
        expect(result[1]).toEqual(new float2(2, 0))
    })

    it('calls CS.System.Array.CreateInstance with the correct parameters', () => {
        const controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
        new CurveMaker(controlPoints, 3).generate();

        // Use a custom matcher to check the arguments.
        expect(CSArray.CreateInstance).toHaveBeenCalledWith(
            expect.anything(), // We'll check the type more specifically below
            3
        );

        // Get the arguments of the first call to CreateInstance
        const [firstArg] = (CSArray.CreateInstance as any).mock.calls[0];

        // Check if the first argument is a function (our "typeof" float2)
        expect(typeof firstArg).toBe('function');

        // Check if calling the function with a sample object returns an object with x and y properties
        const instance = new firstArg(1, 2);
        expect(instance).toHaveProperty('x');
        expect(instance).toHaveProperty('y');
    });
});
