import {makeSlide, titleSlide} from "../templates/jp";
import {beginSlide, createRef} from "@motion-canvas/core";
import {Code, Layout, lines} from "@motion-canvas/2d";
import {JsCode} from "../components/Code";

const source = `\
    getMemoryView() {
        return this.#memoryView
    }`

const serializationSource = `\
    serializeMemory() {
        return this.#paused ? new Int32Array(this.#memoryView) : undefined
    }
    deserializeMemory(data) {
        this.#paused = true
        const newData = Int32Array.from(data)

        if (newData.length !== this.#memoryView.length)
            throw new Error("Memory size mismatch!")

        for (let i=0; i<newData.length; ++i)
            this.#memoryView[i] = newData[i]
    }`

export default makeSlide(titleSlide({
    title: "Serialization",
    slide: function* (root) {
        const code = createRef<Code>()

        root.add(<Layout layout width={1200} height={1000} alignItems={"start"}>
            <JsCode ref={code} code={source} fontSize={19}/>
        </Layout>)

        yield* beginSlide("better_utils")
        yield* code().code.replace(lines(0, 3), serializationSource, 0.2)
    }
}), {})