import React from 'react';
import { useAddRowCallback, useSetValueCallback } from 'tinybase/ui-react';
import Celon from './Celon';

// Convenience function for generating a random integer
const getRandom = (max = 100) => Math.floor(Math.random() * max);

export const Buttons = () => {
  // Attach events to the buttons to mutate the data in the TinyBase Store
  const handleCount = useSetValueCallback(
    'counter',
    () => (value) => value + 1
  );
  const handleRandom = useSetValueCallback('random', () => getRandom());
  const handleAddPet = useAddRowCallback('pets', (_, store) => ({
    name: ['fido', 'felix', 'bubbles', 'lowly', 'polly'][getRandom(5)],
    species: store.getRowIds('species')[getRandom(5)],
  }));

  // New click counter
  const handleClickCount = useSetValueCallback(
    'clickCounter',
    () => (value) => (value || 0) + 1
  );

  const celonRef = React.useRef(null);

  const handleFetchCeloAddress = async () => {
    if (celonRef.current) {
      const address = await celonRef.current.getAddress();
      console.log('Fetched Celo address:', address);
    }
  };

  return (
    <div id='buttons'>
      <button onClick={handleCount}>Increment number</button>
      <button onClick={handleRandom}>Random number</button>
      <button onClick={handleAddPet}>Add a pet</button>
      <button onClick={handleFetchCeloAddress}>Fetch Celo Address</button>
      <button onClick={handleClickCount}>Count Clicks</button>
      <Celon ref={celonRef} />
    </div>
  );
};
