import React, { useRef, useEffect } from 'react';
import { BlockModel, FlowContext, FlowModel, withFlowModel, FlowsSettings } from '@nocobase/flow-engine';
import { Plugin } from '@nocobase/client';

// Mock dataset for the resource step
const mockDataset = {
  source: [
    ['product', '2015', '2016', '2017'],
    ['Matcha Latte', 43.3, 85.8, 93.7],
    ['Milk Tea', 83.1, 73.4, 55.1],
    ['Cheese Cocoa', 86.4, 65.2, 82.5],
    ['Walnut Brownie', 72.4, 53.9, 39.1]
  ]
};

export class CloudComponentModel extends BlockModel {
  constructor(data: any) {
    super(data);

    this.flows.echartsFlow = {
      key: 'echartsFlow',
      name: 'ECharts Rendering Flow',
      steps: {
        require: {
          key: 'require',
          use: 'require',
          params: { path: 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js' },
          downstream: ['resource'],
        },
        resource: {
          key: 'resource',
          use: async (ctx, model, params) => {
            // In a real scenario, this would be an API call
            // For now, we simulate a delay and return mock data
            console.log('CloudComponentModel: resource step - fetching data for', params.url);
            await new Promise(resolve => setTimeout(resolve, 500));
            // Mocking the getData() structure
            return {
              data: mockDataset,
              getData: () => mockDataset
            };
          },
          params: { url: '/api/dataset' }, // This can be a mock or placeholder
          downstream: ['handler'],
        },
        handler: {
          key: 'handler',
          use: (ctx: FlowContext, model: FlowModel, params: any) => {
            const echarts = ctx.dependencies?.echarts; // require plugin usually puts it here
            const resourceData = ctx.steps.resource.getData(); // Accessing data from the resource step

            if (!ctx.elementRef?.current) {
              console.error('CloudComponentModel: handler step - elementRef is not available.');
              return;
            }

            if (!echarts) {
              console.error('CloudComponentModel: handler step - ECharts library not loaded.');
              return;
            }
            
            console.log('CloudComponentModel: handler step - initializing ECharts with params:', params, 'and dataset:', resourceData);

            const chart = echarts.init(ctx.elementRef.current);
            chart.setOption({ ...params, dataset: resourceData });

            // Optional: Resize chart with window
            const resizeObserver = new ResizeObserver(() => {
              chart.resize();
            });
            resizeObserver.observe(ctx.elementRef.current);

            // Cleanup on unmount or re-render
            return () => {
              resizeObserver.disconnect();
              chart.dispose();
            };
          },
          // Default params for this step, can be overridden by instance configuration
          params: {
            title: {
              text: 'ECharts 示例柱状图'
            },
            tooltip: {},
            legend: {
              data: ['销量']
            },
            xAxis: {
              data: ['衬衫','羊毛衫','雪纺衫','裤子','高跟鞋','袜子']
            },
            yAxis: {},
            series: [{
              name: '销量',
              type: 'bar',
              data: [5, 20, 36, 10, 10, 20]
            }]
          }
        },
      },
    };

    this.flows.calendarFlow = {
      key: 'calendarFlow',
      name: 'Calendar Example',
      // autoApply: false, // Example, can be set as needed
      steps: {
        loadMoment: {
          key: 'loadMoment',
          use: 'require',
          params: { path: 'https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js' },
          title: 'Load Moment.js',
          downstream: ['loadCalendar'],
        },
        loadCalendar: {
          key: 'loadCalendar',
          use: 'require',
          params: { path: 'https://cdn.jsdelivr.net/npm/react-big-calendar@1.18.0/dist/react-big-calendar.min.js' },
          title: 'Load Calendar Component',
          downstream: ['setTheme'],
        },
        setTheme: {
          key: 'setTheme',
          use: 'styleLink', // This action might need to be custom defined in FlowEngine
          params: { path: 'https://cdn.jsdelivr.net/npm/react-big-calendar@1.18.0/lib/css/react-big-calendar.css' },
          title: 'Load Calendar Style',
          downstream: ['renderCalendar'],
        },
        renderCalendar: {
          key: 'renderCalendar',
          title: 'Render Calendar',
          uiSchema: {}, // For potential future configuration options
          use: (ctx: FlowContext, model: FlowModel, params: any) => {
            if (!ctx.elementRef?.current) {
              console.error('CalendarFlow: elementRef not available.');
              return;
            }
            ctx.elementRef.current.innerHTML = ''; // Clear previous content

            const moment = ctx.dependencies.loadMoment;
            const BigReactCalendar = ctx.dependencies.loadCalendar;

            if (!moment || !BigReactCalendar) {
              console.error('CalendarFlow: Moment.js or React Big Calendar not loaded.');
              return;
            }

            const localizer = BigReactCalendar.momentLocalizer(moment);
            const events = params.events || [
              { title: 'Default Event 1', start: new Date(), end: new Date(new Date().setDate(new Date().getDate() + 1)) },
              { title: 'Default Event 2', start: new Date(new Date().setDate(new Date().getDate() + 2)), end: new Date(new Date().setDate(new Date().getDate() + 3)) }
            ];
            
            console.log('CalendarFlow: Rendering calendar with params:', params, 'and events:', events);

            const calendarElement = ctx.React.createElement(BigReactCalendar, { ...params, events, localizer });
            const root = ctx.createRoot(ctx.elementRef.current); // Assumes ctx.createRoot is provided
            root.render(calendarElement);

            return () => { // Cleanup function
              root.unmount();
              console.log('CalendarFlow: Calendar unmounted.');
            };
          },
          params: { // Default params for this step
            startAccessor: 'start',
            endAccessor: 'end',
            style: { height: '500px', border: '1px solid #ddd' },
            // events can be overridden by instance configuration
          },
        },
      },
    };

    this.flows.vueFlow = {
      key: 'vueFlow',
      name: 'Vue Example',
      // autoApply: false, // Example
      steps: {
        loadVue: {
          key: 'loadVue',
          use: 'require',
          params: { path: 'https://unpkg.com/vue@3/dist/vue.global.prod.js' },
          title: 'Load Vue',
          downstream: ['renderVueApp'],
        },
        renderVueApp: {
          key: 'renderVueApp',
          title: 'Render Vue App',
          uiSchema: {},
          use: (ctx: FlowContext, model: FlowModel, params: any) => {
            if (!ctx.elementRef?.current) {
              console.error('VueFlow: elementRef not available.');
              return;
            }
            ctx.elementRef.current.innerHTML = ''; // Clear previous content

            const Vue = ctx.dependencies.loadVue;
            if (!Vue) {
              console.error('VueFlow: Vue library not loaded.');
              return;
            }

            console.log('VueFlow: Rendering Vue app with params:', params);
            let vueAppInstance: any; // To store the Vue app instance for unmounting

            try {
              vueAppInstance = Vue.createApp({
                template: params.template,
                data() {
                  return {
                    message: params.initialMessage || 'Hello from Vue!',
                  };
                },
                methods: {
                  reset() {
                    this.message = params.initialMessage || 'Hello from Vue!';
                    console.log('VueFlow: Message reset.');
                  },
                  updateMessage(newMessage: string) {
                    this.message = newMessage;
                  }
                },
                mounted() {
                  console.log('VueFlow: Vue app mounted.');
                }
              });
              vueAppInstance.mount(ctx.elementRef.current);
            } catch (error) {
              console.error('VueFlow: Error creating or mounting Vue app:', error);
              ctx.elementRef.current.innerHTML = '<p style="color: red;">Error loading Vue component. See console.</p>';
            }
            
            return () => { // Cleanup function
              if (vueAppInstance) {
                vueAppInstance.unmount();
                console.log('VueFlow: Vue app unmounted.');
              }
            };
          },
          params: { // Default params for this step
            template: `
              <div style="padding: 10px; border: 1px solid #ccc;">
                <h3>Vue Component</h3>
                <p>{{ message }}</p>
                <input v-model="message" placeholder="Edit message" />
                <button @click="reset">Reset Message</button>
              </div>
            `.trim(),
            initialMessage: 'Welcome to this Vue-powered component!',
          },
        },
      },
    };

    // Example of how stepParams might be passed during instantiation
    // This part is usually handled by the rendering engine or higher-level components
    if (data?.stepParams) {
      data.stepParams.forEach((sp: any) => {
        if (this.flows[sp.flowKey]?.steps[sp.stepKey]) {
          this.flows[sp.flowKey].steps[sp.stepKey].params = {
            ...this.flows[sp.flowKey].steps[sp.stepKey].params,
            ...sp.params,
          };
        }
      });
    }
  }

  // Optionally, a method to get a specific flow
  public getFlow(key: string): FlowModel | undefined {
    return this.flows[key];
  }
}

// Example of how to instantiate the model with specific step parameters
// This would typically be done elsewhere in the application
/*
const modelInstance = new CloudComponentModel({
  stepParams: [
    {
      flowKey: 'echartsFlow',
      stepKey: 'handler',
      params: {
        title: {
          text: 'ECharts 示例柱状图 (Instance Specific)'
        },
        tooltip: {},
        legend: {
          data: ['销量']
        },
        xAxis: {
          data: ['衬衫','羊毛衫','雪纺衫','裤子','高跟鞋','袜子']
        },
        yAxis: {},
        series: [{
          name: '销量',
          type: 'bar',
          // Data can also be overridden if needed, though typically it comes from 'resource'
          // data: [5, 20, 36, 10, 10, 20] 
        }]
      },
    },
  ]
});
*/

export { CloudComponentModel }; // Exporting the class itself

const CloudComponentView = ({ model, defaultFlowKey = 'echartsFlow' }: { model: CloudComponentModel, defaultFlowKey?: string }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (model && defaultFlowKey && elementRef.current) {
      console.log(`CloudComponentView: Applying flow ${defaultFlowKey} to model`, model);
      const cleanup = model.applyFlow(defaultFlowKey, { elementRef });

      // Return cleanup function if applyFlow provides one
      return () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    } else {
      console.warn('CloudComponentView: Model, defaultFlowKey, or elementRef not available.', { model, defaultFlowKey, elementRef: elementRef.current });
    }
  }, [model, defaultFlowKey]); // elementRef.current itself should not be a dependency as its identity doesn't change

  // Added some basic styling for visibility and to ensure it has dimensions
  return <div ref={elementRef} style={{ minHeight: '300px', minWidth: '400px', border: '1px solid #eee', padding: '10px' }} />;
};

export const CloudComponent = withFlowModel(CloudComponentView, {
  label: 'Cloud Component', // A label for UI purposes
  // Assuming CloudComponentModel is the model class to be instantiated
  modelClass: CloudComponentModel, 
  settings: {
    // Component for configuring the flow settings in a UI (optional)
    component: FlowsSettings, 
    props: {
      expandAll: true, // Example prop for FlowsSettings
    },
  },
  // Default data to instantiate the model if none is provided
  defaultData: { 
    defaultFlowKey: 'echartsFlow' // Ensure this matches a flow in CloudComponentModel
    // `data` and `stepParams` can also be set here if needed for the component's default state
  }
});

export class CloudBlockPlugin extends Plugin {
  async load() {
    // Register the model class with the flow engine
    this.app.flowEngine.registerModelClass('CloudComponentModel', CloudComponentModel);
    
    // Register the component with the application's component system
    // This makes <CloudComponent /> usable in NocoBase's UI builder or schema
    this.app.components.add('CloudComponent', CloudComponent);

    // No more demo-specific routes
    // this.app.router.add('root', { path: '/', Component: Demo });
  }
}

// No default export for a plugin file, it exports named classes/components.
// The `Demo` component and `app` instance have been removed.
