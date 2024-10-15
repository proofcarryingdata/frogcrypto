import {
  Biome,
  type FeedBiomeConfigs,
  logger,
  type ServerFeed,
  ServerFeedSchema,
} from "@frogcrypto/shared";
import _ from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { trpc } from "../trpc";
import FeedTable from "./FeedTable";

function ManageFeed(): JSX.Element {
  const [newFeedsRaw, setNewFeedsRaw] = useState<string>("");
  const { newFeeds, newFeedsError } = useMemo(() => {
    try {
      const parsedData = feedParser(newFeedsRaw);
      return { newFeeds: parsedData, newFeedsError: undefined };
    } catch (error) {
      return { newFeeds: [], newFeedsError: getErrorMessage(error) };
    }
  }, [newFeedsRaw]);

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.admin.listFeeds.useQuery();
  const feeds = useMemo(
    () =>
      data?.map((feed) => ({
        id: feed.id,
        ...feed.feed,
      })) ?? [],
    [data]
  );
  const {
    mutate: upsertFeeds,
    isPending: isUpsertingFeeds,
    error: upsertFeedsError,
  } = trpc.admin.upsertFeeds.useMutation({
    onMutate: () => {
      void utils.admin.listFeeds.cancel();
    },
    onSettled: () => {
      void utils.admin.listFeeds.refetch();
    },
  });
  const {
    mutate: deleteFeeds,
    isPending: isDeletingFeeds,
    error: deleteFeedsError,
  } = trpc.admin.deleteFeeds.useMutation({
    onMutate: () => {
      void utils.admin.listFeeds.cancel();
    },
    onSettled: () => {
      void utils.admin.listFeeds.refetch();
    },
  });

  const [selectedFeedIds, setSelectedFeedIds] = useState<string[]>([]);
  useEffect(() => {
    setSelectedFeedIds([]);
  }, [feeds]);

  const selectedFeeds = useMemo(() => {
    return feeds.filter((feed) => selectedFeedIds.includes(feed.id));
  }, [feeds, selectedFeedIds]);
  useEffect(() => {
    setNewFeedsRaw(feedUnparser(selectedFeeds));
  }, [selectedFeeds]);

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Add New Feeds</h2>
        <p>
          Go to the Export tab of the Feed data spreadsheet, click on Export
          JSON in the toolbar, and copy the generated JSON representation of
          feeds.
        </p>
        <textarea
          rows={3}
          value={newFeedsRaw}
          onChange={(e) => {
            setNewFeedsRaw(e.target.value);
          }}
          className="w-full p-2 border rounded-md"
        />
        {Boolean(newFeedsError) && (
          <div className="mt-2 text-red-500">
            Error parsing feeds: {newFeedsError}
          </div>
        )}
        {Boolean(upsertFeedsError) && (
          <div className="mt-2 text-red-500">
            Error upserting feeds: {JSON.stringify(upsertFeedsError)}
          </div>
        )}
        {Boolean(deleteFeedsError) && (
          <div className="mt-2 text-red-500">
            Error deleting feeds: {JSON.stringify(deleteFeedsError)}
          </div>
        )}

        {newFeeds.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mt-6 mb-4">
              (Preview) New/Updated Feeds
            </h2>
            <FeedTable data={newFeeds} />
            <button
              type="button"
              disabled={isUpsertingFeeds || isDeletingFeeds}
              onClick={(): void => {
                upsertFeeds(newFeeds);
              }}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add/Update Feeds
            </button>
          </>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold">Feeds</h2>
        {isLoading ? <p>Loading...</p> : null}
        {error ? (
          <div className="text-red-500">
            Error fetching feeds: {JSON.stringify(error)}
          </div>
        ) : null}
        <button
          type="button"
          onClick={(): void => {
            deleteFeeds(selectedFeedIds);
          }}
          disabled={selectedFeedIds.length === 0}
          className={`mt-2 px-4 py-2 bg-red-500 text-white rounded ${
            selectedFeedIds.length === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-red-600"
          }`}
        >
          Delete Selected Feeds{" "}
          {selectedFeedIds.length > 0 && `(${String(selectedFeedIds.length)})`}
        </button>
        <FeedTable
          data={feeds}
          checkedIds={selectedFeedIds}
          setCheckedIds={setSelectedFeedIds}
        />
      </div>
    </>
  );
}

const SpreadsheetFeedSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  description: z.string(),
  private: z.boolean(),
  activeUntil: z.string(),
  cooldown: z.number().int().positive(),
});

/**
 * Parses the data from the feed spreadsheet into a format that can be used by the API.
 *
 * @param data The data from the frog spreadsheet as a JSON array of Record<attr name, attr val>.
 */
function feedParser(data: string): ServerFeed[] {
  const parseFeed = (raw: object): ServerFeed => {
    try {
      const feed = SpreadsheetFeedSchema.parse(raw);

      // e.g. biomesPutridswampDropweightscaler => biomes.PutridSwamp.dropWeightScaler
      const parseBiomes = (rawFeed: any): FeedBiomeConfigs =>
        Object.keys(Biome).reduce<FeedBiomeConfigs>((acc, biome) => {
          const key = `biomes${_.upperFirst(
            biome.replace(/\s/, "").toLowerCase()
          )}Dropweightscaler`;
          const dropWeightScaler = rawFeed[key] as string | undefined;

          if (
            typeof dropWeightScaler !== "undefined" &&
            Number(dropWeightScaler) > 0
          ) {
            acc[biome] = {
              dropWeightScaler: Number.parseFloat(dropWeightScaler),
            };
          }
          return acc;
        }, {});

      const feedData = {
        id: feed.uuid,
        name: feed.name,
        description: feed.description,
        private: Boolean(feed.private),
        activeUntil: Math.round(new Date(feed.activeUntil).getTime() / 1000),
        cooldown: feed.cooldown,
        biomes: parseBiomes(raw),
      } satisfies ServerFeed;

      return ServerFeedSchema.parse(feedData);
    } catch (e) {
      logger.error(e);
      throw new Error(`Invalid feed data: ${JSON.stringify(raw)}`);
    }
  };

  return (JSON.parse(data) as object[]).map(parseFeed);
}

/**
 * Unparses the data from db schema to the raw feed spreadsheet format for easy editing.
 */
function feedUnparser(feeds: ServerFeed[]): string {
  return JSON.stringify(
    feeds.map((feed) => ({
      uuid: feed.id,
      name: feed.name,
      description: feed.description,
      private: feed.private,
      activeUntil: new Date(feed.activeUntil * 1000).toISOString(),
      cooldown: feed.cooldown,
      ...Object.keys(Biome).reduce<Record<string, number>>((acc, biome) => {
        const biomeConfig = feed.biomes[biome];
        if (biomeConfig) {
          acc[
            `biomes${_.upperFirst(
              biome.replace(/\s/, "").toLowerCase()
            )}Dropweightscaler`
          ] = biomeConfig.dropWeightScaler;
        }
        return acc;
      }, {}),
    })),
    null,
    2
  );
}

// Define missing functions and variables
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return "An unknown error occurred";
};

export default ManageFeed;
