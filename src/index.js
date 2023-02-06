/*！ 
 * Vis.js JavaScript Library v1.0.0
 * url:
 * 
 * forfatter: 灿烈
 * Data: 2023/2/6
 * 
 * Released under the MIT license
 */
(function (window, factory) {
  "use strict";
  /* 使用严格模式 */

  /*  判断是CommonJS和类似CommonJS的环境还是浏览器环境  */
  if (typeof module === "object" && typeof module.exports === "object") {
    //判断如果存在document则执行工厂函数否则抛出错误
    module.exports = window.document ?
      factory(window, true) :
      function (w) {
        if (!w.document) {
          throw new Error("Vis.js 需要一个 window 和 document");
        }
        return factory(w);
      };
  } else {
    factory(window);
  }
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
  "use strict";

  function Vis() {

  }


  /* 
   * 向浏览器暴露构造函数
   */
  if (typeof noGlobal == "undefined") {
    window.Vis = Vis;
  }

  console.log(`%c Vis.js %c v1.0.0 `,
    'background: #35495e; padding: 1px; border-radius: 3px 0 0 3px; color: #fff;',
    'background: #41b883; padding: 1px; border-radius: 0 3px 3px 0; color: #fff',);

  return Vis;
})