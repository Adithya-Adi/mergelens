export type MergeLensStatus = {
  name: string;
  version: string;
  status: "bootstrapped";
};

export function getStatus(): MergeLensStatus {
  return {
    name: "MergeLens",
    version: "0.1.0",
    status: "bootstrapped"
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(getStatus());
}
