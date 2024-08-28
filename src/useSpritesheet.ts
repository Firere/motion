import { useCallback, useEffect, useMemo, useRef, useState } from "@rbxts/react";
import { RunService } from "@rbxts/services";

export default ({
	fps = 15,
	imageResolution,
	mode = "loop",
	range,
	sprites,
	spritesPerLine,
	vertical = false,
}: {
	fps?: number;
	imageResolution: Vector2;
	mode?: "static" | "playOnce" | "loop";
	range?: [number, number];
	sprites: number;
	spritesPerLine: number;
	vertical?: boolean;
}) => {
	const rectSize = useMemo(
		() =>
			vertical
				? new Vector2(
						imageResolution.X / math.ceil(sprites / spritesPerLine),
						imageResolution.Y / spritesPerLine,
				  )
				: new Vector2(
						imageResolution.X / spritesPerLine,
						imageResolution.Y / math.ceil(sprites / spritesPerLine),
				  ),
		[imageResolution, sprites, spritesPerLine, vertical],
	);
	const connection = useRef<RBXScriptConnection>();
	const startFrame = useRef(range ? range[0] : 0);
	const endFrame = useRef(range ? range[1] : sprites - 1);
	// ? the frame is stored as state because there's otherwise no reliable way to return it - this could otherwise be done with a ref and a binding (which would likely be more performant), and I may consider making a separate hook that does that
	const [frame, setFrame] = useState(startFrame.current);

	const secondsElapsed = useRef(0); // since last frame played
	const secondsPerFrame = useRef(1 / fps);
	const shouldReplay = useRef(mode === "loop");

	const getRectOffset = useCallback(
		(frame: number) => {
			const line = math.floor(frame / spritesPerLine);
			const positionInLine = frame - line * spritesPerLine;
			return vertical
				? new Vector2(line * rectSize.X, positionInLine * rectSize.Y)
				: new Vector2(positionInLine * rectSize.X, line * rectSize.Y);
		},
		[spritesPerLine, vertical],
	);

	const disconnect = useCallback(() => {
		connection.current?.Disconnect();
		connection.current = undefined;
		secondsElapsed.current = 0;
	}, []);

	const connect = useCallback(() => {
		if (connection.current !== undefined) return;
		secondsElapsed.current = 0;

		connection.current = RunService.Heartbeat.Connect((deltaTime) => {
			secondsElapsed.current += deltaTime;

			while (secondsElapsed.current > secondsPerFrame.current) {
				setFrame((frame) => {
					if (frame === endFrame.current) {
						if (shouldReplay.current) return startFrame.current;
						disconnect();
						return frame;
					} else return frame + 1;
				});
				secondsElapsed.current -= secondsPerFrame.current;
			}
		});
	}, []);

	useEffect(() => disconnect, []);

	useEffect(() => {
		secondsPerFrame.current = 1 / fps;
	}, [fps]);

	useEffect(() => {
		if (mode === "loop" || mode === "playOnce") {
			shouldReplay.current = mode === "loop";
			connect();
		} else disconnect();
	}, [mode]);

	useEffect(() => {
		startFrame.current = range ? range[0] : 0;
		endFrame.current = range ? range[1] : sprites - 1;
		setFrame((frame) => {
			if (frame < startFrame.current) return startFrame.current;
			if (frame > endFrame.current) return endFrame.current;
			return frame;
		});
	}, [range, sprites]);

	return { rectOffset: getRectOffset(frame), rectSize, frame, setFrame };
};
