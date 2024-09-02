import Object from "@rbxts/object-utils";
import type { AnimationProps, CastsToTarget, Target, Transition } from ".";
import { Callback } from "./CustomTween/src";

// I wanted to decompose a bit of `useTween` and ended up mixing currying and OOP. extremely cursed! but it works better imo

export default class TargetUtil<T extends Instance> {
	private defaultTransition?: Transition;
	private variants: AnimationProps<T>["variants"];

	constructor(defaultTransition?: Transition, variants?: AnimationProps<T>["variants"]) {
		this.defaultTransition = defaultTransition;
		this.variants = variants;
	}

	public addDefaultTransition(target: Target<T>) {
		if (this.defaultTransition === undefined) return target;
		if (target.transition === undefined) return { ...target, transition: this.defaultTransition };

		let callback!: Callback;
		if (this.defaultTransition.callback !== undefined && target.transition.callback !== undefined) {
			callback = (playbackState) => {
				// non-null assertions are bad, however I've literally just checked both
				// of these, and I don't use optional chaining so as to prevent another check
				this.defaultTransition!.callback!(playbackState);
				target.transition!.callback!(playbackState);
			};
		} else if (this.defaultTransition.callback !== undefined) {
			callback = this.defaultTransition.callback;
		} else if (target.transition.callback !== undefined) {
			callback = target.transition.callback;
		}

		return { ...target, transition: { ...this.defaultTransition, ...target.transition, callback } };
	}

	public castToTarget(targetOrVariant: CastsToTarget<T>) {
		if (typeIs(targetOrVariant, "table")) return targetOrVariant;

		const variant = targetOrVariant;
		assert(this.variants, `Variant "${variant}" cannot be set because no variants have been set`);
		assert(
			variant in this.variants,
			`Variant "${tostring(variant)}" is invalid: ${Object.keys(this.variants).join(", ")}`,
		);
		return this.variants[variant];
	}
}
