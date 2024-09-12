---
sidebar_position: 2
title: Transitions
---

# Transitions

As mentioned on the previous page, transitions are data which Motion uses to determine how your tweens should look — its duration, the delay before it begins, how it should ease etc. — and it works very similarly to how defining `TweenInfo`s looks:

```ts
import type { Transition } from "@rbxts/react-motion";

// these are each also their respective defaults
const transition: Transition = {
  duration: 1,
  ease: "linear",
  reverses: false,
  repeat: 0,
  delay: 0,
}
```

Here's what each of these mean:

| Property | Description |
| --- | --- |
| `duration` | How long, in seconds, your tween should take to go from the object's current properties to those defined in your target. |
| `ease` | Defines the rate of change of your properties over time — more on those later. |
| `reverses` | Determines if your tween should play itself in reverse after it's reached the target's properties. |
| `repeat` | Determines how many times your tween should play. If `reverses` is set to `true`, then both the initial tween to the target and the reversed tween count as one "repeat", otherwise the object's properties get instantly reset to what they were at the beginning of the tween after each repeat. |
| `delay` | How long, in seconds, the tween should wait before playing. |

## Easings

As said above, easings define the rate of change of your properties over time — in other words how much they change between each "frame" of your tween. By default, this is set to `"linear"`, which means your tween plays at a constant rate throughout its duration. Tweens don't generally look that nice like this, though, so you'll likely want to use one which eases in, out or both:

### Predefined Easings

Predefined easings are provided to you by default and are the easiest to use. Simply pass in the name of the easing in your transition as a string:

```ts
const transition: Transition = {
  ease: "easeOutQuint",
}
```

There are far too many predefined easings to list here, but all the ones available on [easings.net](https://easings.net/) along with `linear`, `ease`, `easeIn`, `easeOut` and `easeInOut` can be used in Motion.

:::tip

The easings found on easings.net are all also supported in `TweenInfo`s. Under the hood, Motion will convert these into native Roblox tweens, as this is more performant than manually setting properties on instances in quick succession in Lua. As such, it's generally a good idea to try to use these where possible — but you're still free to use custom easings, of course!

:::

### Bézier Curves

Motion also allows you to use Bézier curves to define your easings, [just as you would in CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function#cubic-bezier-easing-function):

```ts
const transition: Transition = {
  ease: [0.36, -0.64, 0.34, 1.64],
}
```

You can use [this page](https://cubic-bezier.com/) to define Bézier curves using a visual editor.

### Easing Functions

On top of all of this, you're able to also just define your own easing functions:

```ts
const transition: Transition = {
  ease: (x) => 1 - math.pow(1 - x, 5), // equivalent to `easeOutQuint`
}
```

:::warning

If it's possible to represent your easing function using a predefined easing or a  Bézier curve, as the example above is, then use that instead, since the underlying implementation of Bézier curves is more optimised and uses [native code generation](https://create.roblox.com/docs/luau/native-code-gen) for added speed.

:::
