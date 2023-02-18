## bindview.js
+ bindview.js是一个使用虚拟dom来创建真实dom,并实现了模型与视图绑定的javascript库

>### 1. 虚拟dom设计 
>虚拟dom使用js对象的方式来表示真实的dom结构,每个虚拟dom对象中都有4个属性发别为 `el` ,`attr`,`key`,`sonNode`,其中`key`是由`bindview.js`库来添加的使用中不需要书写,在虚拟dom对象中的`el`表示要创建的标签,`attr`表示标签中的属性,`sonNode`代表的是标签的子节点

```js
  {
    el: 'div',
    attr: { val: 'hello', style: { color: 'red' } },
    key: null, 
    sonNode: [
      {
        el: 'span',
        attr: { val: 'bindview' },
        key: null,
        sonNode: []
      }
    ]
  }
```
>### 2. bindview.js 例子
> 在bindview.js 的配置对象中 `el` 用来获取页面要渲染在那个根标签, `data` 用来存放页面中要使用到的数据, `node()` 函数是页面创建时需要的虚拟dom树 `bv` 形参是配置对象中的 `data`, `node()` 函数中的虚拟dom写法有下列两种，第一种是使用对象的形式来书写虚拟dom树,第二种是使用 `bv` 对象上的 `$h` 方法 传入特定参数就会返回一个虚拟dom对象, `$h` 方法有下列几种传参方式
```js
  const An = new Bindview({
    el: '#app',
    data: {
      title: 'hello Bindview.js'
    },
    node(bv) {
      return {
        el: 'ul',
        attr: {},
        sonNode: [
          {
            el:'li',
            attr:{val:'苹果'},
            sonNode:[]
          }
        ]
      }
    }
  })
```
```js
  const An = new Bindview({
    el: '#app',
    data: {
      title: 'hello Bindview.js',
    },
    node(bv) {
      return bv.$h('ul', {}, [
        bv.$h('li'),
        bv.$h('li', '苹果'),
        bv.$h('li', { val: '葡萄' }),
        bv.$h('li', bv.$h('span', '香蕉')),
        bv.$h('li', [bv.$h('span', '鸭梨')]),
        bv.$h('li', '菠萝', []),
        bv.$h('li', { val: '凤梨' }, []),
      ])
    },
  })
```
>### 3. methods配置对象和refs属性
>`methods`配置对象用来配置需要使用到的方法,可以在虚拟dom中添加`event:'click-add'`属性来添加一个`click`事件，触发事件调用`methods`配置对象中的`add`方法,  在虚拟dom中添加`ref`属性，构造函数实例上会添加一个`refs`属性,属性值就是添加了`ref`属性的虚拟dom元素所对应的真实`dom`元素 
```js
  const An = new Bindview({
    el: '#app',
    data: {
      title: 0,
    },
    node(bv) {
      return bv.$h('div', [
        bv.$h('p',{
          val:bv.title,
          ref:'p1'
        }),
        bv.$h('button',{
          val:'title++',
          event:'click-add'
        })
      ])
    },
    methods:{
      add(_,bv){
        bv.data.title++
      }
    }
  })
```
>### 4. 生命周期函数
>生命周期函数需要写在 `life` 配置对象中

|函数名|使用|
|:---:|:---:|
|`initData`|data 数据初始化前|
|`initVnode`|虚拟dom树初始化前|
|`createDom`|dom元素挂载后|
|`upDate`|data更新后|
```js
  const An = new Bindview({
    el: '#app',
    data: {
      title: 0,
    },
    node(bv) {
      return bv.$h('div', [
        bv.$h('p', bv.title),
        bv.$h('button', {
          val: '++',
          event: 'click-add'
        })
      ])
    },
    methods: {
      add(_, bv) {
        bv.data.title++
      }
    },
    life: {
      initData() {
      },
      initVnode() { },
      createDom() { console.log(this); },
      upDate() {
        console.log(this.data.title);
      }
    }
  })
```
