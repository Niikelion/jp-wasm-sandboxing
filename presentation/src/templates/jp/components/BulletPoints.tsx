import {Circle, Layout, LayoutProps} from "@motion-canvas/2d";
import {Text} from "./Text";
import {FC} from "../../types";
import {range} from "@motion-canvas/core";

const Point = ({text}: { text: string }) => {
    return <Layout layout direction={'row'} alignItems={'center'} gap={20}>
        <Circle width={20} height={20} fill={"white"} shrink={0}/>
        <Text textWrap={true} fontSize={40}>{text}</Text>
    </Layout>
}

export const BulletPoints: FC<LayoutProps & { title?: string, points: string[], currentPoint?: number }> = ({title, points, currentPoint, ...props}) => {
    return <Layout {...props}>
        {() => range(currentPoint??points.length+(title !== undefined ? 1 : 0)).map(i =>
            i === 0 && title !== undefined ? <Text fontSize={40}>{title}</Text> : <Point text={points[i-(title !== undefined ? 1 : 0)]}/>)}
    </Layout>
}