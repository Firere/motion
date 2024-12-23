import Object from "@rbxts/object-utils";
import React, { useContext, useEffect, useMemo, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import type { AnimationProps, BezierDefinition, CastsToTargets, Target, Transition } from ".";
import Bezier from "./cubic-bezier";
import CustomTween, { Callback, EasingFunction } from "./CustomTween/src";
import easings, { Easing, NativeTweenDefinition } from "./easings";
import TargetUtility, { defaultTransition } from "./TargetUtility";

const castToName = (item: EnumItem | string) => (typeIs(item, "string") ? item : item.Name);
const isNative = (easing: BezierDefinition | NativeTweenDefinition): easing is NativeTweenDefinition =>
	easing.size() === 2;

interface TweenController {
	destroy: () => void;
	play: () => void;
}

function tween<T extends Instance>(instance: T, targets: Target<T>[]) {
	const tweens: { tween: Tween | CustomTween<T>; callback?: Callback }[] = targets.map((target) => {
		const transition = { ...defaultTransition, ...target.transition };
		const { duration, reverses, delay, precision, callback } = transition;
		const repeatCount = transition.repeat ?? transition.repeatCount ?? 0;

		const properties = { ...target, transition: undefined };
		const createCustom = (easing: EasingFunction) => ({
			tween: new CustomTween(
				instance,
				{
					time: duration,
					easing,
					repeatCount,
					reverses,
					delayTime: delay,
					callback,
				},
				properties,
				precision,
			),
		});
		const createBezier = (definition: BezierDefinition) => createCustom(new Bezier(...definition));

		const ease = (() => {
			if (transition.ease) return transition.ease;

			const { easingDirection, easingFunction, easingStyle } = transition;
			if (easingFunction) {
				warn(
					"`easingFunction` has been deprecated in favour of `ease`.",
					"To migrate, simply replace `easingFunction` with `ease`.",
				);
				return easingFunction;
			}
			if (easingStyle !== undefined || easingDirection !== undefined)
				warn(
					"`easingStyle` and `easingDirection` have been deprecated in favour of `ease`.",
					"To migrate, visit the migration guide: https://firere.github.io/motion/blog/migration-v2#easingstyle-and-easingdirection",
				);

			let style = castToName(easingStyle ?? "Linear");
			if (style === "Linear") return "linear";
			else if (style === "Circular" || style === "Exponential") style = style.sub(1, 4);
			const direction = castToName(easingDirection ?? "InOut");
			const easing = "ease" + direction + style;
			if (!(easing in easings)) error("Motion internal error: easing incorrectly constructed: " + easing);
			return easing as Easing;
		})();

		if (typeIs(ease, "string")) {
			const easing = easings[ease];

			if (isNative(easing)) {
				const [style, direction] = easing;
				const tween = TweenService.Create(
					instance,
					new TweenInfo(duration, style, direction, repeatCount, reverses, delay),
					properties,
				);
				if (callback) tween.Completed.Connect(callback);
				return { tween, callback };
			} else return createBezier(easing);
		}
		return typeIs(ease, "function") ? createCustom(ease) : createBezier(ease);
	});

	tweens.forEach(({ tween }) => (tween as Tween).Play()); // TS complains if I don't do this stupid type assertion
	return () =>
		tweens.forEach(({ tween, callback }) => {
			callback?.(tween.PlaybackState);
			(tween as Tween).Destroy();
		});
}

export default function <T extends Instance>(
	ref: React.RefObject<T>,
	{ animate, exit, initial, transition, variants }: AnimationProps<T>,
): [CastsToTargets<T> | undefined, (variant?: CastsToTargets<T>) => void] {
	/**
	 * @deprecated
	 */
	const [variantState, setVariantState] = useState<CastsToTargets<T>>();

	const utility = useMemo(() => new TargetUtility(transition, variants), [transition, variants]);

	const presenceContext = useContext(PresenceContext);

	/**
	 * ? variantState is overridden by the `animate` prop,
	 * which in effect makes `setVariant` in a normal use of
	 * useAnimation useless if `animate` is defined. rethink
	 * how this is implemented, maybe?
	 */
	const targets = utility.castToTargets(animate ?? variantState) ?? [];

	// initial
	let initialTweenDestructor: (() => void) | undefined;
	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		// ? this means callbacks don't get run because `tween` is never run, which might be unexpected
		const applyProperties = (properties: Target<T>) => {
			for (const [key, value] of pairs(properties as object))
				if (key !== "transition") element[key as never] = value as never;
		};

		const nonNil = initial ?? true;
		if (!typeIs(nonNil, "boolean")) {
			applyProperties(
				utility
					.castToTargets(nonNil, true)!
					.reduce((accumulator, current) => ({ ...accumulator, ...current }), {}),
			);
		} else if (nonNil) {
			initialTweenDestructor = tween(element, targets);
		} else {
			targets.forEach(applyProperties);
		}
	}, []);

	// animate
	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		initialTweenDestructor?.();
		return tween(element, targets);
	}, [ref, variants, variantState, animate, transition]);

	return [
		variantState,
		(variant) => {
			if (animate !== undefined) warn("`animate` prop overrides internal target state.");
			warn("`variant` and `setVariant` have been deprecated in favour of setting the `animate` prop.");
			setVariantState(variant);
		},
	];
}
