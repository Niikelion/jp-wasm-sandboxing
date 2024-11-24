import {Layout, LayoutProps, Node, Rect} from "@motion-canvas/2d";
import {
    all,
    beginSlide,
    createRef,
    createSignal,
    Direction,
    easeInOutCubic,
    slideTransition
} from "@motion-canvas/core";
import {Root, Header, SubHeader} from "./components";
import {Slide, FC} from "../types";

type TitleSlideProps = {
    title: string
    slide: Slide
}

const Content: FC<LayoutProps> = ({children, ...props}) => {
    return <Layout layout {...props}>
        {children}
    </Layout>
}
type Content = Layout

const st = (prefix: string, title: string) => `${prefix} of ${title}`
const startOf = (title: string) => st("Start", title)
const endOf = (title: string) => st("End", title)

export const titleSlide = ({title, slide}: TitleSlideProps): Slide => function* (root) {
    const started = createSignal(false)
    const header = createRef<Header>()
    const content = createRef<Content>();
    const contentAnchor = createRef<Content>()
    const contentWrapper = createRef<Node>()

    const contentRoot = <Rect/>

    root.add(
        <Root>
            <Header ref={header} layout margin={40}>{title}</Header>
            <Content ref={content} grow={0}>
                <Content ref={contentAnchor} grow={1} width={"100%"}/>
            </Content>
        </Root>
    )
    root.add(<Node ref={contentWrapper}>{() => started() ? contentRoot : null}</Node>)

    contentWrapper().absolutePosition(contentAnchor().absolutePosition())


    yield* slideTransition(Direction.Right)

    yield* beginSlide(startOf(title))
    yield* all(
        content().grow(1, 0.5, easeInOutCubic),
        header().fontSize(60, 0.5, easeInOutCubic)
    )
    started(true)

    yield* slide(contentRoot)

    yield* beginSlide(endOf(title))
}

type CoverSlideProps = {
    title: string,
    subTitle?: string
    isFirst?: boolean
}

export const coverSlide = ({title, subTitle, isFirst}: CoverSlideProps): Slide => function* (root) {
    root.add(<Root>
        <Layout direction="column">
            <Header layout>{title}</Header>
            {subTitle && <SubHeader>{subTitle}</SubHeader>}
        </Layout>
    </Root>)

    if (!isFirst)
       yield* slideTransition(Direction.Right)

    yield* beginSlide(endOf(title))
}