import React from 'react';
import { useSetValueCallback } from 'tinybase/ui-react';

// Convenience function for generating a random integer
const getRandom = (max = 100) => Math.floor(Math.random() * max);

export const Buttons = ({ onSave }) => {
  // Attach events to the buttons to mutate the data in the TinyBase Store
  const handleCount = useSetValueCallback(
    'counter',
    () => (value) => value + 1
  );
  const handleRandom = useSetValueCallback('random', () => getRandom());

  // Click counter
  const handleClickCount = useSetValueCallback(
    'clickCounter',
    () => (value) => (value || 0) + 1
  );

  const handleAction = (action) => {
    action();
    onSave();
  };

  return (
    <div id='buttons'>
      <button onClick={() => handleAction(handleCount)}>Increment number</button>
      <button onClick={() => handleAction(handleRandom)}>Random number</button>
      <button onClick={() => handleAction(handleClickCount)}>Count Clicks</button>
      <button onClick={onSave}>Save Data</button>
    </div>
  );
};
