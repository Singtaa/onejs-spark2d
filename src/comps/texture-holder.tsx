import { h } from 'preact'
import { forwardRef } from 'preact/compat'
import { RenderTexture, RenderTextureFormat } from 'UnityEngine'
import { useEffect, useRef } from 'preact/hooks'

interface Props {
    class?: string
    rt: RenderTexture
}

export const TextureDisplay = forwardRef(({ rt, class: className }: Props, ref) => {
    const rtRef = useRef({ cachedRT: undefined as RenderTexture | undefined })

    useEffect(() => {
        // if (!rtRef.current.cachedRT) {
        //     rtRef.current.cachedRT = CS.Spark2D.RenderTextureUtil.InitNew(rt, RenderTextureFormat.ARGBFloat)
        // }
    }, [])

    return <image class={className} image={rt} />
})