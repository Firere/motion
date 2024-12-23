---
slug: migration-v2
title: Migrating from v1 to v2
authors: [firere]
---

The first and likely last major update to Motion is here, and with it some previous code has been deprecated. Only one minor change could potentially be breaking, but for the vast majority of users all code should remain functional. Still, it's a good idea to migrate your code to use recommended features.

<!-- truncate -->

## Define Easings with `ease`

The properties `easingStyle`, `easingDirection` and `easingFunction` have all been deprecated in favour of the simpler, shorter and more versatile `ease`. Rest assured, no functionality has been lost with this change. 2.0.0 remains backwards compatible with these, however they will be removed in a later version.

### `easingStyle` and `easingDirection`

If you want to convert `easingStyle` and `easingDirection` (i.e., regular, native Roblox tweens) into an `ease`, you pass in `"ease" + easingDirection + easingStyle`.

```ts
const transition: Transition = {
  // before
  easingStyle: "Quint",
  easingDirection: "Out",
  // after
  ease: "easeOutQuint",
}
```

:::note

The above will **not** work for `Enum.EasingStyle.Circular` and `Enum.EasingStyle.Exponential`. For these, you must shorten them to `Circ` and `Expo` respectively.

:::

Because Roblox implements all easings found on [easings.net](https://easings.net/), you can head there for a list of all valid easings.

Roblox also implements `Enum.EasingStyle.Linear`, and the above method does not work for transitions which use `Linear`. Because the tween is identical regardless of `easingDirection`, these transitions can simply be rewritten as:

```ts
const transition: Transition = {
  ease: "linear",
}
```

Additionally, v2 adds support for passing `ease`, `easeIn`, `easeInOut` and `easeOut` to the `ease` property directly. These easings are their CSS/Web equivalents.

### `easingFunction`

These are the easiest to migrate: simply replace `easingFunction` with `ease`.

```ts
const transition: Transition = {
  // before
  easingFunction: [0, 0.3, 0.7, 1],
  // after
  ease: [0, 0.3, 0.7, 1],
}
```

## `useAnimation` -> `useTween`

The `useAnimation` hook has been renamed to `useTween` in the effort of more clearly defining Motion's concepts, both in the docs and in the code. `useAnimation` is still exported, but marked as deprecated and as such will be ~~struck-through~~. All you need to do to migrate this is to switch out `useAnimation` with `useTween`.

## `variant` and `setVariant` -> `animate` prop

The internal state returned by `useTween` and the `animate` prop are two different ways of achieving exactly the same thing and it only creates confusion to keep support for `variant` and `setVariant` around. If you previously relied on these, a quick and easy method of switching without needing to refactor much could be something like:

```ts
// before
const [variant, setVariant] = useTween(ref, {});
// after
const [variant, setVariant] = useState<CastsToTarget<GuiObject>>();
useTween(ref, { animate: variant });
```

## `CastsToTarget` and `CastsToTargets` Types

`CastsToTarget` has been renamed to `CastsToTargets` to reflect that it can be an array of targets. Code previously using `CastsToTarget` will not work.

`CastsToTarget` has been redefined to be either a `Target` or a `Variant`, but not an array of either.

## `Target` and `TargetAndTransition` Types

`TargetAndTransition` has been renamed to `Target`, and has no additional changes. Any code currently importing and using `TargetAndTransition` still works, though it's marked as deprecated.

The type which was previously named and exported as `Target` has been removed, making this a slightly breaking change. The conversion here is really simple: `Target<T>` becomes `Partial<ExtractMembers<T, Tweenable>>`.

This change has likewise been done to refine and make clearer the concepts underneath Motion for these new docs, even if it deviates from Framer Motion.

## `VariantLabel` -> `Variant`

Also in the effort of refining concepts, the `VariantLabel` type has been renamed to `Variant`; this is just a `string` anyway, but I'm writing this here in case anybody did for some reason use this.

As with the others, `VariantLabel` is still exported but marked as deprecated.
