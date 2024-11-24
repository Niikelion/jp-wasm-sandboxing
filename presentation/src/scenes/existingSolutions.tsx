import {makeSlide, titleSlide} from "../templates/jp";
import {Layout} from "@motion-canvas/2d";
import {BulletPoints} from "../templates/jp/components/BulletPoints";
import {beginSlide, createSignal} from "@motion-canvas/core";

export default makeSlide(titleSlide({
    title: "Existing solutions",
    slide: function* (root) {
        const currentPoint = createSignal(0)
        const points = [
            "Ignoring the problem",
            "Separate threads",
            "Separate processes"
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