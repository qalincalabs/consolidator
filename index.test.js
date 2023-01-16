import { Consolidator } from "./index.js";

test("Main sample", () => {
  const currentOrder = {
    ids: ["R3I432I4"],
    number: "R3I432I4",
    lines: [
      {
        name: "Carrots",
        quantity: {
          value: 2,
        },
      },
    ],
  };

  const updatedOrder = {
    ids: ["R3I432I4"],
    lines: [
      {
        name: "Carrots",
        quantity: {
          value: 3,
        },
      },
    ],
    number: "R3I432I4",
  };

  const consolidatedOrder = new Consolidator(updatedOrder, currentOrder);
  const consolidationProfile = {
    action: "setUnlessSourceEmpty",
  };

  console.log(
    JSON.stringify(consolidatedOrder.consolidate(consolidationProfile), null, 2)
  );

  console.log(consolidatedOrder.isSameAsConsolidation(consolidationProfile));
});
