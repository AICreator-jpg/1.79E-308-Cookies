(function () {
    'use strict';

    console.log('[FtHoF Planner] loading...');

    var FtHoFPlanner = {

        isOpen: false,

        // プランナー設定パネルの開閉状態
        settingsOpen: true,

        // バックファイア率設定
        settings: {
            supremeIntellect: false,
            realityBending: false,
            diminishIneptitude: false,
            diminishIneptitudeBackfire: false,
            dragonflight: false
        },

        // ハイライト設定
        // 初期ON：クリックフィーバー、施設特殊効果、エルダーフィーバー、無料の砂糖玉
        highlightSettings: {
            'Frenzy': false,
            'Lucky': false,
            'Click Frenzy': true,
            'Cookie Storm': false,
            'Building Special': true,
            'Cookie Storm Drop': false,
            'Free Sugar Lump': true,
            'Clot': false,
            'Ruin Cookies': false,
            'Cursed Finger': false,
            'Elder Frenzy': true,
            'Blab': false
        },

        // 各行の詳細表示状態をUpdateMenu再構築後も保持
        expandedRows: {},

        // 今回の予測で使った乱数
        randomLog: [],


        /*
         * Grimoire取得
         */
        getGrimoire: function () {
            var wizardTower = Game.Objects['Wizard tower'];

            if (!wizardTower || !wizardTower.minigame) {
                return null;
            }

            return wizardTower.minigame;
        },


        /*
         * 総スペル回数
         */
        getSpellsCastTotal: function () {
            var M = this.getGrimoire();

            if (!M) return '--';

            return M.spellsCastTotal || 0;
        },


        /*
         * Seed
         */
        getSeed: function () {
            return Game.seed || '--';
        },


        /*
         * バックファイア率
         *
         * v2.058 の FtHoF に合わせ、設定した倍率は「基本15%」へ
         * 適用し、その後に画面上のGC/WCによる +15%/個を加算する。
         *
         * Supreme Intellect + Reality Bending の組み合わせは
         * 本家FtHoF Planner v6系の設定と同じく 1.11倍として扱う。
         */
        getFailChance: function () {

            var base = 0.15;

            if (this.settings.supremeIntellect && this.settings.realityBending) {
                base *= 1.11;
            } else if (this.settings.supremeIntellect) {
                base *= 1.10;
            } else if (this.settings.realityBending) {
                base *= 1.01;
            }

            if (this.settings.diminishIneptitude) {
                base *= 0.1;
            }

            if (this.settings.diminishIneptitudeBackfire) {
                base *= 5;
            }

            var goldenCount = 0;

            if (Game.shimmerTypes && Game.shimmerTypes['golden']) {
                goldenCount = Game.shimmerTypes['golden'].n || 0;
            }

            return base + 0.15 * goldenCount;
        },


        /*
         * 設定に表示する「基本バックファイア率」
         * 画面上GC/WCの加算分を含まない。
         */
        getBaseFailChance: function () {

            var base = 0.15;

            if (this.settings.supremeIntellect && this.settings.realityBending) {
                base *= 1.11;
            } else if (this.settings.supremeIntellect) {
                base *= 1.10;
            } else if (this.settings.realityBending) {
                base *= 1.01;
            }

            if (this.settings.diminishIneptitude) {
                base *= 0.1;
            }

            if (this.settings.diminishIneptitudeBackfire) {
                base *= 5;
            }

            return base;
        },


        /*
         * 画面上のGC/WC数
         */
        getGoldenCount: function () {
            if (Game.shimmerTypes && Game.shimmerTypes['golden']) {
                return Game.shimmerTypes['golden'].n || 0;
            }
            return 0;
        },


        /*
         * 本家 FtHoF Planner v6b 日本語版に合わせた表示名
         * 内部処理では英語名を維持し、表示時だけ日本語化する。
         */
        translateEffect: function (effect) {

            var dict = {
                'Frenzy': 'フィーバー',
                'Lucky': 'ラッキー！',
                'Click Frenzy': 'クリックフィーバー',
                'Cookie Storm': 'クッキー乱舞',
                'Building Special': '施設特殊効果',
                'Cookie Storm Drop': 'クッキー乱舞の雫',
                'Free Sugar Lump': '無料の砂糖玉',
                'Clot': '障害発生',
                'Ruin Cookies': '台無し！',
                'Cursed Finger': '呪われた指',
                'Elder Frenzy': 'エルダーフィーバー',
                'Blab': 'おしゃべり'
            };

            return dict[effect] || effect;
        },


        /*
         * ハイライト設定された効果が反対側に出た場合の略称
         */
        getHighlightAbbreviation: function (effect) {

            var dict = {
                'Frenzy': 'Fr',
                'Lucky': 'Lu',
                'Click Frenzy': 'Cf',
                'Cookie Storm': '乱舞',
                'Building Special': 'Bs',
                'Cookie Storm Drop': '雫',
                'Free Sugar Lump': '砂糖',
                'Clot': '停滞',
                'Ruin Cookies': '台無',
                'Cursed Finger': '呪指',
                'Elder Frenzy': 'Ef',
                'Blab': '喋る'
            };

            return dict[effect] || '';
        },


        /*
         * 乱数を取得すると同時に記録する
         */
        random: function (label) {

            var value = Math.random();

            this.randomLog.push({
                label: label,
                value: value
            });

            return value;
        },


        /*
         * FtHoF予測
         */
        forecastAt: function (spellCount, forcedSuccess, season2) {

            var M = this.getGrimoire();

            if (!M) {
                return {
                    result: 'Grimoire unavailable'
                };
            }


            var spell = M.spells['hand of fate'];

            if (!spell) {
                return {
                    result: 'FtHoF unavailable'
                };
            }


            var failChance = this.getFailChance();


            /*
             * 前回の乱数ログを消去
             */
            var randomLog = [];

            function loggedRandom(label) {
                var value = Math.random();
                randomLog.push({
                    label: label,
                    value: value
                });
                return value;
            }


            /*
             * Cookie Clicker本体と同じSeed
             */
            Math.seedrandom(
                Game.seed + '/' + spellCount
            );


            /*
             * ==========================
             * Call 1
             * バックファイア判定
             * ==========================
             */
            var failRoll =
                loggedRandom('逆効果判定');


            var success =
                (typeof forcedSuccess === 'boolean') ?
                    forcedSuccess :
                    failRoll < (1 - failChance);


            /*
             * Golden/Wrath Cookie生成時に消費される乱数。
             * 本家Plannerと同じ乱数位置へ進めるために必要。
             */
            loggedRandom('GC/WC生成 1');
            loggedRandom('GC/WC生成 2');


            /*
             * シーズン2（バレンタイン / イースター /
             * ビジネスデー / ハロウィン）は
             * 本家PlannerのOne Change側として扱い、
             * 追加の乱数を1回消費する。
             */
            if (season2) {
                loggedRandom('シーズン2判定');
            }


            /*
             * ==========================
             * 成功時
             * ==========================
             */
            var choices = [];


            if (success) {

                choices.push(
                    'Frenzy',
                    'Lucky'
                );


                /*
                 * Dragonflight中は
                 * Click Frenzyなし
                 */
                if (!this.settings.dragonflight) {

                    choices.push(
                        'Click Frenzy'
                    );

                }


                /*
                 * 10% Cookie Storm
                 */
                var stormRoll =
                    loggedRandom(
                        'クッキー乱舞判定'
                    );


                if (stormRoll < 0.1) {

                    choices.push(
                        'Cookie Storm',
                        'Cookie Storm',
                        'Blab'
                    );

                }


                /*
                 * Building Special
                 */
                if (Game.BuildingsOwned >= 10) {

                    var buildingRoll =
                        loggedRandom(
                            '施設特殊効果判定'
                        );


                    if (buildingRoll < 0.25) {

                        choices.push(
                            'Building Special'
                        );

                    }

                }


                /*
                 * Cookie Storm Drop
                 */
                var stormDropRoll =
                    loggedRandom(
                        'クッキーストームドロップ判定'
                    );


                if (stormDropRoll < 0.15) {

                    choices = [
                        'Cookie Storm Drop'
                    ];

                }


                /*
                 * Free Sugar Lump
                 */
                var lumpRoll =
                    loggedRandom(
                        '無料の砂糖玉判定'
                    );


                if (lumpRoll < 0.0001) {

                    choices.push(
                        'Free Sugar Lump'
                    );

                }


            } else {

                /*
                 * ==========================
                 * バックファイア時
                 * ==========================
                 */

                choices.push(
                    'Clot',
                    'Ruin Cookies'
                );


                /*
                 * Cursed Finger / Elder Frenzy
                 */
                var curseRoll =
                    loggedRandom(
                        '呪われた指判定'
                    );


                if (curseRoll < 0.1) {

                    choices.push(
                        'Cursed Finger',
                        'Elder Frenzy'
                    );

                }


                /*
                 * Free Sugar Lump
                 */
                var lumpRollFail =
                    loggedRandom(
                        '無料の砂糖玉判定'
                    );


                if (lumpRollFail < 0.003) {

                    choices.push(
                        'Free Sugar Lump'
                    );

                }


                /*
                 * Blab
                 */
                var blabRoll =
                    loggedRandom(
                        'ブラブ判定'
                    );


                if (blabRoll < 0.1) {

                    choices = [
                        'Blab'
                    ];

                }

            }


            /*
             * ==========================
             * 最終候補選択
             * ==========================
             */
            var chooseRoll =
                loggedRandom(
                    '最終結果選択'
                );


            var chosenIndex =
                Math.floor(
                    chooseRoll * choices.length
                );


            var result =
                choices[chosenIndex];


            /*
             * 通常予測では、反対側の結果も同じspellCountで計算する。
             * forcedSuccessを指定した再帰呼び出しでは再計算しない。
             */
            var oppositeResult = null;

            if (typeof forcedSuccess !== 'boolean') {
                oppositeResult =
                    this.forecastAt(
                        spellCount,
                        !success,
                        season2
                    ).result;
            }





            /*
             * 元のMath.randomへ戻す
             */
            Math.seedrandom();


            return {

                spellCount: spellCount,

                seed: Game.seed,

                failChance: failChance,

                failRoll: failRoll,

                success: success,

                result: result,

                oppositeResult: oppositeResult,

                choices: choices,

                randomLog: randomLog.slice()

            };
        },


        /*
         * 次のFtHoFを予測
         */
        forecastNext: function () {
            var M = this.getGrimoire();
            if (!M) return { result: 'Grimoire unavailable' };
            var spell = M.spells['hand of fate'];
            if (!spell) return { result: 'FtHoF unavailable' };
            return this.forecastAt(M.spellsCastTotal);
        },


        /*
         * 次の10手を予測
         * 内部RNGは現在のspellsCastTotalから開始。
         * 表示上の呪文総回数は1手目を現在値+1とする。
         */
        forecastMany: function (count) {
            var M = this.getGrimoire();
            if (!M) return [];
            var startCount = M.spellsCastTotal;
            var forecasts = [];
            for (var i = 0; i < count; i++) {
                forecasts.push({
                    hand: i + 1,
                    displaySpellCount: startCount + i + 1,
                    forecast: this.forecastAt(startCount + i),
                    season2Forecast: this.forecastAt(startCount + i, undefined, true)
                });
            }
            return forecasts;
        },


        /*
         * Options更新
         */
        updateOptionsMenu: function () {

            var menu =
                document.getElementById('menu');

            if (!menu) return;


            /*
             * 開閉状態保存
             */
            var oldBody =
                document.getElementById(
                    'FtHoFPlannerBody'
                );

            if (oldBody) {

                this.isOpen =
                    oldBody.style.display !== 'none';

            }


            /*
             * 設定状態を保存
             */
            var oldSettings = document.getElementById('FtHoFPlannerSettingsBody');
            if (oldSettings) {
                var si = document.getElementById('FtHoFSettingSI');
                var rb = document.getElementById('FtHoFSettingRB');
                var di = document.getElementById('FtHoFSettingDI');
                var diBackfire = document.getElementById('FtHoFSettingDIBackfire');
                var df = document.getElementById('FtHoFSettingDragonflight');

                if (si) this.settings.supremeIntellect = si.checked;
                if (rb) this.settings.realityBending = rb.checked;
                if (di) this.settings.diminishIneptitude = di.checked;
                if (diBackfire) this.settings.diminishIneptitudeBackfire = diBackfire.checked;
                if (df) this.settings.dragonflight = df.checked;

                this.settingsOpen = oldSettings.style.display !== 'none';
            }

            /*
             * ハイライト設定のチェック状態を保存
             */
            var highlightEffects = [
                'Frenzy',
                'Lucky',
                'Click Frenzy',
                'Cookie Storm',
                'Building Special',
                'Cookie Storm Drop',
                'Free Sugar Lump',
                'Clot',
                'Ruin Cookies',
                'Cursed Finger',
                'Elder Frenzy',
                'Blab'
            ];

            for (var oldHighlightIndex = 0; oldHighlightIndex < highlightEffects.length; oldHighlightIndex++) {
                var oldHighlightEffect = highlightEffects[oldHighlightIndex];
                var oldHighlightId = 'FtHoFHighlight_' + oldHighlightEffect.replace(/[^a-zA-Z0-9]/g, '_');
                var oldHighlightCheckbox = document.getElementById(oldHighlightId);

                if (oldHighlightCheckbox) {
                    this.highlightSettings[oldHighlightEffect] = oldHighlightCheckbox.checked;
                }
            }

            /*
             * スクロール位置保存
             */
            var scrollTop =
                menu.scrollTop;


            /*
             * 古いPlannerの詳細表示状態を保存
             * Game.UpdateMenuは定期的にOptionsを再構築するため、
             * 開いている乱数詳細を再構築後も復元する。
             */
            var old =
                document.getElementById(
                    'FtHoFPlannerOptions'
                );

            if (old) {
                for (var oldIndex = 0; oldIndex < 10; oldIndex++) {
                    var oldDetail =
                        document.getElementById(
                            'FtHoFRandomRow' + oldIndex
                        );

                    this.expandedRows[oldIndex] = !!(
                        oldDetail &&
                        oldDetail.style.display !== 'none'
                    );
                }

                old.remove();
            }


            /*
             * 現在の情報
             */
            var spellsCast =
                this.getSpellsCastTotal();

            var seed =
                this.getSeed();


            /*
             * 次の10手を予測
             */
            var forecasts =
                this.forecastMany(10);


            /*
             * 選択された効果の次回出現位置を計算
             * シーズン1・シーズン2の両方を対象にする。
             */
            var highlightNext = {};

            for (var highlightEffect in this.highlightSettings) {
                if (!this.highlightSettings.hasOwnProperty(highlightEffect)) continue;
                if (!this.highlightSettings[highlightEffect]) continue;

                highlightNext[highlightEffect] = {
                    season1: null,
                    season2: null
                };

                for (var highlightIndex = 0; highlightIndex < forecasts.length; highlightIndex++) {
                    if (highlightNext[highlightEffect].season1 === null &&
                        forecasts[highlightIndex].forecast.result === highlightEffect) {
                        highlightNext[highlightEffect].season1 = forecasts[highlightIndex].hand;
                    }
                    if (highlightNext[highlightEffect].season2 === null &&
                        forecasts[highlightIndex].season2Forecast.result === highlightEffect) {
                        highlightNext[highlightEffect].season2 = forecasts[highlightIndex].hand;
                    }
                    if (highlightNext[highlightEffect].season1 !== null &&
                        highlightNext[highlightEffect].season2 !== null) {
                        break;
                    }
                }
            }

            /*
             * 10手一覧HTML
             */
            var rowsHTML = '';

            for (
                var i = 0;
                i < forecasts.length;
                i++
            ) {

                var item = forecasts[i];
                var f = item.forecast;

                var mainRandom =
                    f.randomLog && f.randomLog.length ?
                        f.randomLog[0].value :
                        0;

                var season1Forecast =
                    f;

                var season2Forecast =
                    item.season2Forecast;

                var season1Effect =
                    this.translateEffect(season1Forecast.result);

                var season2Effect =
                    this.translateEffect(season2Forecast.result);

                var season1OppositeAbbreviationHTML = '';

                if (this.highlightSettings[season1Forecast.oppositeResult]) {
                    var season1OppositeAbbreviation =
                        this.getHighlightAbbreviation(
                            season1Forecast.oppositeResult
                        );
                    if (season1OppositeAbbreviation) {
                        season1OppositeAbbreviationHTML =
                            '<span style="background:#e6d96a;">' +
                            '(' + season1OppositeAbbreviation + ')' +
                            '</span>';
                    }
                }

                var season2OppositeAbbreviationHTML = '';

                if (this.highlightSettings[season2Forecast.oppositeResult]) {
                    var season2OppositeAbbreviation =
                        this.getHighlightAbbreviation(
                            season2Forecast.oppositeResult
                        );
                    if (season2OppositeAbbreviation) {
                        season2OppositeAbbreviationHTML =
                            '<span style="background:#e6d96a;">' +
                            '(' + season2OppositeAbbreviation + ')' +
                            '</span>';
                    }
                }

                var season1HighlightStyle =
                    this.highlightSettings[season1Forecast.result] ?
                        'background:#e6d96a;' :
                        '';

                var season2HighlightStyle =
                    this.highlightSettings[season2Forecast.result] ?
                        'background:#e6d96a;' :
                        '';

                var season1ColorStyle =
                    season1Forecast.success ?
                        'color:#2e7d32;' :
                        'color:#c62828;';

                var season2ColorStyle =
                    season2Forecast.success ?
                        'color:#2e7d32;' :
                        'color:#c62828;';

                var season1OppositeColorStyle =
                    season1Forecast.success ?
                        'color:#c62828;' :
                        'color:#2e7d32;';

                var season2OppositeColorStyle =
                    season2Forecast.success ?
                        'color:#c62828;' :
                        'color:#2e7d32;';

                var detailHTML =
                    '<div style="margin:3px 0;">' +
                        '<b>シーズン1の反対側：</b> ' +
                        '<span style="' + season1OppositeColorStyle + 'font-weight:bold;">' +
                        this.translateEffect(season1Forecast.oppositeResult) +
                        '</span>' +
                    '</div>' +
                    '<div style="margin:3px 0;">' +
                        '<b>シーズン2の反対側：</b> ' +
                        '<span style="' + season2OppositeColorStyle + 'font-weight:bold;">' +
                        this.translateEffect(season2Forecast.oppositeResult) +
                        '</span>' +
                    '</div>';

                rowsHTML +=
                    '<tr style="cursor:pointer;" data-fthof-row="' + i + '">' +
                        '<td style="padding:5px 7px;white-space:nowrap;">' +
                            item.hand + '手目 / ' +
                            item.displaySpellCount + '回' +
                        '</td>' +
                        '<td style="padding:5px 7px;font-family:monospace;white-space:nowrap;">' +
                            mainRandom.toFixed(4) + '(' + this.getGoldenCount() + ')' +
                        '</td>' +
                        '<td style="padding:5px 12px;min-width:190px;white-space:nowrap;' + season1HighlightStyle + season1ColorStyle + '">' +
                            '<b>' + season1Effect + season1OppositeAbbreviationHTML + '</b>' +
                        '</td>' +
                        '<td style="padding:5px 12px;min-width:190px;white-space:nowrap;' + season2HighlightStyle + season2ColorStyle + '">' +
                            '<b>' + season2Effect + season2OppositeAbbreviationHTML + '</b>' +
                        '</td>' +
                    '</tr>' +
                    '<tr id="FtHoFRandomRow' + i + '" style="display:' + (this.expandedRows[i] ? '' : 'none') + ';">' +
                        '<td colspan="4" style="padding:4px 7px 8px 20px;">' +
                            '<div style="font-size:12px;font-family:monospace;">' +
                                detailHTML +
                            '</div>' +
                        '</td>' +
                    '</tr>';
            }

            if (!rowsHTML) {
                rowsHTML =
                    '<tr><td colspan="4">予測データなし</td></tr>';
            }

            /*
             * Planner
             */
            var section =
                document.createElement('div');

            section.id =
                'FtHoFPlannerOptions';

            section.className =
                'listing';


            section.innerHTML =

                '<div class="title" ' +
                    'id="FtHoFPlannerTitle" ' +
                    'style="cursor:pointer;">' +

                    'FtHoF Planner ' +

                    '<span id="FtHoFPlannerToggle">' +
                        (this.isOpen ? '−' : '+') +
                    '</span>' +

                '</div>' +

                '<div class="listing" style="margin-top:4px;">' +
                    '<div id="FtHoFPlannerSettingsTitle" style="cursor:pointer;font-weight:bold;">' +
                        'プランナー設定 ' +
                        '<span id="FtHoFPlannerSettingsToggle">' +
                            (this.settingsOpen ? '−' : '+') +
                        '</span>' +
                    '</div>' +
                    '<div id="FtHoFPlannerSettingsBody" style="display:' +
                        (this.settingsOpen ? '' : 'none') +
                    ';margin-top:8px;">' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingSI" ' +
                            (this.settings.supremeIntellect ? 'checked' : '') +
                            '> 最高峰の知性（バックファイア率1.1倍）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingRB" ' +
                            (this.settings.realityBending ? 'checked' : '') +
                            '> 現実の湾曲（バックファイア率1.01倍）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingDI" ' +
                            (this.settings.diminishIneptitude ? 'checked' : '') +
                            '> 愚劣の減少（バックファイア率0.1倍）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingDIBackfire" ' +
                            (this.settings.diminishIneptitudeBackfire ? 'checked' : '') +
                            '> 愚劣の増大（バックファイア率5倍）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingDragonflight" ' +
                            (this.settings.dragonflight ? 'checked' : '') +
                            '> ドラゴンフライト（クリックフィーバーがラッキー等になる）' +
                        '</label>' +
                        '<div style="margin-top:8px;font-size:12px;opacity:0.85;">' +
                            '基本バックファイア率：<b>' +
                            (this.getBaseFailChance() * 100).toFixed(2) +
                            '%</b><br>' +
                            '画面上のGC/WC：<b>' +
                            this.getGoldenCount() +
                            '</b>個 → 現在のバックファイア率：<b>' +
                            (this.getFailChance() * 100).toFixed(2) +
                            '%</b>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="listing" style="margin-top:4px;">' +
                    '<div id="FtHoFPlannerHighlightTitle" style="cursor:pointer;font-weight:bold;">' +
                        'ハイライト設定 ' +
                        '<span id="FtHoFPlannerHighlightToggle">−</span>' +
                    '</div>' +
                    '<div id="FtHoFPlannerHighlightBody" style="margin-top:8px;">' +
                        '<div style="font-size:12px;opacity:0.85;margin-bottom:6px;">' +
                            '選択した効果を表の中で黄色にハイライトします。右側に次に出る手を表示します。' +
                        '</div>' +
                        (function () {
                            var html = '';
                            var effects = [
                                'Frenzy',
                                'Lucky',
                                'Click Frenzy',
                                'Cookie Storm',
                                'Building Special',
                                'Cookie Storm Drop',
                                'Free Sugar Lump',
                                'Clot',
                                'Ruin Cookies',
                                'Cursed Finger',
                                'Elder Frenzy',
                                'Blab'
                            ];

                            for (var highlightIndex = 0; highlightIndex < effects.length; highlightIndex++) {
                                var effect = effects[highlightIndex];
                                var id = 'FtHoFHighlight_' + effect.replace(/[^a-zA-Z0-9]/g, '_');
                                var nextText =
                                    highlightNext[effect] ?
                                        ((highlightNext[effect].season1 !== null ?
                                            'S1：' + highlightNext[effect].season1 + '手目' :
                                            'S1：10手以内なし') +
                                         ' / ' +
                                         (highlightNext[effect].season2 !== null ?
                                            'S2：' + highlightNext[effect].season2 + '手目' :
                                            'S2：10手以内なし')) :
                                        'S1：10手以内なし / S2：10手以内なし';

                                html +=
                                    '<label style="display:flex;align-items:center;margin:4px 0;">' +
                                        '<input type="checkbox" id="' + id + '" ' +
                                            (this.highlightSettings[effect] ? 'checked' : '') +
                                        '>' +
                                        '<span style="margin-left:4px;">' +
                                            this.translateEffect(effect) +
                                        '</span>' +
                                        '<span style="margin-left:auto;font-size:12px;opacity:0.8;">' +
                                            '次回：' + nextText +
                                        '</span>' +
                                    '</label>';
                            }

                            return html;
                        }).call(this) +
                    '</div>' +
                '</div>' +

                '<div id="FtHoFPlannerBody" ' +
                    'style="display:' +
                        (this.isOpen ? '' : 'none') +
                    ';">' +

                    '<div class="listing">' +
                        '<b>抗えぬ運命の手</b>' +
                        '<br><br>' +
                        '<b>総スペル回数：</b>' +
                        spellsCast +
                        '<br>' +
                        '<b>シード：</b>' +
                        seed +
                    '</div>' +

                    '<div class="listing">' +
                        '<b>次の10手</b>' +
                        '<br><br>' +
                        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
                            '<thead>' +
                                '<tr>' +
                                    '<th style="text-align:left;padding:5px 7px;">手数 / 呪文総回数</th>' +
                                    '<th style="text-align:left;padding:5px 7px;white-space:nowrap;">乱数</th>' +
                                    '<th style="text-align:left;padding:5px 12px;min-width:190px;white-space:nowrap;">シーズン1</th>' +
                                    '<th style="text-align:left;padding:5px 12px;min-width:190px;white-space:nowrap;">シーズン2</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                                rowsHTML +
                            '</tbody>' +
                        '</table>' +
                        '<br>' +
                        '<small style="opacity:0.7;">行をタップすると、シーズン1・シーズン2それぞれの反対側の結果を表示します。</small>' +
                    '</div>' +
                '</div>';

            /*
             * Options末尾へ追加
             */
            menu.appendChild(section);


            /*
             * 開閉処理
             */
            var title =
                document.getElementById(
                    'FtHoFPlannerTitle'
                );

            var body =
                document.getElementById(
                    'FtHoFPlannerBody'
                );

            var toggle =
                document.getElementById(
                    'FtHoFPlannerToggle'
                );


            if (title && body && toggle) {

                title.onclick =
                    function () {

                        if (
                            body.style.display ===
                            'none'
                        ) {

                            body.style.display = '';

                            toggle.textContent = '−';

                            FtHoFPlanner.isOpen = true;

                        } else {

                            body.style.display = 'none';

                            toggle.textContent = '+';

                            FtHoFPlanner.isOpen = false;

                        }

                    };

            }


            /*
             * プランナー設定の開閉
             */
            var settingsTitle = document.getElementById('FtHoFPlannerSettingsTitle');
            var settingsBody = document.getElementById('FtHoFPlannerSettingsBody');
            var settingsToggle = document.getElementById('FtHoFPlannerSettingsToggle');

            if (settingsTitle && settingsBody && settingsToggle) {
                settingsTitle.onclick = function () {
                    if (settingsBody.style.display === 'none') {
                        settingsBody.style.display = '';
                        settingsToggle.textContent = '−';
                        FtHoFPlanner.settingsOpen = true;
                    } else {
                        settingsBody.style.display = 'none';
                        settingsToggle.textContent = '+';
                        FtHoFPlanner.settingsOpen = false;
                    }
                };
            }

            /*
             * ハイライト設定の開閉
             */
            var highlightTitle = document.getElementById('FtHoFPlannerHighlightTitle');
            var highlightBody = document.getElementById('FtHoFPlannerHighlightBody');
            var highlightToggle = document.getElementById('FtHoFPlannerHighlightToggle');

            if (highlightTitle && highlightBody && highlightToggle) {
                highlightTitle.onclick = function () {
                    if (highlightBody.style.display === 'none') {
                        highlightBody.style.display = '';
                        highlightToggle.textContent = '−';
                    } else {
                        highlightBody.style.display = 'none';
                        highlightToggle.textContent = '+';
                    }
                };
            }

            /*
             * ハイライト設定変更時は予測を即時更新
             */
            for (var highlightSettingIndex = 0; highlightSettingIndex < highlightEffects.length; highlightSettingIndex++) {
                (function (effect) {
                    var id = 'FtHoFHighlight_' + effect.replace(/[^a-zA-Z0-9]/g, '_');
                    var checkbox = document.getElementById(id);

                    if (!checkbox) return;

                    checkbox.onchange = function () {
                        FtHoFPlanner.highlightSettings[effect] = checkbox.checked;
                        FtHoFPlanner.updateOptionsMenu();
                    };
                })(highlightEffects[highlightSettingIndex]);
            }

            /*
             * バックファイア設定変更時は予測を即時更新
             */
            var settingIds = [
                'FtHoFSettingSI',
                'FtHoFSettingRB',
                'FtHoFSettingDI',
                'FtHoFSettingDIBackfire',
                'FtHoFSettingDragonflight'
            ];

            for (var settingIndex = 0; settingIndex < settingIds.length; settingIndex++) {
                (function (id) {
                    var checkbox = document.getElementById(id);
                    if (!checkbox) return;
                    checkbox.onchange = function () {
                        FtHoFPlanner.settings.supremeIntellect = document.getElementById('FtHoFSettingSI').checked;
                        FtHoFPlanner.settings.realityBending = document.getElementById('FtHoFSettingRB').checked;
                        FtHoFPlanner.settings.diminishIneptitude = document.getElementById('FtHoFSettingDI').checked;
                        FtHoFPlanner.settings.diminishIneptitudeBackfire = document.getElementById('FtHoFSettingDIBackfire').checked;
                        FtHoFPlanner.settings.dragonflight = document.getElementById('FtHoFSettingDragonflight').checked;
                        FtHoFPlanner.updateOptionsMenu();
                    };
                })(settingIds[settingIndex]);
            }


            /*
             * 各行のクリックで乱数詳細を開閉
             */
            for (var rowIndex = 0; rowIndex < forecasts.length; rowIndex++) {
                (function (index) {
                    var row =
                        section.querySelector(
                            '[data-fthof-row="' + index + '"]'
                        );

                    var randomRow =
                        document.getElementById(
                            'FtHoFRandomRow' + index
                        );

                    if (row && randomRow) {
                        row.onclick = function () {
                            if (randomRow.style.display === 'none') {
                                randomRow.style.display = '';
                                FtHoFPlanner.expandedRows[index] = true;
                            } else {
                                randomRow.style.display = 'none';
                                FtHoFPlanner.expandedRows[index] = false;
                            }
                        };
                    }
                })(rowIndex);
            }


            /*
             * スクロール位置復元
             */
            menu.scrollTop =
                scrollTop;


            console.log(
                '[FtHoF Planner] forecasts:',
                forecasts
            );
        }
    };


    /*
     * 元のGame.UpdateMenuを保存
     */
    var originalUpdateMenu =
        Game.UpdateMenu;


    /*
     * Game.UpdateMenuを拡張
     */
    Game.UpdateMenu =
        function () {

            /*
             * 本来の処理
             */
            originalUpdateMenu.apply(
                Game,
                arguments
            );


            /*
             * OptionsならPlanner更新
             */
            if (
                Game.onMenu === 'prefs'
            ) {

                FtHoFPlanner.updateOptionsMenu();

            }

        };


    /*
     * 読み込み確認
     */
    Game.Notify(
        'FtHoF Planner v0.1.4',
        'シーズン2予測と効果の色分けに対応しました。',
        [16, 5],
        3
    );


    console.log(
        '[FtHoF Planner] loaded'
    );

})();

