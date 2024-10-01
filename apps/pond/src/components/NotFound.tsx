import { useEffect } from "react";
import { useLocation } from "wouter";

function NotFound() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
}

export default NotFound;
