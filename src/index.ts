import type { Easing } from "./easings";
import { createMotionComponent, motion } from "./motion";
import useAnimation from "./useAnimation";
import useSpritesheet from "./useSpritesheet";

export type BezierArguments = [x1: number, y1: number, x2: number, y2: number];

export interface Transition {
	duration?: number;
	// `easingStyle` and `easingDirection` are essentially obsolete given `easingFunction`
	// is much shorter and can do the same thing, so they've been deprecated
	/**
	 * @deprecated `easingStyle` and `easingDirection` have been deprecated in favour of `easingFunction`.
	 */
	easingStyle?: Enum.EasingStyle | (CastsToEnum<Enum.EasingStyle> & string);
	/**
	 * @deprecated `easingStyle` and `easingDirection` have been deprecated in favour of `easingFunction`.
	 */
	easingDirection?: Enum.EasingDirection | (CastsToEnum<Enum.EasingDirection> & string);
	easingFunction?: BezierArguments | Easing;
	reverses?: boolean;
	repeatCount?: number;
	delay?: number;
}

export type Target<T extends Instance> = Partial<ExtractMembers<T, Tweenable>> & {
	transition?: Transition;
};

/**
 * @deprecated `TargetAndTransition` has been renamed to `Target` to refine Motion's concepts. If you need the type that was previously `Target`, it is simply `Partial<ExtractMembers<T, Tweenable>>`.
 */
export type TargetAndTransition<T extends Instance> = Target<T>;

export type Variants<T extends Instance> = Record<string, Target<T>>;

export type VariantLabel = string;

export type CastsToTarget<T extends Instance> = Target<T> | VariantLabel | (Target<T> | VariantLabel)[];

export interface AnimationProps<T extends Instance> {
	animate?: CastsToTarget<T>;
	initial?: CastsToTarget<T> | boolean;
	transition?: Transition;
	variants?: Variants<T>;
}

export default motion;
export { createMotionComponent, useAnimation, useSpritesheet };
