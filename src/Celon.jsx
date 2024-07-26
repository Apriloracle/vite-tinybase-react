import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createWalletClient, custom } from 'viem';
import { celo } from 'viem/chains';

const Celon = forwardRef(({ onAddressChange }, ref) => {
  const [address, setAddress] = useState(null);

  useEffect(() => {
    fetchAddress();
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

  useImperativeHandle(ref, () => ({
    getAddress: async () => {
      if (!address) {
        await fetchAddress();
      }
      return address;
    }
  }));

  return (
    <div className='text-sm'>
      {address ? `Celo Address: ${address}` : 'Loading...'}
    </div>
  );
});

export default Celon;
