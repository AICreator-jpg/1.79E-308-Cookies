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
              var temple = Game.Objects && Game.Objects["Temple"];
              var M = temple && temple.minigame;
              if (!M || !M.gods || !M.slot) return;

              var content = document.getElementById("templeContent");
              var godsArea = document.getElementById("templeGods");
              if (!content || !godsArea) return;

              // 同じDOMへ二重にイベントを登録しない
              if (content.getAttribute("data-automatic-cookie-pantheon-touch") === "1") return;
              content.setAttribute("data-automatic-cookie-pantheon-touch", "1");

              M.godSelected = -1;
              M.slotSelected = -1;

              function getGodIndexById(godId) {
                for (var i = 0; i < M.gods.length; i++) {
                  if (M.gods[i] && M.gods[i].id === godId) return i;
                }
                return -1;
              }

              function selectGod(g, s) {
                if (s === undefined) s = -1;
                M.godSelected = g;
                M.slotSelected = s;

                var godId = M.gods[g] && M.gods[g].id;
                if (s === -1) {
                  var godEl = document.getElementById("templeGod" + godId);
                  if (godEl) godEl.classList.add("godSelected");
                } else {
                  var slotEl = document.getElementById("templeSlot" + s);
                  if (slotEl) slotEl.classList.add("godSelected");
                }

                if (typeof PlaySound === "function") PlaySound("snd/toneTick.mp3");
              }

              function clearSelection() {
                var g = M.godSelected;
                var s = M.slotSelected;

                if (g !== -1 && M.gods[g]) {
                  var godEl = document.getElementById("templeGod" + M.gods[g].id);
                  if (godEl) godEl.classList.remove("godSelected");
                }

                if (s !== -1) {
                  var slotEl = document.getElementById("templeSlot" + s);
                  if (slotEl) slotEl.classList.remove("godSelected");
                }

                M.godSelected = -1;
                M.slotSelected = -1;
              }

              function setGod(slot) {
                if (M.godSelected === -1 || !M.gods[M.godSelected]) return;

                var godId = M.gods[M.godSelected].id;
                M.dragGod({id: godId});
                M.dragging = M.gods[M.godSelected];
                M.slotHovered = slot;
                M.dropGod();

                var placeholder = document.getElementById("templeGodPlaceholder" + godId);
                if (placeholder) placeholder.style.display = "none";

                clearSelection();
              }

              // 聖霊をタップして選択・選択解除
              for (var i = 0; i < M.gods.length; i++) {
                (function(g) {
                  var me = M.gods[g];
                  if (!me) return;

                  var godEl = document.getElementById("templeGod" + me.id);
                  if (!godEl) return;

                  godEl.addEventListener("click", function(e) {
                    if (e && e.stopPropagation) e.stopPropagation();

                    if (M.gods[g].slot !== -1) {
                      if (M.godSelected === g) {
                        clearSelection();
                      } else {
                        if (M.godSelected !== -1 || M.slotSelected !== -1) clearSelection();
                        selectGod(g, M.gods[g].slot);
                      }
                      return;
                    }

                    if (M.slotSelected !== -1) return;

                    if (M.godSelected === g) {
                      clearSelection();
                    } else {
                      if (M.godSelected !== -1) clearSelection();
                      selectGod(g);
                    }
                  });

                  godEl.addEventListener("mousedown", function(e) {
                    e.stopPropagation();
                  }, true);
                  godEl.addEventListener("mouseup", function(e) {
                    e.stopPropagation();
                  }, true);
                })(i);
              }

              // スロットをタップしてセット・選択
              for (var s = 0; s < M.slot.length; s++) {
                (function(slotIndex) {
                  var slotEl = document.getElementById("templeSlot" + slotIndex);
                  if (!slotEl) return;

                  slotEl.addEventListener("click", function(e) {
                    if (e && e.stopPropagation) e.stopPropagation();

                    if (M.godSelected === -1) {
                      var godId = M.slot[slotIndex];
                      if (godId === -1) return;

                      var g = getGodIndexById(godId);
                      if (g !== -1) selectGod(g, slotIndex);
                    } else {
                      if (M.slot[slotIndex] === M.gods[M.godSelected].id) {
                        clearSelection();
                        return;
                      }
                      setGod(slotIndex);
                    }
                  });
                })(s);
              }

              // セット済みの聖霊を外すため、下部の未セット聖霊エリアをタップ
              godsArea.addEventListener("click", function() {
                if (M.godSelected === -1 || M.slotSelected === -1) return;
                setGod(-1);
              });

              // 選択状態を分かりやすくする
              var style = document.createElement("style");
              style.textContent =
                ".templeGod.godSelected{" +
                "box-shadow:6px 6px 6px 2px #000;" +
                "background-position:0px 74px;" +
                "z-index:1000000001;" +
                "transform:scale(1.2)!important;" +
                "}";
              content.appendChild(style);
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
