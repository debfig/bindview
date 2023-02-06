/*！ 
 * bindview.js JavaScript Library v1.0.0
 * url: https://github.com/debfig/bindview
 * 
 * forfatter: 灿烈
 * Data: 2023/2/6
 * 
 * Released under the MIT license
 * description: bindview.js是一个使用虚拟dom来创建真实dom,并实现了模型与视图绑定的javascript库 
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
          throw new Error("bindview.js 需要一个 window 和 document");
        }
        return factory(w);
      };
  } else {
    factory(window);
  }
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
  "use strict";

  /**
   * Bindview构造函数
   * @param {Object} config 初始化配置对象
   */
  function Bindview(config) {
    if (config instanceof Object) {
      this._init(config)
    }
  }

  // 构造函数版本属性
  Bindview.version = '1.0.0'


  /**
   * 原型初始化函数
   * @param {Object} config 初始化配置对象
   */
  Bindview.prototype._init = function (config) {
    let bv = this
    bv.el = typeof config.el == 'string' ? document.querySelector(config.el) : console.error(`[Bindview] error el is null`);
    bv.el.key = 'root';
    bv.data = new Object();
    bv._DataBroker(bv.data, config.data instanceof Object ? config.data : console.error(`[Bindview] error data is null`), bv._Callback)
  }


  /**
   * 数据代理函数
   * @param {Object} object 数据代理对象 
   * @param {Object} value 配置对象
   * @param {Function} fun 回调函数
   * @param {Boolean} [state] 初始化时是否调用回调函数 
   */
  Bindview.prototype._DataBroker = function (object, value, fun, state = true) {
    //内部函数方便自调用
    let DataMonitor = function (d_object, d_value, d_fun) {
      //设置get和set 函数
      function monitor(object, i, addobject) {
        Object.defineProperty(object, i, {
          enumerable: true,
          get() {
            return addobject;
          },
          set(val) {
            addobject = val;
            d_fun(i);
          }
        });
        //改变方法的 this 指向
        if (typeof addobject == 'function') {
          object[i].call(object);
        }
      };
      //数组API劫持 函数
      function ArrayBroker(arr, funs) {
        let newPrototype = Object.create(Array.prototype);
        let methods = ["push", "pop", "shift", "unshift", "reverse", "sort", "splice"];
        methods.forEach(method => {
          newPrototype[method] = function (...args) {
            //! 关键部分 我们使用延时定时器将函数调用由同步变为异步操作
            //! 这步是为了让对数组的的操作先执行，在执行函数的调用
            setTimeout(function () {
              funs(method);
            }, 0);

            let tempdata = args;
            let tempObj = new Object();
            //! 判断push操作
            if (method == 'push') {
              DataMonitor(tempObj, ...tempdata, funs(method));
            }

            tempdata = [tempObj];
            return Array.prototype[method].call(this, ...tempdata);
          };
        });
        arr.__proto__ = newPrototype;
        //判断数组中是否有对象和数组如果有进行get set和数组监听
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] instanceof Array) {
            ArrayBroker(arr[i], funs);
          } else if (arr[i] instanceof HTMLElement ? false : (arr[i] instanceof Object) && (typeof arr[i] == 'object')) {
            let temp = arr[i];
            arr[i] = new Object();
            arr[i].__proto__ = temp.__proto__;
            DataMonitor(arr[i], temp, funs);
          }
        }
      };

      //判断数据类型并做对应操作 分为 数组 Dom对象 对象 其他
      for (let i in d_value) {
        //for in 会遍历对象原型上自定义的方法
        //使用 hasOwnProperty 来判断是否是对象上自生的
        if (d_value.hasOwnProperty(i)) {
          if (d_value[i] instanceof Array) {
            //!数组解构赋值防止对原数组的更改
            monitor(d_object, i, [...d_value[i]]);
            ArrayBroker(d_object[i], d_fun);
          } else if (d_value[i] instanceof HTMLElement) {
            monitor(d_object, i, d_value[i]);
          } else if ((d_value[i] instanceof Object) && (typeof d_value[i] == 'object')) {
            // 给节点属性添加唯一标识
            d_value[i].data = `${crypto.randomUUID()}`;
            monitor(d_object, i, new Object());
            d_object[i].__proto__ = d_value[i].__proto__;
            DataMonitor(d_object[i], d_value[i], d_fun);
          } else {
            monitor(d_object, i, d_value[i]);
          }
        }
      }
    };
    //调用一次
    DataMonitor(object, value, fun);
    if (state) { fun() };
  }


  /**
   * 数据代理中数据发生改变时调用的回调函数
   * @param {*} value 
   */
  Bindview.prototype._Callback = function (value) {

  }






  /**  
   * 向浏览器暴露构造函数
   */
  if (typeof noGlobal == "undefined") {
    window.Bindview = Bindview;
  }

  console.log(`%c bindview.js %c v${Bindview.version} `,
    'background: #35495e; padding: 1px; border-radius: 3px 0 0 3px; color: #fff;',
    'background: #41b883; padding: 1px; border-radius: 0 3px 3px 0; color: #fff',);

  return Bindview;
})