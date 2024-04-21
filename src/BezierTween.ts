import Bezier from "@rbxts/cubic-bezier";
import { RunService, TweenService } from "@rbxts/services";

const lerp = (a: number, b: number, t: number) => a + t * (b - a);

type Properties<T extends Instance> = Partial<ExtractMembers<T, Tweenable>>;

export default class BezierTween<T extends Instance> {
	private bezier: Bezier;
	private endProperties: Properties<T>;
	private initialProperties: Properties<T> = {};
	private instance: T;
	private progress = 0;
	private precision: number;
	private time: number;
	private total = 0;
	private tweenTime: number;
	public connection?: RBXScriptConnection;
	public PlaybackState: Exclude<Enum.PlaybackState, Enum.PlaybackState.Delayed> = Enum.PlaybackState.Begin;

	constructor(
		bezier: Bezier | [x1: number, y1: number, x2: number, y2: number],
		instance: T,
		time: number,
		endProperties: Properties<T>,
		precision?: number,
	) {
		this.bezier = typeIs(bezier, "function") ? bezier : new Bezier(...bezier);
		this.instance = instance;
		this.time = time;
		this.endProperties = endProperties;
		this.precision = precision ?? 100;
		this.tweenTime = this.time / this.precision;

		for (const [property, _] of pairs(endProperties as object))
			this.initialProperties[property as keyof typeof this.initialProperties] =
				instance[property as keyof typeof this.initialProperties];
	}

	private getCurrentProperties(progress: number) {
		const accumulated: Properties<T> = {};
		for (const [k, setting] of pairs(this.endProperties as object)) {
			const property = k as keyof Properties<T>;
			switch (true) {
				case typeIs(setting, "number"): {
					(accumulated[property] as number) = lerp(
						this.initialProperties[property] as number,
						setting,
						progress,
					);
					break;
				}

				case typeIs(setting, "boolean"): {
					(accumulated[property] as boolean) =
						progress === 1 ? setting : (this.initialProperties[property] as boolean);
					break;
				}

				case typeIs(setting, "CFrame"): {
					(accumulated[property] as CFrame) = (this.initialProperties[property] as CFrame).Lerp(
						setting,
						progress,
					);
					break;
				}

				case typeIs(setting, "Rect"): {
					const initial = this.initialProperties[property] as Rect;
					(accumulated[property] as Rect) = new Rect(
						initial.Min.Lerp(setting.Min, progress),
						initial.Max.Lerp(setting.Max, progress),
					);
					break;
				}

				case typeIs(setting, "Color3"): {
					(accumulated[property] as Color3) = (this.initialProperties[property] as Color3).Lerp(
						setting,
						progress,
					);
					break;
				}

				case typeIs(setting, "UDim"): {
					const initial = this.initialProperties[property] as UDim;
					(accumulated[property] as UDim) = new UDim(
						lerp(initial.Scale, setting.Scale, progress),
						lerp(initial.Offset, setting.Offset, progress),
					);
					break;
				}

				case typeIs(setting, "UDim2"): {
					(accumulated[property] as UDim2) = (this.initialProperties[property] as UDim2).Lerp(
						setting,
						progress,
					);
					break;
				}

				case typeIs(setting, "Vector2"): {
					(accumulated[property] as Vector2) = (this.initialProperties[property] as Vector2).Lerp(
						setting,
						progress,
					);
					break;
				}

				case typeIs(setting, "Vector2int16"): {
					const initial = this.initialProperties[property] as Vector2int16;
					(accumulated[property] as Vector2int16) = new Vector2int16(
						lerp(initial.X, setting.X, progress),
						lerp(initial.Y, setting.Y, progress),
					);
					break;
				}

				case typeIs(setting, "Vector3"): {
					(accumulated[property] as Vector3) = (this.initialProperties[property] as Vector3).Lerp(
						setting,
						progress,
					);
					break;
				}
			}
		}
		return accumulated;
	}

	public Cancel() {
		this.PlaybackState = Enum.PlaybackState.Cancelled;
		this.connection?.Disconnect();
		this.progress = 0;
		this.total = 0;
		for (const [property, setting] of pairs(this.initialProperties as object))
			this.instance[property as keyof T] = setting as T[keyof T];
	}

	public Pause() {
		this.PlaybackState = Enum.PlaybackState.Paused;
		this.connection?.Disconnect();
		this.total = 0;
	}

	public Play() {
		if (this.PlaybackState === Enum.PlaybackState.Playing) return;

		task.spawn(() => {
			this.PlaybackState = Enum.PlaybackState.Playing;
			this.connection = RunService.Heartbeat.Connect(deltaTime => {
				this.total += deltaTime;
				if (this.progress > this.precision) return;

				while (this.total >= this.tweenTime) {
					this.total -= this.tweenTime;
					TweenService.Create(
						this.instance,
						new TweenInfo(this.tweenTime, Enum.EasingStyle.Linear),
						this.getCurrentProperties(this.bezier(this.progress / this.precision)),
					).Play();
					this.progress++;
				}
			});
		});
	}
}
