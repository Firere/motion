import Object from "@rbxts/object-utils";
import React from "@rbxts/react";
import type { ReactMotionProps } from ".";
import useAnimation from "./useAnimation";

/**
 * Exported in case users want to use instances other than the ones exported by default.
 * @param elementType  Instance class to convert to a motion component. Must be creatable.
 * @returns Motion component of whatever `Instance` was passed in. You can use this just like you'd use any of the `motion.[element]` components.
 */
export function withAnimation<
	K extends keyof CreatableInstances,
	T extends CreatableInstances[K] = CreatableInstances[K],
>(elementType: K) {
	return React.forwardRef((props: ReactMotionProps<T>, forwardedRef?: React.Ref<T>) => {
		const { initial, animate, transition, variants } = props;
		const ref = (forwardedRef as React.RefObject<T>) ?? React.createRef<T>();
		useAnimation(ref, { animate, initial, transition, variants });

		const rest = Object.fromEntries(
			Object.entries(props).filter(
				([key]) => !["initial", "animate", "transition", "variants", "ref"].includes(key as string),
			) as readonly (readonly [string | number | symbol, unknown])[],
		) as React.InstanceProps<T>;

		return React.createElement(elementType, {
			...rest,
			ref,
		});
	});
}

export const motion = {
	frame: withAnimation("Frame"),
	imagelabel: withAnimation("ImageLabel"),
	imagebutton: withAnimation("ImageButton"),
	scrollingframe: withAnimation("ScrollingFrame"),
	textlabel: withAnimation("TextLabel"),
	textbox: withAnimation("TextBox"),
	textbutton: withAnimation("TextButton"),
	uicorner: withAnimation("UICorner"),
	uigridlayout: withAnimation("UIGridLayout"),
	uilistlayout: withAnimation("UIListLayout"),
	uipadding: withAnimation("UIPadding"),
	uisizeconstraint: withAnimation("UISizeConstraint"),
	uistroke: withAnimation("UIStroke"),
};
