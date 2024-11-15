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
import { type Container } from "@tsparticles/engine";
import { useMutation } from "@tanstack/react-query";
import { POD } from "@pcd/pod";
import toast from "react-hot-toast";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CLOUDFLARE_TURNSTILE_SITE_KEY } from "@frogcrypto/shared";
import {
  useCelestialPondParticles,
  useFrogParticles,
  useWrithingVoidParticles,
} from "../../hooks/useFrogParticles";
import { trpc } from "../../trpc";
import useGetFrog from "../../hooks/useGetFrog";
import TypistText from "./TypistText";

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

export const WrithingVoidSearchButton = forwardRef(
  (
    {
      children,
      disabled,
      ...props
    }: Omit<
      React.ComponentPropsWithRef<typeof TextureSearchButton>,
      "backgroundImage" | "onClick"
    >,
    buttonRef: React.Ref<HTMLButtonElement>
  ) => {
    const animate = useWrithingVoidParticles();

    const [activated, setActivated] = useState(false);
    const [animating, setAnimating] = useState(false);

    const { mutateAsync: surrender } = trpc.feeds.surrender.useMutation();
    const { mutateAsync: searchFrog } = useGetFrog();

    const { mutate: startAnimation, isPending } = useMutation({
      mutationFn: async ({ pod }: { pod: POD }) => {
        let container: Container | undefined;
        try {
          try {
            container = await animate();
            console.log("container", container);
          } catch (e) {
            console.error("Unable to start animation", e);
          }

          await toast.promise(
            (async () => {
              const feed = await surrender({ pod });

              setAnimating(true);

              await new Promise((resolve) => {
                setTimeout(resolve, 30 * 1000);
              });

              return searchFrog({
                feedId: feed.id,
                version: "v2",
              });
            })(),
            {
              loading: "Diving into the void...",
              success: "Your sacrifice has been accepted.",
              error: "The void is displeased.",
            }
          );
        } finally {
          try {
            if (container && !container.destroyed) {
              container.destroy();
            }
          } catch {
            console.debug("Failed to destroy container");
          }

          await new Promise((resolve) => {
            setTimeout(resolve, 4 * 1000);
          });

          setAnimating(false);
          setActivated(false);
        }
      },
    });

    return (
      <>
        <TextureSearchButton
          ref={buttonRef}
          buttonStyle={{
            padding: 0,
            backgroundColor: "black",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
          }}
          onClick={() => {
            setActivated(true);
          }}
          disabled={disabled ?? isPending}
          {...props}
          backgroundImage="url(/images/writhingvoid.png)"
        >
          <div className="relative w-full h-12">
            <div className="absolute top-1/2 -translate-y-1/2 w-full text-center">
              {children}
            </div>
          </div>
        </TextureSearchButton>
        <div
          className={`fixed inset-0 flex items-center justify-center transition-colors duration-[4000ms] ${
            activated
              ? "bg-black pointer-events-auto"
              : "bg-transparent pointer-events-none delay-1000"
          }`}
        >
          <div
            className={`
              bg-[url('/images/writhingvoid.png')] bg-cover bg-no-repeat bg-center
              rounded-full animate-rotating
              transition-all duration-[4000ms] ease-in-out
              ${
                animating
                  ? "opacity-100 w-[min(80vw,80vh)] h-[min(80vw,80vh)] animate-pulse-void delay-[16000ms]"
                  : "opacity-20 w-0 h-0"
              }
            `}
          />
          {!isPending && activated ? (
            <div className="text-white text-center">
              <TypistText
                onInit={(typewriter) => {
                  return typewriter
                    .changeDelay("natural")
                    .pauseFor(2_000)
                    .typeString("writhing void beckons<br/>")
                    .typeString("surrender your pod<br/>")
                    .typeString("seek the desert watcher's code<br/><br/>")
                    .pauseFor(500)
                    .typeString("the void hungers<br/>")
                    .typeString("and all must return to dark");
                }}
              >
                <textarea
                  spellCheck={false}
                  className="w-full h-full bg-transparent text-white m-2"
                  placeholder="Paste your pod here..."
                  rows={10}
                  onChange={(e) => {
                    try {
                      const pod = POD.fromJSON(JSON.parse(e.target.value));

                      if (!pod.verifySignature()) {
                        toast.error("Invalid pod signature");
                        setActivated(false);
                      }

                      startAnimation({ pod });
                    } catch {
                      toast.error("Invalid pod");
                    }
                  }}
                />
              </TypistText>
            </div>
          ) : null}
        </div>
      </>
    );
  }
);
WrithingVoidSearchButton.displayName = "WrithingVoidSearchButton";

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
