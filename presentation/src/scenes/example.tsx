import {makeSlide, titleSlide} from "../templates/jp";
import {all, beginSlide, createRef} from "@motion-canvas/core";
import {Code, Layout, lines} from "@motion-canvas/2d";
import {JsCode, CCode} from "../components/Code";
import {FC} from "../templates/types";
import {Text} from "../templates/jp/components";

const cSource = `\
__attribute__((import_module("env"), import_name("print")))
extern void print(int);

void entry() {
    for (int i=0; i<16; ++i) print(i);
}`

const jsSource = `\
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
console.log("Finished execution")`

const resultSource = `\
Running first instance
0
1
2
3
4
First instance paused
Creating new instance and moving serialized state
Running second instance from first instance memory snapshot
5
6
7
8
9
10
11
Execution paused, performing tick
12
13
14
15
Execution paused, performing tick
Finished execution`

const CodeLabel: FC<{title: string}> = ({children, title}) => {
    return <Layout layout direction={"column"} gap={10} alignItems={"start"}>
        <Text fontSize={24}>{title}</Text>
        {children}
    </Layout>
}

export default makeSlide(titleSlide({
    title: "Example",
    slide: function* (root) {
        const cCode = createRef<Code>()
        const jsCode = createRef<Code>()
        const result = createRef<Code>()

        root.add(<Layout layout width={1200} height={1000} alignItems={"stretch"} direction={"row"} gap={60}>
            <CodeLabel title={"Js runner code:"}>
                <JsCode ref={jsCode} code={jsSource} fontSize={18}/>
            </CodeLabel>
            <Layout layout alignItems={"start"} direction={"column"} gap={60}>
                <CodeLabel title={"C function code:"}>
                    <CCode ref={cCode} code={cSource} fontSize={18}/>
                </CodeLabel>
                <CodeLabel title={"Result:"}>
                    <JsCode ref={result} code={resultSource} fontSize={18}/>
                </CodeLabel>
            </Layout>
        </Layout>)

        yield* all(
            cCode().selection([], 0),
            jsCode().selection([], 0),
            result().selection([], 0)
        )

        yield* beginSlide("show_js")
        yield* jsCode().selection([lines(0, 100)], 0.2)

        yield* beginSlide("show_c")
        yield* all(
            jsCode().selection([], 0.2),
            cCode().selection([lines(0, 100)], 0.2)
        )

        yield* beginSlide("show_result")
        yield* all(
            cCode().selection([], 0.2),
            result().selection([lines(0, 100)], 0.2)
        )
    }
}), {})