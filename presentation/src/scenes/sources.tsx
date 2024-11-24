import {makeSlide, titleSlide} from "../templates/jp";
import {beginSlide, createSignal} from "@motion-canvas/core";
import {Layout} from "@motion-canvas/2d";
import {BulletPoints} from "../templates/jp/components/BulletPoints";

export default makeSlide(titleSlide({
    title: "Sources",
    slide: function* (root) {
        const currentPoint = createSignal(0)
        const points = [
            "https://surma.dev/things/c-to-webassembly/",
            "https://agryaznov.com/posts/wasm-gas-metering/",
            "https://kripken.github.io/blog/wasm/2019/07/16/asyncify.html"
        ]

        root.add(<Layout>{() => <BulletPoints
            points={points}
            currentPoint={currentPoint()}
            direction={"column"} layout alignItems={"start"} width={1200} height={800} gap={20}
        />}</Layout>)

        for (let i=1; i<=points.length; ++i) {
            yield* beginSlide(`point-${i}`)
            yield* currentPoint(i, 0.3)
        }
    }
}), {})