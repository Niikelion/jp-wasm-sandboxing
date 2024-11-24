import {makeSlide, titleSlide} from "../templates/jp";
import {all, beginSlide, createRef} from "@motion-canvas/core";
import {Code, Layout, lines, word} from "@motion-canvas/2d";
import {JsCode} from "../components/Code";

const source = `\
import binaryen from "binaryen";

class Executor {
    #paused = false
    #gas = 0
    #instance
    #exports
    #memory
    
    constructor(wasmBinary, memoryLimit, env) {/*...*/}
    run(gas) { /*...*/ }
    getMemoryView() { /*...*/ }
}`

const constructorSource = `
        const ir = binaryen.readBinary(wasmBinary)
        const compiledModule = new WebAssembly.Module(wasmBinary)
        const memoryInfo = ir.getMemoryInfo()
        
        this.#memory = new WebAssembly.Memory({
            initial: memoryInfo.initial,
            maximum: memoryLimit,
            shared: memoryInfo.shared
        })
        
        this.#instance = new WebAssembly.Instance(compiledModule, {
            env: {
                memory: this.#memory,
                ...(env??{})
            }
        })

        this.#exports = this.#instance.exports
        this.#memoryView = new Int32Array(this.#memory.buffer)
    }`

const runSource = `\
    run(gas) {
        this.#gas += gas
        if (this.#gas <= 0)
            return false

        this.#exports.entry()
        
        return !this.#paused;
    }
    
    getMemoryView() {
        return this.#memoryView
    }`

export default makeSlide(titleSlide({
    title: "Minimal WASM executor",
    slide: function* (root) {
        const code = createRef<Code>()

        root.add(<Layout layout width={1200} height={1000} alignItems={"start"}>
            <JsCode ref={code} code={source} fontSize={19}/>
        </Layout>)

        yield* beginSlide("show_constructor")
        yield* all(
            code().code.replace(lines(0, 8), "", 0.2),
            code().code.replace(lines(10, 12), "", 0.2),
            code().code.replace(word(9, 47), constructorSource, 0.2)
        )
        yield* beginSlide("show_rest")
        yield* code().code.replace(lines(0, 21), runSource, 0.2)
    }
}), {})