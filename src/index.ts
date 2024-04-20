import { createMotionComponent, motion } from "./motion";
import useAnimation from "./useAnimation";

export interface Transition {
	duration?: number;
	easingStyle?: Enum.EasingStyle | (CastsToEnum<Enum.EasingStyle> & string);
	easingDirection?: Enum.EasingDirection | (CastsToEnum<Enum.EasingDirection> & string);
	reverses?: boolean;
	repeatCount?: number;
	delay?: number;
}

export type Target<T extends Instance> = Partial<ExtractMembers<T, Tweenable>>;

export type TargetAndTransition<T extends Instance> = Target<T> & {
	transition?: Transition;
};

export type Variants<T extends Instance> = Record<string, TargetAndTransition<T>>;

export type VariantLabel = string;

export type CastsToTarget<T extends Instance> =
	| TargetAndTransition<T>
	| VariantLabel
	| (TargetAndTransition<T> | VariantLabel)[];

export interface AnimationProps<T extends Instance> {
	animate?: CastsToTarget<T>;
	initial?: CastsToTarget<T> | boolean;
	transition?: Transition;
	variants?: Variants<T>;
}

export default motion;
export { createMotionComponent, useAnimation };
