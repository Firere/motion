import Object from "@rbxts/object-utils";
import React, { useContext, useEffect, useMemo, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import { t } from "@rbxts/t";
import type { AnimationProps, BezierDefinition, CastsToTargets, Target, Transition } from ".";
import Bezier from "./cubic-bezier";
import CustomTween, { Callback, EasingFunction } from "./CustomTween/src";
import easings, { Easing } from "./easings";
import PresenceContext from "./Presence/PresenceContext";
import TargetUtility, { defaultTransition } from "./TargetUtility";

const castToName = (item: EnumItem | string) => (typeIs(item, "string") ? item : item.Name);

function tween<T extends Instance>(instance: T, targets: Target<T>[]) {
	const tweens: { tween: Tween | CustomTween<T>; callback?: Callback }[] = [];

	targets.forEach((target) => {
		const transition = { ...defaultTransition, ...target.transition };
		const { duration, easingStyle, easingDirection, easingFunction, repeatCount, reverses, delay, callback } =
			transition;

		const properties = { ...target, transition: undefined };
		const createNative = (style: Enum.EasingStyle, direction: Enum.EasingDirection) => {
			const tween = TweenService.Create(
				instance,
				new TweenInfo(duration, style, direction, transition.repeat ?? repeatCount ?? 0, reverses, delay),
				properties,
			);
			tweens.push({ tween, callback });
			if (callback) tween.Completed.Connect(callback);
		};
		const createCustom = (easing: EasingFunction) =>
			tweens.push({
				tween: new CustomTween(
					instance,
					{
						time: duration,
						easing,
						repeatCount: transition.repeat ?? repeatCount ?? 0,
						reverses,
						delayTime: delay,
						callback,
					},
					properties,
				),
			});
		const createBezier = (definition: BezierDefinition) => createCustom(new Bezier(...definition));

		const style = castToName(easingStyle ?? "Linear");
		const ease: Transition["ease"] =
			transition.ease ??
			easingFunction ??
			(style === "Linear"
				? "linear"
				: // ugly ternary! but this is going to be removed anyway
				  (`ease${style === "Circular" ? "Circ" : style === "Exponential" ? "Expo" : style}${castToName(
						easingDirection ?? "InOut",
				  )}` as Easing));

		if (typeIs(ease, "string")) {
			const [bezier, native] = easings[ease];
			native ? createNative(...native) : createBezier(bezier);
		} else if (t.array(t.number)(ease)) {
			// it's preferable to use a native tween, so we search through easings to see
			// if the provided easing function has a native equivalent and use that instead
			for (const [, [bezier, native]] of pairs(easings))
				if (bezier && native && Object.deepEquals(ease, bezier)) return createNative(...native);

			createBezier(ease);
		} else createCustom(ease);
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
			applyProperties(utility.castToTargets(nonNil, true)!.reduce(Object.assign, {}));
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

	return [variantState, setVariantState];
}
