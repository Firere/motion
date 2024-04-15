import Object from "@rbxts/object-utils";
import React, { useEffect, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import { t } from "@rbxts/t";
import type { AnimationProps, CastsToTarget, TargetAndTransition, Transition } from ".";

// Users can pass in end properties directly, the name of a variant, or an array of both.
// Since useAnimation has to use these inputs twice, I've put it into its own function to also separate concerns.
function castToTargetAndTransition<T extends Instance>(
	allVariants: AnimationProps<T>["variants"],
	animations: CastsToTarget<T> | undefined,
): TargetAndTransition<T> | undefined {
	if (animations === undefined) return undefined;

	function getVariant(variant: string) {
		if (allVariants === undefined) error(`Variant "${variant}" cannot be set because no variants have been set`);
		if (!(variant in allVariants))
			error(
				`Variant "${tostring(variant)}" is invalid: ${Object.keys(allVariants)
					.filter((v) => typeIs(v, "string"))
					.join(", ")}`,
			);
		return allVariants[variant]!;
	}

	if (typeIs(animations, "table")) {
		// if animations is (TargetAndTransition<T> | VariantLabel)[]
		if (t.array(t.union(t.string, t.table))(animations)) {
			return animations.reduce(
				(accumulator, currentVariant) => ({
					...accumulator,
					...(typeIs(currentVariant, "string") ? getVariant(currentVariant) : currentVariant),
				}),
				{},
			);
		} else return animations;
	} else return getVariant(animations);
}

const castToEnum = <T extends Enum, K extends keyof Omit<T, "GetEnumItems">>(
	enumObject: T,
	enumItem: EnumItem | K | undefined,
) => (enumItem !== undefined ? (typeIs(enumItem, "EnumItem") ? enumItem : enumObject[enumItem]) : undefined);

export default function useAnimation<T extends Instance>(
	ref: React.RefObject<T>,
	{ animate, initial, transition, variants }: AnimationProps<T>,
): [string, (variant: string) => void] {
	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const toIterate = castToTargetAndTransition(variants, initial);

		if (toIterate !== undefined)
			for (const [key, value] of pairs(toIterate as object)) {
				if (key === "transition") continue;
				element[key as keyof T] = value as T[keyof T];
			}
	}, []);

	const [variantState, setVariantState] = useState<TargetAndTransition<T> | string>();
	const currentVariant: TargetAndTransition<T> = castToTargetAndTransition(variants, variantState) ?? {};
	const animationVariant = castToTargetAndTransition(variants, animate) ?? currentVariant;

	let animationProperties: Partial<ExtractMembers<T, Tweenable>> = {};
	let mergedTransition: Transition = {};

	animationProperties = Object.entries(animationVariant)
		.filter(([key]) => key !== "transition")
		.reduce((acc, [key, value]) => {
			(acc as Record<string, unknown>)[key as string] = value;
			return acc;
		}, {});

	mergedTransition = {
		...transition,
		...animationVariant.transition,
	};

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const tween = TweenService.Create(
			element,
			new TweenInfo(
				mergedTransition.duration ?? 1,
				(castToEnum(Enum.EasingStyle, mergedTransition.easingStyle) as Enum.EasingStyle | undefined) ??
					Enum.EasingStyle.Linear,
				(castToEnum(Enum.EasingDirection, mergedTransition.easingDirection) as
					| Enum.EasingDirection
					| undefined) ?? Enum.EasingDirection.InOut,
				mergedTransition.repeatCount ?? 0,
				mergedTransition.reverses ?? false,
				mergedTransition.delay ?? 0,
			),
			animationProperties,
		);

		tween.Play();

		return () => tween?.Destroy();
	}, [ref, variants, variantState, animate, transition]);

	return [typeIs(variantState, "string") ? variantState : "", (variant: string) => setVariantState(variant)];
}
