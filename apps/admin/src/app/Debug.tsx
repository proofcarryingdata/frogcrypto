import React from "react";
import { compressBigInt, userPublicKeyToUserId } from "@frogcrypto/shared";
import { trpc } from "../trpc";

function Debug() {
  const { data: users } = trpc.admin.dumpUsers.useQuery();

  const invalidUsers = users?.filter((user) => {
    const userId = user.semaphoreId;
    const eddsaPublicKey = user.eddsaPublicKey;
    if (!eddsaPublicKey) return false;
    const profileId = userPublicKeyToUserId(eddsaPublicKey);
    return profileId !== compressBigInt(BigInt(userId));
  });

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Eddsa Public Key</th>
            <th>Semaphore ID</th>
            <th>Compressed Semaphore ID</th>
            <th>Derived Profile ID</th>
          </tr>
        </thead>
        <tbody>
          {invalidUsers?.map((user) => (
            <tr key={user.semaphoreId}>
              <td>{user.eddsaPublicKey}</td>
              <td>{user.semaphoreId}</td>
              <td>{compressBigInt(BigInt(user.semaphoreId))}</td>
              <td>{userPublicKeyToUserId(user.eddsaPublicKey ?? "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Debug;
