import React from "react";
import { useRouter, useLocation, useSearch } from "wouter";
import { useEvent } from "./useEvent";

type URLSearchParamsInit =
  | URLSearchParams
  | string
  | Record<string, string | readonly string[]>
  | Iterable<[string, string]>
  | ReadonlyArray<[string, string]>;

const useSearchParams: () => [
  URLSearchParams,
  (
    nextInit:
      | URLSearchParamsInit
      | ((prev: URLSearchParams) => URLSearchParamsInit)
      | undefined,
    opts: { replace?: boolean }
  ) => void,
] = () => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);

  const setSearchParams = useEvent((nextInit, navOpts) => {
    const newSearchParams = new URLSearchParams(
      typeof nextInit === "function" ? nextInit(searchParams) : nextInit
    );
    navigate("?" + newSearchParams, navOpts);
  });

  return [searchParams, setSearchParams];
};

export default useSearchParams;
