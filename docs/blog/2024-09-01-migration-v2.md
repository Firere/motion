---
slug: migration-v2
title: Migrating from v1 to v2
authors: [firere]
---

The first and likely last major update to Motion is here, and with it some previous code has been deprecated. Only one minor change could potentially be breaking, but for the vast majority of users all of their code should remain functional. Still, it's a good idea to migrate your code to use recommended features.

<!-- truncate -->

Let's start with likely the most commonly used legacy syntax:

## New `ease` Property

The properties `easingStyle`, `easingDirection` and `easingFunction` have all been deprecated in favour of the simpler, shorter and more versatile `ease`, which is able to achieve the same effects as the previous properties did. All previous code will [(for the most part)](#easingfunction) continue to work as it did previously, however these properties may eventually be removed in a later version.

### `easingStyle` and `easingDirection`

If you want to convert `easingStyle` and `easingDirection` (i.e., regular, native Roblox tweens) into an `easing`, you pass in `"ease" + easingDirection + easingStyle`.

```ts
const transition: Transition = {
  // before
  easingStyle: "Quint",
  easingDirection: "Out",
  // after
  ease: "easeOutQuint",
}
```

Because Roblox implements all easings found on [easings.net](https://easings.net/), you can simply head there for a list of all valid easings.

Roblox also implements `Enum.EasingStyle.Linear`, and the above method does not work for transition data which uses `Linear`. Because the transition is identical regardless of `easingDirection`, these `transition`s can simply be rewritten as:

```ts
const transition: Transition = {
  ease: "linear",
}
```

Additionally, v2 adds support for passing `ease`, `easeIn`, `easeInOut` and `easeOut` to the `ease` property directly. These easings are their CSS/Web equivalents.

### `easingFunction`

These are the simplest to migrate: simply replace `easingFunction` with `ease`.

```ts
const transition: Transition = {
  // before
  easingFunction: [0, 0.3, 0.7, 1],
  // after
  ease: [0, 0.3, 0.7, 1],
}
```

:::note

In v2, Motion treats these slightly differently, in that if it can find an equivalent native Roblox tween for a given Bézier function it will resort to that one instead. For example, if you pass `[0.22, 1, 0.36, 1]`, Motion will automatically convert this to a native tween with an easing style of `Quint` and easing direction of `Out`. If it cannot find a native equivalent, then it will play a custom Bézier tween, because native tweens are still more performant.

:::

## `useAnimation` -> `useTween`

The `useAnimation` hook has been renamed to `useTween` in the effort of more clearly defining Motion's concepts, both in the docs and in the code. `useAnimation` is still exported, but marked as deprecated and as such will be ~~struck-through~~. All you need to do to migrate this is to switch out `useAnimation` with `useTween`.

## `Target` and `TargetAndTransition` Types

`TargetAndTransition` has been renamed to `Target`, and has no additional changes. Any code currently importing and using `TargetAndTransition` still works, though it's marked as deprecated.

The type which was previously named and exported as `Target` has been removed, making this a slightly breaking change. The conversion here is really simple: `Target<T>` becomes `Partial<ExtractMembers<T, Tweenable>>`.

This change has likewise been done to refine and make clearer the concepts underneath Motion for these new docs.

## `VariantLabel` -> `Variant`

Also in the effort of refining concepts, the `VariantLabel` type has been renamed to `Variant`; this is just a `string` anyway, but I'm writing this here in case anybody did for some reason use this.

As with the others, `VariantLabel` is still exported but marked as deprecated.
