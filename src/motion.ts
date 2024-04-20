import React from "@rbxts/react";
import type { AnimationProps } from ".";
import useAnimation from "./useAnimation";

/**
 * Exported in case users want to use instances other than the ones exported by default.
 * @param elementType  Instance class to convert to a motion component. Must be creatable.
 * @returns Motion component of whatever `Instance` was passed in. You can use this just like you'd use any of the `motion.[element]` components.
 */
export function createMotionComponent<
	K extends keyof CreatableInstances,
	T extends CreatableInstances[K] = CreatableInstances[K],
>(elementType: K) {
	return React.forwardRef((props: React.InstanceProps<T> & AnimationProps<T>, forwardedRef?: React.Ref<T>) => {
		const { initial, animate, transition, variants } = props;
		const ref = (forwardedRef as React.RefObject<T>) ?? React.createRef<T>();
		useAnimation(ref, { animate, initial, transition, variants });

		const rest: React.InstanceProps<T> = {};
		for (const [key, value] of pairs(props as object)) {
			if (["animate", "initial", "transition", "ref", "variants"].includes(key as string)) continue;
			rest[key as never] = value as never;
		}

		return React.createElement(elementType, {
			...rest,
			ref,
		});
	});
}

export const motion = {
	frame: createMotionComponent("Frame"),
	imagelabel: createMotionComponent("ImageLabel"),
	imagebutton: createMotionComponent("ImageButton"),
	scrollingframe: createMotionComponent("ScrollingFrame"),
	textlabel: createMotionComponent("TextLabel"),
	textbox: createMotionComponent("TextBox"),
	textbutton: createMotionComponent("TextButton"),
	uicorner: createMotionComponent("UICorner"),
	uigridlayout: createMotionComponent("UIGridLayout"),
	uilistlayout: createMotionComponent("UIListLayout"),
	uipadding: createMotionComponent("UIPadding"),
	uisizeconstraint: createMotionComponent("UISizeConstraint"),
	uistroke: createMotionComponent("UIStroke"),
};
