import type { BezierArguments } from ".";

export type Easing =
	| "linear"
	| "ease"
	| "easeIn"
	| "easeOut"
	| "easeInOut"
	| "easeInSine"
	| "easeOutSine"
	| "easeInOutSine"
	| "easeInQuad"
	| "easeOutQuad"
	| "easeInOutQuad"
	| "easeInCubic"
	| "easeOutCubic"
	| "easeInOutCubic"
	| "easeInQuart"
	| "easeOutQuart"
	| "easeInOutQuart"
	| "easeInQuint"
	| "easeOutQuint"
	| "easeInOutQuint"
	| "easeInExpo"
	| "easeOutExpo"
	| "easeInOutExpo"
	| "easeInCirc"
	| "easeOutCirc"
	| "easeInOutCirc"
	| "easeInBack"
	| "easeOutBack"
	| "easeInOutBack"
	| "easeInElastic"
	| "easeOutElastic"
	| "easeInOutElastic"
	| "easeInBounce"
	| "easeOutBounce"
	| "easeInOutBounce";

const createCaster =
	(
		easingDirection: CastsToEnum<Enum.EasingDirection> & string,
		easingStyle: CastsToEnum<Enum.EasingStyle> & string,
	) =>
	(time?: number, repeatCount?: number, reverses?: boolean, delayTime?: number) =>
		new TweenInfo(
			time,
			Enum.EasingStyle[easingStyle as never],
			Enum.EasingDirection[easingDirection as never],
			repeatCount ?? 0,
			reverses ?? false,
			delayTime ?? 0,
		);

const easings: Record<
	Easing,
	| [BezierArguments, ReturnType<typeof createCaster>]
	| [BezierArguments, undefined]
	| [undefined, ReturnType<typeof createCaster>]
> = {
	linear: [[0, 0, 1, 1], createCaster("InOut", "Linear")],
	ease: [[0.25, 0.1, 0.25, 1], undefined],
	easeIn: [[0.42, 0, 1, 1], undefined],
	easeOut: [[0, 0, 0.58, 1], undefined],
	easeInOut: [[0.42, 0, 0.58, 1], undefined],
	easeInSine: [[0.12, 0, 0.39, 0], createCaster("In", "Sine")],
	easeOutSine: [[0.61, 1, 0.88, 1], createCaster("Out", "Sine")],
	easeInOutSine: [[0.37, 0, 0.63, 1], createCaster("InOut", "Sine")],
	easeInQuad: [[0.11, 0, 0.5, 0], createCaster("In", "Quad")],
	easeOutQuad: [[0.5, 1, 0.89, 1], createCaster("Out", "Quad")],
	easeInOutQuad: [[0.45, 0, 0.55, 1], createCaster("InOut", "Quad")],
	easeInCubic: [[0.32, 0, 0.67, 0], createCaster("In", "Cubic")],
	easeOutCubic: [[0.33, 1, 0.68, 1], createCaster("Out", "Cubic")],
	easeInOutCubic: [[0.65, 0, 0.35, 1], createCaster("InOut", "Cubic")],
	easeInQuart: [[0.5, 0, 0.75, 0], createCaster("In", "Quart")],
	easeOutQuart: [[0.25, 1, 0.5, 1], createCaster("Out", "Quart")],
	easeInOutQuart: [[0.76, 0, 0.24, 1], createCaster("InOut", "Quart")],
	easeInQuint: [[0.64, 0, 0.78, 0], createCaster("In", "Quint")],
	easeOutQuint: [[0.22, 1, 0.36, 1], createCaster("Out", "Quint")],
	easeInOutQuint: [[0.83, 0, 0.17, 1], createCaster("InOut", "Quint")],
	easeInExpo: [[0.7, 0, 0.84, 0], createCaster("In", "Exponential")],
	easeOutExpo: [[0.16, 1, 0.3, 1], createCaster("Out", "Exponential")],
	easeInOutExpo: [[0.87, 0, 0.13, 1], createCaster("InOut", "Exponential")],
	easeInCirc: [[0.55, 0, 1, 0.45], createCaster("In", "Circular")],
	easeOutCirc: [[0, 0.55, 0.45, 1], createCaster("Out", "Circular")],
	easeInOutCirc: [[0.85, 0, 0.15, 1], createCaster("InOut", "Circular")],
	easeInBack: [[0.36, 0, 0.66, -0.56], createCaster("In", "Back")],
	easeOutBack: [[0.34, 1.56, 0.64, 1], createCaster("Out", "Back")],
	easeInOutBack: [[0.68, -0.6, 0.32, 1.6], createCaster("InOut", "Back")],
	easeInElastic: [undefined, createCaster("In", "Elastic")],
	easeOutElastic: [undefined, createCaster("Out", "Elastic")],
	easeInOutElastic: [undefined, createCaster("InOut", "Elastic")],
	easeInBounce: [undefined, createCaster("In", "Bounce")],
	easeOutBounce: [undefined, createCaster("Out", "Bounce")],
	easeInOutBounce: [undefined, createCaster("InOut", "Bounce")],
};
export default easings;
