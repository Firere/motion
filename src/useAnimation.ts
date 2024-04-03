import Object from "@rbxts/object-utils";
import React, { useEffect, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import type { AnimationTransition, MotionProps, Variant } from ".";

function getVariant<T extends Instance>(variants: MotionProps<T>["variants"], variant: string) {
	if (variants === undefined)
		error(`Variant "${tostring(variant)}" does not exist because no variants have been set`);
	if (!(variant in variants)) error(`Variant "${tostring(variant)}" is invalid: ${variants}`);
	return variants[variant]!;
}

const castToEnum = <T extends Enum, K extends keyof Omit<T, "GetEnumItems">>(
	enumObject: T,
	enumItem: EnumItem | K | undefined,
) => (enumItem !== undefined ? (typeIs(enumItem, "EnumItem") ? enumItem : enumObject[enumItem]) : undefined);

export default function useAnimation<T extends Instance>(
	ref: React.RefObject<T>,
	{ animate, initial, transition, variants }: MotionProps<T>,
): [string, (variant: string) => void] {
	const [variantState, setVariantState] = useState<Variant<T>>();
	const currentVariant = typeIs(variantState, "string") ? getVariant(variants, variantState) : variantState;
	const animationVariant =
		animate !== undefined ? (typeIs(animate, "string") ? getVariant(variants, animate) : animate) : currentVariant;

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		if (typeIs(initial, "string")) {
			for (const [key, value] of pairs(getVariant(variants, initial))) {
				if (key === "transition") continue;
				element[key as keyof T] = value as T[keyof T];
			}
		} else if (typeIs(initial, "table") && !Object.isEmpty(initial))
			for (const [key, value] of pairs(initial)) {
				if (key === "transition") continue;
				element[key as keyof T] = value as T[keyof T];
			}
	}, []);

	let animationProperties: Partial<ExtractMembers<T, Tweenable>> = {};
	let mergedTransition: AnimationTransition = {};

	if (animationVariant !== undefined) {
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
	}
	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		let tween!: Tween;
		if (animationVariant !== undefined) {
			tween = TweenService.Create(
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
		}

		return () => tween.Destroy();
	}, [ref, variants, variantState, animate, transition]);

	return [typeIs(variantState, "string") ? variantState : "", (variant: string) => setVariantState(variant)];
}
