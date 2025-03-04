import { float2 } from "Unity/Mathematics";

/**
 * Calculates points along a Bezier curve of any order using De Casteljau's algorithm.
 * NOTE: This returns a C# array of float2's
 * 
 * This function generates a specified number of points along a Bezier curve defined
 * by the provided control points. It supports Bezier curves of any order:
 * - 2 control points: Linear Bezier (straight line)
 * - 3 control points: Quadratic Bezier
 * - 4 control points: Cubic Bezier
 * - Higher numbers of control points: Higher-order Bezier curves
 * 
 * *Can be further optimized for performance*
 * 
 * @param {Array<{x: number, y: number}>} controlPoints - Array of control points defining the curve
 * @param {number} count - Number of points to generate along the curve
 * @returns {CS.System.Array<float2>} - Array of points along the curve
 */
export function curve(controlPoints, count) {
    if (count < 2 || controlPoints.length < 2)
        return CS.System.Array.CreateInstance(puer.$typeof(float2), 0);

    const points = CS.System.Array.CreateInstance(puer.$typeof(float2), count);

    for (let i = 0; i < count; i++) {
        const t = count > 1 ? i / (count - 1) : 0;

        // Create a copy of the control points
        const temp = controlPoints.map(p => ({ x: p.x, y: p.y }));

        // Apply De Casteljau's algorithm iteratively
        for (let j = controlPoints.length - 1; j > 0; j--) {
            for (let k = 0; k < j; k++) {
                temp[k].x = (1 - t) * temp[k].x + t * temp[k + 1].x;
                temp[k].y = (1 - t) * temp[k].y + t * temp[k + 1].y;
            }
        }

        points.SetValue(new float2(temp[0].x, temp[0].y), i);
    }

    return points;
}
