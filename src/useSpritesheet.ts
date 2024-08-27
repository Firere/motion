import React, { useBinding, useCallback, useEffect, useMemo, useRef } from "@rbxts/react";
import { RunService } from "@rbxts/services";

export default ({
	fps = 15,
	imageResolution,
	mode = "loop",
	range,
	sprites,
	spritesPerAxis,
	vertical = false,
}: {
	fps?: number;
	imageResolution: Vector2;
	mode?: "static" | "playOnce" | "loop";
	range?: [number, number];
	sprites: number;
	spritesPerAxis: number;
	vertical?: boolean;
}): [React.Binding<Vector2>, Vector2, (frame: number) => void] => {
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
	const [startFrame, endFrame] = useMemo(() => (range ? range : [0, sprites]), [range]);
	const frame = useRef(startFrame);

	const secondsElapsed = useRef(0); // since last frame played
	const secondsPerFrame = useMemo(() => 1 / fps, [fps]);
	const shouldReplay = useRef(mode === "loop");

	const setToFrame = useCallback(
		(frame: number) => {
			const line = math.floor(frame / spritesPerAxis);
			const positionInLine = frame - line * spritesPerAxis;
			updateRectOffset(
				vertical
					? new Vector2(line * rectSize.X, positionInLine * rectSize.Y)
					: new Vector2(positionInLine * rectSize.X, line * rectSize.Y),
			);
		},
		[spritesPerAxis, vertical],
	);

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
				if (frame.current === endFrame && shouldReplay.current) {
					frame.current = startFrame;
				} else if (frame.current === endFrame && !shouldReplay.current) {
					stop();
					break;
				}

				setToFrame(frame.current);
				frame.current++;
				secondsElapsed.current -= secondsPerFrame;
			}
		});
	}, []);

	useEffect(() => setToFrame(startFrame), []);

	useEffect(() => {
		if (mode === "loop" || mode === "playOnce") {
			shouldReplay.current = mode === "loop";
			start();
		} else stop();
	}, [mode]);

	return [rectOffset, rectSize, setToFrame];
};
