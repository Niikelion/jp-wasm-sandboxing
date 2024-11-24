import {Slide} from "./types";
import {ThreadGenerator} from "@motion-canvas/core";

export const combineSlides = (slides: Slide[]): Slide => function* (root) {
    for (const slide of slides) {
        root.removeChildren()
        yield* slide(root)
    }
}

export const prependAction = (slide: Slide, action: ThreadGenerator): Slide => function* (root) {
    const animations = slide(root)
    yield* action
    yield* animations
}

export const appendAction = (slide: Slide, action: ThreadGenerator): Slide => function* (root) {
    yield* slide(root)
    yield* action
}