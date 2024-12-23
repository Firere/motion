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
};
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
};
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
};
```

You can use [this page](https://cubic-bezier.com/) to define Bézier curves using a visual editor.

### Easing Functions

On top of all of this, you're able to also just define your own easing functions:

```ts
const transition: Transition = {
  ease: (x) => 1 - math.pow(1 - x, 5), // equivalent to `easeOutQuint`
};
```

:::warning

If it's possible to represent your easing function using a predefined easing or a  Bézier curve, as the example above is, then use that instead, since the underlying implementation of Bézier curves is more optimised and uses [native code generation](https://create.roblox.com/docs/luau/native-code-gen) for added speed.

:::

## `precision`

Under the hood, Motion uses 2 different types of tweens: native, Roblox tweens and [`CustomTween`s](https://github.com/Firere/CustomTween). Whereas the implementation of `CustomTween`s involves manually tweening the instance's properties every hundredth of a second (at least, by default) in Lua scripts, native tweens are run by the Roblox engine directly and so are much more performant. Predictably, whenever you pass in a Bézier curve or a custom easing function, Motion will resort to playing a `CustomTween`.

While it's perfectly fine to use these in moderation, overusing `CustomTween`s can lead to severely degraded performance because — as mentioned earlier — instance properties are tweened every hundredth of a second by default. If you want to mitigate the effects of this (though at the cost of precision and making your tweens slightly choppier) Motion exposes another property which you can set in transitions:

```ts
const transition: Transition = {
  ease: [0.36, -0.64, 0.34, 1.64],
  precision: 75,
};
```

The `precision` property allows you to set the frequency in updates per second at which instance properties are tweened. For instance, if you pass in 75, it will tween every $\frac{1}{75}$ seconds. As mentioned before, the default value for `precision` is 100.

At the same time, you're also able to make it *more* precise if you want — at the expense of performance — by passing in a greater value. However, the primary purpose of exposing this property is to mitigate the performance costs of running hundreds of tweens in rapid succession, and the default 100 should be more than enough for most animations.

If `precision` is set on a transition that uses a native tween, it will have no effect. To identify transitions which will use a native tween, check that `ease` is both a predefined easing and that it is not `ease`, `easeIn`, `easeInOut` or `easeOut`.