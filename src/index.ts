import type { Easing } from "./easings";
import { createMotionComponent, motion } from "./motion";
import useSpritesheet from "./useSpritesheet";

export type BezierArguments = [x1: number, y1: number, x2: number, y2: number];

export interface Transition {
	duration?: number;
	easing?: BezierArguments | Easing | ((delta: number) => number);
	/**
	 * @deprecated `easingStyle` has been deprecated in favour of `easing`.
	 */
	easingStyle?: Enum.EasingStyle | (CastsToEnum<Enum.EasingStyle> & string);
	/**
	 * @deprecated `easingDirection` has been deprecated in favour of `easing`.
	 */
	easingDirection?: Enum.EasingDirection | (CastsToEnum<Enum.EasingDirection> & string);
	/**
	 * @deprecated `easingFunction` has been deprecated in favour of `easing`.
	 */
	easingFunction?: BezierArguments;
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

export type Variant = string;

/**
 * @deprecated in favour of `Variant`
 */
export type VariantLabel = string;

export type Variants<T extends Instance> = Record<Variant, Target<T>>;

export type CastsToTarget<T extends Instance> = Target<T> | Variant | (Target<T> | Variant)[];

export interface AnimationProps<T extends Instance> {
	animate?: CastsToTarget<T>;
	initial?: CastsToTarget<T> | boolean;
	transition?: Transition;
	variants?: Variants<T>;
}

/**
 * @deprecated renamed to `useTween`
 */
const useAnimation = useTween;

export default motion;
export { createMotionComponent, useAnimation, useSpritesheet, useTween };
