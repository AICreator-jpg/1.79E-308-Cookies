(function() {
  var checkReady = setInterval(function() {
    if (typeof Game !== "undefined" && Game.ready) {
      clearInterval(checkReady);

      var STORAGE_KEY = "Automatic_Cookie_MySettings";

      /* =========================
         設定
         ========================= */

      var settings = {
        click: true,
        golden: true,
        reindeer: true,
        fortune: true,
        buildings: true,
        upgrades: true,
        elderPledge: true,
        dragonOrbs: true
      };

      /* =========================
         設定読み込み
         ========================= */

      function loadSettings() {
        try {
          var data = localStorage.getItem(STORAGE_KEY);

          if (data) {
            var parsed = JSON.parse(data);

            if (parsed) {
              if (typeof parsed.click === "boolean") {
                settings.click = parsed.click;
              }

              if (typeof parsed.golden === "boolean") {
                settings.golden = parsed.golden;
              }

              if (typeof parsed.reindeer === "boolean") {
                settings.reindeer = parsed.reindeer;
              }

              if (typeof parsed.fortune === "boolean") {
                settings.fortune = parsed.fortune;
              }

              if (typeof parsed.buildings === "boolean") {
                settings.buildings = parsed.buildings;
              }

              if (typeof parsed.upgrades === "boolean") {
                settings.upgrades = parsed.upgrades;
              }

              if (typeof parsed.elderPledge === "boolean") {
                settings.elderPledge = parsed.elderPledge;
              }

              if (typeof parsed.dragonOrbs === "boolean") {
                settings.dragonOrbs = parsed.dragonOrbs;
              }
            }
          }
        } catch (e) {}
      }

      /* =========================
         設定保存
         ========================= */

      function saveSettings() {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(settings)
          );
        } catch (e) {}
      }

      loadSettings();

      /* =========================
         マイセッティング
         ========================= */

      function createMySettings() {
        var old = document.getElementById("automatic-cookie-settings");

        if (old) {
          old.remove();
        }

        var box = document.createElement("div");

        box.id = "automatic-cookie-settings";

        box.style.cssText =
          "background:#222;" +
          "color:#fff;" +
          "padding:10px;" +
          "margin-bottom:10px;" +
          "border:1px solid #777;" +
          "border-radius:6px;";

        box.innerHTML =
          '<div style="font-size:16px;font-weight:bold;margin-bottom:8px;">' +
          'マイセッティング' +
          '</div>' +

          '<label style="display:block;margin:4px 0;">' +
          '<input type="checkbox" id="acs-click"> 連打' +
          '</label>' +

          '<label style="display:block;margin:4px 0;">' +
          '<input type="checkbox" id="acs-golden"> 金クッキー' +
          '</label>' +

          '<label style="display:block;margin:4px 0;">' +
          '<input type="checkbox" id="acs-reindeer"> トナカイ' +
          '</label>' +

          '<label style="display:block;margin:4px 0;">' +
          '<input type="checkbox" id="acs-fortune"> フォーチュン' +
          '</label>' +

          '<label style="display:block;margin:4px 0;">' +
          '<input type="checkbox" id="acs-buildings"> 施設（効率）' +
          '</label>' +

          '<label style="display:block;margin:4px 0;">' +
          '<input type="checkbox" id="acs-upgrades"> 改良' +
          '</label>' +

          '<label style="display:block;margin:4px 0;">' +
          '<input type="checkbox" id="acs-elder"> 自動誓約' +
          '</label>' +

          '<label style="display:block;margin:4px 0;">' +
          '<input type="checkbox" id="acs-dragon"> ドラゴンオーブ' +
          '</label>' +

          '<div style="margin-top:8px;font-size:11px;color:#ccc;">' +
          '設定は自動的に保存されます。' +
          '</div>';

        return box;
      }

      function setupMySettings() {
        if (!Game.customOptionsMenu) {
          Game.customOptionsMenu = [];
        }

        /*
         * オプションの一番上に追加
         */
        Game.customOptionsMenu.unshift(function() {
          var box = createMySettings();

          var click =
            box.querySelector("#acs-click");

          var golden =
            box.querySelector("#acs-golden");

          var reindeer =
            box.querySelector("#acs-reindeer");

          var fortune =
            box.querySelector("#acs-fortune");

          var buildings =
            box.querySelector("#acs-buildings");

          var upgrades =
            box.querySelector("#acs-upgrades");

          var elder =
            box.querySelector("#acs-elder");

          var dragon =
            box.querySelector("#acs-dragon");

          click.checked = settings.click;
          golden.checked = settings.golden;
          reindeer.checked = settings.reindeer;
          fortune.checked = settings.fortune;
          buildings.checked = settings.buildings;
          upgrades.checked = settings.upgrades;
          elder.checked = settings.elderPledge;
          dragon.checked = settings.dragonOrbs;

          click.onchange = function() {
            settings.click = this.checked;
            saveSettings();
          };

          golden.onchange = function() {
            settings.golden = this.checked;
            saveSettings();
          };

          reindeer.onchange = function() {
            settings.reindeer = this.checked;
            saveSettings();
          };

          fortune.onchange = function() {
            settings.fortune = this.checked;
            saveSettings();
          };

          buildings.onchange = function() {
            settings.buildings = this.checked;
            saveSettings();
          };

          upgrades.onchange = function() {
            settings.upgrades = this.checked;
            saveSettings();
          };

          elder.onchange = function() {
            settings.elderPledge = this.checked;
            saveSettings();
          };

          dragon.onchange = function() {
            settings.dragonOrbs = this.checked;
            saveSettings();
          };

          return box.outerHTML;
        });
      }

      setupMySettings();

      /* =========================
         MOD本体
         ========================= */

      var modObject = {
        id: 'Automatic_Cookie',
        name: 'Automatic_Cookie',

        init: function() {

          /* =========================
             ドラゴンオーブ処理
             ========================= */

          try {
            for (var i in Game.Objects) {
              var obj = Game.Objects[i];

              if (
                obj &&
                typeof obj.sell === "function" &&
                !obj.originalSell
              ) {
                obj.originalSell = obj.sell;

                obj.sell = function(num) {
                  var lastAmount = this.amount;
                  var res = this.originalSell(num);

                  try {
                    if (
                      settings.dragonOrbs &&
                      this.amount < lastAmount
                    ) {
                      var isOrb = false;

                      if (Game.hasAura) {
                        isOrb = Game.hasAura("Dragon Orbs");
                      } else if (
                        Game.dragonAura === 19 ||
                        Game.dragonAura2 === 19
                      ) {
                        isOrb = true;
                      }

                      if (isOrb) {
                        var highest = null;

                        for (var iObj in Game.Objects) {
                          if (
                            Game.Objects[iObj].amount > 0
                          ) {
                            highest = Game.Objects[iObj];
                          }
                        }

                        if (
                          highest &&
                          this.name === highest.name
                        ) {
                          var hasForbiddenBuff = false;

                          if (Game.buffs) {
                            for (
                              var bId in Game.buffs
                            ) {
                              var bObj = Game.buffs[bId];

                              if (bObj) {
                                var isGozamok =
                                  (
                                    bId === "Devastation" ||
                                    bObj.name === "Devastation" ||
                                    (
                                      bObj.type &&
                                      bObj.type.name ===
                                      "Devastation"
                                    )
                                  );

                                var isRedDebuff =
                                  (
                                    bObj.type &&
                                    bObj.type.deb &&
                                    (
                                      bObj.type.name === "Clot" ||
                                      bObj.name === "Clot"
                                    )
                                  );

                                var isMagic =
                                  (
                                    bObj.name.includes("storm") ||
                                    bObj.name.includes("Everything") ||
                                    bObj.name.includes("Egg")
                                  );

                                var isGiftLimit =
                                  (
                                    bObj.name === "Gift limit" ||
                                    bId === "Gift limit"
                                  );

                                if (
                                  !isGozamok &&
                                  !isRedDebuff &&
                                  !isMagic &&
                                  !isGiftLimit
                                ) {
                                  hasForbiddenBuff = true;
                                  break;
                                }
                              }
                            }
                          }

                          if (!hasForbiddenBuff) {
                            var noCookie =
                              (
                                !Game.shimmers ||
                                Game.shimmers.length === 0
                              );

                            if (
                              noCookie &&
                              Math.random() < 0.1
                            ) {
                              new Game.shimmer(
                                "golden",
                                "item"
                              );

                              var orbIconPosition =
                                new Array(33, 25);

                              Game.Notify(
                                "ドラゴンオーブ",
                                "願いが叶い黄金クッキーが出現。",
                                orbIconPosition,
                                1
                              );
                            }
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

          /* =========================
             自動処理
             ========================= */

          setInterval(function() {
            if (
              typeof Game === "undefined" ||
              !Game.ready
            ) {
              return;
            }

            /* 連打 */

            if (
              settings.click &&
              Game.ClickCookie
            ) {
              Game.ClickCookie();

              if (
                Game.mouseDown !== undefined
              ) {
                Game.mouseDown = 0;
              }
            }

            /* 施設（効率） */

            if (
              settings.buildings &&
              Game.ObjectsById
            ) {
              var boughtAnything = false;

              while (true) {
                var bO = null;
                var bS = -1;

                for (
                  var i = 0;
                  i < Game.ObjectsById.length;
                  i++
                ) {
                  var o = Game.ObjectsById[i];

                  if (!o) {
                    continue;
                  }

                  var p = o.getPrice();

                  var c =
                    o.storedCps ?
                    o.storedCps :
                    (
                      typeof o.cps === "function" ?
                      o.cps(o) :
                      (o.cps || 0)
                    );

                  if (
                    p > 0 &&
                    c >= 0 &&
                    (c / p) > bS
                  ) {
                    bS = c / p;
                    bO = o;
                  }
                }

                if (
                  bO &&
                  Game.cookies >= bO.getPrice()
                ) {
                  bO.buy(1);
                  boughtAnything = true;
                } else {
                  break;
                }
              }

              if (boughtAnything) {
                Game.recalculateGains = 1;

                if (Game.draw) {
                  Game.UpdateMenu();
                }
              }
            }

          }, 16);

          /* =========================
             金クッキー・トナカイ・
             フォーチュン・改良・自動誓約
             ========================= */

          setInterval(function() {
            if (
              typeof Game === "undefined" ||
              !Game.ready
            ) {
              return;
            }

            /* 金クッキー・トナカイ */

            if (
              Game.shimmers &&
              Game.shimmers.length > 0
            ) {
              for (
                var i = Game.shimmers.length - 1;
                i >= 0;
                i--
              ) {
                var sh = Game.shimmers[i];

                if (
                  sh.type === "golden" &&
                  settings.golden
                ) {
                  sh.pop();
                }

                if (
                  sh.type === "reindeer" &&
                  settings.reindeer
                ) {
                  sh.pop();
                }
              }
            }

            /* フォーチュン */

            if (settings.fortune) {
              var tk =
                document.getElementById(
                  "commentsText1"
                );

              if (
                tk &&
                (/fortune|幸運/i.test(
                  tk.innerHTML
                ))
              ) {
                try {
                  var ev = new MouseEvent(
                    "click",
                    {
                      bubbles: true,
                      cancelable: true,
                      view: window
                    }
                  );

                  tk.dispatchEvent(ev);
                } catch(err) {
                  if (Game.TickerClick) {
                    Game.TickerClick();
                  }
                }
              }
            }

            /* 改良 */

            if (
              settings.upgrades &&
              Game.UpgradesInStore
            ) {
              for (
                var j = 0;
                j < Game.UpgradesInStore.length;
                j++
              ) {
                var u =
                  Game.UpgradesInStore[j];

                if (!u) {
                  continue;
                }

                if (
                  u.pool == "tech" ||
                  u.pool == "toggle" ||
                  u.id == 64 ||
                  u.id == 65 ||
                  u.id == 66 ||
                  u.id == 67 ||
                  u.id == 68 ||
                  (
                    u.id >= 222 &&
                    u.id <= 229
                  )
                ) {
                  continue;
                }

                if (
                  Game.cookies >=
                  u.getPrice()
                ) {
                  u.buy();
                  break;
                }
              }
            }

            /* =========================
               自動誓約
               
               エルダー協定取得済みの場合のみ
               ========================= */

            if (
              settings.elderPledge &&
              Game.Upgrades
            ) {
              var elderCovenant =
                Game.Upgrades["Elder Covenant"];

              var elderPledge =
                Game.Upgrades["Elder Pledge"];

              var covenantBought = false;

              if (elderCovenant) {
                if (
                  typeof Game.Has === "function" &&
                  Game.Has("Elder Covenant")
                ) {
                  covenantBought = true;
                } else if (
                  elderCovenant.bought
                ) {
                  covenantBought = true;
                }
              }

              if (
                covenantBought &&
                Game.pledgeT === 0 &&
                elderPledge &&
                elderPledge.pool === "toggle" &&
                Game.cookies >=
                elderPledge.getPrice()
              ) {
                elderPledge.buy();
              }
            }

          }, 500);

        },

        save: function() {
          return "https://github.io";
        },

        load: function(str) {}
      };

      Game.registerMod(
        'Automatic_Cookie',
        modObject
      );
    }
  }, 1000);
})();
