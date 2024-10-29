import React, { Suspense } from "react";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import { useAcceptedFrogRequests } from "../hooks/useFrogRequests";
import { useMyProfilePOD, useOtherProfilePODs } from "../hooks/useProfilePOD";
import { useSocialTabAvailable } from "../hooks/useUserState";
import NotFound from "./NotFound";
import Loader from "./shared/Loader";
import EnsureProfilePOD from "./social/EnsureProfilePOD";
import FrogFriends from "./social/FrogFriends";
import FrogScore from "./social/FrogScore";
import MyProfile from "./social/MyProfile";
import ProfileSharer from "./social/ProfileSharer";

function NavBar() {
  useAcceptedFrogRequests();

  const [location] = useLocation();

  const otherProfilePODs = useOtherProfilePODs();
  const showFriendsTab = otherProfilePODs.length > 0;

  return (
    <div className="px-2 mb-1 flex justify-between [&>*]:select-none">
      <Link
        href="/"
        className={` ${location === "/" ? "text-link-active" : "text-link"}`}
      >
        All users
      </Link>
      <Link
        href="/profile"
        className={` ${location === "/profile" ? "text-link-active" : "text-link"}`}
      >
        Profile
      </Link>
      {showFriendsTab ? (
        <Link
          href="/friends"
          className={` ${location === "/friends" ? "text-link-active" : "text-link"}`}
        >
          Friends
        </Link>
      ) : (
        <span className="text-link-disabled">Friends</span>
      )}
      <div className="relative">
        <span className="text-link-disabled">Newsfeed</span>
        <span className="absolute rounded-sm bottom-0 right-0 -mr-1 px-0.5 bg-orange-500 text-white text-[6px] bg-opacity-90">
          SOON
        </span>
      </div>
    </div>
  );
}

function SocialTab() {
  const socialTabAvailable = useSocialTabAvailable();
  const myProfilePOD = useMyProfilePOD();

  if (!socialTabAvailable) {
    return <Redirect to="~/" replace />;
  }

  if (!myProfilePOD) {
    return (
      <>
        <EnsureProfilePOD />
        <Loader />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full flex-1 overflow-auto">
      <img
        src="/images/frogsocial.png"
        alt="FrogSocial"
        draggable={false}
        className="select-none w-screen"
      />

      <NavBar />

      <div className="flex-1 overflow-auto flex flex-col gap-2">
        <Suspense fallback={<Loader />}>
          <Switch>
            <Route path="/" component={FrogScore} />
            <Route path="/profile" component={MyProfile} />
            <Route path="/friends" component={FrogFriends} />
            <Route path="/share" component={ProfileSharer} />

            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </div>
    </div>
  );
}

export default SocialTab;
