import { EJSON } from "bson";
import { Consolidator } from "./consolidator.js";

export async function consolidateCollection(
  db,
  collectionName,
  contextInput,
  strategy
) {
  const input = contextInput[collectionName];

  if (input == null) return null;

  const rule = strategy.rules.find((r) => r.collection == collectionName);
  const profile = strategy.profiles.find((p) => p.key == rule.profileKey);

  return await findAndConsolidate(
    db.collection(collectionName),
    contextInput[collectionName],
    profile
  );
}

// do better than i.ids[0], use function from before
export async function findAndConsolidate(
  dbCollection,
  newItems,
  consolidationProfile
) {
  const ids = [...new Set(newItems.map((i) => i.ids).flat())];
  const currentItems = await dbCollection.find({ ids: { $in: ids } }).toArray();
  const consolidatedItems = [];
  const toUpdateItems = [];
  const alreadyUpdatedItems = [];

  for (const newItem of newItems) {
    // TODO does not support different info for same entity ...

    const itemAmongstConsolidatedOnes = findCollectionItemByItemIds(
      consolidatedItems,
      newItem
    );

    let currentItem = {};

    if (itemAmongstConsolidatedOnes != null) {
      toUpdateItems.splice(
        toUpdateItems.indexOf(itemAmongstConsolidatedOnes),
        1
      );
      consolidatedItems.splice(
        consolidatedItems.indexOf(itemAmongstConsolidatedOnes),
        1
      );
      alreadyUpdatedItems.splice(
        alreadyUpdatedItems.indexOf(itemAmongstConsolidatedOnes),
        1
      );
      currentItem = itemAmongstConsolidatedOnes;
    } else {
      currentItem = findCollectionItemByItemIds(currentItems, newItem);
    }

    if (currentItem == null) {
      consolidatedItems.push(newItem);
      toUpdateItems.push(newItem);
      continue;
    }

    const myConsolidator = new Consolidator(newItem, currentItem);

    const consolidated1 = myConsolidator.consolidate(consolidationProfile);

    consolidatedItems.push(consolidated1);

    const sameAsCurr =
      myConsolidator.isSameAsConsolidation(consolidationProfile);

    if (sameAsCurr == false) {
      toUpdateItems.push(consolidated1);
    } else {
      alreadyUpdatedItems.push(consolidated1);
    }
  }

  for (const toUpdateItem of toUpdateItems) {
    if (toUpdateItem._id == null) {
      toUpdateItem._id = new BSON.ObjectId();

      if (toUpdateItem.createdAt == null) {
        toUpdateItem.createdAt = new Date();
      }

      toUpdateItem.updatedAt = toUpdateItem.createdAt;
    } else {
      if (toUpdateItem.createdAt == null) {
        toUpdateItem.createdAt = new Date(
          parseInt(toUpdateItem._id.toString().substring(0, 8), 16) * 1000
        ); // TODO not working toUpdateItem._id.getTimestamp() in Atlas
      }
      toUpdateItem.updatedAt = new Date();
    }

    await dbCollection.replaceOne(
      {
        _id: toUpdateItem._id,
      },
      toUpdateItem,
      {
        upsert: true,
      }
    );

    alreadyUpdatedItems.push(toUpdateItem);
  }

  return alreadyUpdatedItems;
}

export function findCollectionItemByItemIds(list, item) {
  for (const ci of list) {
    const foundId = ci.ids.find((i) => item.ids.includes(i));

    if (foundId != null) return ci;
    else continue;
  }
}
