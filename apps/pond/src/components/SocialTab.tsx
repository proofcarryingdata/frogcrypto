import React, { useEffect } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { Compass, Trophy, User } from "lucide-react";
import { useMyProfilePOD } from "../hooks/useProfilePOD";
import { useSocialTabStatus } from "../hooks/useUserState";
import Loader from "./shared/Loader";
import UnderConstruction from "./UnderConstruction";
import MyProfile from "./social/MyProfile";
import NotFound from "./NotFound";
import ProfileSharer from "./social/ProfileSharer";

function NavBar() {
  const [location] = useLocation();

  return (
    <div className="btn-group gap-0 [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none self-end">
      <Link
        href="/"
        className={`btn ${location === "/" ? "bg-green-600" : "bg-gray-400"}`}
      >
        <User />
      </Link>
      <Link
        href="/friends"
        className={`btn ${location === "/friends" ? "bg-green-600" : "bg-gray-400"}`}
      >
        <Compass />
      </Link>
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
  const { isAvailable: socialTabAvailable } = useSocialTabStatus();
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();

  useEffect(() => {
    if (!socialTabAvailable) {
      setLocation("/", { replace: true });
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
        <Route path="/friends" component={UnderConstruction} />
        <Route path="/scores" component={UnderConstruction} />
        <Route path="/share" component={ProfileSharer} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default SocialTab;
