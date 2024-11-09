import React, { useMemo, useState } from "react";
import { type ProfileFrogPOD } from "@frogcrypto/shared";
import _ from "lodash";
import { useProfileFrogs } from "../../hooks/useFrogs";
import { useSemaphoreIdBase64 } from "../../hooks/useUserState";
import Modal from "../shared/Modal";
import FrogFriendProfile from "./FrogFriendProfile";
import SocialContainer from "./SocialContainer";
import FrogProfileBox from "./FrogProfileBox";

function FrogFriends(): React.ReactElement {
  const frogs = useProfileFrogs();
  const semaphoreId = useSemaphoreIdBase64();

  const friends = useMemo(
    () => frogs.filter((frog) => frog.profileId !== semaphoreId),
    [frogs, semaphoreId]
  );

  const [focusedFrog, setFocusedFrog] = useState<ProfileFrogPOD | undefined>(
    undefined
  );

  return (
    <div>
      {friends.length > 0 ? (
        <SocialContainer title="Your Friends">
          <div className="grid grid-cols-2 gap-3">
            {friends.map((friend) => (
              <FrogProfileBox
                key={friend.profileId}
                frog={friend}
                semaphoreIdBase64={friend.profileId}
                onFocusFrog={setFocusedFrog}
              />
            ))}
          </div>
        </SocialContainer>
      ) : (
        <span>
          Your lily pad is waiting for company! Scan some frog necklaces to make
          new friends in the pond.
        </span>
      )}

      <Modal
        isOpen={Boolean(focusedFrog)}
        onClose={() => {
          setFocusedFrog(undefined);
        }}
        overlayClassName="bg-opacity-100"
      >
        {focusedFrog ? (
          <FrogFriendProfile
            frog={focusedFrog}
            onClose={() => {
              setFocusedFrog(undefined);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

export default FrogFriends;
