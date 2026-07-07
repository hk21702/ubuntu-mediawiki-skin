/**
 * Shim that loads the @canonical/cookie-policy vendor IIFE and ensures
 * cpNs is available as a global (window.cpNs) for the cookieConsent module.
 *
 * ResourceLoader wraps "scripts" files in a closure, so the vendor's
 * `var cpNs = ...` would be scoped locally. This shim uses indirect eval
 * to execute the vendor code in the global scope, making cpNs globally
 * accessible.
 *
 * The vendor code is loaded as a text file via packageFiles with type:"text",
 * then executed via indirect eval (the (0,eval) pattern) which runs in the
 * global scope rather than the local closure scope.
 *
 * Only executes when UbuntuCookieConsentEnabled is true, so the vendor
 * IIFE (and its addGoogleConsentMode()) doesn't run when consent is disabled.
 */
var config = require( './config.json' );

if ( config.UbuntuCookieConsentEnabled ) {
	// Load the vendor IIFE source as a string (type:"text" in packageFiles)
	var cookiePolicyVendor = require( './vendor/cookie-policy.js' );
	// Use indirect eval (comma expression) to execute in global scope
	// so `var cpNs = ...` becomes `window.cpNs = ...`
	( 0, eval )( cookiePolicyVendor );
}
