import { tex } from "src/texture/tex"
import { Mathf, RenderTexture, Shader } from "UnityEngine"

const shader = csDepot.Get("sdgen")
const Initialize = shader.FindKernel("Initialize")
const JumpFloodPass = shader.FindKernel("JumpFloodPass")
const ComputeSignedDistance = shader.FindKernel("ComputeSignedDistance")

const INPUT_A = Shader.PropertyToID("InputA")
const RESULT = Shader.PropertyToID("Result")
const PREV_RESULT = Shader.PropertyToID("PrevResult")
const JUMP_SIZE = Shader.PropertyToID("JumpSize")

/**
 * Generates a signed distance field from the input texture.
 * Uses the Jump Flooding algorithm.
 */
export function sdgen(input: RenderTexture) {
    const { width, height } = input;
    const threadGroupsX = Mathf.CeilToInt(input.width / 8);
    const threadGroupsY = Mathf.CeilToInt(input.height / 8);

    let resultRT = tex(input).initNew().rt
    let prevResultRT = tex(input).initNew().rt

    shader.SetTexture(Initialize, RESULT, prevResultRT)
    shader.SetTexture(Initialize, INPUT_A, input)
    shader.SetTexture(JumpFloodPass, INPUT_A, input)
    shader.Dispatch(Initialize, threadGroupsX, threadGroupsY, 1)

    let jumpSize = Mathf.NextPowerOfTwo(Mathf.Max(width, height)) / 2;

    while (jumpSize > 0) {
        shader.SetInt(JUMP_SIZE, jumpSize);

        // Swap textures
        shader.SetTexture(JumpFloodPass, PREV_RESULT, prevResultRT);
        shader.SetTexture(JumpFloodPass, RESULT, resultRT);

        // Dispatch the JumpFloodPass kernel
        shader.Dispatch(JumpFloodPass, threadGroupsX, threadGroupsY, 1);

        // Swap RenderTextures for next pass
        let temp = prevResultRT;
        prevResultRT = resultRT;
        resultRT = temp;

        jumpSize /= 2;
    }

    shader.SetTexture(ComputeSignedDistance, PREV_RESULT, prevResultRT);
    shader.SetTexture(ComputeSignedDistance, RESULT, resultRT);
    shader.SetTexture(ComputeSignedDistance, INPUT_A, input);

    shader.Dispatch(ComputeSignedDistance, threadGroupsX, threadGroupsY, 1);

    return resultRT;
}