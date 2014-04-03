/*
 *
 * Copyright 2009-2014 Jayway Products AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Maps a string to a function i.e. name/id -> init(name), init(id), view(id)
 * 
 */
var Contexts = (function() {
	var inner = {};
	var rootContext;
	var hash;

	// Context has a view, and an array of setup functions
	// before showing the view the setup functions are called
	function Context(view, init) {
		this.subContexts = {};
		this.init = init ? init : [];
		this.view = view;
	}

	Context.prototype.addSubContext = function(name, context) {
		this.subContexts[name] = context;
	}

	Context.prototype.sub = function(name) {
		if (!name)
			return null;
		if (this.subContexts[name])
			return this.subContexts[name];
		else
			return this.subContexts.idContext;
	}

	Context.prototype.initEval = function(args) {
		$.each(this.init, function(idx, fun) {
			fun(args);
		});
	}

	Context.prototype.runView = function(segments, previous) {
		this.initEval(previous);
		var args = firstSegment(segments);
		var subContext = this.sub(args.segment);
		if (!subContext) {
			this.view(previous);

			return;
		}
		subContext.runView(segments.slice(1), args);
	}

	function firstSegment(segments) {
		var providedArguments = {};
		if (!segments || segments.length == 0)
			return providedArguments;
		else {
			var segment = segments[0];
			if (segment.indexOf('?') > 0) {
				var split = segment.split('?');
				providedArguments['segment'] = split[0];
				var pairs = split[1].split('&');
				$.each(pairs, function(idx, pair) {
					if (pair.indexOf('=') == -1)
						return providedArguments;
					var p = pair.split('=');
					providedArguments[p[0]] = p[1];
				});
			} else
				providedArguments['segment'] = segment;
		}

		return providedArguments;
	}

	// maps the hash segments to a list of strings
	function getSegments() {
		return hash.substring(1).split('/');
	}

	function build(map) {
		var context = new Context(map.view, map.init);
		if (!map.subContexts)
			return context;
		$.each(map.subContexts, function(key, value) {
			context.addSubContext(key, build(value));
		});

		return context;
	}

	inner.init = function(map) {
		rootContext = build(map);
		hash = null;
	}

	inner.findView = function(loc) {
		if (hash == loc)
			return $.noop;
		hash = loc;
		var segments = getSegments();

		return function() {
			rootContext.runView(segments);
		}
	}

	inner.findUrl = function(fn, ids) {
		var search = buildUrl(rootContext, fn, ids, "");
		if (search.found) {
			if (search.url.match(/\/$/))
				return search.url.substring(0, search.url.length - 1);

			return search.url;
		} else
			throw "function not found";
	}

	// depth first search to find the view function
	function buildUrl(context, fn, ids, url) {
		if (context.view == fn)
			return {
				url : url,
				found : true
			};
		var result = {
			found : false
		};
		$.each(context.subContexts, function(key, value) {
			var subId = ids;
			if (key == 'idContext' && ids) {
				key = ids[0];
				subId = ids.slice(1);
			}
			result = buildUrl(value, fn, subId, url + key + '/');
			if (result.found)
				return false;
		});

		return result;
	}

	return inner;
}());
