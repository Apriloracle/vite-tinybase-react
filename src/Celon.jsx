import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createWalletClient, custom, http } from 'viem';
import { celo } from 'viem/chains';
import { createBundlerClient, createSmartAccountClient } from 'permissionless';
import { createKernelAccountClient } from 'permissionless/accounts';

const Celon = forwardRef(({ onAddressChange }, ref) => {
  const [address, setAddress] = useState(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState(null);
  const [bundlerClient, setBundlerClient] = useState(null);
  const [smartAccountClient, setSmartAccountClient] = useState(null);

  useEffect(() => {
    fetchAddress();
    setupPermissionless();
  }, []);

  const fetchAddress = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const client = createWalletClient({
        chain: celo,
        transport: custom(window.ethereum),
      });

      const addresses = await client.getAddresses();
      if (addresses && addresses.length > 0) {
        const newAddress = addresses[0];
        setAddress(newAddress);
        onAddressChange(newAddress);
      }
    } else {
      console.error('Ethereum provider not found');
    }
  };

  const setupPermissionless = async () => {
    if (address) {
      const bundlerClient = createBundlerClient({
        chain: celo,
        transport: http('https://api.pimlico.io/v2/42220/rpc?apikey=cfae95f6-a6eb-4569-b39e-01bee99dfcb8'), // Replace with actual bundler URL
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Replace with actual entry point
      });

      setBundlerClient(bundlerClient);

      const smartAccountClient = createSmartAccountClient({
        account: await createKernelAccountClient({
          entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Replace with actual entry point
          signer: { address }, // Use the EOA address as signer
          provider: window.ethereum,
        }),
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Replace with actual entry point
        bundlerClient,
      });

      setSmartAccountClient(smartAccountClient);

      const smartAccountAddress = await smartAccountClient.getAddress();
      setSmartAccountAddress(smartAccountAddress);
    }
  };

  useImperativeHandle(ref, () => ({
    getAddress: async () => {
      if (!address) {
        await fetchAddress();
      }
      return address;
    },
    getSmartAccountAddress: () => smartAccountAddress,
    sendUserOperation: async (target, data, value = BigInt(0)) => {
      if (smartAccountClient) {
        const userOpHash = await smartAccountClient.sendUserOperation({
          target,
          data,
          value,
        });
        return userOpHash;
      }
      throw new Error('Smart account client not initialized');
    },
  }));

  return (
    <div className='text-sm'>
      <div>{address ? `EOA Address: ${address}` : 'Loading EOA...'}</div>
      <div>{smartAccountAddress ? `Smart Account Address: ${smartAccountAddress}` : 'Loading Smart Account...'}</div>
    </div>
  );
});

export default Celon;

