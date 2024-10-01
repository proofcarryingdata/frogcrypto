import { shortCommitment, type ProfileFrogPOD } from "@frogcrypto/shared";
import {
  COMMON_TEMPERAMENT_SET,
  Temperament,
  type IFrogData,
} from "@pcd/eddsa-frog-pcd";
import _ from "lodash";
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { useLocation } from "wouter";
import { useMyProfilePOD, useSetMyProfilePOD } from "../../hooks/useProfilePOD";
import { useSemaphoreIdBase64, useUserState } from "../../hooks/useUserState";
import FrogCard from "../shared/FrogCard";
import TypistText from "../shared/TypistText";
import Loader from "../shared/Loader";
import MintingAnimation from "./MintingAnimation";

// Define a type for the numeric attributes
type FrogAttributes = Pick<
  IFrogData,
  "jump" | "speed" | "intelligence" | "beauty"
>;

// Refactored constants
const TOTAL_ATTRIBUTE_POINTS = 17;
const THINKING_TIME_MS = 1000;

// Update the attribute questions to use the FrogAttributes type
const attributeQuestions = [
  {
    question: "You encounter a wide river. How do you cross it?",
    options: [
      { answer: "Take a leap of faith!", attributes: { jump: 3 } },
      {
        answer: "Swim like you're racing Frozone.",
        attributes: { speed: 2, jump: 1 },
      },
      {
        answer: "Build a raft worthy of Huckleberry Finn.",
        attributes: { intelligence: 3 },
      },
      {
        answer: "Strut across a conjured rainbow bridge.",
        attributes: { beauty: 2, intelligence: 1 },
      },
    ],
  },
  {
    question: "A group of frogs is having a talent show. What's your act?",
    options: [
      {
        answer: "Defy gravity like Elphaba.",
        attributes: { jump: 2, beauty: 1 },
      },
      {
        answer: "Solve cases faster than Judy Hopps.",
        attributes: { speed: 2, intelligence: 1 },
      },
      {
        answer: "Perform mind-bending illusions.",
        attributes: { intelligence: 2, beauty: 1 },
      },
      {
        answer: "Dazzle everyone with your fly-catching skills.",
        attributes: { speed: 1, jump: 2 },
      },
    ],
  },
  {
    question: "You find a magical artifact. What do you do with it?",
    options: [
      {
        answer: "Use it to leap over the tallest lily pad.",
        attributes: { jump: 3 },
      },
      {
        answer: "Zoom around the pond like the Flash.",
        attributes: { speed: 3 },
      },
      {
        answer: "Decipher its secrets like Hermione Granger.",
        attributes: { intelligence: 3 },
      },
      {
        answer: "Transform it into the most fabulous accessory.",
        attributes: { beauty: 3 },
      },
    ],
  },
  {
    question: "The annual Frog Ball is coming up. How do you prepare?",
    options: [
      {
        answer: "Practice your grand entrance leap.",
        attributes: { jump: 2, beauty: 1 },
      },
      {
        answer: "Choreograph a lightning-fast dance routine.",
        attributes: { speed: 2, beauty: 1 },
      },
      {
        answer: "Invent a new croaking language for small talk.",
        attributes: { intelligence: 2, beauty: 1 },
      },
      {
        answer: "Design an outfit that would make Kermit jealous.",
        attributes: { beauty: 3 },
      },
    ],
  },
  {
    question: "A mysterious fog descends on the pond. What's your move?",
    options: [
      {
        answer: "Leap above it to get a bird's-eye view.",
        attributes: { jump: 3 },
      },
      {
        answer: "Dash through it, mapping the area at top speed.",
        attributes: { speed: 3 },
      },
      {
        answer: "Analyze its composition to understand its origin.",
        attributes: { intelligence: 3 },
      },
      {
        answer: "Use it as a dramatic backdrop for selfies.",
        attributes: { beauty: 2, intelligence: 1 },
      },
    ],
  },
].map(
  (question: {
    question: string;
    options: { answer: string; attributes: Partial<FrogAttributes> }[];
  }) => ({
    ...question,
    options: _.shuffle(question.options),
  })
);

// Refactored attribute calculation function
function calculateAttributes(answers: number[]): FrogAttributes {
  const initialAttributes: FrogAttributes = {
    jump: 0,
    speed: 0,
    intelligence: 0,
    beauty: 0,
  };

  const attributePoints = answers.reduce((acc, answerIndex, questionIndex) => {
    const selectedOption =
      attributeQuestions[questionIndex]?.options[answerIndex];
    if (!selectedOption) return acc;

    return Object.entries(selectedOption.attributes).reduce(
      (innerAcc, [attr, value]) => ({
        ...innerAcc,
        [attr]: (innerAcc[attr as keyof FrogAttributes] || 0) + (value || 0),
      }),
      acc
    );
  }, initialAttributes);

  const totalPoints = Object.values(attributePoints).reduce((a, b) => a + b, 0);
  const scaleFactor = TOTAL_ATTRIBUTE_POINTS / totalPoints;

  const scaledAttributes = Object.entries(
    attributePoints
  ).reduce<FrogAttributes>(
    (acc, [attr, value]) => ({
      ...acc,
      [attr]: Math.round(value * scaleFactor),
    }),
    {
      jump: 0,
      speed: 0,
      intelligence: 0,
      beauty: 0,
    }
  );

  const currentTotal = Object.values(scaledAttributes).reduce(
    (a, b) => a + b,
    0
  );
  if (currentTotal !== TOTAL_ATTRIBUTE_POINTS) {
    const [highestAttr] = Object.entries(scaledAttributes).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );
    return {
      ...scaledAttributes,
      [highestAttr]:
        scaledAttributes[highestAttr as keyof FrogAttributes] +
        (TOTAL_ATTRIBUTE_POINTS - currentTotal),
    };
  }

  return scaledAttributes;
}

// Enhanced temperament determination function
function determineTemperament(
  attributes: FrogAttributes
): Temperament | undefined {
  const sortedAttributes = Object.entries(attributes).sort(
    (a, b) => b[1] - a[1]
  );
  const [primaryAttr, secondaryAttr] = sortedAttributes;

  if (!primaryAttr || !secondaryAttr) {
    return _.sample(COMMON_TEMPERAMENT_SET);
  }

  if (primaryAttr[1] - secondaryAttr[1] >= 3) {
    // Clear dominant attribute
    switch (primaryAttr[0]) {
      case "jump":
        return Temperament.HYPE;
      case "speed":
        return Temperament.YOLO;
      case "intelligence":
        return Temperament.WISE;
      case "beauty":
        return Temperament.COOL;
      default:
        return _.sample(COMMON_TEMPERAMENT_SET);
    }
  } else {
    // Balanced or close attributes
    const combo = `${primaryAttr[0]}-${secondaryAttr[0]}`;
    const temperamentMap: Record<string, Temperament> = {
      "jump-speed": Temperament.HYPE,
      "speed-jump": Temperament.HYPE,
      "intelligence-beauty": Temperament.COOL,
      "beauty-intelligence": Temperament.COOL,
      "jump-intelligence": Temperament.WISE,
      "intelligence-jump": Temperament.WISE,
      "speed-beauty": Temperament.YOLO,
      "beauty-speed": Temperament.YOLO,
    };

    return temperamentMap[combo] ?? _.sample(COMMON_TEMPERAMENT_SET);
  }
}

// Enhanced helper function to color-code specific phrases
const enhanceText = (text: string): JSX.Element => {
  const specialPhrases: Record<string, string> = {
    "rainbow bridge":
      "bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500",
    "lightning-fast": "text-yellow-500",
    "magical artifact": "text-purple-500",
    "mysterious fog": "text-gray-500",
    Frozone: "text-blue-500",
    Elphaba: "text-green-500",
    Flash: "text-red-500",
    "Hermione Granger": "text-amber-700",
    Kermit: "text-green-600",
  };

  const words = text.split(" ");
  return (
    <>
      {words.map((word, index) => {
        const lowerWord = word.toLowerCase();
        for (const [phrase, style] of Object.entries(specialPhrases)) {
          if (lowerWord.includes(phrase.toLowerCase())) {
            return (
              // eslint-disable-next-line react/no-array-index-key -- no better key available
              <span key={index} className={style}>
                {word}{" "}
              </span>
            );
          }
        }
        // eslint-disable-next-line react/no-array-index-key -- no better key available
        return <span key={index}>{word} </span>;
      })}
    </>
  );
};

// Add this new function for specific answer comments
const getCommentForAnswer = (
  questionIndex: number,
  answerIndex: number
): string => {
  const comments: Record<number, string[]> = {
    0: [
      "A leap of faith indeed! You're not afraid to take risks.",
      "Smooth and swift, you navigate life's currents with ease.",
      "A problem-solver at heart, you see opportunities where others see obstacles.",
      "Your creativity knows no bounds, painting life in vibrant hues.",
    ],
    1: [
      "Defying gravity and expectations - you're a natural showstopper!",
      "Sharp mind, quick reflexes - you're always one hop ahead.",
      "Your mind is your greatest asset, weaving wonders from thin air.",
      "Fast and precise, you're a master of your craft.",
    ],
    2: [
      "You see potential where others see limitations. The sky's the limit!",
      "Speed is your middle name. You're always ready for the next adventure.",
      "Knowledge is power, and you wield it with finesse.",
      "You don't just keep up with trends, you set them. Fabulous!",
    ],
    3: [
      "Grand entrances are your specialty. You know how to make an impact!",
      "Quick feet and a quicker mind - you're always in motion.",
      "Your unique perspective brings fresh ideas to every conversation.",
      "Style icon alert! Your presence alone lights up the room.",
    ],
    4: [
      "Rising above challenges, you always find a new perspective.",
      "Fearless and fast, you charge through life's mysteries.",
      "Your analytical mind unravels the most complex puzzles.",
      "Finding beauty in the mysterious, you turn challenges into art.",
    ],
  };
  return comments[questionIndex]?.[answerIndex] ?? "Interesting choice!";
};

// Add this new function for personality analysis
const getPersonalityAnalysis = (
  attributes: FrogAttributes,
  temperament: Temperament
): string => {
  const highestAttribute = Object.entries(attributes).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  const analysisMap: Record<string, string> = {
    jump: "You're an adventurous spirit, always ready to leap into new experiences. Your enthusiasm is contagious, inspiring others to reach for the stars alongside you.",
    speed:
      "Quick-witted and always on the move, you thrive in dynamic environments. Your ability to adapt swiftly makes you an invaluable ally in any situation.",
    intelligence:
      "Your sharp mind is your greatest asset. You approach life's challenges with creativity and wisdom, often finding innovative solutions where others see dead ends.",
    beauty:
      "You have a natural flair for aesthetics and harmony. Your presence brightens any environment, and you have a knack for bringing out the beauty in others.",
  };

  const temperamentAnalysis: Partial<Record<Temperament, string>> = {
    [Temperament.HYPE]:
      "Your enthusiasm is infectious, always ready to rally others for any cause or adventure.",
    [Temperament.YOLO]:
      "You live life to the fullest, seizing every opportunity with gusto and without fear.",
    [Temperament.WISE]:
      "Your thoughtful nature and deep insights provide guidance to those around you.",
    [Temperament.COOL]:
      "Effortlessly charismatic, you navigate social waters with grace and style.",
    // Add other temperaments as needed
  };

  return `${analysisMap[highestAttribute] ?? ""} ${
    temperamentAnalysis[temperament] ?? ""
  }`;
};

export function SpiritFrogMinter() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<"intro" | "quiz" | "review" | "minting">(
    "intro"
  );
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [attributes, setAttributes] = useState<FrogAttributes>({
    jump: 0,
    speed: 0,
    intelligence: 0,
    beauty: 0,
  });
  const [temperament, setTemperament] = useState<Temperament | undefined>();
  const { data: userState } = useUserState();
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();
  const semaphoreIdBase64 = useSemaphoreIdBase64();
  const [isLeapAnimating, setIsLeapAnimating] = useState(false);
  const [mintingPhase, setMintingPhase] = useState<
    "dimming" | "minting" | null
  >(null);
  const [currentDialogue, setCurrentDialogue] = useState("");
  const dialogueRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(true);
  const [showChoiceButtons, setShowChoiceButtons] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (dialogueRef.current) {
      dialogueRef.current.scrollTo({
        top: dialogueRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [dialogueRef]);

  useEffect(() => {
    scrollToBottom();
  }, [currentDialogue, scrollToBottom]);

  useEffect(() => {
    if (mintingPhase === "dimming") {
      document.documentElement.classList.add("minting-mode");
      const timeout = setTimeout(() => {
        setMintingPhase("minting");
      }, 3_000);

      return () => {
        clearTimeout(timeout);
        document.documentElement.classList.remove("minting-mode");
        setMintingPhase(null);
      };
    }
  }, [mintingPhase]);

  const templateFrog = useMemo(() => {
    const spiritFrog = userState?.spiritFrog;

    if (!semaphoreIdBase64 || !spiritFrog || !temperament) return;
    return {
      ...spiritFrog,
      temperament,
      ...attributes,
      timestampSigned: Date.now(),
      ownerSemaphoreId: semaphoreIdBase64,

      profileId: semaphoreIdBase64,
      telegramUsername: "",
      farcasterUsername: "",

      contentID: 0n,
      signature: "",
      signerPublicKey: "",
    } satisfies ProfileFrogPOD;
  }, [semaphoreIdBase64, userState, temperament, attributes]);

  const { mutate: mintSpiritFrog, isPending: isMinting } = useSetMyProfilePOD({
    onMutate: async () => {
      setStage("minting");
      await new Promise((resolve) => {
        setTimeout(resolve, 10_000);
      });
    },
  });

  useEffect(() => {
    if (mintingPhase === "minting" && templateFrog) {
      mintSpiritFrog(templateFrog);
    }
  }, [mintingPhase, mintSpiritFrog, templateFrog]);

  const addMessage = useCallback(
    async (type: "spirit" | "user", content: string) => {
      setCurrentDialogue(
        (prev) =>
          `${prev}\n${type === "spirit" ? "Spirit of the Pond: " : "You: "}${content}`
      );
      scrollToBottom();
      await new Promise((resolve) => {
        setTimeout(resolve, THINKING_TIME_MS);
      }); // Simulate thinking time
    },
    [setCurrentDialogue, scrollToBottom]
  );

  useEffect(() => {
    if (stage === "quiz" && quizStep === 0) {
      void addMessage("spirit", attributeQuestions[0]?.question ?? "");
      setShowOptions(true);
    }
  }, [stage, quizStep, addMessage]);

  const handleAnswer = async (answerIndex: number) => {
    setShowOptions(false);
    const currentQuestion = attributeQuestions[quizStep];
    if (!currentQuestion) {
      throw new Error("Current question is undefined");
    }
    const selectedAnswer = currentQuestion.options[answerIndex]?.answer;
    if (!selectedAnswer) {
      throw new Error("Selected answer is undefined");
    }
    const comment = getCommentForAnswer(quizStep, answerIndex);

    await addMessage("user", selectedAnswer);
    await addMessage("spirit", comment);

    setAnswers((prevAnswers) => [...prevAnswers, answerIndex]);

    if (quizStep < attributeQuestions.length - 1) {
      setQuizStep((prevStep) => prevStep + 1);
      const nextQuestion = attributeQuestions[quizStep + 1];
      if (nextQuestion) {
        await addMessage("spirit", nextQuestion.question);
        setShowOptions(true);
      }
    } else {
      const finalAttributes = calculateAttributes([...answers, answerIndex]);
      const finalTemperament = determineTemperament(finalAttributes);
      setAttributes(finalAttributes);
      setTemperament(finalTemperament);
      setStage("review");
      setCurrentDialogue(""); // Clear the dialogue for the review stage
    }
  };

  const renderProgressBar = () => {
    const filledFrogs = "🐸".repeat(quizStep);
    const emptyFrogs = "⚪".repeat(attributeQuestions.length - quizStep);
    return (
      <div className="text-center text-2xl mb-4 tracking-[0.5em]">
        {filledFrogs}
        {emptyFrogs}
      </div>
    );
  };

  const renderIntro = () => (
    <TypistText
      onInit={(typewriter) => {
        return typewriter
          .typeString('<span class="text-enchanted">Ribbit...</span>')
          .pauseFor(THINKING_TIME_MS * 2)
          .typeString(
            '<br><br><span class="text-enchanted">Welcome, curious tadpole, to the Enchanted Frog Pond!</span>'
          )
          .pauseFor(THINKING_TIME_MS)
          .typeString(
            '<br><span class="text-enchanted">I am the Spirit of the Pond, guardian of all things amphibious and digital.</span>'
          )
          .pauseFor(THINKING_TIME_MS)
          .typeString(
            '<br><br><span class="text-enchanted">Are you ready to dive into the depths of your inner frog and emerge as your true amphibian self?</span>'
          );
      }}
    >
      <div className="flex justify-center mt-8">
        <button
          type="button"
          onClick={() => {
            setIsLeapAnimating(true);
            setTimeout(() => {
              setStage("quiz");
              setIsLeapAnimating(false);
            }, THINKING_TIME_MS);
          }}
          className={`btn-frog ${isLeapAnimating ? "animate-leap" : ""}`}
          disabled={isLeapAnimating}
        >
          Take the Leap of Faith!
        </button>
      </div>
    </TypistText>
  );

  const renderQuiz = () => {
    const currentQuestion = attributeQuestions[quizStep];
    if (!currentQuestion) {
      throw new Error("Current question is undefined");
    }

    return (
      <div className="w-full flex flex-col">
        {renderProgressBar()}
        <div
          ref={dialogueRef}
          className="mb-4 h-64 overflow-y-auto whitespace-pre-wrap flex flex-col gap-4 scroll-smooth"
        >
          {currentDialogue.split("\n").map((line, index) => {
            if (line.startsWith("You:")) {
              return (
                <div
                  // eslint-disable-next-line react/no-array-index-key -- no better key available
                  key={index}
                  className="self-end max-w-[80%] p-3 rounded-lg rounded-br-sm bg-blue-500 text-white text-sm animate-fadeIn"
                >
                  {line}
                </div>
              );
            } else if (line.startsWith("Spirit of the Pond:")) {
              return (
                <div
                  // eslint-disable-next-line react/no-array-index-key -- no better key available
                  key={index}
                  className="self-start max-w-[80%] p-3 rounded-lg rounded-bl-sm bg-gray-200 text-black text-sm animate-fadeIn"
                >
                  {line}
                </div>
              );
            }
            return null;
          })}
        </div>
        {showOptions ? (
          <div className="mt-4 space-y-2 flex flex-col items-end">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option.answer}
                type="button"
                onClick={() => {
                  void handleAnswer(index);
                }}
                className="w-3/4 text-left p-3 rounded-lg rounded-br-sm text-sm bg-blue-100 hover:bg-blue-200 transition-colors duration-200 ease-in-out animate-fadeIn"
              >
                {enhanceText(option.answer)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderReview = () => {
    if (!templateFrog || !temperament) {
      throw new Error("The lily pad is empty! No frog in sight.");
    }

    const personalityAnalysis = getPersonalityAnalysis(attributes, temperament);

    return (
      <div className="w-full flex flex-col">
        <TypistText
          onInit={(typewriter) => {
            return typewriter
              .typeString(personalityAnalysis)
              .callFunction(() => {
                setTimeout(() => {
                  setShowChoiceButtons(true);
                }, 3000);
              });
          }}
        >
          <div className="w-full max-w-md mt-4 animate-blur-in">
            <FrogCard frog={templateFrog} />
          </div>
        </TypistText>
        {showChoiceButtons ? (
          <div className="btn-group mt-6 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setStage("quiz");
                setQuizStep(0);
                setAnswers([]);
                setAttributes({
                  jump: 0,
                  speed: 0,
                  intelligence: 0,
                  beauty: 0,
                });
                setCurrentDialogue("");
                setShowChoiceButtons(false);
                setShowOptions(true);
              }}
              className="btn-frog whitespace-pre"
            >
              Try Again 🥹
            </button>
            <button
              type="button"
              disabled={isMinting}
              onClick={() => {
                setMintingPhase("minting");
              }}
              className="btn-frog whitespace-pre"
            >
              Summon Frog 🐸
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  useEffect(() => {
    if (myProfilePOD) {
      if (history.length > 1) {
        history.back();
      } else {
        setLocation("/social");
      }
    }
  }, [myProfilePOD, setLocation]);

  if (isLoadingMyProfilePOD || myProfilePOD) {
    return <Loader />;
  }

  return (
    <div>
      {stage === "intro" && renderIntro()}
      {stage === "quiz" && renderQuiz()}
      {stage === "review" && renderReview()}
      {stage === "minting" ? <MintingAnimation /> : null}
    </div>
  );
}

export default SpiritFrogMinter;
