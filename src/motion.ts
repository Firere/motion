import React, { useEffect } from "@rbxts/react";
import type { AnimationProps } from ".";
import useTween from "./useTween";
import useSpritesheet, { SpritesheetArguments } from "./useSpritesheet";

function excludeKeys<T extends object>(object: T, ...keys: string[]) {
	const filtered: Partial<T> = {};
	for (const [key, value] of pairs(object))
		if (!keys.includes(key as string)) filtered[key as never] = value as never;
	return filtered;
}

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
		useTween(ref, { animate, initial, transition, variants });

		return React.createElement(elementType, {
			...excludeKeys(props, "animate", "initial", "transition", "ref", "variants"),
			ref,
		});
	});
}

function createSpritesheetComponent<
	K extends "ImageButton" | "ImageLabel",
	T extends CreatableInstances[K] = CreatableInstances[K],
>(elementType: K) {
	return React.forwardRef(
		(
			// 3 intersections - very ugly!
			props: React.InstanceProps<T> &
				AnimationProps<T> &
				Partial<Exclude<SpritesheetArguments, "active">> & {
					frameListener?: (frame: number) => void;
					frameSetter?: (setter: (frame: number) => void) => void;
				},
			ref?: React.Ref<T>,
		) => {
			const { fps, frameListener, frameSetter, imageResolution, mode, range, sprites, spritesPerLine, vertical } =
				props;

			const {
				frame: internalFrame,
				rectOffset,
				rectSize,
				setFrame,
			} = useSpritesheet({
				active: imageResolution !== undefined && sprites !== undefined && spritesPerLine !== undefined,
				fps,
				imageResolution: imageResolution ?? new Vector2(),
				mode,
				range,
				sprites: sprites ?? 0,
				spritesPerLine: spritesPerLine ?? 0,
				vertical,
			});

			useEffect(() => frameSetter?.(setFrame), [frameSetter]);

			useEffect(() => frameListener?.(internalFrame), [internalFrame]);

			return React.createElement(createMotionComponent(elementType as "ImageButton" | "ImageLabel"), {
				ref: ref as React.Ref<ImageButton | ImageLabel>,
				ImageRectOffset: rectOffset,
				ImageRectSize: rectSize,
				...(excludeKeys(
					props,
					"fps",
					"frameListener",
					"frameSetter",
					"imageResolution",
					"mode",
					"range",
					"sprites",
					"spritesPerLine",
					"vertical",
				) as React.InstanceProps<T> & AnimationProps<T>),
			});
		},
	);
}

export const motion = {
	frame: createMotionComponent("Frame"),
	imagelabel: createSpritesheetComponent("ImageLabel"),
	imagebutton: createSpritesheetComponent("ImageButton"),
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
