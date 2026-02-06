import { getAbiItem } from "viem";
import governorAbi from "./abis/VfiGovernor.json";
import dappRegistryAbi from "./abis/DappRegistry.json";
import vfiTokenAbi from "./abis/VfiToken.json";

export { governorAbi, dappRegistryAbi, vfiTokenAbi };

export const proposalCreatedEvent = getAbiItem({
  abi: governorAbi,
  name: "ProposalCreated"
});

export const dappPublishedEvent = getAbiItem({
  abi: dappRegistryAbi,
  name: "DappPublished"
});

export const dappUpgradedEvent = getAbiItem({
  abi: dappRegistryAbi,
  name: "DappUpgraded"
});

export const dappMetadataEvent = getAbiItem({
  abi: dappRegistryAbi,
  name: "DappMetadata"
});

export const dappPausedEvent = getAbiItem({
  abi: dappRegistryAbi,
  name: "DappPaused"
});

export const dappUnpausedEvent = getAbiItem({
  abi: dappRegistryAbi,
  name: "DappUnpaused"
});

export const dappDeprecatedEvent = getAbiItem({
  abi: dappRegistryAbi,
  name: "DappDeprecated"
});
