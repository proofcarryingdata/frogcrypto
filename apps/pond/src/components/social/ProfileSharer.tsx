import React from "react";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";
import { useSemaphoreId, useSemaphoreIdBase64 } from "../../hooks/useUserState";
import { Button } from "../shared/Button";

export function ProfileSharer() {
  const semaphoreIdBase64 = useSemaphoreIdBase64() ?? "";
  const profileUrl = `${window.location.origin}/#/profile/${semaphoreIdBase64}`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-bold mb-4">Share Your Profile</h3>
      <div className="flex flex-col gap-4">
        <Button onClick={handleCopyLink}>Copy Profile Link</Button>
        <div className="flex justify-center mt-4">
          <QRCode value={profileUrl} size={200} />
        </div>
      </div>
    </div>
  );
}

export default ProfileSharer;
