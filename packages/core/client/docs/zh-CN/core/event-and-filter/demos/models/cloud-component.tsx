import React, { useRef, useEffect, useState } from 'react';
import { Button } from 'antd'; // Assuming antd is available and used
import { useFlowModel, BlockModel, FlowContext, FlowModel } from '@nocobase/flow-engine'; // Adjust imports as needed
import { Application, Plugin, Select } from '@nocobase/client'; // Added Select

class CloudComponentModel extends BlockModel {
  constructor(uid, app, options) {
    super(uid, app, options);
    this.props = {
      adapterCode: `// Example for ECharts
// (libraryInstance, mountElement, dynamicRequire) => { 
//   if (!libraryInstance) { mountElement.innerHTML = 'ECharts library not loaded.'; return; } 
//   const chart = libraryInstance.init(mountElement); 
//   chart.setOption({ title: { text: 'ECharts from Cloud Component' }, tooltip: {}, xAxis: { data: ["A", "B", "C"] }, yAxis: {}, series: [{ name: 'Data', type: 'bar', data: [5, 20, 36] }] }); 
// }`.replace(/^[/]{2} /gm, '').trim(),
      libraryUrl: 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js', // Default ECharts for testing
      ...options?.props,
    };
  }

  // Define the default flow (remains unchanged, uses model.props directly)
  static defaultFlow = {
    key: 'default',
    title: 'Default Cloud Component Flow',
    autoApply: false,
    steps: {
      loadLibrary: {
        title: 'Load External Library',
        handler: async (ctx: FlowContext, model: FlowModel) => {
          const libraryUrl = model.props.libraryUrl;
          if (!libraryUrl) {
            console.error('Library URL is not defined.');
            ctx.setOutput('library', null); ctx.$exit(); return;
          }
          console.log('Loading library from:', libraryUrl);
          const element = ctx.get('elementRef')?.current;
          if (element) element.innerHTML = 'Loading library...';
          try {
            const requireFn = window.requirejs || window.require;
            if (!requireFn) throw new Error('requirejs is not available globally.');
            await new Promise((resolve, reject) => {
              requireFn([libraryUrl], (loadedLib) => {
                console.log('Library loaded successfully:', loadedLib);
                ctx.setOutput('library', loadedLib); resolve(loadedLib);
              }, (err) => {
                console.error('Failed to load library:', err);
                if (element) element.innerHTML = `Failed to load library: ${libraryUrl}. Error: ${err.message || err}`;
                ctx.setOutput('library', null); reject(err);
              });
            });
          } catch (error) {
            console.error('Error in loadLibrary step:', error);
            if (element) element.innerHTML = `Error loading library: ${error.message || error}`;
            ctx.setOutput('library', null);
          }
        }
      },
      renderComponent: {
        title: 'Render Component using Adapter',
        handler: async (ctx: FlowContext, model: FlowModel) => {
          const library = ctx.getInput('library');
          const adapterCode = model.props.adapterCode;
          const element = ctx.get('elementRef')?.current;
          const requireFn = window.requirejs || window.require;
          if (!element) { console.error('elementRef not found.'); return; }
          element.innerHTML = '';
          if (!library) { element.innerHTML = 'Library not loaded.'; return; }
          if (!adapterCode) { element.innerHTML = 'Adapter code not provided.'; return; }
          console.log('Executing adapter code with library:', library);
          try {
            const adapterFn = new Function('libraryInstance', 'mountElement', 'dynamicRequire', adapterCode);
            adapterFn(library, element, requireFn);
            console.log('Adapter code executed.');
          } catch (error) {
            console.error('Error executing adapter code:', error);
            element.innerHTML = `Error in adapter code: ${error.message || error}`;
          }
        }
      }
    }
  };

  // Helper step handler to set props for preset flows
  static setFlowPropsHandler = async (ctx: FlowContext, model: FlowModel, params: { libraryUrl?: string, adapterCode?: string }) => {
    model.setProps({
      libraryUrl: params.libraryUrl ?? model.props.libraryUrl,
      adapterCode: params.adapterCode ?? model.props.adapterCode,
    });
    console.log('Flow-specific props set by setFlowPropsHandler:', { libraryUrl: model.props.libraryUrl, adapterCode: model.props.adapterCode });
  };

  // loadStyle handler
  static loadStyleHandler = async (ctx: FlowContext, model: FlowModel, params: { url: string }) => {
    return new Promise((resolve, reject) => {
      if (!params.url) {
        console.warn('No CSS URL provided to loadStyle step.');
        resolve(null); return;
      }
      if (document.querySelector(`link[href="${params.url}"]`)) {
        console.log('CSS already loaded:', params.url);
        resolve(null); return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = params.url;
      link.onload = () => { console.log('CSS loaded:', params.url); resolve(link); };
      link.onerror = (err) => { console.error('Failed to load CSS:', params.url, err); reject(err); };
      document.head.appendChild(link);
    });
  };

  static echartsFlow = {
    key: 'echartsFlow',
    title: 'ECharts Example',
    steps: {
      setProps: {
        handler: CloudComponentModel.setFlowPropsHandler,
        params: {
          libraryUrl: 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
          adapterCode: `(libraryInstance, mountElement, dynamicRequire) => {
            if (!libraryInstance) { mountElement.innerHTML = 'ECharts library not loaded.'; return; }
            const chart = libraryInstance.init(mountElement);
            const option = {
              title: { text: 'ECharts Example (Flow)' },
              tooltip: {},
              legend: { data:['Sales'] },
              xAxis: { data: ["Shirts", "Cardigans", "Chiffons", "Pants", "Heels", "Socks"] },
              yAxis: {},
              series: [{ name: 'Sales', type: 'bar', data: [5, 20, 36, 10, 10, 20] }]
            };
            chart.setOption(option);
          }`.replace(/^            /gm, '').trim()
        }
      },
      loadLibrary: CloudComponentModel.defaultFlow.steps.loadLibrary,
      renderComponent: CloudComponentModel.defaultFlow.steps.renderComponent,
    }
  };

  static reactBigCalendarFlow = {
    key: 'reactBigCalendarFlow',
    title: 'React Big Calendar Example',
    steps: {
      setProps: {
        handler: CloudComponentModel.setFlowPropsHandler,
        params: {
          libraryUrl: 'https://cdn.jsdelivr.net/npm/react-big-calendar@1.18.0/dist/react-big-calendar.min.js',
          adapterCode: `async (libraryInstance, mountElement, dynamicRequire) => {
            if (!libraryInstance || !libraryInstance.Calendar) { mountElement.innerHTML = 'ReactBigCalendar library not loaded or Calendar component not found.'; return; }
            const React = window.React;
            const ReactDOM = window.ReactDOM;
            const moment = window.moment;
            if (!React || !ReactDOM || !moment) { mountElement.innerHTML = 'React, ReactDOM, or Moment.js not available globally.'; return; }
            libraryInstance.momentLocalizer(moment);
            const events = [
              { title: 'Sample Meeting', start: new Date(2024, 5, 20, 10, 0, 0), end: new Date(2024, 5, 20, 12, 0, 0), allDay: false },
            ];
            const calendarProps = {
              localizer: libraryInstance.momentLocalizer(moment),
              events: events,
              startAccessor: 'start',
              endAccessor: 'end',
              style: { height: 500 }
            };
            ReactDOM.render(React.createElement(libraryInstance.Calendar, calendarProps), mountElement);
          }`.replace(/^            /gm, '').trim()
        }
      },
      loadCalendarCss: {
        title: 'Load Calendar CSS',
        handler: CloudComponentModel.loadStyleHandler,
        params: { url: 'https://cdn.jsdelivr.net/npm/react-big-calendar@1.18.0/lib/css/react-big-calendar.css' }
      },
      loadLibrary: CloudComponentModel.defaultFlow.steps.loadLibrary,
      renderComponent: CloudComponentModel.defaultFlow.steps.renderComponent,
    }
  };

  static vueFlow = {
    key: 'vueFlow',
    title: 'Vue.js Example',
    steps: {
      setProps: {
        handler: CloudComponentModel.setFlowPropsHandler,
        params: {
          libraryUrl: 'https://unpkg.com/vue@3/dist/vue.global.prod.js',
          adapterCode: `(libraryInstance, mountElement, dynamicRequire) => {
            if (!libraryInstance || !libraryInstance.createApp) { mountElement.innerHTML = 'Vue library not loaded or createApp not found.'; return; }
            const Vue = libraryInstance;
            const app = Vue.createApp({
              template: '<div id="vue-app">{{ message }} <button @click="reset">Reset from Vue</button></div>',
              data() { return { message: 'Hello from Vue in Cloud Component!' }; },
              methods: { reset() { this.message = 'Reset successful (Vue)!'; } }
            });
            app.mount(mountElement);
          }`.replace(/^            /gm, '').trim()
        }
      },
      loadLibrary: CloudComponentModel.defaultFlow.steps.loadLibrary,
      renderComponent: CloudComponentModel.defaultFlow.steps.renderComponent,
    }
  };

  static flows = {
    default: CloudComponentModel.defaultFlow,
    echarts: CloudComponentModel.echartsFlow,
    reactBigCalendar: CloudComponentModel.reactBigCalendarFlow,
    vue: CloudComponentModel.vueFlow,
  };
}

const CloudComponentDemo = () => {
  const model = useFlowModel<CloudComponentModel>('cloud-component-demo', 'CloudComponentModel');
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Initialize state from model's default props
  const [adapterCode, setAdapterCode] = useState(model.props.adapterCode);
  const [libraryUrl, setLibraryUrl] = useState(model.props.libraryUrl);
  const [selectedFlowKey, setSelectedFlowKey] = useState('default');

  const handleFlowSelection = (value) => {
    setSelectedFlowKey(value);
    if (value === 'default') {
      // When switching to default, restore the initial model props (ECharts example) to UI
      // Or, one might prefer to keep the last entered custom values.
      // For this implementation, we revert to the model's initially configured props.
      setAdapterCode(model.props.adapterCode);
      setLibraryUrl(model.props.libraryUrl);
    } else {
      const selectedFlowDefinition = CloudComponentModel.flows[value];
      if (selectedFlowDefinition?.steps?.setProps?.params) {
        const params = selectedFlowDefinition.steps.setProps.params;
        setLibraryUrl(params.libraryUrl || '');
        setAdapterCode(params.adapterCode || '');
      }
    }
  };

  const handleLoadAndRender = () => {
    if (selectedFlowKey === 'default') {
      // For default flow, ensure the model's props are updated from the UI state
      // before the flow execution.
      model.setProps({
        adapterCode,
        libraryUrl,
      });
      console.log('Applying default flow with UI props:', { adapterCode, libraryUrl });
    } else {
      // For preset flows, setFlowPropsHandler within the flow will set the props.
      // The UI (adapterCode, libraryUrl states) has already been updated by handleFlowSelection.
      console.log(`Applying preset flow: ${selectedFlowKey}.`);
    }
    model.applyFlow(selectedFlowKey, { elementRef });
  };

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.innerHTML = 'External component will be loaded here.';
    }
  }, []);

  return (
    <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 5 }}>
      <h2>Cloud Component Loader</h2>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="flowSelection" style={{ marginRight: 5 }}>Select Flow:</label>
        <Select
          id="flowSelection"
          value={selectedFlowKey}
          style={{ width: 250, marginRight: 10 }}
          onChange={handleFlowSelection}
          options={[
            { value: 'default', label: 'Default (Custom)' },
            { value: 'echarts', label: 'ECharts Example' },
            { value: 'reactBigCalendar', label: 'React Big Calendar Example' },
            { value: 'vue', label: 'Vue.js Example' },
          ]}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="libraryUrl" style={{ marginRight: 5 }}>Library URL:</label>
        <input
          id="libraryUrl"
          type="text"
          value={libraryUrl}
          onChange={(e) => setLibraryUrl(e.target.value)}
          placeholder="Enter library URL (e.g., UMD)"
          style={{ width: 'calc(100% - 100px)', padding: '5px' }}
          readOnly={selectedFlowKey !== 'default'}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="adapterCode" style={{ display: 'block', marginBottom: 5 }}>Adapter JS Code:</label>
        <textarea
          id="adapterCode"
          value={adapterCode}
          onChange={(e) => setAdapterCode(e.target.value)}
          rows={10}
          style={{ width: '100%', padding: '5px', fontFamily: 'monospace' }}
          placeholder={'// Example: (library, element, require) => { \n//   const myLib = require("myLibNameInUMD"); \n//   element.innerHTML = "Loaded: " + myLib.version; \n// }'}
          readOnly={selectedFlowKey !== 'default'}
        />
      </div>
      <Button type="primary" onClick={handleLoadAndRender}>
        Load and Render Component
      </Button>
      <div
        ref={elementRef}
        style={{ marginTop: 20, padding: 10, border: '1px dashed #ccc', minHeight: 100 }}
      >
        {/* External component will be rendered here */}
      </div>
    </div>
  );
};

// Plugin and App registration (remains unchanged)
class DemoPlugin extends Plugin {
  async load() {
    this.app.flowEngine.registerModelClass('CloudComponentModel', CloudComponentModel);
    this.app.router.add('cloud-component-demo-route', {
      path: '/cloud-component-demo',
      Component: CloudComponentDemo
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/cloud-component-demo'] },
  plugins: [DemoPlugin],
});

export default app.getRootComponent();
