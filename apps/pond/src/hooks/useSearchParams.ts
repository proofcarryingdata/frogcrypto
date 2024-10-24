import React from "react";
import { useRouter, useLocation, useSearch } from "wouter";
import { useEvent } from "./useEvent";

type URLSearchParamsInit =
  | URLSearchParams
  | string
  | Record<string, string | readonly string[]>
  | Iterable<[string, string]>
  | readonly [string, string][];

type SetSearchParams = (
  nextInit:
    | URLSearchParamsInit
    | ((prev: URLSearchParams) => URLSearchParamsInit)
    | undefined,
  opts: { replace?: boolean }
) => void;

const useSearchParams: () => [URLSearchParams, SetSearchParams] = () => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);

  const setSearchParams = useEvent<SetSearchParams>((nextInit, navOpts) => {
    const newSearchParams = new URLSearchParams(
      // @ts-expect-error -- TODO: fix this
      typeof nextInit === "function"
        ? nextInit(new URLSearchParams(searchParams))
        : nextInit
    );
    navigate(`?${newSearchParams.toString()}`, navOpts);
  });

  return [searchParams, setSearchParams];
};

export default useSearchParams;
