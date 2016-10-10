// ==UserScript==
// @name         AuctionHelper
// @namespace    http://tampermonkey.net/
// @version      1
// @description  拍卖辅助!
// @author       You
// @match        https://www.battlenet.com.cn/wow/zh/vault/character/auction/create
// @grant        none
// @require      http://apps.bdimg.com/libs/jquery/1.6.4/jquery.min.js
// ==/UserScript==

var AuctionHelper = {
    Create:function(){
        var auctionHelper = {};
        auctionHelper.token = Tools.GetCookie("xstoken");
        auctionHelper.CreateItem = function(itemid,price,quantity){
            $.ajaxSettings.async = false;//同步操作
            var wowCurrency = price;
            var params = {
                itemId:itemid,//物品ID
                quantity:quantity,
                sourceType:0,
                duration:0,//0为12小时，1为24小时,2为48小时
                stacks:1,//上1堆，通过循环批量上
                buyout:wowCurrency.WowCurrencyToInt(),//一口价
                bid:wowCurrency.WowCurrencyToInt(),//竞拍价
                type:"perItem",
                ticket:auctionHelper.GetTicket($("#form-itemid").val()),//获取ticker
                xstoken:auctionHelper.token//获取token
            };
            $.getJSON("createAuction",params);
        };
        auctionHelper.Cancel = function(itemid){
            //拍卖行物品批量下架
            var auctionpage = "";
            auctionpage = $.ajax({url:"auctions",async:false});
            $(auctionpage.responseText).find("#auctions-active:first>div>table>tbody>tr").each(function(i,data){
                var id = $(data).attr("id").split("-")[1];
                var nowitemid = $(data).find("td:first>a:first").attr("href").split("/")[4];
                if(nowitemid == itemid){
                    $.getJSON("cancel",{auc:id,xstoken:auctionHelper.token});
                }
            });
        };
        auctionHelper.GetSimilar = function(itemid){
            //获取某商品最低价格
            var similarnpage = "";
            similarnpage = $.ajax({url:"similar?sort=unitBuyout&itemId="+itemid+"&reverse=false",async:false});
            var dom = $(similarnpage.responseText).find(".table>table>tbody>tr:first>.price");
            var price = WowCurrency.Create(dom.find(".icon-gold").html(),dom.find(".icon-silver").html(),dom.find(".icon-copper").html());
            return price;
        };
        auctionHelper.GetItemCount = function(itemid,groundingcount){
            //获取上架商品数量
            var auctionpage = "";
            var itemcount = 0;
            auctionpage = $.ajax({url:"auctions",async:false});
            $(auctionpage.responseText).find("#auctions-active:first>div>table>tbody>tr").each(function(i,data){
                var id = $(data).attr("id").split("-")[1];
                var nowitemid = $(data).find("td:first>a:first").attr("href").split("/")[4];
                if(nowitemid == itemid){
                    itemcount++;
                }
            });
            return groundingcount - itemcount;
        };
        auctionHelper.GetTicket = function(itemid){
            //获取Ticker，参数与创建物品参数需一样，否则无法上架
            $.ajaxSettings.async = false;
            var params = {
                item:itemid,
                duration:0,
                quan:Number($("#form-quantity").val()),
                stacks:1,
                sk:auctionHelper.token
            };
            var ticket = "";
            $.getJSON("deposit",params,function(data){
                ticket = data.ticket;
            });
            return ticket;
        };
        return auctionHelper;
    }
};

var Tools = {
    GetCookie:function(name){
        var allcookies = document.cookie;
        var cookie_pos = allcookies.indexOf(name);   //索引的长度
    
        // 如果找到了索引，就代表cookie存在，
        // 反之，就说明不存在。
        if (cookie_pos != -1)
        {
            // 把cookie_pos放在值的开始，只要给值加1即可。
            cookie_pos += name.length + 1;      //这里容易出问题，所以请大家参考的时候自己好好研究一下
            var cookie_end = allcookies.indexOf(";", cookie_pos);
    
            if (cookie_end == -1)
            {
                cookie_end = allcookies.length;
            }
    
            var value = unescape(allcookies.substring(cookie_pos, cookie_end));         //这里就可以得到你想要的cookie的值了。。。
        }
        return value;
    }
};

//wow金币系统帮助类
var WowCurrency = {
    Create : function(gold,sliver,copper){
        var wowCurrency = {};
        var g = gold.toString().replace(",","");
        wowCurrency.Gold = Number(g);
        wowCurrency.Sliver = Number(sliver);
        wowCurrency.Copper = Number(copper);
        wowCurrency.WowCurrencyToInt = function(){
            var intvalue = (wowCurrency.Gold * 10000) + (wowCurrency.Sliver * 100) + wowCurrency.Copper;
            return intvalue;
        };
        return wowCurrency;
        
    },
    IntParseWowCurrency : function(intvalue){
        var money = intvalue;
        var gold = parseInt(intvalue/10000);
        money = money - (gold*10000);
        var sliver = parseInt(intvalue/100);
        money = money - (sliver*100);
        var copper = money;
        var wowCurrency = WowCurrency.Create(gold,sliver,copper);
        return wowCurrency;
    }
};

//日志打印
var Log = {
    Create:function(){
        var logdom = '<div id="log" style="display:block;"><div class="similar-items"><h3 class="subheader">日志输出</h3><div class="table" id="logmain"></div></div></div>';
        $(".create-right").html($(".create-right").html()+logdom);
    },
    Append:function(text){
        var logdom = $("#logmain");
        logdom.html(logdom.html()+"<p>"+text+"</p>");
    }
};

(function() {
    'use strict';
    $("#profile-sidebar-menu").html($("#profile-sidebar-menu").html() + '<li class=""><a class="" rel="np" id="startauctionhelper"><span class="arrow"><span class="icon">启用插件</span></span></a></li>');
    
    document.getElementById("startauctionhelper").addEventListener('click', function (e) {
        //初始化
        //添加ID输入框
        var idinputbox = '<tr><td><label for="form-quantity">物品ID(插件)：</label></td><td><input id="form-itemid" type="text" tabindex="1"  class="input align-right" /></td></tr>';
        var minpriceinputbox = '<tr xmlns="http://www.w3.org/1999/xhtml"><td><label for="form-minGold">压价最低价格(插件)：</label></td><td id="form-buyoutMoney"><span class="icon-gold"><input id="minGold" type="text" tabindex="8" name="buyoutGold" maxlength="6" class="input align-right" /></span><span class="icon-silver"><input id="minSilver" type="text" tabindex="9" name="buyoutSilver" maxlength="2" class="input align-right" /></span><span class="icon-copper"><input id="minCopper" type="text" tabindex="10" name="buyoutCopper" maxlength="2" class="input align-right" /></span></td></tr>';
        $("#create-step2>table").html(idinputbox+$("#create-step2>table").html() + minpriceinputbox);
        //添加插件按钮
        $("#form-button").html($("#form-button").html()+'<button xmlns="http://www.w3.org/1999/xhtml" class="ui-button button1" type="button" id="button-auctionhelper-create"><span class="button-left"><span class="button-right">创建(插件)</span></span></button>');
        //添加日志框
        Log.Create();
        Log.Append("wow拍卖插件已经启动");
        //绑定
        document.getElementById("button-auctionhelper-create").addEventListener('click', function (e) {
                var auctionHelper = AuctionHelper.Create();
                var itemid = "";
                var quantity = "";
                var stacks = "";
                var youprice = "";
                var count = 0;
                var minprice = "";
                itemid = $("#form-itemid").val();
                quantity = $("#form-quantity").val();
                stacks= $("#form-stacks").val();
                youprice = WowCurrency.Create($("#form-buyoutGold").val(),$("#form-buyoutSilver").val(),$("#form-buyoutCopper").val());
                minprice = WowCurrency.Create($("#minGold").val(),$("#minSilver").val(),$("#minCopper").val());
                Log.Append("成功获取信息");
                //开始执行
                //执行第一次
                count++;
                Log.Append("开始执行第"+count+"次");
                for(var x=0;x<=Number(stacks)-1;x++){
                    Log.Append("上架第"+Number(x)+"组");
                    auctionHelper.CreateItem(itemid,youprice,Number(quantity));
                }
                //自动循环
                var timer = setInterval(function(){
                        count++;
                        Log.Append("开始执行第"+count+"次");
                        //检查拍卖价格
                        var minp = auctionHelper.GetSimilar(itemid);
                        Log.Append("检测到拍卖行价格:"+minp.WowCurrencyToInt());
                        if(minp.WowCurrencyToInt() < youprice.WowCurrencyToInt() ){
                            Log.Append("正在下架");
                            //下架
                            auctionHelper.Cancel(itemid);
                            //压一铜
                            youprice = WowCurrency.IntParseWowCurrency(minp.WowCurrencyToInt()-1);
                            //如果低于设定价
                            if(youprice.WowCurrencyToInt() < minprice.WowCurrencyToInt()){
                                Log.Append("价格过低，脚本停止工作");
                                window.clearInterval(timer); 
                                return;
                            }
                            else{
                                Log.Append("开始上架");
                                for(var y=0;y<=Number(stacks)-1;y++){
                                    Log.Append("上架第"+Number(y)+"组");
                                    auctionHelper.CreateItem(itemid,youprice,Number(quantity));
                                }
                            }
                        }
                        else{
                            Log.Append("当前价格无需压价");
                            Log.Append("检测商品数量");
                            var stackcount = auctionHelper.GetItemCount(itemid,Number(stacks));
                            if(stackcount > 0){
                                Log.Append("需上架"+stackcount+"组,开始上架");
                                for(var y=0;y<=Number(stackcount)-1;y++){
                                    Log.Append("上架第"+Number(y)+"组");
                                    auctionHelper.CreateItem(itemid,youprice,Number(quantity));
                                }
                            }else{
                                Log.Append("无需额外上架");
                            }
                        }
                    },100000);
                }, false);
        }, false);
})();