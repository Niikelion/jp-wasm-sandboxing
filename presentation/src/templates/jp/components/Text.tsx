import {Txt, TxtProps} from "@motion-canvas/2d";
import {FC} from "../../types";

const baseProps: Pick<TxtProps, "fontFamily" | "fill"> = {
    fontFamily: "Montserrat",
    fill: "white"
}

const BaseText: FC<TxtProps> = ({children, ...props}) =>
    <Txt {...baseProps} {...props}>{children}</Txt>

export const headerProps: Pick<TxtProps, "fontWeight" | "fontSize"> = {
    fontWeight: 400,
    fontSize: 90
}

export const Header: FC<TxtProps> = ({children, ...props}) =>
    <BaseText {...headerProps} {...props}>{children}</BaseText>
export type Header = Txt

export const subHeaderProps: Pick<TxtProps, "fontWeight" | "fontSize" | "alignSelf"> = {
    fontWeight: 300,
    fontSize: 50,
    alignSelf: "end"
}

export const SubHeader: FC<TxtProps> = ({children, ...props}) =>
    <BaseText {...subHeaderProps} {...props}>{children}</BaseText>

const textProps: Pick<TxtProps, "fontWeight" | "fontSize"> = {
    fontWeight: 200,
    fontSize: 30
}

export const Text: FC<TxtProps> = ({children, ...props}) =>
    <BaseText {...textProps} {...props}>{children}</BaseText>
export type Text = Txt