import { EJSON, ObjectID } from "bson";
import { Consolidator } from "./index.js";

test("Main sample", () => {
  const currentOrder = {
    _id: new ObjectID(),
    ids: ["R3I432I4"],
    number: "R3I432I4",
    lines: [
      {
        name: "Carrots",
        quantity: {
          value: { $numberDecimal: 2 },
        },
      },
    ],
  };

  const updatedOrder = {
    _id: currentOrder._id,
    ids: ["R3I432I4"],
    number: "R3I432I4",
    lines: [
      {
        name: "Carrots",
        quantity: {
          value: { $numberDecimal: 3 },
        },
      },
    ],
  };

  const consolidatedOrder = new Consolidator(updatedOrder, currentOrder);
  const consolidationProfile = {
    action: "setUnlessSourceEmpty",
  };

  console.log(
    EJSON.stringify(consolidatedOrder.consolidate(consolidationProfile), null, 2)
  );

  console.log(consolidatedOrder.isSameAsConsolidation(consolidationProfile));
});
