import React, { StrictMode, useEffect, useCallback, useState } from 'react';
import { createStore } from 'tinybase';
import { Provider, useCreateStore } from 'tinybase/ui-react';
import { createSqliteWasmPersister } from 'tinybase/persisters/persister-sqlite-wasm';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import {
  SortedTableInHtmlTable,
  ValuesInHtmlTable,
} from 'tinybase/ui-react-dom';
import { Inspector } from 'tinybase/ui-react-inspector';
import { Buttons } from './Buttons';
import Celon from './Celon';

export const App = () => {
  const [persister, setPersister] = useState(null);
  const store = useCreateStore(() => createStore());

  useEffect(() => {
    const initializePersister = async () => {
      try {
        const sqlite3 = await sqlite3InitModule();
        const db = new sqlite3.oo1.DB(':memory:', 'c');
        const newPersister = createSqliteWasmPersister(store, sqlite3, db, 'my_tinybase');
        
        await newPersister.load();
        console.log('Data loaded from SQLite database');

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
      } catch (error) {
        console.error('Error initializing persister:', error);
      }
    };

    initializePersister();

    return () => {
      if (persister) {
        persister.destroy();
      }
    };
  }, [store]);

  const saveData = useCallback(async () => {
    if (persister) {
      try {
        await persister.save();
        console.log('Data saved to SQLite database');
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  }, [persister]);

  return (
    <StrictMode>
      <Provider store={store}>
        <Buttons onSave={saveData} />
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
        </div>
        <Inspector />
      </Provider>
    </StrictMode>
  );
};
