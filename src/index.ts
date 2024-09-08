export { TextureDisplay } from './comps/texture-holder'
export { maop, Maop } from './math/maop'
export { fbm, FBM } from './noise/fbm'
export { sdfield, SDField } from './sdf/sdfield'
export { trans, Trans } from "./texture/trans"

import { RenderTexture } from "UnityEngine"

// declare namespace CS.UnityEngine {
//     interface RenderTexture {
//         clone(): RenderTexture
//     }
// }

declare module "UnityEngine" {
    interface RenderTexture {
        clone(): RenderTexture
    }
}

// @ts-ignore
RenderTexture.prototype.clone = function () {
    return CS.Spark2D.RenderTextureUtil.Clone(this)
}

export default {}