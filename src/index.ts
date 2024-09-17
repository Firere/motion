import type { Callback, EasingFunction } from "./CustomTween/src";
import type { Easing } from "./easings";
import { createMotionComponent, motion } from "./motion";
import Presence from "./Presence";
import useSpritesheet from "./useSpritesheet";
import useTween from "./useTween";

export type BezierDefinition = [x1: number, y1: number, x2: number, y2: number];

export interface Transition {
	duration?: number;
	ease?: BezierDefinition | Easing | EasingFunction;
	/**
	 * @deprecated `easingStyle` has been deprecated in favour of `ease`.
	 */
	easingStyle?: Enum.EasingStyle | (CastsToEnum<Enum.EasingStyle> & string);
	/**
	 * @deprecated `easingDirection` has been deprecated in favour of `ease`.
	 */
	easingDirection?: Enum.EasingDirection | (CastsToEnum<Enum.EasingDirection> & string);
	/**
	 * @deprecated `easingFunction` has been deprecated in favour of `ease`.
	 */
	easingFunction?: BezierDefinition;
	reverses?: boolean;
	repeat?: number;
	/**
	 * @deprecated replace with `repeat`
	 */
	repeatCount?: number;
	delay?: number;
	callback?: Callback;
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

export type CastsToTarget<T extends Instance> = Target<T> | Variant;

export type CastsToTargets<T extends Instance> = CastsToTarget<T> | CastsToTarget<T>[];

export interface AnimationProps<T extends Instance> {
	animate?: CastsToTargets<T>;
	/**
	 * @hidden not yet implemented
	 */
	exit?: CastsToTargets<T>;
	initial?: CastsToTargets<T> | boolean;
	transition?: Transition;
	variants?: Variants<T>;
}

/**
 * @deprecated renamed to `useTween`
 */
const useAnimation = useTween;

export default motion;
export { createMotionComponent, Presence, useAnimation, useSpritesheet, useTween };
