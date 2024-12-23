import type { BezierDefinition } from ".";

export type Easing =
	| "linear"
	| "ease"
	| `ease${Enum.EasingDirection["Name"]}`
	| `ease${Enum.EasingDirection["Name"]}${
			| Exclude<Enum.EasingStyle["Name"], "Circular" | "Exponential" | "Linear">
			| "Circ"
			| "Expo"}`;

export type NativeTweenDefinition = [Enum.EasingStyle, Enum.EasingDirection];

const cast = (direction: Enum.EasingDirection["Name"], style: Enum.EasingStyle["Name"]) =>
	[Enum.EasingStyle[style], Enum.EasingDirection[direction]] as NativeTweenDefinition;

const easings: Record<Easing, BezierDefinition | NativeTweenDefinition> = {
	linear: cast("InOut", "Linear"),
	ease: [0.25, 0.1, 0.25, 1],
	easeIn: [0.42, 0, 1, 1],
	easeOut: [0, 0, 0.58, 1],
	easeInOut: [0.42, 0, 0.58, 1],
	easeInSine: cast("In", "Sine"),
	easeOutSine: cast("Out", "Sine"),
	easeInOutSine: cast("InOut", "Sine"),
	easeInQuad: cast("In", "Quad"),
	easeOutQuad: cast("Out", "Quad"),
	easeInOutQuad: cast("InOut", "Quad"),
	easeInCubic: cast("In", "Cubic"),
	easeOutCubic: cast("Out", "Cubic"),
	easeInOutCubic: cast("InOut", "Cubic"),
	easeInQuart: cast("In", "Quart"),
	easeOutQuart: cast("Out", "Quart"),
	easeInOutQuart: cast("InOut", "Quart"),
	easeInQuint: cast("In", "Quint"),
	easeOutQuint: cast("Out", "Quint"),
	easeInOutQuint: cast("InOut", "Quint"),
	easeInExpo: cast("In", "Exponential"),
	easeOutExpo: cast("Out", "Exponential"),
	easeInOutExpo: cast("InOut", "Exponential"),
	easeInCirc: cast("In", "Circular"),
	easeOutCirc: cast("Out", "Circular"),
	easeInOutCirc: cast("InOut", "Circular"),
	easeInBack: cast("In", "Back"),
	easeOutBack: cast("Out", "Back"),
	easeInOutBack: cast("InOut", "Back"),
	easeInElastic: cast("In", "Elastic"),
	easeOutElastic: cast("Out", "Elastic"),
	easeInOutElastic: cast("InOut", "Elastic"),
	easeInBounce: cast("In", "Bounce"),
	easeOutBounce: cast("Out", "Bounce"),
	easeInOutBounce: cast("InOut", "Bounce"),
};
export default easings;
