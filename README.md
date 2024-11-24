# WASM sandboxing for realtime applications

# Intro

This repository contains presentation on the subject of sandboxing user code using wasm with ability to stop, save, restore and resume execution.

# Motivation

Implementing computers/microprocessors inside any game is a quite difficult task if you decide to use any standard language.
Using existing compilers is not a viable option due to security considerations - program compiled from user code can perform the same actions as any other program and is potentially dangerous.
This can be mitigated using containers, for example with docker. This improves security, but still is not perfect due to problems with saving state of the application.

Due to above reasons, I started looking for a way to:
1. pause and resume program written in existing popular language that does not require calling host-provided functions, like `yield`
2. save and restore state to and from the disk to allow saving game mid-execution of in-game programs
3. use existing tools for compilation to avoid implementing compiler/interpreter and only work on some common intermediate representation
4. limit memory usage
5. limit cpu usage

# Sources

WASM looked like a perfect candidate.
After reading [this blogpost about pausing and resuming WebAssembly with Asyncify](https://kripken.github.io/blog/wasm/2019/07/16/asyncify.html) and finding [wasm-metering package](https://github.com/ewasm/wasm-metering/)
that inserts instruction counting and executing callback with instruction count I had most of the building blocks needed to implement my demo.
The last thing that was missing was [this blogpost about compiling c to webassembly](https://surma.dev/things/c-to-webassembly/).
This was especially useful since it shows a very low-level way of compiling c to wasm that allows us to get rid of all the bloat that makes it difficult to view the sources during experimentation.

# Solution

My language of choice is usually Typescript, but since I was a bit lazy, I decided I don't want to set it up in this project, for which I apologize.
I started with pretty basic class that loads wasm and runs it:
```js
class Executor {
    #paused = false
    #gas = 0
    #instance
    #exports
    #memory
    #memoryView

    constructor(wasmBinary, memoryLimit, env) {
        const ir = binaryen.readBinary(wasmBinary)
        const compiledModule = new WebAssembly.Module(ir.emitBinary())
        const memoryInfo = ir.getMemoryInfo()

        this.#memory = new WebAssembly.Memory({
            initial: memoryInfo.initial,
            maximum: memoryLimit,
            shared: memoryInfo.shared
        })

        const that = this
        this.#instance = new WebAssembly.Instance(compiledModule, {
            env: {
                memory: this.#memory,
                ...(env??{})
            }
        })

        this.#exports = this.#instance.exports
        this.#memoryView = new Int32Array(this.#memory.buffer)
    }

    run() {
        this.#exports.entry()
        return true //return true if execution finished
    }
}
```

Then I prepared simple snippet to test the `Executor` class:
```js
//index.mjs
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
```

Of course, we will also need some wasm program:

```c
//example.c
__attribute__((import_module("env"), import_name("print")))
extern void print(int);

void entry() {
    for (int i=0; i<100000000; ++i) print(i);
}
```

With a script to compile it:

```bash
#! /bin/bash
clang --target=wasm32 -emit-llvm -c -S example.c
llc -march=wasm32 -filetype=obj example.ll
wasm-ld --no-entry --export-all --import-memory -o example.wasm example.o
```

The result is the perfect example for what we are trying to solve - program runs forever with no way to stop it other than killing the process.
Now, the first step was to add the option to stop the execution. Thankfully, `wasm-metering` was very simple to implement.
I just had to pass source wasm through one function and provide wasm instance with implementation of gas function.

```js
const ir = binaryen.readBinary(metering.meterWASM(wasmBinary, {
    meterType: `i32`
}))
/*...*/
this.#instance = new WebAssembly.Instance(compiledModule, {
    env: {
        memory: this.#memory,
        ...(env??{})
    },
    metering: {
        usegas(gas) {
            that.#gas -= gas
            if (that.#gas <= 0) throw new Error("Execution time exceeded!")
        }
    }
})
```

Well, it stops now, but that's not the solution... yet!
Now we need to sprinkle on some `asyncify`. Asyncify pass from `binaryen` adds stack unwind and rewind handling and exports functions to start and finish the process.
Due to the way it is done, to stop the execution we need start unwind from within user code execution and finish it from the outside.
To rewind, we need to start outside, call the same function that resulted in unwind and then finish from the inside.
Everything is stored inside module memory, so saving/loading from disk is as simple as saving/loading whole module memory so lets start with that.

```js
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
```

With that out of the way, we can add unwind and rewind calls.

`run` method:

```js
run(gas) {
    this.#gas += gas
    if (this.#gas <= 0)
        return false

    if (this.#paused) this.#exports.asyncify_start_rewind(DATA_ADDR) //start stack rewinding

    this.#exports.entry() //resume execution
    if (this.#paused)
        this.#exports.asyncify_stop_unwind() //stop stack unwinding

    return !this.#paused //return true if execution finished
}
```

`usegas` function:

```js
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
```

And... that's it. We have cpu limiting, memory limiting, pausing, resuming and serialization of the state for simple C code.
It's far from production ready, since running any real code required stl and this approach requires you to provide it, but I hope you will find this POC useful.