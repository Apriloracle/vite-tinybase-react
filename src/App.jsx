import React, { StrictMode, useEffect, useCallback, useState } from 'react';
import { createStore, createMergeableStore } from 'tinybase';
import { Provider, useCreateStore, useValue, useTable } from 'tinybase/ui-react';
import { createCrSqliteWasmPersister } from 'tinybase/persisters/persister-cr-sqlite-wasm';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { createWsSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';
import initWasm from '@vlcn.io/crsqlite-wasm';
import { ValuesInHtmlTable } from 'tinybase/ui-react-dom';
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

const NodeNetworkTable = () => {
  const nodeNetwork = useTable('node_network');
  
  return (
    <table>
      <thead>
        <tr>
          <th>Node ID</th>
          <th>Celo Address</th>
          <th>Peer DID</th>
          <th>Last Active</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(nodeNetwork || {}).map(([nodeId, node]) => (
          <tr key={nodeId}>
            <td>{nodeId}</td>
            <td>{node.celoAddress}</td>
            <td>{node.peerDID}</td>
            <td>{new Date(node.lastActive).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const App = () => {
  const [persister, setPersister] = useState(null);
  const store = useCreateStore(() => createStore());
  const [broadcastChannel, setBroadcastChannel] = useState(null);
  const [mergeableStore, setMergeableStore] = useState(null);
  const [mergeablePersister, setMergeablePersister] = useState(null);
  const [synchronizer, setSynchronizer] = useState(null);

  const handleCeloAddress = useCallback((address) => {
    if (address && store) {
      const existingNode = Object.entries(store.getTable('node_network') || {}).find(
        ([_, node]) => node.celoAddress === address
      );

      if (!existingNode) {
        const newNodeId = Date.now().toString();
        store.setRow('node_network', newNodeId, {
          celoAddress: address,
          peerDID: 'Not set', // You might want to generate or fetch a real PeerDID here
          lastActive: Date.now() // Initialize the network timer
        });
        saveData();
      } else {
        // Update the lastActive timestamp for existing nodes
        store.setCell('node_network', existingNode[0], 'lastActive', Date.now());
        saveData();
      }
    }
  }, [store]);

  // Function to update network timer
  const updateNetworkTimer = useCallback(() => {
    if (store) {
      const nodeNetwork = store.getTable('node_network');
      if (nodeNetwork) {
        Object.keys(nodeNetwork).forEach(nodeId => {
          store.setCell('node_network', nodeId, 'lastActive', Date.now());
        });
        saveData();
      }
    }
  }, [store]);

  // ... (rest of the code remains the same)

  return (
    <StrictMode>
      <Provider store={store}>
        <Provider store={mergeableStore}>
          <Buttons onSave={saveData} onUpdateTimer={updateNetworkTimer} />
          <GlobalClickCounter />
          <Celon onAddressChange={handleCeloAddress} />
          <div>
            <h2>Values</h2>
            <ValuesInHtmlTable />
          </div>
          <div>
            <h2>Node Network Table</h2>
            <NodeNetworkTable />
          </div>
          <Inspector />
        </Provider>
      </Provider>
    </StrictMode>
  );
};
