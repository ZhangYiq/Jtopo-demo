TopologyPanel = function(constructParam){
	this.$el = $('<div id="canvasContain">');
    var canvas = document.createElement('canvas');
    var menuCanvas = document.createElement('canvas');
    this.$el.append(menuCanvas);
    this.$el.append(canvas);
    var editForm = $('<div id="editForm" style="display:none;">');
    //节点名称
    var editFormNodeNameLabel = $('<label class = "editFormNodeLabel">').html('名称：');
    var editFormNodeNameInput = $('<input class = "editFormNodeInput">');
    var editFormNodeNameContain = $('<div>').addClass('editFormContain');
    editFormNodeNameContain.append(editFormNodeNameLabel).append(editFormNodeNameInput);
    //地址
    var editFormNodeAddressLabel = $('<label class = "editFormNodeLabel">').html('地址：');
    var editFormNodeAddressInput = $('<input class = "editFormNodeInput">');
    var editFormNodeAddressContain = $('<div>').addClass('editFormContain');
    editFormNodeAddressContain.append(editFormNodeAddressLabel).append(editFormNodeAddressInput);
    
    editForm.append(editFormNodeNameContain).append(editFormNodeAddressContain);
    var quickMenu = $('<div id="quickMenu" style="display:none;">');
    var quickMenuLi1 = $('<div class="quickMenuLi">');
    var quickMenuA1 = $('<label class="quickMenuA">').html('删除该节点');
    var quickMenuLi2 = $('<div class="quickMenuLi">');
    var quickMenuA2 = $('<label class="quickMenuA">').html('编辑');
    quickMenuLi1.append(quickMenuA1);
    quickMenuLi2.append(quickMenuA2);
    quickMenu.append(quickMenuLi1).append(quickMenuLi2);
    this.$el.append(editForm);
    this.$el.append(quickMenu);
    //用div元素做菜单栏测试
    var _this = this;
    
    canvas.width = 1400;
    canvas.height = 900;
    menuCanvas.width = 200;
    menuCanvas.height = 900;
    //当前选择的节点
    var currentNode;
    var menuStage = new JTopo.Stage(menuCanvas);
    var stage = new JTopo.Stage(canvas);
    var isDrag = false;
    
    //自动绘制的帧数/秒
    stage.frames = 10;
    menuStage.frames = 10;
    //鼠标滚轮缩放比例 
    stage.wheelZoom = 0.85
    //显示鹰眼
    stage.eagleEye.visible = true;	    
    this.scene = new JTopo.Scene();   
    this.menuScene = new JTopo.Scene(isDrag); 
    //鼠标操作模式 默认normal 有drag/select/edit
    this.scene.mode = "normal";
    this.scene.alpha = 0.5;
    //backgroundColor需要和alpha配合,实际上组成了"rgba(backgroundColor,alpha)",backgroundColor和background冲突,二者只能选择一个 
    //scene.backgroundColor = '150,150,150';
    this.scene.background = '/test-zyq/mainfrm/common/img/bg3.jpg';
    this.menuScene.background = '/test-zyq/mainfrm/common/img/bg3.jpg';
    this.nodeArray = [];
    //记录鼠标拖动的数据
	var isMouseDrag = false;
	var isOnEditPage = false;
	var testNewNode = null;
	
    //创建点的函数
    this.node = function(x, y, img,text,nodeInfo){
        var node = new JTopo.Node(text,nodeInfo);//text为节点名称，nodeInfo为节点信息 
        node.setImage('./img/statistics/' + img, true);                //节点自定义图片样式 
        node.setLocation(x, y);//节点在scene中的位置
        node.textPosition = 'Middle_Center';//节点名称的位置  
        _this.scene.add(node);//将节点添加进scene中 
        _this.nodeArray.push(node);
        node.childrenNode = [];
        node.fatherNode = [];
        return node;
    }
    //菜单栏新建节点
    this.menuNode = function(x, y, img,text,nodeInfo){
        var node = new JTopo.Node(text,nodeInfo);//text为节点名称，nodeInfo为节点信息 
        node.setImage('./img/statistics/' + img, true);                //节点自定义图片样式 
        node.setLocation(x, y);//节点在scene中的位置
        node.textPosition = 'Middle_Center';//节点名称的位置  
        _this.menuScene.add(node);//将节点添加进scene中 
        return node;
    } 
    //创建textNode
    this.textNode = function(x, y,nodeInfo){
        var node = new JTopo.TextNode(nodeInfo.text);//text为节点名称，nodeInfo为节点信息 
        node.font = 'bold '+nodeInfo.size+'px 微软雅黑';
        node.nodeInfo = nodeInfo;
        node.setLocation(x, y);//节点在scene中的位置
        //_this.scene.add(node);//将节点添加进scene中 
        _this.menuScene.add(node);//将节点添加进scene中 
        return node;
    }  
    //点和点之间的连接函数
    this.linkNode = function(nodeA, nodeZ, f){
    	nodeZ.childrenNode.push(nodeA);   
    	nodeA.fatherNode.push(nodeZ);     
        if(f){
        	nodeA.link = new JTopo.FoldLink(nodeA, nodeZ);
        }else{
        	nodeA.link = new JTopo.Link(nodeA, nodeZ);
        }
        nodeA.link.direction = 'vertical';
        _this.scene.add(nodeA.link);
        return nodeA.link;
    }
    //主机和虚拟机的连接函数
    this.hostLink = function(nodeA, nodeZ,status){
    	nodeZ.childrenNode.push(nodeA);   
    	nodeA.fatherNode.push(nodeZ);  
    	              
    	nodeA.link = new JTopo.FoldLink(nodeA, nodeZ);                
    	nodeA.link.shadow = false;
    	nodeA.link.offsetGap = 44;
        if(status == false)
        	nodeA.link.strokeColor = '255,255,0';
        _this.scene.add(nodeA.link);
        return nodeA.link;
    }
	//父节点拖动子节点跟着拖动
	var moveWithFather = function(fatherNode,xGap,yGap){
			for(var i=0;i<fatherNode.childrenNode.length;i++){
					var node = fatherNode.childrenNode[i];
					var endX = node.x+xGap;
					var endY = node.y+yGap;
					moveWithFather(node,xGap,yGap)
					node.setLocation(endX,endY);
				}
		}
	//修改节点的所属关系
	var deleteNodeFromFather = function(fatherNode,childNode){
			var newChildrenNode = [];
			for(var i=0;i<fatherNode.childrenNode.length;i++){
				if(childNode != fatherNode.childrenNode[i]){
					newChildrenNode.push(fatherNode.childrenNode[i]);
					}
				}
			fatherNode.childrenNode = newChildrenNode;
		}
	//删除数组中某一元素
	var deleteNodeFromNodeArray = function(node){
		var newNodeArray = [];
		for(var i=0;i<_this.nodeArray.length;i++){
			if(node != _this.nodeArray[i]){
				newNodeArray.push(_this.nodeArray[i]);
			}
		}
		_this.nodeArray = null;
		_this.nodeArray = newNodeArray;
	}
    //随机为每一个节点设置告警闪烁
	this.clockFunc = null;
    this.freshStatus = function(){
    	if(_this.clockFunc != null){
    		clearInterval(_this.clockFunc);
    		_this.clockFunc= null;
    	}
    	_this.clockFunc = setInterval(function(){
		    var temp = parseInt(_this.nodeArray.length*Math.random());
	    	var randomErrorNode = _this.nodeArray[temp];
	        if(randomErrorNode.alarm == '二级告警'){
	        	randomErrorNode.alarm = null;
	        }else{
	        	randomErrorNode.alarm = '二级告警';
	        }
	        for(var i=0;i<_this.nodeArray.length;i++){
				if(i!=temp){
					_this.nodeArray[i].alarm=null;
					}
	           	}
	    }, 500);
    }
    
    /*手动连接测试*/
	var beginNode = null;
    var tempNodeA = new JTopo.Node('tempA');;
    tempNodeA.setSize(1, 1);
    
    var tempNodeZ = new JTopo.Node('tempZ');;
    tempNodeZ.setSize(1, 1);
    
    var link = new JTopo.Link(tempNodeA, tempNodeZ);
    //鼠标点击事件
    this.scene.mouseup(function(e){
	    if(isMouseDrag == true){
	    	isMouseDrag = false;
	    	if(e.target!=null){
	    		if(e.target.nodeInfo != null){
	    		if(e.target.nodeInfo.move == false){
		    		return;
		    	}}else{
		    		return;
		    	}
	    	}
		    var endLocation={
		    	    x:null,
		    	    y:null
		    	}
	    	endLocation.x = e.target.x;
	    	endLocation.y = e.target.y;
	    	e.target.endLocation = endLocation;
	    	var xGap = e.target.endLocation.x - e.target.beginLocation.x;
	    	var yGap = e.target.endLocation.y - e.target.beginLocation.y;
			moveWithFather(e.target,xGap,yGap);
			return;
		 }
        if(e.button == 2){
        	editForm.hide();
        	beginNode = null;
        	isMouseDrag = false;
            _this.scene.remove(link);
            if(e.target != null){
            	if(e.target.nodeInfo != null){
            		currentNode = e.target;
                    quickMenu.css({
                        top: event.pageY-10,
                        left: event.pageX,
                    }).show();    	
            	}else{
            		quickMenu.hide();
            	}
            }else{
            	quickMenu.hide();
            }
            return;
        }
        if(e.target != null && e.target instanceof JTopo.Node){
        	if(e.target.nodeInfo != null){
        	if(e.target.nodeInfo.move == false){
        		if(e.target.nodeInfo.funcType != null){
        			switch(e.target.nodeInfo.funcType){
        				case 1:{
        					_this.freshTopology();
        					_this.$el.trigger("freshTopology");
        					break;
        				}
        			}
        		}
	    		return;
	    	}}
            if(beginNode == null){
            	if(e.target.nodeInfo.type != 1 && e.target.nodeInfo.newType == null){
	                beginNode = e.target;
		            _this.scene.add(link);
		            tempNodeA.setLocation(e.x, e.y);
		            tempNodeZ.setLocation(e.x, e.y);
            	}
            }else if(beginNode !== e.target){
                var endNode = e.target;
                //将桌面连接至主机
                if((beginNode.nodeInfo.type == 5 || beginNode.nodeInfo.type == 6) && endNode.nodeInfo.type == 3){
                	if(beginNode.link != null){
                		_this.scene.remove(beginNode.link);
	                	deleteNodeFromFather(beginNode.fatherNode[0],beginNode);
	                	beginNode.fatherNode = [];
                	}
                	_this.hostLink(beginNode,endNode,true);
	                beginNode = null;
	                _this.scene.remove(link);
	                return;
	            }
                //将主机连接至集群
                if((beginNode.nodeInfo.type == 3 || beginNode.nodeInfo.type == 4) && endNode.nodeInfo.type == 1){
                	if(beginNode.link != null){
                		_this.scene.remove(beginNode.link);
	                	deleteNodeFromFather(beginNode.fatherNode[0],beginNode);
	                	beginNode.fatherNode = [];
                	}
                	_this.linkNode(beginNode,endNode,true);
	                beginNode = null;
	                _this.scene.remove(link);
	                return;
	            }
            }else{
                beginNode = null;
            }
            if(e.target != editForm[0].JTopoNode){
            	editForm.hide();
            }
        }else{
        	editForm.hide();
        	quickMenu.hide();
        	beginNode = null;
        	isMouseDrag = false;
            _this.scene.remove(link);
            if(testNewNode != null){
            	testNewNode = null;
            }
        }
    });
    //鼠标点击事件
    _this.scene.mousedown(function(e){
    	//quickMenu.hide();
    	isMouseDrag = false;
    	if(e.target != null){
    		if(e.target.nodeInfo != null){
    		if(e.target.nodeInfo.move == false){
	    		return;
	    		}
    		}
    	}
        if(e.target == null || e.target === beginNode || e.target === link){
            _this.scene.remove(link);
        }
    });
    //鼠标拖动
    _this.scene.mousedrag(function(e){
        if(e.target != null && isMouseDrag == false){
        	//对于文字不可拖动，拖动的时候将其location还原
        	if(e.target.nodeInfo != null){
        	if(e.target.nodeInfo.move == false){
        		e.target.setLocation(e.target.nodeInfo.location.x,e.target.nodeInfo.location.y);
	    		return;
	    		}
        	}
        	if(e.target.nodeInfo != null){
        		isMouseDrag = true;
        	}
        	var beginLocation={
		    	    x:null,
		    	    y:null
		    	}
        	beginLocation.x = e.target.x;
        	beginLocation.y = e.target.y;
        	e.target.beginLocation = beginLocation;
        	//从新建区拖动新节点需要变大
        	if(e.target.nodeInfo != null){
        	if(e.target.nodeInfo.newType == 2){
        		e.target.setImage('./img/statistics/host.png', true);
        		_this.newHost();
        		e.target.nodeInfo.newType = null;
        	}else if(e.target.nodeInfo.newType == 3){
        		e.target.setImage('./img/statistics/cluster.png', true);
        		_this.newCluster();
        		e.target.nodeInfo.newType = null;
        	}else if(e.target.nodeInfo.newType == 4){
        		e.target.setImage('./img/statistics/storage.png', true);
        		_this.newStorage();
        		e.target.nodeInfo.newType = null;
        	}else if(e.target.nodeInfo.newType == 1){
        		_this.newDesk();
        		e.target.nodeInfo.newType = null;
        	}
        	}
           }else{
        	   if(e.target != null){
	        	   if(e.target.nodeInfo != null){
	   	        	if(e.target.nodeInfo.move == false){
	   	        		e.target.setLocation(e.target.nodeInfo.location.x,e.target.nodeInfo.location.y);
	   		    		return;
	   		    		}
	   	        	}
        	   }
           }
    });
    //菜单栏鼠标拖动事件
    _this.menuScene.mousedrag(function(e){
    	if(e.target!=null){
    		switch(e.target.nodeInfo.newType){
    			case 1:{
    				_this.menuNewDesk();break;
    			}
    			case 2:{
    				_this.menuNewHost();break;
    			}
    			case 3:{
    				_this.menuNewCluster();break;
    			}
    			case 4:{
    				_this.menuNewStorage();break;
    			}
    			case 5:{
    				_this.menuScene.remove(e.target);
    				_this.menuFreshFunc();
    				return;
    			}
    		}
    		if(e.pageX>160){
    			var newNode ={
    					yPosition:e.pageY,
    					nodeInfo:e.target.nodeInfo
    			}
    			_this.$el.trigger('newNodeFromMenu',newNode);
    			_this.menuScene.remove(e.target);
    		}
    	}else{
    		return;
    	}
    });
    //菜单栏点击事件
    //鼠标点击事件
    this.menuScene.mouseup(function(e){
        if(e.target != null && e.target instanceof JTopo.Node){
        	if(e.target.nodeInfo != null){
        	if(e.target.nodeInfo.move == false){
        		if(e.target.nodeInfo.funcType != null){
        			switch(e.target.nodeInfo.funcType){
        				case 1:{
        					_this.freshTopology();
        					_this.$el.trigger("freshTopology");
        					break;
        				}
        			}
        		}
	    		return;
	    	}}
        }
    });
    //鼠标移动
	var eventX = 0;
	var eventY = 0;
    _this.scene.mousemove(function(e){
    	eventX = event.pageX;
    	eventY = event.pageY;
    	tempNodeZ.setLocation(e.x, e.y);
    	if(testNewNode != null)
    		testNewNode.setLocation(e.x, e.y);
	    if(e.target != null && e.target instanceof JTopo.Node){
	    	if(e.target.nodeInfo != null){
		    	if(e.target.nodeInfo.move == false){
		    		return;
		    	}
		    	//悬浮显示菜单栏
//		    	if(e.target.nodeInfo.newType == null){
//	              quickMenu.css({
//	                  top: event.pageY-10,
//	                  left: event.pageX,
//	              }).show();    	
//		    	}
	    	}
	    	e.target.showNodeInfo = e.target.nodeInfo;
		}else{
			for(var i=0;i<_this.nodeArray.length;i++){
	        	_this.nodeArray[i].showNodeInfo=null;
		        }
		}
    });
    //鼠标双击事件
    _this.scene.dbclick(function(event){
        if(event.target == null) return;
        if(event.target.nodeInfo != null){
        	if(event.target.nodeInfo.move == false){
        		return;
    		}
        	if(event.target.nodeInfo.newType != null){
        		return;
        	}
        }
        var e = event.target;
        editForm.css({
            top: event.pageY,
            left: event.pageX - e.width/2
        }).show().attr('value', e.text).focus().select();
        editForm[0].JTopoNode = e;
    });
    /*手动连接测试*/
    /* 右键菜单处理 */    
quickMenuLi1.click(function(){
    var text = quickMenuA1.text();
    if(text == '删除该节点'){
    	deleteNodeFromNodeArray(currentNode);
    	_this.scene.remove(currentNode);
        currentNode = null;
    }
    quickMenu.hide();
});
quickMenuLi2.click(function(event){
	var text = quickMenuA2.text();
    if(text == '编辑'){
        editForm.css({
            top: quickMenu[0].style.top,
            left: quickMenu[0].style.left
        }).show().focus().select();
        editForm[0].JTopoNode = currentNode;
    }
    editForm.mouseout(function(){
    	isOnEditPage = false;
    });
    isOnEditPage = true;
    quickMenu.hide();
});
    stage.add(_this.scene);
    menuStage.add(_this.menuScene);
    //将舞台存为图片
	setTimeout(function(){
		//stage.saveImageInfo();
	},5000);
	//根据现有数据刷新节点
	this.freshTopology = function(){
		//先移除scene上的节点
		for(var i=0;i<this.nodeArray.length;i++){
			this.scene.remove(this.nodeArray[i]);
		}
		//清零节点数组
		this.nodeArray = [];
		//此处应该获得新数据
		var nodes = this.updateNodes;
		//根据新数据重新渲染拓扑图
		var cluster = nodes.cluster;
	    for(var i=0;i<cluster.length;i++){
	    	var cloud = this.node(1200*(i+1), 50, 'cluster.png','集群1',cluster[i]);
	    	this.newHostNode(cloud,cluster[i]);
	    }
	    this.menuView();
	    this.freshStatus();
	}
	//根据传入数据新建主机节点
	this.newHostNode = function(fatherNode,nodeInfo){
		var hosts = nodeInfo.hosts;
		for(var i=0;i<hosts.length;i++){
			var host = this.node(600*(i+1), 300, 'host.png','主机1',hosts[i]);
			this.newDeskNode(host,hosts[i],600*(i+1));
			this.linkNode(host, fatherNode,true);
		}
	}
	//根据传入数据新建桌面节点
	this.newDeskNode = function(fatherNode,nodeInfo,fatherNodePosition){
		var desks = nodeInfo.desks;
		for(var i=0;i<desks.length/5;i++){
			for(var j=0;j<5;j++){
				var desk = this.node(fatherNodePosition+100*j-200, 500+100*i, 'computer.png','虚拟机1',desks[i]);
				this.hostLink(desk, fatherNode,true);
			}
		}
	}
	//从菜单栏拖拽过来的新节点
	_this.$el.bind('newNodeFromMenu',function(event,newNode){
		debugger;
		switch(newNode.nodeInfo.newType){
			case 1:{
				newNode.nodeInfo.newType = null;
				testNewNode = _this.node(-100000, -100000, 'computer.png','虚拟机',newNode.nodeInfo);
				break;
			}
			case 2:{
				newNode.nodeInfo.newType = null;
				testNewNode = _this.node(-100000, -100000, 'host.png','主机',newNode.nodeInfo);
				break;
			}
			case 3:{
				newNode.nodeInfo.newType = null;
				testNewNode = _this.node(-100000, -100000, 'cluster.png','集群',newNode.nodeInfo);
				break;
			}
			case 4:{
				newNode.nodeInfo.newType = null;
				testNewNode = _this.node(-100000, -100000, 'storage.png','存储',newNode.nodeInfo);
				break;
			}
		}
	});
	
	//新建菜单栏试图
	this.menuView = function(){
//		this.newDesk();
//		this.newHost();
//		this.newCluster();
//		this.newStorage();
//		this.freshFunc();
		this.menuNewDesk();
		this.menuNewHost();
		this.menuNewCluster();
		this.menuNewStorage();
		this.menuFreshFunc();
		//文字提示区
	}
	//新建菜单栏导航文字试图
	this.menuTextView = function(){
		var menuTitleInfo = {
				size:20,
				text:"拖拽创建新节点",
				move:false,
				location:{
					x:20,
					y:10
				}
		}
		var menuTitle = this.textNode(20,10,menuTitleInfo);
	    //新桌面
		var newDeskInfo = {
				size:12,
				text:">>>创建新桌面",
				move:false,
				location:{
					x:20,
					y:60
				}
		}
		var newDeskTitle = this.textNode(20,60,newDeskInfo);
	    //新主机
		var newHostInfo = {
				size:12,
				text:">>>创建新主机",
				move:false,
				location:{
					x:20,
					y:160
				}
		}
		var newHostTitle = this.textNode(20,160,newHostInfo);
		//新集群
		var newClusterInfo = {
				size:12,
				text:">>>创建新集群",
				move:false,
				location:{
					x:20,
					y:260
				}
		}
		var newClusterTitle = this.textNode(20,260,newClusterInfo);
		//新存储
		var newStorageInfo = {
				size:12,
				text:">>>创建新存储",
				move:false,
				location:{
					x:20,
					y:360
				}
		}
		var newStorageTitle = this.textNode(20,360,newStorageInfo);
		//刷新功能
		var freshFuncInfo = {
				size:20,
				text:"点击刷新拓扑图",
				move:false,
				location:{
					x:20,
					y:460
				}
		}
		var freshPrompt = this.textNode(20,460,freshFuncInfo);
	}
	//从菜单栏拖拽新建桌面
	this.newDesk = function(){
		var deskNode = {
				type:5,
				ip:'192.168.0.1',
				ram:'2G',
				cpu:'1G',
				storage:'50G',
				newType:1,
		}
		var desk = this.node(50, 100, 'computer.png','虚拟机',deskNode);
	}
	this.menuNewDesk = function(){
		var deskNode = {
				type:5,
				ip:'192.168.0.1',
				ram:'2G',
				cpu:'1G',
				storage:'50G',
				newType:1,
		}
		var desk2 = this.menuNode(50, 100, 'computer.png','虚拟机',deskNode);
	}
	//从菜单栏拖拽新建主机
	this.newHost = function(){
		var hostNode = {
				type:3,
				ip:'192.168.0.1',
				ram:'4G',
				cpu:'2G',
				storage:'100G',
				newType:2,
		}
		var host = this.node(50, 200, 'hostLogo.png','主机',hostNode);
	}
	this.menuNewHost = function(){
		var hostNode = {
				type:3,
				ip:'192.168.0.1',
				ram:'4G',
				cpu:'2G',
				storage:'100G',
				newType:2,
		}
		var host2 = this.menuNode(50, 200, 'hostLogo.png','主机',hostNode);
	}
	//从菜单栏拖拽新建集群
	this.newCluster = function(){
		var clusterNode = {
				type:1,
				ip:'192.168.0.1',
				ram:'8G',
				cpu:'4G',
				storage:'500G',
				newType:3,
		}
		var cluster = this.node(50, 300, 'clusterLogo.png','集群',clusterNode);
	}
	this.menuNewCluster = function(){
		var clusterNode = {
				type:1,
				ip:'192.168.0.1',
				ram:'8G',
				cpu:'4G',
				storage:'500G',
				newType:3,
		}
		var cluster2 = this.menuNode(50, 300, 'clusterLogo.png','集群',clusterNode);
	}
	//从菜单栏拖拽新建集群
	this.newStorage = function(){
		var stotageNode = {
				type:5,
				ip:'192.168.0.1',
				ram:'2G',
				cpu:'1G',
				storage:'50G',
				newType:4,
		}
		var storage = this.node(50, 400, 'storageLogo.png','存储',stotageNode);
	}
	this.menuNewStorage = function(){
		var stotageNode = {
				type:5,
				ip:'192.168.0.1',
				ram:'2G',
				cpu:'1G',
				storage:'50G',
				newType:4,
		}
		var storage2 = this.menuNode(50, 400, 'storageLogo.png','存储',stotageNode);
	}
	//菜单栏刷新按钮
	this.freshFunc = function(){
		var freshNode = {
				funcType:1,
				newType:5,
				move:false,
				location:{
					x:50,
					y:520
				}
		}
		var freshLogo = this.node(50, 520, 'fresh.png','',freshNode);
	}
	this.menuFreshFunc = function(){
		var freshNode = {
				funcType:1,
				newType:5,
				move:false,
				location:{
					x:50,
					y:520
				}
		}
		var freshLogo2 = this.menuNode(50, 520, 'fresh.png','',freshNode);
	}
}
//对外暴露的接口
TopologyPanel.prototype.getEl = function(){
	this.menuTextView();
	return this.$el;
}
TopologyPanel.prototype.updateValue = function(nodes){
	//先移除scene上的节点
	for(var i=0;i<this.nodeArray.length;i++){
		this.scene.remove(this.nodeArray[i]);
	}
	this.updateNodes = nodes;
	var cluster = nodes.cluster;
    for(var i=0;i<cluster.length;i++){
    	var cloud = this.node(1200*(i+1), 50, 'cluster.png','集群1',cluster[i]);
    	this.newHostNode(cloud,cluster[i]);
    }
    this.menuView();
    this.freshStatus();
}
