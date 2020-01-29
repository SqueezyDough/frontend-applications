
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    /**
     * Derived value store by synchronizing one or more readable stores and
     * applying an aggregation function over its input values.
     * @param {Stores} stores input stores
     * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
     * @param {*=}initial_value when used asynchronously
     */
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.12.1 */

    function create_fragment(ctx) {
    	var current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $base, $location, $routes;

    	

      let { basepath = "/", url = null } = $$props;

      const locationContext = getContext(LOCATION);
      const routerContext = getContext(ROUTER);

      const routes = writable([]); validate_store(routes, 'routes'); component_subscribe($$self, routes, $$value => { $routes = $$value; $$invalidate('$routes', $routes); });
      const activeRoute = writable(null);
      let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

      // If locationContext is not set, this is the topmost Router in the tree.
      // If the `url` prop is given we force the location to it.
      const location =
        locationContext ||
        writable(url ? { pathname: url } : globalHistory.location); validate_store(location, 'location'); component_subscribe($$self, location, $$value => { $location = $$value; $$invalidate('$location', $location); });

      // If routerContext is set, the routerBase of the parent Router
      // will be the base for this Router's descendants.
      // If routerContext is not set, the path and resolved uri will both
      // have the value of the basepath prop.
      const base = routerContext
        ? routerContext.routerBase
        : writable({
            path: basepath,
            uri: basepath
          }); validate_store(base, 'base'); component_subscribe($$self, base, $$value => { $base = $$value; $$invalidate('$base', $base); });

      const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
        // If there is no activeRoute, the routerBase will be identical to the base.
        if (activeRoute === null) {
          return base;
        }

        const { path: basepath } = base;
        const { route, uri } = activeRoute;
        // Remove the potential /* or /*splatname from
        // the end of the child Routes relative paths.
        const path = route.default ? basepath : route.path.replace(/\*.*$/, "");

        return { path, uri };
      });

      function registerRoute(route) {
        const { path: basepath } = $base;
        let { path } = route;

        // We store the original path in the _path property so we can reuse
        // it when the basepath changes. The only thing that matters is that
        // the route reference is intact, so mutation is fine.
        route._path = path;
        route.path = combinePaths(basepath, path);

        if (typeof window === "undefined") {
          // In SSR we should set the activeRoute immediately if it is a match.
          // If there are more Routes being registered after a match is found,
          // we just skip them.
          if (hasActiveRoute) {
            return;
          }

          const matchingRoute = match(route, $location.pathname);
          if (matchingRoute) {
            activeRoute.set(matchingRoute);
            hasActiveRoute = true;
          }
        } else {
          routes.update(rs => {
            rs.push(route);
            return rs;
          });
        }
      }

      function unregisterRoute(route) {
        routes.update(rs => {
          const index = rs.indexOf(route);
          rs.splice(index, 1);
          return rs;
        });
      }

      if (!locationContext) {
        // The topmost Router in the tree is responsible for updating
        // the location store and supplying it through context.
        onMount(() => {
          const unlisten = globalHistory.listen(history => {
            location.set(history.location);
          });

          return unlisten;
        });

        setContext(LOCATION, location);
      }

      setContext(ROUTER, {
        activeRoute,
        base,
        routerBase,
        registerRoute,
        unregisterRoute
      });

    	const writable_props = ['basepath', 'url'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('basepath' in $$props) $$invalidate('basepath', basepath = $$props.basepath);
    		if ('url' in $$props) $$invalidate('url', url = $$props.url);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { basepath, url, hasActiveRoute, $base, $location, $routes };
    	};

    	$$self.$inject_state = $$props => {
    		if ('basepath' in $$props) $$invalidate('basepath', basepath = $$props.basepath);
    		if ('url' in $$props) $$invalidate('url', url = $$props.url);
    		if ('hasActiveRoute' in $$props) hasActiveRoute = $$props.hasActiveRoute;
    		if ('$base' in $$props) base.set($base);
    		if ('$location' in $$props) location.set($location);
    		if ('$routes' in $$props) routes.set($routes);
    	};

    	$$self.$$.update = ($$dirty = { $base: 1, $routes: 1, $location: 1 }) => {
    		if ($$dirty.$base) { {
            const { path: basepath } = $base;
            routes.update(rs => {
              rs.forEach(r => (r.path = combinePaths(basepath, r._path)));
              return rs;
            });
          } }
    		if ($$dirty.$routes || $$dirty.$location) { {
            const bestMatch = pick($routes, $location.pathname);
            activeRoute.set(bestMatch);
          } }
    	};

    	return {
    		basepath,
    		url,
    		routes,
    		location,
    		base,
    		$$slots,
    		$$scope
    	};
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["basepath", "url"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Router", options, id: create_fragment.name });
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.12.1 */

    const get_default_slot_changes = ({ routeParams, $location }) => ({ params: routeParams, location: $location });
    const get_default_slot_context = ({ routeParams, $location }) => ({
    	params: routeParams,
    	location: $location
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block_1,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.component !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}", ctx });
    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	var current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && (changed.$$scope || changed.routeParams || changed.$location)) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, get_default_slot_changes),
    					get_slot_context(default_slot_template, ctx, get_default_slot_context)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(43:2) {:else}", ctx });
    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	var switch_instance_anchor, current;

    	var switch_instance_spread_levels = [
    		{ location: ctx.$location },
    		ctx.routeParams,
    		ctx.routeProps
    	];

    	var switch_value = ctx.component;

    	function switch_props(ctx) {
    		let switch_instance_props = {};
    		for (var i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}
    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switch_instance_changes = (changed.$location || changed.routeParams || changed.routeProps) ? get_spread_update(switch_instance_spread_levels, [
    									(changed.$location) && { location: ctx.$location },
    			(changed.routeParams) && get_spread_object(ctx.routeParams),
    			(changed.routeProps) && get_spread_object(ctx.routeProps)
    								]) : {};

    			if (switch_value !== (switch_value = ctx.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}

    			else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(41:2) {#if component !== null}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.$activeRoute !== null && ctx.$activeRoute.route === ctx.route) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.$activeRoute !== null && ctx.$activeRoute.route === ctx.route) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $activeRoute, $location;

    	

      let { path = "", component = null } = $$props;

      const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER); validate_store(activeRoute, 'activeRoute'); component_subscribe($$self, activeRoute, $$value => { $activeRoute = $$value; $$invalidate('$activeRoute', $activeRoute); });
      const location = getContext(LOCATION); validate_store(location, 'location'); component_subscribe($$self, location, $$value => { $location = $$value; $$invalidate('$location', $location); });

      const route = {
        path,
        // If no path prop is given, this Route will act as the default Route
        // that is rendered if no other Route in the Router is a match.
        default: path === ""
      };
      let routeParams = {};
      let routeProps = {};

      registerRoute(route);

      // There is no need to unregister Routes in SSR since it will all be
      // thrown away anyway.
      if (typeof window !== "undefined") {
        onDestroy(() => {
          unregisterRoute(route);
        });
      }

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('path' in $$new_props) $$invalidate('path', path = $$new_props.path);
    		if ('component' in $$new_props) $$invalidate('component', component = $$new_props.component);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { path, component, routeParams, routeProps, $activeRoute, $location };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('path' in $$props) $$invalidate('path', path = $$new_props.path);
    		if ('component' in $$props) $$invalidate('component', component = $$new_props.component);
    		if ('routeParams' in $$props) $$invalidate('routeParams', routeParams = $$new_props.routeParams);
    		if ('routeProps' in $$props) $$invalidate('routeProps', routeProps = $$new_props.routeProps);
    		if ('$activeRoute' in $$props) activeRoute.set($activeRoute);
    		if ('$location' in $$props) location.set($location);
    	};

    	$$self.$$.update = ($$dirty = { $activeRoute: 1, $$props: 1 }) => {
    		if ($$dirty.$activeRoute) { if ($activeRoute && $activeRoute.route === route) {
            $$invalidate('routeParams', routeParams = $activeRoute.params);
          } }
    		{
            const { path, component, ...rest } = $$props;
            $$invalidate('routeProps', routeProps = rest);
          }
    	};

    	return {
    		path,
    		component,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["path", "component"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Route", options, id: create_fragment$1.name });
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var persist = (name, value) => {
      const stored = localStorage.getItem(name);
      value = writable(!stored ? value : JSON.parse(stored));
      value.subscribe(value => {
        if (value !== undefined) localStorage.setItem(name, JSON.stringify(value));
      });
      return value
    };

    /* src/components/Card.svelte generated by Svelte v3.12.1 */

    const file = "src/components/Card.svelte";

    function create_fragment$2(ctx) {
    	var article, img, img_src_value, t0, footer, h3, t1_value = ctx.data.title.value + "", t1, t2, span, t3_value = ctx.data.result.value + "", t3;

    	const block = {
    		c: function create() {
    			article = element("article");
    			img = element("img");
    			t0 = space();
    			footer = element("footer");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			span = element("span");
    			t3 = text(t3_value);
    			attr_dev(img, "class", "card__image svelte-c0cnt3");
    			attr_dev(img, "height", "200px");
    			attr_dev(img, "src", img_src_value = ctx.data.image.value);
    			attr_dev(img, "alt", "");
    			add_location(img, file, 79, 4, 1565);
    			attr_dev(h3, "class", "card__title svelte-c0cnt3");
    			add_location(h3, file, 81, 8, 1678);
    			attr_dev(span, "class", "card__uri svelte-c0cnt3");
    			add_location(span, file, 82, 8, 1734);
    			attr_dev(footer, "class", "card__footer svelte-c0cnt3");
    			add_location(footer, file, 80, 4, 1640);
    			attr_dev(article, "class", "card svelte-c0cnt3");
    			add_location(article, file, 78, 0, 1538);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, img);
    			append_dev(article, t0);
    			append_dev(article, footer);
    			append_dev(footer, h3);
    			append_dev(h3, t1);
    			append_dev(footer, t2);
    			append_dev(footer, span);
    			append_dev(span, t3);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.data) && img_src_value !== (img_src_value = ctx.data.image.value)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((changed.data) && t1_value !== (t1_value = ctx.data.title.value + "")) {
    				set_data_dev(t1, t1_value);
    			}

    			if ((changed.data) && t3_value !== (t3_value = ctx.data.result.value + "")) {
    				set_data_dev(t3, t3_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(article);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { data } = $$props;

    	const writable_props = ['data'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { data };
    	};

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    	};

    	return { data };
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["data"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Card", options, id: create_fragment$2.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.data === undefined && !('data' in props)) {
    			console.warn("<Card> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/routes/Home.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.data = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.region = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.uniqueName = list[i];
    	return child_ctx;
    }

    // (176:12) {#each uniqueRegionNames as uniqueName}
    function create_each_block_2(ctx) {
    	var li, a, t_value = ctx.uniqueName + "", t, a_href_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "#" + ctx.uniqueName);
    			attr_dev(a, "class", "svelte-1wo3w9b");
    			add_location(a, file$1, 176, 20, 4403);
    			attr_dev(li, "class", "svelte-1wo3w9b");
    			add_location(li, file$1, 176, 16, 4399);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.uniqueRegionNames) && t_value !== (t_value = ctx.uniqueName + "")) {
    				set_data_dev(t, t_value);
    			}

    			if ((changed.uniqueRegionNames) && a_href_value !== (a_href_value = "#" + ctx.uniqueName)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_2.name, type: "each", source: "(176:12) {#each uniqueRegionNames as uniqueName}", ctx });
    	return block;
    }

    // (183:8) {#if $text}
    function create_if_block$1(ctx) {
    	var a, label, t1, span, t2;

    	const block = {
    		c: function create() {
    			a = element("a");
    			label = element("label");
    			label.textContent = "Termmaster url";
    			t1 = space();
    			span = element("span");
    			t2 = text(ctx.$text);
    			attr_dev(label, "class", "svelte-1wo3w9b");
    			add_location(label, file$1, 184, 12, 4617);
    			add_location(span, file$1, 185, 12, 4659);
    			attr_dev(a, "href", ctx.$text);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "termmaster-uri svelte-1wo3w9b");
    			add_location(a, file$1, 183, 8, 4547);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, label);
    			append_dev(a, t1);
    			append_dev(a, span);
    			append_dev(span, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.$text) {
    				set_data_dev(t2, ctx.$text);
    				attr_dev(a, "href", ctx.$text);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(a);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(183:8) {#if $text}", ctx });
    	return block;
    }

    // (201:20) {:else}
    function create_else_block$1(ctx) {
    	var span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "loading");
    			add_location(span, file$1, 201, 24, 5271);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(span);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$1.name, type: "else", source: "(201:20) {:else}", ctx });
    	return block;
    }

    // (196:16) {#each region.items as data}
    function create_each_block_1(ctx) {
    	var button, current, dispose;

    	var card = new Card({
    		props: {
    		class: "cards-container__card",
    		data: ctx.data
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			button = element("button");
    			card.$$.fragment.c();
    			attr_dev(button, "class", "cards-container__cards-btn svelte-1wo3w9b");
    			add_location(button, file$1, 196, 20, 4996);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			mount_component(card, button, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var card_changes = {};
    			if (changed.regions) card_changes.data = ctx.data;
    			card.$set(card_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			destroy_component(card);

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_1.name, type: "each", source: "(196:16) {#each region.items as data}", ctx });
    	return block;
    }

    // (192:8) {#each regions as region}
    function create_each_block(ctx) {
    	var section, h2, t0_value = ctx.region.name + "", t0, t1, t2, section_id_value, current;

    	let each_value_1 = ctx.region.items;

    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value_1.length) {
    		each_1_else = create_else_block$1(ctx);
    		each_1_else.c();
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(h2, "class", "cards-container__header svelte-1wo3w9b");
    			add_location(h2, file$1, 193, 16, 4875);
    			attr_dev(section, "id", section_id_value = ctx.region.name);
    			attr_dev(section, "class", "cards-container svelte-1wo3w9b");
    			add_location(section, file$1, 192, 12, 4806);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(section, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(section, null);
    			}

    			append_dev(section, t2);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.regions) && t0_value !== (t0_value = ctx.region.name + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if (changed.regions) {
    				each_value_1 = ctx.region.items;

    				let i;
    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section, t2);
    					}
    				}

    				group_outros();
    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}

    			if (each_value_1.length) {
    				if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			} else if (!each_1_else) {
    				each_1_else = create_else_block$1(ctx);
    				each_1_else.c();
    				each_1_else.m(section, t2);
    			}

    			if ((!current || changed.regions) && section_id_value !== (section_id_value = ctx.region.name)) {
    				attr_dev(section, "id", section_id_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(section);
    			}

    			destroy_each(each_blocks, detaching);

    			if (each_1_else) each_1_else.d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(192:8) {#each regions as region}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
    	var div, header, img, t0, h1, t2, section, h2, t4, p0, t6, p1, t8, nav, ul, t9, main, t10, input, t11, current, dispose;

    	let each_value_2 = ctx.uniqueRegionNames;

    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	var if_block = (ctx.$text) && create_if_block$1(ctx);

    	let each_value = ctx.regions;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			header = element("header");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Asian Deities";
    			t2 = space();
    			section = element("section");
    			h2 = element("h2");
    			h2.textContent = "Asian Deities from the collection of the NMVW";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "Travelers from non-Asian cultures who travel to Asia often see Gods statues unknown to them.\n            In Asian theology (both Buddhism and Hinduism) there are many diffent deities each with their own\n            human or non-human form. Most tourists identify these simply as Buddha, but this is often false.";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "I want to inform people about Asian theology using the rich collection from the Dutch National\n            Museum of World Cultures (NMVW). I'm using the Svelte framework to achieve this.";
    			t8 = space();
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t9 = space();
    			main = element("main");
    			if (if_block) if_block.c();
    			t10 = space();
    			input = element("input");
    			t11 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(img, "class", "header__img svelte-1wo3w9b");
    			attr_dev(img, "src", "./images/nmvw.png");
    			attr_dev(img, "alt", "nmvw");
    			add_location(img, file$1, 156, 8, 3437);
    			attr_dev(h1, "class", "header__title svelte-1wo3w9b");
    			add_location(h1, file$1, 157, 8, 3506);
    			attr_dev(header, "class", "header svelte-1wo3w9b");
    			add_location(header, file$1, 155, 4, 3405);
    			attr_dev(h2, "class", "svelte-1wo3w9b");
    			add_location(h2, file$1, 161, 8, 3602);
    			attr_dev(p0, "class", "intro__text svelte-1wo3w9b");
    			add_location(p0, file$1, 162, 8, 3665);
    			attr_dev(p1, "class", "intro__text svelte-1wo3w9b");
    			add_location(p1, file$1, 167, 8, 4034);
    			attr_dev(section, "class", "intro svelte-1wo3w9b");
    			add_location(section, file$1, 160, 4, 3570);
    			attr_dev(ul, "class", "svelte-1wo3w9b");
    			add_location(ul, file$1, 174, 8, 4326);
    			attr_dev(nav, "class", "regions-list svelte-1wo3w9b");
    			add_location(nav, file$1, 173, 4, 4291);
    			attr_dev(input, "type", "hidden");
    			add_location(input, file$1, 188, 8, 4715);
    			attr_dev(main, "class", "main");
    			add_location(main, file$1, 181, 4, 4499);
    			attr_dev(div, "class", "wrapper svelte-1wo3w9b");
    			add_location(div, file$1, 154, 0, 3379);
    			dispose = listen_dev(input, "input", ctx.input_input_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, header);
    			append_dev(header, img);
    			append_dev(header, t0);
    			append_dev(header, h1);
    			append_dev(div, t2);
    			append_dev(div, section);
    			append_dev(section, h2);
    			append_dev(section, t4);
    			append_dev(section, p0);
    			append_dev(section, t6);
    			append_dev(section, p1);
    			append_dev(div, t8);
    			append_dev(div, nav);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			append_dev(div, t9);
    			append_dev(div, main);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t10);
    			append_dev(main, input);

    			set_input_value(input, ctx.$text);

    			append_dev(main, t11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.uniqueRegionNames) {
    				each_value_2 = ctx.uniqueRegionNames;

    				let i;
    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_2.length;
    			}

    			if (ctx.$text) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(main, t10);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (changed.$text) set_input_value(input, ctx.$text);

    			if (changed.regions) {
    				each_value = ctx.regions;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_each(each_blocks_1, detaching);

    			if (if_block) if_block.d();

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $text;

    	
        let { results } = $$props;

        const text = persist('text', ''); validate_store(text, 'text'); component_subscribe($$self, text, $$value => { $text = $$value; $$invalidate('$text', $text); });

    	const writable_props = ['results'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		text.set(this.value);
    	}

    	const click_handler = (event) => (set_store_value(text, $text = event.target.querySelector('span').textContent));

    	$$self.$set = $$props => {
    		if ('results' in $$props) $$invalidate('results', results = $$props.results);
    	};

    	$$self.$capture_state = () => {
    		return { results, regionNames, uniqueRegionNames, regions, $text };
    	};

    	$$self.$inject_state = $$props => {
    		if ('results' in $$props) $$invalidate('results', results = $$props.results);
    		if ('regionNames' in $$props) $$invalidate('regionNames', regionNames = $$props.regionNames);
    		if ('uniqueRegionNames' in $$props) $$invalidate('uniqueRegionNames', uniqueRegionNames = $$props.uniqueRegionNames);
    		if ('regions' in $$props) $$invalidate('regions', regions = $$props.regions);
    		if ('$text' in $$props) text.set($text);
    	};

    	let regionNames, uniqueRegionNames, regions;

    	$$self.$$.update = ($$dirty = { results: 1, regionNames: 1, uniqueRegionNames: 1 }) => {
    		if ($$dirty.results) { $$invalidate('regionNames', regionNames = results.map( item => item.placeName.value )); }
    		if ($$dirty.regionNames) { $$invalidate('uniqueRegionNames', uniqueRegionNames = [...new Set(regionNames)]); }
    		if ($$dirty.uniqueRegionNames || $$dirty.results) { $$invalidate('regions', regions = uniqueRegionNames.map( regionName => {
                // console.log(regionName)
                const region = {
                    name : regionName,
                    items : []
                };
        
                const regionItems = results.forEach( regionItem => {
        
                    if (regionItem.placeName.value === regionName) {
                        region.items.push(regionItem);
                    }
                });
        
                return region;
            })); }
    	};

    	return {
    		results,
    		text,
    		uniqueRegionNames,
    		regions,
    		$text,
    		input_input_handler,
    		click_handler
    	};
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["results"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Home", options, id: create_fragment$3.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.results === undefined && !('results' in props)) {
    			console.warn("<Home> was created without expected prop 'results'");
    		}
    	}

    	get results() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set results(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Region.svelte generated by Svelte v3.12.1 */
    const { console: console_1 } = globals;

    const file$2 = "src/routes/Region.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.data = list[i];
    	return child_ctx;
    }

    // (75:8) {:else}
    function create_else_block$2(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$2.name, type: "else", source: "(75:8) {:else}", ctx });
    	return block;
    }

    // (70:4) {#each resultsByRegion as data}
    function create_each_block$1(ctx) {
    	var li, t, current;

    	var card = new Card({
    		props: { data: ctx.data },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			li = element("li");
    			card.$$.fragment.c();
    			t = space();
    			attr_dev(li, "class", "svelte-73ewbe");
    			add_location(li, file$2, 70, 8, 1407);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(card, li, null);
    			append_dev(li, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var card_changes = {};
    			if (changed.resultsByRegion) card_changes.data = ctx.data;
    			card.$set(card_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}

    			destroy_component(card);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(70:4) {#each resultsByRegion as data}", ctx });
    	return block;
    }

    function create_fragment$4(ctx) {
    	var ul, current;

    	let each_value = ctx.resultsByRegion;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$2(ctx);
    		each_1_else.c();
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(ul, "class", "svelte-73ewbe");
    			add_location(ul, file$2, 68, 0, 1358);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.resultsByRegion) {
    				each_value = ctx.resultsByRegion;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}

    			if (each_value.length) {
    				if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			} else if (!each_1_else) {
    				each_1_else = create_else_block$2(ctx);
    				each_1_else.c();
    				each_1_else.m(ul, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);

    			if (each_1_else) each_1_else.d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { results, regionUri } = $$props;

        // add uri to url
        let url = `https://hdl.handle.net/20.500.11840/${regionUri}`;

    	const writable_props = ['results', 'regionUri'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Region> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('results' in $$props) $$invalidate('results', results = $$props.results);
    		if ('regionUri' in $$props) $$invalidate('regionUri', regionUri = $$props.regionUri);
    	};

    	$$self.$capture_state = () => {
    		return { results, regionUri, url, resultsByRegion };
    	};

    	$$self.$inject_state = $$props => {
    		if ('results' in $$props) $$invalidate('results', results = $$props.results);
    		if ('regionUri' in $$props) $$invalidate('regionUri', regionUri = $$props.regionUri);
    		if ('url' in $$props) $$invalidate('url', url = $$props.url);
    		if ('resultsByRegion' in $$props) $$invalidate('resultsByRegion', resultsByRegion = $$props.resultsByRegion);
    	};

    	let resultsByRegion;

    	$$self.$$.update = ($$dirty = { results: 1, url: 1 }) => {
    		if ($$dirty.results || $$dirty.url) { $$invalidate('resultsByRegion', resultsByRegion = results.filter( item => {
                console.log(item);
                return item.place.value === url;
            })); }
    	};

    	return { results, regionUri, resultsByRegion };
    }

    class Region extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["results", "regionUri"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Region", options, id: create_fragment$4.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.results === undefined && !('results' in props)) {
    			console_1.warn("<Region> was created without expected prop 'results'");
    		}
    		if (ctx.regionUri === undefined && !('regionUri' in props)) {
    			console_1.warn("<Region> was created without expected prop 'regionUri'");
    		}
    	}

    	get results() {
    		throw new Error("<Region>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set results(value) {
    		throw new Error("<Region>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get regionUri() {
    		throw new Error("<Region>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set regionUri(value) {
    		throw new Error("<Region>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fetchData() {
      const url ="https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-34/sparql";

      const query = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dc: <http://purl.org/dc/elements/1.1/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX edm: <http://www.europeana.eu/schemas/edm/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>

  SELECT distinct ?result ?title ?place ?placeName ?type ?image
  WHERE {
    <https://hdl.handle.net/20.500.11840/termmaster8401> skos:narrower* ?place .
    ?place skos:prefLabel ?placeName .

    VALUES ?type {"Godenbeeld" "godenbeeld"}
    ?result dc:title ?title ;
          dc:type ?type ;
            dct:spatial ?place ;
          edm:isShownBy ?image
  }
  ORDER BY ?result
  LIMIT 100
  `;

    // modified from lauren's example
    // return json from query
    function runQuery(url, query){
          return fetch(url+"?query="+ encodeURIComponent(query) +"&format=json")
            .then(res => res.json())
            .then(json => {
              return json.results.bindings;
          })
        }

        return runQuery(url, query)
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/App.svelte";

    // (36:4) <Route path="/region/:id" let:params>
    function create_default_slot_1(ctx) {
    	var current;

    	var region = new Region({
    		props: {
    		regionUri: ctx.params.id,
    		results: ctx.results
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			region.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(region, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var region_changes = {};
    			if (changed.params) region_changes.regionUri = ctx.params.id;
    			if (changed.results) region_changes.results = ctx.results;
    			region.$set(region_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(region.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(region.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(region, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(36:4) <Route path=\"/region/:id\" let:params>", ctx });
    	return block;
    }

    // (33:0) <Router>
    function create_default_slot(ctx) {
    	var div, t, current;

    	var route0 = new Route({
    		props: {
    		path: "/",
    		component: Home,
    		results: ctx.results
    	},
    		$$inline: true
    	});

    	var route1 = new Route({
    		props: {
    		path: "/region/:id",
    		$$slots: {
    		default: [create_default_slot_1, ({ params }) => ({ params })]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			route0.$$.fragment.c();
    			t = space();
    			route1.$$.fragment.c();
    			add_location(div, file$3, 33, 2, 1174);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(route0, div, null);
    			append_dev(div, t);
    			mount_component(route1, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var route0_changes = {};
    			if (changed.results) route0_changes.results = ctx.results;
    			route0.$set(route0_changes);

    			var route1_changes = {};
    			if (changed.$$scope || changed.results) route1_changes.$$scope = { changed, ctx };
    			route1.$set(route1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);

    			transition_in(route1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(route0);

    			destroy_component(route1);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(33:0) <Router>", ctx });
    	return block;
    }

    function create_fragment$5(ctx) {
    	var current;

    	var router = new Router({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			router.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var router_changes = {};
    			if (changed.$$scope || changed.results) router_changes.$$scope = { changed, ctx };
    			router.$set(router_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

      let results = [];

      onMount( async () => {
          // fetch all data
        let rawData = await fetchData();

        // all paths that give no image
        let filterNoImage = [
          "http://collectie.wereldculturen.nl/cc/imageproxy.ashx?server=localhost&port=17581&filename=images/Images/TM//tm-3317-1.jpg",
          "http://collectie.wereldculturen.nl/cc/imageproxy.ashx?server=localhost&port=17581&filename=images/Images/TM//tm-343-1b.jpg",
          "http://collectie.wereldculturen.nl/cc/imageproxy.ashx?server=localhost&port=17581&filename=images/Images/WM//002741.jpg"
        ];

        // only show data with actual names and images
        $$invalidate('results', results = rawData.filter( item => {
          return item.title.value
          !== "Godenbeeld" &&
          item.image.value !== filterNoImage[0] &&
          item.image.value !== filterNoImage[1] &&
          item.image.value !== filterNoImage[2]
        }));
      });

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('results' in $$props) $$invalidate('results', results = $$props.results);
    	};

    	return { results };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$5.name });
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
