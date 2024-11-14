import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { ParallaxProvider, ParallaxBanner } from "react-scroll-parallax";
import { ExternalLink } from "lucide-react";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";
import {
  useCelestialPondParticles,
  useFrogParticles,
} from "../../hooks/useFrogParticles";

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
      <div ref={ref} className="font-mono flex items-stretch">
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

export type FrogSearchButtonType =
  | typeof FrogSearchButton
  | typeof TheCapitalSearchButton
  | typeof CelestialPondSearchButton;

export const Button = forwardRef(
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

export function SocialButton({
  children,
  className,
  ...props
}: React.ComponentPropsWithRef<"button"> & { className?: string }) {
  return (
    <button
      type="button"
      className={`bg-moss-600 text-white px-1 py-0.5 min-w-16 ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
SocialButton.displayName = "SocialButton";

export const TheCapitalSearchButton = forwardRef(
  (
    { children, ...props }: React.ComponentPropsWithRef<"button">,
    buttonRef: React.Ref<HTMLButtonElement>
  ) => {
    return (
      <ParallaxProvider>
        <FrogSearchButton
          {...props}
          ref={buttonRef}
          style={{
            padding: 0,
            filter: props.disabled ? "brightness(80%) grayscale(80%)" : "",
          }}
        >
          <ParallaxBanner
            layers={[
              {
                image: "/images/the_capital.webp",
                speed: -15,
                style: {
                  filter: props.disabled
                    ? "brightness(30%) grayscale(80%)"
                    : "brightness(50%)",
                },
                shouldAlwaysCompleteAnimation: true,
              },
              {
                children: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <div>{children}</div>
                  </div>
                ),
              },
            ]}
            style={{ height: "48px", borderRadius: "4px" }}
          />
        </FrogSearchButton>
      </ParallaxProvider>
    );
  }
);
TheCapitalSearchButton.displayName = "TheCapitalSearchButton";

const TextureSearchButton = forwardRef(
  (
    {
      backgroundImage,
      children,
      buttonStyle,
      ...props
    }: React.ComponentPropsWithRef<"button"> & {
      pending?: boolean;
      backgroundImage?: string;
      buttonStyle?: React.CSSProperties;
    },
    buttonRef: React.Ref<HTMLButtonElement>
  ) => {
    return (
      <FrogSearchButton
        {...props}
        ref={buttonRef}
        style={{
          backgroundImage,
          backgroundRepeat: "repeat",
          filter: props.disabled ? "brightness(70%) grayscale(80%)" : "",
          padding: "8px",
          ...buttonStyle,
        }}
      >
        {children}
      </FrogSearchButton>
    );
  }
);
TextureSearchButton.displayName = "TextureSearchButton";

export const CelestialPondSearchButton = forwardRef(
  (
    {
      children,
      ...props
    }: React.ComponentPropsWithRef<typeof TextureSearchButton>,
    buttonRef: React.Ref<HTMLButtonElement>
  ) => {
    const ref = useRef<HTMLDivElement>(null);
    useCelestialPondParticles(ref);

    return (
      <TextureSearchButton
        ref={buttonRef}
        buttonStyle={{
          padding: 0,
        }}
        {...props}
        backgroundImage="url(/images/celestialpond.jpg)"
      >
        <div style={{ position: "relative", width: "100%", height: "48px" }}>
          <div
            ref={ref}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              left: 0,
              right: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              width: "100%",
              textAlign: "center",
            }}
          >
            {children}
          </div>
        </div>
      </TextureSearchButton>
    );
  }
);
CelestialPondSearchButton.displayName = "CelestialPondSearchButton";

const visitedLabAtAtom = atomWithStorage<number>(
  "visitedLabAt",
  Math.random() > 0.2 ? Date.now() : 0
);
export function useResetVisitedLabAt() {
  const [, setVisitedLabAt] = useAtom(visitedLabAtAtom);
  return () => {
    setVisitedLabAt(0);
  };
}
export function VisitLabButton() {
  const [visitedLabAt, setVisitedLabAt] = useAtom(visitedLabAtAtom);

  if (visitedLabAt) {
    return null;
  }

  return (
    <a
      href="https://shulgin.engineering"
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        setVisitedLabAt(Date.now());
      }}
      className="btn mx-auto bg-lab"
    >
      Visit Lab <ExternalLink className="inline w-4 h-4 mb-1" />
    </a>
  );
}
