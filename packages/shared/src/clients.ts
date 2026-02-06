import { createPublicClient, createWalletClient, http, defineChain, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { DevnetJson } from "./config";

export function buildChain(chainId?: number) {
  if (!chainId) return undefined;
  return defineChain({
    id: chainId,
    name: `vibefi-${chainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [] }
    }
  });
}

export function getPublicClient(rpcUrl: string, chainId?: number) {
  const chain = buildChain(chainId);
  return createPublicClient({
    chain,
    transport: http(rpcUrl)
  });
}

export function getWalletClient(rpcUrl: string, chainId: number | undefined, privateKey: Hex) {
  const chain = buildChain(chainId);
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl)
  });
}

export function resolvePrivateKey(
  devnet: DevnetJson | undefined,
  override?: string
): Hex | undefined {
  const envKey = process.env.VIBEFI_PRIVATE_KEY;
  const key = override ?? envKey ?? (devnet?.developerPrivateKey ?? "");
  if (!key) return undefined;
  return key as Hex;
}
