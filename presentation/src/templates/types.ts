import {SceneDescription, ThreadGenerator, ThreadGeneratorFactory} from "@motion-canvas/core";
import {Node, NodeProps, View2D} from "@motion-canvas/2d";

export type FC<Props extends object = {}> = (p: Props & NodeProps) => Node
export type LFC<Props extends object = {}> = (p: Props & Omit<NodeProps, "children">) => Node


export type Slide = (root: Node) => ThreadGenerator
export type SlideFactory<Args extends object | undefined> = (slide: Slide, args: Args) => Presentation

export type Presentation = SceneDescription<ThreadGeneratorFactory<View2D>>
export type PresentationFactory<Args extends object | undefined> = (slides: Slide[], args: Args) => Presentation