/*
 *
 * Copyright 2009-2012 Jayway Products AB
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
 * Module for handling field and page visibility rules
 */
var RulesModule = (function() {
	var inner = {};
	var viewModule;

	inner.setViewModule = function(_viewModule) {
		viewModule = _viewModule;
	};

	function intersection(array1, array2) {
		var result = [];
		$.each(array1, function(idx, el) {
			if (array2.indexOf(el) !== -1)
				result.push(el);
		});

		return result;
	}

	function allNumeric(array) {
		var result = true;

		$.each(array, function(idx, el) {
			if (isNaN(el)) {
				result = false;
				return false;
			}
		});

		return result;
	}

	function toNumber(value) {
		return Number(value);
	}

	function toLowerCase(value) {
		return ("" + value).toLowerCase();
	}

	function min(array, convert) {
		var result;
		$.each(array, function(idx, el) {
			var convertedEl = convert(el);
			if (!result || convertedEl < result)
				result = convertedEl;
		});

		return result;
	}

	function max(array, convert) {
		var result;
		$.each(array, function(idx, el) {
			var convertedEl = convert(el);
			if (!result || convertedEl > result)
				result = convertedEl;
		});

		return result;
	}

	function evaluate(rule) {
		if (rule) {
			var field = FormModule.getField(rule.field);
			if (field.visible === false || field.page.visible === false) {
				return false;
			}
			var values = FormModule.selectedValues(field);
			if (rule.condition === "anyof") {
				var common = intersection(values, rule.values);

				return (common.length && rule.visibleWhen)
						|| (!common.length && !rule.visibleWhen);
			} else if (rule.condition === "noneof") {
				var common = intersection(values, rule.values);

				return (!common.length && rule.visibleWhen)
						|| (common.length && !rule.visibleWhen);
			} else if (rule.condition === "morethan") {
				var convert = allNumeric(values.concat(rule.values[0])) ? toNumber
						: toLowerCase;
				var minValue = min(values, convert);

				return (minValue > convert(rule.values[0]) && rule.visibleWhen)
						|| (minValue <= convert(rule.values[0]) && !rule.visibleWhen);
			} else if (rule.condition === "lessthan") {
				var convert = allNumeric(values.concat(rule.values[0])) ? toNumber
						: toLowerCase;
				var maxValue = max(values, convert);

				return (maxValue < convert(rule.values[0]) && rule.visibleWhen)
						|| (maxValue >= convert(rule.values[0]) && !rule.visibleWhen);
			}
		}

		return;
	}

	function evaluateFieldRules(currentPage) {
		$.each(currentPage.fields, function(idx, f) {
			var result = evaluate(f.field.field.rule);

			if (result === true) {
				f.visible = true;
			} else if (result === false) {
				f.visible = false;
			}
		});
	}

	function evaluatePageRules(currentPage) {
		$.each(FormModule.pages(), function(idx, p) {
			var result = evaluate(p.rule);

			if (result === true) {
				p.visible = true;
			} else if (result === false) {
				p.visible = false;
			}
		});
	}

	inner.evaluateRules = function(currentPage) {
		if (currentPage) {
			evaluateFieldRules(currentPage);
		} else {
			$.each(FormModule.pages(), function(idx, page) {
				evaluateFieldRules(page);
			});
		}
		evaluatePageRules(currentPage);
	};

	function applyFieldVisibility(currentPage, animate) {
		$.each(currentPage.fields, function(idx, f) {
			var node = $("#Field" + f.id);

			if (f.visible === true) {
				if (animate)
					setTimeout(function() {
						node.slideDown();
					}, 0);
				else
					node.show();
			} else if (f.visible === false) {
				if (animate)
					setTimeout(function() {
						node.slideUp();
					}, 0);
				else
					node.hide();
			}
		});
	}

	function applyPageVisibility(currentPage, animate) {
		$.each(FormModule.pages(), function(idx, p) {
			var progressItem = $("#progressItem" + idx);
			var formPageSummary = $("#form_page_summary" + idx);

			if (p.visible === true) {
				if (animate)
					setTimeout(function() {
						progressItem.show("slow");
					}, 0);
				else
					progressItem.show();
			} else if (p.visible === false) {
				if (animate)
					setTimeout(function() {
						progressItem.hide("slow");
					}, 0);
				else
					progressItem.hide();

				formPageSummary.hide();
			}
		});

		if (currentPage) {
			$("#button_previous").attr("href",
					viewModule.getPrevious(currentPage.index));
			$("#button_next").attr("href",
					viewModule.getNext(currentPage.index));
		}
	}

	inner.applyVisibility = function(currentPage, animate) {
		if (currentPage) {
			applyFieldVisibility(currentPage, animate);
		} else {
			$.each(FormModule.pages(), function(idx, page) {
				applyFieldVisibility(page, animate);
			});
		}
		applyPageVisibility(currentPage, animate);
	};

	inner.applyRules = function(currentPage, animate) {
		inner.evaluateRules(currentPage);
		inner.applyVisibility(currentPage, animate);
	};

	return inner;
}());
