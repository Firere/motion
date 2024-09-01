---
sidebar_position: 1
title: "CustomTween Precision"
---

# `CustomTween` Precision and Choppiness

For `ease` values which it cannot convert to native Roblox tweens, Motion uses a library [`CustomTween`](https://github.com/Firere/CustomTween) (maintained by the same developer, so it can itself also be modified for Motion if need be) which works by playing a native `Linear` tween on a very small interval. It creates and plays these tweens on a connection to `Heartbeat`. The interval between each tween is determined by the `precision` argument, which is 100 by default, meaning it tweens to the latest properties every hundredth of a second or so. 

This results in a tween far choppier than a native tween, however increasing the precision could lead to performance loss on lower-end devices. Motion does not currently provide a way for users to set this precision themselves.

Ideally, it'd be possible to determine an appropriate default precision by first determining the power of the client's hardware, however besides using their graphics level (which can't be accurately accessed if it's automatic) there isn't any suitable way to do this.

Either `CustomTween` or Motion could also potentially set the precision depending on how many custom tweens are currently being played or on the amount of lag (determined by delta time).
