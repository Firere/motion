---
sidebar_position: 3
title: Motion components and the animate prop
---

# Motion components and the `animate` prop

Let's finally get onto some actual animating!

To begin with, import the `motion` object...

```ts
import motion from "@rbxts/react-motion";
```

...and create a Motion element:

```tsx
function Tooltip() {
  return (
    <motion.frame Size={UDim2.fromOffset(600, 300)}>
      <textlabel
        AnchorPoint={new Vector2(0.5, 0.5)}
        Position={UDim2.fromScale(0.5, 0.5)}
        Text="This is some helpful information"
        TextSize={20}
      />
    </motion.frame>
  );
}
```

Congratulations, you've made your first Motion element! But... it doesn't do anything yet.

That's because you haven't given Motion a *target* to tween with. Since we're making a tooltip, let's create a little "appearing" effect:

```ts
const target: Target<Frame> = {
  BackgroundTransparency: 0,
  Position: new UDim2(0, 0, 0, 0),
  transition: {
    duration: 0.3,
    ease: "easeOutQuint",
    delay: 1,
  },
}
```

You may notice these properties are actually already on our tooltip. If we want this target to actually change something, we'll need to change how our tooltip is at the beginning:

```tsx
return (
  // highlight-next-line
  <motion.frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 10)} Size={UDim2.fromOffset(600, 300)}>
    <textlabel
      AnchorPoint={new Vector2(0.5, 0.5)}
      Position={UDim2.fromScale(0.5, 0.5)}
      Text="This is some helpful information"
      TextSize={20}
    />
  </motion.frame>
);
```

Finally, we need to apply the target onto our `Frame`. We do this via **the `animate` prop**:

```tsx
return (
  <motion.frame
    // highlight-next-line
    animate={target}
    BackgroundTransparency={1}
    Position={UDim2.fromOffset(0, 10)}
    Size={UDim2.fromOffset(600, 300)}
  >
    <textlabel
      AnchorPoint={new Vector2(0.5, 0.5)}
      Position={UDim2.fromScale(0.5, 0.5)}
      Text="This is some helpful information"
      TextSize={20}
    />
  </motion.frame>
);
```

This is almost good, however the helpful information is still visible. We can fix that by making the `TextLabel` a Motion component, too, and giving it its own target to set the text transparency:

```tsx
return (
  <motion.frame
    animate={target}
    BackgroundTransparency={1}
    Position={UDim2.fromOffset(0, 10)}
    Size={UDim2.fromOffset(600, 300)}
  >
    // highlight-start
    <motion.textlabel
      // pro-tip: you can create targets inline without having to create another `Target` variable:
      animate={{
        TextTransparency: 0,
        transition: {
          duration: 0.3,
            ease: "easeOutQuint",
            delay: 1,
          }
      }}
      // highlight-end
      AnchorPoint={new Vector2(0.5, 0.5)}
      Position={UDim2.fromScale(0.5, 0.5)}
      Text="This is some helpful information"
      TextSize={20}
      // highlight-next-line
      TextTransparency={1}
    />
  </motion.frame>
);
```

Wonderful! Now we have a tooltip-like component which has an appearing-upwards effect.

To make it keep playing so we can continue tweaking this to our liking, we can temporarily set `repeatCount` in the transition to some high number:

```ts
const target: Target<Frame> = {
  BackgroundTransparency: 0,
  Position: new UDim2(0, 0, 0, 0),
  transition: {
    duration: 0.3,
    ease: "easeOutQuint",
    delay: 1,
    // highlight-next-line
    repeatCount: 999,
  },
}
```
