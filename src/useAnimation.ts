import Object from "@rbxts/object-utils";
import React, { useEffect, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import { t } from "@rbxts/t";
import type { AnimationProps, CastsToTarget, TargetAndTransition, Transition } from ".";
import BezierTween from "./BezierTween/src/index";

function getVariant<T extends Instance>(variants: AnimationProps<T>["variants"], variant: string) {
	if (variants === undefined) error(`Variant "${variant}" cannot be set because no variants have been set`);
	if (!(variant in variants))
		error(
			`Variant "${tostring(variant)}" is invalid: ${Object.keys(variants)
				.filter((v) => typeIs(v, "string"))
				.join(", ")}`,
		);
	return variants[variant]!;
}

function mergeTransitions<T extends Instance>(
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
		const casted = animations.map((animation) => mergeTransitions(variants, animation, transition));

		const properties = new Set<keyof Partial<Extract<T, Tweenable>>>();
		// iterate from the right of the array; mark all properties
		// in that animation as being modified by adding them to `properties`,
		// unless they've already been modified by an animation which
		// overrides it
		for (let i = casted.size() - 1; i >= 0; i--)
			for (const [key, _] of pairs(casted[i] as object)) {
				if (key === "transition") continue;
				if (properties.has(key as never)) {
					delete casted[i][key as never];
				} else properties.add(key as never);
			}

		return casted;
	}
	return [mergeTransitions(variants, animations, transition)];
}

// sure is great TweenInfo.new is one of the only
// APIs that doesn't automatically cast enums
const castToEnum = <T extends Enum, K extends keyof Omit<T, "GetEnumItems">>(
	enumObject: T,
	enumItem: EnumItem | K | undefined,
) => (enumItem !== undefined ? (typeIs(enumItem, "EnumItem") ? enumItem : enumObject[enumItem]) : undefined);

function tween<T extends Instance>(instance: T, animations: TargetAndTransition<T>[]) {
	const tweens: (BezierTween<T> | Tween)[] = [];

	animations.forEach((animation) => {
		const properties: Partial<Extract<T, Tweenable>> = {};
		for (const [key, value] of pairs(animation as object)) {
			if (key === "transition") continue;
			properties[key as never] = value as never;
		}
		tweens.push(
			animation.transition?.easingFunction === undefined
				? TweenService.Create(
						instance,
						new TweenInfo(
							animation.transition?.duration ?? 1,
							(castToEnum(Enum.EasingStyle, animation.transition?.easingStyle) as Enum.EasingStyle) ??
								Enum.EasingStyle.Linear,
							(castToEnum(
								Enum.EasingDirection,
								animation.transition?.easingDirection,
							) as Enum.EasingDirection) ?? Enum.EasingDirection.InOut,
							animation.transition?.repeatCount ?? 0,
							animation.transition?.reverses ?? false,
							animation.transition?.delay ?? 0,
						),
						properties,
				  )
				: new BezierTween(
						animation.transition?.easingFunction,
						instance,
						animation.transition?.duration ?? 1,
						properties,
				  ),
		);
	});

	tweens.forEach((tween) => (typeIs(tween, "Instance") ? tween.Play() : tween.Play()));
	return () =>
		tweens.forEach((tween) => (typeIs(tween, "Instance") ? tween.Destroy() : tween.connection?.Disconnect()));
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
		if (!element) return;

		initial ??= true;
		if (typeIs(initial, "boolean")) {
			if (initial) return tween(element, animations);

			return animations.forEach((animation) => {
				for (const [key, value] of pairs(animation as object)) {
					if (key === "transition") continue;
					element[key as never] = value as never;
				}
			});
		}

		for (const [key, value] of pairs(
			castToTargetsAndTransitions(variants, initial, {})!.reduce(
				(accumulator, targetAndTransition) => ({
					...accumulator,
					...targetAndTransition,
				}),
				{},
			) as object,
		)) {
			if (key === "transition") continue;
			element[key as keyof T] = value as T[keyof T];
		}
	}, []);

	// animate
	useEffect(() => {
		if (ref.current) return tween(ref.current, animations);
	}, [ref, variants, variantState, animate, transition]);

	return [typeIs(variantState, "string") ? variantState : "", setVariantState];
}
