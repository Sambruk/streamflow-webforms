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
			if (0 <= $.inArray(el, array2))
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

	function xor(condition1, condition2) {
		return (condition1 && !condition2) || (!condition1 && condition2);
	}

	function evaluate(rule) {
		if (rule && rule.field) {
			var field = FormModule.getField(rule.field);
			if (field.visible === false || field.page.visible === false)
				return false;
			var values = FormModule.selectedValues(field);
			if (rule.condition === "anyof") {
				var common = intersection(values, rule.values);

				return xor(common.length, !rule.visibleWhen);
			} else if (rule.condition === "noneof") {
				var common = intersection(values, rule.values);

				return xor(common.length, rule.visibleWhen);
			} else if (rule.condition === "morethan") {
				var convert = allNumeric(values.concat(rule.values[0])) ? toNumber : toLowerCase;
				var minValue = min(values, convert);

				return xor(minValue > convert(rule.values[0]), !rule.visibleWhen);
			} else if (rule.condition === "lessthan") {
				var convert = allNumeric(values.concat(rule.values[0])) ? toNumber : toLowerCase;
				var maxValue = max(values, convert);

				return xor(maxValue < convert(rule.values[0]), !rule.visibleWhen);
			}
		}

		return;
	}

	function evaluatePageRule(page) {
		var result = evaluate(page.rule);

		if (result === true)
			page.visible = true;
		else if (result === false)
			page.visible = false;
	}

	function evaluateFieldRules(currentPage) {
		var changes = [];
		$.each(currentPage.fields, function(idx, f) {
			var result = evaluate(f.field.field.rule);

			if (result !== undefined) {
				if (f.visible !== result)
					changes.push(f);
				f.visible = result;
			} else if (f.fieldGroup) {
				var group = FormModule.getField(f.fieldGroup);
				if (f.visible !== group.visible)
					changes.push(f);
				f.visible = group.visible;
			}
		});

		return changes;
	}

	inner.evaluateRules = function() {
		var fieldChanges = [];
		$.each(FormModule.pages(), function(idx, page) {
			evaluatePageRule(page);
			fieldChanges = fieldChanges.concat(evaluateFieldRules(page));
		});

		return fieldChanges;
	};

	function applyFieldVisibility(currentPage, animate) {
		$.each(currentPage.fields, function(idx, f) {
			var node = $("#Field" + f.id);

			if (f.fieldGroup && !node.is("tr")) {
				// Gets ugly if hiding both field group and individual fields.
				return;
			}

			if (animate)
				setTimeout(function() {
					if (f.visible) {
						node.slideDown(); 
						if (f.fieldType == "GeoLocationFieldValue") {
							f.repaintWhenVisible();
						}
					} else {
						node.slideUp();
					}
				}, 0);
			else
				if (f.visible) {
					node.show();
					if (f.fieldType == "GeoLocationFieldValue") {
						f.repaintWhenVisible();
					}
				} else {
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
			$("#button_previous").attr("href", viewModule.getPrevious(currentPage.index));
			$("#button_next").attr("href", viewModule.getNext(currentPage.index));
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
		var fieldChanges = inner.evaluateRules();
		inner.applyVisibility(currentPage, animate);

		return fieldChanges;
	};

	return inner;
}());
