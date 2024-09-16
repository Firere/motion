import type { BezierDefinition } from ".";

export type Easing =
	| "linear"
	| "ease"
	| `ease${Enum.EasingDirection["Name"]}`
	| `ease${Enum.EasingDirection["Name"]}${
			| Exclude<Enum.EasingStyle["Name"], "Circular" | "Exponential" | "Linear">
			| "Circ"
			| "Expo"}`;

const cast = (direction: Enum.EasingDirection["Name"], style: Enum.EasingStyle["Name"]) =>
	[Enum.EasingStyle[style], Enum.EasingDirection[direction]] as const;

const easings: Record<
	Easing,
	[BezierDefinition, ReturnType<typeof cast>] | [BezierDefinition, undefined] | [undefined, ReturnType<typeof cast>]
> = {
	linear: [[0, 0, 1, 1], cast("InOut", "Linear")],
	ease: [[0.25, 0.1, 0.25, 1], undefined],
	easeIn: [[0.42, 0, 1, 1], undefined],
	easeOut: [[0, 0, 0.58, 1], undefined],
	easeInOut: [[0.42, 0, 0.58, 1], undefined],
	easeInSine: [[0.12, 0, 0.39, 0], cast("In", "Sine")],
	easeOutSine: [[0.61, 1, 0.88, 1], cast("Out", "Sine")],
	easeInOutSine: [[0.37, 0, 0.63, 1], cast("InOut", "Sine")],
	easeInQuad: [[0.11, 0, 0.5, 0], cast("In", "Quad")],
	easeOutQuad: [[0.5, 1, 0.89, 1], cast("Out", "Quad")],
	easeInOutQuad: [[0.45, 0, 0.55, 1], cast("InOut", "Quad")],
	easeInCubic: [[0.32, 0, 0.67, 0], cast("In", "Cubic")],
	easeOutCubic: [[0.33, 1, 0.68, 1], cast("Out", "Cubic")],
	easeInOutCubic: [[0.65, 0, 0.35, 1], cast("InOut", "Cubic")],
	easeInQuart: [[0.5, 0, 0.75, 0], cast("In", "Quart")],
	easeOutQuart: [[0.25, 1, 0.5, 1], cast("Out", "Quart")],
	easeInOutQuart: [[0.76, 0, 0.24, 1], cast("InOut", "Quart")],
	easeInQuint: [[0.64, 0, 0.78, 0], cast("In", "Quint")],
	easeOutQuint: [[0.22, 1, 0.36, 1], cast("Out", "Quint")],
	easeInOutQuint: [[0.83, 0, 0.17, 1], cast("InOut", "Quint")],
	easeInExpo: [[0.7, 0, 0.84, 0], cast("In", "Exponential")],
	easeOutExpo: [[0.16, 1, 0.3, 1], cast("Out", "Exponential")],
	easeInOutExpo: [[0.87, 0, 0.13, 1], cast("InOut", "Exponential")],
	easeInCirc: [[0.55, 0, 1, 0.45], cast("In", "Circular")],
	easeOutCirc: [[0, 0.55, 0.45, 1], cast("Out", "Circular")],
	easeInOutCirc: [[0.85, 0, 0.15, 1], cast("InOut", "Circular")],
	easeInBack: [[0.36, 0, 0.66, -0.56], cast("In", "Back")],
	easeOutBack: [[0.34, 1.56, 0.64, 1], cast("Out", "Back")],
	easeInOutBack: [[0.68, -0.6, 0.32, 1.6], cast("InOut", "Back")],
	easeInElastic: [undefined, cast("In", "Elastic")],
	easeOutElastic: [undefined, cast("Out", "Elastic")],
	easeInOutElastic: [undefined, cast("InOut", "Elastic")],
	easeInBounce: [undefined, cast("In", "Bounce")],
	easeOutBounce: [undefined, cast("Out", "Bounce")],
	easeInOutBounce: [undefined, cast("InOut", "Bounce")],
};
export default easings;
