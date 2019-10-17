
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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

    /* src/Greeting.svelte generated by Svelte v3.12.1 */

    const file = "src/Greeting.svelte";

    function create_fragment(ctx) {
    	var h2, t0, t1;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("Hello ");
    			t1 = text(ctx.name);
    			attr_dev(h2, "class", "svelte-186719g");
    			add_location(h2, file, 13, 0, 234);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.name) {
    				set_data_dev(t1, ctx.name);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h2);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { first_name, last_name } = $$props;

    	const writable_props = ['first_name', 'last_name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Greeting> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('first_name' in $$props) $$invalidate('first_name', first_name = $$props.first_name);
    		if ('last_name' in $$props) $$invalidate('last_name', last_name = $$props.last_name);
    	};

    	$$self.$capture_state = () => {
    		return { first_name, last_name, name };
    	};

    	$$self.$inject_state = $$props => {
    		if ('first_name' in $$props) $$invalidate('first_name', first_name = $$props.first_name);
    		if ('last_name' in $$props) $$invalidate('last_name', last_name = $$props.last_name);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	let name;

    	$$self.$$.update = ($$dirty = { first_name: 1, last_name: 1 }) => {
    		if ($$dirty.first_name || $$dirty.last_name) { $$invalidate('name', name = first_name + " " + last_name); }
    	};

    	return { first_name, last_name, name };
    }

    class Greeting extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["first_name", "last_name"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Greeting", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.first_name === undefined && !('first_name' in props)) {
    			console.warn("<Greeting> was created without expected prop 'first_name'");
    		}
    		if (ctx.last_name === undefined && !('last_name' in props)) {
    			console.warn("<Greeting> was created without expected prop 'last_name'");
    		}
    	}

    	get first_name() {
    		throw new Error("<Greeting>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set first_name(value) {
    		throw new Error("<Greeting>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get last_name() {
    		throw new Error("<Greeting>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set last_name(value) {
    		throw new Error("<Greeting>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/LogIn.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/LogIn.svelte";

    // (11:4) {:else}
    function create_else_block(ctx) {
    	var button, dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Log in";
    			add_location(button, file$1, 11, 4, 222);
    			dispose = listen_dev(button, "click", ctx.toggle);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(11:4) {:else}", ctx });
    	return block;
    }

    // (7:0) {#if user.loggedIn}
    function create_if_block(ctx) {
    	var button, dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Log out";
    			add_location(button, file$1, 7, 4, 149);
    			dispose = listen_dev(button, "click", ctx.toggle);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(7:0) {#if user.loggedIn}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var if_block_anchor;

    	function select_block_type(changed, ctx) {
    		if (ctx.user.loggedIn) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type !== (current_block_type = select_block_type(changed, ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let user = { loggedIn: false };
        function toggle() {
            $$invalidate('user', user.loggedIn = !user.loggedIn, user);
        }

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('user' in $$props) $$invalidate('user', user = $$props.user);
    	};

    	return { user, toggle };
    }

    class LogIn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LogIn", options, id: create_fragment$1.name });
    	}
    }

    /* src/FrameworkList.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/FrameworkList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.id = list[i].id;
    	child_ctx.name = list[i].name;
    	return child_ctx;
    }

    // (11:4) {#each frameworks as {id, name}}
    function create_each_block(ctx) {
    	var li, t0_value = ctx.id + "", t0, t1, t2_value = ctx.name + "", t2, t3;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(li, file$2, 11, 8, 254);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(11:4) {#each frameworks as {id, name}}", ctx });
    	return block;
    }

    function create_fragment$2(ctx) {
    	var h1, t_1, ul;

    	let each_value = ctx.frameworks;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "List of Frameworks";
    			t_1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(h1, file$2, 8, 0, 176);
    			add_location(ul, file$2, 9, 0, 204);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t_1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.frameworks) {
    				each_value = ctx.frameworks;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h1);
    				detach_dev(t_1);
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self) {
    	let frameworks = [
            {id: 1, name: 'Svelte'},
            {id: 2, name: 'Angular'},
            {id: 3, name: 'React'},
            {id: 4, name: 'Vue'}
        ];

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('frameworks' in $$props) $$invalidate('frameworks', frameworks = $$props.frameworks);
    	};

    	return { frameworks };
    }

    class FrameworkList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "FrameworkList", options, id: create_fragment$2.name });
    	}
    }

    /* src/Query.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/Query.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.source = list[i];
    	return child_ctx;
    }

    // (52:4) {#each results as source}
    function create_each_block$1(ctx) {
    	var li, t0_value = ctx.source.title.value + "", t0, t1, img, img_src_value, img_alt_value, t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			attr_dev(img, "src", img_src_value = ctx.source.image.value);
    			attr_dev(img, "alt", img_alt_value = ctx.source.title.value);
    			attr_dev(img, "class", "svelte-5ptrdw");
    			add_location(img, file$3, 54, 12, 1555);
    			add_location(li, file$3, 52, 8, 1505);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, img);
    			append_dev(li, t2);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.results) && t0_value !== (t0_value = ctx.source.title.value + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.results) && img_src_value !== (img_src_value = ctx.source.image.value)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((changed.results) && img_alt_value !== (img_alt_value = ctx.source.title.value)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(52:4) {#each results as source}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
    	var ul;

    	let each_value = ctx.results;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(ul, file$3, 50, 0, 1462);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.results) {
    				each_value = ctx.results;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    const url ="https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-34/sparql";

    function instance$3($$self, $$props, $$invalidate) {
    	
    //Note that the query is wrapped in es6 template strings to allow for easy copy pasting
    const query = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX edm: <http://www.europeana.eu/schemas/edm/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT ?result ?title ?place ?type ?image
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
LIMIT 30
`;
    let results = {};

    runQuery(url, query);
    //console.log(results)

    function runQuery(url, query){
      //Test if the endpoint is up and print result to page
      // (you can improve this script by making the next part of this function wait for a succesful result)
        // Call the url with the query attached, output data
        fetch(url+"?query="+ encodeURIComponent(query) +"&format=json")
            .then(res => res.json())
            .then(json => {
                console.log(json.results.bindings);
                $$invalidate('results', results = json.results.bindings);
      });
    }

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('results' in $$props) $$invalidate('results', results = $$props.results);
    	};

    	return { results };
    }

    class Query extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Query", options, id: create_fragment$3.name });
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$4(ctx) {
    	var t0, t1, t2, current;

    	var greeting = new Greeting({
    		props: { first_name: "Steve", last_name: "Smith" },
    		$$inline: true
    	});

    	var login = new LogIn({ $$inline: true });

    	var frameworklist = new FrameworkList({ $$inline: true });

    	var query = new Query({ $$inline: true });

    	const block = {
    		c: function create() {
    			greeting.$$.fragment.c();
    			t0 = space();
    			login.$$.fragment.c();
    			t1 = space();
    			frameworklist.$$.fragment.c();
    			t2 = space();
    			query.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(greeting, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(login, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(frameworklist, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(query, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(greeting.$$.fragment, local);

    			transition_in(login.$$.fragment, local);

    			transition_in(frameworklist.$$.fragment, local);

    			transition_in(query.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(greeting.$$.fragment, local);
    			transition_out(login.$$.fragment, local);
    			transition_out(frameworklist.$$.fragment, local);
    			transition_out(query.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(greeting, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(login, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(frameworklist, detaching);

    			if (detaching) {
    				detach_dev(t2);
    			}

    			destroy_component(query, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$4.name });
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
