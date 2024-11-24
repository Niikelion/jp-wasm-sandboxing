import {makeSlide, titleSlide} from "../templates/jp";
import {all, beginSlide, createRef} from "@motion-canvas/core";
import {Code, Layout, lines, word} from "@motion-canvas/2d";
import {JsCode} from "../components/Code";

const source = `\
class Executor {
    constructor(wasmBinary, memoryLimit, env) {
        const ir = binaryen.readBinary(metering.meterWASM(wasmBinary), { meterType: 'i32' })
        const compiledModule = new WebAssembly.Module(ir.emitBinary())
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
            },
            metering: {
                usegas(gas) {
                    that.#gas -= gas
                    if (that.#gas <= 0) throw new Error("Exceeded limit!")
                }
            }
        })

        this.#exports = this.#instance.exports
        this.#memoryView = new Int32Array(this.#memory.buffer)
    }
}`

const asyncifyScaffold = `\
                    if (!that.#paused) {
                        that.#gas -= gas
                        /*...*/
                        that.#paused = true
                    } else {
                        /*...*/
                        that.#paused = false
                    }
`
const runSource = `\
    run(gas) {
        this.#gas += gas
        if (this.#gas <= 0) {
            return false
        }

        this.#exports.entry()
        
        return !this.#paused;
    }`

export default makeSlide(titleSlide({
    title: "Pausing aka. unwind/rewind",
    slide: function* (root) {
        const code = createRef<Code>()

        root.add(<Layout layout width={1200} height={1000} alignItems={"start"}>
            <JsCode ref={code} code={source} fontSize={19}/>
        </Layout>)

        yield* beginSlide("add_asyncify_pass")
        yield* all(
            code().code.insert([3, 0], "        ir.runPasses([`asyncify`])\n", 0.2),
            code().selection([lines(3)], 0.2)
        )
        yield* beginSlide("focus_on_gas")
        yield* all(
            code().selection([lines(19, 22)], 0.2)
        )
        yield* beginSlide("remove_clutter")
        yield* all(
            code().code.remove(lines(0, 18), 0.2),
            code().code.remove(lines(23, 29), 0.2),
            code().selection([lines(0, 100)], 0.2)
        )
        yield* beginSlide("function_entry")
        yield* all(
            code().code.replace(lines(1, 2), asyncifyScaffold, 0.2)
        )
        yield* beginSlide("rewind")
        yield* all(
            code().code.replace(word(6,24, 7), "that.#exports.asyncify_stop_rewind()", 0.2),
            code().selection([lines(6)], 0.2)
        )
        yield* beginSlide("unwind")
        yield* all(
            code().code.replace(lines(3), `\
                        that.#memoryView[DATA_ADDR >> 2] = DATA_ADDR + 8; //start of buffer
                        that.#memoryView[DATA_ADDR + 4 >> 2] = 1024; //end of buffer
                        that.#exports.asyncify_start_unwind(DATA_ADDR);   
`,0.2),
            code().selection([lines(3, 5)], 0.2)
        )
        yield* beginSlide("modify_run")
        yield* all(
            code().code.replace(lines(0, 100), runSource, 0.5),
            code().selection([lines(0, 100)], 0.5)
        )
        yield* beginSlide("apply_changes_to_run")
        yield* all(
            code().code.insert([5, 0], `\
        
        if (this.#paused) {
            this.#exports.asyncify_start_rewind(DATA_ADDR); //start stack rewinding
        }
        `, 0.2),
            code().code.insert([7, 0], `\
            
        if (this.#paused) {
            this.#exports.asyncify_stop_unwind(); //stop stack unwinding
        }
`, 0.2),
            code().selection([
                lines(6, 8),
                lines(11, 14)
            ], 0.2)
        )
    }
}), {})