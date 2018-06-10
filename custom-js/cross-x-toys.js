// jQuery Deparam
(function(deparam){
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        try {
            var jquery = require('jquery');
        } catch (e) {
        }
        module.exports = deparam(jquery);
    } else if (typeof define === 'function' && define.amd){
        define(['jquery'], function(jquery){
            return deparam(jquery);
        });
    } else {
        var global;
        try {
          global = (false || eval)('this'); // best cross-browser way to determine global for < ES5
        } catch (e) {
          global = window; // fails only if browser (https://developer.mozilla.org/en-US/docs/Web/Security/CSP/CSP_policy_directives)
        }
        global.deparam = deparam(global.jQuery); // assume jQuery is in global namespace
    }
})(function ($) {
    var deparam = function( params, coerce ) {
        var obj = {},
        coerce_types = { 'true': !0, 'false': !1, 'null': null };

        // If params is an empty string or otherwise falsy, return obj.
        if (!params) {
            return obj;
        }

        // Iterate over all name=value pairs.
        params.replace(/\+/g, ' ').split('&').forEach(function(v){
            var param = v.split( '=' ),
            key = decodeURIComponent( param[0] ),
            val,
            cur = obj,
            i = 0,

            // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
            // into its component parts.
            keys = key.split( '][' ),
            keys_last = keys.length - 1;

            // If the first keys part contains [ and the last ends with ], then []
            // are correctly balanced.
            if ( /\[/.test( keys[0] ) && /\]$/.test( keys[ keys_last ] ) ) {
                // Remove the trailing ] from the last keys part.
                keys[ keys_last ] = keys[ keys_last ].replace( /\]$/, '' );

                // Split first keys part into two parts on the [ and add them back onto
                // the beginning of the keys array.
                keys = keys.shift().split('[').concat( keys );

                keys_last = keys.length - 1;
            } else {
                // Basic 'foo' style key.
                keys_last = 0;
            }

            // Are we dealing with a name=value pair, or just a name?
            if ( param.length === 2 ) {
                val = decodeURIComponent( param[1] );

                // Coerce values.
                if ( coerce ) {
                    val = val && !isNaN(val) && ((+val + '') === val) ? +val        // number
                    : val === 'undefined'                       ? undefined         // undefined
                    : coerce_types[val] !== undefined           ? coerce_types[val] // true, false, null
                    : val;                                                          // string
                }

                if ( keys_last ) {
                    // Complex key, build deep object structure based on a few rules:
                    // * The 'cur' pointer starts at the object top-level.
                    // * [] = array push (n is set to array length), [n] = array if n is
                    //   numeric, otherwise object.
                    // * If at the last keys part, set the value.
                    // * For each keys part, if the current level is undefined create an
                    //   object or array based on the type of the next keys part.
                    // * Move the 'cur' pointer to the next level.
                    // * Rinse & repeat.
                    for ( ; i <= keys_last; i++ ) {
                        key = keys[i] === '' ? cur.length : keys[i];
                        cur = cur[key] = i < keys_last
                        ? cur[key] || ( keys[i+1] && isNaN( keys[i+1] ) ? {} : [] )
                        : val;
                    }

                } else {
                    // Simple key, even simpler rules, since only scalars and shallow
                    // arrays are allowed.

                    if ( Object.prototype.toString.call( obj[key] ) === '[object Array]' ) {
                        // val is already an array, so push on the next value.
                        obj[key].push( val );

                    } else if ( {}.hasOwnProperty.call(obj, key) ) {
                        // val isn't an array, but since a second value has been specified,
                        // convert val into an array.
                        obj[key] = [ obj[key], val ];

                    } else {
                        // val is a scalar.
                        obj[key] = val;
                    }
                }

            } else if ( key ) {
                // No value was defined, so set something meaningful.
                obj[key] = coerce
                ? undefined
                : '';
            }
        });

        return obj;
    };
    if ($) {
      $.prototype.deparam = $.deparam = deparam;
    }
    return deparam;
});
//-- end Deparam

var QueryStringRouter = (function() {

	//decode query string
	function getQueryStringParams() {
		return deparam(window.location.search.substring(1));
	}

	function getQueryStringParam(key) {
		return deparam(window.location.search.substring(1))[key];
	} 

	//we diff against the previous params, so that we can remove the params that are not present
	//in the query string from the reactive params
	var previousQueryStringParams = {};
	function processQueryStringParams() {
		var queryStringParams = getQueryStringParams();

		//check what previous params are not present in the new query string
		$.each(previousQueryStringParams, function(key, value) {
			if (typeof queryStringParams[key] == 'undefined') {
				$(document).trigger('QueryStringRouter__'+key+'__paramChanged');
				console.log('param '+key+' was removed');
			}
		});

		$.each(queryStringParams, function(key, value) {
			$(document).trigger('QueryStringRouter__'+key+'__paramChanged');
		});

		previousQueryStringParams = queryStringParams;
	}

	//when document loads
	processQueryStringParams();

	$(window).on('popstate', function() {
		processQueryStringParams();
	});

	function setParam(key, value, options) {
		var queryStringParams = getQueryStringParams();

		if (queryStringParams[key] !== value) {
			queryStringParams[key] = value;
			var newQueryString = $.param(queryStringParams);

			options = options || {};
			if (options.doNotCreateHistoryState === true) {
				window.history.replaceState('','', '?'+newQueryString);
			} else {
				window.history.pushState('','', '?'+newQueryString);
			}

			$(window).trigger('popstate');
		}
		
	}

	function removeParam(key, options) {
		var queryStringParams = getQueryStringParams();
		if (typeof queryStringParams[key] !== 'undefined') {
			delete queryStringParams[key];

			var newQueryString = $.param(queryStringParams);

			options = options || {};
			if (options.doNotCreateHistoryState === true) {
				window.history.replaceState('','', '?'+newQueryString);
			} else {
				window.history.pushState('','', '?'+newQueryString);
			}

			$(window).trigger('popstate');  
		}
	}

	function setFreshParams(newParamsObj, options) {
		var newQueryString = $.param(newParamsObj);

		options = options || {};
		if (options.doNotCreateHistoryState === true) {
			window.history.replaceState('','', '?'+newQueryString);
		} else {
			window.history.pushState('','', '?'+newQueryString);
		}
		$(window).trigger('popstate');
	}

	var actionsOnParamChange = {};
	function onParamChange(key, actionFunction) {
		$(document).on('QueryStringRouter__'+key+'__paramChanged', function(event) {
			var paramsObject = getQueryStringParams();
			var value = paramsObject[key];
			actionFunction(value);
		});

		//store the action on param in a separate array, so that we can retrigger this route manually
		//because this might be needed for ajax loaded content etc.
		if (typeof actionsOnParamChange[key] === 'undefined') {
			actionsOnParamChange[key] = [];
		}
		actionsOnParamChange[key].push(actionFunction);

		//when the onParamChanged is being defined, also retrigger the state
		retriggerOnParamChange(key);
	}

	function retriggerOnParamChange(key) {
		var param = getQueryStringParam(key);
		var arrayOfFunctionsAssociatedWithThisParam = actionsOnParamChange[key];
		$.each(arrayOfFunctionsAssociatedWithThisParam, function(index, value) {
			value(param);
		});
	}

	function retriggerOnParamChangeForAll() {
		$.each(actionsOnParamChange, function(key, value) {
			retriggerOnParamChange(key);
		});
	}

	function setDefaultRootParams(paramsObjects) {
		$(document).ready(function() {
			if (window.location.pathname === "/" & window.location.search === "") {
				setFreshParams(paramsObjects, {doNotCreateHistoryState: true});
			}
		});
	}

	return {
		setParam: setParam,
		getParam: getQueryStringParam,
		getAllParams: getQueryStringParams,
		setFreshParams: setFreshParams,
		setDefaultRootParams: setDefaultRootParams,
		onParamChange: onParamChange,
		retriggerOnParamChange: retriggerOnParamChange,
		retriggerOnParamChangeForAll: retriggerOnParamChangeForAll,
		removeParam: removeParam,
		version: '2.0',
		releaseNotes: {
			v2: 'removed Meteor and uses simple jQuery events'
		}
	}

})();

//------------- START MAIN APP ------------------
function showElementAndMoveToTheTopOfTotem(elementName) {
	$('[totem-elm-name="'+elementName+'"]').appendTo('[js-selector="totem__elements"]').removeClass('is-hidden');
}

function hideElement(elementName) {
	$('[totem-elm-name="'+elementName+'"]').addClass('is-hidden');
}

function hideAllTotemElements() {
	$('[totem-elm-name]').addClass('is-hidden');
}

function hideElementFromList(elementName) {
	$('[action-show-element-details="'+elementName+'"]').addClass('is-hidden');
}

function showElementOnList(elementName) {
	$('[action-show-element-details="'+elementName+'"]').removeClass('is-hidden');
}

function showAndHideUsedAndAvailableElements(elementName) {
	$('[totem-elm-name]').not('[is-used]').addClass('is-hidden');
	$('[action-show-element-details]').not('[is-used]').removeClass('is-hidden');
	$('[totem-elm-name][is-used]').removeClass('is-hidden');
	$('[action-show-element-details][is-used]').addClass('is-hidden');
}

QueryStringRouter.onParamChange('element-modal', function(value) {
	if (typeof value !== 'undefined') {
		$('[modal-wrapper]').removeClass('is-hidden');
		$('[modal-id="'+value+'"]').removeClass('is-hidden');
		$('[modal-id]').not('[modal-id="'+value+'"]').addClass('is-hidden');
	} else {
		$('[modal-wrapper]').addClass('is-hidden');
	}
});

var myTotemElements = [];

$(document).on('click', '[action-close-modal]', function(event) {
	QueryStringRouter.removeParam('element-modal', {doNotCreateHistoryState: true});
});

$(document).on('click', '[action-show-element-details]', function(event) {
	var elementDetailsToShow = $(this).attr('action-show-element-details');
	QueryStringRouter.setParam('element-modal', elementDetailsToShow);
});

$(document).on('click', '[totem-elm-name]', function(event) {
	var elementToHide = $(this).attr('totem-elm-name');
	hideElement(elementToHide);
	showElementOnList(elementToHide);
	if (myTotemElements.indexOf(elementToHide) > -1) {
		myTotemElements.splice(myTotemElements.indexOf(elementToHide), 1);
	}
});

$(document).on('click', '[action-confirm-element-choice]', function(event) {
	var elementToShow = $(this).attr('action-confirm-element-choice');
	showElementAndMoveToTheTopOfTotem(elementToShow);
	hideElementFromList(elementToShow);
	myTotemElements.push(elementToShow);
});

QueryStringRouter.setParam('tab', 'about', {doNotCreateHistoryState: true});

$(document).on('click', '[action-create-totem]', function() {
	QueryStringRouter.setParam('tab', 'create-totem');
});

$(document).on('click', '[action-set-nav-tab]', function() {
	var tabToSet = $(this).attr('action-set-nav-tab');
	QueryStringRouter.setParam('tab', tabToSet);
});

QueryStringRouter.onParamChange('tab', function(value) {
	$('[tab-id]').not('[tab-id="'+value+'"]').addClass('is-hidden');
	$('[tab-id="'+value+'"]').removeClass('is-hidden');
	$('[action-set-nav-tab]').not('[action-set-nav-tab="'+value+'"]').removeClass('is-current');
	$('[action-set-nav-tab="'+value+'"]').addClass('is-current');
});

