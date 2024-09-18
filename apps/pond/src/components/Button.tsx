import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { useFrogParticles } from "../hooks/useFrogParticles";

/**
 * A button that shows a loading spinner while the action is in progress.
 */
export function ActionButton({
  children,
  onClick,
  disabled,
  ButtonComponent = Button,
  className,
}: {
  children: React.ReactNode;
  /**
   * The action to perform when the button is clicked. This should return a
   * promise that resolves when the action is complete.
   */
  onClick: () => Promise<unknown>;
  disabled?: boolean;
  /**
   * The component to use for the button. Defaults to Button.
   */
  ButtonComponent?: FrogSearchButtonType;
  /**
   * Additional classes to apply to the button.
   */
  className?: string;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  // Every user click increment the trigger count, which will trigger the
  // useEffect to kick onClick action below.
  const [trigger, setTrigger] = useState(0);
  // nb: This improves the developer ergnomic and perserve the onClick semantics
  // such that it only fires once on click. By using ref, our trigger logic can
  // be freed from it as a dependency. Otherwise user needs to wrap onClick in
  // useCallback.
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  // monitor if a button is visible in the viewport and only trigger onClick
  // action when it is visible. low effort way to prevent low effort scripting
  const { ref, inView } = useInView();
  const inViewRef = useRef(inView);
  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);

  // nb: This useEffect is the core logic of this component. It will trigger
  // onClick action when trigger count is incremented. It will also set loading
  // state to true when onClick action is triggered, and set loading state to
  // false when onClick action is done.
  //
  // The key invariant is that because onClick action is async, we need to
  // ensure that the following scenario is handled correctly:
  //
  // 1. User click the button
  // 2. onClick action is triggered (Attempt X)
  // 3. User click the button again
  // 4. onClick action is triggered (Attempt Y)
  // 5. onClick action X is done, setting loading state to false, even though Y
  //    is still in progress.
  //
  // This would be incorrect and is handled by the abortController below.
  useEffect(() => {
    if (!inViewRef.current || document.visibilityState === "hidden") {
      return;
    }

    const abortController = new AbortController();

    if (trigger > 0) {
      setLoading(true);
      onClickRef
        .current()
        .catch((e: unknown) => {
          console.debug(e);
        })
        .finally(() => {
          // aborted means a newer onClick action is triggered and we should
          // take no further action
          if (abortController.signal.aborted) {
            return;
          }

          setLoading(false);
        });
    }

    return () => {
      abortController.abort();
    };
  }, [trigger]);

  const handleClick = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  return (
    <ButtonComponent
      onClick={handleClick}
      disabled={loading || disabled}
      pending={loading}
      ref={ref}
      className={className}
    >
      {children}
    </ButtonComponent>
  );
}

/**
 * The FrogSearchButton allows a frog confetti animation when the button is disabled.
 */
export const FrogSearchButton = forwardRef(
  (
    {
      disabled,
      pending,
      children,
      ...props
    }: React.ComponentPropsWithRef<"button"> & { pending?: boolean },
    buttonRef: React.Ref<HTMLButtonElement>
  ) => {
    const ref = useRef<HTMLDivElement>(null);
    const container = useFrogParticles(ref);

    const [enableParticles, setEnableParticles] = useState(false);
    useEffect(() => {
      if (disabled) {
        const timeout = setTimeout(() => {
          setEnableParticles(true);
        }, 1000);

        return () => {
          clearTimeout(timeout);
        };
      }

      setEnableParticles(false);
    }, [disabled, pending]);

    useEffect(() => {
      if (!container) {
        return;
      }

      if (enableParticles && !pending) {
        void container.start();
      }

      // nb: we always need this so we can disable animation when button starts as
      // enabled
      return (): void => {
        container.stop();
      };
    }, [container, enableParticles, pending]);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
        }}
        ref={ref}
      >
        <Button
          pending={pending}
          disabled={disabled}
          {...props}
          ref={buttonRef}
        >
          {children}
        </Button>
      </div>
    );
  }
);
FrogSearchButton.displayName = "FrogSearchButton";

export type FrogSearchButtonType = typeof FrogSearchButton;

const Button = forwardRef(
  (
    {
      children,
      pending,
      className,
      ...props
    }: React.ComponentPropsWithRef<"button"> & { pending?: boolean },
    buttonRef: React.Ref<HTMLButtonElement>
  ) => {
    return (
      <button
        type="button"
        className={`btn ${pending ? "cursor-wait" : ""} ${className ?? ""}`}
        {...props}
        ref={buttonRef}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
