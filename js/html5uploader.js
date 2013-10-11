/*
 *   html5uploader ver 1.0 - jQuery plugin
 *   中文：html5拖拽上传jquery插件
 *   作者：Eamonn
 *   博客：http://www.eamonning.com
 
 *	 Dual licensed under the MIT and GPL licenses.
 * 
 *	 Built for jQuery library
 *	 http://jquery.com
 *
 *   使用：
 *   <div id="demo_drop"></div>
 *   $('#demo_drop').html5uploder();
*/
(function($){
	
	$.fn.html5uploder = function(optionsOrg){
		
		var falsev = !1,
		truev = !falsev,
		environment={
			//检查是否支持html5
			html5supported:(function(){
							  return !!navigator.geolocation;
						  })()
		},
		data={
			totalFilesize:0,
			processedFilesize:0,
			processedErrorFilesize:0
		},
		defaults = {
			//调试盒子id
			debug:'',
			//地址
			url:'./submit.php',
			//post数据
			post:{},
			//form名称
			inputNmae:'html5uploader',
			//单个文件大小限制
			singleFilesizeLimit:1024*1024*1024,
			//单个文件超限回调函数
			singleFilesizeLimitFunc:function(filelist){
				alert('单个文件大小超过限制');
			},
			//总大小限制
			totalFilesizeLimit:1024*1024*1024,
			//总大小限制超限回调函数
			totalFilesizeLimitFunc:function(filelist){
				alert('总文件大小超过限制');
			},
			//不支持html5调用的函数
			html5UnsupportedFunc:function(obj){
				$(obj).html('HTML5 Not Supported!');
			},
			//drop over handler
			dropOverFunc:function(obj){
				obj.css('background','#CCC');
			},
			//all upload complete
			allUploadedCompleteFunc:function(succeedSize,errorSize){},
			//uploading
			uploadingFunc:function(singleLoaded,singleTotal,allLoaded,allTotal){},
			//onloadstart
			onloadstartFunc:function(list,allLoaded,allTotal){},
			//onload
			onloadFunc:function(response,list,allLoaded,allTotal){},
			//onerror
			onerrorFunc:function(response,list,allLoaded,allTotal){}
		},
		baseSelf = this;
		optionsOrg = $.extend(defaults, optionsOrg);		
		
		baseSelf.debug=function(msg){
			if(optionsOrg.debug){
				$('#'+optionsOrg.debug).append(msg+"<br />");
			}
		};
		
		return this.each(function(){
			
			var obj = $(this),
			objo=null,
			opts = optionsOrg;
			
			//dom元素检查
			if(obj[0]){
				objo=obj[0];	
			}else{
				return falsev;
			}
			if(!opts.url){
				return falsev;	
			}
			
			baseSelf.debug('args check succeed');
			
			//检查环境
			if(!environment.html5supported){
				opts.html5UnsupportedFunc(obj);
				return falsev;
			}	
			
			baseSelf.debug('environment check succeed');
			
			baseSelf.handleDropOut=function(event){
				alert(1);
			};
			objo.addEventListener('dropout', baseSelf.handleDrop, false);
			
			baseSelf.handleDrop=function(event) {
				baseSelf.debug('drop');
				event.stopPropagation();
				event.preventDefault();	
				data.totalFilesize=0;
				data.processedFilesize=0;
				data.processedErrorFilesize=0;
				baseSelf.processFiles(event.dataTransfer.files);				
			};			
			objo.addEventListener('drop', baseSelf.handleDrop, false);
			
			baseSelf.handleDragOver=function(event) {
				//baseSelf.debug('drop over');
				event.stopPropagation();
				event.preventDefault();	
				opts.dropOverFunc(obj);
			};
        	objo.addEventListener('dragover', baseSelf.handleDragOver, false);
			
			baseSelf.processFiles=function(filelist) {
				baseSelf.debug('processFiles');
				if (!filelist || !filelist.length){
					return;
				}
				var i;
				data.totalFilesize=0;
				for (i = 0; i < filelist.length; i++) {
					data.totalFilesize += filelist[i].size;
					if(filelist[i].size>opts.singleFilesizeLimit){
						opts.singleFilesizeLimitFunc(filelist[i]);
						return;
					}
				}
				if(data.totalFilesize>opts.totalFilesizeLimit){
					opts.totalFilesizeLimitFunc(filelist);
					return;	
				}
				
				for (i = 0; i < filelist.length; i++) {
					baseSelf.uploadFile(filelist[i]);
				}
				
				
			};
					
			//上传文件
			baseSelf.uploadFile=function(file) {
				baseSelf.debug('upload file size['+file.size+'] name['+file.name+']');
				// prepare XMLHttpRequest
				var xhr = new XMLHttpRequest();
				xhr.open('POST', opts.url);
				xhr.onload = function() {
					data.processedFilesize+=file.size;
					baseSelf.debug('xhr.onload '+file.name);
					baseSelf.debug('response: '+this.responseText);
					opts.onloadFunc(this.responseText,file,data.processedFilesize+data.processedErrorFilesize,data.totalFilesize);
					if(data.processedErrorFilesize+data.processedFilesize==data.totalFilesize){						
						baseSelf.debug('opts.allUploadedCompleteFunc');
						opts.allUploadedCompleteFunc(data.processedFilesize,data.processedErrorFilesize);	
					}
				};
				xhr.onerror = function() {
					data.processedErrorFilesize+=file.size;
					baseSelf.debug('xhr.onerror '+file.name);
					baseSelf.debug('response: '+this.responseText);
					opts.onerrorFunc(this.responseText,file,data.processedFilesize+data.processedErrorFilesize,data.totalFilesize);
					if(data.processedErrorFilesize+data.processedFilesize==data.totalFilesize){						
						baseSelf.debug('opts.allUploadedCompleteFunc');
						opts.allUploadedCompleteFunc(data.processedFilesize,data.processedErrorFilesize);	
					}
					
				};
				xhr.upload.onprogress = function(event) {
					var progress = data.processedFilesize+data.processedErrorFilesize + event.loaded;
					opts.uploadingFunc(event.loaded,file.size,progress,data.totalFilesize);
					baseSelf.debug('xhr.upload.onprogress '+file.name);
				}
				xhr.upload.onloadstart = function(event) {
					baseSelf.debug('xhr.upload.onloadstart '+file.name);
					opts.onloadstartFunc(file,data.processedFilesize+data.processedErrorFilesize,data.totalFilesize);
				}		
				// prepare FormData
				var formData = new FormData();
				formData.append(opts.inputNmae, file);
				var itm;
				for(itm in opts.post){
					formData.append(itm, opts.post[itm]);
				}
				xhr.send(formData);
			};			
						
		});
		
		
	};
	

})(jQuery);


