import { useEffect } from "react";
import { useLocation } from "wouter";

function NotFound() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.debug("Not found, redirecting to /");
    setLocation("/");
  }, [setLocation]);

  return null;
}

export default NotFound;
