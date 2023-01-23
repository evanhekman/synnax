// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { lib } from "@synnaxlabs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    lib({
      name: "drift",
    }),
    react(),
  ],
  build: {
    minify: false,
    rollupOptions: {
      external: ["react", "react-dom", "react-redux", "@reduxjs/toolkit"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-redux": "ReactRedux",
          "@reduxjs/toolkit": "ReduxToolkit",
          "proxy-memoize": "ProxyMemoize",
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});