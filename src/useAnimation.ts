import Object from "@rbxts/object-utils";
import React, { useEffect, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import { t } from "@rbxts/t";
import type { AnimationProps, BezierArguments, CastsToTarget, TargetAndTransition, Transition } from ".";
import BezierTween from "./bezier-tween/src";
import easings from "./easings";

function getVariant<T extends Instance>(variants: AnimationProps<T>["variants"], variant: string) {
	assert(variants, `Variant "${variant}" cannot be set because no variants have been set`);
	assert(
		variant in variants,
		`Variant "${tostring(variant)}" is invalid: ${Object.keys(variants)
			.filter((v) => typeIs(v, "string"))
			.join(", ")}`,
	);
	return variants[variant];
}

function addDefaultTransition<T extends Instance>(
	variants: AnimationProps<T>["variants"],
	animation: string | TargetAndTransition<T>,
	transition?: Transition,
) {
	const targetAndTransition = typeIs(animation, "string") ? getVariant(variants, animation) : animation;
	return { ...targetAndTransition, transition: { ...transition, ...targetAndTransition.transition } };
}

function castToTargetsAndTransitions<T extends Instance>(
	variants: AnimationProps<T>["variants"],
	animations: CastsToTarget<T> | undefined,
	transition?: Transition,
) {
	if (animations === undefined) return undefined;
	if (t.array(t.union(t.string, t.table))(animations)) {
		const casted = animations.map((animation) => addDefaultTransition(variants, animation, transition));

		// some animations may apply to the same property, resulting in multiple
		// Tweens potentially messing with it, so all conflicts are handled here
		const alreadyModified = new Set<keyof Partial<Extract<T, Tweenable>>>();
		for (let i = casted.size() - 1; i >= 0; i--)
			for (const [key, _] of pairs(casted[i] as object)) {
				if (key === "transition") continue;
				if (alreadyModified.has(key as never)) {
					delete casted[i][key as never];
				} else alreadyModified.add(key as never);
			}

		return casted;
	}
	return [addDefaultTransition(variants, animations, transition)];
}

function applyTarget<T extends Instance>(toCopy: TargetAndTransition<T>, applyOn: object) {
	for (const [key, value] of pairs(toCopy as object))
		if (key !== "transition") applyOn[key as never] = value as never;
}

// sure is great TweenInfo.new is one of the only
// APIs that doesn't automatically cast enums
const castToEnum = <T extends Enum, K extends keyof Omit<T, "GetEnumItems">>(
	enumObject: T,
	enumItem: EnumItem | K | undefined,
) => (typeIs(enumItem, "string") ? enumObject[enumItem] : enumItem);

function tween<T extends Instance>(instance: T, animations: TargetAndTransition<T>[]) {
	const tweens: (BezierTween<T> | Tween)[] = [];

	animations.forEach((animation) => {
		const { transition } = animation;
		const properties: Partial<Extract<T, Tweenable>> = {};
		applyTarget(animation, properties);
		const createNative = (tweenInfo: TweenInfo) =>
			tweens.push(TweenService.Create(instance, tweenInfo, properties));
		const createBezier = (easingFunction: BezierArguments) =>
			tweens.push(
				new BezierTween(
					instance,
					{
						time: transition?.duration,
						bezier: easingFunction,
						repeatCount: transition?.repeatCount,
						reverses: transition?.reverses,
						delayTime: transition?.delay,
					},
					properties,
				),
			);

		// ! the README lies: `easingFunction` is `undefined` by default, not `linear`
		// this is done to avoid introducing new users to `easingStyle` and `easingDirection`,
		// which have been deprecated, but also to keep legacy code working
		if (transition?.easingFunction !== undefined) {
			if (typeIs(transition.easingFunction, "string")) {
				const easing = easings[transition.easingFunction];
				if (easing[1]) {
					createNative(
						easing[1](transition.duration, transition.repeatCount, transition.reverses, transition.delay),
					);
				} else createBezier(easing[0]);
			} else {
				// it's preferable to use a native tween, so we search through easings to see
				// if the provided easing function has a native equivalent and use that instead
				let foundNativeEquivalent = false;
				// eslint-disable-next-line
				for (const [_, [easingFunction, native]] of ipairs(Object.values(easings))) {
					if (easingFunction && native && Object.deepEquals(transition.easingFunction, easingFunction)) {
						createNative(
							native(transition.duration, transition.repeatCount, transition.reverses, transition.delay),
						);
						foundNativeEquivalent = true;
						break;
					}
				}

				if (!foundNativeEquivalent) createBezier(transition.easingFunction);
			}
		}
		// ! legacy
		else
			createNative(
				new TweenInfo(
					transition?.duration ?? 1,
					(castToEnum(Enum.EasingStyle, transition?.easingStyle) as Enum.EasingStyle) ??
						Enum.EasingStyle.Linear,
					(castToEnum(Enum.EasingDirection, transition?.easingDirection) as Enum.EasingDirection) ??
						Enum.EasingDirection.InOut,
					transition?.repeatCount ?? 0,
					transition?.reverses ?? false,
					transition?.delay ?? 0,
				),
			);
	});

	tweens.forEach((tween) => (tween as Tween).Play()); // TS complains if I don't do this stupid type assertion
	return () => tweens.forEach((tween) => (tween as Tween).Destroy());
}

export default function <T extends Instance>(
	ref: React.RefObject<T>,
	{ animate, initial, transition, variants }: AnimationProps<T>,
): [string, (variant: string) => void] {
	const [variantState, setVariantState] = useState<CastsToTarget<T>>();
	const currentAnimations: TargetAndTransition<T>[] =
		castToTargetsAndTransitions(variants, variantState, transition) ?? [];
	/**
	 * ? variantState is overridden by the `animate` prop,
	 * which in effect makes `setVariant` in a normal use of
	 * useAnimation useless if `animate` is defined. rethink
	 * how this is implemented, maybe?
	 */
	const animations = castToTargetsAndTransitions(variants, animate, transition) ?? currentAnimations;

	// initial
	useEffect(() => {
		const element = ref.current;
		if (element === undefined) return;

		initial ??= true;
		if (typeIs(initial, "boolean")) {
			if (initial) {
				tween(element, animations);
			} else {
				animations.forEach((animation) => applyTarget(animation, element));
			}
			return;
		}

		applyTarget(
			castToTargetsAndTransitions(variants, initial, {})!.reduce(
				(accumulator, targetAndTransition) => ({
					...accumulator,
					...targetAndTransition,
				}),
				{},
			),
			element,
		);
	}, []);

	// animate
	useEffect(() => {
		if (ref.current !== undefined) return tween(ref.current, animations);
	}, [ref, variants, variantState, animate, transition]);

	return [typeIs(variantState, "string") ? variantState : "", setVariantState];
}
