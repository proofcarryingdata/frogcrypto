/* eslint-disable camelcase -- db columns are not camel case */
import { logger } from "@frogcrypto/shared";
import {
  type FrogCryptoFrogData,
  FrogCryptoFrogDataSchema,
} from "@pcd/passport-interface";
import React, { useEffect, useMemo, useState } from "react";
import { trpc } from "../trpc";
import FrogTable from "./FrogTable";

function ManageFrog(): JSX.Element {
  const [newFrogs, setNewFrogs] = useState<FrogCryptoFrogData[]>([]);
  const [newFrogsError, setNewFrogsError] = useState<string>();
  const onTextChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    try {
      const parsedData = frogParser(event.target.value);
      setNewFrogs(parsedData);
      setNewFrogsError(undefined);
    } catch (error) {
      setNewFrogsError(getErrorMessage(error));
    }
  };

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.admin.listFrogs.useQuery();
  const frogs = useMemo(
    () => data?.map((frog) => frog.frog as FrogCryptoFrogData) ?? [],
    [data]
  );
  const {
    mutate: upsertFrogs,
    isPending: isUpsertingFrogs,
    error: upsertFrogsError,
  } = trpc.admin.upsertFrogs.useMutation({
    onMutate: () => {
      void utils.admin.listFrogs.cancel();
    },
    onSettled: () => {
      void utils.admin.listFrogs.refetch();
    },
  });
  const {
    mutate: deleteFrogs,
    isPending: isDeletingFrogs,
    error: deleteFrogsError,
  } = trpc.admin.deleteFrogs.useMutation({
    onMutate: () => {
      void utils.admin.listFrogs.cancel();
    },
    onSettled: () => {
      void utils.admin.listFrogs.refetch();
    },
  });

  const [selectedFrogIds, setSelectedFrogIds] = useState<number[]>([]);
  useEffect(() => {
    setSelectedFrogIds([]);
  }, [frogs]);

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Add New Frogs</h2>
        <p>
          Go to the Export tab of the Frog data spreadsheet, click on Export
          JSON in the toolbar, and copy the generated JSON representation of
          frogs.
        </p>
        <textarea
          rows={3}
          onChange={onTextChange}
          className="w-full p-2 border rounded-md"
        />
        {Boolean(newFrogsError) && (
          <div className="mt-2 text-red-500">
            Error parsing frogs: {newFrogsError}
          </div>
        )}
        {Boolean(upsertFrogsError) && (
          <div className="mt-2 text-red-500">
            Error upserting frogs: {JSON.stringify(upsertFrogsError)}
          </div>
        )}
        {Boolean(deleteFrogsError) && (
          <div className="mt-2 text-red-500">
            Error deleting frogs: {JSON.stringify(deleteFrogsError)}
          </div>
        )}

        {newFrogs.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mt-6 mb-4">
              (Preview) New/Updated Frogs
            </h2>
            <FrogTable data={newFrogs} />
            <button
              type="button"
              disabled={isUpsertingFrogs || isDeletingFrogs}
              onClick={(): void => {
                upsertFrogs(newFrogs);
              }}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add/Update Frogs
            </button>
          </>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold">Frogs</h2>
        {isLoading ? <p>Loading...</p> : null}
        {error ? (
          <div className="text-red-500">
            Error fetching frogs: {JSON.stringify(error)}
          </div>
        ) : null}
        <button
          type="button"
          onClick={(): void => {
            deleteFrogs(selectedFrogIds);
          }}
          disabled={selectedFrogIds.length === 0}
          className={`mt-2 px-4 py-2 bg-red-500 text-white rounded ${
            selectedFrogIds.length === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-red-600"
          }`}
        >
          Delete Selected Frogs{" "}
          {selectedFrogIds.length > 0 && `(${String(selectedFrogIds.length)})`}
        </button>
        <FrogTable
          data={frogs}
          checkedIds={selectedFrogIds}
          setCheckedIds={setSelectedFrogIds}
        />
      </div>
    </>
  );
}

/**
 * Parses the data from the frog spreadsheet into a format that can be used by the
 * `requestFrogCryptoUpdateFrogs` API.
 *
 * @param data - The data from the frog spreadsheet as a JSON array of Record<attr name, attr val>.
 * Numeric range value can be empty, a single number, or a range of numbers separated by a dash.
 * Enum values can be empty or a string. They are matched to numeric enum at the time of issuance.
 */
function frogParser(data: string): FrogCryptoFrogData[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any -- this is some unsafe parsing here
  return JSON.parse(data).map((rawFrog: any) => {
    function parseAttribtue(
      attribute: string
    ): [number, number] | [undefined, undefined] {
      const value = String(rawFrog[attribute] ?? "").trim();
      if (!value) {
        return [undefined, undefined];
      }

      if (value.includes("-")) {
        const [min, max] = value.split("-").map((v) => Number(v.trim()));
        return [min, max];
      }

      const parsed = Number(value);
      return [parsed, parsed];
    }
    const [jump_min, jump_max] = parseAttribtue("jump");
    const [speed_min, speed_max] = parseAttribtue("speed");
    const [intelligence_min, intelligence_max] = parseAttribtue("intelligence");
    const [beauty_min, beauty_max] = parseAttribtue("beauty");

    const frogData = {
      id: Number(rawFrog.frogId),
      uuid: rawFrog.uuid,
      name: rawFrog.name,
      description: rawFrog.description,
      biome: rawFrog.biome,
      rarity: rawFrog.rarity,
      temperament: rawFrog.temperament || undefined,
      drop_weight: Number(rawFrog.dropWeight),
      jump_min,
      jump_max,
      speed_min,
      speed_max,
      intelligence_min,
      intelligence_max,
      beauty_min,
      beauty_max,
    } satisfies FrogCryptoFrogData;

    try {
      FrogCryptoFrogDataSchema.parse(frogData);
    } catch (e) {
      logger.error(e);
      throw new Error(`Invalid frog data: ${JSON.stringify(frogData)}`);
    }

    return frogData;
  });
}

// Define missing functions and variables
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return "An unknown error occurred";
};

export default ManageFrog;
