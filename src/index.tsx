import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PostsProvider } from "./contexts/PostsContext";

render(
  <ThemeProvider>
    <PostsProvider>
      <App />
    </PostsProvider>
  </ThemeProvider>,
  document.getElementById("root")
);