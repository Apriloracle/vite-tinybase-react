import React from 'react';
import { createWalletClient, custom } from 'viem';
import { celo } from 'viem/chains';

class Celon extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            address: null, 
            error: null
        };
    }

    componentDidMount() {
        this.fetchAddress();
    }

    async fetchAddress() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const client = createWalletClient({
                    chain: celo,
                    transport: custom(window.ethereum),
                });

                const addresses = await client.getAddresses();
                if (addresses && addresses.length > 0) {
                    this.setState({ address: addresses[0] });
                }
            } catch (error) {
                console.error('Error fetching address:', error);
                this.setState({ error: 'Failed to fetch Celo address' });
            }
        } else {
            console.error('Ethereum provider not found');
            this.setState({ error: 'Ethereum provider not found' });
        }
    }

    render() {
        const { address, error } = this.state;

        return (
            <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-orange-200'>
                <div className='bg-white p-8 rounded-lg shadow-md'>
                    {address ? (
                        <p className='text-lg font-semibold text-gray-800'>
                            Celo Address: <span className='text-orange-600'>{address}</span>
                        </p>
                    ) : error ? (
                        <p className='text-lg font-semibold text-red-500'>{error}</p>
                    ) : (
                        <p className='text-lg font-semibold text-gray-600'>Loading Celo address...</p>
                    )}
                </div>
            </div>
        );
    }
}

export default Celon;
