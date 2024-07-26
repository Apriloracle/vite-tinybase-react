import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPublicClient, http, parseEther } from 'viem';
import { createBundlerClient, toCoinbaseSmartAccount } from 'viem/account-abstraction';
import { celo } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const Celon = forwardRef(({ onAddressChange }, ref) => {
  const [address, setAddress] = useState(null);
  const [smartAccount, setSmartAccount] = useState(null);
  const [bundlerClient, setBundlerClient] = useState(null);

  useEffect(() => {
    setupClients();
  }, []);

  const setupClients = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const publicClient = createPublicClient({
        chain: celo,
        transport: http(),
      });

      const bundler = createBundlerClient({
        client: publicClient,
        transport: http('https://api.pimlico.io/v2/42220/rpc?apikey=cfae95f6-a6eb-4569-b39e-01bee99dfcb8'), // Replace with actual Celo bundler URL
      });

      setBundlerClient(bundler);

      // For demonstration purposes, we're using a hardcoded private key.
      // In a real application, you should use a secure method to manage private keys.
      const owner = privateKeyToAccount('0x98c8310a4c8d3ab4edb6c004b42cdc79dcdb74b7254fe3f3d7cc413d04b65437'); // Replace with actual private key

      const account = await toCoinbaseSmartAccount({
        client: publicClient,
        owners: [owner],
      });

      setSmartAccount(account);
      setAddress(account.address);
      onAddressChange(account.address);
    } else {
      console.error('Ethereum provider not found');
    }
  };

  const sendUserOperation = async (to, value) => {
    if (!smartAccount || !bundlerClient) {
      console.error('Smart account or bundler client not initialized');
      return;
    }

    try {
      const hash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [{
          to,
          value: parseEther(value),
        }],
      });

      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
      console.log('User operation receipt:', receipt);
      return receipt;
    } catch (error) {
      console.error('Error sending user operation:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    getAddress: () => address,
    sendUserOperation,
  }));

  return (
    <div className='text-sm'>
      {address ? `Celo Smart Account Address: ${address}` : 'Loading...'}
    </div>
  );
});

export default Celon;
