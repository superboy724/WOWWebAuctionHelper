// ==UserScript==
// @name         AuctionHelper
// @namespace    http://tampermonkey.net/
// @version      1
// @description  ��������!
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
            $.ajaxSettings.async = false;//ͬ������
            var wowCurrency = price;
            var params = {
                itemId:itemid,//��ƷID
                quantity:quantity,
                sourceType:0,
                duration:0,//0Ϊ12Сʱ��1Ϊ24Сʱ,2Ϊ48Сʱ
                stacks:1,//��1�ѣ�ͨ��ѭ��������
                buyout:wowCurrency.WowCurrencyToInt(),//һ�ڼ�
                bid:wowCurrency.WowCurrencyToInt(),//���ļ�
                type:"perItem",
                ticket:auctionHelper.GetTicket($("#form-itemid").val()),//��ȡticker
                xstoken:auctionHelper.token//��ȡtoken
            };
            $.getJSON("createAuction",params);
        };
        auctionHelper.Cancel = function(itemid){
            //��������Ʒ�����¼�
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
            //��ȡĳ��Ʒ��ͼ۸�
            var similarnpage = "";
            similarnpage = $.ajax({url:"similar?sort=unitBuyout&itemId="+itemid+"&reverse=false",async:false});
            var dom = $(similarnpage.responseText).find(".table>table>tbody>tr:first>.price");
            var price = WowCurrency.Create(dom.find(".icon-gold").html(),dom.find(".icon-silver").html(),dom.find(".icon-copper").html());
            return price;
        };
        auctionHelper.GetItemCount = function(itemid,groundingcount){
            //��ȡ�ϼ���Ʒ����
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
            //��ȡTicker�������봴����Ʒ������һ���������޷��ϼ�
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
        var cookie_pos = allcookies.indexOf(name);   //�����ĳ���
    
        // ����ҵ����������ʹ���cookie���ڣ�
        // ��֮����˵�������ڡ�
        if (cookie_pos != -1)
        {
            // ��cookie_pos����ֵ�Ŀ�ʼ��ֻҪ��ֵ��1���ɡ�
            cookie_pos += name.length + 1;      //�������׳����⣬�������Ҳο���ʱ���Լ��ú��о�һ��
            var cookie_end = allcookies.indexOf(";", cookie_pos);
    
            if (cookie_end == -1)
            {
                cookie_end = allcookies.length;
            }
    
            var value = unescape(allcookies.substring(cookie_pos, cookie_end));         //����Ϳ��Եõ�����Ҫ��cookie��ֵ�ˡ�����
        }
        return value;
    }
};

//wow���ϵͳ������
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

//��־��ӡ
var Log = {
    Create:function(){
        var logdom = '<div id="log" style="display:block;"><div class="similar-items"><h3 class="subheader">��־���</h3><div class="table" id="logmain"></div></div></div>';
        $(".create-right").html($(".create-right").html()+logdom);
    },
    Append:function(text){
        var logdom = $("#logmain");
        logdom.html(logdom.html()+"<p>"+text+"</p>");
    }
};

(function() {
    'use strict';
    $("#profile-sidebar-menu").html($("#profile-sidebar-menu").html() + '<li class=""><a class="" rel="np" id="startauctionhelper"><span class="arrow"><span class="icon">���ò��</span></span></a></li>');
    
    document.getElementById("startauctionhelper").addEventListener('click', function (e) {
        //��ʼ��
        //���ID�����
        var idinputbox = '<tr><td><label for="form-quantity">��ƷID(���)��</label></td><td><input id="form-itemid" type="text" tabindex="1"  class="input align-right" /></td></tr>';
        var minpriceinputbox = '<tr xmlns="http://www.w3.org/1999/xhtml"><td><label for="form-minGold">ѹ����ͼ۸�(���)��</label></td><td id="form-buyoutMoney"><span class="icon-gold"><input id="minGold" type="text" tabindex="8" name="buyoutGold" maxlength="6" class="input align-right" /></span><span class="icon-silver"><input id="minSilver" type="text" tabindex="9" name="buyoutSilver" maxlength="2" class="input align-right" /></span><span class="icon-copper"><input id="minCopper" type="text" tabindex="10" name="buyoutCopper" maxlength="2" class="input align-right" /></span></td></tr>';
        $("#create-step2>table").html(idinputbox+$("#create-step2>table").html() + minpriceinputbox);
        //��Ӳ����ť
        $("#form-button").html($("#form-button").html()+'<button xmlns="http://www.w3.org/1999/xhtml" class="ui-button button1" type="button" id="button-auctionhelper-create"><span class="button-left"><span class="button-right">����(���)</span></span></button>');
        //�����־��
        Log.Create();
        Log.Append("wow��������Ѿ�����");
        //��
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
                Log.Append("�ɹ���ȡ��Ϣ");
                //��ʼִ��
                //ִ�е�һ��
                count++;
                Log.Append("��ʼִ�е�"+count+"��");
                for(var x=0;x<=Number(stacks)-1;x++){
                    Log.Append("�ϼܵ�"+Number(x)+"��");
                    auctionHelper.CreateItem(itemid,youprice,Number(quantity));
                }
                //�Զ�ѭ��
                var timer = setInterval(function(){
                        count++;
                        Log.Append("��ʼִ�е�"+count+"��");
                        //��������۸�
                        var minp = auctionHelper.GetSimilar(itemid);
                        Log.Append("��⵽�����м۸�:"+minp.WowCurrencyToInt());
                        if(minp.WowCurrencyToInt() < youprice.WowCurrencyToInt() ){
                            Log.Append("�����¼�");
                            //�¼�
                            auctionHelper.Cancel(itemid);
                            //ѹһͭ
                            youprice = WowCurrency.IntParseWowCurrency(minp.WowCurrencyToInt()-1);
                            //��������趨��
                            if(youprice.WowCurrencyToInt() < minprice.WowCurrencyToInt()){
                                Log.Append("�۸���ͣ��ű�ֹͣ����");
                                window.clearInterval(timer); 
                                return;
                            }
                            else{
                                Log.Append("��ʼ�ϼ�");
                                for(var y=0;y<=Number(stacks)-1;y++){
                                    Log.Append("�ϼܵ�"+Number(y)+"��");
                                    auctionHelper.CreateItem(itemid,youprice,Number(quantity));
                                }
                            }
                        }
                        else{
                            Log.Append("��ǰ�۸�����ѹ��");
                            Log.Append("�����Ʒ����");
                            var stackcount = auctionHelper.GetItemCount(itemid,Number(stacks));
                            if(stackcount > 0){
                                Log.Append("���ϼ�"+stackcount+"��,��ʼ�ϼ�");
                                for(var y=0;y<=Number(stackcount)-1;y++){
                                    Log.Append("�ϼܵ�"+Number(y)+"��");
                                    auctionHelper.CreateItem(itemid,youprice,Number(quantity));
                                }
                            }else{
                                Log.Append("��������ϼ�");
                            }
                        }
                    },100000);
                }, false);
        }, false);
})();