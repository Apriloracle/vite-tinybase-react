import { sync } from "@vlcn.io/ws-client";

self.onmessage = (msg) => {
  sync(self, msg.data);
};
