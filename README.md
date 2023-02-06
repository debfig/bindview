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
>### 2. bindview.js构造函数的设计
>
```js
```