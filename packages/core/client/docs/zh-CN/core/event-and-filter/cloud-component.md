---
title: Cloud Component Loader Demo
group:
  path: /core/event-and-filter
  title: Event and Filter
---

## Cloud Component Loader

This demo showcases how to load external UI components (Plain JS, React, Vue, Web Components) using `requirejs` and the `@nocobase/flow-engine`. It provides a JavaScript editor to write adapter code that transforms the loaded external library into a component usable within the NocoBase environment.

<code src="./demos/models/cloud-component.tsx"></code>

### How to Use

1.  **Select a Flow**:
    *   **Default (Custom)**: Allows you to provide any UMD library URL and write your own adapter code. The initial example uses ECharts.
    *   **ECharts Example**: Loads ECharts and renders a sample chart.
    *   **React Big Calendar Example**: Loads React Big Calendar and displays a basic calendar. (Note: This example assumes React, ReactDOM, and Moment.js are globally available. It also loads the required CSS for the calendar).
    *   **Vue.js Example**: Loads Vue.js and renders a simple Vue component.

2.  **Library URL (for Default mode)**:
    *   Enter the URL of the UMD (Universal Module Definition) bundle for the external library you want to load. This field is read-only if a preset flow (ECharts, Calendar, Vue) is selected.

3.  **Adapter JS Code (for Default mode)**:
    *   Write JavaScript code that will adapt the loaded library into a renderable component. This field is read-only if a preset flow is selected.
    *   The adapter code is a JavaScript function body that receives three arguments:
        *   `libraryInstance`: The instance of the library loaded by `requirejs`.
        *   `mountElement`: The DOM element (a `div`) where your component should be rendered.
        *   `dynamicRequire`: A reference to `requirejs` itself, which you can use if your adapter needs to load additional dependencies from within the adapter function.
    *   **Example (Plain JS - accessing a global from the UMD)**:
        ```javascript
        // Assuming your UMD library exposes itself as a global, e.g., 'MyGlobalLibrary'
        // and libraryInstance from requirejs([url], cb) is that global.
        // Or, if libraryInstance is an object with methods/properties.
        if (libraryInstance && typeof libraryInstance.render === 'function') {
          libraryInstance.render(mountElement);
        } else if (libraryInstance) {
          // Fallback: display the library structure or a message
          mountElement.textContent = 'Library loaded. Content: ' + (libraryInstance.name || JSON.stringify(libraryInstance));
        } else {
          mountElement.textContent = 'Library not loaded or has no default render method.';
        }
        ```
    *   **Example (React Component - assuming React & ReactDOM are global)**:
        ```javascript
        // libraryInstance could be the component itself or an object exporting it.
        const MyExternalComponent = libraryInstance.MyReactComponent || libraryInstance;
        const React = window.React;
        const ReactDOM = window.ReactDOM;

        if (!React || !ReactDOM) {
          mountElement.innerHTML = "React or ReactDOM not found globally.";
          return;
        }
        if (!MyExternalComponent) {
          mountElement.innerHTML = "React component not found in library instance.";
          return;
        }
        
        // Clear previous content if any (important for re-renders)
        mountElement.innerHTML = ''; 
        ReactDOM.render(React.createElement(MyExternalComponent, { /* any props here */ }), mountElement);
        ```

4.  **Click "Load and Render Component"**:
    *   This will trigger the selected flow.
    *   The flow typically involves:
        1. Setting library URL and adapter code (especially for presets).
        2. Loading CSS if specified (e.g., React Big Calendar).
        3. Loading the main library via `requirejs`.
        4. Executing the adapter code to render the component in the designated area.

### Technical Details

*   **Flow Engine**: Uses `@nocobase/flow-engine` to manage the sequence of operations.
*   **`requirejs`**: Dynamically loads UMD modules from external URLs. Accessed via `window.requirejs` or `window.require`.
*   **Adapter Execution**: The adapter code (string) is converted into a function using `new Function('libraryInstance', 'mountElement', 'dynamicRequire', adapterCodeString)` and then invoked with the loaded library, the target DOM element, and `requirejs`.
*   **Styling**: CSS for components like React Big Calendar is loaded by dynamically creating and appending a `<link>` tag to the document's `<head>`.

This demo illustrates a powerful pattern for extending NocoBase with a wide variety of third-party JavaScript-based UI components.
```
