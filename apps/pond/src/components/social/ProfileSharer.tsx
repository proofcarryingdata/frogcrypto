import { shortCommitment } from "@frogcrypto/shared";
import { Link as LinkIcon, Loader, Share } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";
import { useLocation } from "wouter";
import { useMyProfilePOD } from "../../hooks/useProfilePOD";
import { useUserState } from "../../hooks/useUserState";
import { Button } from "../shared/Button";
import FrogImg from "../shared/FrogImg";

export function ProfileSharer() {
  const myProfilePOD = useMyProfilePOD();
  const { data } = useUserState();
  const socialId = data?.myScore.socialId;
  const profileUrl = socialId
    ? `https://dc7.getfrogs.xyz/necklace/${encodeURIComponent(socialId)}`
    : undefined;

  const [, setLocation] = useLocation();

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
    <div className="flex flex-col items-center justify-center gap-1">
      <p className="mt-4 text-sm">
        {myProfilePOD.profileName} the {myProfilePOD.name}
      </p>
      <a
        href={profileUrl}
        className="text-xs text-gray-500 underline"
        target="_blank"
        rel="noreferrer"
      >
        {myProfilePOD.profileId}
      </a>

      <div className="relative">
        <QRCode value={profileUrl} size={250} />
        <FrogImg
          frog={myProfilePOD}
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
  );
}

export default ProfileSharer;
