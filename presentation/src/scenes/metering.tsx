import {makeSlide, titleSlide} from "../templates/jp";
import {Code, Layout, lines, word} from "@motion-canvas/2d";
import {all, beginSlide, createRef, createSignal} from "@motion-canvas/core";
import {JsCode} from "../components/Code";

const source = `\
import binaryen from "binaryen";

class Executor {
    /* fields */
    constructor(wasmBinary, memoryLimit, env) {
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
    }
    run(gas) { /*...*/ }
    getMemoryView() { /*...*/ }
}`

const gasSource = `,
            metering: {
                usegas(gas) {
                    that.#gas -= gas
                    if (that.#gas <= 0) throw new Error("Exceeded limit!")
                }
            }`

const unMeteredWatSource = `\
 (func $entry
  (local $0 i32)
  (global.set $__stack_pointer (local.tee $0 (i32.sub (global.get $__stack_pointer) (i32.const 16))))
  (i32.store offset=12 (local.get $0) (i32.const 0))
  (block $label$1
   (loop $label$2
    (br_if $label$1 (i32.eqz (i32.and (i32.lt_s (i32.load offset=12 (local.get $0)) (i32.const 20)) (i32.const 1))))
    (call $print (i32.load offset=12 (local.get $0)))
    (i32.store offset=12 (local.get $0) (i32.add (i32.load offset=12 (local.get $0)) (i32.const 1)))
    (br $label$2)
   )
  )
  (global.set $__stack_pointer (i32.add (local.get $0) (i32.const 16)))
 )`

export default makeSlide(titleSlide({
    title: "Metering",
    slide: function* (root) {
        const code = createRef<Code>()

        root.add(<Layout layout width={1200} height={1000} alignItems={"start"}>
            <JsCode ref={code} code={source} fontSize={19}/>
        </Layout>)

        yield* beginSlide("add_metering")
        yield* all(
            code().code.insert([1, 0], `import metering from "wasm-metering\n`, 0.2),
            code().code.insert([5, 39], "metering.meterWASM(", 0.2),
            code().code.insert([5, 49], ", { meterType: 'i32' })", 0.2),
            code().code.replace(word(6, 54, 10), "ir.emitBinary()", 0.2)
        )
        yield* beginSlide("remove_clutter")
        yield* all(
            code().code.remove(lines(0, 1), 0.2),
            code().code.remove(lines(4, 4), 0.2),
            code().code.remove(lines(27, 28), 0.2)
        )
        yield* beginSlide("add_gas_function")
        yield* all(
            code().code.insert([13, 8], "const that = this\n        ", 0.2),
            code().code.insert([17, 13], gasSource, 0.2),
            code().selection([word(3, 39, 52), lines(19, 24)], 0.2)
        )
        yield* beginSlide("un_metered")
        yield* all(
            code().code.replace(lines(0, 100), unMeteredWatSource, 0.2),
            code().selection([lines(0, 100)], 0.2)
        )
        yield* beginSlide("metered")
        yield* all(
            code().code.insert([2,0], "  (call $__wasm_call_ctors (i32.const 740))\n", 0.2),
            code().code.insert([6, 0], "    (call $__wasm_call_ctors (i32.const 558))\n", 0.2),
            code().code.insert([7, 0], "    (call $__wasm_call_ctors (i32.const 1037))\n", 0.2),
            code().code.insert([12, 0], "  (call $__wasm_call_ctors (i32.const 377))\n", 0.2),
            code().selection([
                lines(2),
                lines(7),
                lines(9),
                lines(14, 15)
            ], 0.2)
        )
    }
}), {})