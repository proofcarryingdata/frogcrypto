import { shortCommitment } from "@frogcrypto/shared";
import { ChevronLeft, Link as LinkIcon, Loader, Share } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";
import { useZxing } from "react-zxing";
import { Link, useLocation } from "wouter";
import { useMyProfilePOD } from "../../hooks/useProfilePOD";
import { useUserState } from "../../hooks/useUserState";
import { Button } from "../shared/Button";
import { SEARCH_PARAM_NECKLACE_QR } from "./FrogNecklace";

export function ProfileSharer() {
  const [mode, setMode] = useState<"scan" | "frogme">("frogme");
  const { data: myProfilePOD } = useMyProfilePOD();
  const { data } = useUserState();
  const socialId = data?.myScore.socialId;
  const profileUrl = socialId
    ? `${window.location.origin}/?${SEARCH_PARAM_NECKLACE_QR}=${encodeURIComponent(socialId)}`
    : undefined;

  const [, setLocation] = useLocation();
  const { ref } = useZxing({
    onDecodeResult(result) {
      const txt = result.getText();
      if (txt.startsWith(window.location.origin)) {
        setLocation(txt);
      }
    },
  });

  const shareData = useMemo(() => {
    if (!myProfilePOD) {
      return undefined;
    }

    return {
      title: `${shortCommitment(myProfilePOD.profileId)}'s ${myProfilePOD.name} Profile`,
      text: "Check out my FrogCrypto profile!",
      url: profileUrl,
    } satisfies ShareData;
  }, [myProfilePOD, profileUrl]);
  const isShareable = useMemo(() => {
    return (
      Boolean(shareData) &&
      "canShare" in navigator &&
      navigator.canShare(shareData)
    );
  }, [shareData]);

  useEffect(() => {
    if (myProfilePOD && !profileUrl) {
      setLocation("/");
    }
  }, [myProfilePOD, profileUrl, setLocation]);

  if (!myProfilePOD) {
    return <Loader />;
  }

  if (!profileUrl) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Link href="/">
          <ChevronLeft />
        </Link>

        <div className="bg-gray-200 p-1 rounded-full text-xs">
          <button
            type="button"
            className={`px-4 py-2 rounded-full ${
              mode === "scan" ? "bg-white shadow" : ""
            }`}
            onClick={() => {
              setMode("scan");
            }}
          >
            Scan
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-full ${
              mode === "frogme" ? "bg-white shadow" : ""
            }`}
            onClick={() => {
              setMode("frogme");
            }}
          >
            Frog Me
          </button>
        </div>
      </div>

      {mode === "scan" ? (
        <div className="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-gray-300">
          <video ref={ref} className="w-full h-full object-cover">
            <track kind="captions" />
          </video>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="mt-4 text-sm">
            {shortCommitment(myProfilePOD.profileId)}&apos;s
            {myProfilePOD.name}
          </p>
          <p className="text-xs text-gray-500">{myProfilePOD.profileId}</p>

          <div className="relative">
            <QRCode value={profileUrl} size={250} />
            <img
              src={myProfilePOD.imageUrl}
              alt="Frog"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white"
            />
          </div>

          <div className="btn-group">
            {isShareable ? (
              <Button
                onClick={() => {
                  void navigator.share(shareData);
                }}
                className="mt-4"
              >
                <Share className="w-4 h-4" />
              </Button>
            ) : null}
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(profileUrl);
                toast.success("Profile link copied to clipboard!");
              }}
              className="mt-4"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSharer;
