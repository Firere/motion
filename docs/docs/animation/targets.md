---
sidebar_position: 1
title: Targets
---

# Targets

At the core of Motion are targets. Targets are objects which Motion can parse and translate into smooth transitions that it can play for a particular class.

```ts
import type { Target } from "@rbxts/react-motion";

const target: Target<Frame> = {
  BackgroundColor3: new Color3(0, 0, 0),
  BackgroundTransparency: 0.25,
  Size: UDim2.fromScale(0.6, 0.5),
  Position: UDim2.fromScale(0.5, 0.5),
  transition: {
    duration: 0.3,
    ease: "easeOut",
    delay: 1,
  },
}
```

In the above example, we created a target which Motion could apply to any `Frame`. We defined the properties we wanted the given `Frame` to have by the end of the transition, which have to obviously be properties of a `Frame`, and also [tweenable](https://create.roblox.com/docs/reference/engine/classes/TweenService).

We also defined a special property of this target, though, and that was `transition`. This property contains the data about the tween that Motion carries out itself. If you've ever worked with `TweenInfo`s, you'll find that transitions are very similar to `TweenInfo`s. You can find more information about these on the [next page](/docs/animation/transition).