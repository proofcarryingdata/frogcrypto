import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { setToken, trpc } from "../trpc";

const authTokenAtom = atomWithStorage("_UNSAFE_AUTH_TOKEN", "");

function Auth() {
  const [authToken, setAuthToken] = useAtom(authTokenAtom);
  const { isLoading: isSubmitting, refetch } = trpc.admin.listFrogs.useQuery(
    undefined,
    {
      enabled: Boolean(authToken),
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void refetch();
  };

  useEffect(() => {
    setToken(authToken);
  }, [authToken]);

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={authToken}
        onChange={(e) => setAuthToken(e.target.value)}
        className="flex-grow px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-teal-500"
        placeholder="Enter auth token"
        required
        disabled={isSubmitting}
      />
    </form>
  );
}

export default Auth;
