import Object from "@rbxts/object-utils";
import React, { useEffect, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import { t } from "@rbxts/t";
import type { AnimationProps, CastsToTarget, TargetAndTransition, Transition } from ".";

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

// Users can pass in end properties directly, the name of a variant, or an array of both.
// Since useAnimation has to use these inputs twice, I've put it into its own function to also separate concerns.
function castToTargetAndTransition<T extends Instance>(
	allVariants: AnimationProps<T>["variants"],
	animations: CastsToTarget<T> | undefined,
): TargetAndTransition<T> | undefined {
	if (animations === undefined) return undefined;

	if (typeIs(animations, "table")) {
		// if animations is (TargetAndTransition<T> | VariantLabel)[]
		if (t.array(t.union(t.string, t.table))(animations)) {
			return animations.reduce(
				(accumulator, currentVariant) => ({
					...accumulator,
					...(typeIs(currentVariant, "string") ? getVariant(allVariants, currentVariant) : currentVariant),
				}),
				{},
			);
		} else return animations;
	} else return getVariant(allVariants, animations);
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
	if (t.array(t.union(t.string, t.table))(animations))
		return animations.map((animation) => mergeTransitions(variants, animation, transition));
	return [mergeTransitions(variants, animations, transition)];
}

// sure is great TweenInfo.new is one of the only
// APIs that doesn't automatically cast enums
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

	const [variantState, setVariantState] = useState<CastsToTarget<T>>();
	const currentAnimations: TargetAndTransition<T>[] =
		castToTargetsAndTransitions(variants, variantState, transition) ?? [];
	const animations = castToTargetsAndTransitions(variants, animate, transition) ?? currentAnimations;

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const tweens: Tween[] = [];
		// FIXME each animation may still have properties which overwrite
		// another's, and multiple tweens get made and played for this;
		// can fix this by removing properties which get overwritten
		animations.forEach((animation) => {
			const properties: Partial<Extract<T, Tweenable>> = {};
			for (const [key, value] of pairs(animation as object)) {
				if (key === "transition") continue;
				properties[key as never] = value as never;
			}
			tweens.push(
				TweenService.Create(
					element,
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
				),
			);
		});

		tweens.forEach((tween) => tween.Play());

		return () => tweens.forEach((tween) => tween.Destroy());
	}, [ref, variants, variantState, animate, transition]);

	return [typeIs(variantState, "string") ? variantState : "", (variant: string) => setVariantState(variant)];
}
