import { StrictMode, useEffect, useCallback } from 'react';
import { createStore } from 'tinybase';
import { Provider, useCreateStore } from 'tinybase/ui-react';
import { createSqlite3Persister } from 'tinybase/persisters/persister-sqlite3';
import { Database } from 'sqlite3';
import {
  SortedTableInHtmlTable,
  ValuesInHtmlTable,
} from 'tinybase/ui-react-dom';
import { Inspector } from 'tinybase/ui-react-inspector';
import { Buttons } from './Buttons';
import Celon from './Celon';

const db = new Database(':memory:'); // Use a file path instead of ':memory:' for persistent storage

export const App = () => {
  const store = useCreateStore(() => {
    // Create the TinyBase Store and initialize the Store's data
    return createStore()
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
  });

  const [persister, setPersister] = useState(null);

  useEffect(() => {
    const newPersister = createSqlite3Persister(store, db, 'my_tinybase');
    setPersister(newPersister);

    const loadData = async () => {
      try {
        await newPersister.load();
        console.log('Data loaded from SQLite database');
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();

    return () => {
      newPersister.destroy();
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
