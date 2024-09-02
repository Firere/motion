import Object from "@rbxts/object-utils";
import { t } from "@rbxts/t";
import type { AnimationProps, CastsToTarget, CastsToTargets, Target, Transition } from ".";
import { Callback } from "./CustomTween/src";

// I wanted to decompose a bit of `useTween` and ended up mixing functional and OOP. extremely cursed! but it works better imo

export default class TargetUtility<T extends Instance> {
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
				// non-null assertions are bad but I've literally just checked both of these,
				// and I don't want to use optional chaining so as to prevent another check
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

	public castToTargets(targets?: CastsToTargets<T>, skipTransition?: boolean) {
		if (targets === undefined) return undefined;

		const mergeTransitions = (target: CastsToTarget<T>) =>
			skipTransition ? this.castToTarget(target) : this.addDefaultTransition(this.castToTarget(target));

		if (t.array(t.union(t.string, t.table))(targets)) return this.resolveConflicts(targets.map(mergeTransitions));

		return [mergeTransitions(targets)];
	}

	public resolveConflicts(targets: Target<T>[]) {
		const resolved = [...targets];

		// some targets may contain the same property, resulting in multiple
		// Tweens potentially messing with it, so all conflicts are handled here
		const alreadyModified = new Set<keyof Partial<Extract<T, Tweenable>>>();
		for (let i = resolved.size() - 1; i >= 0; i--)
			for (const [key] of pairs(resolved[i] as object)) {
				if (key === "transition") continue;
				if (alreadyModified.has(key as never)) {
					delete resolved[i][key as never];
				} else {
					alreadyModified.add(key as never);
				}
			}

		return resolved;
	}
}
