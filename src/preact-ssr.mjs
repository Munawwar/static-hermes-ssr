// This file is a slightly modified SSR build from https://github.com/Munawwar/preact-mpa-template
// The added differences are:
// 1. I import 'preact-render-to-string' in the SSR build (this is a bit of additonal bloat for client side code though)
// 2. I do not "externalize" preact either when doing the build. With node.js externalizing was needed to prevent two copies
// of preact being used, as 'preact-render-to-string' pulls it's own node.js copy of preact.

// node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var i;
var t;
var r;
var o;
var f;
var e;
var c = {};
var s = [];
var a = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function h(n3, l4) {
  for (var u4 in l4)
    n3[u4] = l4[u4];
  return n3;
}
function v(n3) {
  var l4 = n3.parentNode;
  l4 && l4.removeChild(n3);
}
function y(l4, u4, i4) {
  var t3, r3, o5, f4 = {};
  for (o5 in u4)
    "key" == o5 ? t3 = u4[o5] : "ref" == o5 ? r3 = u4[o5] : f4[o5] = u4[o5];
  if (arguments.length > 2 && (f4.children = arguments.length > 3 ? n.call(arguments, 2) : i4), "function" == typeof l4 && null != l4.defaultProps)
    for (o5 in l4.defaultProps)
      void 0 === f4[o5] && (f4[o5] = l4.defaultProps[o5]);
  return p(l4, f4, t3, r3, null);
}
function p(n3, i4, t3, r3, o5) {
  var f4 = { type: n3, props: i4, key: t3, ref: r3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: null == o5 ? ++u : o5 };
  return null == o5 && null != l.vnode && l.vnode(f4), f4;
}
function _(n3) {
  return n3.children;
}
function k(n3, l4, u4, i4, t3) {
  var r3;
  for (r3 in u4)
    "children" === r3 || "key" === r3 || r3 in l4 || g(n3, r3, null, u4[r3], i4);
  for (r3 in l4)
    t3 && "function" != typeof l4[r3] || "children" === r3 || "key" === r3 || "value" === r3 || "checked" === r3 || u4[r3] === l4[r3] || g(n3, r3, l4[r3], u4[r3], i4);
}
function b(n3, l4, u4) {
  "-" === l4[0] ? n3.setProperty(l4, null == u4 ? "" : u4) : n3[l4] = null == u4 ? "" : "number" != typeof u4 || a.test(l4) ? u4 : u4 + "px";
}
function g(n3, l4, u4, i4, t3) {
  var r3;
  n:
    if ("style" === l4)
      if ("string" == typeof u4)
        n3.style.cssText = u4;
      else {
        if ("string" == typeof i4 && (n3.style.cssText = i4 = ""), i4)
          for (l4 in i4)
            u4 && l4 in u4 || b(n3.style, l4, "");
        if (u4)
          for (l4 in u4)
            i4 && u4[l4] === i4[l4] || b(n3.style, l4, u4[l4]);
      }
    else if ("o" === l4[0] && "n" === l4[1])
      r3 = l4 !== (l4 = l4.replace(/Capture$/, "")), l4 = l4.toLowerCase() in n3 ? l4.toLowerCase().slice(2) : l4.slice(2), n3.l || (n3.l = {}), n3.l[l4 + r3] = u4, u4 ? i4 || n3.addEventListener(l4, r3 ? w : m, r3) : n3.removeEventListener(l4, r3 ? w : m, r3);
    else if ("dangerouslySetInnerHTML" !== l4) {
      if (t3)
        l4 = l4.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" !== l4 && "height" !== l4 && "href" !== l4 && "list" !== l4 && "form" !== l4 && "tabIndex" !== l4 && "download" !== l4 && l4 in n3)
        try {
          n3[l4] = null == u4 ? "" : u4;
          break n;
        } catch (n4) {
        }
      "function" == typeof u4 || (null == u4 || false === u4 && -1 == l4.indexOf("-") ? n3.removeAttribute(l4) : n3.setAttribute(l4, u4));
    }
}
function m(n3) {
  t = true;
  try {
    return this.l[n3.type + false](l.event ? l.event(n3) : n3);
  } finally {
    t = false;
  }
}
function w(n3) {
  t = true;
  try {
    return this.l[n3.type + true](l.event ? l.event(n3) : n3);
  } finally {
    t = false;
  }
}
function x(n3, l4) {
  this.props = n3, this.context = l4;
}
function A(n3, l4) {
  if (null == l4)
    return n3.__ ? A(n3.__, n3.__.__k.indexOf(n3) + 1) : null;
  for (var u4; l4 < n3.__k.length; l4++)
    if (null != (u4 = n3.__k[l4]) && null != u4.__e)
      return u4.__e;
  return "function" == typeof n3.type ? A(n3) : null;
}
function P(n3) {
  var l4, u4;
  if (null != (n3 = n3.__) && null != n3.__c) {
    for (n3.__e = n3.__c.base = null, l4 = 0; l4 < n3.__k.length; l4++)
      if (null != (u4 = n3.__k[l4]) && null != u4.__e) {
        n3.__e = n3.__c.base = u4.__e;
        break;
      }
    return P(n3);
  }
}
function C(n3) {
  t ? setTimeout(n3) : f(n3);
}
function T(n3) {
  (!n3.__d && (n3.__d = true) && r.push(n3) && !$.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || C)($);
}
function $() {
  var n3, l4, u4, i4, t3, o5, f4, e3;
  for (r.sort(function(n4, l5) {
    return n4.__v.__b - l5.__v.__b;
  }); n3 = r.shift(); )
    n3.__d && (l4 = r.length, i4 = void 0, t3 = void 0, f4 = (o5 = (u4 = n3).__v).__e, (e3 = u4.__P) && (i4 = [], (t3 = h({}, o5)).__v = o5.__v + 1, M(e3, o5, t3, u4.__n, void 0 !== e3.ownerSVGElement, null != o5.__h ? [f4] : null, i4, null == f4 ? A(o5) : f4, o5.__h), N(i4, o5), o5.__e != f4 && P(o5)), r.length > l4 && r.sort(function(n4, l5) {
      return n4.__v.__b - l5.__v.__b;
    }));
  $.__r = 0;
}
function H(n3, l4, u4, i4, t3, r3, o5, f4, e3, a4) {
  var h3, v4, y4, d3, k4, b4, g4, m4 = i4 && i4.__k || s, w4 = m4.length;
  for (u4.__k = [], h3 = 0; h3 < l4.length; h3++)
    if (null != (d3 = u4.__k[h3] = null == (d3 = l4[h3]) || "boolean" == typeof d3 ? null : "string" == typeof d3 || "number" == typeof d3 || "bigint" == typeof d3 ? p(null, d3, null, null, d3) : Array.isArray(d3) ? p(_, { children: d3 }, null, null, null) : d3.__b > 0 ? p(d3.type, d3.props, d3.key, d3.ref ? d3.ref : null, d3.__v) : d3)) {
      if (d3.__ = u4, d3.__b = u4.__b + 1, null === (y4 = m4[h3]) || y4 && d3.key == y4.key && d3.type === y4.type)
        m4[h3] = void 0;
      else
        for (v4 = 0; v4 < w4; v4++) {
          if ((y4 = m4[v4]) && d3.key == y4.key && d3.type === y4.type) {
            m4[v4] = void 0;
            break;
          }
          y4 = null;
        }
      M(n3, d3, y4 = y4 || c, t3, r3, o5, f4, e3, a4), k4 = d3.__e, (v4 = d3.ref) && y4.ref != v4 && (g4 || (g4 = []), y4.ref && g4.push(y4.ref, null, d3), g4.push(v4, d3.__c || k4, d3)), null != k4 ? (null == b4 && (b4 = k4), "function" == typeof d3.type && d3.__k === y4.__k ? d3.__d = e3 = I(d3, e3, n3) : e3 = z(n3, d3, y4, m4, k4, e3), "function" == typeof u4.type && (u4.__d = e3)) : e3 && y4.__e == e3 && e3.parentNode != n3 && (e3 = A(y4));
    }
  for (u4.__e = b4, h3 = w4; h3--; )
    null != m4[h3] && ("function" == typeof u4.type && null != m4[h3].__e && m4[h3].__e == u4.__d && (u4.__d = L(i4).nextSibling), q(m4[h3], m4[h3]));
  if (g4)
    for (h3 = 0; h3 < g4.length; h3++)
      S(g4[h3], g4[++h3], g4[++h3]);
}
function I(n3, l4, u4) {
  for (var i4, t3 = n3.__k, r3 = 0; t3 && r3 < t3.length; r3++)
    (i4 = t3[r3]) && (i4.__ = n3, l4 = "function" == typeof i4.type ? I(i4, l4, u4) : z(u4, i4, i4, t3, i4.__e, l4));
  return l4;
}
function z(n3, l4, u4, i4, t3, r3) {
  var o5, f4, e3;
  if (void 0 !== l4.__d)
    o5 = l4.__d, l4.__d = void 0;
  else if (null == u4 || t3 != r3 || null == t3.parentNode)
    n:
      if (null == r3 || r3.parentNode !== n3)
        n3.appendChild(t3), o5 = null;
      else {
        for (f4 = r3, e3 = 0; (f4 = f4.nextSibling) && e3 < i4.length; e3 += 1)
          if (f4 == t3)
            break n;
        n3.insertBefore(t3, r3), o5 = r3;
      }
  return void 0 !== o5 ? o5 : t3.nextSibling;
}
function L(n3) {
  var l4, u4, i4;
  if (null == n3.type || "string" == typeof n3.type)
    return n3.__e;
  if (n3.__k) {
    for (l4 = n3.__k.length - 1; l4 >= 0; l4--)
      if ((u4 = n3.__k[l4]) && (i4 = L(u4)))
        return i4;
  }
  return null;
}
function M(n3, u4, i4, t3, r3, o5, f4, e3, c4) {
  var s3, a4, v4, y4, p4, d3, k4, b4, g4, m4, w4, A3, P2, C3, T2, $2 = u4.type;
  if (void 0 !== u4.constructor)
    return null;
  null != i4.__h && (c4 = i4.__h, e3 = u4.__e = i4.__e, u4.__h = null, o5 = [e3]), (s3 = l.__b) && s3(u4);
  try {
    n:
      if ("function" == typeof $2) {
        if (b4 = u4.props, g4 = (s3 = $2.contextType) && t3[s3.__c], m4 = s3 ? g4 ? g4.props.value : s3.__ : t3, i4.__c ? k4 = (a4 = u4.__c = i4.__c).__ = a4.__E : ("prototype" in $2 && $2.prototype.render ? u4.__c = a4 = new $2(b4, m4) : (u4.__c = a4 = new x(b4, m4), a4.constructor = $2, a4.render = B), g4 && g4.sub(a4), a4.props = b4, a4.state || (a4.state = {}), a4.context = m4, a4.__n = t3, v4 = a4.__d = true, a4.__h = [], a4._sb = []), null == a4.__s && (a4.__s = a4.state), null != $2.getDerivedStateFromProps && (a4.__s == a4.state && (a4.__s = h({}, a4.__s)), h(a4.__s, $2.getDerivedStateFromProps(b4, a4.__s))), y4 = a4.props, p4 = a4.state, a4.__v = u4, v4)
          null == $2.getDerivedStateFromProps && null != a4.componentWillMount && a4.componentWillMount(), null != a4.componentDidMount && a4.__h.push(a4.componentDidMount);
        else {
          if (null == $2.getDerivedStateFromProps && b4 !== y4 && null != a4.componentWillReceiveProps && a4.componentWillReceiveProps(b4, m4), !a4.__e && null != a4.shouldComponentUpdate && false === a4.shouldComponentUpdate(b4, a4.__s, m4) || u4.__v === i4.__v) {
            for (u4.__v !== i4.__v && (a4.props = b4, a4.state = a4.__s, a4.__d = false), u4.__e = i4.__e, u4.__k = i4.__k, u4.__k.forEach(function(n4) {
              n4 && (n4.__ = u4);
            }), w4 = 0; w4 < a4._sb.length; w4++)
              a4.__h.push(a4._sb[w4]);
            a4._sb = [], a4.__h.length && f4.push(a4);
            break n;
          }
          null != a4.componentWillUpdate && a4.componentWillUpdate(b4, a4.__s, m4), null != a4.componentDidUpdate && a4.__h.push(function() {
            a4.componentDidUpdate(y4, p4, d3);
          });
        }
        if (a4.context = m4, a4.props = b4, a4.__P = n3, A3 = l.__r, P2 = 0, "prototype" in $2 && $2.prototype.render) {
          for (a4.state = a4.__s, a4.__d = false, A3 && A3(u4), s3 = a4.render(a4.props, a4.state, a4.context), C3 = 0; C3 < a4._sb.length; C3++)
            a4.__h.push(a4._sb[C3]);
          a4._sb = [];
        } else
          do {
            a4.__d = false, A3 && A3(u4), s3 = a4.render(a4.props, a4.state, a4.context), a4.state = a4.__s;
          } while (a4.__d && ++P2 < 25);
        a4.state = a4.__s, null != a4.getChildContext && (t3 = h(h({}, t3), a4.getChildContext())), v4 || null == a4.getSnapshotBeforeUpdate || (d3 = a4.getSnapshotBeforeUpdate(y4, p4)), T2 = null != s3 && s3.type === _ && null == s3.key ? s3.props.children : s3, H(n3, Array.isArray(T2) ? T2 : [T2], u4, i4, t3, r3, o5, f4, e3, c4), a4.base = u4.__e, u4.__h = null, a4.__h.length && f4.push(a4), k4 && (a4.__E = a4.__ = null), a4.__e = false;
      } else
        null == o5 && u4.__v === i4.__v ? (u4.__k = i4.__k, u4.__e = i4.__e) : u4.__e = O(i4.__e, u4, i4, t3, r3, o5, f4, c4);
    (s3 = l.diffed) && s3(u4);
  } catch (n4) {
    u4.__v = null, (c4 || null != o5) && (u4.__e = e3, u4.__h = !!c4, o5[o5.indexOf(e3)] = null), l.__e(n4, u4, i4);
  }
}
function N(n3, u4) {
  l.__c && l.__c(u4, n3), n3.some(function(u5) {
    try {
      n3 = u5.__h, u5.__h = [], n3.some(function(n4) {
        n4.call(u5);
      });
    } catch (n4) {
      l.__e(n4, u5.__v);
    }
  });
}
function O(l4, u4, i4, t3, r3, o5, f4, e3) {
  var s3, a4, h3, y4 = i4.props, p4 = u4.props, d3 = u4.type, _4 = 0;
  if ("svg" === d3 && (r3 = true), null != o5) {
    for (; _4 < o5.length; _4++)
      if ((s3 = o5[_4]) && "setAttribute" in s3 == !!d3 && (d3 ? s3.localName === d3 : 3 === s3.nodeType)) {
        l4 = s3, o5[_4] = null;
        break;
      }
  }
  if (null == l4) {
    if (null === d3)
      return document.createTextNode(p4);
    l4 = r3 ? document.createElementNS("http://www.w3.org/2000/svg", d3) : document.createElement(d3, p4.is && p4), o5 = null, e3 = false;
  }
  if (null === d3)
    y4 === p4 || e3 && l4.data === p4 || (l4.data = p4);
  else {
    if (o5 = o5 && n.call(l4.childNodes), a4 = (y4 = i4.props || c).dangerouslySetInnerHTML, h3 = p4.dangerouslySetInnerHTML, !e3) {
      if (null != o5)
        for (y4 = {}, _4 = 0; _4 < l4.attributes.length; _4++)
          y4[l4.attributes[_4].name] = l4.attributes[_4].value;
      (h3 || a4) && (h3 && (a4 && h3.__html == a4.__html || h3.__html === l4.innerHTML) || (l4.innerHTML = h3 && h3.__html || ""));
    }
    if (k(l4, p4, y4, r3, e3), h3)
      u4.__k = [];
    else if (_4 = u4.props.children, H(l4, Array.isArray(_4) ? _4 : [_4], u4, i4, t3, r3 && "foreignObject" !== d3, o5, f4, o5 ? o5[0] : i4.__k && A(i4, 0), e3), null != o5)
      for (_4 = o5.length; _4--; )
        null != o5[_4] && v(o5[_4]);
    e3 || ("value" in p4 && void 0 !== (_4 = p4.value) && (_4 !== l4.value || "progress" === d3 && !_4 || "option" === d3 && _4 !== y4.value) && g(l4, "value", _4, y4.value, false), "checked" in p4 && void 0 !== (_4 = p4.checked) && _4 !== l4.checked && g(l4, "checked", _4, y4.checked, false));
  }
  return l4;
}
function S(n3, u4, i4) {
  try {
    "function" == typeof n3 ? n3(u4) : n3.current = u4;
  } catch (n4) {
    l.__e(n4, i4);
  }
}
function q(n3, u4, i4) {
  var t3, r3;
  if (l.unmount && l.unmount(n3), (t3 = n3.ref) && (t3.current && t3.current !== n3.__e || S(t3, null, u4)), null != (t3 = n3.__c)) {
    if (t3.componentWillUnmount)
      try {
        t3.componentWillUnmount();
      } catch (n4) {
        l.__e(n4, u4);
      }
    t3.base = t3.__P = null, n3.__c = void 0;
  }
  if (t3 = n3.__k)
    for (r3 = 0; r3 < t3.length; r3++)
      t3[r3] && q(t3[r3], u4, i4 || "function" != typeof n3.type);
  i4 || null == n3.__e || v(n3.__e), n3.__ = n3.__e = n3.__d = void 0;
}
function B(n3, l4, u4) {
  return this.constructor(n3, u4);
}
function D(u4, i4, t3) {
  var r3, o5, f4;
  l.__ && l.__(u4, i4), o5 = (r3 = "function" == typeof t3) ? null : t3 && t3.__k || i4.__k, f4 = [], M(i4, u4 = (!r3 && t3 || i4).__k = y(_, null, [u4]), o5 || c, c, void 0 !== i4.ownerSVGElement, !r3 && t3 ? [t3] : o5 ? null : i4.firstChild ? n.call(i4.childNodes) : null, f4, !r3 && t3 ? t3 : o5 ? o5.__e : i4.firstChild, r3), N(f4, u4);
}
function E(n3, l4) {
  D(n3, l4, E);
}
function G(n3, l4) {
  var u4 = { __c: l4 = "__cC" + e++, __: n3, Consumer: function(n4, l5) {
    return n4.children(l5);
  }, Provider: function(n4) {
    var u5, i4;
    return this.getChildContext || (u5 = [], (i4 = {})[l4] = this, this.getChildContext = function() {
      return i4;
    }, this.shouldComponentUpdate = function(n5) {
      this.props.value !== n5.value && u5.some(function(n6) {
        n6.__e = true, T(n6);
      });
    }, this.sub = function(n5) {
      u5.push(n5);
      var l5 = n5.componentWillUnmount;
      n5.componentWillUnmount = function() {
        u5.splice(u5.indexOf(n5), 1), l5 && l5.call(n5);
      };
    }), n4.children;
  } };
  return u4.Provider.__ = u4.Consumer.contextType = u4;
}
n = s.slice, l = { __e: function(n3, l4, u4, i4) {
  for (var t3, r3, o5; l4 = l4.__; )
    if ((t3 = l4.__c) && !t3.__)
      try {
        if ((r3 = t3.constructor) && null != r3.getDerivedStateFromError && (t3.setState(r3.getDerivedStateFromError(n3)), o5 = t3.__d), null != t3.componentDidCatch && (t3.componentDidCatch(n3, i4 || {}), o5 = t3.__d), o5)
          return t3.__E = t3;
      } catch (l5) {
        n3 = l5;
      }
  throw n3;
} }, u = 0, i = function(n3) {
  return null != n3 && void 0 === n3.constructor;
}, t = false, x.prototype.setState = function(n3, l4) {
  var u4;
  u4 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = h({}, this.state), "function" == typeof n3 && (n3 = n3(h({}, u4), this.props)), n3 && h(u4, n3), null != n3 && this.__v && (l4 && this._sb.push(l4), T(this));
}, x.prototype.forceUpdate = function(n3) {
  this.__v && (this.__e = true, n3 && this.__h.push(n3), T(this));
}, x.prototype.render = _, r = [], f = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, $.__r = 0, e = 0;

// node_modules/preact-render-to-string/dist/index.mjs
var n2 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/i;
var o2 = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
var i2 = /[\s\n\\/='"\0<>]/;
var l2 = /^xlink:?./;
var a2 = /["&<]/;
function s2(e3) {
  if (false === a2.test(e3 += ""))
    return e3;
  for (var t3 = 0, r3 = 0, n3 = "", o5 = ""; r3 < e3.length; r3++) {
    switch (e3.charCodeAt(r3)) {
      case 34:
        o5 = "&quot;";
        break;
      case 38:
        o5 = "&amp;";
        break;
      case 60:
        o5 = "&lt;";
        break;
      default:
        continue;
    }
    r3 !== t3 && (n3 += e3.slice(t3, r3)), n3 += o5, t3 = r3 + 1;
  }
  return r3 !== t3 && (n3 += e3.slice(t3, r3)), n3;
}
var f2 = function(e3, t3) {
  return String(e3).replace(/(\n+)/g, "$1" + (t3 || "	"));
};
var u2 = function(e3, t3, r3) {
  return String(e3).length > (t3 || 40) || !r3 && -1 !== String(e3).indexOf("\n") || -1 !== String(e3).indexOf("<");
};
var c2 = {};
var _2 = /([A-Z])/g;
function p2(e3) {
  var t3 = "";
  for (var r3 in e3) {
    var o5 = e3[r3];
    null != o5 && "" !== o5 && (t3 && (t3 += " "), t3 += "-" == r3[0] ? r3 : c2[r3] || (c2[r3] = r3.replace(_2, "-$1").toLowerCase()), t3 = "number" == typeof o5 && false === n2.test(r3) ? t3 + ": " + o5 + "px;" : t3 + ": " + o5 + ";");
  }
  return t3 || void 0;
}
function d(e3, t3) {
  return Array.isArray(t3) ? t3.reduce(d, e3) : null != t3 && false !== t3 && e3.push(t3), e3;
}
function v2() {
  this.__d = true;
}
function h2(e3, t3) {
  return { __v: e3, context: t3, props: e3.props, setState: v2, forceUpdate: v2, __d: true, __h: [] };
}
function g2(e3, t3) {
  var r3 = e3.contextType, n3 = r3 && t3[r3.__c];
  return null != r3 ? n3 ? n3.props.value : r3.__ : t3;
}
var y2 = [];
function m2(r3, n3, a4, c4, _4, v4) {
  if (null == r3 || "boolean" == typeof r3)
    return "";
  if ("object" != typeof r3)
    return "function" == typeof r3 ? "" : s2(r3);
  var b4 = a4.pretty, x3 = b4 && "string" == typeof b4 ? b4 : "	";
  if (Array.isArray(r3)) {
    for (var k4 = "", S3 = 0; S3 < r3.length; S3++)
      b4 && S3 > 0 && (k4 += "\n"), k4 += m2(r3[S3], n3, a4, c4, _4, v4);
    return k4;
  }
  if (void 0 !== r3.constructor)
    return "";
  var w4, C3 = r3.type, O3 = r3.props, j3 = false;
  if ("function" == typeof C3) {
    if (j3 = true, !a4.shallow || !c4 && false !== a4.renderRootComponent) {
      if (C3 === _) {
        var A3 = [];
        return d(A3, r3.props.children), m2(A3, n3, a4, false !== a4.shallowHighOrder, _4, v4);
      }
      var F2, H2 = r3.__c = h2(r3, n3);
      l.__b && l.__b(r3);
      var M2 = l.__r;
      if (C3.prototype && "function" == typeof C3.prototype.render) {
        var L2 = g2(C3, n3);
        (H2 = r3.__c = new C3(O3, L2)).__v = r3, H2._dirty = H2.__d = true, H2.props = O3, null == H2.state && (H2.state = {}), null == H2._nextState && null == H2.__s && (H2._nextState = H2.__s = H2.state), H2.context = L2, C3.getDerivedStateFromProps ? H2.state = Object.assign({}, H2.state, C3.getDerivedStateFromProps(H2.props, H2.state)) : H2.componentWillMount && (H2.componentWillMount(), H2.state = H2._nextState !== H2.state ? H2._nextState : H2.__s !== H2.state ? H2.__s : H2.state), M2 && M2(r3), F2 = H2.render(H2.props, H2.state, H2.context);
      } else
        for (var T2 = g2(C3, n3), E2 = 0; H2.__d && E2++ < 25; )
          H2.__d = false, M2 && M2(r3), F2 = C3.call(r3.__c, O3, T2);
      return H2.getChildContext && (n3 = Object.assign({}, n3, H2.getChildContext())), l.diffed && l.diffed(r3), m2(F2, n3, a4, false !== a4.shallowHighOrder, _4, v4);
    }
    C3 = (w4 = C3).displayName || w4 !== Function && w4.name || function(e3) {
      var t3 = (Function.prototype.toString.call(e3).match(/^\s*function\s+([^( ]+)/) || "")[1];
      if (!t3) {
        for (var r4 = -1, n4 = y2.length; n4--; )
          if (y2[n4] === e3) {
            r4 = n4;
            break;
          }
        r4 < 0 && (r4 = y2.push(e3) - 1), t3 = "UnnamedComponent" + r4;
      }
      return t3;
    }(w4);
  }
  var $2, D2, N2 = "<" + C3;
  if (O3) {
    var P2 = Object.keys(O3);
    a4 && true === a4.sortAttributes && P2.sort();
    for (var W = 0; W < P2.length; W++) {
      var I2 = P2[W], R = O3[I2];
      if ("children" !== I2) {
        if (!i2.test(I2) && (a4 && a4.allAttributes || "key" !== I2 && "ref" !== I2 && "__self" !== I2 && "__source" !== I2)) {
          if ("defaultValue" === I2)
            I2 = "value";
          else if ("defaultChecked" === I2)
            I2 = "checked";
          else if ("defaultSelected" === I2)
            I2 = "selected";
          else if ("className" === I2) {
            if (void 0 !== O3.class)
              continue;
            I2 = "class";
          } else
            _4 && l2.test(I2) && (I2 = I2.toLowerCase().replace(/^xlink:?/, "xlink:"));
          if ("htmlFor" === I2) {
            if (O3.for)
              continue;
            I2 = "for";
          }
          "style" === I2 && R && "object" == typeof R && (R = p2(R)), "a" === I2[0] && "r" === I2[1] && "boolean" == typeof R && (R = String(R));
          var U = a4.attributeHook && a4.attributeHook(I2, R, n3, a4, j3);
          if (U || "" === U)
            N2 += U;
          else if ("dangerouslySetInnerHTML" === I2)
            D2 = R && R.__html;
          else if ("textarea" === C3 && "value" === I2)
            $2 = R;
          else if ((R || 0 === R || "" === R) && "function" != typeof R) {
            if (!(true !== R && "" !== R || (R = I2, a4 && a4.xml))) {
              N2 = N2 + " " + I2;
              continue;
            }
            if ("value" === I2) {
              if ("select" === C3) {
                v4 = R;
                continue;
              }
              "option" === C3 && v4 == R && void 0 === O3.selected && (N2 += " selected");
            }
            N2 = N2 + " " + I2 + '="' + s2(R) + '"';
          }
        }
      } else
        $2 = R;
    }
  }
  if (b4) {
    var V = N2.replace(/\n\s*/, " ");
    V === N2 || ~V.indexOf("\n") ? b4 && ~N2.indexOf("\n") && (N2 += "\n") : N2 = V;
  }
  if (N2 += ">", i2.test(C3))
    throw new Error(C3 + " is not a valid HTML tag name in " + N2);
  var q3, z2 = o2.test(C3) || a4.voidElements && a4.voidElements.test(C3), Z = [];
  if (D2)
    b4 && u2(D2) && (D2 = "\n" + x3 + f2(D2, x3)), N2 += D2;
  else if (null != $2 && d(q3 = [], $2).length) {
    for (var B3 = b4 && ~N2.indexOf("\n"), G2 = false, J = 0; J < q3.length; J++) {
      var K = q3[J];
      if (null != K && false !== K) {
        var Q = m2(K, n3, a4, true, "svg" === C3 || "foreignObject" !== C3 && _4, v4);
        if (b4 && !B3 && u2(Q) && (B3 = true), Q)
          if (b4) {
            var X = Q.length > 0 && "<" != Q[0];
            G2 && X ? Z[Z.length - 1] += Q : Z.push(Q), G2 = X;
          } else
            Z.push(Q);
      }
    }
    if (b4 && B3)
      for (var Y = Z.length; Y--; )
        Z[Y] = "\n" + x3 + f2(Z[Y], x3);
  }
  if (Z.length || D2)
    N2 += Z.join("");
  else if (a4 && a4.xml)
    return N2.substring(0, N2.length - 1) + " />";
  return !z2 || q3 || D2 ? (b4 && ~N2.indexOf("\n") && (N2 += "\n"), N2 = N2 + "</" + C3 + ">") : N2 = N2.replace(/>$/, " />"), N2;
}
var b2 = { shallow: true };
S2.render = S2;
var x2 = function(e3, t3) {
  return S2(e3, t3, b2);
};
var k2 = [];
function S2(n3, o5, i4) {
  o5 = o5 || {};
  var l4 = l.__s;
  l.__s = true;
  var a4, s3 = y(_, null);
  return s3.__k = [n3], a4 = i4 && (i4.pretty || i4.voidElements || i4.sortAttributes || i4.shallow || i4.allAttributes || i4.xml || i4.attributeHook) ? m2(n3, o5, i4) : F(n3, o5, false, void 0, s3), l.__c && l.__c(n3, k2), l.__s = l4, k2.length = 0, a4;
}
function w2(e3) {
  return null == e3 || "boolean" == typeof e3 ? null : "string" == typeof e3 || "number" == typeof e3 || "bigint" == typeof e3 ? y(null, null, e3) : e3;
}
function C2(e3, t3) {
  return "className" === e3 ? "class" : "htmlFor" === e3 ? "for" : "defaultValue" === e3 ? "value" : "defaultChecked" === e3 ? "checked" : "defaultSelected" === e3 ? "selected" : t3 && l2.test(e3) ? e3.toLowerCase().replace(/^xlink:?/, "xlink:") : e3;
}
function O2(e3, t3) {
  return "style" === e3 && null != t3 && "object" == typeof t3 ? p2(t3) : "a" === e3[0] && "r" === e3[1] && "boolean" == typeof t3 ? String(t3) : t3;
}
var j = Array.isArray;
var A2 = Object.assign;
function F(r3, n3, l4, a4, f4) {
  if (null == r3 || true === r3 || false === r3 || "" === r3)
    return "";
  if ("object" != typeof r3)
    return "function" == typeof r3 ? "" : s2(r3);
  if (j(r3)) {
    var u4 = "";
    f4.__k = r3;
    for (var c4 = 0; c4 < r3.length; c4++)
      u4 += F(r3[c4], n3, l4, a4, f4), r3[c4] = w2(r3[c4]);
    return u4;
  }
  if (void 0 !== r3.constructor)
    return "";
  r3.__ = f4, l.__b && l.__b(r3);
  var _4 = r3.type, p4 = r3.props;
  if ("function" == typeof _4) {
    var d3;
    if (_4 === _)
      d3 = p4.children;
    else {
      d3 = _4.prototype && "function" == typeof _4.prototype.render ? function(e3, r4) {
        var n4 = e3.type, o5 = g2(n4, r4), i4 = new n4(e3.props, o5);
        e3.__c = i4, i4.__v = e3, i4.__d = true, i4.props = e3.props, null == i4.state && (i4.state = {}), null == i4.__s && (i4.__s = i4.state), i4.context = o5, n4.getDerivedStateFromProps ? i4.state = A2({}, i4.state, n4.getDerivedStateFromProps(i4.props, i4.state)) : i4.componentWillMount && (i4.componentWillMount(), i4.state = i4.__s !== i4.state ? i4.__s : i4.state);
        var l5 = l.__r;
        return l5 && l5(e3), i4.render(i4.props, i4.state, i4.context);
      }(r3, n3) : function(e3, r4) {
        var n4, o5 = h2(e3, r4), i4 = g2(e3.type, r4);
        e3.__c = o5;
        for (var l5 = l.__r, a5 = 0; o5.__d && a5++ < 25; )
          o5.__d = false, l5 && l5(e3), n4 = e3.type.call(o5, e3.props, i4);
        return n4;
      }(r3, n3);
      var v4 = r3.__c;
      v4.getChildContext && (n3 = A2({}, n3, v4.getChildContext()));
    }
    var y4 = F(d3 = null != d3 && d3.type === _ && null == d3.key ? d3.props.children : d3, n3, l4, a4, r3);
    return l.diffed && l.diffed(r3), r3.__ = void 0, l.unmount && l.unmount(r3), y4;
  }
  var m4, b4, x3 = "<";
  if (x3 += _4, p4)
    for (var k4 in m4 = p4.children, p4) {
      var S3 = p4[k4];
      if (!("key" === k4 || "ref" === k4 || "__self" === k4 || "__source" === k4 || "children" === k4 || "className" === k4 && "class" in p4 || "htmlFor" === k4 && "for" in p4 || i2.test(k4))) {
        if (S3 = O2(k4 = C2(k4, l4), S3), "dangerouslySetInnerHTML" === k4)
          b4 = S3 && S3.__html;
        else if ("textarea" === _4 && "value" === k4)
          m4 = S3;
        else if ((S3 || 0 === S3 || "" === S3) && "function" != typeof S3) {
          if (true === S3 || "" === S3) {
            S3 = k4, x3 = x3 + " " + k4;
            continue;
          }
          if ("value" === k4) {
            if ("select" === _4) {
              a4 = S3;
              continue;
            }
            "option" !== _4 || a4 != S3 || "selected" in p4 || (x3 += " selected");
          }
          x3 = x3 + " " + k4 + '="' + s2(S3) + '"';
        }
      }
    }
  var H2 = x3;
  if (x3 += ">", i2.test(_4))
    throw new Error(_4 + " is not a valid HTML tag name in " + x3);
  var M2 = "", L2 = false;
  if (b4)
    M2 += b4, L2 = true;
  else if ("string" == typeof m4)
    M2 += s2(m4), L2 = true;
  else if (j(m4)) {
    r3.__k = m4;
    for (var T2 = 0; T2 < m4.length; T2++) {
      var E2 = m4[T2];
      if (m4[T2] = w2(E2), null != E2 && false !== E2) {
        var $2 = F(E2, n3, "svg" === _4 || "foreignObject" !== _4 && l4, a4, r3);
        $2 && (M2 += $2, L2 = true);
      }
    }
  } else if (null != m4 && false !== m4 && true !== m4) {
    r3.__k = [w2(m4)];
    var D2 = F(m4, n3, "svg" === _4 || "foreignObject" !== _4 && l4, a4, r3);
    D2 && (M2 += D2, L2 = true);
  }
  if (l.diffed && l.diffed(r3), r3.__ = void 0, l.unmount && l.unmount(r3), L2)
    x3 += M2;
  else if (o2.test(_4))
    return H2 + " />";
  return x3 + "</" + _4 + ">";
}
S2.shallowRender = x2;

// node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r2;
var u3;
var i3;
var o3 = 0;
var f3 = [];
var c3 = [];
var e2 = l.__b;
var a3 = l.__r;
var v3 = l.diffed;
var l3 = l.__c;
var m3 = l.unmount;
function d2(t3, u4) {
  l.__h && l.__h(r2, t3, o3 || u4), o3 = 0;
  var i4 = r2.__H || (r2.__H = { __: [], __h: [] });
  return t3 >= i4.__.length && i4.__.push({ __V: c3 }), i4.__[t3];
}
function p3(n3) {
  return o3 = 1, y3(B2, n3);
}
function y3(n3, u4, i4) {
  var o5 = d2(t2++, 2);
  if (o5.t = n3, !o5.__c && (o5.__ = [i4 ? i4(u4) : B2(void 0, u4), function(n4) {
    var t3 = o5.__N ? o5.__N[0] : o5.__[0], r3 = o5.t(t3, n4);
    t3 !== r3 && (o5.__N = [r3, o5.__[1]], o5.__c.setState({}));
  }], o5.__c = r2, !r2.u)) {
    r2.u = true;
    var f4 = r2.shouldComponentUpdate;
    r2.shouldComponentUpdate = function(n4, t3, r3) {
      if (!o5.__c.__H)
        return true;
      var u5 = o5.__c.__H.__.filter(function(n5) {
        return n5.__c;
      });
      if (u5.every(function(n5) {
        return !n5.__N;
      }))
        return !f4 || f4.call(this, n4, t3, r3);
      var i5 = false;
      return u5.forEach(function(n5) {
        if (n5.__N) {
          var t4 = n5.__[0];
          n5.__ = n5.__N, n5.__N = void 0, t4 !== n5.__[0] && (i5 = true);
        }
      }), !(!i5 && o5.__c.props === n4) && (!f4 || f4.call(this, n4, t3, r3));
    };
  }
  return o5.__N || o5.__;
}
function q2(n3) {
  var u4 = r2.context[n3.__c], i4 = d2(t2++, 9);
  return i4.c = n3, u4 ? (null == i4.__ && (i4.__ = true, u4.sub(r2)), u4.props.value) : n3.__;
}
function b3() {
  for (var t3; t3 = f3.shift(); )
    if (t3.__P && t3.__H)
      try {
        t3.__H.__h.forEach(k3), t3.__H.__h.forEach(w3), t3.__H.__h = [];
      } catch (r3) {
        t3.__H.__h = [], l.__e(r3, t3.__v);
      }
}
l.__b = function(n3) {
  r2 = null, e2 && e2(n3);
}, l.__r = function(n3) {
  a3 && a3(n3), t2 = 0;
  var i4 = (r2 = n3.__c).__H;
  i4 && (u3 === r2 ? (i4.__h = [], r2.__h = [], i4.__.forEach(function(n4) {
    n4.__N && (n4.__ = n4.__N), n4.__V = c3, n4.__N = n4.i = void 0;
  })) : (i4.__h.forEach(k3), i4.__h.forEach(w3), i4.__h = [])), u3 = r2;
}, l.diffed = function(t3) {
  v3 && v3(t3);
  var o5 = t3.__c;
  o5 && o5.__H && (o5.__H.__h.length && (1 !== f3.push(o5) && i3 === l.requestAnimationFrame || ((i3 = l.requestAnimationFrame) || j2)(b3)), o5.__H.__.forEach(function(n3) {
    n3.i && (n3.__H = n3.i), n3.__V !== c3 && (n3.__ = n3.__V), n3.i = void 0, n3.__V = c3;
  })), u3 = r2 = null;
}, l.__c = function(t3, r3) {
  r3.some(function(t4) {
    try {
      t4.__h.forEach(k3), t4.__h = t4.__h.filter(function(n3) {
        return !n3.__ || w3(n3);
      });
    } catch (u4) {
      r3.some(function(n3) {
        n3.__h && (n3.__h = []);
      }), r3 = [], l.__e(u4, t4.__v);
    }
  }), l3 && l3(t3, r3);
}, l.unmount = function(t3) {
  m3 && m3(t3);
  var r3, u4 = t3.__c;
  u4 && u4.__H && (u4.__H.__.forEach(function(n3) {
    try {
      k3(n3);
    } catch (n4) {
      r3 = n4;
    }
  }), u4.__H = void 0, r3 && l.__e(r3, u4.__v));
};
var g3 = "function" == typeof requestAnimationFrame;
function j2(n3) {
  var t3, r3 = function() {
    clearTimeout(u4), g3 && cancelAnimationFrame(t3), setTimeout(n3);
  }, u4 = setTimeout(r3, 100);
  g3 && (t3 = requestAnimationFrame(r3));
}
function k3(n3) {
  var t3 = r2, u4 = n3.__c;
  "function" == typeof u4 && (n3.__c = void 0, u4()), r2 = t3;
}
function w3(n3) {
  var t3 = r2;
  n3.__c = n3.__(), r2 = t3;
}
function B2(n3, t3) {
  return "function" == typeof t3 ? t3(n3) : t3;
}

// node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var _3 = 0;
function o4(o5, e3, n3, t3, f4, l4) {
  var s3, u4, a4 = {};
  for (u4 in e3)
    "ref" == u4 ? s3 = e3[u4] : a4[u4] = e3[u4];
  var i4 = { type: o5, props: a4, key: n3, ref: s3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: --_3, __source: f4, __self: l4 };
  if ("function" == typeof o5 && (s3 = o5.defaultProps))
    for (u4 in s3)
      void 0 === a4[u4] && (a4[u4] = s3[u4]);
  return l.vnode && l.vnode(i4), i4;
}

// client/pages/home/Counter.jsx
function Counter({ initialState = 0 }) {
  const [count, setCount] = p3(initialState);
  return /* @__PURE__ */ o4("button", { type: "button", onClick: () => setCount((count2) => count2 + 1), children: [
    "Counter ",
    count
  ] });
}

// client/layouts/preact-logo.svg
var preact_logo_default = "/public/preact-logo-NGGHNJPX.svg";

// client/usePageContext.jsx
var Context = G(void 0);
function PageContextProvider({ pageContext, children }) {
  return /* @__PURE__ */ o4(Context.Provider, { value: pageContext, children });
}
function usePageContext() {
  const pageContext = q2(Context);
  return pageContext;
}

// client/layouts/Link.jsx
function Link(props) {
  const pageContext = usePageContext();
  const className = [props.className, pageContext.urlPathname === props.href && "is-active"].filter(Boolean).join(" ");
  return /* @__PURE__ */ o4("a", { ...props, className });
}

// client/layouts/HomeLayout.jsx
var HomeLayout = function({ children, pageContext }) {
  return /* @__PURE__ */ o4(PageContextProvider, { pageContext, children: /* @__PURE__ */ o4(Layout, { children: [
    /* @__PURE__ */ o4(Sidebar, { children: [
      /* @__PURE__ */ o4(Logo, {}),
      /* @__PURE__ */ o4(Link, { className: "navitem", href: "/", children: "Home" }),
      /* @__PURE__ */ o4(Link, { className: "navitem", href: "/about", children: "About" })
    ] }),
    /* @__PURE__ */ o4(Content, { children })
  ] }) });
};
var Layout = function({ children }) {
  return /* @__PURE__ */ o4(
    "div",
    {
      style: {
        display: "flex",
        maxWidth: 900,
        margin: "auto"
      },
      children
    }
  );
};
var Sidebar = function({ children }) {
  return /* @__PURE__ */ o4(
    "div",
    {
      style: {
        padding: 20,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: "1.8em"
      },
      children
    }
  );
};
var Content = function({ children }) {
  return /* @__PURE__ */ o4(
    "div",
    {
      id: "page-content",
      style: {
        padding: 20,
        paddingBottom: 50,
        borderLeft: "2px solid #eee",
        minHeight: "100vh"
      },
      children
    }
  );
};
function Logo() {
  return /* @__PURE__ */ o4(
    "div",
    {
      style: {
        marginTop: 20,
        marginBottom: 10
      },
      children: /* @__PURE__ */ o4("a", { href: "/", children: /* @__PURE__ */ o4("img", { src: preact_logo_default, height: 64, width: 64, alt: "logo" }) })
    }
  );
}

// client/pages/home/home.page.jsx
function Page({ pageContext }) {
  return /* @__PURE__ */ o4(HomeLayout, { pageContext, children: [
    /* @__PURE__ */ o4("h1", { children: "Welcome" }),
    "This page is:",
    /* @__PURE__ */ o4("ul", { children: [
      /* @__PURE__ */ o4("li", { children: "Rendered to HTML." }),
      /* @__PURE__ */ o4("li", { children: [
        "Interactive. ",
        /* @__PURE__ */ o4(Counter, { initialState: pageContext.counter })
      ] })
    ] })
  ] });
}
if (typeof window !== "undefined") {
  const body = document.querySelector("body");
  E(/* @__PURE__ */ o4(Page, { pageContext: window.pageContext }), body);
}
function pageToHtml(pageContext) {
  return S2(/* @__PURE__ */ o4(Page, { pageContext }));
}
// Export renderPage globally for C++ wrapper to call
globalThis.renderPage = function(jsonString) {
    return pageToHtml(JSON.parse(jsonString));
};
