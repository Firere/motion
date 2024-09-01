import Object from "@rbxts/object-utils";
import React, { useEffect, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import { t } from "@rbxts/t";
import type { AnimationProps, BezierDefinition, CastsToTarget, Target, Transition, Variant } from ".";
import Bezier from "./cubic-bezier";
import CustomTween, { Callback, EasingFunction } from "./CustomTween/src";
import easings from "./easings";

function getVariant<T extends Instance>(variants: AnimationProps<T>["variants"], variant: Variant) {
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
	target: Variant | Target<T>,
	transition?: Transition,
) {
	const casted = typeIs(target, "string") ? getVariant(variants, target) : target;
	return { ...casted, transition: { ...transition, ...casted.transition } };
}

function castToTargets<T extends Instance>(
	variants: AnimationProps<T>["variants"],
	targets: CastsToTarget<T> | undefined,
	transition?: Transition,
) {
	if (targets === undefined) return undefined;
	if (t.array(t.union(t.string, t.table))(targets)) {
		const casted = targets.map((target) => addDefaultTransition(variants, target, transition));

		// some targets may contain the same property, resulting in multiple
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
	return [addDefaultTransition(variants, targets, transition)];
}

function removeTransition<T extends Instance>(toCopy: Target<T>, applyOn: object) {
	for (const [key, value] of pairs(toCopy as object))
		if (key !== "transition") applyOn[key as never] = value as never;
}

// sure is great TweenInfo.new is one of the only
// APIs that doesn't automatically cast enums
const castToEnum = <T extends Enum, K extends keyof Omit<T, "GetEnumItems">>(
	enumObject: T,
	enumItem: EnumItem | K | undefined,
) => (typeIs(enumItem, "string") ? enumObject[enumItem] : enumItem);

function tween<T extends Instance>(instance: T, targets: Target<T>[]) {
	const tweens: { tween: Tween | CustomTween<T>; callback?: Callback }[] = [];

	targets.forEach((target) => {
		let transition = target.transition;
		// explicitly defines defaults in case either `Tween` or `CustomTween` change their own defaults
		transition ??= { duration: 1, ease: "linear", repeatCount: 0, reverses: false, delay: 0 };
		const { duration, easingStyle, easingDirection, easingFunction, repeatCount, reverses, delay, callback } =
			transition;

		const properties = { ...target, transition: undefined };
		const createNative = (tweenInfo: TweenInfo) => {
			const tween = TweenService.Create(instance, tweenInfo, properties);
			tweens.push({ tween, callback });
			if (callback) tween.Completed.Connect(callback);
		};
		const createCustom = (easing: EasingFunction) =>
			tweens.push({
				tween: new CustomTween(
					instance,
					{ time: duration, easing, repeatCount, reverses, delayTime: delay, callback },
					properties,
				),
			});
		const createBezier = (bezierArguments: BezierDefinition) => createCustom(new Bezier(...bezierArguments));

		let ease = transition.ease ?? easingFunction;
		if (easingStyle === undefined && easingDirection === undefined) ease ??= "linear";

		if (ease !== undefined) {
			if (typeIs(ease, "string")) {
				const preset = easings[ease];
				if (preset[1]) {
					createNative(preset[1](duration, repeatCount, reverses, delay));
				} else createBezier(preset[0]);
			} else if (t.array(t.number)(ease)) {
				// it's preferable to use a native tween, so we search through easings to see
				// if the provided easing function has a native equivalent and use that instead
				let foundNativeEquivalent = false;
				// eslint-disable-next-line
				for (const [_, [easingFunction, native]] of ipairs(Object.values(easings))) {
					if (easingFunction && native && Object.deepEquals(ease, easingFunction)) {
						createNative(native(duration, repeatCount, reverses, delay));
						foundNativeEquivalent = true;
						break;
					}
				}

				if (!foundNativeEquivalent) createBezier(ease);
			} else createCustom(ease);
		}
		// ! legacy
		else
			createNative(
				new TweenInfo(
					duration ?? 1,
					(castToEnum(Enum.EasingStyle, easingStyle) as Enum.EasingStyle) ?? Enum.EasingStyle.Linear,
					(castToEnum(Enum.EasingDirection, easingDirection) as Enum.EasingDirection) ??
						Enum.EasingDirection.InOut,
					repeatCount ?? 0,
					reverses ?? false,
					delay ?? 0,
				),
			);
	});

	tweens.forEach((tween) => (tween.tween as Tween).Play()); // TS complains if I don't do this stupid type assertion
	return () =>
		tweens.forEach((tween) => {
			if (typeIs(tween.tween, "Instance")) tween.callback?.(tween.tween.PlaybackState);
			(tween.tween as Tween).Destroy();
		});
}

export default function <T extends Instance>(
	ref: React.RefObject<T>,
	{ animate, initial, transition, variants }: AnimationProps<T>,
): [string, (variant: string) => void] {
	const [variantState, setVariantState] = useState<CastsToTarget<T>>();
	const currentTargets: Target<T>[] = castToTargets(variants, variantState, transition) ?? [];
	/**
	 * ? variantState is overridden by the `animate` prop,
	 * which in effect makes `setVariant` in a normal use of
	 * useAnimation useless if `animate` is defined. rethink
	 * how this is implemented, maybe?
	 */
	const targets = castToTargets(variants, animate, transition) ?? currentTargets;

	// initial
	let initialTweenDestructor: (() => void) | undefined;
	useEffect(() => {
		const element = ref.current;
		if (element === undefined) return;

		initial ??= true;
		if (typeIs(initial, "boolean")) {
			if (initial) {
				initialTweenDestructor = tween(element, targets);
			} else {
				targets.forEach((target) => removeTransition(target, element));
			}
			return;
		}

		removeTransition(
			castToTargets(variants, initial, {})!.reduce(
				(accumulator, target) => ({
					...accumulator,
					...target,
				}),
				{},
			),
			element,
		);
	}, []);

	// animate
	useEffect(() => {
		if (ref.current !== undefined) {
			initialTweenDestructor?.();
			return tween(ref.current, targets);
		}
	}, [ref, variants, variantState, animate, transition]);

	return [typeIs(variantState, "string") ? variantState : "", setVariantState];
}