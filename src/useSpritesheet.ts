import { useCallback, useEffect, useMemo, useRef, useState } from "@rbxts/react";
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
}) => {
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
	const connection = useRef<RBXScriptConnection>();
	const [startFrame, endFrame] = useMemo(() => range ?? [0, sprites - 1], [range]);
	// ? the frame is stored as state because there's otherwise no reliable way to return it - this could otherwise be done with a ref and a binding (which would likely be more performant), and I may consider making a separate hook that does that
	const [frame, setFrame] = useState(startFrame);

	const secondsElapsed = useRef(0); // since last frame played
	const secondsPerFrame = useMemo(() => 1 / fps, [fps]);
	const shouldReplay = useRef(mode === "loop");

	const getRectOffset = useCallback(
		(frame: number) => {
			const line = math.floor(frame / spritesPerAxis);
			const positionInLine = frame - line * spritesPerAxis;
			return vertical
				? new Vector2(line * rectSize.X, positionInLine * rectSize.Y)
				: new Vector2(positionInLine * rectSize.X, line * rectSize.Y);
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
				setFrame((frame) => {
					if (frame === endFrame) {
						if (shouldReplay.current) return startFrame;
						stop();
						return frame;
					} else return frame + 1;
				});
				secondsElapsed.current -= secondsPerFrame;
			}
		});
	}, []);

	useEffect(() => stop, []);

	useEffect(() => {
		if (mode === "loop" || mode === "playOnce") {
			shouldReplay.current = mode === "loop";
			start();
		} else stop();
	}, [mode]);

	return { rectOffset: getRectOffset(frame), rectSize, frame, setFrame };
};
