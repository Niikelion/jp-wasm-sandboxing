import { Layout } from "@motion-canvas/2d";
import {FC} from "../../types";

export const Root: FC = ({children}) =>
    <Layout layout direction="column" grow={1} width="100%" height="100%" alignItems="center" justifyContent="center">
        {children}
    </Layout>