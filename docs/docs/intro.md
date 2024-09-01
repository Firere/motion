---
sidebar_position: 1
---

# Introduction & About

React Motion (or just Motion, for short) is a motion library for roblox-ts and React inspired by Framer Motion. [The original motion was made by yayashn (the giant whose shoulders I stand on)](https://github.com/yayashn/motion) for legacy Roact, and has now been not just forked to port it for compatibility with React Lua, but massively extended beyond what it originally was. It's great to see you're considering using Motion in your project!

## Benefits

- **Seamlessly integrates:** You're free to gradually adopt Motion into your codebase and utilise it however much or little you want to - all you need to enable Motion on an element is to prepend it with `motion.` and you're good to go.
- **Scalable:** As components grow in size and complexity, Motion's styles stick by each element, reducing fragmented, spaghetti code. 
- **Web-inspired:** Motion tries to behave similarly to how much of web development does. If you're coming from a background in web design, chances are Motion will bring concepts familiar to you into Roblox and React Lua.

## Installation

To use Motion, you must be using roblox-ts and it's assumed you have an up-and-running roblox-ts environment synced with Rojo. If you're not sure what roblox-ts is, or if you've not yet used it, then [go check it out!](https://roblox-ts.com/)

To install Motion, run...
```
npm install @rbxts/react-motion
```
at the root of your project. Motion also requires that you yourself have `@rbxts/react` installed, as it cannot have its own "copy" of React without everything breaking.

Then, import the `motion` object:

```ts
import motion from "@rbxts/react-motion";
```

And that's it! You're ready to dive into using Motion!

## Motivation (why should you use Motion?)

Motion has a fair amount of features, but for the purposes of explaining the motivation behind Motion and why I think it can make your life as a developer easier I'll stick with the most fundamental part of Motion, what problem it identifies and the solution it provides.

React is great for creating user interfaces, both on Roblox and on the web. Its declarative design means developers don't have to concern themselves manually updating everything related to some state once it's changed; React handles this for them. Styling is made very simple as a result:

```tsx
const Selectable = () => {
  const [selected, setSelected] = useState(false);

  return (
    <textbutton
      BackgroundColor3={selected ? new Color3(0, 1, 0) : new Color3(1, 0, 0)}
      Event={{
        Activated: () => setSelected((selected) => !selected),
      }}
      Size={UDim2.fromOffset(300, 300)}
      Text={selected ? "Selected" : "Unselected"}
    />
  );
}
```

Great! We've been able to easily and quickly create a selectable `TextButton` which is green when selected and red when not. But what if we want to have a smooth *transition* between these two states? Well, things get a little more complicated...

```tsx
const Selectable = () => {
  return (
    <textbutton
      BackgroundColor3={new Color3(1, 0, 0)}
      Event={{
        Activated: (button) => {
          if (button.BackgroundColor3 === new Color3(1, 0, 0)) {
            TweenService.Create(
              button,
              new TweenInfo(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
              { BackgroundColor3: new Color3(0, 1, 0) }
            ).Play();
          } else {
            TweenService.Create(
              button,
              new TweenInfo(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.In),
              { BackgroundColor3: new Color3(1, 0, 0) }
            ).Play();
          }
        },
      }}
      Size={UDim2.fromOffset(300, 300)}
      Text={selected ? "Selected" : "Unselected"}
    />
  );
}
```

...because it doesn't really let us make use of the declarative nature of React, and while this is by no means unbearable, it certainly doesn't feel very pretty to look at or read.

But what if we have multiple elements which should change styles depending on a piece of state? The answer is easy: `useEffect`.

```tsx
const Selectable = () => {
  const [selected, setSelected] = useState(false);
  const button = useRef<TextButton>();
  const stroke = useRef<UIStroke>();

  useEffect(() => {
    if (selected) {
      TweenService.Create(
        button.current!,
        new TweenInfo(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
        { BackgroundColor3: new Color3(0, 1, 0) }
      ).Play();

      TweenService.Create(
        stroke.current!,
        new TweenInfo(0.7, Enum.EasingStyle.Quint, Enum.EasingDirection.In),
        { Thickness: 2 },
      ).Play();
    } else {
      TweenService.Create(
        button.current!,
        new TweenInfo(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.In),
        { BackgroundColor3: new Color3(1, 0, 0) }
      ).Play();

      TweenService.Create(
        stroke.current!,
        new TweenInfo(0.7, Enum.EasingStyle.Quint, Enum.EasingDirection.In),
        { Thickness: 1 },
      ).Play();
    }
  }, [selected]);

  return (
    <textbutton
      BackgroundColor3={new Color3(1, 0, 0)}
      Event={{
        Activated: () => setSelected((selected) => !selected),
      }}
      ref={button}
      Size={UDim2.fromOffset(300, 300)}
      Text={selected ? "Selected" : "Unselected"}
    >
      <uistroke ref={stroke} />
    </textbutton>
  );
}
```

This is still potentially manageable in a small component such as this. But as components grow both in lines of code, complexity and styling, the code becomes more fragmented over time, too. When we write what are essentially our styles likes this, they're placed in different parts of our code; sometimes right where we define the element (usually in cases of initial properties), which could be near the bottom of a large file, and other times it's at the top in an effect, or in a constant meant to act as both a variation of state and the initial property.

It's clear by now, obviously, that manually playing tweens for each variation of state isn't very sustainable. Motion offers a simple, declarative solution, where you simply say what you want properties to be for each variation of state, and Motion handles the rest. This is the example from above, this time written using Motion:

```tsx
const Selectable = () => {
  const [selected, setSelected] = useState(false);
  const animate = selected ? "selected" : "default";

  return (
    <motion.textbutton
      animate={animate}
      BackgroundColor3={new Color3(1, 0, 0)}
      Event={{
        Activated: () => setSelected((selected) => !selected),
      }}
      initial="default"
      Size={UDim2.fromOffset(300, 300)}
      Text={selected ? "Selected" : "Unselected"}
      transition={{
        duration: 0.3,
      }}
      variants={{
        selected: {
          BackgroundColor3: new Color3(0, 1, 0),
          transition: { easingFunction: "easeOutQuint" },
        },
        default: {
          BackgroundColor3: new Color3(1, 0, 0),
          transition: { easingFunction: "easeInQuint" },
        },
      }}
    >
      <motion.uistroke
        animate={animate}
        initial="default"
        transition={{
          duration: 0.7,
          easingFunction: "easeInQuint",
        }}
        variants={{
          selected: { Thickness: 2 },
          default: { Thickness: 1 },
        }}
      />
    </motion.textbutton>
  );
}
```

There are obviously many more features to Motion, but what this example in particular illustrated is Motion's fundamental philosophy of following a declarative programming paradigm, where you focus on the *what* instead of the *how*.
