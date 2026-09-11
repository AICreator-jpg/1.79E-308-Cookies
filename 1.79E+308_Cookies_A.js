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
            if (old) return;

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
              '<label style="display:block;"><input type="checkbox" id="ac-setting-elderPledge"> 自動エルダー宣誓</label>' +
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

          // Optionsメニューが再構築された直後に設定欄を追加する
          // UpdateMenu内のHTML再生成と同じ処理中に行うため、画面に途中状態を見せない
          var originalUpdateMenu = Game.UpdateMenu;
          Game.UpdateMenu = function() {
            originalUpdateMenu.apply(this, arguments);
            if (Game.onMenu === "prefs") addMySettings();
            setupPantheonTouch();
          };

          // =========================
          // パンテオンのタッチ操作
          // =========================
          // ガーデンと同じ感覚で、聖霊をタップして選択し、
          // 選択した状態でスロットをタップしてセットできるようにする。
          function setupPantheonTouch() {
            try {
              var M = Game.Objects["Temple"].minigame;
              M.godSelected = -1;
              M.slotSelected = -1;

              var id = function() {
                return M.gods[M.godSelected].id;
              };

              var name = function(n) {
                for (var i in M.gods) {
                  if (M.gods[i].id === n) return i;
                }
                return -1;
              };

              var on = function(g, s) {
                if (s === undefined) s = -1;
                M.godSelected = g;
                M.slotSelected = s;

                if (s === -1) {
                  document.getElementById("templeGod" + id()).classList.add("godSelected");
                } else {
                  document.getElementById("templeSlot" + s).classList.add("godSelected");
                }

                PlaySound("snd/toneTick.mp3");
              };

              var off = function() {
                var s = M.slotSelected;

                if (s === -1) {
                  document.getElementById("templeGod" + id()).classList.remove("godSelected");
                } else {
                  document.getElementById("templeSlot" + s).classList.remove("godSelected");
                }

                M.godSelected = -1;
                M.slotSelected = -1;
              };

              var set = function(n) {
                M.dragGod({id: id()});
                M.dragging = M.gods[M.godSelected];
                M.slotHovered = n;
                M.dropGod();

                if (id() !== -1) {
                  document.getElementById("templeGodPlaceholder" + id()).style.display = "none";
                }

                off();
              };

              var el = document.createElement("style");
              el.innerHTML =
                ".templeGod:hover,.temple:active{" +
                "box-shadow:4px 4px 4px #000;" +
                "background-position:0 0;" +
                "z-index:auto;" +
                "}" +
                ".templeGod.ready:hover .templeIcon{" +
                "animation-name:none;" +
                "animation-iteration-count:0;" +
                "animation-duration:0s;" +
                "}" +
                ".templeGod.godSelected{" +
                "box-shadow:6px 6px 6px 2px #000;" +
                "background-position:0px 74px;" +
                "z-index:1000000001;" +
                "transform:scale(1.2)!important;" +
                "}" +
                ".templeGod.ready.godSelected .templeIcon{" +
                "animation-name:bounce;" +
                "animation-iteration-count:infinite;" +
                "animation-duration:0.8s;" +
                "}";
              document.getElementById("templeContent").appendChild(el);

              for (var i in M.gods) {
                (function(g) {
                  var me = M.gods[g];

                  document.getElementById("templeGod" + me.id).addEventListener("click", function() {
                    if (M.gods[g].slot !== -1 || M.slotSelected !== -1) return;

                    if (M.godSelected === g) {
                      off();
                    } else {
                      if (M.godSelected !== -1) off();
                      on(g);
                    }
                  });

                  for (var j of ["mousedown", "mouseup"]) {
                    document.getElementById("templeGod" + me.id).addEventListener(j, function(e) {
                      e.stopPropagation();
                    }, true);
                  }
                })(i);
              }

              for (var i in M.slot) {
                (function(i) {
                  document.getElementById("templeSlot" + i).addEventListener("click", function() {
                    if (M.godSelected === -1) {
                      var n = M.slot[i];
                      if (n === -1) return;
                      on(name(n), i);
                    } else {
                      if (M.slot[i] === id()) {
                        off();
                        return;
                      }
                      set(i);
                    }
                  });
                })(i);
              }

              document.getElementById("templeGods").addEventListener("click", function() {
                if (M.godSelected === -1 || M.slotSelected === -1) return;
                set(-1);
              });
            } catch(e) {}
          }

          // パンテオンがすでに開かれている場合にも設定する
          setupPantheonTouch();

          try {
            for (var i in Game.Objects) {
              var obj = Game.Objects[i];
              if (obj && typeof obj.sell === "function" && !obj.originalSell) {
                obj.originalSell = obj.sell;
                obj.sell = function(num) {
                  // 売却前の状態で「最も上位の施設」を確定する
                  // ObjectsByIdは施設のID順（上位施設ほどIDが大きい）なので、最後の所持施設を取得する
                  var highestBeforeSell = null;
                  if (Game.ObjectsById) {
                    for (var iObj = 0; iObj < Game.ObjectsById.length; iObj++) {
                      var checkObj = Game.ObjectsById[iObj];
                      if (checkObj && checkObj.amount > 0) highestBeforeSell = checkObj;
                    }
                  }

                  var lastAmount = this.amount;
                  var res = this.originalSell(num);
                  try {
                    if (settings.dragonOrbs && this.amount < lastAmount) {
                      // 本家と同じく、Dragon Orbsオーラそのものを確認する
                      var isOrb = false;
                      if (typeof Game.auraMult === "function") isOrb = Game.auraMult("Dragon Orbs") > 0;
                      else if (typeof Game.hasAura === "function") isOrb = Game.hasAura("Dragon Orbs");
                      else if (Game.dragonAura === 19 || Game.dragonAura2 === 19) isOrb = true;

                      // ドラゴンオーブは、売却した施設が売却前の最上位施設の場合だけ判定
                      if (isOrb && highestBeforeSell && this.id === highestBeforeSell.id) {
                        var hasForbiddenBuff = false;
                        if (Game.buffs) {
                          for (var bId in Game.buffs) {
                            var bObj = Game.buffs[bId];
                            if (bObj) {
                              var buffName = (typeof bObj.name === "string") ? bObj.name : "";
                              var buffTypeName = (bObj.type && typeof bObj.type.name === "string") ? bObj.type.name : "";
                              var isGozamok = (bId === "Devastation" || buffName === "Devastation" || buffTypeName === "Devastation");
                              var isRedDebuff = (bObj.type && bObj.type.deb && (buffTypeName === "Clot" || buffName === "Clot"));
                              var isMagic = (buffName.indexOf("storm") !== -1 || buffName.indexOf("Everything") !== -1 || buffName.indexOf("Egg") !== -1);
                              var isGiftLimit = (buffName === "Gift limit" || bId === "Gift limit");

                              if (!isGozamok && !isRedDebuff && !isMagic && !isGiftLimit) {
                                hasForbiddenBuff = true;
                                break;
                              }
                            }
                          }
                        }

                        // 本家と同じく「黄金クッキーが画面にない」ことを確認する
                        var noGoldenCookie = false;
                        if (Game.shimmerTypes && Game.shimmerTypes.golden) {
                          noGoldenCookie = (Game.shimmerTypes.golden.n <= 0);
                        } else {
                          noGoldenCookie = (!Game.shimmers || Game.shimmers.length === 0);
                        }

                        if (!hasForbiddenBuff && noGoldenCookie && Math.random() < 0.1) {
                          new Game.shimmer("golden", "item");
                          var orbIconPosition = new Array(33, 25);
                          Game.Notify("ドラゴンオーブ", "願いが叶い黄金クッキーが出現。", orbIconPosition, 1);
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
            
            
            if (settings.elderPledge && Game.Upgrades) {
              if (Game.Upgrades["Elder Pact"] &&
                  Game.Upgrades["Elder Pact"].bought &&
                  !Game.Has("Elder Covenant") &&
                  Game.Upgrades["Elder Pledge"] &&
                  Game.pledgeT === 0 &&
                  Game.cookies >= Game.Upgrades["Elder Pledge"].getPrice()) {
                Game.Upgrades["Elder Pledge"].buy();
              }
            }
          }, 500);
          
          // 自動アップグレード購入だけを100ms間隔で確認
          setInterval(function() {
            if (typeof Game === "undefined" || !Game.ready) return;

            if (settings.upgradeBuy && Game.UpgradesInStore) {
              for (var j = 0; j < Game.UpgradesInStore.length; j++) {
                var u = Game.UpgradesInStore[j];
                if (!u) continue;
                if (u.pool == "tech" || u.pool == "toggle" || u.id == 64 || u.id == 65 || u.id == 66 || u.id == 67 || u.id == 68 || u.id == 227) continue;
                if (Game.cookies >= u.getPrice()) { u.buy(); break; }
              }
            }
          }, 16);

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
