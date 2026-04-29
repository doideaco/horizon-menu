(function(){
  // Use /cart.js and update banners in place. Works with Horizon’s AJAX side cart.
  var CART_RE = /\/cart(\/add|\/change|\/update)?(?:\.js)?/i;
  var POLL_MS = 2000;          // fallback polling (lightweight)
  var BURST_MS = 12000;        // burst-poll after ATC/cart interactions
  var burstUntil = 0;

  function fmt(amount, currency){
    try {
      if (window.Shopify && typeof Shopify.formatMoney === 'function') {
        var tpl = (window.theme && theme.moneyFormat) || '{{amount}}';
        return Shopify.formatMoney(amount, tpl);
      }
    } catch(e){}
    try {
      return new Intl.NumberFormat('en-GB',{style:'currency',currency:currency||'GBP'}).format((amount||0)/100);
    } catch(e){
      return '£'+((amount||0)/100).toFixed(2);
    }
  }

  function renderBanner(root, total, currency){
    var thrStd = parseInt(root.getAttribute('data-thr-std'),10) || 0;
    var thrNd  = parseInt(root.getAttribute('data-thr-nd'),10) || 0;
    var textEl = root.querySelector('[data-fsb-text]');
    if (!textEl) return;
    if (!total || total <= 0) {
      textEl.innerHTML = '<p>You\'re only <span>' + fmt(thrStd-total, currency) + '</span> away from free <em>standard</em> shipping</p>';
      return;
    }
    if (total < thrStd) {
      textEl.innerHTML = '<p>You\'re only <span>' + fmt(thrStd-total, currency) + '</span> away from free <em>standard</em> shipping</p>';
      return;
    }
    if (total < thrNd) {
      textEl.innerHTML = '<p>👍 You\'re only <span>' + fmt(thrNd-total, currency) + '</span> away from free <em>next day</em> shipping</p>';
      return;
    }
    textEl.innerHTML = '<p>🎉 You qualify for free next day shipping</p>';
  }

  function updateAllBanners(cart){
    var currency = (cart && cart.currency) || 'GBP';
    var total    = (cart && cart.total_price) || 0;
    document.querySelectorAll('[data-free-shipping-banner]').forEach(function(root){
      renderBanner(root, total, currency);
    });
  }

  async function fetchCartAndUpdate(){
    try {
      var res = await fetch('/cart.js', {credentials:'same-origin', headers:{'Accept':'application/json'}});
      if (!res.ok) return;
      var cart = await res.json();
      updateAllBanners(cart);
    } catch(e){}
  }

  // Initial paint
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchCartAndUpdate);
  } else {
    fetchCartAndUpdate();
  }

  // Listen to common Horizon events if they exist
  ['cart:updated','cart:change','product:added','cart-drawer:updated'].forEach(function(evt){
    document.addEventListener(evt, function(){ burstUntil = Date.now()+BURST_MS; fetchCartAndUpdate(); });
  });

  // Intercept cart AJAX calls (fetch + XHR) as a safety net
  if (!window.__fsb_fetch_patch__) {
    window.__fsb_fetch_patch__ = true;
    var _fetch = window.fetch;
    window.fetch = function(input, init){
      var p = _fetch.apply(this, arguments);
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (CART_RE.test(url)) p.finally(function(){ burstUntil = Date.now()+BURST_MS; fetchCartAndUpdate(); });
      } catch(e){}
      return p;
    };
  }
  if (!window.__fsb_xhr_patch__) {
    window.__fsb_xhr_patch__ = true;
    var _open = XMLHttpRequest.prototype.open;
    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url){
      this.__fsb_is_cart__ = CART_RE.test(String(url||''));
      return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(){
      if (this.__fsb_is_cart__) {
        this.addEventListener('loadend', function(){ burstUntil = Date.now()+BURST_MS; fetchCartAndUpdate(); }, { once:true });
      }
      return _send.apply(this, arguments);
    };
  }

  // Lightweight polling, with a short “burst” after interactions so PDP reflects changes fast
  setInterval(function(){
    if (Date.now() < burstUntil) { fetchCartAndUpdate(); return; }
    // regular heartbeat (keeps in sync if a third-party app updates cart silently)
    fetchCartAndUpdate();
  }, POLL_MS);
})();