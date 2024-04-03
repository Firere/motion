import type React from "@rbxts/react";
import { motion, withAnimation } from "./motion";
import useAnimation from "./useAnimation";

export interface AnimationTransition {
	duration?: number;
	easingStyle?: Enum.EasingStyle | (CastsToEnum<Enum.EasingStyle> & string);
	easingDirection?: Enum.EasingDirection | (CastsToEnum<Enum.EasingDirection> & string);
	reverses?: boolean;
	repeatCount?: number;
	delay?: number;
}

export type AnimationVariant<T extends Instance> = Partial<ExtractMembers<T, Tweenable>> & {
	transition?: AnimationTransition;
};

export type AnimationVariants<T extends Instance> = Partial<Record<string, AnimationVariant<T>>>;

export type Variant<T extends Instance> = keyof AnimationVariants<T> | AnimationVariant<T>;

export interface MotionProps<T extends Instance> {
	animate?: Variant<T>;
	initial?: Variant<T>;
	transition?: AnimationTransition;
	variants?: AnimationVariants<T>;
}

export type ReactMotionProps<T extends Instance> = React.InstanceProps<T> &
	MotionProps<T> & { ref?: React.RefObject<T> };

export default motion;
export { useAnimation, withAnimation };
