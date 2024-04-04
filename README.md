# @rbxts/react-motion

A port of `@rbxts/motion` to React.

- [Introduction](#introduction)
- [The `motion` object](#the-motion-object)
- [Transitions](#transitions)
- [The `initial` prop](#the-initial-prop)
- [Variants](#variants)
- [Copy & paste example using `motion` object](#copy--paste-example-using-motion-object-works-with-hoarcekat)
- [useAnimation](#useanimation)
- [Copy & paste example using `useAnimation`](#copy--paste-example-using-useanimation-works-with-hoarcekat)

## Introduction

Simply animate UI from point A to B with Motion, a simple yet powerful animation library for roblox-ts & React, inspired by the popular framer-motion library for React.

## The `motion` object

The core of Motion is the `motion` object. Think of it as a plain Roblox GUI element, supercharged with animation capabilities:

```ts
import motion from "@rbxts/react-motion";
```

Animating a Motion component is as straight-forward as setting the `animate` prop:

```tsx
<motion.textbutton animate={{ TextSize: 24 }} />
```

When the `animate` prop changes, Motion will automatically generate an animation to the latest value. This animation will feel great by default, but it can be configured with the flexible `transition` prop.

## Transitions

A transition defines how values animate from one state to another. If you've ever used tweens in Roblox before, then it's the same as using `TweenInfo`:

```tsx
const [size, setSize] = useState(UDim2.fromOffset(200, 50));

return (
  <motion.textbutton
    animate={{ Size: size }}
    Event={{
      Activated: () => setSize(size => UDim2.fromOffset(size.X.Offset + 50, size.Y.Offset + 50)),
    }}
    Size={UDim2.fromOffset(200, 50)}
    Text="Increase the size of this button!"
    transition={{
      // each of these are also their respective defaults
      duration: 1,
      easingStyle: Enum.EasingStyle.Linear,
      easingDirection: "InOut", // strings can be casted to enums for convenience
      repeatCount: 0, // -1 for infinity
      reverse: false,
      delay: 0,
    }}  
  />
);
```

## The `initial` prop

The `initial` prop defines the properties for a Motion component to be set at the beginning. It differs from just setting props normally, as you can reference variants (more on those later) and state without it changing:

```tsx
const [size, setSize] = useState(UDim2.fromOffset(200, 50));

return (
  <motion.textbutton
    animate={{ Size: size }}
    initial={{ Size: size }}
    Event={{
      Activated: () => setSize(size => UDim2.fromOffset(size.X.Offset + 50, size.Y.Offset + 50)),
    }}
    Text="Increase the size of this button!"
  />
);
```

This will work exactly the same as the example above, however now you can reference the initial `size` directly without it rerendering each time.

*To be honest, I'm not sure what the purpose of `initial` exactly is or why it was in the original `@rbxts/motion`, or if this is even how it's supposed to work - upstream doesn't have it properly implemented. I got ghosted when I tried to ask the original author, so this is here to stay I guess.*

## Variants

Variants are a bit like classes in CSS in that you can define props specific to each variant. They're applied based on the `animate` and `initial` props:

```tsx
const [state, setState] = useState<"hover" | "default">("default");

return (
  <motion.textbutton
    animate={state}
    initial="default"
    Event={{
      MouseEnter: () => setState("hover"),
      MouseLeave: () => setState("default"),
    }}
    Size={UDim2.fromOffset(200, 50)}
    variants={{
      hover: {
        TextColor3: new Color3(0, 1, 0),
      },
      default: {
        TextColor3: new Color3(1, 1, 1),
      },
    }}
  />
);
```

Transitions can also be used in variants. If used in both variants and as a prop simultaneously, the transitions will be merged into one transition. In the case of a conflict between a variant transition and the `transition` prop, the variant transition will have priority over the `transition` prop and will overwrite it.

>[!NOTE]
> This differs from the behaviour of `@rbxts/motion`, which instead prioritises the `transition` prop over variants' transition. If you're migrating from `@rbxts/motion`, make sure you account for this.

```tsx
const [state, setState] = useState<"hover" | "default">("default")

const buttonVariants = {
  hover: {
    TextColor3: new Color3(0, 1, 0),
    transition={{ 
      duration: 20,
      easingStyle: Enum.EasingStyle.Elastic, // overwrites Quint
      easingDirection: Enum.EasingDirection.Out,
      reverses: true, // unique to the `hover` variant
    }}
  },
  default: {
    TextColor3: new Color3(1, 1, 1),
    transition={{ 
      duration: 1, // overwrites 20
      easingStyle: Enum.EasingStyle.Quad, // overwrites Quint
      easingDirection: Enum.EasingDirection.In, // unique to the `default` variant
      repeatCount: 2, // unique to the `default` variant
    }}
  },
};

return (
  <motion.textbutton
    animate={state}
    transition={{
      duration: 20,
      easingStyle: Enum.EasingStyle.Quint,
      delay: 0.5, // gets added to all variants
    }}
    Event={{
      MouseEnter: () => setState("hover"),
      MouseLeave: () => setState("default"),
    }}
    variants={buttonVariants}
  />
);
```

## Copy & paste example using `motion` object (works with Hoarcekat)

```tsx
import React, { useState } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import motion from "@rbxts/react-motion";

const variants = {
  off: {
    BackgroundColor3: new Color3(1, 1, 1),
    Size: UDim2.fromOffset(300, 100),
    TextColor3: new Color3(0, 0, 0),
  },
  on: {
    BackgroundColor3: new Color3(0, 0, 0),
    Size: UDim2.fromOffset(300, 90),
    TextColor3: new Color3(1, 1, 1),
  }
};

const Button = () => {
  const [state, setState] = useState<"on" | "off">("off");

  return (
    <motion.textbutton
      animate={state}
      AnchorPoint={new Vector2(0.5, 0.5)}
      Event={{
        MouseEnter: () => setState("on"),
        MouseLeave: () => setState("off"),
      }}
      Position={UDim2.fromScale(0.5, 0.5)}
      Size={UDim2.fromOffset(300, 100)}
      Text="Hello"
      TextSize={20}
      transition={{
        duration: 0.3,
      }}
      variants={variants}
    >
      <motion.uicorner
        animate={{
          CornerRadius: new UDim(0, state === "on" ? 20 : 0),
        }}
        transition={{
          duration: 0.3,
        }}
      />
    </motion.textbutton>
  );
}

export = (target: Instance) => {
  const root = createRoot(new Instance("Folder"));
  root.render(createPortal(<Button />, target));

  return () => root.unmount();
}
```

## useAnimation

That's not all Motion has to offer, though! If you'd like, you can use the `useAnimation` hook provided by Motion. This allows you to animate any component in your codebase without having to use the `motion` object or the `animate` prop, as it returns a setter for the variant:

```tsx
const ref = useRef<Frame>();
const [variant, setVariant] = useAnimation(ref, {
  transition: {
    duration: 3,
    easingStyle: "Quad",
  },
  variants: {
    hover: {
      BackgroundColor3: new Color3(0, 1, 0),
      transition: {
        duration: 0.5,
      },
    },
    default: {
      BackgroundColor3: new Color3(1, 0, 0),
      transition: {
        duration: 3,
      },
    },
  },
});

useEffect(() => print("Variant changed:", variant), [variant]);

return (
  <frame
    BackgroundColor3={new Color3(1, 0, 0)}
    Event={{ 
      MouseEnter: () => setVariant("hover"),
      MouseLeave: () => setVariant("default"),
    }}
    ref={ref}
  />
);
```

Because `useAnimation` simply takes in a ref, you can animate any React component with Motion, even if the `motion` object doesn't have it! If you still want to use the same syntax as you would with the `motion` object but with a different element, Motion also exports `withAnimation`:

```tsx
import { withAnimation } from "@rbxts/react-motion";

const Part = withAnimation("Part"); // this is a React component with Motion props
const part = <Part animate={} initial={} transition={} variants={} />
```

## Copy & paste example using `useAnimation` (works with Hoarcekat)

```tsx
import React, { useRef } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { useAnimation } from "@rbxts/react-motion";

const variants = {
  off: {
    BackgroundColor3: new Color3(1, 1, 1),
    Size: UDim2.fromOffset(300, 100),
    TextColor3: new Color3(0, 0, 0),
  },
  on: {
    BackgroundColor3: new Color3(0, 0, 0),
    Size: UDim2.fromOffset(300, 90),
    TextColor3: new Color3(1, 1, 1),
  }
};

const Button = () => {
  const button = useRef<TextButton>();
  const [variant, setVariant] = useAnimation(button, {
    variants,
    transition: {
      duration: 0.3
    }
  });

  const uiCorner = useRef<UICorner>();
  useAnimation(uiCorner, {
    animate: {
      CornerRadius: new UDim(0, variant === "on" ? 20 : 0),
    },
    transition: {
      duration: 0.3,
    },
  });

  return (
    <textbutton
      AnchorPoint={new Vector2(0.5, 0.5)}
      BackgroundColor3={new Color3(1, 1, 1)}
      Event={{
        MouseEnter: () => setVariant("on"),
        MouseLeave: () => setVariant("off"),
      }}
      Position={UDim2.fromScale(0.5, 0.5)}
      ref={button}
      Size={UDim2.fromOffset(300, 100)}
      Text="Hello"
      TextColor3={new Color3(0, 0, 0)}
      TextSize={20}
    >
      <uicorner ref={uiCorner} />
    </textbutton>
  );
}

export = (target: Instance) => {
  const root = createRoot(new Instance("Folder"));
  root.render(createPortal(<Button />, target));

  return () => root.unmount();
}
```