import Bezier from "@rbxts/cubic-bezier";
import Object from "@rbxts/object-utils";
import React, { useEffect, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import { t } from "@rbxts/t";
import type { AnimationProps, BezierArguments, CastsToTarget, Target, Transition, VariantLabel } from ".";
import CustomTween, { EasingFunction } from "./CustomTween/src";
import easings from "./easings";

function getVariant<T extends Instance>(variants: AnimationProps<T>["variants"], variant: VariantLabel) {
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
	target: VariantLabel | Target<T>,
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
	const tweens: (Tween | CustomTween<T>)[] = [];

	targets.forEach((target) => {
		const { transition } = target;
		const properties: Partial<Extract<T, Tweenable>> = {};
		removeTransition(target, properties);
		const createNative = (tweenInfo: TweenInfo) =>
			tweens.push(TweenService.Create(instance, tweenInfo, properties));
		const createCustom = (easing: EasingFunction) =>
			tweens.push(
				new CustomTween(
					instance,
					{
						time: transition?.duration,
						easing,
						repeatCount: transition?.repeatCount,
						reverses: transition?.reverses,
						delayTime: transition?.delay,
					},
					properties,
				),
			);
		const createBezier = (bezierArguments: BezierArguments) => createCustom(new Bezier(...bezierArguments));

		const easing = transition?.easing ?? transition?.easingFunction;

		// ! the README lies: `easing` is `undefined` by default, not `linear`
		// this is done to avoid exposing new users to the deprecated `easingStyle`,
		// `easingDirection` and `easingFunction`, but also to keep legacy code working
		if (easing !== undefined) {
			if (typeIs(easing, "string")) {
				const preset = easings[easing];
				if (preset[1]) {
					createNative(
						preset[1](
							transition?.duration,
							transition?.repeatCount,
							transition?.reverses,
							transition?.delay,
						),
					);
				} else createBezier(preset[0]);
			} else if (t.array(t.number)(easing)) {
				// it's preferable to use a native tween, so we search through easings to see
				// if the provided easing function has a native equivalent and use that instead
				let foundNativeEquivalent = false;
				// eslint-disable-next-line
				for (const [_, [easingFunction, native]] of ipairs(Object.values(easings))) {
					if (easingFunction && native && Object.deepEquals(easing, easingFunction)) {
						createNative(
							native(
								transition?.duration,
								transition?.repeatCount,
								transition?.reverses,
								transition?.delay,
							),
						);
						foundNativeEquivalent = true;
						break;
					}
				}

				if (!foundNativeEquivalent) createBezier(easing);
			} else createCustom(easing);
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
	const currentTargets: Target<T>[] = castToTargets(variants, variantState, transition) ?? [];
	/**
	 * ? variantState is overridden by the `animate` prop,
	 * which in effect makes `setVariant` in a normal use of
	 * useAnimation useless if `animate` is defined. rethink
	 * how this is implemented, maybe?
	 */
	const targets = castToTargets(variants, animate, transition) ?? currentTargets;

	// initial
	useEffect(() => {
		const element = ref.current;
		if (element === undefined) return;

		initial ??= true;
		if (typeIs(initial, "boolean")) {
			if (initial) {
				tween(element, targets);
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
		if (ref.current !== undefined) return tween(ref.current, targets);
	}, [ref, variants, variantState, animate, transition]);

	return [typeIs(variantState, "string") ? variantState : "", setVariantState];
}
