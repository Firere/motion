import React, { useBinding, useCallback, useEffect, useMemo, useRef } from "@rbxts/react";
import { RunService } from "@rbxts/services";

export default React.forwardRef(
	(
		{
			anchorPoint,
			button = false,
			fps = 15,
			image,
			imageResolution,
			mode = "loop",
			position,
			size,
			sprites,
			spritesPerAxis,
			vertical = false,
		}: {
			anchorPoint?: Vector2;
			button?: boolean;
			fps?: number;
			image: string;
			imageResolution: Vector2;
			mode?: "static" | "playOnce" | "loop";
			position?: UDim2;
			size?: UDim2;
			sprites: number;
			spritesPerAxis: number;
			vertical?: boolean;
		},
		forwardedRef?: React.ForwardedRef<ImageButton | ImageLabel>,
	) => {
		const rectSize = useMemo(
			() =>
				vertical
					? new Vector2(
							imageResolution.X / math.ceil(sprites / spritesPerAxis),
							imageResolution.Y / spritesPerAxis,
					  )
					: new Vector2(
							imageResolution.X / spritesPerAxis,
							imageResolution.Y / math.ceil(sprites / spritesPerAxis),
					  ),
			[imageResolution, sprites, spritesPerAxis, vertical],
		);
		const [rectOffset, updateRectOffset] = useBinding(new Vector2());
		const connection = useRef<RBXScriptConnection>();
		const frame = useRef(0);

		const secondsElapsed = useRef(0); // since last frame played
		const secondsPerFrame = useMemo(() => 1 / fps, [fps]);
		const shouldReplay = useRef(mode === "loop");

		const stop = useCallback(() => {
			connection.current?.Disconnect();
			connection.current = undefined;
			secondsElapsed.current = 0;
		}, []);

		const start = useCallback(() => {
			if (connection.current !== undefined) return;
			secondsElapsed.current = 0;

			connection.current = RunService.Heartbeat.Connect((deltaTime) => {
				secondsElapsed.current += deltaTime;

				while (secondsElapsed.current > secondsPerFrame) {
					if (frame.current === sprites && shouldReplay.current) {
						frame.current = 0;
					} else if (frame.current === sprites && !shouldReplay.current) {
						stop();
						break;
					}

					const currentLine = math.floor(frame.current / spritesPerAxis);
					if (frame.current / spritesPerAxis === currentLine) {
						// reached end of this line, move onto next one
						const newLine = currentLine * (vertical ? rectSize.Y : rectSize.X);
						updateRectOffset(vertical ? new Vector2(newLine, 0) : new Vector2(0, newLine));
					} else {
						const current = rectOffset.getValue();
						updateRectOffset(
							vertical
								? new Vector2(current.X, current.Y + rectSize.Y)
								: new Vector2(current.X + rectSize.X, current.Y),
						);
					}

					frame.current++;
					secondsElapsed.current -= secondsPerFrame;
				}
			});
		}, []);

		useEffect(start, []);

		useEffect(() => {
			if (mode === "loop" || mode === "playOnce") {
				shouldReplay.current = mode === "loop";
				start();
			} else stop();
		}, [mode]);

		const props: React.InstanceProps<ImageButton & ImageLabel> = {
			AnchorPoint: anchorPoint,
			Image: image,
			ImageRectOffset: rectOffset,
			ImageRectSize: rectSize,
			Position: position,
			Size: size,
		};

		return button ? (
			<imagebutton
				{...(props as React.InstanceProps<ImageButton>)}
				ref={forwardedRef as React.Ref<ImageButton>}
			/>
		) : (
			<imagelabel {...(props as React.InstanceProps<ImageLabel>)} ref={forwardedRef as React.Ref<ImageLabel>} />
		);
	},
);
