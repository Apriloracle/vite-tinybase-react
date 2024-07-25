import React, { StrictMode, useEffect, useCallback, useState } from 'react';
import { createStore, createMergeableStore } from 'tinybase';
import { Provider, useCreateStore, useValue } from 'tinybase/ui-react';
import { createCrSqliteWasmPersister } from 'tinybase/persisters/persister-cr-sqlite-wasm';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { createWsSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';
import initWasm from '@vlcn.io/crsqlite-wasm';
import { SortedTableInHtmlTable, ValuesInHtmlTable } from 'tinybase/ui-react-dom';
import { Inspector } from 'tinybase/ui-react-inspector';
import { Buttons } from './Buttons';
import Celon from './Celon';

const DB_NAME = 'MyAppDatabase';
const CLICK_COUNTER_KEY = 'clickCounter';
const MERGEABLE_STORE_KEY = 'mergeableClickCounter';
const WS_SERVER = 'wss://todo.demo.tinybase.org/';

const GlobalClickCounter = () => {
  const clickCount = useValue(CLICK_COUNTER_KEY);
  return <div>Global Click Count: {clickCount}</div>;
};

export const App = () => {
  const [persister, setPersister] = useState(null);
  const store = useCreateStore(() => createStore());
  const [broadcastChannel, setBroadcastChannel] = useState(null);
  const [mergeableStore, setMergeableStore] = useState(null);
  const [mergeablePersister, setMergeablePersister] = useState(null);
  const [synchronizer, setSynchronizer] = useState(null);

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
            .setRow('pets', '0', { name: 'fido', species: 'dog' })
            .setTable('species', {
              dog: { price: 5 },
              cat: { price: 4 },
              fish: { price: 2 },
              worm: { price: 1 },
              parrot: { price: 3 },
            })
            .setTable('node_network', {
              '1': { celoAddress: '0x1234...', peerDID: 'did:peer:123...' },
              '2': { celoAddress: '0x5678...', peerDID: 'did:peer:456...' },
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

        // Initialize mergeable store for click counter
        const newMergeableStore = createMergeableStore('clickCounterStore');
        const newMergeablePersister = createLocalPersister(newMergeableStore, MERGEABLE_STORE_KEY);
        
        await newMergeablePersister.load();
        if (!newMergeableStore.getValue(CLICK_COUNTER_KEY)) {
          newMergeableStore.setValue(CLICK_COUNTER_KEY, 0);
          await newMergeablePersister.save();
        }
        
        setMergeableStore(newMergeableStore);
        setMergeablePersister(newMergeablePersister);

        // Set up WebSocket Synchronizer
        const webSocket = new WebSocket(WS_SERVER);
        const newSynchronizer = await createWsSynchronizer(newMergeableStore, webSocket);
        await newSynchronizer.startSync();
        setSynchronizer(newSynchronizer);

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
      if (mergeablePersister) {
        mergeablePersister.destroy();
      }
      if (synchronizer) {
        synchronizer.destroy();
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
    if (mergeablePersister) {
      try {
        await mergeablePersister.save();
        console.log('Mergeable store data saved to local storage');
      } catch (error) {
        console.error('Error saving mergeable store data:', error);
      }
    }
  }, [persister, broadcastChannel, mergeablePersister]);

  return (
    <StrictMode>
      <Provider store={store}>
        <Provider store={mergeableStore}>
          <Buttons onSave={saveData} />
          <GlobalClickCounter />
          <Celon />
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
            <h2>Node Network Table</h2>
            <SortedTableInHtmlTable
              tableId='node_network'
              cellId='celoAddress'
              sortOnClick={true}
              className='sortedTable'
            />
          </div>
          <Inspector />
        </Provider>
      </Provider>
    </StrictMode>
  );
};
