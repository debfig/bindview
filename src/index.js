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
  };

  // 构造函数版本属性
  Bindview.version = '1.0.0';


  /**
   * 原型初始化函数
   * @param {Object} config 初始化配置对象
   */
  Bindview.prototype._init = function (config) {
    let bv = this
    bv.el = typeof config.el == 'string' ? document.querySelector(config.el) : config.el instanceof HTMLElement ? config.el : console.error(`[Bindview] error el is null`);
    bv.el.key = 'root';
    // 生命周期
    bv.life = config.life instanceof Object ? config.life : new Object();

    // 初始化 data 数据前
    if (bv.life.initData) { bv.life.initData.call(config) };
    bv.data = bv._VObject();
    bv._DataBroker(bv.data, config.data instanceof Object ? config.data : console.error(`[Bindview] error data is null`), bv._Callback);

    // 初始化虚拟dom树前
    if (bv.life.initVnode) { bv.life.initVnode.call(bv) };
    bv.Vnode = new Object();
    let node = config.node(bv.data)
    bv._VnodeResponse(bv.Vnode, config.node instanceof Object ? node : console.error(`[Bindview] error node is error`), bv._VnodeUpdate);

    //映射dom树
    bv.__proto__._Original.set('_Original_Vnode', config);
    // 方法初始化
    config.methods instanceof Object ? bv.methods = config.methods : null;
  };

  /**
   * 创建对象新的原型
   * @returns newPrototype
   */
  Bindview.prototype._VObject = function () {
    let TemplateObject = Object.create(Object.prototype);
    let temp = new Object;
    TemplateObject.$h = this.$h
    temp.__proto__ = TemplateObject
    return temp;
  };

  /**
 * 虚拟dom模板函数
 * @param {*} element 标签
 * @param {*} attrs 属性
 * @param {*} son 子元素
 * @returns {Object} 虚拟dom对象
 */
  Object.defineProperty(Bindview.prototype, '$h', {
    value: function () {
      function funtemp(a, b, c) {
        return {
          el: a,
          attr: b,
          sonNode: c
        }
      };

      let Template = {};
      switch (arguments.length) {
        case 1:
          if (typeof arguments[0] === 'string') {
            Template = funtemp(arguments[0], {}, []);
          }
          break;
        case 2:
          if (typeof arguments[0] === 'string') {
            if (typeof arguments[1] === 'string' || typeof arguments[1] === 'number') {
              Template = funtemp(arguments[0], { val: arguments[1] }, []);
            } else if (typeof arguments[1] === 'object' && arguments[1] instanceof Array) {
              Template = funtemp(arguments[0], {}, arguments[1]);
            } else if (typeof arguments[1] === 'object' && arguments[1] instanceof Object) {
              if (arguments[1].el) {
                Template = funtemp(arguments[0], {}, [arguments[1]]);
              } else {
                Template = funtemp(arguments[0], arguments[1], [])
              }
            }
          }
          break;
        case 3:
          if (typeof arguments[0] === 'string') {
            if (typeof arguments[2] === 'object' && arguments[2] instanceof Array) {
              if (typeof arguments[1] === 'string' || typeof arguments[1] === 'number') {
                Template = funtemp(arguments[0], { val: arguments[1] }, arguments[2]);
              } else if (typeof arguments[1] === 'object' && arguments[1] instanceof Object) {
                Template = funtemp(arguments[0], arguments[1], arguments[2]);
              }
            }
          }
          break;
      }
      return Template;
    },
    writable: true,
    enumerable: false,
    configurable: true
  });

  /**
   * 数据代理函数
   * @param {Object} object 数据代理对象 
   * @param {Object} value 配置对象
   * @param {Function} fun 回调函数
   * @param {Boolean} [state] 初始化时是否调用回调函数 
   */
  Bindview.prototype._DataBroker = function (object, value, fun, state = false) {
    let _this = this;
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
            d_fun.call(_this, object[i]);

            //data数据更新后
            if (_this.life.upDate) { _this.life.upDate.call(_this) };
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
  };


  /**
   * 虚拟dom数据代理
   * @param {*} object 数据代理对象
   * @param {*} value 配置对象
   * @param {*} fun 回调函数
   * @param {Boolean} [state] 初始化时是否调用回调函数 
   */
  Bindview.prototype._VnodeResponse = function (object, value, fun, state = true) {
    let _this = this;
    //内部函数方便自调用
    let DataMonitor = function (d_object, d_value, d_fun) {
      //设置get和set 函数
      function monitor(object, i, addobject) {
        // 对每个dom元素添加一个唯一的id
        if (object.el) {
          if (object.key == null) {
            object.key = crypto.randomUUID()
          }
        }
        Object.defineProperty(object, i, {
          enumerable: true,
          get() {
            return addobject;
          },
          set(val) {
            addobject = val;
            d_fun.call(_this, _this.Vnode, _this._oldVnode);
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
        if (d_value.hasOwnProperty(i)) {
          if (d_value[i] instanceof Array) {
            monitor(d_object, i, [...d_value[i]]);
            ArrayBroker(d_object[i], d_fun);
          } else if ((d_value[i] instanceof Object) && (typeof d_value[i] == 'object')) {
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
    if (state) { fun.call(this) };
  };

  // 原始dom树
  Bindview.prototype._Original = new Map();
  // 旧dom树
  Bindview.prototype._oldVnode = {};
  // 虚拟dom与真实dom键值映射
  Bindview.prototype._KeyMapping = new Map();


  /**
   * 代理数据更新回调函数
   */
  Bindview.prototype._Callback = function (key) {
    let Original = this._Original.get('_Original_Vnode').node(this.data);

    function bianli(newValue, oldValue) {
      newValue.key = oldValue.key;
      if (newValue.sonNode.length > 0) {
        for (let i = 0; i < newValue.sonNode.length; i++) {
          bianli(newValue.sonNode[i], oldValue.sonNode[i])
        }
      }
    }
    bianli(Original, this._oldVnode);

    this.Vnode = new Object();
    this._VnodeResponse(this.Vnode, Original, this._VnodeUpdate, false);
    this._VnodeUpdate(this.Vnode, this._oldVnode);
  };

  /**
   * 虚拟dom更新函数
   * @param {*} newVnode 新的虚拟dom树
   * @param {*} oldVnode 旧的虚拟dom树
   */
  Bindview.prototype._VnodeUpdate = function (newVnode, oldVnode) {
    let _this = this
    if (newVnode === undefined && oldVnode === undefined) {
      _this._deepClone(_this.__proto__._oldVnode, _this.Vnode)
      //渲染前清空父盒子
      this.el.innerHTML = ''
      function upview(FE, Node) {
        let fuNode = null;
        fuNode = _this._CreateNode(FE, Node.el, Node.attr, Node.key)
        if (Node.sonNode.length > 0) {
          for (let i of Node.sonNode) {
            upview(fuNode, i)
          }
        }
      }
      upview(this.el, this.Vnode);

      /**
       * Dom挂载后
       */
      if (_this.life.createDom) { _this.life.createDom.call(_this) };
      //元素绑定事件
      _this._BindEvent();
      // ref 获取dom元素
      _this._GetElement(_this);

    } else {
      // 新旧dom树比较
      _this._Diff(newVnode, oldVnode)
    }
  };

  /**
   * 将虚拟dom创建为真是dom
   * @param {HTMLElement} ParentElement 父元素
   * @param {String} ChildElement 子元素
   * @param {*} attr 属性
   * @returns 新元素
   */
  Bindview.prototype._CreateNode = function (ParentElement, ChildElement, attr, Key) {
    let NewNode = typeof ChildElement == 'string' ? document.createElement(ChildElement) : console.error(`[Bindview] error ${ChildElement}不正确！！`);
    let FatherNode = ParentElement instanceof HTMLElement ? ParentElement : console.error(`[Bindview] error ${ParentElement}不正确！！`);

    // 使用_KeyMapping使key键与真实dom进行映射
    this._KeyMapping.set(Key, NewNode);
    NewNode.key = Key;
    if (typeof attr == 'string' || typeof attr == 'number') {
      NewNode.innerText = attr
    } else if (typeof attr == 'object' && attr instanceof Object) {
      for (let val in attr) {
        if (val === 'val') {
          NewNode.innerText = attr[val]
        } else if (val === 'style') {
          for (let sty in attr[val]) {
            NewNode.style[sty] = attr[val][sty]
          }
        } else {
          NewNode.setAttribute(val, attr[val]);
        }
      }
    } else {
      console.error(`${attr}不正确！！`);
    }
    FatherNode.appendChild(NewNode);
    return NewNode
  };

  /**
   * 对象深拷贝函数
   * @param {*} news 新
   * @param {*} old 旧
   */
  Bindview.prototype._deepClone = function (news, old) {
    for (let k in old) {
      if (typeof old[k] === 'object' && old[k] instanceof Array) {
        news[k] = [];
        for (let i = 0; i < old[k].length; i++) {
          news[k][i] = {};
          this._deepClone(news[k][i], old[k][i])
        }
      } else if (typeof old[k] === 'object' && old[k] instanceof Object) {
        news[k] = {};
        this._deepClone(news[k], old[k])
      } else {
        news[k] = old[k]
      }
    }
  };


  /**
   * diff算法更新虚拟dom改变的位置并映射到真实dom上
   * @param {*} newVnode 新的虚拟dom树
   * @param {*} oldVnode 旧的虚拟dom树
   */
  Bindview.prototype._Diff = function (newVnode, oldVnode) {
    // 更新视图
    function updateView(newVnodeobject) {
      let NewNode = this._KeyMapping.get(newVnodeobject.key);
      let attr = newVnodeobject.attr;
      for (let val in attr) {
        if (val === 'val') {
          NewNode.innerText = attr[val]
        } else if (val === 'style') {
          for (let sty in attr[val]) {
            NewNode.style[sty] = attr[val][sty]
          }
        } else {
          NewNode.setAttribute(val, attr[val]);
        }
      }
    }

    // 使用遍历依此比较两个dom对象之间的差异，并使用dom更新函数updateView更新真实dom

    for (let i in newVnode) {
      if (typeof newVnode[i] === 'object' && newVnode[i] instanceof Array) {
        for (let l = 0; l < newVnode[i].length; l++) {
          this._Diff(newVnode[i][l], oldVnode[i][l])
        }
      } else if (typeof newVnode[i] === 'object' && newVnode[i] instanceof Object) {
        for (let k in newVnode[i]) {
          if (typeof newVnode[i][k] === 'object' && newVnode[i][k] instanceof Object) {
            let temp = newVnode[i][k];
            for (let j in temp) {
              if (temp[j] !== oldVnode[i][k][j]) {
                //重新渲染
                updateView.call(this, newVnode);
                this._deepClone(oldVnode, newVnode);
              }
            }
          } else {
            if (newVnode[i][k] !== oldVnode[i][k]) {
              //重新渲染dom
              updateView.call(this, newVnode);
              this._deepClone(oldVnode, newVnode);
            }
          }
        }
      } else {
        if (newVnode[i] !== oldVnode[i]) {
          console.error(`[Bindview] error Cannot change el and key`);
        }
      }
    }
  };


  /**
   * 绑定事件
   */
  Bindview.prototype._BindEvent = function () {
    let _this = this;
    let domEvemt = [...this.el.querySelectorAll('[event]')];
    for (let i of domEvemt) {
      let temp = i.getAttribute('event').split('-');
      i.addEventListener(temp[0], function (e) {
        if (_this.methods[temp[1]]) {
          _this.methods[temp[1]].call(this, e, _this);
        } else {
          console.error(`[Ans] methods中没有${temp[1]} 方法`)
        }
      });
    }
  }


  /**
   * 获取dom元素
   * @param {*} bv this 
   */
  Bindview.prototype._GetElement = function (bv) {
    let DomElement = [...this.el.querySelectorAll('[ref]')];
    let temp = new Object();
    for (let i of DomElement) {
      temp[i.getAttribute('ref')] = this._KeyMapping.get(i.key);
    };
    DomElement = null;
    Object.values(temp).length > 0 ? bv.refs = temp : null;
  }


  /**  
   * 向浏览器暴露构造函数
   */
  if (typeof noGlobal == "undefined") {
    window.Bindview = Bindview;
  };

  console.log(`%c bindview.js %c v${Bindview.version} `,
    'background: #35495e; padding: 1px; border-radius: 3px 0 0 3px; color: #fff;',
    'background: #41b883; padding: 1px; border-radius: 0 3px 3px 0; color: #fff',);

  return Bindview;
})