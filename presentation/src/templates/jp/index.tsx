import {makeScene2D, Node} from "@motion-canvas/2d";
import {PresentationFactory, SlideFactory} from "../types";
import {combineSlides, prependAction} from "../combineSlides";
import {Direction, slideTransition} from "@motion-canvas/core";

type Props = {
    first?: boolean
}

export const makeSlide: SlideFactory<Props> = (slide) =>
    makeScene2D(function* (view) {
        const contentRoot = <Node/>

        view.fill('#242424');

        const animations = slide(contentRoot)
        view.add(contentRoot)

        yield* animations
    })

export const makePresentation: PresentationFactory<Props> = (slides, props) =>
    makeSlide(combineSlides(slides.map((s, i) => i > 0 ? prependAction(s, slideTransition(Direction.Right)) : s )), props)

export * from "./slides"