"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { Loader2, Wallet, LogOut, AlertTriangle, X, ChevronRight } from "lucide-react";

export function ConnectButton() {
  const [showModal, setShowModal] = useState(false);
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connect, connectors, isPending, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== baseSepolia.id;

  // Connected state - wrong network
  if (isConnected && address && isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: baseSepolia.id })}
        className="flex items-center gap-2 rounded-xl bg-warning/20 px-4 py-2 text-sm font-medium text-warning transition-all hover:bg-warning/30"
      >
        <AlertTriangle className="h-4 w-4" />
        Switch to Base Sepolia
      </button>
    );
  }

  // Connected state - correct network
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 transition-all hover:bg-white/15"
        >
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </button>

        {/* Connected Account Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <div className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#1a1b1f] shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <h3 className="text-lg font-semibold">Connected</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Account Info */}
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500">
                    <span className="text-2xl font-bold">
                      {address.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-lg font-medium">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span>Base Sepolia</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium transition-all hover:bg-white/10"
                  >
                    Copy Address
                  </button>
                  <button
                    onClick={() => {
                      disconnect();
                      setShowModal(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-error/10 py-3 text-sm font-medium text-error transition-all hover:bg-error/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not connected state
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-500 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </>
        )}
      </button>

      {/* Wallet Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#1a1b1f] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h3 className="text-lg font-semibold">Connect a Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Wallet List */}
            <div className="p-4">
              <div className="space-y-2">
                {connectors.map((connector) => {
                  const isLoading = isPending && pendingConnector?.id === connector.id;

                  return (
                    <button
                      key={connector.uid}
                      onClick={() => {
                        connect({ connector });
                      }}
                      disabled={isPending}
                      className="group flex w-full items-center gap-4 rounded-2xl bg-white/5 px-4 py-3 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                        {connector.id === "injected" ? (
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                            alt="MetaMask"
                            className="h-7 w-7"
                          />
                        ) : connector.id === "walletConnect" ? (
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9.58818 11.8556C13.1293 8.31442 18.8706 8.31442 22.4117 11.8556L22.8379 12.2818C23.015 12.4588 23.015 12.7459 22.8379 12.9229L21.3801 14.3808C21.2916 14.4693 21.148 14.4693 21.0595 14.3808L20.473 13.7943C18.0026 11.3239 13.9973 11.3239 11.5269 13.7943L10.8989 14.4223C10.8104 14.5108 10.6668 14.5108 10.5783 14.4223L9.12041 12.9645C8.94336 12.7875 8.94336 12.5004 9.12041 12.3234L9.58818 11.8556ZM25.4268 14.8706L26.7243 16.1682C26.9013 16.3452 26.9013 16.6323 26.7243 16.8093L20.8737 22.6599C20.6966 22.837 20.4095 22.837 20.2325 22.6599L16.0802 18.5076C16.0359 18.4634 15.9641 18.4634 15.9199 18.5076L11.7675 22.6599C11.5905 22.837 11.3034 22.837 11.1264 22.6599L5.27577 16.8093C5.09872 16.6323 5.09872 16.3452 5.27577 16.1682L6.57333 14.8706C6.75038 14.6936 7.03745 14.6936 7.2145 14.8706L11.3668 19.0229C11.411 19.0672 11.4828 19.0672 11.5271 19.0229L15.6794 14.8706C15.8565 14.6936 16.1435 14.6936 16.3206 14.8706L20.4729 19.0229C20.5172 19.0672 20.589 19.0672 20.6332 19.0229L24.7855 14.8706C24.9626 14.6936 25.2497 14.6936 25.4268 14.8706Z"
                              fill="#3B99FC"
                            />
                          </svg>
                        ) : (
                          <Wallet className="h-7 w-7" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">
                          {connector.id === "injected" ? "MetaMask" : connector.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {connector.id === "injected"
                            ? "Connect using browser extension"
                            : connector.id === "walletConnect"
                              ? "Scan with your mobile wallet"
                              : "Connect your wallet"}
                        </p>
                      </div>
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-6 py-4">
              <p className="text-center text-xs text-gray-500">
                By connecting, you agree to the Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
