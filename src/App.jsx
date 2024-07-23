import React, { StrictMode, useEffect, useCallback, useState } from 'react';
import { createStore } from 'tinybase';
import { Provider, useCreateStore } from 'tinybase/ui-react';
import { createCrSqliteWasmPersister } from 'tinybase/persisters/persister-cr-sqlite-wasm';
import initWasm from '@vlcn.io/crsqlite-wasm';
import { SortedTableInHtmlTable, ValuesInHtmlTable } from 'tinybase/ui-react-dom';
import { Inspector } from 'tinybase/ui-react-inspector';
import { Buttons } from './Buttons';
import Celon from './Celon';
import { createMergeableStore } from 'tinybase/persisters/persister-localstorage';

const DB_NAME = 'MyAppDatabase';
const MERGEABLE_STORE_ID = 'CeloAddressStore';

export const App = () => {
  const [persister, setPersister] = useState(null);
  const store = useCreateStore(() => createStore());
  const [broadcastChannel, setBroadcastChannel] = useState(null);
  const [mergeableStore, setMergeableStore] = useState(null);

  useEffect(() => {
    const initializePersister = async () => {
      try {
        const crSqlite3 = await initWasm();
        const db = await crSqlite3.open(DB_NAME);
        const newPersister = createCrSqliteWasmPersister(store, db, 'my_tinybase');
        
        await newPersister.load();
        console.log('Data loaded from CR-SQLite database');

        // Initialize store if it's empty
        if (Object.keys(store.getTables()).length === 0) {
          store
            .setValue('counter', 0)
            .setValue('clickCounter', 0)
            .setRow('pets', '0', { name: 'fido', species: 'dog' })
            .setTable('species', {
              dog: { price: 5 },
              cat: { price: 4 },
              fish: { price: 2 },
              worm: { price: 1 },
              parrot: { price: 3 },
            });
          await newPersister.save();
        }

        setPersister(newPersister);

        // Set up BroadcastChannel for cross-tab communication
        const channel = new BroadcastChannel('store_updates');
        channel.onmessage = async (event) => {
          if (event.data.type === 'store_updated') {
            await newPersister.load();
          }
        };
        setBroadcastChannel(channel);

        // Initialize MergeableStore for Celo address
        const newMergeableStore = createMergeableStore(MERGEABLE_STORE_ID);
        const localPersister = createLocalPersister(newMergeableStore);
        await localPersister.load();
        setMergeableStore(newMergeableStore);

      } catch (error) {
        console.error('Error initializing persister:', error);
      }
    };

    initializePersister();

    return () => {
      if (persister) {
        persister.destroy();
      }
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [store]);

  const saveData = useCallback(async () => {
    if (persister) {
      try {
        await persister.save();
        console.log('Data saved to CR-SQLite database');
        // Notify other tabs about the update
        if (broadcastChannel) {
          broadcastChannel.postMessage({ type: 'store_updated' });
        }
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  }, [persister, broadcastChannel]);

  const saveCeloAddress = useCallback(async (address) => {
    if (mergeableStore) {
      mergeableStore.setCell('celo_addresses', 'current', 'address', address);
      try {
        await localPersister.save();
        console.log('Celo address saved to local storage');
      } catch (error) {
        console.error('Error saving Celo address:', error);
      }
    }
  }, [mergeableStore]);

  return (
    <StrictMode>
      <Provider store={store}>
        <Buttons onSave={saveData} />
        <Celon onAddressChange={saveCeloAddress} />
        <div>
          <h2>Values</h2>
          <ValuesInHtmlTable />
        </div>
        <div>
          <h2>Species Table</h2>
          <SortedTableInHtmlTable
            tableId='species'
            cellId='price'
            descending={true}
            sortOnClick={true}
            className='sortedTable'
          />
          <h2>Pets Table</h2>
          <SortedTableInHtmlTable
            tableId='pets'
            cellId='name'
            limit={5}
            sortOnClick={true}
            className='sortedTable'
            paginator={true}
          />
        </div>
        <Inspector />
      </Provider>
    </StrictMode>
  );
};
