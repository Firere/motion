import Object from "@rbxts/object-utils";
import React from "@rbxts/react";
import { WithAnimationProps } from ".";
import useAnimation from "./useAnimation";

function withAnimation<T extends Instance, K extends keyof JSX.IntrinsicElements>(elementType: K) {
	return React.forwardRef((props: JSX.IntrinsicElements[K] & WithAnimationProps<T>, forwardedRef?: React.Ref<T>) => {
		const { initial, animate, transition, variants } = props;
		const ref = forwardedRef ?? React.createRef<T>();
		useAnimation<T>(variants ?? {}, ref, initial, animate, transition);
		const rest = Object.fromEntries(
			Object.entries(props).filter(
				([key]) => !["initial", "animate", "transition", "variants", "ref"].includes(key as unknown as string),
			) as readonly (readonly [string | number | symbol, unknown])[],
		) as JSX.IntrinsicElements[K];

		return React.createElement(elementType as keyof CreatableInstances, {
			...(rest as JSX.IntrinsicElements[K]),
			ref: ref,
		});
	});
}

export const motion = {
	frame: withAnimation<Frame, "frame">("Frame" as "frame"),
	imagelabel: withAnimation<ImageLabel, "imagelabel">("ImageLabel" as "imagelabel"),
	imagebutton: withAnimation<ImageButton, "imagebutton">("ImageButton" as "imagebutton"),
	scrollingframe: withAnimation<ScrollingFrame, "scrollingframe">("ScrollingFrame" as "scrollingframe"),
	textlabel: withAnimation<TextLabel, "textlabel">("TextLabel" as "textlabel"),
	textbox: withAnimation<TextBox, "textbox">("TextBox" as "textbox"),
	textbutton: withAnimation<TextButton, "textbutton">("TextButton" as "textbutton"),
	uicorner: withAnimation<UICorner, "uicorner">("UICorner" as "uicorner"),
	uigridlayout: withAnimation<UIGridLayout, "uigridlayout">("UIGridLayout" as "uigridlayout"),
	uilistlayout: withAnimation<UIListLayout, "uilistlayout">("UIListLayout" as "uilistlayout"),
	uipadding: withAnimation<UIPadding, "uipadding">("UIPadding" as "uipadding"),
	uisizeconstraint: withAnimation<UISizeConstraint, "uisizeconstraint">("UISizeConstraint" as "uisizeconstraint"),
	uistroke: withAnimation<UIStroke, "uistroke">("UIStroke" as "uistroke"),
};
