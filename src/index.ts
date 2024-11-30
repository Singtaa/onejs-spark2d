export { TextureDisplay } from './comps/texture-holder'
export { maop, Maop } from './math/maop'
export { fbm, FBM } from './noise/fbm'
export { sdfield, SDField, ShapeType } from './sdf/sdfield'
export { sdgen } from './sdf/sdgen'
export { trans, Trans } from "./texture/trans"
export { tile, Tile } from "./texture/tile"
export { tex, Tex } from "./texture/tex"
export { grad, Grad } from './texture/grad'
export { dye, Dye } from './texture/dye'
export { blur, Blur } from './filters/blur'
export { morph, Morph } from './math/morph'
export { blend, Blend } from './common/blend'

import { RenderTexture } from "UnityEngine"

// declare namespace CS.UnityEngine {
//     interface RenderTexture {
//         clone(): RenderTexture
//     }
// }

declare module "UnityEngine" {
    // interface RenderTexture {
    //     clone(): RenderTexture
    // }
}

// @ts-ignore
RenderTexture.prototype.clone = function () {
    return CS.Spark2D.RenderTextureUtil.Clone(this)
}

export default {}