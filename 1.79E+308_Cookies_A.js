(function() {
  var checkReady = setInterval(function() {
    if (typeof Game !== "undefined" && Game.ready) {
      clearInterval(checkReady);
      
      var modObject = {
        id: 'Automatic_Cookie',
        name: 'Automatic_Cookie',
        init: function() {
          // =========================
          // マイセッティング
          // =========================
          var SETTINGS_KEY = "Automatic_Cookie_MySettings";

          var settings = {
            autoClick: false,
            goldenCookie: false,
            reindeer: false,
            fortune: false,
            buildingBuy: false,
            upgradeBuy: false,
            elderPledge: false,
            dragonOrbs: false
          };

          try {
            var saved = localStorage.getItem(SETTINGS_KEY);

            if (saved) {
              var data = JSON.parse(saved);

              if (typeof data.autoClick === "boolean") settings.autoClick = data.autoClick;
              if (typeof data.goldenCookie === "boolean") settings.goldenCookie = data.goldenCookie;
              if (typeof data.reindeer === "boolean") settings.reindeer = data.reindeer;
              if (typeof data.fortune === "boolean") settings.fortune = data.fortune;
              if (typeof data.buildingBuy === "boolean") settings.buildingBuy = data.buildingBuy;
              if (typeof data.upgradeBuy === "boolean") settings.upgradeBuy = data.upgradeBuy;
              if (typeof data.elderPledge === "boolean") settings.elderPledge = data.elderPledge;
              if (typeof data.dragonOrbs === "boolean") settings.dragonOrbs = data.dragonOrbs;
            }
          } catch(e) {}

          function saveSettings() {
            try {
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            } catch(e) {}
          }

          function addMySettings() {
            var menu = document.getElementById("menu");
            if (!menu) return;

            var old = document.getElementById("automatic-cookie-my-settings");
            if (old) old.remove();

            var box = document.createElement("div");
            box.id = "automatic-cookie-my-settings";

            box.style.cssText =
              "background:#222;" +
              "color:#fff;" +
              "border:2px solid #ffd700;" +
              "border-radius:8px;" +
              "padding:10px;" +
              "margin:8px 0 12px 0;" +
              "font-size:13px;" +
              "line-height:1.8;";

            box.innerHTML =
              '<div style="font-size:17px;font-weight:bold;color:#ffd700;margin-bottom:7px;">マイセッティング</div>' +
              '<label style="display:block;"><input type="checkbox" id="ac-setting-autoClick"> 連打</label>' +
              '<label style="display:block;"><input type="checkbox" id="ac-setting-goldenCookie"> 金クッキー</label>' +
              '<label style="display:block;"><input type="checkbox" id="ac-setting-reindeer"> トナカイ</label>' +
              '<label style="display:block;"><input type="checkbox" id="ac-setting-fortune"> フォーチュン</label>' +
              '<label style="display:block;"><input type="checkbox" id="ac-setting-buildingBuy"> 施設（効率）</label>' +
              '<label style="display:block;"><input type="checkbox" id="ac-setting-upgradeBuy"> 改良</label>' +
              '<label style="display:block;"><input type="checkbox" id="ac-setting-elderPledge"> 自動誓約</label>' +
              '<label style="display:block;"><input type="checkbox" id="ac-setting-dragonOrbs"> ドラゴンオーブ</label>';

            if (menu.firstChild) {
              menu.insertBefore(box, menu.firstChild);
            } else {
              menu.appendChild(box);
            }

            var list = [
              ["ac-setting-autoClick", "autoClick"],
              ["ac-setting-goldenCookie", "goldenCookie"],
              ["ac-setting-reindeer", "reindeer"],
              ["ac-setting-fortune", "fortune"],
              ["ac-setting-buildingBuy", "buildingBuy"],
              ["ac-setting-upgradeBuy", "upgradeBuy"],
              ["ac-setting-elderPledge", "elderPledge"],
              ["ac-setting-dragonOrbs", "dragonOrbs"]
            ];

            for (var i = 0; i < list.length; i++) {
              (function(id, key) {
                var checkbox = document.getElementById(id);
                if (!checkbox) return;

                checkbox.checked = settings[key];

                checkbox.onchange = function() {
                  settings[key] = this.checked;
                  saveSettings();
                };
              })(list[i][0], list[i][1]);
            }
          }

          if (!Game.customOptionsMenu) {
            Game.customOptionsMenu = [];
          }

          Game.customOptionsMenu.push(function() {
            setTimeout(addMySettings, 0);
          });

          var optionsWatcher = setInterval(function() {
            if (typeof Game === "undefined" || !Game.ready) return;

            if (Game.onMenu === "prefs") {
              addMySettings();
            }
          }, 100);

          try {
            for (var i in Game.Objects) {
              var obj = Game.Objects[i];
              if (obj && typeof obj.sell === "function" && !obj.originalSell) {
                obj.originalSell = obj.sell;
                obj.sell = function(num) {
                  var lastAmount = this.amount;
                  var res = this.originalSell(num);
                  try {
                    if (settings.dragonOrbs && this.amount < lastAmount) {
                      var isOrb = false;
                      if (Game.hasAura) isOrb = Game.hasAura("Dragon Orbs");
                      else if (Game.dragonAura === 19 || Game.dragonAura2 === 19) isOrb = true;
                      
                      if (isOrb) {
                        var highest = null;
                        for (var iObj in Game.Objects) {
                          if (Game.Objects[iObj].amount > 0) highest = Game.Objects[iObj];
                        }
                        
                        if (highest && this.name === highest.name) {
                          var hasForbiddenBuff = false;
                          if (Game.buffs) {
                            for (var bId in Game.buffs) {
                              var bObj = Game.buffs[bId];
                              if (bObj) {
                                var isGozamok = (bId === "Devastation" || bObj.name === "Devastation" || (bObj.type && bObj.type.name === "Devastation"));
                                var isRedDebuff = (bObj.type && bObj.type.deb && (bObj.type.name === "Clot" || bObj.name === "Clot"));
                                var isMagic = (bObj.name.includes("storm") || bObj.name.includes("Everything") || bObj.name.includes("Egg"));
                                var isGiftLimit = (bObj.name === "Gift limit" || bId === "Gift limit");
                                
                                if (!isGozamok && !isRedDebuff && !isMagic && !isGiftLimit) {
                                  hasForbiddenBuff = true;
                                  break;
                                }
                              }
                            }
                          }
                        }
                        
                        if (!hasForbiddenBuff) {
                          var noCookie = (!Game.shimmers || Game.shimmers.length === 0);
                          if (noCookie && Math.random() < 0.1) {
                            new Game.shimmer("golden", "item");
                            var orbIconPosition = new Array(33, 25);
                            Game.Notify("ドラゴンオーブ", "願いが叶い黄金クッキーが出現。", orbIconPosition, 1);
                          }
                        }
                      }
                    }
                  } catch(err) {}
                  return res;
                };
              }
            }
          } catch(e) {}
          
          setInterval(function() {
            if (typeof Game === "undefined" || !Game.ready) return;
            
            if (settings.autoClick && Game.ClickCookie) {
              Game.ClickCookie(); 
              if (Game.mouseDown !== undefined) Game.mouseDown = 0;
            }
            
            if (settings.buildingBuy && Game.ObjectsById) {
              var boughtAnything = false;
              while (true) {
                var bO = null, bS = -1;
                for (var i = 0; i < Game.ObjectsById.length; i++) {
                  var o = Game.ObjectsById[i];
                  if (!o) continue;
                  var p = o.getPrice();
                  var c = o.storedCps ? o.storedCps : (typeof o.cps === "function" ? o.cps(o) : (o.cps || 0));
                  if (p > 0 && c >= 0 && (c / p) > bS) { bS = c / p; bO = o; }
                }
                if (bO && Game.cookies >= bO.getPrice()) {
                  // 自動購入時だけ購入モードにして、手動の売却モードを壊さない
                  var oldBuyMode = Game.buyMode;
                  Game.buyMode = 1;
                  bO.buy(1);
                  Game.buyMode = oldBuyMode;
                } else {
                  break;
                }
              }
              if (boughtAnything) {
                Game.recalculateGains = 1;
                if (Game.draw) Game.UpdateMenu();
              }
            }
            
            if (Game.researchT > 0) Game.researchT = 1;
            
            if (Game.lumpRefill > 0) {
              Game.lumpRefill = 1; 
              var wt = Game.Objects["Wizard tower"]; 
              var minigameExists = (wt && wt.minigame);
              if (minigameExists) {
                wt.minigame.lumpRefill = 1; 
                if (Game.draw) Game.UpdateMenu();
              }
            }
          }, 16);
          
          setInterval(function() {
            if (typeof Game === "undefined" || !Game.ready) return;
            
            if (Game.shimmers && Game.shimmers.length > 0) {
              for (var i = Game.shimmers.length - 1; i >= 0; i--) {
                var sh = Game.shimmers[i];
                if (sh.type === "golden" && settings.goldenCookie) sh.pop();
                if (sh.type === "reindeer" && settings.reindeer) sh.pop();
              }
            }
            
            if (settings.fortune) {
              var tk = document.getElementById("commentsText1");
              if (tk && (/fortune|幸運/i.test(tk.innerHTML))) {
                try {
                  var ev = new MouseEvent("click", {bubbles:true,cancelable:true,view:window}); 
                  tk.dispatchEvent(ev);
                } catch(err) { 
                  if (Game.TickerClick) Game.TickerClick(); 
                }
              }
            }
            
            if (settings.upgradeBuy && Game.UpgradesInStore) {
              for (var j = 0; j < Game.UpgradesInStore.length; j++) {
                var u = Game.UpgradesInStore[j];
                if (!u) continue;
                if (u.pool == "tech" || u.pool == "toggle" || u.id == 64 || u.id == 65 || u.id == 66 || u.id == 67 || u.id == 68 || (u.id >= 222 && u.id <= 229)) continue;
                if (Game.cookies >= u.getPrice()) { u.buy(); break; }
              }
            }
            
            if (settings.elderPledge && Game.Upgrades) {
              var hasElderCovenant = false;

              try {
                if (typeof Game.Has === "function") {
                  hasElderCovenant = Game.Has("Elder Covenant");
                }

                if (!hasElderCovenant &&
                    Game.Upgrades["Elder Covenant"] &&
                    Game.Upgrades["Elder Covenant"].bought) {
                  hasElderCovenant = true;
                }
              } catch(e) {}

              if (hasElderCovenant &&
                  Game.pledgeT === 0 &&
                  Game.Upgrades["Elder Pledge"] &&
                  Game.Upgrades["Elder Pledge"].pool === "toggle" &&
                  Game.cookies >= Game.Upgrades["Elder Pledge"].getPrice()) {
                Game.Upgrades["Elder Pledge"].buy();
              }
            }
          }, 500);
          
          Game.Notify("Automation MOD", "ver 1.0", "", 1);
        },
        save: function() {
          return "https://github.io";
        },
        load: function(str) {}
      };
      
      Game.registerMod('Automatic_Cookie', modObject);
    }
  }, 1000);
})();
