import React, { useEffect } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { Compass, Trophy, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { useMyProfilePOD, useOtherProfilePODs } from "../hooks/useProfilePOD";
import { useSocialTabAvailable } from "../hooks/useUserState";
import {
  useAcceptedFrogRequests,
  usePendingFrogRequests,
} from "../hooks/useFrogRequests";
import Loader from "./shared/Loader";
import UnderConstruction from "./UnderConstruction";
import MyProfile from "./social/MyProfile";
import NotFound from "./NotFound";
import ProfileSharer from "./social/ProfileSharer";
import OtherProfile from "./social/OtherProfile";
import FrogFriends from "./social/FrogFriends";

function NavBar() {
  useAcceptedFrogRequests();

  const [location] = useLocation();

  const { data: pendingRequests } = usePendingFrogRequests();
  const { data: otherProfilePODs } = useOtherProfilePODs();
  const showFriendsTab =
    (pendingRequests?.length ?? 0) > 0 || (otherProfilePODs?.length ?? 0) > 0;

  return (
    <div className="btn-group gap-0 [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none self-end">
      <Link
        href="/"
        className={`btn ${location === "/" ? "bg-green-600" : "bg-gray-400"}`}
      >
        <User />
      </Link>
      {showFriendsTab ? (
        <Link
          href="/friends"
          className={`btn ${location === "/friends" ? "bg-green-600" : "bg-gray-400"}`}
        >
          <Compass />
        </Link>
      ) : null}
      <Link
        href="/scores"
        className={`btn ${location === "/scores" ? "bg-green-600" : "bg-gray-400"}`}
      >
        <Trophy />
      </Link>
    </div>
  );
}

function SocialTab() {
  const [location, setLocation] = useLocation();
  const socialTabAvailable = useSocialTabAvailable();
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();

  useEffect(() => {
    if (!socialTabAvailable) {
      toast.error("Ribbit! This pond area is off-limits for now.");
      setLocation("~/", { replace: true });
    } else if (!isLoadingMyProfilePOD && !myProfilePOD) {
      setLocation("/tadpole");
    }
  }, [socialTabAvailable, isLoadingMyProfilePOD, myProfilePOD, setLocation]);

  if (!socialTabAvailable || isLoadingMyProfilePOD || !myProfilePOD) {
    return <Loader />;
  }

  return (
    <>
      {location === "/share" ? null : <NavBar />}

      <Switch>
        <Route path="/" component={MyProfile} />
        <Route path="/friends" component={FrogFriends} />
        <Route path="/scores" component={UnderConstruction} />
        <Route path="/share" component={ProfileSharer} />
        <Route path="/:id" component={OtherProfile} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default SocialTab;
