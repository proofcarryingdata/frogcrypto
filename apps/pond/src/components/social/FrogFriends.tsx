import React, { useMemo } from "react";
import { useProfileFrogs } from "../../hooks/useFrogs";
import { useSemaphoreIdBase64 } from "../../hooks/useUserState";
import FrogProfileRow from "./FrogProfileRow";
import PendingRequests from "./PendingRequests";

function FrogFriends(): React.ReactElement {
  const { data: frogs } = useProfileFrogs();
  const semaphoreId = useSemaphoreIdBase64();

  const friends = useMemo(
    () => frogs?.filter((frog) => frog.profileId !== semaphoreId),
    [frogs, semaphoreId]
  );

  return (
    <div>
      <PendingRequests />
      {friends && friends.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Friends ({friends.length})</h2>
          <div>
            {friends.map((friend) => (
              <FrogProfileRow
                key={friend.profileId}
                frog={friend}
                profileId={friend.profileId}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default FrogFriends;
