/// <reference types="@rbxts/testez/globals" />
import Object from "@rbxts/object-utils";
import type { CastsToTargets, Target, Transition, Variants } from ".";
import TargetUtility from "./TargetUtility";

export = () => {
	describe("addDefaultTransition", () => {
		it("adds the default transition to the provided target", () => {
			const utility = new TargetUtility({ duration: 5, ease: "easeOutQuint", repeat: 3 });
			const target = { Size: new UDim2(), transition: { duration: 3, repeat: 0 } };
			const processed = utility.addDefaultTransition(target);

			expect(processed.transition).never.to.equal(undefined);
			const { duration, ease } = processed.transition!;
			expect(duration).to.equal(3);
			expect(ease).to.equal("easeOutQuint");
			expect(processed.transition!.repeat).to.equal(0);
		});

		it("returns the default transition if the target does not have its own transition", () => {
			const defaultTransition: Transition = { duration: 5, ease: "easeOutQuint", repeat: 3 };
			const utility = new TargetUtility(defaultTransition);
			const target: Target<GuiObject> = { Size: new UDim2() };
			const processed = utility.addDefaultTransition(target);

			expect(processed.transition).to.equal(defaultTransition);
		});

		it("returns the target's transition if there is no default transition", () => {
			const targetTransition: Transition = { duration: 5, ease: "easeOutQuint", repeat: 3 };
			const utility = new TargetUtility();
			const target = { Size: new UDim2(), transition: targetTransition };
			const processed = utility.addDefaultTransition(target);

			expect(processed.transition).to.equal(targetTransition);
		});

		it("merges default transition's and target transition's callbacks", () => {
			let number = 0;
			const defaultTransitionCallback = () => {
				number += 5;
			};
			const targetCallback = () => {
				number -= 3;
			};
			const utility = new TargetUtility({ callback: defaultTransitionCallback });
			const target = { Size: new UDim2(), transition: { callback: targetCallback } };
			const processed = utility.addDefaultTransition(target);

			processed.transition?.callback?.(Enum.PlaybackState.Completed);
			expect(number).to.equal(2);
		});
	});

	describe("castToTarget", () => {
		it("if provided a target, returns it directly", () => {
			const target: Target<GuiObject> = { Size: new UDim2() };
			const utility = new TargetUtility();
			const processed = utility.castToTarget(target);

			expect(processed).to.equal(target);
		});

		it("if provided a variant label, returns its target", () => {
			const variant = "default";
			const target = { Size: new UDim2() };
			const utility = new TargetUtility<GuiObject>(undefined, { default: target });
			const processed = utility.castToTarget(variant);

			expect(processed).to.equal(target);
		});

		it("throws if provided a variant that doesn't exist", () => {
			const utility = new TargetUtility<GuiObject>(undefined, { default: { Size: new UDim2() } });
			const castNonexistentVariant = () => utility.castToTarget("nonexistent");

			expect(castNonexistentVariant).to.throw();
		});

		it("throws if provided a variant when no variants exist", () => {
			const utility = new TargetUtility();
			const castDefaultToTarget = () => utility.castToTarget("default");

			expect(castDefaultToTarget).to.throw();
		});
	});

	describe("castToTargets", () => {
		it("converts all variants to targets", () => {
			const variants: Variants<GuiObject> = {
				variant1: { AnchorPoint: new Vector2() },
				variant2: { Rotation: 45 },
				variant3: { Size: new UDim2() },
			};
			const targets: CastsToTargets<GuiObject> = [
				"variant1",
				{ BackgroundColor3: new Color3() },
				"variant2",
				{ Position: new UDim2() },
				"variant3",
			];
			const utility = new TargetUtility(undefined, variants);
			const processed = utility.castToTargets(targets);

			const isEqual = Object.deepEquals(processed!, [
				variants.variant1,
				targets[1],
				variants.variant2,
				targets[3],
				variants.variant3,
			]);
			expect(isEqual).to.equal(true);
		});

		it("adds the default transition to all targets when it should", () => {
			let number = 0;
			const defaultTransition: Transition = {
				duration: 5,
				ease: "easeOutQuint",
				repeat: 3,
				callback: () => {
					number += 3;
				},
			};
			const targets: Target<GuiObject>[] = [
				{ AnchorPoint: new Vector2(), transition: { duration: 3 } },
				{ Position: new UDim2() },
				{
					Size: new UDim2(),
					transition: {
						repeat: 0,
						callback: () => {
							number -= 2;
						},
					},
				},
			];
			const utility = new TargetUtility(defaultTransition);

			const withDefaultTransition = utility.castToTargets(targets, false)!;
			expect(withDefaultTransition).to.be.ok();

			withDefaultTransition.forEach(({ transition }) => {
				expect(transition).to.be.ok();

				const isEqual = Object.deepEquals(transition!, {
					...defaultTransition,
					...transition,
				});
				expect(isEqual).to.equal(true);

				const callback = transition!.callback;
				expect(callback).to.be.ok();
				callback!(Enum.PlaybackState.Completed);
			});

			expect(number).to.equal(7);

			const withoutDefaultTransition = utility.castToTargets(targets, true)!;
			expect(withoutDefaultTransition).to.be.ok();

			const [first, second, third] = withoutDefaultTransition;
			expect(first.transition).to.equal(targets[0].transition);
			expect(second.transition).never.to.be.ok();
			expect(third.transition).to.equal(targets[2].transition);

			number = 0;
			withoutDefaultTransition.forEach(({ transition }) => transition?.callback?.(Enum.PlaybackState.Completed));
			expect(number).to.equal(-2);
		});
	});

	describe("resolveConflicts", () => {
		SKIP(); // todo
		it("removes duplicate properties, prioritising those to the right of the array", () => {});

		it("does not remove any transitions", () => {});
	});
};
