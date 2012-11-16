(function(export_){
	var Xmzhu ={};
	//版本号
	Xmzhu.version = '0.0.0';
	
	var $ = Xmzhu.$ = export_.jQuery || export_.$ 
	export_.DEV ="OK";
	if(!$ || (export_.DEV != 'OK')){
		alert("Sorry! We need jQuery本插件是基于jQuery的,部分渲染工具可能不适用");
	}
	
	Xmzhu.Util = {};
	
	 var isArray  = Xmzhu.Util.isArray = function(isArrayItem){
		return Object.prototype.toString.call(isArrayItem) === "[object Array]";
	 }
	 
	 var makeArgArray = Xmzhu.Util.makeArgArray = function(args){
	 	return Array.prototype.slice.call(args, 0);
	 }
	
	 var findIndex = Xmzhu.Util.findIndex = function(array,value){
	 	 for ( var i = 0; i < array.length; i++ )
    		if ( array[ i ] === value )
    			return i;
    	return -1;
	 }
	 
	 if (typeof Object.create !== "function")
      Object.create = function(o) {
        function F() {}
        F.prototype = o;
        return new F();
      };
	 
	  var moduleKeywords = ["included", "extended"];
	 /**
	  * init 是构造函数可以重写
	  * initialize 是构造初始化，可被子类初始化的时候进行执行，如果2个归并则会造成递归死循环
	  */
	 var Class = Xmzhu.Class = {
	 	inherited:function(){},
	 	created:function(){},
	 	
	 	prototype: {
	      initialize: function(){},
	      init: function(){}
	    },
	    create: function(include, extend){
	     	
	      var object = Object.create(this);
	      object.parent    = this;
	      object.prototype = object.fn = Object.create(this.prototype);
	
	      if (include) object.include(include);
	      if (extend)  object.extend(extend);
	
	      object.created();
	      this.inherited(object);
	      return object;
	    },
	//这里需要实现继承能够优先执行super（）；
	    init: function(){
	      var instance = Object.create(this.prototype);
	      instance.parent = this;
	      instance.initialize.apply(instance, arguments);
	      instance.init.apply(instance, arguments);
	      instance._super = this.init;
	      return instance;
	    },

	    proxy: function(func){
	      var thisObject = this;
	      return(function(){ 
	        return func.apply(thisObject, arguments); 
	      });
	    },
	    
	    proxyAll: function(){
	      var functions = makeArgArray(arguments);
	      for (var i=0; i < functions.length; i++)
	        this[functions[i]] = this.proxy(this[functions[i]]);
	    },
	
	    include: function(obj){
	      for(var key in obj)
	        if (findIndex(moduleKeywords,key) === -1)
	          this.fn[key] = obj[key];
	      
	      var included = obj.included;
	      if (included) included.apply(this);
	      return this;
	    },
	
	    extend: function(obj){
	      for(var key in obj)
	        if (findIndex(moduleKeywords,key) === -1)
	          this[key] = obj[key];
	      
	      var extended = obj.extended;
	      if (extended) extended.apply(this);
	      return this;
	    }
	 }
  Class.prototype.proxy    = Class.proxy;
  Class.prototype.proxyAll = Class.proxyAll;
  Class.inst               = Class.init;
  Class.sub                = Class.create;	
  
  //事件，事件是关键
  var Observer = Xmzhu.Observer = {
  	//默认逗号分割
    bind: function(ev, callback,splitNode) {
      var splitNode_ = splitNode || ",";
      var evs   = ev.split(splitNode_);
      var calls = (this.hasOwnProperty("_callbacks") && this._callbacks) || 
                  (this._callbacks = {});
      
      for (var i=0; i < evs.length; i++)
        (calls[evs[i]] || (calls[evs[i]] = [])).push(callback);

      return this;
    },

    trigger: function() {
      var args = makeArgArray(arguments);
      var ev   = args.shift();
            
      var list, calls, i, l;
      if (!(calls = this.hasOwnProperty("_callbacks") && this._callbacks)) return false;
      if (!(list  = this._callbacks[ev])) return false;
      
      for (i = 0, l = list.length; i < l; i++)
        if (list[i].apply(this, args) === false)
          return false;

      return true;
    },
    
    unbind: function(ev, callback){
      if ( !ev ) {
        this._callbacks = {};
        return this;
      }
      
      var list, calls, i, l;
      if (!(calls = this._callbacks)) return this;
      if (!(list  = calls[ev])) return this;
      
      if ( !callback ) {
        delete this._callbacks[ev];
        return this;
      }
      
      for (i = 0, l = list.length; i < l; i++)
        if (callback === list[i]) {
          list = list.slice();
          list.splice(i, 1);
          calls[ev] = list;
          break;
        }
        
      return this;
    }
  };
  var Model = Xmzhu.Model = Class.create();
  Model.extend(Observer);
  Model.extend({
  	  createModel : function(name,atts){
  	  		var model = this.sub();
  	  		if(name) model.name = name;
  	  		if(atts) model.attributes  = atts;
  	  		return model;
  	  }	,
  	  created :function(sub){
  	  	this.records = [];
      	this.attributes = this.attributes ? 
      	  	makeArray(this.attributes) : [];
  	  },
  	  create: function(atts){
	      var record = this.init(atts);
	      return record.save();
   	 },
   	 loadAll : function(attrs){
  	 	 this.trigger("beforeLoadAll", this);
  	 	 this.trigger("onLoadAll", this);
  	 	 for(var i = 0 ; i < this.records.length ; i ++){
  	 		 this.records[i].newRecord = false;
  	 	 }
  	 	if(attrs){
  	 		for(var i = 0 ; i < this.records.length ; i ++){
  	  	 		 for(var key in attrs){
  	  	 			  if (findIndex(this.attributes,key) === -1){
  	  	 				  this.records[i][key] = attrs[key];
  	  	 			  }
  	  	 		 }
  	  	 	 } 
 	 	 }
  	 	 this.trigger("afterLoadAll", this);
  	 },
  	 loadPage : function(pageNum,pageSize){
  		 
  	 },
  	 all : function(){
  		var records = [];
  	    for(var i =0 ; i<this.records.length ; i++){
  	    	records.push(this.records[i].getAttributes())
  		}
  	 	return records;
  	 },
  	 fromJSON : function(data){
  	 	if(data == null  || !data) return ;
	    var results = [];
  	 	if(typeof data === 'string'){
  	 		//xmzhu: ie下缺少相应的JSON解析
  	 		if (typeof (JSON) == 'undefined')
			    data = eval(data);
			else
			    var data = JSON.parse(data);
  	 	}
  	 	 if ( isArray(data) ) {
	        for (var i=0; i < data.length; i++)
	          results.push(this.init(data[i]));
	        return results;
  	 	}
  	 	results.push(this.init(data));
  	 	return results
  	 },
  	 find: function(key,value){
  	  	for (var i = 0 ; i< this.records.length ; i++){
  	  		var record = this.records[i];
  	  		if(record[key] == value){
  	  			return  record;
  	  		}
  	  	}
  	  	return null;
  	 },
  	 findByObj:function(obj){
  		for (var i = 0 ; i< this.records.length ; i++){
  	  		var record = this.records[i];
  	  		var flag = true;
  	  		for(var j in obj){
  	  			if(record[j] != obj[j]) 
  	  				flag = false;
  	  		}
  	  		if(flag) return record;
  	  	}
  		return null;
  	 }
  })
  Model.include({
  	model: true,
    newRecord: true,
  	init : function(atts){
  		 if (atts) this.load(atts);
 	},
 	load: function(atts){
      for(var name in atts)
        this[name] = atts[name];
    },
    updateAttribute: function(name, value){
      this[name] = value;
      return this.save();
    },
    updateAttributes: function(atts){
      this.load(atts);
      return this.save();
    },
    getAttributes: function(){
      var result = {};
      for (var i=0; i < this.parent.attributes.length; i++) {
        var attr = this.parent.attributes[i];
        result[attr] = this[attr];
      }
      return result;
    },
   	save: function(key){
      this.trigger("beforeSave", this);
      var flag = this.newRecord ? this.create() : this.update(key);
      this.trigger("save", this);
      if(flag) return this;
      return false;
    },
    eql: function(rec){
      if(this.hashCode() == rec.hashCode()){
      	return(rec &&  rec.parent === this.parent);
      }
      return false;
    },
    updateCall : function(key) {
			this.trigger("beforeUpdate", this);
			var records = this.parent.records;
			var record = this.parent.find(key,this[key]);
			record.load(this.getAttributes());
			var clone = record.clone();
			this.trigger("update", clone);
			this.trigger("change", clone, "update");
			
		},
	create : function(){
  		this.trigger("beforeCreate", this);
  		this.newRecord = false;
		var records = this.parent.records;
		var record = this.parent.init(this.getAttributes());
		record.newRecord = false;
		records.push(record);  
		this.trigger("create", record.clone());
		this.trigger("change", record.clone(),'create');
  	},
  	load : function(data){
  		for(var name in data)
      	  this[name] = data[name];
  	},
  	clone: function(){
      return Object.create(this);
    },
    destroy: function(){
      this.trigger("beforeDestroy", this);
      var records = this.parent.records;
      for(var i in records){
      	if(records[i] == this)
      		records = records.splice(i,1);
      }
      this.destroyed = true;
      this.trigger("destroy", this);
      this.trigger("change", this, "destroy");
    },
    toJSON: function(){
      return (this.getAttributes());
    },
    hashCode : function(){
    	return this.getAttributes();
    },
  	bind: function(events, callback){
      return this.parent.bind(events, this.proxy(function(record){
        if ( record && this.eql(record) )
          callback.apply(this, arguments);
      }));
    },
    trigger: function(){
      return this.parent.trigger.apply(this.parent, arguments);
    }
  })	
  export_.Class = Xmzhu.Class;
  export_.ObserverClass = Xmzhu.Class.create(Xmzhu.Observer)
  export_.Util  = Xmzhu.Util;
  export_.Observer = Xmzhu.Observer;
  export_.Model =Xmzhu.Model;
})(window)
