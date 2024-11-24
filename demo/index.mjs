import binaryen from "binaryen";
import fs from "fs";
import metering from "wasm-metering"

const DATA_ADDR = 16; // Where the unwind/rewind data structure will live.

class Executor {
    #paused = false
    #gas = 0
    #instance
    #exports
    #memory
    #memoryView

    constructor(wasmBinary, memoryLimit, env) {
        const ir = binaryen.readBinary(metering.meterWASM(wasmBinary, {
            meterType: `i32`
        }))
        ir.runPasses([`asyncify`])
        const compiledModule = new WebAssembly.Module(ir.emitBinary())
        const memoryInfo = ir.getMemoryInfo()
        const that = this

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
                    if (!that.#paused) {
                        that.#gas -= gas
                        if (that.#gas <= 0) {
                            // Fill in the data structure. The first value has the stack location,
                            // which for simplicity we can start right after the data structure itself.
                            that.#memoryView[DATA_ADDR >> 2] = DATA_ADDR + 8
                            // The end of the stack will not be reached here anyhow.
                            that.#memoryView[DATA_ADDR + 4 >> 2] = 1024
                            that.#exports.asyncify_start_unwind(DATA_ADDR)
                            that.#paused = true;
                        }
                    } else {
                        that.#exports.asyncify_stop_rewind()
                        that.#paused = false;
                    }
                }
            }
        })

        this.#exports = this.#instance.exports
        this.#memoryView = new Int32Array(this.#memory.buffer)
    }

    run(gas) {
        this.#gas += gas
        if (this.#gas <= 0)
            return false

        if (this.#paused) {
            this.#exports.asyncify_start_rewind(DATA_ADDR) //start stack rewinding
        }

        this.#exports.entry() //resume execution
        if (this.#paused)
            this.#exports.asyncify_stop_unwind() //stop stack unwinding

        return !this.#paused //return true if execution finished
    }
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
    }
}

const wasm = fs.readFileSync('./example.wasm')
const env = {
    print: console.log
}

const cpuLimit = 10000
const memLimit = 65536
const instance = new Executor(wasm, memLimit, env)

console.log("Running first instance")
instance.run(cpuLimit)
console.log("First instance paused")

console.log("Creating new instance and moving serialized state")
const data = instance.serializeMemory()
const newInstance = new Executor(wasm, memLimit, env)
newInstance.deserializeMemory(data)

let stopped = false
console.log("Running second instance from first instance memory snapshot")
do {
    stopped = newInstance.run(cpuLimit)
    console.log("Execution paused, performing tick")
} while (!stopped)
console.log("Finished execution")
